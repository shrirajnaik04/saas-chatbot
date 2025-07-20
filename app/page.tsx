import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Users, Settings, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">ChatBot SaaS</h1>
          </div>
          <div className="space-x-4">
            <Link href="/admin">
              <Button variant="outline">Admin Portal</Button>
            </Link>
            <Link href="/client">
              <Button>Client Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Bot className="w-4 h-4 mr-2" />
            Powered by Advanced AI & RAG Technology
          </div>

          <h2 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Chatbots for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 block mt-2">
              Every Business
            </span>
          </h2>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Create, customize, and deploy intelligent chatbots with RAG capabilities. Upload your documents, customize
            the experience, and embed anywhere. No coding required.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <Link href="/client">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Building Free
                <Bot className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 bg-transparent"
              >
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Active Chatbots</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm font-medium mb-6">
            <Settings className="w-4 h-4 mr-2" />
            Platform Features
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything you need to deploy
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 block">
              intelligent chatbots
            </span>
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From document processing to custom branding, our platform handles the complexity so you can focus on your
            business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Smart RAG</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Upload documents and let AI provide contextual answers using retrieval-augmented generation with vector
                search
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Multi-Tenant</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Manage multiple clients with isolated data, custom branding, and individual configurations in one
                platform
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Easy Customization</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Customize colors, branding, welcome messages, and behavior without any coding knowledge required
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Track conversations, user engagement, and chatbot performance with detailed analytics and insights
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6" />
            <span className="text-lg font-semibold">ChatBot SaaS</span>
          </div>
          <p className="text-gray-400">© 2024 ChatBot SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
