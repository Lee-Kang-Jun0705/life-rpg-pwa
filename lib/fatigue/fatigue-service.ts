import type { StatType } from '@/lib/types/game-common'
import type { Result } from '@/lib/types/experience'
import { db } from '@/lib/database'

// 피로도 상태
export interface FatigueState {
  readonly userId: string
  readonly currentFatigue: number // 0-100, 높을수록 피로함
  readonly activityStreak: number // 연속 활동 횟수
  readonly lastActivityTime: Date
  readonly lastRestTime: Date
  readonly experienceEfficiency: number // 0-1, 경험치 획득 효율
  readonly warnings: ReadonlyArray<string>
  readonly isExhausted: boolean // 탈진 상태
  readonly nextMilestone?: FatigueMilestone
}

// 피로도 마일스톤
export interface FatigueMilestone {
  readonly fatigue: number
  readonly penalty: number
  readonly warning: string
  readonly effect: string
}

// 피로도 활동 기록
export interface FatigueActivity {
  readonly userId: string
  readonly timestamp: Date
  readonly activityCount: number
  readonly fatigueAdded: number
  readonly efficiency: number
}

// 피로도 설정
const FATIGUE_CONFIG = {
  // 기본 설정
  BASE_FATIGUE_PER_ACTIVITY: 5, // 활동당 기본 피로도 증가
  MAX_FATIGUE: 100,
  REST_RECOVERY_RATE: 10, // 시간당 회복률
  EXHAUSTION_THRESHOLD: 90, // 탈진 임계값

  // 활동 간격 설정 (분)
  IDEAL_ACTIVITY_INTERVAL: 30, // 이상적인 활동 간격
  MIN_REST_INTERVAL: 15, // 최소 휴식 간격

  // 연속 활동 페널티
  STREAK_PENALTIES: [
    { streak: 3, fatigueMultiplier: 1.2 },
    { streak: 5, fatigueMultiplier: 1.5 },
    { streak: 8, fatigueMultiplier: 2.0 },
    { streak: 10, fatigueMultiplier: 3.0 }
  ],

  // 피로도 마일스톤
  FATIGUE_MILESTONES: [
    {
      fatigue: 30,
      penalty: 0.1,
      warning: '약간의 피로가 누적되고 있습니다',
      effect: '경험치 획득 -10%'
    },
    {
      fatigue: 50,
      penalty: 0.25,
      warning: '피로가 쌓이고 있습니다. 잠시 휴식을 취하세요',
      effect: '경험치 획득 -25%'
    },
    {
      fatigue: 70,
      penalty: 0.5,
      warning: '심한 피로 상태입니다. 휴식이 필요합니다',
      effect: '경험치 획득 -50%'
    },
    {
      fatigue: 90,
      penalty: 0.8,
      warning: '탈진 직전입니다! 즉시 휴식하세요',
      effect: '경험치 획득 -80%'
    },
    {
      fatigue: 100,
      penalty: 1.0,
      warning: '탈진 상태! 활동이 제한됩니다',
      effect: '경험치 획득 불가'
    }
  ],

  // 시간대별 피로도 가중치
  TIME_FATIGUE_MULTIPLIERS: {
    earlyMorning: { start: 5, end: 7, multiplier: 0.8 }, // 새벽
    morning: { start: 7, end: 12, multiplier: 0.9 }, // 오전
    afternoon: { start: 12, end: 18, multiplier: 1.0 }, // 오후
    evening: { start: 18, end: 22, multiplier: 1.1 }, // 저녁
    lateNight: { start: 22, end: 24, multiplier: 1.5 }, // 심야
    midnight: { start: 0, end: 5, multiplier: 2.0 } // 자정-새벽
  },

  // 회복 보너스
  RECOVERY_BONUSES: {
    longRest: { hours: 8, bonus: 30 }, // 8시간 이상 휴식
    meditation: { hours: 1, bonus: 10 }, // 1시간 명상/휴식
    sleep: { hours: 6, bonus: 50 } // 6시간 이상 수면
  }
} as const

export class FatigueService {
  private static instance: FatigueService | null = null

  private constructor() {}

  static getInstance(): FatigueService {
    if (!FatigueService.instance) {
      FatigueService.instance = new FatigueService()
    }
    return FatigueService.instance
  }

