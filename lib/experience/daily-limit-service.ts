import type { 
  BonusLimits,
  Result
} from '@/lib/types/experience'
import { db, DailyExpLimit } from '@/lib/database'
import { GameError, StatType } from '@/lib/types/game-common'

export class DailyLimitService {
  private static instance: DailyLimitService | null = null
  
  // 기본 일일 제한
  private readonly BASE_LIMITS: Record<StatType, number> = {
    health: 600,
    learning: 500,
    relationship: 400,
    achievement: 500
  }
  
  // 보너스 제한 설정
  private readonly BONUS_CONFIG: BonusLimits = {
    weekend: 200,      // 주말 보너스
    holiday: 300,      // 공휴일 보너스
    streak: [
      { days: 7, bonusLimit: 100 },
      { days: 30, bonusLimit: 200 },
      { days: 100, bonusLimit: 500 }
    ]
  }

  private constructor() {}

  static getInstance(): DailyLimitService {
    if (!DailyLimitService.instance) {
      DailyLimitService.instance = new DailyLimitService()
    }
    return DailyLimitService.instance
  }

  // 오늘의 일일 제한 가져오기
  async getDailyLimit(
    userId: string, 
    statType: StatType
  ): Promise<Result<DailyExpLimit>> {
    try {
      const today = this.getToday()
      
      let limit = await db.dailyExpLimits
        .where('[userId+statType+date]')
        .equals([userId, statType, today])
        .first()

      if (!limit) {
        // 새로운 일일 제한 생성
        limit = await this.createDailyLimit(userId, statType)
      }

      return { success: true, data: limit }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get daily limit')
      }
    }
  }

  // 새로운 일일 제한 생성
  private async createDailyLimit(
    userId: string,
    statType: StatType
  ): Promise<DailyExpLimit> {
    const today = this.getToday()
    const baseLimit = this.BASE_LIMITS[statType] || 500
    const bonusLimit = await this.calculateBonusLimit(userId, today)
    const streakDays = await this.calculateStreakDays(userId)

    const newLimit: DailyExpLimit = {
      userId,
      statType,
      date: today,
      baseLimit,
      bonusLimit,
      currentExp: 0,
      activityCount: 0,
      uniqueActivities: 0,
      violations: 0,
      lastActivityTime: new Date(),
      streakDays
    }

    await db.dailyExpLimits.add(newLimit)
    return newLimit
  }

  // 보너스 제한 계산
  private async calculateBonusLimit(
    userId: string,
    date: string
  ): Promise<number> {
    let bonus = 0
    
    // 주말 보너스
    const dayOfWeek = new Date(date).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      bonus += this.BONUS_CONFIG.weekend
    }
    
    // 연속 활동 보너스
    const streakDays = await this.calculateStreakDays(userId)
    for (const streakBonus of this.BONUS_CONFIG.streak) {
      if (streakDays >= streakBonus.days) {
        bonus = Math.max(bonus, streakBonus.bonusLimit)
      }
    }
    
    return bonus
  }

  // 연속 활동일 계산
  private async calculateStreakDays(userId: string): Promise<number> {
    const limits = await db.dailyExpLimits
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date')
    
    if (limits.length === 0) return 0
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const limit of limits) {
      const limitDate = new Date(limit.date)
      limitDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor(
        (currentDate.getTime() - limitDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (diffDays === streak && limit.activityCount > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  // 경험치 추가 시도
  async tryAddExperience(
    userId: string,
    statType: StatType,
    experience: number
  ): Promise<Result<number>> {
    try {
      const today = this.getToday()
      const limit = await this.getDailyLimit(userId, statType)
      
      if (!limit.success) {
        return { success: false, error: limit.error }
      }

      const dailyLimit = limit.data
      const totalLimit = dailyLimit.baseLimit + dailyLimit.bonusLimit
      const remaining = Math.max(0, totalLimit - dailyLimit.currentExp)
      const grantedExp = Math.min(experience, remaining)

      if (grantedExp > 0) {
        await db.dailyExpLimits
          .where('[userId+statType+date]')
          .equals([userId, statType, today])
          .modify({
            currentExp: dailyLimit.currentExp + grantedExp,
            activityCount: dailyLimit.activityCount + 1,
            lastActivityTime: new Date()
          })
      }

      return { success: true, data: grantedExp }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to add experience')
      }
    }
  }

  // 일일 제한 리셋
  async resetDailyLimits(): Promise<Result<void>> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      // 어제 날짜 이전의 모든 제한 삭제
      await db.dailyExpLimits
        .where('date')
        .below(yesterdayStr)
        .delete()
      
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to reset daily limits')
      }
    }
  }

  // 위반 기록
  async recordViolation(
    userId: string,
    statType: StatType,
    reason: string
  ): Promise<Result<void>> {
    try {
      const today = this.getToday()
      
      await db.dailyExpLimits
        .where('[userId+statType+date]')
        .equals([userId, statType, today])
        .modify(limit => {
          limit.violations = (limit.violations || 0) + 1
        })

      console.warn(`Violation recorded for user ${userId}: ${reason}`)
      
      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to record violation')
      }
    }
  }

  // 통계 조회
  async getStatistics(
    userId: string,
    days: number = 7
  ): Promise<Result<DailyLimitStatistics>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]
      
      const limits = await db.dailyExpLimits
        .where('userId')
        .equals(userId)
        .and(limit => limit.date >= startDateStr)
        .toArray()
      
      const stats: DailyLimitStatistics = {
        totalDays: days,
        activeDays: new Set(limits.map(l => l.date)).size,
        totalExp: limits.reduce((sum, l) => sum + l.currentExp, 0),
        averageDaily: 0,
        statBreakdown: {
          health: { totalExp: 0, days: 0, averageDaily: 0 },
          learning: { totalExp: 0, days: 0, averageDaily: 0 },
          relationship: { totalExp: 0, days: 0, averageDaily: 0 },
          achievement: { totalExp: 0, days: 0, averageDaily: 0 }
        },
        violationCount: limits.reduce((sum, l) => sum + l.violations, 0),
        currentStreak: await this.calculateStreakDays(userId)
      }
      
      stats.averageDaily = stats.activeDays > 0 ? stats.totalExp / stats.activeDays : 0
      
      // 스탯별 분석
      for (const limit of limits) {
        if (!stats.statBreakdown[limit.statType]) {
          stats.statBreakdown[limit.statType] = {
            totalExp: 0,
            days: 0,
            averageDaily: 0
          }
        }
        
        stats.statBreakdown[limit.statType].totalExp += limit.currentExp
        stats.statBreakdown[limit.statType].days++
      }
      
      // 평균 계산
      for (const stat of Object.values(stats.statBreakdown)) {
        stat.averageDaily = stat.days > 0 ? stat.totalExp / stat.days : 0
      }
      
      return { success: true, data: stats }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get statistics')
      }
    }
  }

  // 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
  private getToday(): string {
    return new Date().toISOString().split('T')[0]
  }
}

// 타입 정의
interface DailyLimitStatistics {
  totalDays: number
  activeDays: number
  totalExp: number
  averageDaily: number
  statBreakdown: Record<StatType, {
    totalExp: number
    days: number
    averageDaily: number
  }>
  violationCount: number
  currentStreak: number
}