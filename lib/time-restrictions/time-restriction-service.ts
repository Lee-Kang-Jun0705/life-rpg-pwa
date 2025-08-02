import type { Result } from '@/lib/types/experience'
import type { StatType } from '@/lib/types/game-common'

// 시간대별 활동 제한 설정
export interface TimeRestriction {
  readonly start: number // 시작 시간 (0-23)
  readonly end: number   // 종료 시간 (0-23)
  readonly name: string
  readonly type: 'penalty' | 'bonus' | 'blocked'
  readonly value: number // 페널티/보너스 비율 (0-1)
  readonly message: string
  readonly statTypes?: ReadonlyArray<StatType> // 특정 스탯만 영향받음
}

// 시간대별 활동 상태
export interface TimeActivityState {
  readonly currentHour: number
  readonly timeZoneName: string
  readonly restriction: TimeRestriction | null
  readonly isRestricted: boolean
  readonly isPenalty: boolean
  readonly isBonus: boolean
  readonly multiplier: number
  readonly message?: string
  readonly recommendedActivities: ReadonlyArray<string>
}

// 시간대별 통계
export interface TimeActivityStats {
  readonly mostActiveHours: ReadonlyArray<{ hour: number; count: number }>
  readonly leastActiveHours: ReadonlyArray<{ hour: number; count: number }>
  readonly nightOwlScore: number // 0-100, 높을수록 야행성
  readonly morningPersonScore: number // 0-100, 높을수록 아침형
  readonly healthyPatternScore: number // 0-100, 건강한 패턴
  readonly recommendations: ReadonlyArray<string>
}

// 시간대별 제한 설정
const TIME_RESTRICTIONS: ReadonlyArray<TimeRestriction> = [
  // 심야 시간대 (자정-새벽)
  {
    start: 0,
    end: 5,
    name: '심야 시간대',
    type: 'penalty',
    value: 0.7, // 30% 페널티
    message: '심야 시간대입니다. 충분한 수면이 건강에 중요합니다.'
  },
  {
    start: 2,
    end: 4,
    name: '깊은 밤',
    type: 'blocked',
    value: 0,
    message: '깊은 밤 시간대입니다. 건강을 위해 활동이 제한됩니다.',
    statTypes: ['health'] // 건강 활동만 제한
  },

  // 새벽 시간대
  {
    start: 5,
    end: 7,
    name: '이른 아침',
    type: 'bonus',
    value: 1.3, // 30% 보너스
    message: '상쾌한 아침! 하루를 활기차게 시작하세요.'
  },

  // 아침 시간대
  {
    start: 7,
    end: 9,
    name: '아침 황금시간',
    type: 'bonus',
    value: 1.5, // 50% 보너스
    message: '가장 생산적인 시간대입니다! 중요한 활동을 해보세요.'
  },

  // 점심 시간대
  {
    start: 12,
    end: 13,
    name: '점심 시간',
    type: 'bonus',
    value: 1.1, // 10% 보너스
    message: '점심 시간의 짧은 활동도 좋습니다.'
  },

  // 오후 슬럼프
  {
    start: 14,
    end: 15,
    name: '오후 슬럼프',
    type: 'penalty',
    value: 0.9, // 10% 페널티
    message: '졸린 시간대입니다. 가벼운 활동이나 휴식을 추천합니다.'
  },

  // 저녁 시간대
  {
    start: 18,
    end: 21,
    name: '저녁 활동 시간',
    type: 'bonus',
    value: 1.2, // 20% 보너스
    message: '하루를 마무리하는 좋은 시간입니다.'
  },

  // 늦은 밤
  {
    start: 22,
    end: 24,
    name: '늦은 밤',
    type: 'penalty',
    value: 0.8, // 20% 페널티
    message: '곧 잠들 시간입니다. 가벼운 활동만 하세요.'
  }
]

