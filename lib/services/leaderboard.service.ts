/**
 * 개인 리더보드 시스템 서비스
 * 개인 기록 및 성과 추적
 */

import { dbHelpers } from '@/lib/database/client'
import type { Activity } from '@/lib/database/types'
import type { DungeonProgress } from '@/lib/database'

export interface PersonalRecord {
  id: string
  category: string
  name: string
  value: number
  unit: string
  achievedAt: Date
  previousBest?: number
  icon?: string
}

export interface LeaderboardCategory {
  id: string
  name: string
  description: string
  icon: string
  records: PersonalRecord[]
}

export interface LeaderboardStats {
  totalRecords: number
  recentRecords: PersonalRecord[]
  categoriesWithRecords: number
  streakDays: number
  bestStreak: number
}

// 리더보드 카테고리 정의
const LEADERBOARD_CATEGORIES: Omit<LeaderboardCategory, 'records'>[] = [
  {
    id: 'level',
    name: '레벨 기록',
    description: '최고 레벨 달성 기록',
    icon: '📈'
  },
  {
    id: 'dungeon',
    name: '던전 기록',
    description: '던전 클리어 시간 및 점수',
    icon: '🏰'
  },
  {
    id: 'combat',
    name: '전투 기록',
    description: '전투 관련 최고 기록',
    icon: '⚔️'
  },
  {
    id: 'collection',
    name: '수집 기록',
    description: '몬스터 및 아이템 수집 기록',
    icon: '📚'
  },
  {
    id: 'daily',
    name: '일일 기록',
    description: '일일 활동 최고 기록',
    icon: '📅'
  },
  {
    id: 'achievement',
    name: '업적 기록',
    description: '특별한 업적 달성 기록',
    icon: '🏆'
  }
]

class LeaderboardService {
  private static instance: LeaderboardService
  private records: Map<string, PersonalRecord[]> = new Map()
  private userId = 'current-user'
  private initialized = false

  static getInstance(): LeaderboardService {
    if (!this.instance) {
      this.instance = new LeaderboardService()
    }
    return this.instance
  }

  /**
   * 서비스 초기화
   */
  async initialize(userId = 'current-user'): Promise<void> {
    if (this.initialized && this.userId === userId) {
      return
    }

    this.userId = userId
    await this.loadFromDB()
    this.initialized = true
  }

  /**
   * DB에서 리더보드 데이터 로드
   */
  private async loadFromDB(): Promise<void> {
    try {
      const data = await dbHelpers.getLeaderboardData(this.userId)
      if (data && data.records && typeof data.records === 'object') {
        // Map으로 변환
        this.records = new Map(Object.entries(data.records))
      }

      // 기본 기록 체크 및 생성
      await this.checkAndCreateDefaultRecords()
    } catch (error) {
      console.error('Failed to load leaderboard data:', error)
    }
  }

  /**
   * DB에 리더보드 데이터 저장
   */
  private async saveToDB(): Promise<void> {
    try {
      const recordsObject = Object.fromEntries(this.records)
      await dbHelpers.saveLeaderboardData(this.userId, {
        records: recordsObject,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to save leaderboard data:', error)
    }
  }

  /**
   * 기본 기록 체크 및 생성
   */
  private async checkAndCreateDefaultRecords(): Promise<void> {
    // 레벨 기록
    const profile = await dbHelpers.getProfile(this.userId)
    if (profile) {
      await this.updateRecord('level', 'highest_level', '최고 레벨', profile.level, '레벨')
    }

    // 활동 기반 기록
    const activities = await dbHelpers.getActivities(this.userId)
    if (activities.length > 0) {
      // 일일 최고 경험치
      const dailyExp = this.calculateDailyExpRecord(activities)
      if (dailyExp > 0) {
        await this.updateRecord('daily', 'max_daily_exp', '일일 최고 경험치', dailyExp, 'EXP')
      }

      // 연속 활동 일수
      const streak = this.calculateActivityStreak(activities)
      if (streak > 0) {
        await this.updateRecord('daily', 'activity_streak', '연속 활동 일수', streak, '일')
      }
    }

    // 던전 기록
    const dungeonProgress = await dbHelpers.getAllDungeonProgress(this.userId)
    if (dungeonProgress.length > 0) {
      const completedDungeons = dungeonProgress.filter(d => d.status === 'completed').length
      await this.updateRecord('dungeon', 'dungeons_cleared', '클리어한 던전 수', completedDungeons, '개')
    }
  }

  /**
   * 기록 업데이트
   */
  async updateRecord(
    category: string,
    recordId: string,
    name: string,
    value: number,
    unit: string,
    icon?: string
  ): Promise<boolean> {
    const categoryRecords = this.records.get(category) || []
    const existingRecord = categoryRecords.find(r => r.id === recordId)

    if (existingRecord) {
      // 기존 기록이 있는 경우, 더 높은 값일 때만 업데이트
      if (value > existingRecord.value) {
        existingRecord.previousBest = existingRecord.value
        existingRecord.value = value
        existingRecord.achievedAt = new Date()
        await this.saveToDB()
        return true
      }
      return false
    } else {
      // 새로운 기록 생성
      const newRecord: PersonalRecord = {
        id: recordId,
        category,
        name,
        value,
        unit,
        achievedAt: new Date(),
        icon
      }
      categoryRecords.push(newRecord)
      this.records.set(category, categoryRecords)
      await this.saveToDB()
      return true
    }
  }

  /**
   * 특정 카테고리의 기록 조회
   */
  getCategoryRecords(categoryId: string): PersonalRecord[] {
    return this.records.get(categoryId) || []
  }

  /**
   * 모든 카테고리 조회
   */
  getCategories(): LeaderboardCategory[] {
    return LEADERBOARD_CATEGORIES.map(category => ({
      ...category,
      records: this.getCategoryRecords(category.id)
    }))
  }

  /**
   * 최근 기록 조회
   */
  getRecentRecords(limit = 10): PersonalRecord[] {
    const allRecords: PersonalRecord[] = []

    for (const records of this.records.values()) {
      allRecords.push(...records)
    }

    return allRecords
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime())
      .slice(0, limit)
  }

  /**
   * 리더보드 통계 조회
   */
  async getStats(): Promise<LeaderboardStats> {
    const allRecords: PersonalRecord[] = []
    for (const records of this.records.values()) {
      allRecords.push(...records)
    }

    const activities = await dbHelpers.getActivities(this.userId)
    const streak = this.calculateActivityStreak(activities)
    const bestStreakRecord = this.records.get('daily')?.find(r => r.id === 'activity_streak')

    return {
      totalRecords: allRecords.length,
      recentRecords: this.getRecentRecords(5),
      categoriesWithRecords: Array.from(this.records.keys()).length,
      streakDays: streak,
      bestStreak: bestStreakRecord?.value || streak
    }
  }

  /**
   * 일일 경험치 계산
   */
  private calculateDailyExpRecord(activities: Activity[]): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = activities.filter(a => {
      const activityDate = new Date(a.timestamp)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === today.getTime()
    })

    return todayActivities.reduce((sum, a) => sum + a.experience, 0)
  }

