import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, token } = await req.json()

    // Validate token (in real app, check against database)
    if (!token) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get tenant configuration based on token
    const tenantConfig = await getTenantConfig(token)

    let systemPrompt = `You are ${tenantConfig.botName}, a helpful AI assistant.`

    // If RAG is enabled, add context from documents
    if (tenantConfig.ragEnabled) {
      const context = await getRelevantContext(messages[messages.length - 1].content, token)
      if (context) {
        systemPrompt += `\n\nUse the following context to answer questions when relevant:\n${context}`
      }
    }

    const result = streamText({
      model: openai("gpt-4-turbo"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

// Mock function to get tenant configuration
async function getTenantConfig(token: string) {
  // In real app, fetch from database
  return {
    botName: "AI Assistant",
    ragEnabled: true,
    primaryColor: "#3B82F6",
  }
}

// Mock function to get relevant context from documents
async function getRelevantContext(query: string, token: string) {
  // In real app, use vector search with ChromaDB
  const mockContext = `
  Business Hours: Monday to Friday, 9 AM to 6 PM EST
  Support Email: support@company.com
  Password Reset: Use the "Forgot Password" link on the login page
  `

  return mockContext
}
