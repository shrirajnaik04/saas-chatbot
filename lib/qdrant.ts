import { QdrantClient } from "@qdrant/js-client-rest"
import { createHash } from "crypto"
import { getDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

const QDRANT_URL = process.env.QDRANT_URL as string
const QDRANT_API_KEY = process.env.QDRANT_API_KEY as string
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY as string

// Embedding model config
// - EMBEDDING_MODEL can specify a preferred model
// - EMBEDDING_CANDIDATES can be a comma-separated list to try in order
const EMBEDDING_MODEL = (process.env.EMBEDDING_MODEL || "").trim()
const EMBEDDING_CANDIDATES = (process.env.EMBEDDING_CANDIDATES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

export interface QdrantUpsertDoc {
  id: string
  content: string
  metadata: Record<string, any>
}

export function getQdrantClient() {
  if (!QDRANT_URL) {
    throw new Error("QDRANT_URL is not set")
  }
  return new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })
}

// Optional singleton
export const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY })

export function getTenantCollectionName(tenantId: string, dim?: number) {
  return dim ? `tenant_${tenantId}_docs_${dim}` : `tenant_${tenantId}_docs`
}

// Normalize a client name to lowercase with underscores
export function normalizeClientName(name: string): string {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_") // non-alphanumerics to underscore
    .replace(/^_+|_+$/g, "") // trim underscores
    .replace(/_{2,}/g, "_") // collapse multiple underscores
}

// Normalize resource type (fallback to 'docs')
export function normalizeResourceType(type: string): string {
  const t = (type || "docs")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
  return t || "docs"
}

// Build collection name using convention: tenant_<clientName>_<resourceType>_<dimension>
export function buildConventionalCollectionName(
  clientName: string,
  resourceType: string,
  dimension: number,
): string {
  const client = normalizeClientName(clientName)
  const resource = normalizeResourceType(resourceType)
  const dim = Number(dimension)
  if (!Number.isFinite(dim) || dim <= 0) {
    throw new Error(`Invalid dimension: ${dimension}`)
  }
  return `tenant_${client}_${resource}_${dim}`
}

// Ensure a collection exists that follows the naming convention.
// If it doesn't exist, create it with cosine distance and provided vector size.
export async function ensureCollectionByConvention(
  clientName: string,
  resourceType: string,
  dimension: number,
): Promise<string> {
  const client = getQdrantClient()
  const name = buildConventionalCollectionName(clientName, resourceType, dimension)
  try {
    await client.getCollection(name)
    console.log(`[qdrant] using existing collection: ${name}`)
    return name
  } catch {
    // not found -> create
  }
  await client.createCollection(name, {
    vectors: { size: Number(dimension), distance: "Cosine" },
  })
  console.log(`[qdrant] created collection: ${name}`)
  return name
}

/**
 * Convenience alias requested by spec.
 * Example: createCollection("JK CargoCare", "docs", 768) => "tenant_jkcargocare_docs_768"
 */
export async function createCollection(
  clientName: string,
  resourceType: string,
  dimension: number,
): Promise<string> {
  return ensureCollectionByConvention(clientName, resourceType, dimension)
}

// Ensure a collection exists that matches the desired dimension.
// Prefer suffixed name (with dim). Fall back to legacy name if present and size matches.
export async function ensureTenantCollection(tenantId: string, dim: number) {
  const client = getQdrantClient()
  const preferred = getTenantCollectionName(tenantId, dim)
  try {
    await client.getCollection(preferred)
    return preferred
  } catch {}

  const legacy = getTenantCollectionName(tenantId)
  try {
    const info: any = await client.getCollection(legacy)
    const size = info?.config?.params?.vectors?.size || info?.result?.config?.params?.vectors?.size
    if (typeof size === "number" && size === dim) {
      return legacy
    }
  } catch {}

  await client.createCollection(preferred, {
    vectors: { size: dim, distance: "Cosine" },
  })
  return preferred
}

