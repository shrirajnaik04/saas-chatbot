import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret"
const EMBED_JWT_SECRET = process.env.EMBED_JWT_SECRET || "embed_secret_change_in_production"

export async function POST(request: NextRequest) {
  try {
    const { tenantId, domain } = await request.json()
    
    if (!tenantId || !domain) {
      return NextResponse.json({ error: "Tenant ID and domain are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find tenant by ID
    const tenant = await db.collection("tenants").findOne({ 
      _id: new ObjectId(tenantId) 
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Check if tenant is active
    if (tenant.status !== "active") {
      return NextResponse.json({ error: "Tenant account is suspended" }, { status: 403 })
    }

    // Verify domain is allowed
    const requestDomain = new URL(`http://${domain}`).hostname
    const isLocalhost = requestDomain === "localhost" || requestDomain === "127.0.0.1"
    
    // Allow localhost for development, otherwise check allowed domains
    if (!isLocalhost && tenant.allowedDomains && tenant.allowedDomains.length > 0) {
      const isAllowed = tenant.allowedDomains.some((allowedDomain: string) => {
        // Support wildcard subdomains (e.g., *.example.com)
        if (allowedDomain.startsWith("*.")) {
          const baseDomain = allowedDomain.substring(2)
          return requestDomain.endsWith(baseDomain)
        }
        return requestDomain === allowedDomain
      })

      if (!isAllowed) {
        return NextResponse.json({ 
          error: "Domain not authorized for this tenant" 
        }, { status: 403 })
      }
    }

    // Generate short-lived JWT for embed
    const embedToken = jwt.sign(
      {
        tenantId: tenant._id.toString(),
        domain: requestDomain,
        botConfig: tenant.config,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
      },
      EMBED_JWT_SECRET
    )

    return NextResponse.json({
      success: true,
      token: embedToken,
      config: {
        botName: tenant.config.botName,
        primaryColor: tenant.config.primaryColor,
        welcomeMessage: tenant.config.welcomeMessage,
      }
    })

  } catch (error) {
    console.error("Chatbot init error:", error)
    return NextResponse.json({ error: "Failed to initialize chatbot" }, { status: 500 })
  }
}

// Helper function to verify embed JWT
export function verifyEmbedToken(token: string) {
  try {
    return jwt.verify(token, EMBED_JWT_SECRET) as any
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
