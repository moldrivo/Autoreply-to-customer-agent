'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { cn, formatRelativeTime, truncate, sentimentColor } from '@/lib/utils'
import * as api from '@/lib/api'
import { ReviewCard } from '@/components/reviews/review-card'
import { FiltersBar } from '@/components/reviews/filters-bar'
import { PageTransition } from '@/components/layout/page-transition'

import {
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Flag,
  Bot,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

type SortField = 'created_at' | 'rating' | 'sentiment'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const fadeItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function ReviewsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])
  const [sentiment, setSentiment] = useState('')
  const [platform, setPlatform] = useState('')
  const [rating, setRating] = useState(0)
  const [riskLevel, setRiskLevel] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const showNewIndicator = false

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, debouncedSearch, sentiment, platform, rating, riskLevel, sortBy, sortOrder],
    queryFn: () =>
      api.getReviews({
        page,
        page_size: 12,
        search: debouncedSearch || undefined,
        sentiment: sentiment || undefined,
        platform: platform || undefined,
        rating: rating || undefined,
        risk_level: riskLevel || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  })

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSentiment('')
    setPlatform('')
    setRating(0)
    setRiskLevel('')
    setPage(1)
  }

  const hasFilters = !!(search || sentiment || platform || rating || riskLevel)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data?.items) return
    if (selected.size === data.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.items.map((r) => r.id)))
    }
  }

  const loadMore = () => {
    if (data && page < data.total_pages) {
      setPage((p) => p + 1)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!data?.items.length) return
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    const items = data.items
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault()
      router.push(`/reviews/${items[focusedIndex].id}`)
    }
  }, [data, focusedIndex, router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium transition-colors',
        sortBy === field ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {sortBy === field ? (
        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  )

  const activeFilterCount = [search, sentiment, platform, riskLevel, rating ? 'rating' : ''].filter(Boolean).length

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">Reviews</h2>
            {data && (
              <Badge variant="secondary" className="text-sm" aria-label={`${data.total} total reviews`}>
                {data.total}
              </Badge>
            )}
            {showNewIndicator && (
              <Badge variant="success" className="text-[10px] animate-pulse">
                <span className="relative flex h-1.5 w-1.5 mr-1">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-0.5" role="radiogroup" aria-label="View mode">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('rounded-md p-1.5 transition-colors', viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
                aria-label="Grid view"
                role="radio"
                aria-checked={viewMode === 'grid'}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
                aria-label="List view"
                role="radio"
                aria-checked={viewMode === 'list'}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" size="sm" aria-label="Export reviews">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <FiltersBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          sentiment={sentiment}
          onSentimentChange={(v) => { setSentiment(v); setPage(1) }}
          platform={platform}
          onPlatformChange={(v) => { setPlatform(v); setPage(1) }}
          rating={rating}
          onRatingChange={(v) => { setRating(v); setPage(1) }}
          riskLevel={riskLevel}
          onRiskLevelChange={(v) => { setRiskLevel(v); setPage(1) }}
          dateRange=""
          onDateRangeChange={() => {}}
          onClear={clearFilters}
          hasFilters={hasFilters}
          activeFilterCount={activeFilterCount}
        />

        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border bg-primary/5 p-3"
          >
            <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Flag className="mr-1 h-3 w-3" />
                Flag Selected
              </Button>
              <Button size="sm" variant="default" className="h-8 text-xs">
                <Bot className="mr-1 h-3 w-3" />
                Generate Replies
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
          <SortButton field="created_at" label="Date" />
          <SortButton field="rating" label="Rating" />
          <SortButton field="sentiment" label="Sentiment" />
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Use <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">j</kbd> <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">k</kbd> to navigate
          </span>
        </div>

        {isLoading ? (
          <div className={cn('grid gap-4', viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : !data?.items.length ? (
          <Card className="py-16 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No reviews found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or connect a new platform.</p>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {data?.items.map((review, idx) => (
                  <motion.div key={review.id} variants={fadeItem}>
                    <div className="relative">
                      <label className="absolute left-3 top-3 z-10 flex h-5 w-5 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selected.has(review.id)}
                          onChange={() => toggleSelect(review.id)}
                          className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                          aria-label={`Select review by ${review.customer_name}`}
                        />
                      </label>
                      <Link
                        href={`/reviews/${review.id}`}
                        className={cn(
                          focusedIndex === idx && 'ring-2 ring-sky-400 rounded-2xl'
                        )}
                      >
                        <ReviewCard review={review} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b" role="row">
                  <div className="flex items-center gap-2 col-span-2" role="columnheader">
                    <input
                      type="checkbox"
                      checked={data.items.length > 0 && selected.size === data.items.length}
                      onChange={toggleSelectAll}
                      className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                      aria-label="Select all reviews"
                    />
                    Customer
                  </div>
                  <div role="columnheader">Platform</div>
                  <div role="columnheader">Rating</div>
                  <div role="columnheader">Sentiment</div>
                  <div role="columnheader">Status</div>
                </div>
                {data.items.map((review, idx) => (
                  <div
                    key={review.id}
                    className={cn(
                      'grid sm:grid-cols-6 gap-4 items-center rounded-xl border p-4 transition-all hover:bg-accent/50',
                      focusedIndex === idx && 'ring-2 ring-sky-400',
                      selected.has(review.id) && 'bg-primary/5 border-primary/30'
                    )}
                    role="row"
                  >
                    <div className="flex items-center gap-3 col-span-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(review.id)}
                        onChange={() => toggleSelect(review.id)}
                        className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500 shrink-0"
                        aria-label={`Select ${review.customer_name}`}
                      />
                      <Link href={`/reviews/${review.id}`} className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{review.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{truncate(review.review_text, 60)}</p>
                      </Link>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground hidden sm:block">{review.platform.replace('_', ' ')}</span>
                    <div className="flex items-center gap-0.5 hidden sm:flex" aria-label={`${review.rating} stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('h-3 w-3', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600')} />
                      ))}
                    </div>
                    <Badge className={cn('text-[10px] w-fit hidden sm:block', sentimentColor(review.sentiment))} aria-label={`Sentiment: ${review.sentiment}`}>
                      {review.sentiment.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatRelativeTime(review.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {page < data.total_pages && (
              <Button variant="ghost" size="sm" onClick={loadMore} aria-label="Load more reviews">
                Load More
              </Button>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
