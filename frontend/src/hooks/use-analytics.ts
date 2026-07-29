'use client'

import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { DashboardStats, SentimentTrend, PlatformPerformance, MonthlyActivity } from '@/types'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.getDashboardStats(),
  })
}

export function useSentimentTrends(days: number = 30) {
  return useQuery<SentimentTrend[]>({
    queryKey: ['analytics', 'sentiment-trends', days],
    queryFn: () => api.getSentimentTrends(days),
  })
}

export function usePlatformPerformance() {
  return useQuery<PlatformPerformance[]>({
    queryKey: ['analytics', 'platform-performance'],
    queryFn: () => api.getPlatformPerformance(),
  })
}

export function useMonthlyActivity(months: number = 12) {
  return useQuery<MonthlyActivity[]>({
    queryKey: ['analytics', 'monthly-activity', months],
    queryFn: () => api.getMonthlyActivity(months),
  })
}
