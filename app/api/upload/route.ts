import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { parseFile, chunkText } from "@/lib/file-parser"
import { addDocuments } from "@/lib/rag"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    // 1) Parse form-data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const tenantId = (formData.get("tenantId") as string | null)?.trim()

    if (!file) {
      return NextResponse.json({ error: "Missing file in form-data", step: "validate" }, { status: 400 })
    }
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId in form-data", step: "validate" }, { status: 400 })
    }
    if (!file.name) {
      return NextResponse.json({ error: "Uploaded file has no name", step: "validate" }, { status: 400 })
    }

    // 2) Validate file size (default 10MB)
    const maxSize = Number.parseInt(process.env.MAX_FILE_SIZE || "10485760")
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds limit", step: "validate" }, { status: 400 })
    }

  // 3) Sanitize filename and prepare path
  const originalName = file.name
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_")
  const uploadDir = path.join(process.cwd(), "uploads", tenantId)
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (err) {
      console.error("Failed to create upload directory:", err)
      return NextResponse.json({ error: "Failed to create upload directory", step: "save" }, { status: 500 })
    }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filePath = path.join(uploadDir, safeName)
    try {
      await writeFile(filePath, buffer)
    } catch (err) {
      console.error("Failed to write uploaded file:", err)
      return NextResponse.json({ error: "Failed to persist uploaded file", step: "save" }, { status: 500 })
    }

    // 4) Parse and chunk
  let parsed
    try {
  parsed = await parseFile(filePath, originalName)
    } catch (err: any) {
      console.error("Failed to parse file:", err)
      return NextResponse.json(
        { error: err?.message || "Failed to parse file", step: "parse" },
        { status: 400 },
      )
    }

    const chunks = chunkText(parsed.content)
    if (!chunks.length) {
      return NextResponse.json(
        { error: "No content extracted from file for embedding", step: "parse" },
        { status: 400 },
      )
    }

    // 5) Create/Check DB record
    const db = await getDatabase()
    // Basic dedup: same tenant, filename, and size
    const duplicate = await db
      .collection("documents")
      .findOne({ tenantId, filename: safeName, size: file.size, status: { $ne: "error" } })
    if (duplicate) {
      return NextResponse.json(
        { error: "Document already exists for this tenant", step: "dedup", document: duplicate },
        { status: 409 },
      )
    }
    const initialRecord: any = {
      tenantId,
  filename: safeName,
  originalName,
      filePath,
      size: file.size,
      type: parsed.metadata.type,
      status: "processing",
      uploadedAt: new Date(),
      metadata: parsed.metadata,
      chunkCount: chunks.length,
    }
    const insertRes = await db.collection("documents").insertOne(initialRecord)

    // 6) Prepare vector docs
    const documents = chunks.map((chunk, index) => ({
      id: `${tenantId}_${String(insertRes.insertedId)}_${index}`,
      content: chunk,
      metadata: {
        filename: safeName,
        tenantId,
        uploadedAt: initialRecord.uploadedAt.toISOString(),
        type: parsed.metadata.type,
        chunkIndex: index,
        documentId: String(insertRes.insertedId),
      },
    }))

    // 7) Upsert into Qdrant
    const ragResult = await addDocuments(tenantId, documents)
    if (!ragResult.success) {
      await db
        .collection("documents")
        .updateOne({ _id: insertRes.insertedId }, { $set: { status: "error", error: ragResult.error } })
      return NextResponse.json(
        { error: "Vector upsert failed", step: "vector", details: ragResult.error },
        { status: 500 },
      )
    }

    // 8) Update DB to ready and store pointIds
    const updateRes = await db.collection("documents").findOneAndUpdate(
      { _id: insertRes.insertedId },
      { $set: { status: "ready", pointIds: ragResult.pointIds || [] } },
      { returnDocument: "after" },
    )

    const savedDoc = updateRes?.value || { _id: insertRes.insertedId, ...initialRecord, status: "ready" }

    // 9) Return success
    return NextResponse.json({ success: true, document: savedDoc })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process file upload", step: "unknown" },
      { status: 500 },
    )
  }
}
