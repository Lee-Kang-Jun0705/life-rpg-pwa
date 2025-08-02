// 업적 시스템 타입 정의

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  difficulty: AchievementDifficulty
  icon: string
  condition: AchievementCondition
  rewards: AchievementRewards
  isUnlocked: boolean
  unlockedAt?: Date
  progress: number // 현재 진행도 (0-100)
  isHidden?: boolean // 숨겨진 업적 여부
  prerequisites?: string[] // 선행 업적 ID들
}

export type AchievementCategory =
  | 'general' // 일반
  | 'combat' // 전투
  | 'exploration' // 탐험
  | 'collection' // 수집
  | 'progression' // 성장
  | 'social' // 소셜
  | 'special' // 특별

export type AchievementDifficulty =
  | 'easy' // 쉬움 (브론즈)
  | 'normal' // 보통 (실버)
  | 'hard' // 어려움 (골드)
  | 'expert' // 전문가 (플래티넘)
  | 'legendary' // 전설 (다이아)

export interface AchievementCondition {
  type: AchievementConditionType
  target?: string | number
  count?: number
  value?: number
  timeLimit?: number // 시간 제한 (분)
  parameters?: Record<string, unknown>
}

export type AchievementConditionType =
  // 통계 기반
  | 'stat_reach' // 특정 스탯 도달
  | 'level_reach' // 레벨 도달
  | 'total_exp' // 총 경험치
  | 'total_gold' // 총 골드

  // 전투 관련
  | 'monster_kill' // 몬스터 처치
  | 'boss_kill' // 보스 처치
  | 'battle_win' // 전투 승리
  | 'battle_streak' // 연승
  | 'damage_dealt' // 피해량
  | 'critical_hits' // 치명타

  // 던전 관련
  | 'dungeon_clear' // 던전 클리어
  | 'stage_clear' // 스테이지 클리어
  | 'perfect_clear' // 완벽 클리어
  | 'speed_clear' // 빠른 클리어

  // 수집 관련
  | 'item_collect' // 아이템 수집
  | 'equipment_enhance' // 장비 강화
  | 'collection_complete' // 도감 완성

  // 활동 관련
  | 'daily_login' // 연속 로그인
  | 'daily_mission' // 일일 미션
  | 'activity_complete' // 활동 완료

  // 특별
  | 'time_based' // 시간 기반
  | 'event_based' // 이벤트 기반
  | 'custom' // 커스텀 조건

export interface AchievementRewards {
  exp?: number
  gold?: number
  items?: string[]
  equipment?: string[]
  title?: string
  stat?: {
    type: 'health' | 'learning' | 'relationship' | 'achievement' | 'attack' | 'defense' | 'hp' | 'speed'
    value: number
  }
  energy?: number
  tickets?: number
  specialReward?: {
    type: 'unlock_feature' | 'unlock_dungeon' | 'unlock_character'
    value: string
  }
}

export interface AchievementProgress {
  achievementId: string
  current: number
  target: number
  percentage: number
  lastUpdated: Date
}

export interface AchievementNotification {
  id: string
  achievementId: string
  type: 'unlocked' | 'progress'
  timestamp: Date
  isRead: boolean
}

export interface AchievementStats {
  totalAchievements: number
  unlockedAchievements: number
  completionRate: number
  categoryStats: {
    category: AchievementCategory
    total: number
    unlocked: number
  }[]
  difficultyStats: {
    difficulty: AchievementDifficulty
    total: number
    unlocked: number
  }[]
  totalRewardsEarned: {
    exp: number
    gold: number
    items: number
    titles: number
  }
}

export interface AchievementFilter {
  category?: AchievementCategory[]
  difficulty?: AchievementDifficulty[]
  unlocked?: boolean
  hidden?: boolean
  searchQuery?: string
}

export type AchievementSortOption =
  | 'name'
  | 'category'
  | 'difficulty'
  | 'progress'
  | 'unlock_date'
  | 'rarity'

// 업적 시스템 상태
export interface AchievementSystemState {
  achievements: Record<string, Achievement>
  progress: Record<string, AchievementProgress>
  notifications: AchievementNotification[]
  stats: AchievementStats
  lastUpdated: Date
}
