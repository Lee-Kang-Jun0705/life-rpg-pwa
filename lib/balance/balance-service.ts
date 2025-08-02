import type { StatType } from '@/lib/types/game-common'
import type { Result } from '@/lib/types/experience'
import { db } from '@/lib/database'

// 균형 상태
export interface BalanceState {
  readonly userId: string
  readonly statLevels: Record<StatType, number>
  readonly totalLevel: number
  readonly averageLevel: number
  readonly highestStat: { type: StatType; level: number }
  readonly lowestStat: { type: StatType; level: number }
  readonly levelGap: number
  readonly balanceScore: number // 0-100, 높을수록 균형잡힘
  readonly balanceMultiplier: number // 경험치 보너스/페널티
  readonly recommendations: ReadonlyArray<string>
  readonly warnings: ReadonlyArray<string>
}

// 균형 보너스/페널티 설정
export interface BalanceBonus {
  readonly type: 'balanced' | 'specialized' | 'imbalanced'
  readonly name: string
  readonly multiplier: number
  readonly description: string
}

// 균형 통계
export interface BalanceStatistics {
  readonly period: string
  readonly balanceHistory: ReadonlyArray<{
    date: Date
    balanceScore: number
    levelGap: number
  }>
  readonly statGrowthRates: Record<StatType, number>
  readonly mostImprovedStat: StatType | null
  readonly mostNeglectedStat: StatType | null
  readonly recommendations: ReadonlyArray<string>
}

// 균형 시스템 설정
const BALANCE_CONFIG = {
  // 레벨 격차 임계값
  LEVEL_GAP_THRESHOLDS: {
    PERFECT: 2,    // 완벽한 균형
    GOOD: 5,       // 좋은 균형
    MODERATE: 10,  // 보통
    POOR: 15,      // 불균형
    SEVERE: 20     // 심각한 불균형
  },

  // 균형 점수 계산 가중치
  BALANCE_SCORE_WEIGHTS: {
    LEVEL_GAP: 0.5,      // 레벨 격차
    DEVIATION: 0.3,      // 표준편차
    MIN_LEVEL_RATIO: 0.2 // 최소 레벨 비율
  },

  // 보너스/페널티 설정
  BALANCE_BONUSES: {
    PERFECT_BALANCE: {
      threshold: 90,
      multiplier: 1.5,
      name: '완벽한 균형',
      description: '모든 스탯이 균형있게 성장하고 있습니다!'
    },
    GOOD_BALANCE: {
      threshold: 70,
      multiplier: 1.2,
      name: '좋은 균형',
      description: '균형잡힌 성장을 유지하고 있습니다'
    },
    SPECIALIZED: {
      threshold: 40,
      multiplier: 1.0,
      name: '전문화',
      description: '특정 분야에 집중하고 있습니다'
    },
    IMBALANCED: {
      threshold: 20,
      multiplier: 0.8,
      name: '불균형',
      description: '균형을 맞추기 위해 노력이 필요합니다'
    },
    SEVERE_IMBALANCE: {
      threshold: 0,
      multiplier: 0.5,
      name: '심각한 불균형',
      description: '다른 스탯도 함께 성장시켜주세요'
    }
  },

  // 스탯별 권장 활동
  STAT_ACTIVITIES: {
    health: ['운동', '산책', '요가', '명상', '건강한 식사'],
    learning: ['독서', '온라인 강의', '새로운 기술 학습', '문제 해결'],
    relationship: ['가족과 시간', '친구 만나기', '봉사활동', '감사 표현'],
    achievement: ['목표 달성', '프로젝트 완성', '도전 과제', '업무 성과']
  }
} as const

export class BalanceService {
  private static instance: BalanceService | null = null

  private constructor() {}

