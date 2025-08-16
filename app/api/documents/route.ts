import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

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
