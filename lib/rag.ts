import { ChromaClient } from "chromadb"

const chroma = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST || "localhost"}:${process.env.CHROMA_PORT || 8000}`,
})

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
    const collection = await chroma.getOrCreateCollection({
      name: `tenant_${tenantId}`,
      metadata: { tenantId },
    })

    const ids = documents.map((doc) => doc.id)
    const contents = documents.map((doc) => doc.content)
    const metadatas = documents.map((doc) => doc.metadata)

    await collection.add({
      ids,
      documents: contents,
      metadatas,
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding documents to ChromaDB:", error)
    return { success: false, error: error.message }
  }
}

export async function searchDocuments(tenantId: string, query: string, limit = 5) {
  try {
    const collection = await chroma.getCollection({
      name: `tenant_${tenantId}`,
    })

    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
    })

    return {
      success: true,
      documents: results.documents[0] || [],
      metadatas: results.metadatas[0] || [],
      distances: results.distances[0] || [],
    }
  } catch (error) {
    console.error("Error searching documents:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteCollection(tenantId: string) {
  try {
    await chroma.deleteCollection({
      name: `tenant_${tenantId}`,
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    return { success: false, error: error.message }
  }
}