// Convert arbitrary string to deterministic UUID (v5-like)
function toUuidFromString(input: string): string {
  const h = createHash("sha1").update(input).digest("hex")
  const s1 = h.slice(0, 8)
  const s2 = h.slice(8, 12)
  const s3num = (parseInt(h.slice(12, 16), 16) & 0x0fff) | 0x5000
  const s3 = s3num.toString(16).padStart(4, "0")
  const s4byte = (parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80
  const s4 = s4byte.toString(16).padStart(2, "0") + h.slice(18, 20)
  const s5 = h.slice(20, 32)
  return `${s1}-${s2}-${s3}-${s4}-${s5}`
}

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase().trim()
  const model = (process.env.AI_MODEL || "").trim()

  if (!provider) {
    throw new Error("AI_PROVIDER is required (gemini | together | openai)")
  }

  // Provider: Gemini
  if (provider === "gemini") {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required for Gemini embeddings")
    if (!model) throw new Error("AI_MODEL is required for Gemini embeddings (e.g., embedding-001)")

    // If multiple texts, use batch endpoint; otherwise, embed single content
    if (texts.length > 1) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${GEMINI_API_KEY}`
      const body = {
        requests: texts.map((t) => ({
          model: `models/${model}`,
          content: { parts: [{ text: t }] },
        })),
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const msg = await resp.text()
        throw new Error(`Gemini embeddings failed: ${resp.status} ${msg}`)
      }
  const data = await resp.json()
  console.log("[embeddings] provider=gemini model=", model)
      const embeds = (data?.embeddings || []).map((e: any) => e?.values || e?.embedding?.values)
      if (!embeds.length || !Array.isArray(embeds[0])) throw new Error("Invalid Gemini batch response")
      return embeds
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${GEMINI_API_KEY}`
      const body = {
        model: `models/${model}`,
        content: { parts: texts.map((t) => ({ text: t })) },
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const msg = await resp.text()
        throw new Error(`Gemini embeddings failed: ${resp.status} ${msg}`)
      }
  const data = await resp.json()
  console.log("[embeddings] provider=gemini model=", model)
      const values = data?.embedding?.values
      if (!Array.isArray(values)) throw new Error("Invalid Gemini response: missing embedding.values")
      return [values]
    }
  }

  // Provider: OpenAI
  if (provider === "openai") {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for OpenAI embeddings")
    const mdl = model || "text-embedding-3-small"
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: mdl, input: texts }),
    })
    if (!resp.ok) {
      const msg = await resp.text()
      throw new Error(`OpenAI embeddings failed: ${resp.status} ${msg}`)
    }
  const data = await resp.json()
  console.log("[embeddings] provider=openai model=", mdl)
    return (data?.data || []).map((d: any) => d?.embedding as number[])
  }

  // Provider: Together
  if (provider === "together") {
    const key = process.env.TOGETHER_API_KEY || TOGETHER_API_KEY
    if (!key) throw new Error("TOGETHER_API_KEY is required for Together embeddings")

    // Optional model discovery to bias toward available models
    let available: string[] = []
    try {
      const modelsResp = await fetch("https://api.together.xyz/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        method: "GET",
      })
      if (modelsResp.ok) {
        const modelsData = await modelsResp.json()
        const ids: string[] = (modelsData?.data || []).map((m: any) => m?.id).filter(Boolean)
        available = ids.filter((id) => /embed|retrieval/i.test(id))
      }
    } catch {}

    const envPrimary = model || (process.env.EMBEDDING_MODEL || "").trim()
    const envCandidates = (process.env.EMBEDDING_CANDIDATES || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const preferences = [
      // Stable Together-hosted models
      "BAAI/bge-base-en-v1.5",
      "jinaai/jina-embeddings-v2-base-en",
      envPrimary,
      ...envCandidates,
      "BAAI/bge-small-en-v1.5",
      "BAAI/bge-large-en-v1.5",
      "togethercomputer/m2-bert-80M-8k-retrieval",
      "intfloat/e5-base-v2",
      "nomic-ai/nomic-embed-text-v1.5",
    ].filter(Boolean)
    const preferredAvailable = preferences.filter((m) => available.includes(m))
    const exploratory = available.filter((m) => !preferredAvailable.includes(m))
    const candidates = [...preferredAvailable, ...exploratory, ...preferences]

    let lastErr: any
    for (const mdl of candidates) {
      const resp = await fetch("https://api.together.xyz/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model: mdl, input: texts }),
      })

      if (!resp.ok) {
        const msg = await resp.text()
        if (
          resp.status === 404 ||
          /model_not_available|Unable to access model|not found/i.test(msg)
        ) {
          lastErr = `Model not available: ${mdl}. ${msg}`
          continue
        }
        if (resp.status === 401 || resp.status === 403) {
          throw new Error(`Together embeddings auth failed (${resp.status}). ${msg}`)
        }
        throw new Error(`Together embeddings failed: ${resp.status} ${msg}`)
      }
  const data = await resp.json()
  console.log("[embeddings] provider=together model=", mdl)
      if (!Array.isArray(data?.data)) {
        lastErr = `Unexpected Together response for ${mdl}: ${JSON.stringify(data).slice(0, 400)}`
        continue
      }
      return data.data.map((d: any) => d.embedding as number[])
    }
    throw new Error(lastErr || "Together embeddings failed for all candidate models")
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use gemini | together | openai`)
}

export async function upsertDocumentsToQdrant(
  tenantId: string,
  docs: QdrantUpsertDoc[],
): Promise<{ pointIds: (string | number)[] }> {
  const client = getQdrantClient()

  // Generate embeddings first to know the dimension
  const texts = docs.map((d) => d.content)
  const vectors = await embedTexts(texts)
  if (!vectors.length || !Array.isArray(vectors[0])) {
    throw new Error("No embeddings generated")
  }
  const dim = vectors[0].length
  // Resolve client name from tenantId (fallback to tenantId itself), then use the new convention
  const clientName = await resolveClientNameFromTenantId(tenantId)
  const collectionName = await ensureCollectionByConvention(clientName, "docs", dim)
  console.log(`[qdrant] upsert -> tenantId=${tenantId} clientName=${clientName} collection=${collectionName} dim=${dim}`)

  const points = docs.map((d, i) => ({
    id: isUuid(d.id) ? d.id : toUuidFromString(d.id),
    vector: vectors[i],
    payload: {
      ...d.metadata,
      docId: d.id,
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
  const [queryVector] = await embedTexts([query])
  const dim = queryVector.length
  const clientName = await resolveClientNameFromTenantId(tenantId)
  const collectionName = await ensureCollectionByConvention(clientName, "docs", dim)
  console.log(`[qdrant] search -> tenantId=${tenantId} clientName=${clientName} collection=${collectionName} dim=${dim}`)

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

// Resolve a human-friendly client name from tenantId using MongoDB; fallback to the id
async function resolveClientNameFromTenantId(tenantId: string): Promise<string> {
  try {
    const db = await getDatabase()
    if ((ObjectId as any).isValid?.(tenantId)) {
      const row = await db
        .collection("tenants")
        .findOne({ _id: new ObjectId(tenantId) }, { projection: { name: 1 } })
      if (row?.name) return String(row.name)
    }
  } catch {}
  return tenantId
}

// Delete all doc collections for a tenant using the new (and legacy) conventions
export async function deleteCollectionsByTenant(tenantId: string): Promise<void> {
  const client = getQdrantClient()
  const clientName = await resolveClientNameFromTenantId(tenantId)
  const norm = normalizeClientName(clientName)
  const prefixNew = `tenant_${norm}_docs_`
  const legacy1 = `tenant_${tenantId}_docs`
  const legacyPrefix = `tenant_${tenantId}_docs_`

  try {
    const collections: any = await (client as any).getCollections?.()
    const names: string[] = collections?.collections?.map((c: any) => c.name) || []
    const toDelete = names.filter((n) => n.startsWith(prefixNew) || n === legacy1 || n.startsWith(legacyPrefix))
    for (const name of toDelete) {
      try {
        await client.deleteCollection(name)
        console.log(`[qdrant] deleted collection: ${name}`)
      } catch (e) {
        console.warn(`[qdrant] failed to delete collection ${name}:`, e)
      }
    }
  } catch (e) {
    console.warn("[qdrant] getCollections failed:", e)
  }
}