// 시간대별 추천 활동
const TIME_RECOMMENDATIONS: Record<string, ReadonlyArray<string>> = {
  '이른 아침': ['운동', '명상', '독서', '계획 수립'],
  '아침 황금시간': ['중요한 업무', '학습', '창의적 작업'],
  '점심 시간': ['가벼운 운동', '산책', '짧은 학습'],
  '오후 슬럼프': ['휴식', '가벼운 스트레칭', '간단한 정리'],
  '저녁 활동 시간': ['운동', '취미 활동', '사교 활동'],
  '늦은 밤': ['일기 쓰기', '내일 계획', '가벼운 독서'],
  '심야 시간대': ['수면 준비', '명상'],
  '깊은 밤': ['수면']
}

export class TimeRestrictionService {
  private static instance: TimeRestrictionService | null = null

  private constructor() {}

  static getInstance(): TimeRestrictionService {
    if (!TimeRestrictionService.instance) {
      TimeRestrictionService.instance = new TimeRestrictionService()
    }
    return TimeRestrictionService.instance
  }

  // 현재 시간대 활동 상태 조회
  getCurrentTimeState(statType?: StatType): TimeActivityState {
    const now = new Date()
    const currentHour = now.getHours()

    // 해당 시간대의 제한 찾기
    let activeRestriction: TimeRestriction | null = null
    let highestPriority = -1

    for (const restriction of TIME_RESTRICTIONS) {
      if (this.isInTimeRange(currentHour, restriction.start, restriction.end)) {
        // 특정 스탯 타입 제한 확인
        if (restriction.statTypes && statType && !restriction.statTypes.includes(statType)) {
          continue
        }

        // 우선순위: blocked > penalty > bonus
        const priority = restriction.type === 'blocked' ? 3 :
          restriction.type === 'penalty' ? 2 : 1

        if (priority > highestPriority) {
          activeRestriction = restriction
          highestPriority = priority
        }
      }
    }

    const timeZoneName = activeRestriction?.name || '일반 시간대'
    const recommendedActivities = TIME_RECOMMENDATIONS[timeZoneName] || []

    return {
      currentHour,
      timeZoneName,
      restriction: activeRestriction,
      isRestricted: activeRestriction?.type === 'blocked',
      isPenalty: activeRestriction?.type === 'penalty',
      isBonus: activeRestriction?.type === 'bonus',
      multiplier: activeRestriction?.value || 1.0,
      message: activeRestriction?.message,
      recommendedActivities
    }
  }

  // 시간대별 경험치 배율 계산
  calculateTimeMultiplier(hour?: number, statType?: StatType): number {
    const targetHour = hour ?? new Date().getHours()
    let multiplier = 1.0

    for (const restriction of TIME_RESTRICTIONS) {
      if (this.isInTimeRange(targetHour, restriction.start, restriction.end)) {
        // 특정 스탯 타입 제한 확인
        if (restriction.statTypes && statType && !restriction.statTypes.includes(statType)) {
          continue
        }

        if (restriction.type === 'blocked') {
          return 0 // 완전 차단
        }

        // 가장 제한적인 배율 적용
        if (restriction.value < multiplier) {
          multiplier = restriction.value
        }
      }
    }

    return multiplier
  }

  // 특정 시간대가 활동하기 좋은지 확인
  isGoodTimeForActivity(hour?: number, statType?: StatType): boolean {
    const state = hour !== undefined ?
      this.getTimeStateForHour(hour, statType) :
      this.getCurrentTimeState(statType)

    return !state.isRestricted && !state.isPenalty
  }

  // 다음 좋은 활동 시간 찾기
  findNextGoodTime(statType?: StatType): { hour: number; name: string; bonus: boolean } | null {
    const currentHour = new Date().getHours()

    // 다음 24시간 동안 확인
    for (let i = 1; i <= 24; i++) {
      const checkHour = (currentHour + i) % 24
      const state = this.getTimeStateForHour(checkHour, statType)

      if (!state.isRestricted && !state.isPenalty) {
        return {
          hour: checkHour,
          name: state.timeZoneName,
          bonus: state.isBonus
        }
      }
    }

    return null
  }

