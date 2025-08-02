import type {
  Activity,
  ActivityQuality,
  ExpCalculationResult,
  AppliedBonus,
  AppliedPenalty,
  ExpContext,
  LevelInfo
} from '@/lib/types/experience'
import { ACTIVITY_QUALITY } from '@/lib/types/experience'

export class ExpCalculator {
  // 품질별 기본 경험치
  private static readonly QUALITY_BASE_EXP: Record<ActivityQuality, number> = {
    [ACTIVITY_QUALITY.D]: 10,   // 단순 클릭
    [ACTIVITY_QUALITY.C]: 30,   // 활동명만
    [ACTIVITY_QUALITY.B]: 50,   // 구체적 설명
    [ACTIVITY_QUALITY.A]: 70,   // 시간/장소 포함
    [ACTIVITY_QUALITY.S]: 100   // 미디어 인증
  }

  // 품질별 배수
  private static readonly QUALITY_MULTIPLIERS: Record<ActivityQuality, number> = {
    [ACTIVITY_QUALITY.D]: 1.0,
    [ACTIVITY_QUALITY.C]: 1.5,
    [ACTIVITY_QUALITY.B]: 2.0,
    [ACTIVITY_QUALITY.A]: 2.5,
    [ACTIVITY_QUALITY.S]: 3.0
  }

  // 레벨별 필요 경험치 계산
  static calculateRequiredExp(level: number): number {
    if (level <= 0) {
      return 0
    }
    if (level === 1) {
      return 100
    }

    // 레벨별 점진적 증가
    if (level <= 10) {
      // 1-10: 선형 증가 (100, 200, 300...)
      return 100 * level
    } else if (level <= 30) {
      // 11-30: 완만한 지수 증가
      const baseExp = 200
      return Math.floor(baseExp * level * Math.pow(1.1, level - 10))
    } else if (level <= 50) {
      // 31-50: 가파른 증가
      const baseExp = 500
      return Math.floor(baseExp * level * Math.pow(1.2, level - 30))
    } else {
      // 51+: 명예 레벨 (매우 높은 요구치)
      const baseExp = 1000
      return Math.floor(baseExp * level * Math.pow(1.3, level - 50))
    }
  }

  // 총 경험치로 레벨 정보 계산
  static calculateLevel(totalExp: number): LevelInfo {
    let level = 1
    let remainingExp = totalExp
    let currentLevelExp = 0

    // 레벨업 가능한 만큼 반복
    while (remainingExp > 0) {
      const requiredExp = this.calculateRequiredExp(level)
      if (remainingExp >= requiredExp) {
        remainingExp -= requiredExp
        level++
      } else {
        currentLevelExp = remainingExp
        break
      }
    }

    const requiredExpForCurrentLevel = this.calculateRequiredExp(level)
    const requiredExpForNextLevel = this.calculateRequiredExp(level + 1)
    const progress = requiredExpForCurrentLevel > 0
      ? (currentLevelExp / requiredExpForCurrentLevel) * 100
      : 0

    return {
      level,
      currentExp: currentLevelExp,
      requiredExp: requiredExpForCurrentLevel,
      totalExp,
      progress,
      nextLevelExp: requiredExpForNextLevel,
      prestigeLevel: level > 100 ? Math.floor((level - 100) / 10) : undefined
    }
  }

