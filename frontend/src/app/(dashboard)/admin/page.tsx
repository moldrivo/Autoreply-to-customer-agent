'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2,
  Users,
  Key,
  Activity,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Server,
  Database,
  Brain,
  EyeOff,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Workspace {
  id: string
  name: string
  plan: string
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface ApiKey {
  id: string
  name: string
  key_preview: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

interface SystemHealth {
  database: { status: 'healthy' | 'degraded' | 'down'; latency: number; last_checked: string }
  redis: { status: 'healthy' | 'degraded' | 'down'; latency: number; last_checked: string }
  openai: { status: 'healthy' | 'degraded' | 'down'; latency: number; last_checked: string }
}

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  details: string
}

const tabs = [
  { value: 'workspaces', label: 'Workspaces', icon: Building2 },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'api-keys', label: 'API Keys', icon: Key },
  { value: 'system-health', label: 'System Health', icon: Activity },
  { value: 'audit-logs', label: 'Audit Logs', icon: ClipboardList },
]

const mockWorkspaces: Workspace[] = [
  { id: '1', name: 'The Grand Hotel', plan: 'enterprise', is_active: true, created_at: '2025-01-15T00:00:00Z' },
  { id: '2', name: 'Seaside Restaurant', plan: 'business', is_active: true, created_at: '2025-03-20T00:00:00Z' },
  { id: '3', name: 'City Medical Center', plan: 'enterprise', is_active: true, created_at: '2025-02-10T00:00:00Z' },
  { id: '4', name: 'TechShop Online', plan: 'starter', is_active: false, created_at: '2025-04-01T00:00:00Z' },
  { id: '5', name: 'Boutique Hotel Paris', plan: 'business', is_active: true, created_at: '2025-05-12T00:00:00Z' },
]

const mockUsers: User[] = [
  { id: '1', email: 'john@example.com', full_name: 'John Smith', role: 'admin', is_active: true, created_at: '2025-01-15T00:00:00Z' },
  { id: '2', email: 'jane@example.com', full_name: 'Jane Doe', role: 'manager', is_active: true, created_at: '2025-03-20T00:00:00Z' },
  { id: '3', email: 'bob@example.com', full_name: 'Bob Wilson', role: 'member', is_active: true, created_at: '2025-02-10T00:00:00Z' },
  { id: '4', email: 'alice@example.com', full_name: 'Alice Brown', role: 'member', is_active: false, created_at: '2025-04-01T00:00:00Z' },
]

const mockApiKeys: ApiKey[] = [
  { id: '1', name: 'Production Key', key_preview: 'ar_prod_4f3e...a1b2', is_active: true, created_at: '2025-01-15T00:00:00Z', last_used_at: '2025-07-10T00:00:00Z' },
  { id: '2', name: 'Development Key', key_preview: 'ar_dev_8c2d...e5f6', is_active: true, created_at: '2025-03-20T00:00:00Z', last_used_at: '2025-07-11T00:00:00Z' },
  { id: '3', name: 'Staging Key', key_preview: 'ar_stag_1a2b...3c4d', is_active: false, created_at: '2025-02-10T00:00:00Z', last_used_at: null },
]

const mockHealth: SystemHealth = {
  database: { status: 'healthy', latency: 12, last_checked: '2025-07-12T14:30:00Z' },
  redis: { status: 'healthy', latency: 3, last_checked: '2025-07-12T14:30:00Z' },
  openai: { status: 'degraded', latency: 450, last_checked: '2025-07-12T14:29:00Z' },
}

