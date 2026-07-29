'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bot, Mic, Eye, User, Target } from 'lucide-react'

interface BrandSettings {
  company_name?: string
  tone?: string
  writing_style?: string
  reply_length?: string
  greeting_style?: string
  closing_style?: string
  emoji_preference?: boolean
  professional_level?: number
  personalization_level?: number
  language?: string
  custom_instructions?: string
}

interface ReplyPreviewProps {
  brandSettings: BrandSettings
  reviewText: string
}

const toneLabels: Record<string, string> = {
  professional: 'Professional',
  friendly: 'Friendly',
  luxury: 'Luxury',
  corporate: 'Corporate',
  formal: 'Formal',
  casual: 'Casual',
  empathetic: 'Empathetic',
  playful: 'Playful',
  minimal: 'Minimal',
  premium: 'Premium',
  hospitality: 'Hospitality',
  healthcare: 'Healthcare',
}

const sampleReplies: Record<string, string> = {
  professional:
    'Thank you for taking the time to share your feedback. We truly appreciate your kind words and are delighted to hear that you had a positive experience. Your satisfaction is our top priority, and we look forward to serving you again in the future.',
  friendly:
    'Thanks so much for your awesome review! 😊 We\'re so happy you loved your experience with us. Can\'t wait to see you again soon!',
  luxury:
    'We are sincerely grateful for your gracious review. It was our absolute pleasure to provide you with an exceptional experience, and we remain dedicated to upholding the highest standards of excellence.',
  empathetic:
    'Thank you for sharing your experience with us. We truly appreciate your honesty, and we\'re sorry we didn\'t meet your expectations. Your feedback helps us improve, and we hope to have the chance to make it right.',
  casual:
    'Hey, thanks for the review! So glad you had a good time. Come back and see us again soon! 🙌',
  formal:
    'We wish to express our sincere gratitude for your thoughtful review. Your feedback is invaluable, and we remain committed to providing exceptional service to all our valued customers.',
  playful:
    'Woohoo! 🎉 Thank you for the amazing review! You just made our day! We\'re doing a happy dance over here and can\'t wait to welcome you back!',
}

export function ReplyPreview({ brandSettings, reviewText }: ReplyPreviewProps) {
  const preview = useMemo(() => {
    const tone = brandSettings.tone || 'professional'
    const base = sampleReplies[tone] || sampleReplies.professional
    const greeting = brandSettings.greeting_style || 'Dear [Customer Name]'
    const closing = brandSettings.closing_style || 'Best regards'
    const company = brandSettings.company_name || '[Company Name]'
    const useEmoji = brandSettings.emoji_preference

    let body = base
    if (tone === 'friendly' || tone === 'playful' || tone === 'casual') {
      if (useEmoji && !body.includes('😊')) body = body.replace(/\./, '! 😊')
    }

    const customerName = reviewText ? reviewText.split(' ').slice(0, 2).join(' ') : 'Valued Customer'
    const personalizedGreeting = greeting.replace('[Customer Name]', customerName)

    return `${personalizedGreeting}\n\n${body}\n\n${closing},\n${company}`
  }, [brandSettings, reviewText])

  return (
    <Card glass>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-primary" />
          Live Preview
        </CardTitle>
        <CardDescription>Reply preview based on your brand settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            Customer Review
          </p>
          <p className="mt-1 text-xs leading-relaxed">{reviewText || 'No review text provided...'}</p>
        </div>

        <Separator />

        <motion.div
          key={preview}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20"
        >
          <p className="flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
            <Bot className="h-3 w-3" />
            AI Reply
          </p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{preview}</p>
        </motion.div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            <Target className="h-2.5 w-2.5" />
            {toneLabels[brandSettings.tone || 'professional'] || 'Professional'}
          </Badge>
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            <User className="h-2.5 w-2.5" />
            Personalization: {brandSettings.personalization_level || 3}/5
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {brandSettings.writing_style || 'Professional'}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {brandSettings.reply_length || 'Medium'}
          </Badge>
          {brandSettings.emoji_preference && (
            <Badge variant="outline" className="text-[10px]">
              Emoji Allowed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
