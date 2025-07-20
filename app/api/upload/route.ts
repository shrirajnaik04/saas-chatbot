import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { parseFile, chunkText } from "@/lib/file-parser"
import { addDocuments } from "@/lib/rag"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const tenantId = formData.get("tenantId") as string

    if (!file || !tenantId) {
      return NextResponse.json({ error: "File and tenant ID are required" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = Number.parseInt(process.env.MAX_FILE_SIZE || "10485760")
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds limit" }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), "uploads", tenantId)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, file.name)
    await writeFile(filePath, buffer)

    // Parse file content
    const parsed = await parseFile(filePath, file.name)

    // Chunk the content
    const chunks = chunkText(parsed.content)

    // Create documents for vector storage
    const documents = chunks.map((chunk, index) => ({
      id: `${tenantId}_${file.name}_${index}`,
      content: chunk,
      metadata: {
        filename: file.name,
        tenantId,
        uploadedAt: new Date().toISOString(),
        type: parsed.metadata.type,
        chunkIndex: index,
      },
    }))

    // Add to vector database
    const ragResult = await addDocuments(tenantId, documents)
    if (!ragResult.success) {
      throw new Error("Failed to add documents to vector database")
    }

    // Save to MongoDB
    const db = await getDatabase()
    const documentRecord = {
      tenantId,
      filename: file.name,
      originalName: file.name,
      filePath,
      size: file.size,
      type: parsed.metadata.type,
      status: "ready",
      uploadedAt: new Date(),
      metadata: parsed.metadata,
      chunkCount: chunks.length,
    }

    await db.collection("documents").insertOne(documentRecord)

    return NextResponse.json({
      success: true,
      document: {
        id: documentRecord._id,
        filename: file.name,
        size: file.size,
        type: parsed.metadata.type,
        status: "ready",
        chunkCount: chunks.length,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process file upload" }, { status: 500 })
  }
}
