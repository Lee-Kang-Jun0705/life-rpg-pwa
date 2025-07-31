// AI 코치 관련 타입 정의

export type QuickActionType = 'record' | 'analyze' | 'goal' | 'chat'

export interface QuickAction {
  id: QuickActionType
  label: string
  emoji: string
}

export interface TimeTheme {
  gradient: string
  emoji: string
  message: string
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export interface StreakEffect {
  emoji: string
  title: string
  color: string
}

export interface AICoachError {
  code: 'NETWORK_ERROR' | 'DATA_ERROR' | 'UNKNOWN_ERROR'
  message: string
  retry?: () => void
}