  // 현재 피로도 상태 조회
  async getFatigueState(userId: string): Promise<Result<FatigueState>> {
    try {
      // DB에서 피로도 데이터 조회
      const fatigueData = await db.fatigue
        .where('userId')
        .equals(userId)
        .first()

      if (!fatigueData) {
        // 초기 상태 생성
        const initialState: FatigueState = {
          userId,
          currentFatigue: 0,
          activityStreak: 0,
          lastActivityTime: new Date(),
          lastRestTime: new Date(),
          experienceEfficiency: 1.0,
          warnings: [],
          isExhausted: false
        }

        // DB에 초기 상태 저장
        await db.fatigue.add({
          userId,
          currentFatigue: 0,
          activityStreak: 0,
          lastActivityTime: new Date(),
          lastRestTime: new Date(),
          updatedAt: new Date()
        })

        return { success: true, data: initialState }
      }

      // 시간 경과에 따른 피로도 회복 계산
      const now = new Date()
      const timeSinceLastActivity = (now.getTime() - fatigueData.lastActivityTime.getTime()) / (1000 * 60 * 60) // 시간

      let currentFatigue = fatigueData.currentFatigue
      let activityStreak = fatigueData.activityStreak

      // 휴식 시간에 따른 피로도 회복
      if (timeSinceLastActivity >= FATIGUE_CONFIG.MIN_REST_INTERVAL / 60) {
        const recoveryAmount = timeSinceLastActivity * FATIGUE_CONFIG.REST_RECOVERY_RATE
        currentFatigue = Math.max(0, currentFatigue - recoveryAmount)

        // 충분한 휴식 시 연속 활동 초기화
        if (timeSinceLastActivity >= 2) {
          activityStreak = 0
        }
      }

      // 경험치 효율 계산
      const { efficiency, milestone } = this.calculateEfficiency(currentFatigue)

      // 경고 메시지 생성
      const warnings = this.generateWarnings(currentFatigue, activityStreak)

      const state: FatigueState = {
        userId,
        currentFatigue,
        activityStreak,
        lastActivityTime: fatigueData.lastActivityTime,
        lastRestTime: fatigueData.lastRestTime,
        experienceEfficiency: efficiency,
        warnings,
        isExhausted: currentFatigue >= FATIGUE_CONFIG.EXHAUSTION_THRESHOLD,
        nextMilestone: milestone
      }

      return { success: true, data: state }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get fatigue state')
      }
    }
  }

  // 활동 수행 시 피로도 업데이트
  async recordActivity(userId: string, statType: StatType): Promise<Result<FatigueState>> {
    try {
      const currentStateResult = await this.getFatigueState(userId)
      if (!currentStateResult.success) {
        return currentStateResult
      }

      const currentState = currentStateResult.data
      const now = new Date()
      const hour = now.getHours()

      // 시간대별 피로도 가중치 적용
      const timeMultiplier = this.getTimeMultiplier(hour)

      // 연속 활동에 따른 피로도 증가량 계산
      const streakMultiplier = this.getStreakMultiplier(currentState.activityStreak + 1)

      // 최종 피로도 증가량
      const fatigueIncrease = FATIGUE_CONFIG.BASE_FATIGUE_PER_ACTIVITY * timeMultiplier * streakMultiplier
      const newFatigue = Math.min(FATIGUE_CONFIG.MAX_FATIGUE, currentState.currentFatigue + fatigueIncrease)

      // 활동 간격 확인
      const timeSinceLastActivity = (now.getTime() - currentState.lastActivityTime.getTime()) / (1000 * 60) // 분
      const newStreak = timeSinceLastActivity < FATIGUE_CONFIG.IDEAL_ACTIVITY_INTERVAL ?
        currentState.activityStreak + 1 : 1

      // DB 업데이트
      await db.fatigue
        .where('userId')
        .equals(userId)
        .modify({
          currentFatigue: newFatigue,
          activityStreak: newStreak,
          lastActivityTime: now,
          updatedAt: now
        })

      // 활동 기록 저장
      await db.fatigueActivities.add({
        userId,
        timestamp: now,
        activityCount: newStreak,
        fatigueAdded: fatigueIncrease,
        efficiency: this.calculateEfficiency(newFatigue).efficiency
      })

      // 새로운 상태 반환
      const newStateResult = await this.getFatigueState(userId)
      return newStateResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to record activity')
      }
    }
  }

  // 휴식 기록
  async recordRest(userId: string, duration: number): Promise<Result<FatigueState>> {
    try {
      const currentStateResult = await this.getFatigueState(userId)
      if (!currentStateResult.success) {
        return currentStateResult
      }

      const currentState = currentStateResult.data
      const now = new Date()

      // 휴식에 따른 피로도 회복
      let recoveryAmount = (duration / 60) * FATIGUE_CONFIG.REST_RECOVERY_RATE

      // 휴식 보너스 적용
      if (duration >= FATIGUE_CONFIG.RECOVERY_BONUSES.longRest.hours * 60) {
        recoveryAmount += FATIGUE_CONFIG.RECOVERY_BONUSES.longRest.bonus
      } else if (duration >= FATIGUE_CONFIG.RECOVERY_BONUSES.sleep.hours * 60) {
        recoveryAmount += FATIGUE_CONFIG.RECOVERY_BONUSES.sleep.bonus
      } else if (duration >= FATIGUE_CONFIG.RECOVERY_BONUSES.meditation.hours * 60) {
        recoveryAmount += FATIGUE_CONFIG.RECOVERY_BONUSES.meditation.bonus
      }

      const newFatigue = Math.max(0, currentState.currentFatigue - recoveryAmount)

      // DB 업데이트
      await db.fatigue
        .where('userId')
        .equals(userId)
        .modify({
          currentFatigue: newFatigue,
          activityStreak: 0, // 휴식 시 연속 활동 초기화
          lastRestTime: now,
          updatedAt: now
        })

      // 새로운 상태 반환
      const newStateResult = await this.getFatigueState(userId)
      return newStateResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to record rest')
      }
    }
  }

  // 경험치 효율 계산
  calculateEfficiency(fatigue: number): { efficiency: number; milestone?: FatigueMilestone } {
    const milestones = FATIGUE_CONFIG.FATIGUE_MILESTONES

    // 현재 피로도에 해당하는 마일스톤 찾기
    let currentMilestone: FatigueMilestone | undefined
    let nextMilestone: FatigueMilestone | undefined

    for (let i = 0; i < milestones.length; i++) {
      if (fatigue >= milestones[i].fatigue) {
        currentMilestone = milestones[i]
      } else {
        nextMilestone = milestones[i]
        break
      }
    }

    const penalty = currentMilestone?.penalty || 0
    const efficiency = Math.max(0, 1 - penalty)

    return { efficiency, milestone: nextMilestone }
  }

  // 피로도 통계 조회
  async getFatigueStats(userId: string, days = 7): Promise<Result<FatigueStatistics>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const activities = await db.fatigueActivities
        .where('userId')
        .equals(userId)
        .and(activity => activity.timestamp >= startDate)
        .toArray()

      const totalActivities = activities.length
      const avgFatigue = activities.reduce((sum, a) => sum + a.fatigueAdded, 0) / (totalActivities || 1)
      const avgEfficiency = activities.reduce((sum, a) => sum + a.efficiency, 0) / (totalActivities || 1)

      // 일별 통계 계산
      const dailyStats = new Map<string, DailyFatigueStat>()

      activities.forEach(activity => {
        const dateKey = activity.timestamp.toDateString()
        const existing = dailyStats.get(dateKey) || {
          date: dateKey,
          activities: 0,
          totalFatigue: 0,
          avgEfficiency: 0
        }

        dailyStats.set(dateKey, {
          date: dateKey,
          activities: existing.activities + 1,
          totalFatigue: existing.totalFatigue + activity.fatigueAdded,
          avgEfficiency: (existing.avgEfficiency * existing.activities + activity.efficiency) / (existing.activities + 1)
        })
      })

      const stats: FatigueStatistics = {
        period: `${days} days`,
        totalActivities,
        averageFatiguePerActivity: avgFatigue,
        averageEfficiency: avgEfficiency,
        dailyStats: Array.from(dailyStats.values()),
        recommendations: this.generateRecommendations(avgFatigue, avgEfficiency, totalActivities / days)
      }

      return { success: true, data: stats }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get fatigue statistics')
      }
    }
  }

  // Private helper methods
  private getTimeMultiplier(hour: number): number {
    for (const [, config] of Object.entries(FATIGUE_CONFIG.TIME_FATIGUE_MULTIPLIERS)) {
      if (
        (config.start <= config.end && hour >= config.start && hour < config.end) ||
        (config.start > config.end && (hour >= config.start || hour < config.end))
      ) {
        return config.multiplier
      }
    }
    return 1.0
  }

  private getStreakMultiplier(streak: number): number {
    const penalty = FATIGUE_CONFIG.STREAK_PENALTIES.find(p => streak >= p.streak)
    return penalty?.fatigueMultiplier || 1.0
  }

  private generateWarnings(fatigue: number, streak: number): string[] {
    const warnings: string[] = []

    // 피로도 경고
    const milestone = FATIGUE_CONFIG.FATIGUE_MILESTONES.find(m =>
      fatigue >= m.fatigue && fatigue < (m.fatigue + 20)
    )
    if (milestone) {
      warnings.push(milestone.warning)
    }

    // 연속 활동 경고
    if (streak >= 5) {
      warnings.push(`${streak}회 연속 활동 중입니다. 휴식을 권장합니다`)
    }

    // 시간대 경고
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 5) {
      warnings.push('심야 시간대입니다. 충분한 수면이 중요합니다')
    }

    return warnings
  }

  private generateRecommendations(avgFatigue: number, avgEfficiency: number, dailyActivities: number): string[] {
    const recommendations: string[] = []

    if (avgFatigue > 20) {
      recommendations.push('평균 피로도가 높습니다. 활동 간격을 늘려보세요')
    }

    if (avgEfficiency < 0.8) {
      recommendations.push('경험치 효율이 낮습니다. 충분한 휴식을 취하세요')
    }

    if (dailyActivities > 10) {
      recommendations.push('하루 활동량이 많습니다. 적절한 페이스를 유지하세요')
    }

    if (recommendations.length === 0) {
      recommendations.push('건강한 활동 패턴을 유지하고 있습니다!')
    }

    return recommendations
  }
}

// 피로도 통계 인터페이스
export interface FatigueStatistics {
  readonly period: string
  readonly totalActivities: number
  readonly averageFatiguePerActivity: number
  readonly averageEfficiency: number
  readonly dailyStats: ReadonlyArray<DailyFatigueStat>
  readonly recommendations: ReadonlyArray<string>
}

export interface DailyFatigueStat {
  readonly date: string
  readonly activities: number
  readonly totalFatigue: number
  readonly avgEfficiency: number
}
