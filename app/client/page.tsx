"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bot, Upload, Settings, BarChart3, Copy, FileText, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDropzone } from "react-dropzone"

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  status: "processing" | "ready" | "error"
}

interface ChatLog {
  id: string
  message: string
  response: string
  timestamp: string
  ragUsed: boolean
}

export default function ClientPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const [currentTenant, setCurrentTenant] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Chatbot configuration
  const [config, setConfig] = useState({
    botName: "AI Assistant",
    welcomeMessage: "Hello! How can I help you today?",
    primaryColor: "#3B82F6",
    ragEnabled: true,
    apiToken: "client_token_demo_123",
  })

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken')
      console.log('🔍 Checking auth status, token:', token ? 'exists' : 'none')
      if (token) {
        try {
          // Validate token by making a request to a protected endpoint
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Auth verified, tenant data:', data.tenant)
            setIsAuthenticated(true)
            setCurrentTenant(data.tenant)
            loadMockData()
          } else {
            console.log('❌ Auth verification failed:', response.status)
            // Token is invalid, remove it
            localStorage.removeItem('authToken')
          }
        } catch (error) {
          console.error('❌ Auth check failed:', error)
          localStorage.removeItem('authToken')
        }
      }
    }
    
    checkAuthStatus()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Login failed",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('🔑 Login successful, tenant data:', data.tenant)
        setIsAuthenticated(true)
        setCurrentTenant(data.tenant)
        
        // Update config with tenant's settings
        if (data.tenant.config) {
          setConfig({
            ...config,
            ...data.tenant.config,
            apiToken: data.tenant.apiToken,
          })
        }
        
        // Store auth token in localStorage
        localStorage.setItem('authToken', data.token)
        
        loadMockData() // TODO: Replace with real data loading
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.tenant.name}!`,
        })
      } else {
        toast({
          title: "Login failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentTenant(null)
    setCredentials({ email: "", password: "" })
    localStorage.removeItem('authToken')
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  const loadMockData = () => {
    // Mock documents
    setDocuments([
      {
        id: "1",
        name: "Product Manual.pdf",
        type: "application/pdf",
        size: 2048000,
        uploadedAt: "2024-01-15T10:30:00Z",
        status: "ready",
      },
      {
        id: "2",
        name: "FAQ.txt",
        type: "text/plain",
        size: 15000,
        uploadedAt: "2024-01-16T14:20:00Z",
        status: "ready",
      },
      {
        id: "3",
        name: "Customer Data.csv",
        type: "text/csv",
        size: 500000,
        uploadedAt: "2024-01-17T09:15:00Z",
        status: "processing",
      },
    ])

    // Mock chat logs
    setChatLogs([
      {
        id: "1",
        message: "What are your business hours?",
        response: "Our business hours are Monday to Friday, 9 AM to 6 PM EST.",
        timestamp: "2024-01-20T15:30:00Z",
        ragUsed: true,
      },
      {
        id: "2",
        message: "How do I reset my password?",
        response: 'You can reset your password by clicking the "Forgot Password" link on the login page.',
        timestamp: "2024-01-20T14:45:00Z",
        ragUsed: true,
      },
      {
        id: "3",
        message: "Tell me a joke",
        response: "Why don't scientists trust atoms? Because they make up everything!",
        timestamp: "2024-01-20T13:20:00Z",
        ragUsed: false,
      },
    ])
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsUploading(true)
      setUploadProgress(0)

      acceptedFiles.forEach((file) => {
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsUploading(false)

              // Add document to list
              const newDoc: Document = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                status: "processing",
              }
              setDocuments((prev) => [...prev, newDoc])

              toast({
                title: "Upload successful",
                description: `${file.name} has been uploaded and is being processed`,
              })

              // Simulate processing completion
              setTimeout(() => {
                setDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? { ...doc, status: "ready" } : doc)))
              }, 3000)

              return 0
            }
            return prev + 10
          })
        }, 200)
      })
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    multiple: true,
  })

  const copyEmbedCode = () => {
    const embedCode = `<!-- Secure Chatbot Embed - No API tokens exposed -->
