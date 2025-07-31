// 몬스터 도감 시스템 타입 정의

export interface MonsterCollectionEntry {
  monsterId: string
  firstEncounteredAt?: Date
  firstDefeatedAt?: Date
  killCount: number
  lastSeenAt: Date
  isDiscovered: boolean
  isDefeated: boolean
}

export interface CollectionReward {
  id: string
  name: string
  description: string
  requiredCount: number // 필요한 몬스터 수
  rewards: {
    exp?: number
    gold?: number
    items?: string[]
    title?: string
    stat?: {
      type: 'attack' | 'defense' | 'hp' | 'speed'
      value: number
    }
  }
  isClaimed: boolean
}

export interface CollectionCategory {
  id: string
  name: string
  description: string
  monsterIds: string[]
  rewards: CollectionReward[]
}

export interface CollectionStats {
  totalMonsters: number
  discoveredMonsters: number
  defeatedMonsters: number
  totalKills: number
  completionRate: number
  categoryProgress: {
    categoryId: string
    discovered: number
    total: number
  }[]
}

export interface MonsterLore {
  monsterId: string
  description: string
  habitat: string
  behavior: string
  weakness?: string
  trivia?: string[]
}

// 도감 필터 옵션
export interface CollectionFilter {
  category?: string[]
  discovered?: boolean
  defeated?: boolean
  element?: string[]
  tier?: number[]
  searchQuery?: string
}

// 도감 정렬 옵션
export type CollectionSortOption = 
  | 'id'
  | 'name'
  | 'level'
  | 'kills'
  | 'discovered'
  | 'element'
  | 'tier'

// 도감 업적
export interface CollectionAchievement {
  id: string
  name: string
  description: string
  icon: string
  condition: {
    type: 'discover' | 'defeat' | 'kill_count' | 'category_complete'
    target?: string // 특정 몬스터 ID 또는 카테고리 ID
    count?: number
  }
  rewards: {
    exp?: number
    gold?: number
    title?: string
  }
  isUnlocked: boolean
  unlockedAt?: Date
}

// 도감 상태
export interface CollectionState {
  entries: Record<string, MonsterCollectionEntry>
  categories: CollectionCategory[]
  achievements: CollectionAchievement[]
  lastUpdated: Date
}