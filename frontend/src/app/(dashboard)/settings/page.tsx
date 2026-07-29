'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { Select } from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import * as api from '@/lib/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Download,
} from 'lucide-react'

const tabs = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'workspace', label: 'Workspace', icon: Building2 },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'billing', label: 'Billing', icon: CreditCard },
]

const industries = [
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'travel', label: 'Travel' },
  { value: 'automotive', label: 'Automotive' },
]

const digestOptions = [
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'monthly', label: 'Monthly Digest' },
  { value: 'none', label: 'No Digest' },
]

const mockSessions = [
  { id: '1', device: 'Chrome on Windows', ip: '192.168.1.1', last_active: '2025-07-12T14:30:00Z', is_current: true },
  { id: '2', device: 'Safari on macOS', ip: '192.168.1.2', last_active: '2025-07-11T09:15:00Z', is_current: false },
  { id: '3', device: 'Mobile App iOS', ip: '192.168.1.3', last_active: '2025-07-10T18:45:00Z', is_current: false },
]

const mockInvoices = [
  { id: 'INV-001', date: '2025-07-01T00:00:00Z', amount: 99.00, status: 'paid', plan: 'Business Monthly' },
  { id: 'INV-002', date: '2025-06-01T00:00:00Z', amount: 99.00, status: 'paid', plan: 'Business Monthly' },
  { id: 'INV-003', date: '2025-05-01T00:00:00Z', amount: 99.00, status: 'paid', plan: 'Business Monthly' },
  { id: 'INV-004', date: '2025-04-01T00:00:00Z', amount: 49.00, status: 'paid', plan: 'Starter Monthly' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', slug: '', industry: '', description: '' })
  const [notifForm, setNotifForm] = useState({ email_notifications: true, digest_frequency: 'weekly' })
  const [securityForm, setSecurityForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const { data: brandVoice, isLoading: _isLoading } = useQuery({
    queryKey: ['brand-voice'],
    queryFn: api.getBrandVoice,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateBrandVoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-voice'] })
      toast.success('Settings updated')
    },
    onError: () => toast.error('Failed to update settings'),
  })

  const saveProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => api.updateBrandVoice(data as any),
    onSuccess: () => { toast.success('Profile saved'); queryClient.invalidateQueries({ queryKey: ['brand-voice'] }) },
    onError: () => toast.error('Failed to save profile'),
  })
  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => api.login('', data.new_password).then(() => {}),
    onSuccess: () => toast.success('Password changed'),
    onError: () => toast.error('Failed to change password'),
  })

  const handleSaveProfile = () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    saveProfileMutation.mutate(profileForm)
  }

  const handleSaveWorkspace = () => {
    updateMutation.mutate({
      company_name: workspaceForm.name,
      industry: workspaceForm.industry,
      business_description: workspaceForm.description,
    })
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated')
  }

  const handleChangePassword = () => {
    const { current_password, new_password, confirm_password } = securityForm
    if (!current_password || !new_password || !confirm_password) {
      toast.error('Please fill in all password fields')
      return
    }
    if (new_password !== confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    changePasswordMutation.mutate({ current_password, new_password })
  }

  const handleToggleMfa = () => {
    // TODO: Replace with actual MFA API call when endpoint is available
    setMfaEnabled(!mfaEnabled)
    toast.success(mfaEnabled ? 'MFA disabled' : 'MFA enabled')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and workspace preferences</p>
      </div>

      <Tabs defaultValue="profile">
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

            <TabsContent value="profile" activeValue={activeValue}>
              <Card glass>
                <CardHeader>
                  <CardTitle className="text-base">Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="John Smith"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="mr-1.5 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workspace" activeValue={activeValue}>
              <Card glass>
                <CardHeader>
                  <CardTitle className="text-base">Workspace Settings</CardTitle>
                  <CardDescription>Configure your business details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Business Name"
                      placeholder="e.g. The Grand Hotel"
                      value={workspaceForm.name || brandVoice?.company_name || ''}
                      onChange={(e) => setWorkspaceForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      label="Slug"
                      placeholder="the-grand-hotel"
                      value={workspaceForm.slug || ''}
                      onChange={(e) => setWorkspaceForm((p) => ({ ...p, slug: e.target.value }))}
                    />
                  </div>
                  <Select
                    label="Industry"
                    options={industries}
                    value={workspaceForm.industry || brandVoice?.industry || ''}
                    onChange={(v) => setWorkspaceForm((p) => ({ ...p, industry: v }))}
                    placeholder="Select industry"
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Business Description
                    </label>
                    <textarea
                      className="min-h-[100px] w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe your business..."
                      value={workspaceForm.description || brandVoice?.business_description || ''}
                      onChange={(e) => setWorkspaceForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveWorkspace} loading={updateMutation.isPending}>
                      <Save className="mr-1.5 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" activeValue={activeValue}>
              <Card glass>
                <CardHeader>
                  <CardTitle className="text-base">Notification Preferences</CardTitle>
                  <CardDescription>Control how you receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive email alerts for new reviews and replies</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={notifForm.email_notifications}
                      onClick={() => setNotifForm((p) => ({ ...p, email_notifications: !p.email_notifications }))}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        notifForm.email_notifications ? 'bg-sky-600' : 'bg-neutral-300 dark:bg-neutral-600'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                          notifForm.email_notifications && 'translate-x-5'
                        )}
                      />
                    </button>
                  </div>

                  <Select
                    label="Digest Frequency"
                    options={digestOptions}
                    value={notifForm.digest_frequency}
                    onChange={(v) => setNotifForm((p) => ({ ...p, digest_frequency: v }))}
                  />

                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveNotifications}>
                      <Save className="mr-1.5 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" activeValue={activeValue}>
              <div className="space-y-6">
                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-base">Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={securityForm.current_password}
                        onChange={(e) => setSecurityForm((p) => ({ ...p, current_password: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="New Password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={securityForm.new_password}
                        onChange={(e) => setSecurityForm((p) => ({ ...p, new_password: e.target.value }))}
                      />
                      <Input
                        label="Confirm Password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={securityForm.confirm_password}
                        onChange={(e) => setSecurityForm((p) => ({ ...p, confirm_password: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPasswords ? (
                          <><EyeOff className="h-3.5 w-3.5" /> Hide passwords</>
                        ) : (
                          <><Eye className="h-3.5 w-3.5" /> Show passwords</>
                        )}
                      </button>
                      <Button size="sm" onClick={handleChangePassword}>
                        <Save className="mr-1.5 h-4 w-4" />
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-base">Multi-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between rounded-xl border p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">MFA Protection</p>
                          <p className="text-xs text-muted-foreground">
                            {mfaEnabled ? 'Your account is protected' : 'Enable to secure your account'}
                          </p>
                        </div>
                      </div>
                      <button
                        role="switch"
                        aria-checked={mfaEnabled}
                        onClick={handleToggleMfa}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          mfaEnabled ? 'bg-sky-600' : 'bg-neutral-300 dark:bg-neutral-600'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                            mfaEnabled && 'translate-x-5'
                          )}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-base">Active Sessions</CardTitle>
                    <CardDescription>Manage your active login sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockSessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-4 transition-colors',
                          session.is_current && 'border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {session.device.includes('Mobile') ? (
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Laptop className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{session.device}</p>
                              {session.is_current && (
                                <Badge variant="success" className="text-[10px]">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {session.ip} &middot; Last active {formatRelativeTime(session.last_active)}
                            </p>
                          </div>
                        </div>
                        {!session.is_current && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="billing" activeValue={activeValue}>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card glass>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">Business</p>
                      <Badge variant="default" className="mt-2">Active</Badge>
                    </CardContent>
                  </Card>
                  <Card glass>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Monthly Spend</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">$99.00</p>
                      <p className="mt-1 text-xs text-muted-foreground">Next billing: Aug 1, 2025</p>
                    </CardContent>
                  </Card>
                  <Card glass>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">Reviews This Month</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">1,247</p>
                      <p className="mt-1 text-xs text-muted-foreground">Of 5,000 included</p>
                    </CardContent>
                  </Card>
                </div>

                <Card glass>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Invoice History</CardTitle>
                      <CardDescription>View and download your past invoices</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1.5 h-4 w-4" />
                      Download All
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockInvoices.map((inv) => (
                            <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{inv.id}</td>
                              <td className="px-4 py-3 text-muted-foreground">{inv.plan}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.date)}</td>
                              <td className="px-4 py-3 text-foreground">${inv.amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <Badge variant={inv.status === 'paid' ? 'success' : 'destructive'} className="text-[10px]">
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" className="h-8">
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
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
          </>
        )}
      </Tabs>
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
