"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Bot, X, Send, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingWidgetProps {
  botName?: string
  primaryColor?: string
  welcomeMessage?: string
  position?: "bottom-right" | "bottom-left"
}

export function FloatingWidget({
  botName = "AI Assistant",
  primaryColor = "#3B82F6",
  welcomeMessage = "Hello! How can I help you today?",
  position = "bottom-right",
}: FloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([{ role: "bot", content: welcomeMessage, timestamp: new Date() }])
  const [input, setInput] = useState("")

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  }

  const sendMessage = () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        role: "bot",
        content: "Thanks for your message! This is a demo response.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* Chat Window */}
      {isOpen && (
        <Card
          className={cn(
            "w-80 h-96 mb-4 shadow-2xl border-0 overflow-hidden transition-all duration-300",
            isMinimized ? "h-14" : "h-96",
          )}
        >
          {/* Header */}
          <CardHeader
            className="p-4 text-white flex flex-row items-center justify-between space-y-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">{botName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto bg-gray-50 max-h-64">
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-xs px-3 py-2 rounded-lg text-sm",
                          message.role === "user"
                            ? "text-white rounded-br-none"
                            : "bg-white border rounded-bl-none shadow-sm",
                        )}
                        style={{
                          backgroundColor: message.role === "user" ? primaryColor : undefined,
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border-gray-300 focus:border-blue-500"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage} size="sm" className="px-3" style={{ backgroundColor: primaryColor }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: primaryColor }}
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  )
}