  // 시간대별 활동 통계 분석
  async analyzeTimeActivityPatterns(
    userId: string,
    activities: ReadonlyArray<{ timestamp: Date; statType: StatType }>
  ): Promise<TimeActivityStats> {
    // 시간대별 활동 횟수 집계
    const hourCounts = new Array(24).fill(0)

    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours()
      hourCounts[hour]++
    })

    // 가장 활발한 시간대
    const sortedHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)

    const mostActiveHours = sortedHours.slice(0, 3)
    const leastActiveHours = sortedHours.slice(-3).reverse()

    // 활동 패턴 점수 계산
    const nightOwlScore = this.calculateNightOwlScore(hourCounts)
    const morningPersonScore = this.calculateMorningPersonScore(hourCounts)
    const healthyPatternScore = this.calculateHealthyPatternScore(hourCounts)

    // 추천사항 생성
    const recommendations = this.generateTimeRecommendations(
      nightOwlScore,
      morningPersonScore,
      healthyPatternScore,
      mostActiveHours
    )

    return {
      mostActiveHours,
      leastActiveHours,
      nightOwlScore,
      morningPersonScore,
      healthyPatternScore,
      recommendations
    }
  }

  // Private helper methods
  private isInTimeRange(hour: number, start: number, end: number): boolean {
    if (start <= end) {
      return hour >= start && hour < end
    } else {
      // 자정을 넘는 경우 (예: 22-2)
      return hour >= start || hour < end
    }
  }

  private getTimeStateForHour(hour: number, statType?: StatType): TimeActivityState {
    const mockDate = new Date()
    mockDate.setHours(hour)
    const originalGetHours = Date.prototype.getHours
    Date.prototype.getHours = function() {
      return hour
    }

    try {
      return this.getCurrentTimeState(statType)
    } finally {
      Date.prototype.getHours = originalGetHours
    }
  }

  private calculateNightOwlScore(hourCounts: number[]): number {
    const nightHours = [22, 23, 0, 1, 2, 3]
    const nightActivity = nightHours.reduce((sum, hour) => sum + hourCounts[hour], 0)
    const totalActivity = hourCounts.reduce((sum, count) => sum + count, 0) || 1

    return Math.min(100, Math.round((nightActivity / totalActivity) * 200))
  }

  private calculateMorningPersonScore(hourCounts: number[]): number {
    const morningHours = [5, 6, 7, 8, 9]
    const morningActivity = morningHours.reduce((sum, hour) => sum + hourCounts[hour], 0)
    const totalActivity = hourCounts.reduce((sum, count) => sum + count, 0) || 1

    return Math.min(100, Math.round((morningActivity / totalActivity) * 200))
  }

  private calculateHealthyPatternScore(hourCounts: number[]): number {
    const healthyHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
    const healthyActivity = healthyHours.reduce((sum, hour) => sum + hourCounts[hour], 0)
    const totalActivity = hourCounts.reduce((sum, count) => sum + count, 0) || 1

    const healthyRatio = healthyActivity / totalActivity
    const nightActivity = [0, 1, 2, 3, 4].reduce((sum, hour) => sum + hourCounts[hour], 0)
    const nightPenalty = (nightActivity / totalActivity) * 50

    return Math.max(0, Math.min(100, Math.round(healthyRatio * 100 - nightPenalty)))
  }

  private generateTimeRecommendations(
    nightOwlScore: number,
    morningPersonScore: number,
    healthyPatternScore: number,
    mostActiveHours: { hour: number; count: number }[]
  ): string[] {
    const recommendations: string[] = []

    if (healthyPatternScore < 50) {
      recommendations.push('건강한 생활 패턴을 위해 심야 활동을 줄이고 규칙적인 수면을 취하세요')
    }

    if (nightOwlScore > 70) {
      recommendations.push('야행성 패턴이 강합니다. 점진적으로 수면 시간을 앞당겨보세요')
    }

    if (morningPersonScore > 70) {
      recommendations.push('아침형 인간입니다! 아침 황금시간(7-9시)을 최대한 활용하세요')
    }

    if (mostActiveHours[0]?.hour >= 22 || mostActiveHours[0]?.hour <= 4) {
      recommendations.push('주요 활동 시간을 낮 시간대로 옮기면 더 많은 경험치를 얻을 수 있습니다')
    }

    if (recommendations.length === 0) {
      recommendations.push('훌륭한 활동 패턴을 유지하고 있습니다!')
    }

    return recommendations
  }
}