<meta name="chatbot-tenant-id" content="${currentTenant?._id || 'YOUR_TENANT_ID'}">
<script src="${window.location.origin}/embed" defer></script>`
    navigator.clipboard.writeText(embedCode)
    toast({
      title: "Secure embed code copied",
      description: "The secure embed code has been copied to your clipboard",
    })
  }

  const copyTenantId = () => {
    if (currentTenant?._id) {
      navigator.clipboard.writeText(currentTenant._id)
      toast({
        title: "Tenant ID copied",
        description: "Your tenant ID has been copied to your clipboard",
      })
    }
  }

  const regenerateToken = () => {
    // Note: In secure embed system, tokens are generated automatically
    // This function is kept for UI compatibility but shows a message
    toast({
      title: "Secure System Active",
      description: "Your chatbot now uses automatic JWT tokens - no manual regeneration needed!",
    })
  }

  const deleteDocument = (docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId))
    toast({
      title: "Document deleted",
      description: "The document has been removed from your knowledge base",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>Access your chatbot dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-4 text-center">Enter your company credentials</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Chatbot</h1>
              <p className="text-sm text-gray-500">Customize and manage your AI assistant</p>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            {currentTenant && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{currentTenant.name}</p>
                  <p className="text-xs text-gray-500">{currentTenant.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {currentTenant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Chats</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{chatLogs.length}</div>
              <p className="text-xs text-blue-600">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Documents</CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{documents.length}</div>
              <p className="text-xs text-green-600">In knowledge base</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">RAG Usage</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {Math.round((chatLogs.filter((log) => log.ragUsed).length / chatLogs.length) * 100)}%
              </div>
              <p className="text-xs text-purple-600">Of conversations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Status</CardTitle>
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Settings className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Active
              </div>
              <p className="text-xs text-emerald-600">Chatbot is live</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge">
            <div className="space-y-6">
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>Upload PDF, TXT, or CSV files to enhance your chatbot's knowledge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the files here...</p>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">Drag & drop files here, or click to select files</p>
                        <p className="text-sm text-gray-500">Supports PDF, TXT, and CSV files up to 10MB</p>
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base Documents</CardTitle>
                  <CardDescription>Manage your uploaded documents and their processing status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{doc.name}</h3>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              doc.status === "ready"
                                ? "default"
                                : doc.status === "processing"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customize">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Customization</CardTitle>
                <CardDescription>Customize your chatbot's appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bot-name">Bot Name</Label>
                      <Input
                        id="bot-name"
                        value={config.botName}
                        onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                        placeholder="Enter bot name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="welcome-message">Welcome Message</Label>
                      <Textarea
                        id="welcome-message"
                        value={config.welcomeMessage}
                        onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                        placeholder="Enter welcome message"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="rag-enabled">Enable RAG</Label>
                        <p className="text-sm text-gray-500">Use uploaded documents for responses</p>
                      </div>
                      <Switch
                        id="rag-enabled"
                        checked={config.ragEnabled}
                        onCheckedChange={(checked) => setConfig({ ...config, ragEnabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Preview</h3>
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="text-white p-3 rounded-t-lg" style={{ backgroundColor: config.primaryColor }}>
                        <h4 className="font-medium">{config.botName}</h4>
                      </div>
                      <div className="p-3 border-x border-b rounded-b-lg">
                        <div className="bg-gray-100 p-2 rounded text-sm">{config.welcomeMessage}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Save Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed">
            <Card>
              <CardHeader>
                <CardTitle>Embed Your Chatbot</CardTitle>
                <CardDescription>Copy and paste this code into your website to add the chatbot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">🔐 Secure Embed System</h3>
                  <p className="text-sm text-green-800">
                    Your chatbot now uses a secure embed system with JWT tokens and domain validation. 
                    No API tokens are exposed in your website code!
                  </p>
                </div>

                <div>
                  <Label htmlFor="tenant-id">Your Tenant ID</Label>
                  {console.log('🎯 Current tenant in render:', currentTenant)}
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      id="tenant-id" 
                      value={currentTenant?._id || 'Loading...'} 
                      readOnly 
                      className="font-mono text-sm" 
                    />
                    <Button variant="outline" onClick={copyTenantId}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="allowed-domains">Allowed Domains</Label>
                  <div className="mt-1">
                    <Input 
                      id="allowed-domains" 
                      value={currentTenant?.allowedDomains?.join(', ') || 'localhost, 127.0.0.1'} 
                      readOnly 
                      className="font-mono text-sm" 
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Your chatbot will only work on these domains for security
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="embed-code">Secure Embed Code</Label>
                  <div className="mt-1">
                    <Textarea
                      id="embed-code"
                      value={`<!-- Secure Chatbot Embed - No API tokens exposed -->
<meta name="chatbot-tenant-id" content="${currentTenant?._id || 'YOUR_TENANT_ID'}">
<script src="${window.location.origin}/embed" defer></script>`}
                      readOnly
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <Button className="mt-2" onClick={copyEmbedCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Embed Code
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">🛡️ Security Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✅ No API tokens exposed in your website code</li>
                    <li>✅ Domain-based authentication prevents unauthorized use</li>
                    <li>✅ JWT tokens expire automatically (2 hours)</li>
                    <li>✅ Backend validates every request</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">📋 Installation Instructions</h3>
                  <ol className="text-sm text-yellow-800 space-y-1">
                    <li>1. Copy the secure embed code above</li>
                    <li>2. Replace YOUR_TENANT_ID with your actual tenant ID</li>
                    <li>3. Paste the code before the closing &lt;/body&gt; tag on your website</li>
                    <li>4. Ensure your domain is in the allowed domains list</li>
                    <li>5. The chatbot will appear as a floating button on the bottom-right</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Logs</CardTitle>
                  <CardDescription>Recent conversations with your chatbot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chatLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                          {log.ragUsed && <Badge variant="outline">RAG Used</Badge>}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-blue-600">User:</span>
                            <p className="text-sm mt-1">{log.message}</p>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Bot:</span>
                            <p className="text-sm mt-1">{log.response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
