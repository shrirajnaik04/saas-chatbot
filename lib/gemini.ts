export type GeminiOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
}

export function getGeminiModel(): string {
  const envChat = process.env.AI_CHAT_MODEL || process.env.AI_CHAT_MODEL_GEMINI
  return (envChat || "gemini-1.5-flash").trim()
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  opts: GeminiOptions = {},
): Promise<{ text: string; model: string }> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set")
  }
  const model = (opts.model || getGeminiModel()).trim()
  const temperature = opts.temperature ?? 0.7
  const maxTokens = opts.maxTokens ?? 500

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  const body = {
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt }],
    },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  let data: any
  if (!resp.ok) {
    const raw = await resp.text()
    try { data = JSON.parse(raw) } catch { data = raw }
    throw new Error(`Gemini generateContent failed: ${resp.status} ${
      typeof data === "string" ? data : JSON.stringify(data)
    }`)
  }
  data = await resp.json()
  const candidates = data?.candidates || []
  const parts = candidates[0]?.content?.parts || []
  const out = parts.map((p: any) => p?.text).filter(Boolean).join("")
  const result = (out || "").trim()
  if (!result) {
    throw new Error("Gemini returned empty response")
  }
  return { text: result, model }
}
