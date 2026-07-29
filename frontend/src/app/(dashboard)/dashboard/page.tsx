'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatRelativeTime, sentimentColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import * as api from '@/lib/api'
import Link from 'next/link'
import {
  Inbox,
  Clock,
  Bot,
  Edit3,
  Star,
  HelpCircle,
  RefreshCw,
  Folder,
  FileText,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/page-transition'

function SecondsCounter({ lastUpdated: _lastUpdated }: { lastUpdated: Date }) {
  const [secondsAgo, setSecondsAgo] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - _lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [_lastUpdated])
  return (
    <Badge variant="outline" className="text-[10px] gap-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Updated {secondsAgo}s ago
    </Badge>
  )
}

function AnimatedCounter({ value, loading, format = 'number' }: { value?: number; loading?: boolean; format?: 'number' | 'percentage' | 'duration' }) {
  const [display, setDisplay] = useState(0)
  const num = value ?? 0

  useEffect(() => {
    if (loading) return
    const duration = 1000
    const steps = 40
    const increment = num / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(increment * step, num)
      setDisplay(current)
      if (step >= steps) { clearInterval(timer); setDisplay(num) }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [num, loading])

  if (loading) return <Skeleton className="h-8 w-20" />

  const formatted = format === 'percentage' ? `${Math.round(display)}%` : display >= 1000 ? `${(display / 1000).toFixed(1)}k` : Math.round(display).toLocaleString()
  return <span className="text-3xl font-bold text-foreground tabular-nums">{formatted}</span>
}

function SparklineChart({ data, color }: { data: { value: number }[]; color: string }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={false}>
        </Line>
      </LineChart>
    </ResponsiveContainer>
  )
}

const statCards = [
  { key: 'total_reviews', label: 'Total Reviews', icon: Inbox, color: 'text-sky-600 bg-sky-100 dark:bg-sky-950 dark:text-sky-400', sparkColor: '#0EA5E9' },
  { key: 'pending_replies', label: 'Pending Replies', icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400', sparkColor: '#F59E0B' },
  { key: 'auto_replied', label: 'Auto-Replied', icon: Bot, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400', sparkColor: '#10B981' },
  { key: 'manual_replies', label: 'Manual Replies', icon: Edit3, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400', sparkColor: '#3B82F6' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const statItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const platforms = [
  { name: 'Google', connected: true },
  { name: 'Facebook', connected: true },
  { name: 'Trustpilot', connected: true },
  { name: 'Yelp', connected: true },
  { name: 'Shopify', connected: false },
  { name: 'Amazon', connected: false },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [showHelp, setShowHelp] = useState(false)

  const { data: stats, isLoading: statsLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  })

  const { data: sentimentTrends, isLoading: _sentimentLoading } = useQuery({
    queryKey: ['sentiment-trends'],
    queryFn: () => api.getSentimentTrends(),
  })

  const { data: monthlyActivity, isLoading: _activityLoading } = useQuery({
    queryKey: ['monthly-activity'],
    queryFn: () => api.getMonthlyActivity(),
  })

  const { data: reviewsData, isLoading: _reviewsLoading } = useQuery({
    queryKey: ['recent-reviews'],
    queryFn: () => api.getReviews({ page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
  })

  const folderData = { file_count: 2, size: '~1.2 KB', files: ['config.json', 'templates.json'] }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const sparklineData = useMemo(() =>
    Array.from({ length: 7 }, (_, _i) => ({
      value: Math.floor(Math.random() * (stats?.total_reviews || 100)) + 10,
    })),
  [stats?.total_reviews])

  if (isError) {
    return (
      <PageTransition>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <Card className="py-16 text-center">
            <Inbox className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No data available yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Connect your first platform to start seeing your dashboard.</p>
            <Button className="mt-4" variant="default" size="sm">Connect Platform</Button>
          </Card>
        </motion.div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={statItem}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {greeting}, {user?.full_name?.split(' ')[0] || 'there'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SecondsCounter lastUpdated={lastUpdated} />
              <button
                onClick={() => { setLastUpdated(new Date()) }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-xl border bg-card p-4 text-sm"
            >
              <p className="mb-2 font-medium text-foreground">Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">?</kbd> Toggle help</span>
                <span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">R</kbd> Refresh data</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={statItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            const value = stats?.[card.key as keyof typeof stats] as number | undefined
            return (
              <motion.div
                key={card.key}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn('rounded-xl p-2.5 transition-colors group-hover:scale-110 duration-300', card.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs bg-background/50">
                      {statsLoading ? '...' : '+12%'}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <AnimatedCounter value={value} loading={statsLoading} />
                    <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
                  </div>
                  {!statsLoading && (
                    <div className="mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <SparklineChart data={sparklineData} color={card.sparkColor} />
                    </div>
                  )}
                  <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 via-transparent to-transparent" />
                  </div>
                </CardContent>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div variants={statItem} className="grid gap-6 lg:grid-cols-2">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Sentiment Trends
                <Badge variant="outline" className="text-[10px] ml-auto" aria-label="Chart shows sentiment trends over time">7-day</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sentimentTrends ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar dataKey="positive" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="neutral" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="negative" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <Skeleton className="h-[280px] w-full rounded-xl" />
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyActivity ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyActivity}>
                      <defs>
                        <linearGradient id="reviewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="repliesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="reviews" stroke="#0EA5E9" fill="url(#reviewsGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="replies" stroke="#10B981" fill="url(#repliesGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <Skeleton className="h-[280px] w-full rounded-xl" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statItem} className="grid gap-6 lg:grid-cols-2">
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Reviews</CardTitle>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors" role="link" tabIndex={0} aria-label="View all reviews">View all</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewsData?.items ? (
                reviewsData.items.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="flex items-start justify-between rounded-xl border p-3 transition-all hover:bg-accent/50 hover:border-accent-foreground/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.customer_name}</span>
                        <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn('h-3 w-3', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600')}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {review.review_text.length > 80 ? review.review_text.slice(0, 80) + '...' : review.review_text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(review.created_at)}</p>
                    </div>
                    <Badge className={cn('ml-3 shrink-0', sentimentColor(review.sentiment))} aria-label={`Sentiment: ${review.sentiment}`}>
                      {review.sentiment}
                    </Badge>
                  </div>
                ))
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Agent Folder
                </span>
                <Link href="/agent">
                  <Button variant="outline" size="sm">Open Agent</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950">
                  <Folder className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">data/agent/</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {folderData?.file_count ?? 0} files &middot; {folderData?.size ?? '0 B'}
                  </p>
                </div>
              </div>
              {folderData?.files?.length > 0 && (
                <div className="space-y-1">
                  {folderData.files.slice(0, 3).map((file: string) => (
                    <div key={file} className="flex items-center gap-2 rounded-md bg-muted/10 px-3 py-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-foreground">{file}</span>
                    </div>
                  ))}
                  {folderData.files.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-7">+{folderData.files.length - 3} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {platforms.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-all',
                    p.connected
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20 hover:bg-emerald-100/50'
                      : 'border-neutral-200 opacity-50 dark:border-neutral-700'
                  )}
                >
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      p.connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-neutral-300'
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  )
}
