'use client'

import type {
  RankingCategory,
  RankingPeriod,
  RankingEntry,
  UserRankingStats,
  RankingFilter,
  RankingSeason
} from '@/lib/types/ranking'
import { SAMPLE_RANKING_DATA, CURRENT_SEASON, USER_RANKING_HISTORY } from '@/lib/ranking/ranking-data'

export class RankingService {
  private static instance: RankingService
  private rankingData: Map<string, RankingEntry[]> = new Map()

  static getInstance(): RankingService {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService()
    }
    return RankingService.instance
  }

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // 카테고리별 샘플 데이터 초기화
    Object.values(['total_level', 'combat_power', 'monster_kills', 'boss_kills', 'dungeon_clears']).forEach(category => {
      this.rankingData.set(category, this.generateCategoryRanking(category))
    })
  }

  private generateCategoryRanking(category: string): RankingEntry[] {
    return SAMPLE_RANKING_DATA.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      score: Math.floor(entry.score * (Math.random() * 0.3 + 0.85)) // 카테고리별 점수 변화
    })).sort((a, b) => b.score - a.score)
  }

  // 랭킹 조회
  async getRanking(filter: RankingFilter): Promise<RankingEntry[]> {
    const key = `${filter.category}_${filter.period}`
    let ranking = this.rankingData.get(filter.category) || []

    // 길드 필터링
    if (filter.guild) {
      ranking = ranking.filter(entry => entry.guild === filter.guild)
    }

    // 레벨 필터링
    if (filter.level) {
      ranking = ranking.filter(entry =>
        entry.level >= filter.level!.min && entry.level <= filter.level!.max
      )
    }

    // 순위 재정렬
    ranking = ranking.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    return ranking.slice(0, 100) // 상위 100명만 반환
  }

  // 사용자 순위 조회
  async getUserRank(userId: string, category: RankingCategory, period: RankingPeriod = 'weekly'): Promise<RankingEntry | null> {
    const ranking = await this.getRanking({ category, period })
    return ranking.find(entry => entry.userId === userId) || null
  }

  // 사용자 주변 랭킹 조회
  async getNearbyRanking(userId: string, category: RankingCategory, range = 5): Promise<RankingEntry[]> {
    const userRank = await this.getUserRank(userId, category)
    if (!userRank) {
      return []
    }

    const allRanking = await this.getRanking({ category, period: 'weekly' })
    const startIndex = Math.max(0, userRank.rank - range - 1)
    const endIndex = Math.min(allRanking.length, userRank.rank + range)

    return allRanking.slice(startIndex, endIndex)
  }

  // 사용자 랭킹 통계 조회
  async getUserRankingStats(userId: string): Promise<UserRankingStats> {
    // 실제로는 데이터베이스에서 조회
    return {
      userId,
      currentWeek: {
        totalLevel: 127,
        combatPower: 95432,
        monsterKills: 2341,
        bossKills: 45,
        dungeonClears: 89,
        achievements: 67,
        collectionRate: 78,
        equipmentEnhance: 156,
        goldEarned: 125000,
        expGained: 89000
      },
      lastWeek: {
        totalLevel: 124,
        combatPower: 92100,
        monsterKills: 2298,
        bossKills: 43,
        dungeonClears: 85,
        achievements: 65,
        collectionRate: 76,
        equipmentEnhance: 148,
        goldEarned: 115000,
        expGained: 82000
      },
      allTime: {
        totalLevel: 127,
        combatPower: 95432,
        monsterKills: 15678,
        bossKills: 234,
        dungeonClears: 567,
        achievements: 67,
        collectionRate: 78,
        equipmentEnhance: 156,
        goldEarned: 2500000,
        expGained: 1890000
      },
      weeklyGrowth: {
        totalLevel: 3,
        combatPower: 3332,
        monsterKills: 43,
        bossKills: 2,
        dungeonClears: 4,
        achievements: 2,
        collectionRate: 2,
        equipmentEnhance: 8,
        goldEarned: 10000,
        expGained: 7000
      }
    }
  }

  // 랭킹 히스토리 조회
  async getRankingHistory(userId: string, category: RankingCategory): Promise<typeof USER_RANKING_HISTORY.weeklyHistory> {
    return USER_RANKING_HISTORY.weeklyHistory.filter(h => h.category === category)
  }

  // 현재 시즌 정보 조회
  async getCurrentSeason(): Promise<RankingSeason> {
    return CURRENT_SEASON
  }

  // 랭킹 업데이트 (실시간)
  async updateUserScore(userId: string, category: RankingCategory, newScore: number): Promise<void> {
    const categoryRanking = this.rankingData.get(category) || []
    const userIndex = categoryRanking.findIndex(entry => entry.userId === userId)

    if (userIndex >= 0) {
      const previousRank = categoryRanking[userIndex].rank
      categoryRanking[userIndex].score = newScore

      // 점수 기준으로 재정렬
      categoryRanking.sort((a, b) => b.score - a.score)

      // 순위 재계산
      categoryRanking.forEach((entry, index) => {
        const newRank = index + 1
        if (entry.userId === userId) {
          entry.previousRank = previousRank
          entry.change = newRank < previousRank ? 'up' :
            newRank > previousRank ? 'down' : 'same'
        }
        entry.rank = newRank
      })

      this.rankingData.set(category, categoryRanking)
    }
  }

  // 랭킹 리셋 (주간)
  async resetWeeklyRanking(): Promise<void> {
    // 모든 카테고리의 주간 점수 초기화
    this.rankingData.forEach((ranking, category) => {
      ranking.forEach(entry => {
        entry.previousRank = entry.rank
        entry.score = 0
      })
    })
  }

  // 상위 길드 조회
  async getTopGuilds(limit = 10): Promise<Array<{guild: string, members: number, totalScore: number}>> {
    const allRanking = await this.getRanking({ category: 'total_level', period: 'weekly' })
    const guildStats = new Map<string, {members: number, totalScore: number}>()

    allRanking.forEach(entry => {
      if (entry.guild) {
        const current = guildStats.get(entry.guild) || { members: 0, totalScore: 0 }
        current.members += 1
        current.totalScore += entry.score
        guildStats.set(entry.guild, current)
      }
    })

    return Array.from(guildStats.entries())
      .map(([guild, stats]) => ({ guild, ...stats }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  }

  // 랭킹 검색
  async searchUser(username: string): Promise<RankingEntry[]> {
    const allCategories = ['total_level', 'combat_power', 'monster_kills'] as RankingCategory[]
    const results: RankingEntry[] = []

    for (const category of allCategories) {
      const ranking = await this.getRanking({ category, period: 'weekly' })
      const found = ranking.filter(entry =>
        entry.username.toLowerCase().includes(username.toLowerCase())
      )
      results.push(...found)
    }

    // 중복 제거
    const uniqueResults = results.filter((entry, index, self) =>
      index === self.findIndex(e => e.userId === entry.userId)
    )

    return uniqueResults
  }
}

// 전역 인스턴스
export const rankingService = RankingService.getInstance()
