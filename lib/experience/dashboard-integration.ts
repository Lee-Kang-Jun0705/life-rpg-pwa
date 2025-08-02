import type {
  Activity,
  ActivityQuality,
  ExpCalculationResult,
  ExpContext,
  Result
} from '@/lib/types/experience'
import type { StatType } from '@/lib/types/game-common'
import { ExperienceManager } from './experience-manager'
import { DailyLimitService } from './daily-limit-service'
import { ExpCalculator } from './exp-calculator'
import { db } from '@/lib/database'
import { GAME_CONFIG } from '@/lib/types/dashboard'

// 기존 대시보드 활동과 새로운 경험치 시스템 통합
export class DashboardIntegration {
  private static instance: DashboardIntegration | null = null
  private expManager: ExperienceManager
  private limitService: DailyLimitService

  private constructor() {
    this.expManager = ExperienceManager.getInstance()
    this.limitService = DailyLimitService.getInstance()
  }

  static getInstance(): DashboardIntegration {
    if (!DashboardIntegration.instance) {
      DashboardIntegration.instance = new DashboardIntegration()
    }
    return DashboardIntegration.instance
  }

  // 대시보드 활동을 경험치 시스템에 기록
  async recordDashboardActivity(
    userId: string,
    statType: StatType,
    activityData: {
      description: string
      timeSpent?: number
      isVoiceInput?: boolean
      mediaUrl?: string
    }
  ): Promise<Result<ActivityRecordResult>> {
    try {
      // 활동 품질 결정
      const quality = this.determineQuality(activityData)

      // 활동명 추출
      const activityName = this.extractActivityName(activityData.description)

      // 이전 활동 조회
      const previousActivities = await this.getRecentActivities(userId, 24) // 24시간

      // 연속 활동일 수 조회
      const streakDays = await this.getStreakDays(userId)

      // 활동 객체 생성
      const activity: Activity = {
        userId,
        statType,
        activityName,
        description: activityData.description,
        quality,
        experience: 0, // 계산 예정
        timestamp: new Date(),
        duration: activityData.timeSpent,
        mediaUrl: activityData.mediaUrl,
        synced: false,
        metadata: {
          method: activityData.isVoiceInput ? 'voice' : 'manual',
          voiceTranscript: activityData.isVoiceInput ? activityData.description : undefined
        }
      }

      // 경험치 계산 컨텍스트
      const context: ExpContext = {
        user: {
          userId,
          level: await this.getUserLevel(userId, statType),
          streakDays,
          isPremium: false,
          timezone: 'Asia/Seoul'
        },
        time: new Date(),
        previousActivities
      }

      // 경험치 계산
      const expResult = await this.expManager.calculateActivityExp(activity, context)

      if (!expResult.success) {
        return { success: false, error: expResult.error }
      }

      const calculatedExp = expResult.data.finalExp

      // 활동 기록 및 스탯 업데이트
      const recordResult = await this.expManager.recordActivity(
        { ...activity, experience: calculatedExp },
        calculatedExp
      )

      if (!recordResult.success) {
        return { success: false, error: recordResult.error }
      }

      // 기존 대시보드 데이터와 동기화
      await this.syncWithDashboard(userId, statType, calculatedExp)

      // 레벨업 확인
      const levelInfo = ExpCalculator.calculateLevel(
        await this.getTotalExp(userId, statType)
      )

      const previousLevel = await this.getUserLevel(userId, statType)
      const leveledUp = levelInfo.level > previousLevel

      return {
        success: true,
        data: {
          activity,
          expResult: expResult.data,
          levelInfo,
          leveledUp,
          dailyProgress: await this.getDailyProgress(userId, statType)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to record activity')
      }
    }
  }

  // 활동 품질 결정
  private determineQuality(activityData: {
    description: string
    timeSpent?: number
    mediaUrl?: string
  }): ActivityQuality {
    const description = activityData.description.trim()

    // S급: 미디어 첨부
    if (activityData.mediaUrl) {
      return 'S'
    }

    // A급: 시간 정보 + 상세 설명
    if (activityData.timeSpent && activityData.timeSpent >= 10 && description.length > 50) {
      return 'A'
    }

    // B급: 구체적 설명
    if (description.length > 20 && this.hasDetailedContent(description)) {
      return 'B'
    }

    // C급: 기본 설명
    if (description.length > 5) {
      return 'C'
    }

    // D급: 최소 입력
    return 'D'
  }

  // 상세 내용 포함 여부 확인
  private hasDetailedContent(description: string): boolean {
    // 숫자, 시간, 장소 등의 구체적 정보 포함 여부
    const patterns = [
      /\d+분/,
      /\d+시간/,
      /\d+개/,
      /\d+회/,
      /\d+km/,
      /\d+kg/,
      /장소:/,
      /에서/,
      /함께/,
      /때문에/,
      /위해/
    ]

    return patterns.some(pattern => pattern.test(description))
  }

  // 활동명 추출
  private extractActivityName(description: string): string {
    // 첫 문장이나 주요 동사를 활동명으로 추출
    const firstSentence = description.split(/[.!?]/)[0].trim()

    if (firstSentence.length <= 20) {
      return firstSentence
    }

    // 주요 동사 추출 (간단한 규칙 기반)
    const verbs = ['운동', '공부', '독서', '요리', '청소', '산책', '명상', '글쓰기']
    for (const verb of verbs) {
      if (description.includes(verb)) {
        return verb
      }
    }

    // 기본값: 처음 20자
    return description.substring(0, 20) + '...'
  }

  // 최근 활동 조회
  private async getRecentActivities(
    userId: string,
    hours: number
  ): Promise<Activity[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    return await db.activities
      .where('userId')
      .equals(userId)
      .and(activity => new Date(activity.timestamp) >= since)
      .toArray()
  }

  // 연속 활동일 조회
  private async getStreakDays(userId: string): Promise<number> {
    const stats = await this.limitService.getStatistics(userId, 30)
    return stats.success ? stats.data.currentStreak : 0
  }

  // 사용자 레벨 조회
  private async getUserLevel(userId: string, statType: StatType): Promise<number> {
    const stat = await db.playerStats
      .where('[userId+statType]')
      .equals([userId, statType])
      .first()

    return stat?.level || 1
  }

  // 총 경험치 조회
  private async getTotalExp(userId: string, statType: StatType): Promise<number> {
    const stat = await db.playerStats
      .where('[userId+statType]')
      .equals([userId, statType])
      .first()

    return stat?.totalExp || 0
  }

  // 기존 대시보드와 동기화
  private async syncWithDashboard(
    userId: string,
    statType: StatType,
    expGained: number
  ): Promise<void> {
    // 기존 대시보드 데이터 업데이트
    const characterData = await db.playerData
      .where('id')
      .equals('character')
      .first()

    if (characterData?.data && typeof characterData.data === 'object' && !Array.isArray(characterData.data)) {
      const dataObj = characterData.data as { stats?: Record<string, number> }
      const stats = dataObj.stats || {}
      const currentValue = stats[statType] || 0

      // 경험치를 스탯 포인트로 변환 (10 exp = 1 point)
      const pointsGained = Math.floor(expGained / 10)

      stats[statType] = Math.min(
        currentValue + pointsGained,
        100 // Maximum stat value
      )

      await db.playerData.put({
        id: 'character',
        data: { ...dataObj, stats },
        updatedAt: new Date()
      })
    }
  }

  // 일일 진행도 조회
  private async getDailyProgress(
    userId: string,
    statType: StatType
  ): Promise<DailyProgress> {
    const limitResult = await this.limitService.getDailyLimit(userId, statType)

    if (!limitResult.success) {
      return {
        currentExp: 0,
        dailyLimit: 500,
        percentage: 0,
        remainingExp: 500,
        bonusLimit: 0
      }
    }

    const limit = limitResult.data
    const totalLimit = limit.baseLimit + limit.bonusLimit

    return {
      currentExp: limit.currentExp,
      dailyLimit: totalLimit,
      percentage: (limit.currentExp / totalLimit) * 100,
      remainingExp: Math.max(0, totalLimit - limit.currentExp),
      bonusLimit: limit.bonusLimit
    }
  }

  // 스탯별 레벨 정보 조회
  async getAllStatLevels(userId: string): Promise<Record<StatType, LevelSummary>> {
    const statTypes: StatType[] = ['health', 'learning', 'relationship', 'achievement']
    const levels: Record<string, LevelSummary> = {}

    for (const statType of statTypes) {
      const stat = await db.playerStats
        .where('[userId+statType]')
        .equals([userId, statType])
        .first()

      if (stat) {
        const levelInfo = ExpCalculator.calculateLevel(stat.totalExp)
        const dailyProgress = await this.getDailyProgress(userId, statType)

        levels[statType] = {
          level: levelInfo.level,
          currentExp: levelInfo.currentExp,
          requiredExp: levelInfo.requiredExp,
          progress: levelInfo.progress,
          totalExp: stat.totalExp,
          dailyProgress
        }
      } else {
        levels[statType] = {
          level: 1,
          currentExp: 0,
          requiredExp: 100,
          progress: 0,
          totalExp: 0,
          dailyProgress: await this.getDailyProgress(userId, statType)
        }
      }
    }

    return levels as Record<StatType, LevelSummary>
  }

  // 주간 통계 조회
  async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    const activities = await db.activities
      .where('userId')
      .equals(userId)
      .and(activity => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(activity.timestamp) >= weekAgo
      })
      .toArray()

