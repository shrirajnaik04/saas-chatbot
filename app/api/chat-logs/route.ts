import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Bearer token required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify JWT token
    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== "client" || !decodedToken.tenantId) {
      return NextResponse.json({ error: "Unauthorized: Invalid token or insufficient permissions" }, { status: 401 })
    }

    const tenantId = decodedToken.tenantId

    // Connect to database
    const db = await getDatabase()
    
    // Get chat logs for this tenant
    const chatLogs = await db.collection("chat_logs").find({ 
      tenantId: tenantId 
    }).sort({ 
      timestamp: -1 
    }).limit(100).toArray() // Get last 100 chats

    // Calculate analytics
    const totalChats = chatLogs.length
    const ragUsedChats = chatLogs.filter(log => log.ragUsed === true).length
    const ragUsagePercentage = totalChats > 0 ? Math.round((ragUsedChats / totalChats) * 100) : 0

    // Get this month's chats
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const thisMonthChats = chatLogs.filter(log => 
      new Date(log.timestamp) >= startOfMonth
    ).length

    // Format chat logs for display
    const formattedLogs = chatLogs.slice(0, 10).map(log => ({
      id: log._id.toString(),
      message: log.message,
      response: log.response,
      timestamp: log.timestamp,
      ragUsed: log.ragUsed || false
    }))

    return NextResponse.json({
      success: true,
      analytics: {
        totalChats,
        thisMonthChats,
        ragUsagePercentage,
        ragUsedChats
      },
      chatLogs: formattedLogs
    })

  } catch (error) {
    console.error("❌ Chat logs API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat logs" },
      { status: 500 }
    )
  }
}
