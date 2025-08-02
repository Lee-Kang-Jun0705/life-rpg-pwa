import { Stat } from '@/lib/types/dashboard'
import type { UserProfile } from '@/lib/database/types'

// 대시보드 상태 타입
export interface DashboardState {
  stats: Stat[]
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isProcessing: Set<string>
}

// 대시보드 액션 타입
export interface DashboardActions {
  loadUserData: () => Promise<void>
  handleStatClick: (statType: string) => Promise<void>
  handleVoiceInput: (transcript: string) => Promise<void>
  handleStatAction: (statType: string, action: string) => Promise<void>
  retry: () => Promise<void>
  updateStat: (statType: string, experience: number, activityName?: string) => Promise<boolean | undefined>
}

// 계산된 통계 타입
export interface CalculatedStats {
  totalLevel: number
  totalExp: number
  totalActivities: number
  maxLevel: number
}

// 전체 대시보드 반환 타입
export type UseDashboardReturn = DashboardState & DashboardActions & {
  calculatedStats: CalculatedStats
}

// 스탯 액션 타입
export type StatActionHandler = (statType: string, action: string) => Promise<void>

// 음성 입력 핸들러 타입
export type VoiceInputHandler = (transcript: string) => Promise<void>

// 에러 핸들러 타입
export type ErrorHandler = (error: Error) => void