  static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService()
    }
    return BalanceService.instance
  }

  // 현재 균형 상태 조회
  async getBalanceState(userId: string): Promise<Result<BalanceState>> {
    try {
      // 모든 스탯 가져오기
      const stats = await db.playerStats
        .where('userId')
        .equals(userId)
        .toArray()

      if (stats.length === 0) {
        return {
          success: false,
          error: new Error('No stats found for user')
        }
      }

      // 스탯별 레벨 정리
      const statLevels: Record<StatType, number> = {
        health: 1,
        learning: 1,
        relationship: 1,
        achievement: 1
      }

      stats.forEach(stat => {
        statLevels[stat.statType] = stat.level
      })

      // 기본 통계 계산
      const levels = Object.values(statLevels)
      const totalLevel = levels.reduce((sum, level) => sum + level, 0)
      const averageLevel = totalLevel / levels.length

      // 최고/최저 스탯 찾기
      let highestStat = { type: 'health' as StatType, level: 0 }
      let lowestStat = { type: 'health' as StatType, level: 999 }

      Object.entries(statLevels).forEach(([type, level]) => {
        if (level > highestStat.level) {
          highestStat = { type: type as StatType, level }
        }
        if (level < lowestStat.level) {
          lowestStat = { type: type as StatType, level }
        }
      })

      const levelGap = highestStat.level - lowestStat.level

      // 균형 점수 계산
      const balanceScore = this.calculateBalanceScore(statLevels, levelGap, averageLevel)

      // 균형 보너스/페널티 계산
      const balanceBonus = this.getBalanceBonus(balanceScore)

      // 추천사항 생성
      const recommendations = this.generateRecommendations(
        statLevels,
        highestStat,
        lowestStat,
        balanceScore
      )

      // 경고 생성
      const warnings = this.generateWarnings(levelGap, balanceScore, lowestStat)

      const state: BalanceState = {
        userId,
        statLevels,
        totalLevel,
        averageLevel,
        highestStat,
        lowestStat,
        levelGap,
        balanceScore,
        balanceMultiplier: balanceBonus.multiplier,
        recommendations,
        warnings
      }

      return { success: true, data: state }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get balance state')
      }
    }
  }

  // 균형 보너스 계산 (경험치에 적용)
  calculateBalanceBonus(userId: string, statType: StatType): Promise<Result<BalanceBonus>> {
    return this.getBalanceState(userId).then(result => {
      if (!result.success) {
        return result as Result<BalanceBonus>
      }

      const state = result.data
      const targetStatLevel = state.statLevels[statType]

      // 가장 낮은 스탯을 키우는 경우 추가 보너스
      let multiplier = state.balanceMultiplier
      if (statType === state.lowestStat.type && state.levelGap > BALANCE_CONFIG.LEVEL_GAP_THRESHOLDS.GOOD) {
        multiplier *= 1.5 // 50% 추가 보너스
      }

      // 가장 높은 스탯을 더 키우는 경우 페널티
      if (statType === state.highestStat.type && state.levelGap > BALANCE_CONFIG.LEVEL_GAP_THRESHOLDS.MODERATE) {
        multiplier *= 0.7 // 30% 페널티
      }

      const balanceBonus = this.getBalanceBonus(state.balanceScore)

      return {
        success: true,
        data: {
          type: this.getBalanceType(state.balanceScore),
          name: balanceBonus.name,
          multiplier,
          description: balanceBonus.description
        }
      }
    })
  }

  // 균형 통계 분석
  async getBalanceStatistics(userId: string, days = 30): Promise<Result<BalanceStatistics>> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 활동 기록에서 스탯별 성장률 계산
      const activities = await db.activities
        .where('userId')
        .equals(userId)
        .and(activity => activity.timestamp >= startDate)
        .toArray()

      // 스탯별 경험치 합계
      const statExpGains: Record<StatType, number> = {
        health: 0,
        learning: 0,
        relationship: 0,
        achievement: 0
      }

      activities.forEach(activity => {
        statExpGains[activity.statType] += activity.experience
      })

      // 성장률 계산
      const totalExp = Object.values(statExpGains).reduce((sum, exp) => sum + exp, 0) || 1
      const statGrowthRates: Record<StatType, number> = {
        health: (statExpGains.health / totalExp) * 100,
        learning: (statExpGains.learning / totalExp) * 100,
        relationship: (statExpGains.relationship / totalExp) * 100,
        achievement: (statExpGains.achievement / totalExp) * 100
      }

      // 가장 개선된/소홀한 스탯 찾기
      let mostImprovedStat: StatType | null = null
      let mostNeglectedStat: StatType | null = null
      let maxGrowth = 0
      let minGrowth = 100

      Object.entries(statGrowthRates).forEach(([stat, rate]) => {
        if (rate > maxGrowth) {
          maxGrowth = rate
          mostImprovedStat = stat as StatType
        }
        if (rate < minGrowth) {
          minGrowth = rate
          mostNeglectedStat = stat as StatType
        }
      })

      // 추천사항 생성
      const recommendations = this.generateStatisticsRecommendations(
        statGrowthRates,
        mostImprovedStat,
        mostNeglectedStat
      )

      return {
        success: true,
        data: {
          period: `${days} days`,
          balanceHistory: [], // 간단히 구현
          statGrowthRates,
          mostImprovedStat,
          mostNeglectedStat,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get balance statistics')
      }
    }
  }

  // Private helper methods
  private calculateBalanceScore(
    statLevels: Record<StatType, number>,
    levelGap: number,
    averageLevel: number
  ): number {
    const weights = BALANCE_CONFIG.BALANCE_SCORE_WEIGHTS

    // 1. 레벨 격차 점수 (0-100)
    const gapScore = Math.max(0, 100 - (levelGap * 5))

    // 2. 표준편차 점수 (0-100)
    const levels = Object.values(statLevels)
    const variance = levels.reduce((sum, level) => sum + Math.pow(level - averageLevel, 2), 0) / levels.length
    const stdDev = Math.sqrt(variance)
    const deviationScore = Math.max(0, 100 - (stdDev * 10))

    // 3. 최소 레벨 비율 점수 (0-100)
    const minLevel = Math.min(...levels)
    const maxLevel = Math.max(...levels)
    const minLevelRatio = maxLevel > 0 ? (minLevel / maxLevel) * 100 : 100

    // 가중 평균 계산
    const totalScore =
      gapScore * weights.LEVEL_GAP +
      deviationScore * weights.DEVIATION +
      minLevelRatio * weights.MIN_LEVEL_RATIO

    return Math.round(Math.max(0, Math.min(100, totalScore)))
  }

  private getBalanceBonus(balanceScore: number): typeof BALANCE_CONFIG.BALANCE_BONUSES[keyof typeof BALANCE_CONFIG.BALANCE_BONUSES] {
    const bonuses = BALANCE_CONFIG.BALANCE_BONUSES

    if (balanceScore >= bonuses.PERFECT_BALANCE.threshold) {
      return bonuses.PERFECT_BALANCE
    }
    if (balanceScore >= bonuses.GOOD_BALANCE.threshold) {
      return bonuses.GOOD_BALANCE
    }
    if (balanceScore >= bonuses.SPECIALIZED.threshold) {
      return bonuses.SPECIALIZED
    }
    if (balanceScore >= bonuses.IMBALANCED.threshold) {
      return bonuses.IMBALANCED
    }
    return bonuses.SEVERE_IMBALANCE
  }

  private getBalanceType(balanceScore: number): 'balanced' | 'specialized' | 'imbalanced' {
    if (balanceScore >= 70) {
      return 'balanced'
    }
    if (balanceScore >= 40) {
      return 'specialized'
    }
    return 'imbalanced'
  }

  private generateRecommendations(
    statLevels: Record<StatType, number>,
    highestStat: { type: StatType; level: number },
    lowestStat: { type: StatType; level: number },
    balanceScore: number
  ): string[] {
    const recommendations: string[] = []

    if (balanceScore < 50) {
      const activities = BALANCE_CONFIG.STAT_ACTIVITIES[lowestStat.type]
      recommendations.push(
        `${lowestStat.type} 스탯이 가장 낮습니다. 추천 활동: ${activities.slice(0, 3).join(', ')}`
      )
    }

    if (statLevels[lowestStat.type] < 5) {
      recommendations.push(
        '기초 레벨이 낮은 스탯이 있습니다. 모든 스탯을 최소 5레벨 이상으로 올려보세요'
      )
    }

    if (balanceScore >= 90) {
      recommendations.push('완벽한 균형을 유지하고 있습니다! 계속 이대로 성장하세요')
    } else if (balanceScore >= 70) {
      recommendations.push('좋은 균형을 유지하고 있습니다. 조금 더 노력하면 완벽한 균형에 도달할 수 있습니다')
    }

    // 구체적인 활동 추천
    if (lowestStat.level < highestStat.level * 0.5) {
      recommendations.push(
        `${lowestStat.type} 스탯에 집중해주세요. ${highestStat.type} 대비 50% 미만입니다`
      )
    }

    return recommendations
  }

  private generateWarnings(
    levelGap: number,
    balanceScore: number,
    lowestStat: { type: StatType; level: number }
  ): string[] {
    const warnings: string[] = []

    if (levelGap >= BALANCE_CONFIG.LEVEL_GAP_THRESHOLDS.SEVERE) {
      warnings.push('심각한 스탯 불균형! 균형을 맞추지 않으면 성장이 제한됩니다')
    } else if (levelGap >= BALANCE_CONFIG.LEVEL_GAP_THRESHOLDS.POOR) {
      warnings.push('스탯 격차가 큽니다. 낮은 스탯에 집중해주세요')
    }

    if (balanceScore < 30) {
      warnings.push('균형 점수가 매우 낮습니다. 경험치 획득에 페널티가 적용됩니다')
    }

    if (lowestStat.level === 1) {
      warnings.push(`${lowestStat.type} 스탯이 1레벨입니다. 기본 활동을 시작해보세요`)
    }

    return warnings
  }

  private generateStatisticsRecommendations(
    statGrowthRates: Record<StatType, number>,
    mostImprovedStat: StatType | null,
    mostNeglectedStat: StatType | null
  ): string[] {
    const recommendations: string[] = []

    if (mostNeglectedStat && statGrowthRates[mostNeglectedStat] < 10) {
      const activities = BALANCE_CONFIG.STAT_ACTIVITIES[mostNeglectedStat]
      recommendations.push(
        `${mostNeglectedStat} 활동이 부족합니다 (${statGrowthRates[mostNeglectedStat].toFixed(1)}%). ` +
        `추천: ${activities.slice(0, 2).join(', ')}`
      )
    }

    // 균형잡힌 성장 확인
    const rates = Object.values(statGrowthRates)
    const maxRate = Math.max(...rates)
    const minRate = Math.min(...rates)

    if (maxRate - minRate > 50) {
      recommendations.push('특정 스탯에 너무 치중되어 있습니다. 다양한 활동을 시도해보세요')
    } else if (maxRate - minRate < 20) {
      recommendations.push('매우 균형잡힌 성장을 보이고 있습니다!')
    }

    return recommendations
  }
}