  // 활동 경험치 계산
  static calculateActivityExp(
    activity: Activity,
    context: ExpContext
  ): ExpCalculationResult {
    // 기본 경험치와 품질 배수
    const baseExp = this.QUALITY_BASE_EXP[activity.quality]
    const qualityMultiplier = this.QUALITY_MULTIPLIERS[activity.quality]

    // 보너스 계산
    const bonuses: AppliedBonus[] = []
    let totalBonusMultiplier = 1.0

    // 시간대 보너스
    const timeBonus = this.calculateTimeBonus(context.time)
    if (timeBonus.value !== 0) {
      bonuses.push(timeBonus)
      totalBonusMultiplier += timeBonus.value
    }

    // 연속 활동 보너스
    const streakBonus = this.calculateStreakBonus(context.user.streakDays)
    if (streakBonus.value > 0) {
      bonuses.push(streakBonus)
      totalBonusMultiplier += streakBonus.value
    }

    // 다양성 보너스
    const varietyBonus = this.calculateVarietyBonus(activity, context.previousActivities)
    if (varietyBonus.value > 0) {
      bonuses.push(varietyBonus)
      totalBonusMultiplier += varietyBonus.value
    }

    // 첫 활동 보너스
    if (this.isFirstTimeActivity(activity, context.previousActivities)) {
      const firstTimeBonus: AppliedBonus = {
        type: 'first_time',
        name: '첫 활동 보너스',
        value: 0.5,
        description: '새로운 활동 도전'
      }
      bonuses.push(firstTimeBonus)
      totalBonusMultiplier += firstTimeBonus.value
    }

    // 페널티 계산
    const penalties: AppliedPenalty[] = []
    let totalPenaltyMultiplier = 1.0

    // 반복 페널티
    const repetitionPenalty = this.calculateRepetitionPenalty(activity, context.previousActivities)
    if (repetitionPenalty.value > 0) {
      penalties.push(repetitionPenalty)
      totalPenaltyMultiplier -= repetitionPenalty.value
    }

    // 짧은 간격 페널티
    const intervalPenalty = this.calculateIntervalPenalty(activity, context.previousActivities)
    if (intervalPenalty.value > 0) {
      penalties.push(intervalPenalty)
      totalPenaltyMultiplier -= intervalPenalty.value
    }

    // 최종 경험치 계산
    const finalExp = Math.floor(
      baseExp * qualityMultiplier * totalBonusMultiplier * totalPenaltyMultiplier
    )

    // 경고 메시지 수집
    const warnings: string[] = []
    if (repetitionPenalty.value >= 0.3) {
      warnings.push('동일한 활동을 너무 자주 반복하고 있습니다')
    }
    if (intervalPenalty.value > 0) {
      warnings.push('활동 간격이 너무 짧습니다')
    }

    return {
      baseExp,
      qualityMultiplier,
      bonuses,
      penalties,
      finalExp: Math.max(1, finalExp), // 최소 1 경험치 보장
      capped: false,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  // 시간대 보너스 계산
  private static calculateTimeBonus(time: Date): AppliedBonus {
    const hour = time.getHours()

    if (hour >= 6 && hour < 9) {
      return {
        type: 'time',
        name: '아침 활동 보너스',
        value: 0.2,
        description: '상쾌한 아침 시간대'
      }
    } else if (hour >= 18 && hour < 21) {
      return {
        type: 'time',
        name: '저녁 활동 보너스',
        value: 0.15,
        description: '활발한 저녁 시간대'
      }
    } else if (hour >= 0 && hour < 5) {
      return {
        type: 'time',
        name: '심야 활동 패널티',
        value: -0.2,
        description: '늦은 시간 활동'
      }
    }

    return {
      type: 'time',
      name: '일반 시간대',
      value: 0
    }
  }

  // 연속 활동 보너스 계산
  private static calculateStreakBonus(streakDays: number): AppliedBonus {
    let value = 0
    let description = ''

    if (streakDays >= 100) {
      value = 1.0
      description = '100일 이상 연속 활동!'
    } else if (streakDays >= 30) {
      value = 0.5
      description = '30일 이상 연속 활동'
    } else if (streakDays >= 7) {
      value = 0.2
      description = '7일 연속 활동'
    } else if (streakDays >= 3) {
      value = 0.1
      description = '3일 연속 활동'
    }

    return {
      type: 'streak',
      name: '연속 활동 보너스',
      value,
      description
    }
  }

  // 다양성 보너스 계산
  private static calculateVarietyBonus(
    activity: Activity,
    previousActivities: ReadonlyArray<Activity>
  ): AppliedBonus {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = previousActivities.filter(
      a => new Date(a.timestamp) >= today
    )

    const uniqueActivities = new Set(todayActivities.map(a => a.activityName))
    const uniqueStats = new Set(todayActivities.map(a => a.statType))

    let value = 0
    let description = ''

    if (uniqueActivities.size >= 10) {
      value = 0.5
      description = '10가지 이상의 다양한 활동'
    } else if (uniqueActivities.size >= 5) {
      value = 0.3
      description = '5가지 이상의 다양한 활동'
    } else if (uniqueActivities.size >= 3) {
      value = 0.1
      description = '3가지 이상의 다양한 활동'
    }

    // 모든 스탯 활동 보너스
    if (uniqueStats.size === 4) {
      value += 0.2
      description += description ? ' + 모든 영역 균형 활동' : '모든 영역 균형 활동'
    }

    return {
      type: 'variety',
      name: '다양성 보너스',
      value,
      description
    }
  }

  // 반복 페널티 계산
  private static calculateRepetitionPenalty(
    activity: Activity,
    previousActivities: ReadonlyArray<Activity>
  ): AppliedPenalty {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentSameActivities = previousActivities.filter(
      a => a.activityName === activity.activityName &&
           new Date(a.timestamp) >= oneHourAgo
    )

    const count = recentSameActivities.length

    if (count >= 10) {
      return {
        type: 'repetition',
        name: '과도한 반복 페널티',
        value: 0.7,
        reason: `1시간 내 동일 활동 ${count}회 반복`
      }
    } else if (count >= 5) {
      return {
        type: 'repetition',
        name: '반복 활동 페널티',
        value: 0.5,
        reason: `1시간 내 동일 활동 ${count}회 반복`
      }
    } else if (count >= 3) {
      return {
        type: 'repetition',
        name: '약한 반복 페널티',
        value: 0.2,
        reason: `1시간 내 동일 활동 ${count}회 반복`
      }
    }

    return {
      type: 'repetition',
      name: '반복 페널티 없음',
      value: 0,
      reason: '정상 활동 패턴'
    }
  }

  // 활동 간격 페널티
  private static calculateIntervalPenalty(
    activity: Activity,
    previousActivities: ReadonlyArray<Activity>
  ): AppliedPenalty {
    if (previousActivities.length === 0) {
      return {
        type: 'interval',
        name: '간격 페널티 없음',
        value: 0,
        reason: '첫 활동'
      }
    }

    const lastActivity = previousActivities
      .filter(a => a.statType === activity.statType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    if (!lastActivity) {
      return {
        type: 'interval',
        name: '간격 페널티 없음',
        value: 0,
        reason: '해당 스탯 첫 활동'
      }
    }

    const intervalMinutes = (activity.timestamp.getTime() - lastActivity.timestamp.getTime()) / (1000 * 60)

    if (intervalMinutes < 1) {
      return {
        type: 'interval',
        name: '너무 짧은 간격',
        value: 0.9,
        reason: '1분 이내 재활동'
      }
    } else if (intervalMinutes < 5) {
      return {
        type: 'interval',
        name: '짧은 활동 간격',
        value: 0.3,
        reason: '5분 이내 재활동'
      }
    }

    return {
      type: 'interval',
      name: '간격 페널티 없음',
      value: 0,
      reason: '정상 활동 간격'
    }
  }

  // 첫 활동 여부 확인
  private static isFirstTimeActivity(
    activity: Activity,
    previousActivities: ReadonlyArray<Activity>
  ): boolean {
    return !previousActivities.some(
      a => a.activityName === activity.activityName
    )
  }

  // 레벨업 필요 경험치 미리보기
  static getExpPreview(currentLevel: number, levelsAhead = 5): LevelExpPreview[] {
    const preview: LevelExpPreview[] = []

    for (let i = 0; i < levelsAhead; i++) {
      const level = currentLevel + i + 1
      const requiredExp = this.calculateRequiredExp(level)
      const totalExpNeeded = this.getTotalExpForLevel(level)

      preview.push({
        level,
        requiredExp,
        totalExpNeeded,
        milestone: this.getLevelMilestone(level)
      })
    }

    return preview
  }

  // 특정 레벨까지의 총 경험치
  private static getTotalExpForLevel(targetLevel: number): number {
    let total = 0
    for (let level = 1; level < targetLevel; level++) {
      total += this.calculateRequiredExp(level)
    }
    return total
  }

  // 레벨 마일스톤
  private static getLevelMilestone(level: number): string | undefined {
    if (level === 10) {
      return '초보자 졸업'
    }
    if (level === 30) {
      return '숙련자 달성'
    }
    if (level === 50) {
      return '전문가 인정'
    }
    if (level === 100) {
      return '마스터 등극'
    }
    if (level % 10 === 0) {
      return `레벨 ${level} 달성`
    }
    return undefined
  }
}

// 타입 정의
interface LevelExpPreview {
  level: number
  requiredExp: number
  totalExpNeeded: number
  milestone?: string
}
