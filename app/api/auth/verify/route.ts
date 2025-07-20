import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    
    // Get fresh tenant data
    const tenant = await db.collection("tenants").findOne({ 
      _id: new ObjectId(decoded.tenantId) 
    })
    
    if (!tenant || tenant.status !== "active") {
      return NextResponse.json({ error: "Tenant not found or inactive" }, { status: 401 })
    }

    // Return tenant info (without sensitive data)
    return NextResponse.json({
      success: true,
      tenant: {
        _id: tenant._id.toString(),
        id: tenant._id.toString(),
        name: tenant.name,
        email: tenant.email,
        apiToken: tenant.apiToken,
        config: tenant.config,
        allowedDomains: tenant.allowedDomains || ['localhost', '127.0.0.1'],
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Token verification failed" }, { status: 401 })
  }
}
