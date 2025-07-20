import { together, togetherModels } from "@/lib/together"
import { generateText } from "ai"
import { verifyEmbedToken } from "@/app/api/chatbot/init/route"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message, messages } = await req.json()

    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response("Unauthorized: Bearer token required", { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    const decodedToken = verifyEmbedToken(token)
    if (!decodedToken) {
      return new Response("Unauthorized: Invalid or expired token", { status: 401 })
    }

    // Get tenant configuration from database
    const tenantConfig = await getTenantConfig(decodedToken.tenantId)
    if (!tenantConfig) {
      return new Response("Tenant not found", { status: 404 })
    }

    // Handle both single message and conversation format
    const userMessage = message || (messages && messages[messages.length - 1]?.content) || ""
    if (!userMessage) {
      console.error('❌ No message provided:', { message, messages })
      return Response.json({ error: "No message provided" }, { status: 400 })
    }

    console.log('💬 Processing message:', userMessage)
    console.log('🔑 Tenant ID:', decodedToken.tenantId)

    let systemPrompt = `You are ${tenantConfig.botName || 'AI Assistant'}, a helpful AI assistant.`
    let ragUsed = false
    let context = null

    // If RAG is enabled, add context from documents
    if (tenantConfig.ragEnabled) {
      context = await getRelevantContext(userMessage, decodedToken.tenantId)
      if (context) {
        systemPrompt += `\n\nUse the following context to answer questions when relevant:\n${context}`
        ragUsed = true
      }
    }

    // For simple embed widget, use generateText
    const result = await generateText({
      model: together(togetherModels['llama-3.1-8b']),
      system: systemPrompt,
      prompt: userMessage,
      maxTokens: 500,
      temperature: 0.7,
    })

    const response = result.text?.trim() || "I'm sorry, I couldn't generate a response."

    console.log('✅ Generated response:', response.substring(0, 100) + '...')

    // Save chat log to database
    try {
      await saveChatLog(decodedToken.tenantId, userMessage, response, ragUsed)
    } catch (logError) {
      console.error('❌ Error saving chat log:', logError)
      // Don't fail the response if logging fails
    }

    return Response.json({ 
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Chat API error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Get tenant configuration from database
async function getTenantConfig(tenantId: string) {
  try {
    const db = await getDatabase()
    const tenant = await db.collection("tenants").findOne({ 
      _id: new ObjectId(tenantId) 
    })
    
    if (!tenant) return null
    
    return {
      botName: tenant.config?.botName || "AI Assistant",
      ragEnabled: tenant.ragEnabled || true,
      primaryColor: tenant.config?.primaryColor || "#3B82F6",
    }
  } catch (error) {
    console.error("Error fetching tenant config:", error)
    return null
  }
}

// Mock function to get relevant context from documents
async function getRelevantContext(query: string, tenantId: string) {
  // In real app, use vector search with ChromaDB filtered by tenantId
  const mockContext = `
  Business Hours: Monday to Friday, 9 AM to 6 PM EST
  Support Email: support@company.com
  Password Reset: Use the "Forgot Password" link on the login page
  `
  
  return mockContext
}

// Save chat log to database
async function saveChatLog(tenantId: string, message: string, response: string, ragUsed: boolean) {
  try {
    const db = await getDatabase()
    const chatLog = {
      tenantId: tenantId,
      message: message,
      response: response,
      timestamp: new Date(),
      ragUsed: ragUsed
    }
    
    await db.collection("chat_logs").insertOne(chatLog)
    console.log('💾 Chat log saved successfully')
  } catch (error) {
    console.error('❌ Error saving chat log:', error)
    throw error
  }
}
