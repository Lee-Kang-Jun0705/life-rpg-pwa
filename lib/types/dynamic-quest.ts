import { Quest } from './quest'

/**
 * 동적 퀘스트 생성을 위한 타입 정의
 */

// 플레이어 행동 패턴 타입
export interface PlayerBehaviorData {
  userId: string
  // 전투 선호도
  combatPreference: {
    totalBattles: number
    preferredElements: string[]
    averageBattleDuration: number
    winRate: number
    mostUsedSkills: string[]
  }
  // 탐험 선호도
  explorationPreference: {
    totalDungeonsCleared: number
    preferredDungeonTypes: string[]
    averageClearTime: number
    preferredDifficulty: string
  }
  // 수집 선호도
  collectionPreference: {
    totalItemsCollected: number
    preferredItemTypes: string[]
    craftingActivity: number
  }
  // 플레이 시간 패턴
  playTimePattern: {
    averageSessionDuration: number
    preferredPlayTime: string[] // ['morning', 'afternoon', 'evening', 'night']
    playFrequency: number // 주당 플레이 일수
    lastPlayedAt: string
  }
  // 진행 상황
  progression: {
    currentLevel: number
    totalExp: number
    mainQuestProgress: number // 0-100%
    completedQuestCount: number
  }
}

// 동적 퀘스트 생성 규칙
export interface DynamicQuestRule {
  id: string
  name: string
  description: string
  // 생성 조건
  conditions: {
    minLevel?: number
    maxLevel?: number
    requiredQuests?: string[]
    playerBehavior?: {
      minBattles?: number
      minDungeonClears?: number
      preferredCategory?: Quest['category'][]
      inactivityDays?: number // 며칠 이상 접속 안함
    }
    timeConditions?: {
      dayOfWeek?: number[] // 0-6 (일-토)
      hourOfDay?: number[] // 0-23
      season?: 'spring' | 'summer' | 'fall' | 'winter'
    }
  }
  // 퀘스트 템플릿
  template: {
    titleTemplates: string[] // "{playerName}의 {dungeonName} 정복" 같은 템플릿
    descriptionTemplates: string[]
    typeOptions: Quest['type'][]
    categoryOptions: Quest['category'][]
    // 목표 생성 규칙
    objectiveTemplates: {
      type: Quest['objectives'][0]['type']
      targetOptions: string[] // 가능한 타겟
      quantityRange: { min: number; max: number }
      descriptionTemplate: string
    }[]
    // 보상 계산 규칙
    rewardCalculation: {
      expFormula: string // "baseExp * level * difficulty"
      goldFormula: string
      itemPools: {
        rarity: 'common' | 'rare' | 'epic' | 'legendary'
        items: string[]
        chance: number
      }[]
    }
  }
  // 생성 설정
  generation: {
    priority: number // 높을수록 우선 생성
    maxActive: number // 동시에 활성화 가능한 최대 개수
    cooldown: number // 생성 후 재생성까지 대기 시간 (시간)
    expireTime: number // 만료 시간 (시간)
  }
}

// 동적 퀘스트 인스턴스
export interface DynamicQuest extends Quest {
  isDynamic: true
  generatedAt: string
  generatedBy: string // 생성 규칙 ID
  personalizedFor: string // 사용자 ID
  adaptiveData?: {
    difficultyAdjustment: number // -1.0 ~ 1.0
    rewardMultiplier: number
    playerMatchScore: number // 플레이어와의 매칭 점수 0-100
  }
}

// 동적 퀘스트 생성 옵션
export interface DynamicQuestGenerationOptions {
  userId: string
  maxQuests?: number
  categories?: Quest['category'][]
  excludeRules?: string[]
  forceGeneration?: boolean // 조건 무시하고 강제 생성
}

// 동적 퀘스트 통계
export interface DynamicQuestStats {
  totalGenerated: number
  totalCompleted: number
  averageCompletionTime: number
  popularCategories: { category: string; count: number }[]
  rewardStats: {
    totalExp: number
    totalGold: number
    totalItems: number
  }
  generationHistory: {
    ruleId: string
    generatedAt: string
    completed: boolean
    completionTime?: number
  }[]
}