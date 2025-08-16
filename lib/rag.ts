import { getQdrantClient, searchTenantContext as qdrantSearch, upsertDocumentsToQdrant } from "./qdrant"

export interface Document {
  id: string
  content: string
  metadata: {
    filename: string
    tenantId: string
    uploadedAt: string
    type: string
  }
}

export async function addDocuments(tenantId: string, documents: Document[]) {
  try {
    const { pointIds } = await upsertDocumentsToQdrant(
      tenantId,
      documents.map((d) => ({ id: d.id, content: d.content, metadata: d.metadata })),
    )
    return { success: true, pointIds }
  } catch (error: any) {
    console.error("Error adding documents to Qdrant:", error)
    return { success: false, error: error.message }
  }
}

export async function searchDocuments(tenantId: string, query: string, limit = 5) {
  try {
    const { results } = await qdrantSearch(tenantId, query, limit)
    return {
      success: true,
      documents: results.map((r) => r.content),
      metadatas: results.map((r) => r.payload),
      distances: results.map((r) => 1 - r.score),
    }
  } catch (error: any) {
    console.error("Error searching documents:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteCollection(tenantId: string) {
  try {
    const client = getQdrantClient()
    // Delete legacy collection (no suffix)
    try { await client.deleteCollection(`tenant_${tenantId}_docs`) } catch {}
    // Delete any dimension-suffixed collections
    try {
      const collections: any = await (client as any).getCollections?.()
      const names: string[] = collections?.collections?.map((c: any) => c.name) || []
      const toDelete = names.filter((n) => n.startsWith(`tenant_${tenantId}_docs_`))
      for (const name of toDelete) {
        try { await client.deleteCollection(name) } catch {}
      }
    } catch {}
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting collection:", error)
    return { success: false, error: error.message }
  }
}
