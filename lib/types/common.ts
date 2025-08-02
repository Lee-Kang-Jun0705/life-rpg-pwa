// 공통 타입 정의
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface UserEntity extends BaseEntity {
  userId: string
}

// 사용자 프로필
export interface UserProfile {
  id?: number
  userId: string
  email: string
  name: string
  avatar?: string
  level: number
  experience: number
  createdAt: Date
  updatedAt: Date
}


// 투자 관련 타입
export interface Investment {
  id?: number
  investorId: string
  recipientId: string
  amount: number
  currency: string
  type: 'investment' | 'donation' | 'sponsorship'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  description?: string
  receipt?: string
  createdAt: Date
  updatedAt: Date
}

// 미션 관련 타입
export interface Mission {
  id?: number
  userId: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'event'
  statType: 'health' | 'learning' | 'relationship' | 'achievement'
  requirements: {
    count: number
    experience: number
  }
  progress: number
  completed: boolean
  rewards: {
    experience: number
    coins?: number
    items?: string[]
  }
  startDate: Date
  endDate: Date
  completedAt?: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type AsyncState<T> =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }

export interface SimpleApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Nullable<T> = T | null

export type Optional<T> = T | undefined
