import { FloatingWidget } from "@/components/ui/floating-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Bot, Sparkles } from "lucide-react"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Live Demo</h1>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Interactive Demo
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Try Our Chatbot
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">
              Right Now
            </span>
          </h2>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Click the floating button in the bottom-right corner to start chatting with our AI assistant. Experience the
            smooth interface and intelligent responses.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span>Smart Responses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Our AI provides contextual, helpful responses based on your uploaded documents and training data.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>Customizable Design</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Every aspect of the chatbot can be customized to match your brand colors, messaging, and style.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link href="/client">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Start Building Your Own
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Widget Demo */}
      <FloatingWidget
        botName="Demo Assistant"
        primaryColor="#3B82F6"
        welcomeMessage="Hi! I'm a demo chatbot. Try asking me anything!"
      />
    </div>
  )
}
