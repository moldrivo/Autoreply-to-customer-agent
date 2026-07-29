'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, sentimentColor, riskColor } from '@/lib/utils'
import type { Review } from '@/types'
import {
  Star,
  Bot,
  Flag,
  Eye,
  ChevronDown,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react'

interface ReviewCardProps {
  review: Review
  onGenerate?: (_id: string) => void
  onFlag?: (_id: string) => void
  onView?: (_id: string) => void
  loading?: boolean
  selected?: boolean
}

const platformIcons: Record<string, string> = {
  google: 'G',
  facebook: 'F',
  trustpilot: 'T',
  yelp: 'Y',
  shopify: 'S',
  amazon: 'A',
  app_store: 'AS',
  play_store: 'PS',
  airbnb: 'AB',
  booking: 'B',
}

const platformColors: Record<string, string> = {
  google: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  facebook: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  trustpilot: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  yelp: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800',
  shopify: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  amazon: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
}

const platformBorders: Record<string, string> = {
  google: 'border-l-blue-500',
  facebook: 'border-l-sky-500',
  trustpilot: 'border-l-emerald-500',
  yelp: 'border-l-red-500',
  shopify: 'border-l-emerald-500',
  amazon: 'border-l-amber-500',
}

function ConfidenceRadial({ value, size = 48 }: { value: number; size?: number }) {
  const radius = size / 2 - 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums" style={{ color }}>
        {Math.round(value)}%
      </span>
    </div>
  )
}

export function ReviewCard({ review, onGenerate, onFlag, onView, loading, selected }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [focused, setFocused] = useState(false)

  const r = review
  const MAX_LENGTH = 150
  const needsTruncation = r.review_text.length > MAX_LENGTH
  const displayText = expanded ? r.review_text : r.review_text.slice(0, MAX_LENGTH)

  const getReplyStatus = () => {
    if (!r.reply) return { label: 'Pending', variant: 'warning' as const, icon: Clock, color: 'text-amber-500' }
    if (r.reply.status === 'published') return { label: 'Published', variant: 'success' as const, icon: CheckCircle2, color: 'text-emerald-500' }
    if (r.reply.status === 'draft') return { label: 'Draft', variant: 'outline' as const, icon: MessageSquare, color: 'text-muted-foreground' }
    return { label: 'Pending', variant: 'warning' as const, icon: Send, color: 'text-amber-500' }
  }

  const status = getReplyStatus()
  const StatusIcon = status.icon

  const confidencePct = Math.round(r.sentiment_confidence * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
    >
      <Card
        glass
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-l-4 outline-none',
          platformBorders[r.platform] || 'border-l-border',
          selected && 'ring-2 ring-primary ring-offset-2',
          focused && 'ring-2 ring-sky-400 ring-offset-2'
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold border',
                  platformColors[r.platform] || 'bg-muted text-muted-foreground border-border'
                )}
              >
                {platformIcons[r.platform] || r.platform.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.customer_name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {r.platform.replace('_', ' ')} &middot; {formatRelativeTime(r.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < r.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-300 dark:text-neutral-600'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {displayText}
              {!expanded && needsTruncation && '...'}
            </p>
            <AnimatePresence>
              {needsTruncation && (
                <motion.button
                  key="expand-btn"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  aria-label={expanded ? 'Show less' : 'Show more'}
                >
                  <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                    <ChevronDown className="h-3 w-3" />
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={cn('text-[10px]', sentimentColor(r.sentiment))} aria-label={`Sentiment: ${r.sentiment}`}>
              {r.sentiment.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-[10px] border', riskColor(r.risk_level))}
              aria-label={`Risk level: ${r.risk_level}`}
            >
              {r.risk_level}
            </Badge>
            {r.needs_human_review && (
              <Badge variant="warning" className="text-[10px]">
                Needs Review
              </Badge>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {r.sentiment_confidence > 0 && (
              <div className="flex items-center gap-2">
                <ConfidenceRadial value={confidencePct} size={36} />
                <span className="text-[10px] text-muted-foreground">confidence</span>
              </div>
            )}
            <div className={cn('flex items-center gap-1', !r.sentiment_confidence && 'ml-auto')}>
              <StatusIcon className={cn('h-3 w-3', status.color)} />
              <Badge variant={status.variant} className="text-[10px]" aria-label={`Reply status: ${status.label}`}>
                {status.label}
              </Badge>
            </div>
          </div>

          {r.sentiment_confidence > 0 && (
            <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  confidencePct >= 80 ? 'bg-emerald-500' : confidencePct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )}
              />
            </div>
          )}

          <motion.div
            initial={false}
            animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : 4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'mt-3 flex items-center gap-2 border-t pt-3',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            {!r.reply && (
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs"
                onClick={() => onGenerate?.(r.id)}
                disabled={loading}
                aria-label="Generate AI reply"
              >
                <Bot className="mr-1 h-3.5 w-3.5" />
                Generate Reply
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onView?.(r.id)}
              aria-label="View details"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn('h-8 text-xs', r.is_flagged && 'text-red-500')}
              onClick={() => onFlag?.(r.id)}
              aria-label={r.is_flagged ? 'Unflag review' : 'Flag review'}
            >
              <Flag className="mr-1 h-3.5 w-3.5" />
              {r.is_flagged ? 'Flagged' : 'Flag'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
