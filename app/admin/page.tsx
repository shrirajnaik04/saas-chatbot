"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Users, Bot, BarChart3, Settings, Plus, Eye, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Tenant {
  id: string
  name: string
  email: string
  status: "active" | "suspended"
  apiToken: string
  ragEnabled: boolean
  createdAt: string
  chatCount: number
  documentCount: number
}

export default function AdminPortal() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [newTenant, setNewTenant] = useState({ name: "", email: "", password: "" })
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Mock authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin"
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"
    
    if (credentials.username === adminUsername && credentials.password === adminPassword) {
      setIsAuthenticated(true)
      loadTenants()
      toast({
        title: "Login successful",
        description: "Welcome to the admin portal",
      })
    } else {
      toast({
        title: "Login failed",
        description: "Invalid credentials",
        variant: "destructive",
      })
    }
  }

  const loadTenants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tenants')
      const data = await response.json()
      
      if (response.ok) {
        setTenants(data.tenants.map((tenant: any) => ({
          id: tenant._id,
          name: tenant.name,
          email: tenant.email,
          status: tenant.status,
          apiToken: tenant.apiToken,
          ragEnabled: tenant.ragEnabled,
          createdAt: new Date(tenant.createdAt).toISOString().split("T")[0],
          chatCount: 0, // TODO: Get from analytics
          documentCount: 0, // TODO: Get from documents collection
        })))
      }
    } catch (error) {
      console.error('Failed to load tenants:', error)
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTenant = async () => {
    if (!newTenant.name || !newTenant.email || !newTenant.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setNewTenant({ name: "", email: "", password: "" })
        await loadTenants() // Reload the list
        toast({
          title: "Tenant created",
          description: `${newTenant.name} has been added successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create tenant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTenantStatus = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    if (!tenant) return

    try {
      const newStatus = tenant.status === "active" ? "suspended" : "active"
      const response = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status: newStatus })
      })
      
      if (response.ok) {
        await loadTenants() // Reload the list
        toast({
          title: "Status updated",
          description: "Tenant status has been changed",
        })
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
      toast({
        title: "Error",
        description: "Failed to update tenant status",
        variant: "destructive",
      })
    }
  }

  const regenerateToken = async (tenantId: string) => {
    try {
      const newToken = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const response = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, apiToken: newToken })
      })
      
      if (response.ok) {
        await loadTenants() // Reload the list
        toast({
          title: "Token regenerated",
          description: "New API token has been generated",
        })
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
      toast({
        title: "Error",
        description: "Failed to regenerate token",
        variant: "destructive",
      })
    }
  }

  const deleteTenant = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants?id=${tenantId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadTenants() // Reload the list
        toast({
          title: "Tenant deleted",
          description: "Tenant has been removed from the system",
        })
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error)
      toast({
        title: "Error",
        description: "Failed to delete tenant",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>Sign in to manage your chatbot platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Demo credentials: Check your .env file for ADMIN_USERNAME and ADMIN_PASSWORD
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalChats = tenants.reduce((sum, tenant) => sum + tenant.chatCount, 0)
  const totalDocuments = tenants.reduce((sum, tenant) => sum + tenant.documentCount, 0)
  const activeTenants = tenants.filter((t) => t.status === "active").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-sm text-gray-500">Manage your chatbot platform</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAuthenticated(false)}
            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        {/* Enhanced Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Tenants</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{tenants.length}</div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {activeTenants} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Chats</CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{totalChats.toLocaleString()}</div>
              <p className="text-xs text-green-600">Across all tenants</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Documents</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{totalDocuments}</div>
              <p className="text-xs text-purple-600">Knowledge base files</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">RAG Enabled</CardTitle>
              <div className="p-2 bg-orange-500 rounded-lg">
                <Settings className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{tenants.filter((t) => t.ragEnabled).length}</div>
              <p className="text-xs text-orange-600">Out of {tenants.length} tenants</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>Manage all your chatbot clients</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Tenant</DialogTitle>
                        <DialogDescription>Add a new client to the platform</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tenant-name">Company Name</Label>
                          <Input
                            id="tenant-name"
                            value={newTenant.name}
                            onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenant-email">Email</Label>
                          <Input
                            id="tenant-email"
                            type="email"
                            value={newTenant.email}
                            onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenant-password">Password</Label>
                          <Input
                            id="tenant-password"
                            type="password"
                            value={newTenant.password}
                            onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                            placeholder="Enter password"
                          />
                        </div>
                        <Button onClick={createTenant} className="w-full" disabled={isLoading}>
                          {isLoading ? "Creating..." : "Create Tenant"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold">{tenant.name}</h3>
                            <p className="text-sm text-gray-500">{tenant.email}</p>
                          </div>
                          <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
                          {tenant.ragEnabled && <Badge variant="outline">RAG Enabled</Badge>}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {tenant.chatCount} chats • {tenant.documentCount} documents • Created {tenant.createdAt}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTenant(tenant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => regenerateToken(tenant.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={tenant.status === "active" ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleTenantStatus(tenant.id)}
                        >
                          {tenant.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteTenant(tenant.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Overview of platform usage and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-500">Detailed analytics and reporting features would be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default-rag">Default RAG Mode</Label>
                    <p className="text-sm text-gray-500">Enable RAG by default for new tenants</p>
                  </div>
                  <Switch id="default-rag" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-suspend">Auto-suspend inactive tenants</Label>
                    <p className="text-sm text-gray-500">Suspend tenants after 30 days of inactivity</p>
                  </div>
                  <Switch id="auto-suspend" />
                </div>
                <div>
                  <Label htmlFor="default-model">Default LLM Model</Label>
                  <Input id="default-model" value="gpt-4-turbo" className="mt-1" placeholder="Enter default model" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTenant.name} - Details</DialogTitle>
              <DialogDescription>Detailed information and settings for this tenant</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Token</Label>
                  <Input value={selectedTenant.apiToken} readOnly />
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedTenant.status === "active" ? "default" : "secondary"}>
                    {selectedTenant.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Total Chats</Label>
                  <p className="text-2xl font-bold">{selectedTenant.chatCount}</p>
                </div>
                <div>
                  <Label>Documents</Label>
                  <p className="text-2xl font-bold">{selectedTenant.documentCount}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{selectedTenant.createdAt}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
