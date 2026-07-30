export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_verified: boolean
  business_id: string
  created_at: string
}

export interface Business {
  id: string
  name: string
  slug: string
  industry: string
  description: string
  plan: string
  is_active: boolean
  created_at: string
}

export interface BrandVoice {
  id: string
  business_id: string
  company_name: string
  industry: string
  business_description: string
  writing_style: string
  tone: string
  language: string
  reply_length: string
  greeting_style: string
  closing_style: string
  emoji_preference: boolean
  professional_level: number
  personalization_level: number
  custom_instructions: string
}

export interface Review {
  id: string
  business_id: string
  platform: string
  platform_review_id: string
  customer_name: string
  rating: number
  review_text: string
  review_date: string
  reply_text: string | null
  sentiment: string
  sentiment_confidence: number
  intent: string | null
  risk_level: string
  needs_human_review: boolean
  is_auto_replied: boolean
  is_flagged: boolean
  flag_reason: string | null
  language: string
  metadata: any
  created_at: string
  replied_at: string | null
  reply?: Reply
}

export interface Reply {
  id: string
  review_id: string
  business_id: string
  content: string
  status: string
  risk_level: string
  quality_score: number | null
  safety_score: number | null
  confidence_score: number | null
  is_ai_generated: boolean
  human_edited: boolean
  edited_by: string | null
  published_at: string | null
  created_at: string
}

export interface DashboardStats {
  total_reviews: number
  pending_replies: number
  auto_replied: number
  manual_replies: number
  avg_rating: number
  ai_usage: number
  avg_response_time: number
  connected_platforms: number
}

export interface SentimentTrend {
  date: string
  positive: number
  neutral: number
  negative: number
  very_negative: number
}

export interface PlatformPerformance {
  platform: string
  total: number
  avg_rating: number
  replied: number
  pending: number
}

export interface MonthlyActivity {
  month: string
  reviews: number
  replies: number
  ai_generations: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PlatformConnection {
  id: string
  platform: Platform
  is_connected: boolean
  connected_at: string | null
  business_id: string
  platform_account_name?: string
  platform_account_email?: string
  review_count?: number
  avg_rating?: number
}

export type Platform = 'google' | 'facebook' | 'trustpilot' | 'yelp' | 'shopify' | 'amazon' | 'app_store' | 'play_store' | 'airbnb' | 'booking' | 'email'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'very_negative' | 'urgent' | 'spam' | 'toxic' | 'fake'

export type RiskLevel = 'low' | 'medium' | 'high'
