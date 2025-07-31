'use client'

// 랭킹 카테고리
export type RankingCategory = 
  | 'total_level'        // 총 레벨
  | 'combat_power'       // 전투력
  | 'monster_kills'      // 몬스터 처치 수
  | 'boss_kills'         // 보스 처치 수
  | 'dungeon_clears'     // 던전 클리어 수
  | 'achievements'       // 업적 달성 수
  | 'collection_rate'    // 도감 완성률
  | 'equipment_enhance'  // 장비 강화 수
  | 'gold_earned'        // 획득 골드
  | 'exp_gained'         // 획득 경험치

// 랭킹 기간
export type RankingPeriod = 'weekly' | 'monthly' | 'all_time'

// 랭킹 엔트리
export interface RankingEntry {
  userId: string
  username: string
  level: number
  profileIcon: string
  rank: number
  score: number
  previousRank?: number
  change: 'up' | 'down' | 'same' | 'new'
  title?: string
  guild?: string
  lastActive: Date
}

// 사용자 랭킹 통계
export interface UserRankingStats {
  userId: string
  currentWeek: {
    totalLevel: number
    combatPower: number
    monsterKills: number
    bossKills: number
    dungeonClears: number
    achievements: number
    collectionRate: number
    equipmentEnhance: number
    goldEarned: number
    expGained: number
  }
  lastWeek: {
    totalLevel: number
    combatPower: number
    monsterKills: number
    bossKills: number
    dungeonClears: number
    achievements: number
    collectionRate: number
    equipmentEnhance: number
    goldEarned: number
    expGained: number
  }
  allTime: {
    totalLevel: number
    combatPower: number
    monsterKills: number
    bossKills: number
    dungeonClears: number
    achievements: number
    collectionRate: number
    equipmentEnhance: number
    goldEarned: number
    expGained: number
  }
  weeklyGrowth: {
    totalLevel: number
    combatPower: number
    monsterKills: number
    bossKills: number
    dungeonClears: number
    achievements: number
    collectionRate: number
    equipmentEnhance: number
    goldEarned: number
    expGained: number
  }
}

// 랭킹 리워드
export interface RankingReward {
  rank: number
  rankRange?: [number, number] // 순위 범위 (예: [1, 10])
  rewards: {
    gold?: number
    exp?: number
    items?: string[]
    title?: string
    badge?: string
  }
}

// 랭킹 시즌
export interface RankingSeason {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
  rewards: RankingReward[]
  participants: number
}

// 랭킹 필터
export interface RankingFilter {
  category: RankingCategory
  period: RankingPeriod
  guild?: string
  level?: {
    min: number
    max: number
  }
}

// 랭킹 카테고리 정보
export interface RankingCategoryInfo {
  id: RankingCategory
  name: string
  description: string
  icon: string
  unit: string
  color: string
}