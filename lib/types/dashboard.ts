// 대시보드 관련 타입 정의 강화
import { GAME_CONFIG } from '@/lib/config/game-config'

export interface Stat {
  id?: number
  userId: string
  type: 'health' | 'learning' | 'relationship' | 'achievement'
  level: number
  _experience: number
  totalActivities: number
  updatedAt: Date
}

export interface Activity {
  id?: number
  userId: string
  _statType: 'health' | 'learning' | 'relationship' | 'achievement'
  activityName: string
  description?: string
  _experience: number
  timestamp: Date
  synced: boolean
}

export interface StatType {
  id: string // 고유 ID 추가
  type: 'health' | 'learning' | 'relationship' | 'achievement'
  name: string
  emoji: string
  variant: 'stat-health' | 'stat-learning' | 'stat-relationship' | 'stat-achievement'
}

export interface CalculatedStats {
  totalLevel: number
  totalExp: number
  totalActivities: number
  maxLevel: number
}

export interface DashboardState {
  stats: Stat[]
  loading: boolean
  error: string | null
  isProcessing: Set<string>
}

export interface DashboardActions {
  loadUserData: () => Promise<void>
  handleStatClick: (_statType: string) => Promise<void>
  handleVoiceInput: (_transcript: string, activityType?: string | null) => Promise<void>
  handleStatAction: (_statType: string, _action: string) => Promise<void>
}

// 게임 설정은 config/game-config.ts에서 가져옴
export { GAME_CONFIG } from '@/lib/config/game-config'

export const STAT_TYPES: StatType[] = [
  { id: 'stat-health-001', type: 'health', name: '건강', emoji: '💪', variant: 'stat-health' },
  { id: 'stat-learning-002', type: 'learning', name: '학습', emoji: '📚', variant: 'stat-learning' },
  { id: 'stat-relationship-003', type: 'relationship', name: '관계', emoji: '👥', variant: 'stat-relationship' },
  { id: 'stat-achievement-004', type: 'achievement', name: '성취', emoji: '🏆', variant: 'stat-achievement' },
] as const

// stat-calculator.ts의 함수를 재export하여 기존 코드 호환성 유지
import { 
  calculateLevelFromExperience,
  calculateRequiredExperience,
  calculateTotalExperience
} from '@/lib/utils/stat-calculator'

export { 
  calculateLevelFromExperience as calculateLevel,
  calculateRequiredExperience as getExpForNextLevel,
  calculateTotalExperience as getExpForLevel
}

// 경험치 진행도 계산 (stat-calculator 함수 사용)
export const calculateProgress = (experience: number): number => {
  const { level, currentExp } = calculateLevelFromExperience(experience)
  const nextLevelExp = calculateRequiredExperience(level)
  const progress = (currentExp / nextLevelExp) * 100
  return Math.min(progress, 100)
}

// 상세 레벨 정보 계산 (stat-calculator 함수 사용)
export const calculateLevelDetails = (totalExperience: number): {
  level: number
  currentLevelExp: number
  nextLevelExp: number
  totalExpForCurrentLevel: number
} => {
  const { level, currentExp } = calculateLevelFromExperience(totalExperience)
  const nextLevelExp = calculateRequiredExperience(level)
  const totalExpForCurrentLevel = calculateTotalExperience(level)
  
  return {
    level,
    currentLevelExp: currentExp,
    nextLevelExp,
    totalExpForCurrentLevel
  }
}

export const generateRandomExperience = (): number => {
  return Math.floor(Math.random() * (GAME_CONFIG.MAX_EXPERIENCE_GAIN - GAME_CONFIG.MIN_EXPERIENCE_GAIN + 1)) + GAME_CONFIG.MIN_EXPERIENCE_GAIN
}

export const formatExperience = (exp: number): string => {
  return exp.toLocaleString()
}