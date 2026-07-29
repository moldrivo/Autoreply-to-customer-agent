'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { Review, Reply, PaginatedResponse } from '@/types'

interface ReviewFilters {
  page?: number
  page_size?: number
  sentiment?: string
  platform?: string
  rating?: number
  risk_level?: string
  search?: string
  sort_by?: string
  sort_order?: string
  date_from?: string
  date_to?: string
}

export function useReviews(filters: ReviewFilters = {}) {
  return useQuery<PaginatedResponse<Review>>({
    queryKey: ['reviews', filters],
    queryFn: () => api.getReviews(filters),
  })
}

export function useReview(id: string) {
  return useQuery<Review>({
    queryKey: ['review', id],
    queryFn: () => api.getReview(id),
    enabled: !!id,
  })
}

export function useGenerateReply() {
  const queryClient = useQueryClient()
  return useMutation<Reply, Error, string>({
    mutationFn: (reviewId: string) => api.generateReply(reviewId),
    onSuccess: (_data, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useApproveReply() {
  const queryClient = useQueryClient()
  return useMutation<Reply, Error, string>({
    mutationFn: (replyId: string) => api.approveReply(replyId),
    onSuccess: (_data, _replyId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useRejectReply() {
  const queryClient = useQueryClient()
  return useMutation<Reply, Error, string>({
    mutationFn: (replyId: string) => api.rejectReply(replyId),
    onSuccess: (_data, _replyId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function usePublishReply() {
  const queryClient = useQueryClient()
  return useMutation<Reply, Error, string>({
    mutationFn: (replyId: string) => api.publishReply(replyId),
    onSuccess: (_data, _replyId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useRegenerateReply() {
  const queryClient = useQueryClient()
  return useMutation<Reply, Error, string>({
    mutationFn: (replyId: string) => api.regenerateReply(replyId),
    onSuccess: (_data, _replyId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useFlagReview() {
  const queryClient = useQueryClient()
  return useMutation<Review, Error, { reviewId: string; reason?: string }>({
    mutationFn: ({ reviewId, reason }) => api.flagReview(reviewId, reason || ''),
    onSuccess: (_data, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export { type ReviewFilters }
