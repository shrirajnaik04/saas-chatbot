import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateToken, hashPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const tenants = await db.collection("tenants").find({}).toArray()

    return NextResponse.json({ tenants })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if tenant already exists
    const existingTenant = await db.collection("tenants").findOne({ email })
    if (existingTenant) {
      return NextResponse.json({ error: "Tenant with this email already exists" }, { status: 400 })
    }

    // Create new tenant
    const hashedPassword = await hashPassword(password)
    const apiToken = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const tenant = {
      name,
      email,
      password: hashedPassword,
      apiToken,
      status: "active",
      ragEnabled: true,
      allowedDomains: [], // Array of allowed domains for embed
      config: {
        botName: "AI Assistant",
        welcomeMessage: "Hello! How can I help you today?",
        primaryColor: "#3B82F6",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tenants").insertOne(tenant)

    // Generate JWT token
    const jwtToken = generateToken({
      id: result.insertedId.toString(),
      email,
      role: "client",
      tenantId: result.insertedId.toString(),
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: result.insertedId,
        name,
        email,
        apiToken,
        status: "active",
      },
      token: jwtToken,
    })
  } catch (error) {
    console.error("Create tenant error:", error)
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const result = await db.collection("tenants").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update tenant error:", error)
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Delete tenant and related data
    await Promise.all([
      db.collection("tenants").deleteOne({ _id: new ObjectId(id) }),
      db.collection("documents").deleteMany({ tenantId: id }),
      db.collection("chat_logs").deleteMany({ tenantId: id }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete tenant error:", error)
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
  }
}
