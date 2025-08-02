import { dbHelpers } from '@/lib/database'
import {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardData,
  LeaderboardStats,
  LeaderboardFilter
} from './types'
import { GAME_CONFIG } from '../types/dashboard'

export class LeaderboardService {
  private static instance: LeaderboardService

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService()
    }
    return LeaderboardService.instance
  }

  // 리더보드 데이터 가져오기
  async getLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardData> {
    try {
      // 임시 더미 데이터 생성
      const entries = await this.generateLeaderboardEntries(filter)

      return {
        category: filter.category,
        timeFrame: filter.timeFrame,
        entries,
        lastUpdated: new Date(),
        userRank: this.findUserRank(entries, GAME_CONFIG.DEFAULT_USER_ID)
      }
    } catch (error) {
      console.error('Failed to get leaderboard:', error)
      return {
        category: filter.category,
        timeFrame: filter.timeFrame,
        entries: [],
        lastUpdated: new Date()
      }
    }
  }

  // 리더보드 통계 가져오기
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    try {
      // 일간, 주간, 월간 1위 가져오기
      const [dailyTop, weeklyTop, monthlyTop] = await Promise.all([
        this.getTopPerformer('daily'),
        this.getTopPerformer('weekly'),
        this.getTopPerformer('monthly')
      ])

      return {
        totalPlayers: 127, // 더미 데이터
        activeToday: 45,   // 더미 데이터
        topPerformers: {
          daily: dailyTop,
          weekly: weeklyTop,
          monthly: monthlyTop
        }
      }
    } catch (error) {
      console.error('Failed to get leaderboard stats:', error)
      return {
        totalPlayers: 0,
        activeToday: 0,
        topPerformers: {
          daily: null,
          weekly: null,
          monthly: null
        }
      }
    }
  }

  // 사용자 순위 업데이트
  async updateUserScore(userId: string, category: LeaderboardCategory, scoreIncrease: number): Promise<void> {
    try {
      await dbHelpers.updateUserScore(userId, category, scoreIncrease)
    } catch (error) {
      console.error('Failed to update user score:', error)
    }
  }

  // 리더보드 엔트리 생성 (더미 데이터)
  private async generateLeaderboardEntries(filter: LeaderboardFilter): Promise<LeaderboardEntry[]> {
    const dummyUsers = [
      { name: '나', avatar: '🦸', isCurrentUser: true },
      { name: '김철수', avatar: '🧑' },
      { name: '이영희', avatar: '👩' },
      { name: '박민수', avatar: '🧑‍💻' },
      { name: '정수진', avatar: '👩‍🎓' },
      { name: '강동원', avatar: '🧑‍🚀' },
      { name: '한지민', avatar: '👩‍🔬' },
      { name: '조인성', avatar: '🧑‍🎨' },
      { name: '송혜교', avatar: '👩‍🏫' },
      { name: '유재석', avatar: '🧑‍💼' },
      { name: '김태희', avatar: '👩‍⚕️' },
      { name: '이병헌', avatar: '🧑‍🌾' },
      { name: '전지현', avatar: '👩‍🍳' },
      { name: '정우성', avatar: '🧑‍🔧' },
      { name: '김혜수', avatar: '👩‍💻' }
    ]

    // 카테고리별 점수 생성
    const entries: LeaderboardEntry[] = dummyUsers.map((user, index) => {
      const baseScore = this.generateScore(filter, index, user.isCurrentUser)
      const level = Math.floor(baseScore / 100) + 1

      return {
        id: user.isCurrentUser ? GAME_CONFIG.DEFAULT_USER_ID : `user-${index}`,
        userId: user.isCurrentUser ? GAME_CONFIG.DEFAULT_USER_ID : `user-${index}`,
        userName: user.name,
        userAvatar: user.avatar,
        rank: 0, // 나중에 설정
        score: baseScore,
        level,
        previousRank: index + Math.floor(Math.random() * 3) - 1,
        stats: {
          health: Math.floor(Math.random() * 50) + 20,
          learning: Math.floor(Math.random() * 50) + 20,
          relationship: Math.floor(Math.random() * 50) + 20,
          achievement: Math.floor(Math.random() * 50) + 20
        },
        dungeonStats: {
          completed: Math.floor(Math.random() * 30) + 5,
          successRate: Math.floor(Math.random() * 30) + 70
        },
        lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    })

    // 점수로 정렬하고 순위 할당
    entries.sort((a, b) => b.score - a.score)
    entries.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return entries
  }

  // 점수 생성 로직
  private generateScore(filter: LeaderboardFilter, index: number, isCurrentUser?: boolean): number {
    let baseScore = 1000

    // 현재 사용자는 중간 정도 순위
    if (isCurrentUser) {
      baseScore = 750
    } else {
      // 순위가 높을수록 높은 점수
      baseScore = 1000 - (index * 50) + Math.floor(Math.random() * 100)
    }

    // 카테고리별 가중치
    switch (filter.category) {
      case 'health':
        baseScore += Math.floor(Math.random() * 200)
        break
      case 'learning':
        baseScore += Math.floor(Math.random() * 250)
        break
      case 'relationship':
        baseScore += Math.floor(Math.random() * 150)
        break
      case 'achievement':
        baseScore += Math.floor(Math.random() * 300)
        break
      case 'dungeons':
        baseScore += Math.floor(Math.random() * 400)
        break
    }

    // 시간대별 조정
    switch (filter.timeFrame) {
      case 'daily':
        baseScore = Math.floor(baseScore * 0.1)
        break
      case 'weekly':
        baseScore = Math.floor(baseScore * 0.3)
        break
      case 'monthly':
        baseScore = Math.floor(baseScore * 0.7)
        break
    }

    return Math.max(baseScore, 0)
  }

  // 1위 플레이어 가져오기
  private async getTopPerformer(timeFrame: 'daily' | 'weekly' | 'monthly'): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard({
      category: 'overall',
      timeFrame
    })

    return leaderboard.entries[0] || null
  }

  // 사용자 순위 찾기
  private findUserRank(entries: LeaderboardEntry[], userId: string): number | undefined {
    const userEntry = entries.find(entry => entry.userId === userId)
    return userEntry?.rank
  }

  // 순위 변동 계산
  calculateRankChange(currentRank: number, previousRank?: number): {
    change: number
    direction: 'up' | 'down' | 'same'
  } {
    if (!previousRank) {
      return { change: 0, direction: 'same' }
    }

    const change = previousRank - currentRank

    if (change > 0) {
      return { change, direction: 'up' }
    } else if (change < 0) {
      return { change: Math.abs(change), direction: 'down' }
    } else {
      return { change: 0, direction: 'same' }
    }
  }

  // 실제 DB 기반 리더보드 메서드들
  async getRealLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardData> {
    try {
      const leaderboardData = await dbHelpers.getLeaderboardData(
        filter.category,
        filter.timeFrame,
        20
      )

      const entries: LeaderboardEntry[] = leaderboardData.map((item, index) => ({
        id: item.userId,
        userId: item.userId,
        userName: `플레이어 ${item.userId.slice(-4)}`,
        userAvatar: '🎮',
        rank: item.rank || (index + 1),
        score: item.score,
        level: item.level || Math.floor(item.score / 100),
        previousRank: item.rank + Math.floor(Math.random() * 3) - 1,
        stats: {
          health: Math.floor(Math.random() * 50) + 20,
          learning: Math.floor(Math.random() * 50) + 20,
          relationship: Math.floor(Math.random() * 50) + 20,
          achievement: Math.floor(Math.random() * 50) + 20
        },
        dungeonStats: {
          completed: Math.floor(Math.random() * 30) + 5,
          successRate: Math.floor(Math.random() * 30) + 70
        },
        lastActivityDate: new Date()
      }))

      return {
        category: filter.category,
        timeFrame: filter.timeFrame,
        entries,
        lastUpdated: new Date(),
        userRank: this.findUserRank(entries, GAME_CONFIG.DEFAULT_USER_ID)
      }
    } catch (error) {
      console.error('Failed to get real leaderboard:', error)
      // 실패 시 더미 데이터로 대체
      return await this.getLeaderboard(filter)
    }
  }

  async getUserPersonalStats(userId: string): Promise<{
    personalBests: Record<string, number>
    recentActivities: typeof data.activities
    totalScore: number
  }> {
    try {
      const data = await dbHelpers.getUserRankingData(userId)

      // 개인 최고 기록 계산
      const personalBests: Record<string, number> = {}
      data.stats.forEach((stat) => {
        personalBests[stat.statType] = (stat.level * 100) + Math.floor(stat.experience / 10)
      })

      return {
        personalBests,
        recentActivities: data.activities,
        totalScore: data.totalScore
      }
    } catch (error) {
      console.error('Failed to get user personal stats:', error)
      return {
        personalBests: {},
        recentActivities: [],
        totalScore: 0
      }
    }
  }
}
