import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import path from "path"
import { unlink } from "fs/promises"
import { deleteDocumentFromQdrant } from "@/lib/qdrant"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Bearer token required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== "client" || !decodedToken.tenantId) {
      return NextResponse.json({ error: "Unauthorized: Invalid token or insufficient permissions" }, { status: 401 })
    }

    const tenantId = decodedToken.tenantId
    const db = await getDatabase()

    const docs = await db
      .collection("documents")
      .find({ tenantId })
      .sort({ uploadedAt: -1 })
      .project({
        _id: 1,
        filename: 1,
        size: 1,
        type: 1,
        status: 1,
        uploadedAt: 1,
        chunkCount: 1,
      })
      .toArray()

    const formatted = docs.map((d: any) => ({
      id: String(d._id),
      name: d.filename,
      type: d.type,
      size: d.size,
      uploadedAt: d.uploadedAt,
      status: d.status || "ready",
      chunkCount: d.chunkCount || 0,
    }))

    return NextResponse.json({ success: true, documents: formatted })
  } catch (error) {
    console.error("❌ Documents API error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Bearer token required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== "client" || !decodedToken.tenantId) {
      return NextResponse.json({ error: "Unauthorized: Invalid token or insufficient permissions" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing document id" }, { status: 400 })
    }

    const tenantId = decodedToken.tenantId
    const db = await getDatabase()
    const doc = await db.collection("documents").findOne({ _id: new ObjectId(id), tenantId })
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // 1) Delete vectors from Qdrant using payload filter by tenantId + documentId
    const { deletedIn } = await deleteDocumentFromQdrant(tenantId, String(doc._id))

    // 2) Delete DB record
    await db.collection("documents").deleteOne({ _id: new ObjectId(id), tenantId })

    // 3) Optionally remove persisted file if PERSIST_UPLOADS=true
    const persistUploads = String(process.env.PERSIST_UPLOADS || "false").toLowerCase() === "true"
    if (persistUploads && doc.filePath) {
      try {
        // Ensure file path stays within uploads directory
        const uploadsRoot = path.join(process.cwd(), "uploads")
        const resolved = path.resolve(doc.filePath)
        if (resolved.startsWith(uploadsRoot)) {
          await unlink(resolved)
        }
      } catch (e) {
        // Non-fatal; log and continue
        console.warn("Failed to remove persisted file:", e)
      }
    }

    return NextResponse.json({ success: true, deletedIn })
  } catch (error) {
    console.error("❌ Document DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
