/**
 * 핵심 게임 시스템 타입 정의
 * 캐릭터, 스탯, 진행도 등 기본 타입
 */

// Result 타입 (에러 처리용)
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// 기본 스탯 타입
export const CoreStats = {
  HEALTH: 'health',
  LEARNING: 'learning',
  RELATIONSHIP: 'relationship',
  ACHIEVEMENT: 'achievement',
} as const

export type CoreStat = typeof CoreStats[keyof typeof CoreStats]

// 전투 스탯 타입
export const CombatStats = {
  HP: 'hp',
  MP: 'mp',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SPEED: 'speed',
  CRIT_RATE: 'critRate',
  CRIT_DAMAGE: 'critDamage',
  DODGE: 'dodge',
  ACCURACY: 'accuracy',
  RESISTANCE: 'resistance',
} as const

export type CombatStat = typeof CombatStats[keyof typeof CombatStats]

// 캐릭터 인터페이스
export interface Character {
  readonly id: string
  readonly name: string
  readonly level: number
  readonly experience: number
  readonly coreStats: Record<CoreStat, number>
  readonly combatStats: Record<CombatStat, number>
  readonly energy: number
  readonly maxEnergy: number
  readonly gold: number
  readonly gems: number
  readonly createdAt: number
  readonly lastActiveAt: number
}

// 스탯 계산 결과
export interface StatCalculation {
  readonly base: number
  readonly equipment: number
  readonly buffs: number
  readonly setBonus: number
  readonly total: number
}

// 레벨 정보
export interface LevelInfo {
  readonly current: number
  readonly experience: number
  readonly required: number
  readonly progress: number // 0-100
  readonly totalExpForNext: number
}

// 활동 기록
export interface Activity {
  readonly id: string
  readonly userId: string
  readonly statType: CoreStat
  readonly activityName: string
  readonly description: string
  readonly experience: number
  readonly quality?: 'D' | 'C' | 'B' | 'A' | 'S'
  readonly timestamp: number
  readonly synced: boolean
}

// 일일 미션
export interface DailyMission {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly statType: CoreStat
  readonly targetValue: number
  readonly currentValue: number
  readonly reward: {
    readonly experience: number
    readonly gold?: number
    readonly items?: ReadonlyArray<{ id: string; quantity: number }>
  }
  readonly completed: boolean
  readonly claimedAt?: number
  readonly expiresAt: number
}

// 업적
export interface Achievement {
  readonly id: string
  readonly category: AchievementCategory
  readonly title: string
  readonly description: string
  readonly tiers: ReadonlyArray<{
    readonly requirement: number
    readonly reward: {
      readonly gems?: number
      readonly title?: string
      readonly items?: ReadonlyArray<{ id: string; quantity: number }>
    }
  }>
  readonly currentValue: number
  readonly unlockedTiers: number[]
  readonly hidden: boolean
}

// 업적 카테고리
export const AchievementCategory = {
  COMBAT: 'combat',
  COLLECTION: 'collection',
  EXPLORATION: 'exploration',
  SOCIAL: 'social',
  PROGRESSION: 'progression',
  SPECIAL: 'special',
} as const

export type AchievementCategory = typeof AchievementCategory[keyof typeof AchievementCategory]

// 게임 설정
export interface GameSettings {
  readonly soundEnabled: boolean
  readonly musicVolume: number // 0-100
  readonly effectVolume: number // 0-100
  readonly vibrationEnabled: boolean
  readonly autoSave: boolean
  readonly autoSaveInterval: number // 초
  readonly combatSpeed: 1 | 2 | 3
  readonly language: 'ko' | 'en' | 'ja'
  readonly theme: 'light' | 'dark' | 'auto'
  readonly notifications: {
    readonly energyFull: boolean
    readonly dailyReset: boolean
    readonly eventStart: boolean
  }
}

// 게임 상태
export interface GameState {
  readonly character: Character
  readonly settings: GameSettings
  readonly lastSaveAt: number
  readonly playTime: number // 총 플레이 시간 (초)
  readonly tutorialCompleted: string[] // 완료한 튜토리얼 ID
  readonly unlockedFeatures: string[] // 해금된 기능 ID
}

// 서버 응답 타입
export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: {
    readonly code: string
    readonly message: string
    readonly details?: unknown
  }
  readonly timestamp: number
}

// 에러 코드
export const ErrorCode = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  MAINTENANCE: 'MAINTENANCE',
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

// 게임 에러
export class GameError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'GameError'
  }
}

// 유틸리티 함수
export function calculateCombatPower(stats: Record<CombatStat, number>): number {
  return Math.floor(
    stats.hp * 0.5 +
    stats.attack * 2 +
    stats.defense * 1.5 +
    stats.speed * 1.2 +
    stats.critRate * 100 +
    stats.critDamage * 50
  )
}

export function calculateExpForLevel(level: number, multiplier: number = 1.2): number {
  const baseExp = 100
  return Math.floor(baseExp * Math.pow(multiplier, level - 1))
}

export function calculateLevelFromExp(totalExp: number, multiplier: number = 1.2): LevelInfo {
  let level = 1
  let remainingExp = totalExp
  
  while (remainingExp >= calculateExpForLevel(level, multiplier)) {
    remainingExp -= calculateExpForLevel(level, multiplier)
    level++
  }
  
  const required = calculateExpForLevel(level, multiplier)
  
  return {
    current: level,
    experience: remainingExp,
    required: required,
    progress: (remainingExp / required) * 100,
    totalExpForNext: required
  }
}

// 타입 가드
export function isValidCharacter(value: unknown): value is Character {
  if (typeof value !== 'object' || value === null) return false
  
  const char = value as Record<string, unknown>
  
  return (
    typeof char.id === 'string' &&
    typeof char.name === 'string' &&
    typeof char.level === 'number' &&
    typeof char.experience === 'number' &&
    typeof char.coreStats === 'object' &&
    typeof char.combatStats === 'object' &&
    typeof char.energy === 'number' &&
    typeof char.maxEnergy === 'number' &&
    typeof char.gold === 'number' &&
    typeof char.gems === 'number'
  )
}

// 날짜/시간 유틸리티
export function getDailyResetTime(): number {
  const now = new Date()
  const reset = new Date(now)
  reset.setHours(4, 0, 0, 0) // 오전 4시 리셋
  
  if (reset.getTime() < now.getTime()) {
    reset.setDate(reset.getDate() + 1)
  }
  
  return reset.getTime()
}

export function getWeeklyResetTime(): number {
  const now = new Date()
  const reset = new Date(now)
  
  // 월요일 오전 4시 리셋
  const daysUntilMonday = (8 - reset.getDay()) % 7 || 7
  reset.setDate(reset.getDate() + daysUntilMonday)
  reset.setHours(4, 0, 0, 0)
  
  if (reset.getTime() < now.getTime()) {
    reset.setDate(reset.getDate() + 7)
  }
  
  return reset.getTime()
}