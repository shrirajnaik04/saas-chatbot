import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { comparePassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find tenant by email
    const tenant = await db.collection("tenants").findOne({ email })
    if (!tenant) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if tenant is active
    if (tenant.status !== "active") {
      return NextResponse.json({ error: "Account is suspended" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await comparePassword(password, tenant.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      id: tenant._id.toString(),
      email: tenant.email,
      role: "client",
      tenantId: tenant._id.toString(),
    })

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
      token,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
