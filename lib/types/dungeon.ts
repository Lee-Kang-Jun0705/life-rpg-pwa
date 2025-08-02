'use client'

// 던전 타입
export type DungeonType =
  | 'story'        // 스토리 던전
  | 'daily'        // 일일 던전
  | 'weekly'       // 주간 던전
  | 'raid'         // 레이드 던전
  | 'special'      // 특별 던전
  | 'challenge'    // 도전 던전
  | 'infinite'     // 무한의 탑

// 던전 난이도
export type DungeonDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'legendary' | 'dynamic'

// 던전 상태
export type DungeonStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'cleared'

// 던전 정보
export interface Dungeon {
  id: string
  name: string
  description: string
  type: DungeonType
  difficulty: DungeonDifficulty
  icon?: string
  backgroundImage?: string

  // 입장 조건
  requirements: {
    level: number
    previousDungeon?: string
    energy: number
    tickets?: number
  }

  // 보상
  rewards: {
    gold: number
    items: DungeonItem[]
    firstClearBonus?: {
      gold: number
      items: DungeonItem[]
    }
  }

  // 던전 정보
  stages: number
  estimatedTime: number // 분
  recommendedCombatPower: number

  // 상태
  status: DungeonStatus
  clearedCount: number
  bestTime?: number
  lastClearedAt?: Date

  // 제한사항
  dailyLimit?: number
  weeklyLimit?: number
  availableDays?: number[] // 0-6 (일-토)
  availableHours?: [number, number] // [시작시간, 종료시간]
}

// 던전 스테이지
export interface DungeonStage {
  id: string
  dungeonId: string
  stageNumber: number
  name: string
  description: string

  // 몬스터
  monsters: DungeonMonster[]
  boss?: DungeonBoss

  // 보상
  rewards: {
    gold: number
    items: DungeonItem[]
  }

  // 완료 상태
  completed: boolean
  stars: number // 0-3
  bestTime?: number
}

// 던전 몬스터
export interface DungeonMonster {
  id: string
  name: string
  level: number
  hp: number
  attack: number
  defense: number
  icon: string
  skills: string[]
  dropRate: number
  drops: DungeonItem[]
}

// 던전 보스
export interface DungeonBoss extends DungeonMonster {
  phases: BossPhase[]
  enrageTimer?: number // 초
  specialMechanics: string[]
}

// 보스 페이즈
export interface BossPhase {
  id: string
  name: string
  hpThreshold: number // HP 퍼센트
  description: string
  skills: string[]
  mechanics: string[]
}

// 던전 아이템
export interface DungeonItem {
  id: string
  name: string
  type: 'equipment' | 'consumable' | 'material' | 'currency'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  icon: string
  quantity: number
  dropRate: number
  description?: string
}

// 던전 진행 결과
export interface DungeonProgress {
  dungeonId: string
  stageId: string
  status: 'in_progress' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date

  // 진행 상황
  currentStage: number
  totalStages: number
  defeatedMonsters: number
  totalMonsters: number
  clearedStages: number
  isCleared: boolean

  // 획득 보상
  earnedExp: number
  earnedGold: number
  earnedItems: DungeonItem[]

  // 통계
  damageDealt: number
  damageTaken: number
  criticalHits: number
  skillsUsed: number

  // 별점 계산 요소
  completionTime: number
  survivedWithFullHP: boolean
  usedNoConsumables: boolean
}

// 던전 클리어 기록
export interface DungeonClearRecord {
  dungeonId: string
  clearedAt: Date
  completionTime: number
  stars: number
  difficulty: DungeonDifficulty

  // 파티 정보
  party: {
    level: number
    combatPower: number
    equipment: string[]
  }

  // 통계
  statistics: {
    damageDealt: number
    damageTaken: number
    criticalHits: number
    perfectStages: number
  }

  // 보상
  rewards: {
    gold: number
    items: DungeonItem[]
  }
}

// 던전 필터
export interface DungeonFilter {
  type?: DungeonType
  difficulty?: DungeonDifficulty
  status?: DungeonStatus
  available?: boolean // 현재 입장 가능한 던전만
}

// 던전 통계
export interface DungeonStats {
  totalDungeonsCleared: number
  totalStagesCleared: number
  totalTimeSpent: number // 분
  averageStars: number

  byType: Record<DungeonType, {
    cleared: number
    totalTime: number
    averageStars: number
  }>

  byDifficulty: Record<DungeonDifficulty, {
    cleared: number
    totalTime: number
    averageStars: number
  }>

  achievements: {
    perfectRuns: number // 3성 클리어
    speedRuns: number // 빠른 클리어
    noDeathRuns: number // 무사 클리어
  }
}

// 무한의 탑 관련 타입
export interface InfiniteTowerProgress {
  currentFloor: number
  highestFloor: number
  lastCheckpoint: number // 마지막 체크포인트 층
  totalMonstersDefeated: number
  totalTimeSpent: number // 초
  currentRunStartTime: number

  // 층별 기록
  floorRecords: Map<number, {
    clearedAt: number
    clearTime: number
    monstersDefeated: number
    damageDealt: number
    damageTaken: number
  }>

  // 버프 상태
  activeBuffs: TowerBuff[]

  // 통계
  stats: {
    totalRuns: number
    bestRunFloor: number
    totalFloorsCleared: number
    averageFloorTime: number
  }
}

export interface TowerBuff {
  id: string
  name: string
  description: string
  icon: string
  type: 'attack' | 'defense' | 'health' | 'speed' | 'special'
  value: number
  duration: number // 층수
  remainingFloors: number
}

export interface TowerMonsterModifier {
  floor: number
  hpMultiplier: number
  attackMultiplier: number
  defenseMultiplier: number
  speedMultiplier: number
  goldMultiplier: number

  // 특수 능력
  specialAbilities: string[]
}

export interface TowerFloorReward {
  floor: number
  gold: number
  items?: DungeonItem[]
  towerCurrency: number

  // 특별 보상
  firstClearBonus?: {
    gold: number
    items: DungeonItem[]
  }

  // 마일스톤 보상 (10층, 25층, 50층 등)
  milestoneReward?: {
    type: 'item' | 'currency' | 'buff'
    value: string | number | DungeonItem
  }
}

export interface InfiniteTowerRanking {
  userId: string
  userName: string
  highestFloor: number
  totalFloorsCleared: number
  lastUpdated: number
  rank?: number
}
