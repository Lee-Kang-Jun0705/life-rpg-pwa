'use client'

/**
 * 특별 퀘스트/던전 타입 정의
 * 특별한 조건이나 이벤트로만 입장 가능한 던전
 */

import type { DungeonItem } from './dungeon'

// 특별 퀘스트 타입
export type SpecialQuestType =
  | 'event'        // 이벤트 퀘스트 (기간 한정)
  | 'achievement'  // 업적 달성 보상 퀘스트
  | 'collection'   // 수집 보상 퀘스트 (특정 아이템/몬스터 수집)
  | 'challenge'    // 특별 도전 퀘스트 (특수 조건)
  | 'story'        // 스토리 특별 퀘스트
  | 'hidden'       // 히든 퀘스트

// 특별 퀘스트 입장 조건 타입
export interface SpecialQuestRequirement {
  type: 'level' | 'item' | 'achievement' | 'collection' | 'time' | 'quest' | 'custom'
  value: string | number
  description: string
}

// 특별 퀘스트 정보
export interface SpecialQuest {
  id: string
  name: string
  description: string
  type: SpecialQuestType
  icon: string
  backgroundImage?: string

  // 입장 조건
  requirements: SpecialQuestRequirement[]

  // 특별 보상 (경험치 없음, 아이템과 골드만)
  rewards: {
    gold: number
    items: SpecialQuestItem[]
    guaranteedItems?: SpecialQuestItem[] // 확정 보상
    achievementPoints?: number
  }

  // 퀘스트 정보
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme' | 'legendary'
  stages: number
  estimatedTime: number // 분

  // 제한 사항
  maxAttempts?: number // 최대 도전 횟수 (없으면 무제한)
  remainingAttempts?: number
  availableFrom?: Date // 시작 시간
  availableUntil?: Date // 종료 시간
  cooldownHours?: number // 재도전 쿨다운 (시간)
  lastAttemptAt?: Date

  // 특수 규칙
  specialRules?: string[]
  allowedSkills?: string[] // 특정 스킬만 사용 가능
  bannedItems?: string[] // 특정 아이템 사용 금지

  // 상태
  status: 'locked' | 'available' | 'completed' | 'expired'
  completedAt?: Date
  bestClearTime?: number
}

// 특별 퀘스트 아이템 (더 높은 확률과 특별한 속성)
export interface SpecialQuestItem extends DungeonItem {
  isExclusive?: boolean // 이 퀘스트에서만 획득 가능
  enhancedStats?: boolean // 향상된 스탯
  setBonus?: string // 세트 효과
}

// 특별 퀘스트 진행 상황
export interface SpecialQuestProgress {
  questId: string
  userId: string
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned'
  startTime: Date
  endTime?: Date

  // 진행 상황
  currentStage: number
  totalStages: number
  completedObjectives: string[]

  // 획득 보상
  earnedGold: number
  earnedItems: SpecialQuestItem[]

  // 통계
  attempts: number
  deaths: number
  revivals: number

  // 특별 목표 달성
  specialObjectives: {
    id: string
    name: string
    completed: boolean
    reward?: SpecialQuestItem
  }[]
}

// 특별 퀘스트 완료 기록
export interface SpecialQuestRecord {
  questId: string
  userId: string
  completedAt: Date
  clearTime: number
  attempts: number

  // 획득 보상
  rewards: {
    gold: number
    items: SpecialQuestItem[]
    achievementPoints?: number
  }

  // 달성 목표
  achievedObjectives: string[]
  perfectClear: boolean // 모든 특별 목표 달성
}

// 이벤트 퀘스트 정보
export interface EventQuest extends SpecialQuest {
  type: 'event'
  eventName: string
  eventDescription: string
  eventDuration: {
    start: Date
    end: Date
  }

  // 이벤트 특별 보상
  eventCurrency?: {
    name: string
    icon: string
    amount: number
  }

  // 이벤트 랭킹
  rankingEnabled?: boolean
  rankingRewards?: {
    rank: number
    rewards: SpecialQuestItem[]
  }[]
}

// 히든 퀘스트 트리거
export interface HiddenQuestTrigger {
  type: 'location' | 'item_use' | 'monster_defeat' | 'time' | 'action_sequence'
  condition: string
  value: unknown
}

// 히든 퀘스트 정보
export interface HiddenQuest extends SpecialQuest {
  type: 'hidden'
  triggers: HiddenQuestTrigger[]
  hints?: string[] // 힌트 (점진적으로 공개)
  discovered: boolean
  discoveredAt?: Date
}

// 컬렉션 퀘스트
export interface CollectionQuest extends SpecialQuest {
  type: 'collection'
  collectionTarget: {
    type: 'item' | 'monster' | 'achievement'
    ids: string[]
    required: number // 필요한 개수
    current: number // 현재 수집한 개수
  }

  // 단계별 보상
  milestoneRewards?: {
    collected: number
    reward: SpecialQuestItem
  }[]
}

// 특별 퀘스트 목록 필터
export interface SpecialQuestFilter {
  type?: SpecialQuestType
  status?: 'locked' | 'available' | 'completed' | 'expired'
  difficulty?: string
  hasExclusiveRewards?: boolean
}
