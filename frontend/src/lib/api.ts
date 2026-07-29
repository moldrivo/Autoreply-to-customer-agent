import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getToken, getRefreshToken, setToken, setRefreshToken, removeToken, removeRefreshToken } from './auth'
import type {
  User, BrandVoice, Review, Reply, DashboardStats,
  SentimentTrend, PlatformPerformance, MonthlyActivity, PlatformConnection,
  PaginatedResponse
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
        setToken(data.access_token)
        setRefreshToken(data.refresh_token)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        }
        return api(originalRequest)
      } catch {
        removeToken()
        removeRefreshToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export async function login(email: string, password: string): Promise<{ user_id: string; access_token: string; refresh_token: string; token_type: string }> {
  const { data } = await api.post('/auth/login', { email, password })
  return data.data
}

export async function signup(data: {
  business_name: string
  full_name: string
  email: string
  password: string
}): Promise<{ user: User; message: string }> {
  const { data: res } = await api.post('/auth/register', data)
  return res.data
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/verify-email', { token })
  return data
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { token, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return data.data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/analytics/dashboard')
  return data
}

export async function getSentimentTrends(days?: number): Promise<SentimentTrend[]> {
  const { data } = await api.get('/analytics/sentiment-trends', { params: days ? { days } : undefined })
  return data
}

export async function getPlatformPerformance(): Promise<PlatformPerformance[]> {
  const { data } = await api.get('/analytics/platform-performance')
  return data
}

export async function getMonthlyActivity(months?: number): Promise<MonthlyActivity[]> {
  const { data } = await api.get('/analytics/monthly-activity', { params: months ? { months } : undefined })
  return data
}

export async function getReviews(params?: {
  page?: number
  page_size?: number
  sentiment?: string
  platform?: string
  rating?: number
  risk_level?: string
  search?: string
  sort_by?: string
  sort_order?: string
}): Promise<PaginatedResponse<Review>> {
  const { data } = await api.get('/reviews', { params })
  return data
}

export async function getReview(id: string): Promise<Review> {
  const { data } = await api.get(`/reviews/${id}`)
  return data
}

export async function generateReply(reviewId: string): Promise<Reply> {
  const { data } = await api.post(`/reviews/${reviewId}/generate-reply`)
  return data
}

export async function updateReply(replyId: string, content: string): Promise<Reply> {
  const { data } = await api.patch(`/replies/${replyId}`, { content })
  return data
}

export async function approveReply(replyId: string): Promise<Reply> {
  const { data } = await api.post(`/replies/${replyId}/approve`)
  return data
}

export async function rejectReply(replyId: string): Promise<Reply> {
  const { data } = await api.post(`/replies/${replyId}/reject`)
  return data
}

export async function publishReply(replyId: string): Promise<Reply> {
  const { data } = await api.post(`/replies/${replyId}/publish`)
  return data
}

export async function regenerateReply(replyId: string): Promise<Reply> {
  const { data } = await api.post(`/replies/${replyId}/regenerate`)
  return data
}

export async function flagReview(reviewId: string, reason: string): Promise<Review> {
  const { data } = await api.post(`/reviews/${reviewId}/flag`, { reason })
  return data
}

export async function getBrandVoice(): Promise<BrandVoice> {
  const { data } = await api.get('/brand')
  return data
}

export async function updateBrandVoice(bv: Partial<BrandVoice>): Promise<BrandVoice> {
  const { data } = await api.patch('/brand', bv)
  return data
}

export async function getAdminUsers(): Promise<any> {
  const { data } = await api.get('/admin/users')
  return data
}

export async function getAdminBusinesses(): Promise<any> {
  const { data } = await api.get('/admin/businesses')
  return data
}

export async function getAuditLogs(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<any>> {
  const { data } = await api.get('/admin/audit-logs', { params })
  return data
}

export async function getUsageMetrics(): Promise<any> {
  const { data } = await api.get('/admin/usage')
  return data
}

export async function getAdminHealth(): Promise<any> {
  const { data } = await api.get('/admin/health')
  return data
}

export async function getPlatforms(): Promise<PlatformConnection[]> {
  const { data } = await api.get('/platforms')
  return data
}

export async function connectPlatform(platform: string, credentials?: Record<string, any>): Promise<PlatformConnection> {
  const { data } = await api.post('/platforms/connect', { platform, ...credentials })
  return data
}

export async function disconnectPlatform(id: string): Promise<void> {
  await api.post(`/platforms/${id}/disconnect`)
}

export default api
