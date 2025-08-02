// 기본 타입 정의
export type StatType = 'health' | 'learning' | 'relationship' | 'achievement'

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert' | 'legendary' | 'dynamic'
export type DungeonType = 'daily' | 'weekly' | 'special' | 'infinite' | 'event'
export type ChallengeType = 'stat' | 'action' | 'time_based' | 'combo'
export type DungeonStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'cleared' | 'failed' | 'abandoned'

export interface StatRequirement {
  stat: StatType
  minValue: number
}

export interface DungeonReward {
  exp: number
  coins: number
  items?: string[]
  achievementId?: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  targetStat?: StatType
  targetValue: number
  currentValue: number
  completed: boolean
  timeLimit?: number // in minutes
  createdAt: Date
  completedAt?: Date
}

export interface Dungeon {
  id: string
  name: string
  description: string
  imageUrl?: string
  difficulty: DifficultyLevel
  type: DungeonType
  status: DungeonStatus
  requirements: {
    minLevel?: number
    requiredStats?: StatRequirement[]
    requiredTickets?: number
    requiredEnergy?: number
  }
  rewards: DungeonReward
  challenges: Challenge[]
  resetTime: Date
  completedAt?: Date
  attempts: number
  maxAttempts?: number
  // 스테이지 관련 정보
  stages?: {
    total: number
    completed: number
    current: number
  }
  // 추가 메타데이터
  metadata?: {
    difficulty_modifier?: number
    reward_multiplier?: number
    special_rules?: string[]
  }
}

export interface DungeonProgress {
  id?: string
  dungeonId: string
  userId: string
  startedAt: Date
  updatedAt?: Date
  completedAt?: Date
  completedChallenges: string[]
  totalProgress: number // 0-100
  status: DungeonStatus
  currentStage?: number
  battleStats?: {
    totalDamageDealt: number
    totalDamageTaken: number
    turnsElapsed: number
    skillsUsed: number
  }
}

export interface DungeonStats {
  totalCompleted: number
  totalAttempts: number
  successRate: number
  currentStreak: number
  bestStreak: number
  favoriteType: DungeonType
  totalRewardsEarned: {
    exp: number
    coins: number
    items: number
  }
}
