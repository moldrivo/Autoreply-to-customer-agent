'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Search,
  Star,
  X,
  SlidersHorizontal,
  Filter,
  Bookmark,
  Save,
  Trash2,
} from 'lucide-react'

interface FilterPreset {
  name: string
  sentiment: string
  platform: string
  rating: number
  riskLevel: string
  dateRange: string
}

interface FiltersBarProps {
  search: string
  onSearchChange: (_v: string) => void
  sentiment: string
  onSentimentChange: (_v: string) => void
  platform: string
  onPlatformChange: (_v: string) => void
  rating: number
  onRatingChange: (_v: number) => void
  riskLevel: string
  onRiskLevelChange: (_v: string) => void
  dateRange: string
  onDateRangeChange: (_v: string) => void
  onClear: () => void
  hasFilters: boolean
  activeFilterCount?: number
}

const sentimentOptions = [
  { value: '', label: 'All Sentiments' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'very_negative', label: 'Very Negative' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'spam', label: 'Spam' },
  { value: 'toxic', label: 'Toxic' },
  { value: 'fake', label: 'Fake' },
]

const platformOptions = [
  { value: '', label: 'All Platforms' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'trustpilot', label: 'Trustpilot' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'app_store', label: 'App Store' },
  { value: 'play_store', label: 'Play Store' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking' },
]

const riskOptions = [
  { value: '', label: 'All Risk Levels' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const dateRangeOptions = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
]

export function FiltersBar({
  search,
  onSearchChange,
  sentiment,
  onSentimentChange,
  platform,
  onPlatformChange,
  rating,
  onRatingChange,
  riskLevel,
  onRiskLevelChange,
  dateRange,
  onDateRangeChange,
  onClear,
  hasFilters,
  activeFilterCount = 0,
}: FiltersBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [showSavePreset, setShowSavePreset] = useState(false)

  const applyPreset = (preset: FilterPreset) => {
    onSentimentChange(preset.sentiment)
    onPlatformChange(preset.platform)
    onRatingChange(preset.rating)
    onRiskLevelChange(preset.riskLevel)
    onDateRangeChange(preset.dateRange)
  }

  const removePreset = (index: number) => {
    setPresets((p) => p.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search reviews"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <Badge variant="secondary" className="text-xs gap-1" aria-label={`${activeFilterCount} active filters`}>
                <Filter className="h-3 w-3" />
                {activeFilterCount}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {(mobileOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Select
                  options={sentimentOptions}
                  value={sentiment}
                  onChange={onSentimentChange}
                  placeholder="Sentiment"
                  className="min-w-[140px]"
                />

                <Select
                  options={platformOptions}
                  value={platform}
                  onChange={onPlatformChange}
                  placeholder="Platform"
                  className="min-w-[140px]"
                />

                <Select
                  options={riskOptions}
                  value={riskLevel}
                  onChange={onRiskLevelChange}
                  placeholder="Risk Level"
                  className="min-w-[140px]"
                />

                <div className="flex items-center gap-1" role="group" aria-label="Rating filter">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onRatingChange(star === rating ? 0 : star)}
                      className="transition-colors hover:scale-110"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-300'
                        )}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-lg border p-0.5" role="group" aria-label="Date range">
                  {dateRangeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onDateRangeChange(opt.value)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        dateRange === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-label={opt.label}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {hasFilters && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Clear all filters"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Clear
                      </Button>
                    </motion.div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSavePreset(!showSavePreset)}
                    className="text-xs"
                    aria-label="Save filter preset"
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>

              {presets.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Bookmark className="h-3 w-3 text-muted-foreground" />
                  {presets.map((preset, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer text-[10px] gap-1 group"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                      <button
                        onClick={(e) => { e.stopPropagation(); removePreset(i) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove preset ${preset.name}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
