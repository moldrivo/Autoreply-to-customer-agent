'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  Smile,
  Sparkles,
  Building2,
  FileText,
  Hand,
  Heart,
  PartyPopper,
  Minus,
  Crown,
  Hotel,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'

export interface ToneOption {
  value: string
  label: string
  description: string
  icon: string
  example?: string
}

interface ToneSelectorProps {
  value: string
  onChange: (_value: string) => void
  options: ToneOption[]
  usageCounts?: Record<string, number>
}

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Smile,
  Sparkles,
  Building2,
  FileText,
  Hand,
  Heart,
  PartyPopper,
  Minus,
  Crown,
  Hotel,
  Stethoscope,
}

const exampleReplies: Record<string, string> = {
  professional: 'Thank you for your valuable feedback. We take your concerns seriously and will address them promptly.',
  friendly: 'Hey, thanks so much for stopping by! We really appreciate your kind words and can\'t wait to see you again!',
  luxury: 'We are truly honored by your gracious review. It is our privilege to provide you with an exceptional experience.',
  corporate: 'We appreciate you taking the time to share your experience. Your feedback has been forwarded to our management team.',
  formal: 'We respectfully acknowledge your comments and assure you that the necessary actions will be taken.',
  casual: 'Thanks a bunch! So glad you had a great time with us. Come back soon!',
  empathetic: 'We are so sorry to hear about your experience. Your feelings are completely valid, and we want to make this right.',
  playful: 'Woohoo! You just made our day! Thanks for the awesome review - you\'re the best!',
  minimal: 'Thank you. We appreciate your feedback.',
  premium: 'We are delighted by your generous review. Excellence is our standard, and you deserve nothing less.',
  hospitality: 'Thank you for choosing us. It was our pleasure to serve you, and we hope to welcome you back soon.',
  healthcare: 'Your health and comfort are our top priorities. Thank you for trusting us with your care.',
}

export function ToneSelector({ value, onChange, options, usageCounts = {} }: ToneSelectorProps) {
  const [hoveredTone, setHoveredTone] = useState<string | null>(null)
  const maxUsage = Math.max(...Object.values(usageCounts), 1)

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {options.map((tone) => {
        const Icon = iconMap[tone.icon] || Briefcase
        const isActive = value === tone.value
        const isHovered = hoveredTone === tone.value
        const usage = usageCounts[tone.value] || 0
        const isMostUsed = usage > 0 && usage === maxUsage && maxUsage > 1

        return (
          <motion.button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            onMouseEnter={() => setHoveredTone(tone.value)}
            onMouseLeave={() => setHoveredTone(null)}
            layoutId={`tone-${tone.value}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                : 'border-input hover:bg-accent hover:border-muted-foreground/30 text-muted-foreground'
            )}
            aria-label={`${tone.label} tone${tone.description ? ` - ${tone.description}` : ''}`}
            aria-pressed={isActive}
            tabIndex={0}
          >
            {isActive && (
              <motion.div
                layoutId="tone-active-bg"
                className="absolute inset-0 rounded-xl bg-sky-50 dark:bg-sky-950/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {isMostUsed && (
              <Badge className="absolute -right-1.5 -top-1.5 z-20 text-[8px] px-1 py-0 bg-sky-500" aria-label="Most used tone">
                Top
              </Badge>
            )}
            <div
              className={cn(
                'relative z-10 rounded-lg p-2 transition-colors',
                isActive
                  ? 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </div>
            <span className="relative z-10 font-medium text-center">{tone.label}</span>
            {tone.description && (
              <span className="relative z-10 text-[10px] text-center leading-tight opacity-70">
                {tone.description}
              </span>
            )}
            {usage > 0 && (
              <div className="relative z-10 mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(usage / maxUsage) * 100}%` }}
                  className="h-full rounded-full bg-sky-400"
                />
              </div>
            )}

            <AnimatePresence>
              {isHovered && exampleReplies[tone.value] && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
                >
                  <p className="font-medium mb-1">{tone.label} example:</p>
                  <p className="leading-relaxed opacity-80">&ldquo;{exampleReplies[tone.value]}&rdquo;</p>
                  <div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b bg-popover" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
