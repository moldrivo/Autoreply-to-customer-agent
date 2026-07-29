'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatDate, sentimentColor, riskColor } from '@/lib/utils'
import * as api from '@/lib/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Star,
  Bot,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Flag,
  Trash2,
  Edit3,
} from 'lucide-react'

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const reviewId = params.id as string

  const [editedContent, setEditedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const { data: review, isLoading } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => api.getReview(reviewId),
  })

  const replyId = review?.reply?.id

  const generateMutation = useMutation({
    mutationFn: () => api.generateReply(reviewId),
    onSuccess: (reply) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setEditedContent(reply.content)
      toast.success('Reply generated')
    },
    onError: () => toast.error('Failed to generate reply'),
  })

  const updateMutation = useMutation({
    mutationFn: (content: string) => {
      if (!replyId) throw new Error('No reply to update')
      return api.updateReply(replyId, content)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setIsEditing(false)
      toast.success('Reply updated')
    },
    onError: () => toast.error('Failed to update reply'),
  })

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!replyId) throw new Error('No reply to approve')
      return api.approveReply(replyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setShowApproveDialog(false)
      toast.success('Reply approved')
    },
    onError: () => toast.error('Failed to approve reply'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!replyId) throw new Error('No reply to reject')
      return api.rejectReply(replyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setShowRejectDialog(false)
      toast.success('Reply rejected')
    },
    onError: () => toast.error('Failed to reject reply'),
  })

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!replyId) throw new Error('No reply to publish')
      return api.publishReply(replyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setShowPublishDialog(false)
      toast.success('Reply published!')
    },
    onError: () => toast.error('Failed to publish reply'),
  })

  const flagMutation = useMutation({
    mutationFn: (reason: string) => api.flagReview(reviewId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      setShowFlagDialog(false)
      setFlagReason('')
      toast.success('Review flagged')
    },
    onError: () => toast.error('Failed to flag review'),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Review not found</p>
        <Button variant="link" onClick={() => router.push('/reviews')}>Back to reviews</Button>
      </div>
    )
  }

  const r = review

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-6"
    >
      <button
        onClick={() => router.push('/reviews')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </button>

      <Card glass>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{r.customer_name}</CardTitle>
              <Badge className={cn(sentimentColor(r.sentiment))}>{r.sentiment}</Badge>
              <Badge variant="outline" className={cn('border', riskColor(r.risk_level))}>{r.risk_level}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {r.platform.replace('_', ' ')} &middot; {r.language} &middot; {formatDate(r.review_date)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-5 w-5',
                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                )}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.review_text}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-sm font-medium">{Math.round(r.sentiment_confidence * 100)}%</p>
              <Progress value={Math.round(r.sentiment_confidence * 100)} className="mt-1 h-1.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Auto-Replied</p>
              <p className="text-sm font-medium">{r.is_auto_replied ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Human Review</p>
              <p className="text-sm font-medium">{r.needs_human_review ? 'Required' : 'Not needed'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Replied At</p>
              <p className="text-sm font-medium">{r.replied_at ? formatDate(r.replied_at) : 'Not yet'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowFlagDialog(true); setFlagReason('') }}
            >
              <Flag className="mr-1.5 h-4 w-4" />
              {r.is_flagged ? 'Flagged' : 'Flag'}
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Reply
            </CardTitle>
            {!r.reply && (
              <Button
                size="sm"
                loading={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
              >
                <Bot className="mr-1.5 h-4 w-4" />
                Generate Reply
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {r.reply ? (
            <>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate(editedContent)}>
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.reply.content}</p>
                </div>
              )}

              {!isEditing && r.reply.quality_score != null && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Quality</span>
                      <span>{r.reply.quality_score}%</span>
                    </div>
                    <Progress value={r.reply.quality_score} className="mt-1 h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Safety</span>
                      <span>{r.reply.safety_score}%</span>
                    </div>
                    <Progress value={r.reply.safety_score ?? 0} className="mt-1 h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence</span>
                      <span>{r.reply.confidence_score}%</span>
                    </div>
                    <Progress value={r.reply.confidence_score ?? 0} className="mt-1 h-2" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={r.reply.status === 'approved' ? 'success' : r.reply.status === 'published' ? 'default' : 'warning'}>
                  {r.reply.status}
                </Badge>
                {r.reply.is_ai_generated && <Badge variant="outline">AI Generated</Badge>}
                {r.reply.human_edited && <Badge variant="secondary">Human Edited</Badge>}
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                {r.reply.status !== 'approved' && r.reply.status !== 'published' && (
                  <>
                    <Button size="sm" onClick={() => setShowApproveDialog(true)}>
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)}>
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {r.reply.status === 'approved' && (
                  <Button size="sm" onClick={() => setShowPublishDialog(true)}>
                    <Send className="mr-1.5 h-4 w-4" />
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => { setEditedContent(r.reply!.content); setIsEditing(true) }}>
                  <Edit3 className="mr-1.5 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateMutation.mutate()}
                  loading={generateMutation.isPending}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No reply generated yet. Click "Generate Reply" to create an AI-powered response.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reply</DialogTitle>
            <DialogDescription>This will mark the reply as approved and ready for publishing.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={() => approveMutation.mutate()}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reply</DialogTitle>
            <DialogDescription>This will discard the current generated reply.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Reply</DialogTitle>
            <DialogDescription>This will publish the reply to the original platform.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button onClick={() => publishMutation.mutate()}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{r.is_flagged ? 'Update Flag' : 'Flag Review'}</DialogTitle>
            <DialogDescription>Provide a reason for flagging this review.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Flag reason..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => flagMutation.mutate(flagReason || 'Flagged by user')}
            >
              Flag Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