  /**
   * 연속 활동 일수 계산
   */
  private calculateActivityStreak(activities: Activity[]): number {
    if (activities.length === 0) {
      return 0
    }

    const sortedDates = Array.from(new Set(
      activities.map(a => {
        const date = new Date(a.timestamp)
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      })
    )).sort().reverse()

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const dateStr of sortedDates) {
      const [year, month, day] = dateStr.split('-').map(Number)
      const activityDate = new Date(year, month - 1, day)

      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 전투 기록 업데이트
   */
  async updateCombatRecords(combatResult: {
    totalDamage?: number
    maxDamage?: number
    perfectVictory?: boolean
    fastestClear?: number
    maxCombo?: number
  }): Promise<void> {
    if (combatResult.totalDamage) {
      await this.updateRecord('combat', 'total_damage', '총 데미지', combatResult.totalDamage, 'DMG', '💥')
    }
    if (combatResult.maxDamage) {
      await this.updateRecord('combat', 'max_single_damage', '최대 단일 데미지', combatResult.maxDamage, 'DMG', '⚡')
    }
    if (combatResult.maxCombo) {
      await this.updateRecord('combat', 'max_combo', '최대 콤보', combatResult.maxCombo, '콤보', '🔥')
    }
    if (combatResult.fastestClear) {
      await this.updateRecord('combat', 'fastest_clear', '최단 클리어 시간', combatResult.fastestClear, '초', '⏱️')
    }
  }

  /**
   * 수집 기록 업데이트
   */
  async updateCollectionRecords(collectionStats: {
    totalMonsters?: number
    totalItems?: number
    rareCollections?: number
  }): Promise<void> {
    if (collectionStats.totalMonsters) {
      await this.updateRecord('collection', 'total_monsters', '수집한 몬스터', collectionStats.totalMonsters, '종', '👾')
    }
    if (collectionStats.totalItems) {
      await this.updateRecord('collection', 'total_items', '수집한 아이템', collectionStats.totalItems, '개', '🎁')
    }
    if (collectionStats.rareCollections) {
      await this.updateRecord('collection', 'rare_collections', '희귀 수집품', collectionStats.rareCollections, '개', '💎')
    }
  }

  /**
   * 던전 기록 업데이트
   */
  async updateDungeonRecords(dungeonResult: {
    clearTime?: number
    score?: number
    perfectClear?: boolean
    dungeonId?: string
  }): Promise<void> {
    if (dungeonResult.clearTime && dungeonResult.dungeonId) {
      await this.updateRecord(
        'dungeon',
        `fastest_${dungeonResult.dungeonId}`,
        `${dungeonResult.dungeonId} 최단 클리어`,
        dungeonResult.clearTime,
        '초',
        '🏃'
      )
    }
    if (dungeonResult.score) {
      await this.updateRecord('dungeon', 'highest_score', '최고 점수', dungeonResult.score, '점', '🏅')
    }
  }
}

export const leaderboardService = LeaderboardService.getInstance()
