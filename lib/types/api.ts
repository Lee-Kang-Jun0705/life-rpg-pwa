// AI 코치 API 타입 정의 (온라인 기능)
export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number | boolean>
  timeout?: number
  retry?: {
    count: number
    delay: number
  }
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    timestamp: string
    version: string
    [key: string]: unknown
  }
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
  meta?: {
    timestamp: string
    version: string
    [key: string]: unknown
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// AI 코치 관련 타입만 유지
export interface AICoachRequest {
  userId: string
  question: string
  context?: {
    currentStats?: unknown
    recentActivities?: unknown[]
  }
}

export interface AICoachResponse {
  advice: string
  suggestions?: string[]
  insights?: {
    strengths: string[]
    improvements: string[]
  }
}