const mockAuditLogs: AuditLog[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `${i}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  user: ['john@example.com', 'jane@example.com', 'admin@autoreply.ai'][i % 3],
  action: ['workspace.created', 'reply.approved', 'user.invited', 'api_key.revoked', 'settings.updated'][i % 5],
  resource: ['Workspace #12', 'Review #45', 'User #8', 'API Key #3', 'Brand Voice'][i % 5],
  details: ['Created new workspace for client', 'Approved reply for review #45', 'Invited user sarah@example.com', 'Revoked expired API key', 'Updated brand voice settings'][i % 5],
}))

export default function AdminPage() {
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [showFullKey, setShowFullKey] = useState<string | null>(null)

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name')
      return
    }
    const fakeKey = `ar_${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`
    setGeneratedKey(fakeKey)
    toast.success('API key generated')
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  }

  const handleRevokeKey = (_id: string) => {
    setShowRevokeDialog(null)
    toast.success('API key revoked')
  }

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'healthy')
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Healthy</Badge>
    if (status === 'degraded')
      return <Badge variant="warning" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Degraded</Badge>
    return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Down</Badge>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage workspaces, users, and system settings</p>
      </div>

      <Tabs defaultValue="workspaces">
        {({ activeValue, onValueChange }) => (
          <>
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    activeValue={activeValue}
                    onValueChange={onValueChange}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value="workspaces" activeValue={activeValue}>
              <Card glass>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Workspaces</CardTitle>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Workspace
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockWorkspaces.map((w) => (
                          <tr key={w.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{w.name}</td>
                            <td className="px-4 py-3">
                              <Badge variant={w.plan === 'enterprise' ? 'default' : w.plan === 'business' ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                                {w.plan}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={w.is_active ? 'success' : 'destructive'} className="text-[10px]">
                                {w.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(w.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" className="h-8">
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" activeValue={activeValue}>
              <Card glass>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Users</CardTitle>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Invite User
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockUsers.map((u) => (
                          <tr key={u.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-3 text-foreground">{u.email}</td>
                            <td className="px-4 py-3 text-foreground">{u.full_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={u.is_active ? 'success' : 'destructive'} className="text-[10px]">
                                {u.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" className="h-8">
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" activeValue={activeValue}>
              <div className="space-y-4">
                <Card glass>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">API Keys</CardTitle>
                      <CardDescription>Manage your API keys for external integrations</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => { setShowNewKeyDialog(true); setNewKeyName(''); setGeneratedKey('') }}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Generate Key
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Key</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Used</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockApiKeys.map((k) => (
                            <tr key={k.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{k.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                                    {showFullKey === k.id ? k.key_preview.replace('...', '_full_') : k.key_preview}
                                  </code>
                                  <button
                                    onClick={() => setShowFullKey(showFullKey === k.id ? null : k.id)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    {showFullKey === k.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={k.is_active ? 'success' : 'destructive'} className="text-[10px]">
                                  {k.is_active ? 'Active' : 'Revoked'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {k.last_used_at ? formatDate(k.last_used_at) : 'Never'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {k.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={() => setShowRevokeDialog(k.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system-health" activeValue={activeValue}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card glass>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-950">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Database</p>
                        <StatusBadge status={mockHealth.database.status} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>Latency: {mockHealth.database.latency}ms</p>
                      <p>Last checked: {formatRelativeTime(mockHealth.database.last_checked)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card glass>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-950">
                        <Server className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Redis</p>
                        <StatusBadge status={mockHealth.redis.status} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>Latency: {mockHealth.redis.latency}ms</p>
                      <p>Last checked: {formatRelativeTime(mockHealth.redis.last_checked)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card glass>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-950">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">OpenAI API</p>
                        <StatusBadge status={mockHealth.openai.status} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>Latency: {mockHealth.openai.latency}ms</p>
                      <p>Last checked: {formatRelativeTime(mockHealth.openai.last_checked)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit-logs" activeValue={activeValue}>
              <Card glass>
                <CardHeader>
                  <CardTitle className="text-base">Audit Logs</CardTitle>
                  <CardDescription>Track all administrative actions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAuditLogs.slice((auditPage - 1) * 10, auditPage * 10).map((log) => (
                          <tr key={log.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(log.timestamp)}
                            </td>
                            <td className="px-4 py-3 text-foreground">{log.user}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{log.resource}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page {auditPage} of {Math.ceil(mockAuditLogs.length / 10)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      disabled={auditPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => Math.min(Math.ceil(mockAuditLogs.length / 10), p + 1))}
                      disabled={auditPage === Math.ceil(mockAuditLogs.length / 10)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>Create a new API key for external integrations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              label="Key Name"
              placeholder="e.g. Production Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            {generatedKey && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Your API Key</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-background px-3 py-2 text-xs font-mono break-all">
                    {generatedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleCopyKey(generatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Make sure to copy this key now. You won't be able to see it again.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>Cancel</Button>
            {!generatedKey && (
              <Button onClick={handleGenerateKey}>Generate Key</Button>
            )}
            {generatedKey && (
              <Button onClick={() => setShowNewKeyDialog(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRevokeDialog} onOpenChange={() => setShowRevokeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>This action cannot be undone. Any services using this key will stop working.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showRevokeDialog && handleRevokeKey(showRevokeDialog)}>
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function formatRelativeTime(d: string) {
  const now = Date.now()
  const diff = now - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
