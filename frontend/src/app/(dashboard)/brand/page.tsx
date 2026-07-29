'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import * as api from '@/lib/api'
import type { BrandVoice } from '@/types'
import { toast } from 'sonner'
import { PageTransition } from '@/components/layout/page-transition'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  RotateCcw,
  Eye,
  Mic,
  ChevronDown,
  Bot,
} from 'lucide-react'

const industryPresets = [
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Hospitality', value: 'hospitality' },
  { label: 'SaaS', value: 'saas' },
  { label: 'E-commerce', value: 'ecommerce' },
]

const industryToneMap: Record<string, { tone: string; style: string }> = {
  healthcare: { tone: 'healthcare', style: 'professional' },
  hospitality: { tone: 'hospitality', style: 'conversational' },
  saas: { tone: 'professional', style: 'concise' },
  ecommerce: { tone: 'friendly', style: 'persuasive' },
}

const writingStyles = [
  { value: 'descriptive', label: 'Descriptive' },
  { value: 'concise', label: 'Concise' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'persuasive', label: 'Persuasive' },
]

const tones = [
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'friendly', label: 'Friendly', icon: '😊' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'corporate', label: 'Corporate', icon: '🏢' },
  { value: 'formal', label: 'Formal', icon: '📋' },
  { value: 'casual', label: 'Casual', icon: '👋' },
  { value: 'empathetic', label: 'Empathetic', icon: '💛' },
  { value: 'playful', label: 'Playful', icon: '🎉' },
  { value: 'minimal', label: 'Minimal', icon: '◻️' },
  { value: 'premium', label: 'Premium', icon: '👑' },
  { value: 'hospitality', label: 'Hospitality', icon: '🏨' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

const replyLengths = [
  { value: 'short', label: 'Short', desc: '1-2 sentences' },
  { value: 'medium', label: 'Medium', desc: '2-4 sentences' },
  { value: 'long', label: 'Long', desc: '4-6 sentences' },
]

const defaultBrandVoice: Partial<BrandVoice> = {
  company_name: '',
  industry: '',
  business_description: '',
  writing_style: 'professional',
  tone: 'professional',
  language: 'en',
  reply_length: 'medium',
  greeting_style: 'Dear [Customer Name]',
  closing_style: 'Best regards',
  emoji_preference: false,
  professional_level: 3,
  personalization_level: 3,
  custom_instructions: '',
}

export default function BrandVoicePage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<BrandVoice>>(defaultBrandVoice)
  const { data: brandVoice, isLoading } = useQuery({
    queryKey: ['brand-voice'],
    queryFn: api.getBrandVoice,
  })

  useEffect(() => {
    if (brandVoice) {
      setForm(brandVoice)
    }
  }, [brandVoice])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<BrandVoice>) => api.updateBrandVoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-voice'] })
      toast.success('Brand voice saved', {
        description: 'Changes saved successfully',
        action: {
          label: 'Undo',
          onClick: () => handleReset(),
        },
        duration: 5000,
      })
    },
    onError: () => toast.error('Failed to save brand voice'),
  })

  const handleSave = () => {
    saveMutation.mutate(form)
  }

  const handleReset = () => {
    setForm(defaultBrandVoice)
  }

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const exampleReview = "The food was absolutely delicious! The service was a bit slow but the atmosphere made up for it. Will definitely come back again."

  const generatePreview = () => {
    return `${form.greeting_style || 'Dear [Customer Name]'},\n\nThank you so much for your wonderful review! We're thrilled to hear that you enjoyed the food and the atmosphere here. We appreciate your feedback about the service and will make sure to improve. Your satisfaction means the world to us, and we look forward to welcoming you back again soon!\n\n${form.closing_style || 'Best regards'},\n${form.company_name || '[Company Name]'}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Brand Voice</h2>
          <p className="text-sm text-muted-foreground">Define how your AI responds to customer reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} loading={saveMutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Industry Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {industryPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        update('industry', preset.label)
                        const mapped = industryToneMap[preset.value]
                        if (mapped) {
                          update('tone', mapped.tone)
                          update('writing_style', mapped.style)
                        }
                      }}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                        form.industry === preset.label
                          ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                          : 'border-input hover:bg-accent hover:border-foreground/20'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Company Name"
                  placeholder="e.g. The Grand Hotel"
                  value={form.company_name || ''}
                  onChange={(e) => update('company_name', e.target.value)}
                />
                <Input
                  label="Industry"
                  placeholder="e.g. Hospitality"
                  value={form.industry || ''}
                  onChange={(e) => update('industry', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Business Description
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Describe your business..."
                  value={form.business_description || ''}
                  onChange={(e) => update('business_description', e.target.value)}
                  maxLength={500}
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {(form.business_description || '').length}/500
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Writing Style & Tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Writing Style
                  </label>
                  <div className="relative">
                    <select
                      className="flex h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={form.writing_style || 'professional'}
                      onChange={(e) => update('writing_style', e.target.value)}
                    >
                      {writingStyles.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      className="flex h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={form.language || 'en'}
                      onChange={(e) => update('language', e.target.value)}
                    >
                      {languages.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => update('tone', tone.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-all',
                        form.tone === tone.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      <span className="text-lg">{tone.icon}</span>
                      <span className="font-medium">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Reply Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Reply Length
                </label>
                <div className="flex gap-2">
                  {replyLengths.map((rl) => (
                    <button
                      key={rl.value}
                      type="button"
                      onClick={() => update('reply_length', rl.value)}
                      className={cn(
                        'flex-1 rounded-xl border p-3 text-center text-sm transition-all',
                        form.reply_length === rl.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      <span className="font-medium">{rl.label}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">{rl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Greeting Style"
                  placeholder="Dear [Customer Name]"
                  value={form.greeting_style || ''}
                  onChange={(e) => update('greeting_style', e.target.value)}
                />
                <Input
                  label="Closing Style"
                  placeholder="Best regards"
                  value={form.closing_style || ''}
                  onChange={(e) => update('closing_style', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Emoji Preference</p>
                  <p className="text-xs text-muted-foreground">Allow AI to use emojis in replies</p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.emoji_preference || false}
                  onClick={() => update('emoji_preference', !form.emoji_preference)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    form.emoji_preference ? 'bg-sky-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                      form.emoji_preference && 'translate-x-5'
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Professional Level: {form.professional_level || 3}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.professional_level || 3}
                  onChange={(e) => update('professional_level', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Casual</span>
                  <span>Formal</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Personalization Level: {form.personalization_level || 3}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.personalization_level || 3}
                  onChange={(e) => update('personalization_level', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Generic</span>
                  <span>Highly Personalized</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Custom Instructions
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add any specific instructions for the AI..."
                  value={form.custom_instructions || ''}
                  onChange={(e) => update('custom_instructions', e.target.value)}
                  maxLength={1000}
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {(form.custom_instructions || '').length}/1000
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card glass className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
              <CardDescription>Example reply based on your settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mic className="h-3 w-3" />
                  Example review
                </p>
                <p className="mt-1 text-xs">{exampleReview}</p>
              </div>

              <Separator />

              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                <p className="flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                  <Bot className="h-3 w-3" />
                  AI Reply
                </p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{generatePreview()}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {tones.find((t) => t.value === form.tone)?.label || 'Professional'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {writingStyles.find((s) => s.value === form.writing_style)?.label || 'Professional'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {replyLengths.find((l) => l.value === form.reply_length)?.label || 'Medium'}
                </Badge>
                {form.emoji_preference && (
                  <Badge variant="outline" className="text-[10px]">Emoji</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
    </PageTransition>
  )
}
