import { QdrantClient } from "@qdrant/js-client-rest"

const QDRANT_URL = process.env.QDRANT_URL as string
const QDRANT_API_KEY = process.env.QDRANT_API_KEY as string
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY as string

// Embedding model info (Together AI - OpenAI compatible embeddings endpoint)
const EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5"
const EMBEDDING_DIM = 768 // Known dimension for nomic-embed-text-v1.5

export interface QdrantUpsertDoc {
  id: string
  content: string
  metadata: Record<string, any>
}

export function getQdrantClient() {
  if (!QDRANT_URL) {
    throw new Error("QDRANT_URL is not set")
  }
  // API key may be optional for local setups
  return new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })
}

// Also export a singleton client instance for simple use-cases
export const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })

export function getTenantCollectionName(tenantId: string) {
  return `tenant_${tenantId}_docs`
}

export async function ensureTenantCollection(tenantId: string) {
  const client = getQdrantClient()
  const collectionName = getTenantCollectionName(tenantId)

  try {
    await client.getCollection(collectionName)
    return collectionName
  } catch {
    // Create collection if it doesn't exist
    await client.createCollection(collectionName, {
      vectors: {
        size: EMBEDDING_DIM,
        distance: "Cosine",
      },
    })
    return collectionName
  }
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is required for embeddings")
  }

  const resp = await fetch("https://api.together.xyz/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  })

  if (!resp.ok) {
    const msg = await resp.text()
    throw new Error(`Embeddings request failed: ${resp.status} ${msg}`)
  }

  const data = await resp.json()
  // OpenAI-compatible response: data: [{ embedding: number[] }]
  return (data.data || []).map((d: any) => d.embedding as number[])
}

export async function upsertDocumentsToQdrant(
  tenantId: string,
  docs: QdrantUpsertDoc[],
): Promise<{ pointIds: (string | number)[] }> {
  const client = getQdrantClient()
  const collectionName = await ensureTenantCollection(tenantId)

  // Generate embeddings in one batch
  const texts = docs.map((d) => d.content)
  const vectors = await embedTexts(texts)

  // Build points payloads
  const points = docs.map((d, i) => ({
    id: d.id, // can be string
    vector: vectors[i],
    payload: {
      ...d.metadata,
      content: d.content,
      tenantId,
      source: d.metadata?.filename || "upload",
    },
  }))

  await client.upsert(collectionName, {
    wait: true,
    batch: {
      ids: points.map((p) => p.id),
      vectors: points.map((p) => p.vector),
      payloads: points.map((p) => p.payload),
    },
  })

  return { pointIds: points.map((p) => p.id) }
}

export async function searchTenantContext(
  tenantId: string,
  query: string,
  limit = 5,
): Promise<{ results: { content: string; score: number; payload: any }[] }> {
  const client = getQdrantClient()
  const collectionName = await ensureTenantCollection(tenantId)

  const [queryVector] = await embedTexts([query])

  const res = await client.search(collectionName, {
    vector: queryVector,
    limit,
    with_payload: true,
    with_vector: false,
  })

  const results = (res || []).map((r: any) => ({
    content: r.payload?.content as string,
    score: r.score as number,
    payload: r.payload,
  }))

  return { results }
}
