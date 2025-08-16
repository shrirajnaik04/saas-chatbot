import { together, togetherModels } from "@/lib/together"
import { generateText } from "ai"
import { generateWithGemini, getGeminiModel } from "@/lib/gemini"
import { verifyEmbedToken } from "@/app/api/chatbot/init/route"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { searchTenantContext } from "@/lib/qdrant"

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

    // Default: Gemini, Fallback: Together
    let response = ""
    let provider = "gemini"
    let modelUsed = getGeminiModel()
    try {
      console.log(`🧪 Trying Gemini model: ${modelUsed}`)
      const g = await generateWithGemini(systemPrompt, userMessage, { maxTokens: 500, temperature: 0.7 })
      response = g.text
      modelUsed = g.model
    } catch (gemErr) {
      console.warn("⚠️ Gemini failed, falling back to Together. Reason:", gemErr)
      provider = "together"
      const chatModel = togetherModels['llama-3.1-8b']
      modelUsed = chatModel
      const result = await generateText({
        model: together(chatModel),
        system: systemPrompt,
        prompt: userMessage,
        maxTokens: 500,
        temperature: 0.7,
      })
      response = result.text?.trim() || "I'm sorry, I couldn't generate a response."
    }

    console.log('✅ Generated response:', response.substring(0, 100) + '...')
    console.log('🧠 LLM used:', { provider, model: modelUsed })

    // Save chat log to database
    try {
      await saveChatLog(decodedToken.tenantId, userMessage, response, ragUsed)
    } catch (logError) {
      console.error('❌ Error saving chat log:', logError)
      // Don't fail the response if logging fails
    }

  const body = { response, timestamp: new Date().toISOString() }
  const res = Response.json(body)
  res.headers.set('x-llm-provider', provider)
  res.headers.set('x-llm-model', modelUsed)
  return res

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
  // Default to true if undefined/null, but respect explicit false
  ragEnabled: tenant.ragEnabled === undefined || tenant.ragEnabled === null ? true : !!tenant.ragEnabled,
      primaryColor: tenant.config?.primaryColor || "#3B82F6",
    }
  } catch (error) {
    console.error("Error fetching tenant config:", error)
    return null
  }
}

// Get relevant context from Qdrant
async function getRelevantContext(query: string, tenantId: string) {
  try {
    const { results } = await searchTenantContext(tenantId, query, 5)
    const joined = results.map((r) => r.content).join("\n---\n")
    return joined || null
  } catch (e) {
    console.error("RAG context search error:", e)
    return null
  }
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