    const statBreakdown: Record<string, number> = {}
    const dailyExp: Record<string, number> = {}
    let totalExp = 0

    for (const activity of activities) {
      totalExp += activity.experience

      // 스탯별 분류
      statBreakdown[activity.statType] = (statBreakdown[activity.statType] || 0) + activity.experience

      // 일별 분류
      const dateKey = new Date(activity.timestamp).toISOString().split('T')[0]
      dailyExp[dateKey] = (dailyExp[dateKey] || 0) + activity.experience
    }

    const avgDaily = Object.keys(dailyExp).length > 0
      ? totalExp / Object.keys(dailyExp).length
      : 0

    return {
      totalExp,
      totalActivities: activities.length,
      averageDailyExp: avgDaily,
      statBreakdown,
      dailyExp,
      mostActiveDay: Object.entries(dailyExp)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      qualityDistribution: this.getQualityDistribution(activities)
    }
  }

  // 품질 분포 계산
  private getQualityDistribution(activities: Activity[]): Record<ActivityQuality, number> {
    const distribution: Record<string, number> = {
      D: 0, C: 0, B: 0, A: 0, S: 0
    }

    for (const activity of activities) {
      distribution[activity.quality]++
    }

    return distribution as Record<ActivityQuality, number>
  }
}

// 타입 정의
interface ActivityRecordResult {
  activity: Activity
  expResult: ExpCalculationResult
  levelInfo: ReturnType<typeof ExpCalculator.calculateLevel>
  leveledUp: boolean
  dailyProgress: DailyProgress
}

interface DailyProgress {
  currentExp: number
  dailyLimit: number
  percentage: number
  remainingExp: number
  bonusLimit: number
}

interface LevelSummary {
  level: number
  currentExp: number
  requiredExp: number
  progress: number
  totalExp: number
  dailyProgress: DailyProgress
}

interface WeeklyStats {
  totalExp: number
  totalActivities: number
  averageDailyExp: number
  statBreakdown: Record<string, number>
  dailyExp: Record<string, number>
  mostActiveDay: string
  qualityDistribution: Record<ActivityQuality, number>
}
