import type { 
  Activity, 
  ActivityQuality, 
  ExpCalculationResult, 
  ExpContext,
  DailyLimitCheck,
  LevelInfo,
  AppliedBonus,
  AppliedPenalty,
  Result
} from '@/lib/types/experience'
import type { StatType } from '@/lib/types/game-common'
import { db } from '@/lib/database'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { DailyLimitService } from './daily-limit-service'
import { FatigueService } from '@/lib/fatigue/fatigue-service'
import { TimeRestrictionService } from '@/lib/time-restrictions/time-restriction-service'
import { BalanceService } from '@/lib/balance/balance-service'
import { VerificationService } from '@/lib/verification/verification-service'

// 경험치 상수
const EXP_CONSTANTS = {
  BASE_EXP_PER_LEVEL: 100,
  LEVEL_GROWTH_RATE: 1.5,
  MAX_LEVEL: 100,
  PRESTIGE_MAX_LEVEL: 10,
  DEFAULT_DAILY_LIMIT: 500,
  MIN_ACTIVITY_INTERVAL: 60, // 초
  STREAK_BREAK_HOURS: 48,
  QUALITY_MULTIPLIERS: {
    D: 1.0,
    C: 1.5,
    B: 2.0,
    A: 2.5,
    S: 3.0
  },
  QUALITY_BASE_EXP: {
    D: 10,
    C: 30,
    B: 50,
    A: 70,
    S: 100
  }
} as const

export class ExperienceManager {
  private static instance: ExperienceManager | null = null

  private constructor() {}

  static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager()
    }
    return ExperienceManager.instance
  }

  // 레벨별 필요 경험치 계산
  calculateRequiredExp(level: number): number {
    if (level <= 0) return 0
    if (level === 1) return EXP_CONSTANTS.BASE_EXP_PER_LEVEL

    // 레벨별 점진적 증가 공식
    if (level <= 10) {
      // 1-10레벨: 선형 증가
      return EXP_CONSTANTS.BASE_EXP_PER_LEVEL * level
    } else if (level <= 30) {
      // 11-30레벨: 지수 증가 시작
      const baseExp = EXP_CONSTANTS.BASE_EXP_PER_LEVEL * 2
      return Math.floor(baseExp * level * Math.pow(1.1, level - 10))
    } else if (level <= 50) {
      // 31-50레벨: 더 가파른 증가
      const baseExp = EXP_CONSTANTS.BASE_EXP_PER_LEVEL * 5
      return Math.floor(baseExp * level * Math.pow(1.2, level - 30))
    } else {
      // 51+ 레벨: 명예 레벨
      const baseExp = EXP_CONSTANTS.BASE_EXP_PER_LEVEL * 10
      return Math.floor(baseExp * level * Math.pow(1.3, level - 50))
    }
  }

  // 총 경험치로부터 레벨 정보 계산
  calculateLevel(totalExp: number): LevelInfo {
    let level = 1
    let remainingExp = totalExp
    let currentLevelExp = 0

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

    return {
      level,
      currentExp: currentLevelExp,
      requiredExp: requiredExpForCurrentLevel,
      totalExp,
      progress: (currentLevelExp / requiredExpForCurrentLevel) * 100,
      nextLevelExp: requiredExpForNextLevel,
      prestigeLevel: level > EXP_CONSTANTS.MAX_LEVEL ? Math.floor((level - EXP_CONSTANTS.MAX_LEVEL) / 10) : undefined
    }
  }

  // 활동 경험치 계산
  async calculateActivityExp(
    activity: Activity,
    _context: ExpContext
  ): Promise<Result<ExpCalculationResult>> {
    try {
      // 활동 검증 먼저 수행
      const verificationService = VerificationService.getInstance()
      const verificationResult = await verificationService.verifyActivity(
        activity.userId,
        activity.statType,
        {
          experience: this.getBaseExpByQuality(activity.quality),
          description: activity.activityName
        }
      )

      if (!verificationResult.isValid) {
        return {
          success: true,
          data: {
            baseExp: 0,
            qualityMultiplier: 1,
            bonuses: [],
            penalties: [{
              type: 'verification',
              name: '활동 검증 실패',
              value: 1,
              reason: verificationResult.reason || '활동을 검증할 수 없습니다'
            }],
            finalExp: 0,
            capped: true,
            cappedAt: 0,
            warnings: [verificationResult.reason || '활동 검증에 실패했습니다']
          }
        }
      }

      // 기본 경험치
      const baseExp = this.getBaseExpByQuality(activity.quality)
      const qualityMultiplier = EXP_CONSTANTS.QUALITY_MULTIPLIERS[activity.quality]

      // 보너스 계산
      const bonuses: AppliedBonus[] = []
      let totalBonusMultiplier = 1.0

      // 시간대 보너스/페널티 (TimeRestrictionService 사용)
      const timeService = TimeRestrictionService.getInstance()
      const timeState = timeService.getCurrentTimeState(activity.statType)
      
      if (timeState.isRestricted) {
        // 활동이 차단된 경우
        return {
          success: true,
          data: {
            baseExp,
            qualityMultiplier,
            bonuses: [],
            penalties: [{
              type: 'time_blocked',
              name: '시간대 제한',
              value: 1,
              reason: timeState.message || '이 시간대에는 해당 활동이 제한됩니다'
            }],
            finalExp: 0,
            capped: true,
            cappedAt: 0,
            warnings: [timeState.message || '활동이 제한된 시간대입니다']
          }
        }
      }
      
      const timeMultiplier = timeState.multiplier
      if (timeMultiplier > 1) {
        // 시간대 보너스
        const bonus = timeMultiplier - 1
        bonuses.push({
          type: 'time',
          name: '시간대 보너스',
          value: bonus,
          description: timeState.message || '좋은 시간대 보너스'
        })
        totalBonusMultiplier += bonus
      } else if (timeMultiplier < 1) {
        // 시간대 페널티는 나중에 처리
      }

      // 연속 활동 보너스
      const streakBonus = this.calculateStreakBonus(context.user.streakDays)
      if (streakBonus > 0) {
        bonuses.push({
          type: 'streak',
          name: '연속 활동 보너스',
          value: streakBonus,
          description: `${context.user.streakDays}일 연속 활동`
        })
        totalBonusMultiplier += streakBonus
      }

      // 다양성 보너스
      const varietyBonus = await this.calculateVarietyBonus(
        activity.userId,
        activity.statType,
        context.previousActivities
      )
      if (varietyBonus > 0) {
        bonuses.push({
          type: 'variety',
          name: '다양성 보너스',
          value: varietyBonus,
          description: '다양한 활동 수행'
        })
        totalBonusMultiplier += varietyBonus
      }

      // 균형 보너스/페널티
      const balanceService = BalanceService.getInstance()
      const balanceBonusResult = await balanceService.calculateBalanceBonus(activity.userId, activity.statType)
      
      if (balanceBonusResult.success) {
        const balanceBonus = balanceBonusResult.data
        
        if (balanceBonus.multiplier > 1) {
          // 균형 보너스
          const bonus = balanceBonus.multiplier - 1
          bonuses.push({
            type: 'balance',
            name: balanceBonus.name,
            value: bonus,
            description: balanceBonus.description
          })
          totalBonusMultiplier += bonus
        } else if (balanceBonus.multiplier < 1) {
          // 균형 페널티는 나중에 처리
        }
      }

      // 페널티 계산
      const penalties: AppliedPenalty[] = []
      let totalPenaltyMultiplier = 1.0
      const warnings: string[] = []

      // 시간대 페널티
      if (timeMultiplier < 1) {
        const penalty = 1 - timeMultiplier
        penalties.push({
          type: 'time',
          name: '시간대 페널티',
          value: penalty,
          reason: timeState.message || '적절하지 않은 시간대'
        })
        totalPenaltyMultiplier -= penalty
      }

      // 균형 페널티
      if (balanceBonusResult.success) {
        const balanceBonus = balanceBonusResult.data
        if (balanceBonus.multiplier < 1) {
          const penalty = 1 - balanceBonus.multiplier
          penalties.push({
            type: 'balance',
            name: balanceBonus.name,
            value: penalty,
            reason: balanceBonus.description
          })
          totalPenaltyMultiplier -= penalty
        }
      }

      // 반복 페널티
      const repetitionPenalty = await this.calculateRepetitionPenalty(
        activity.userId,
        activity.activityName,
        context.previousActivities
      )
      if (repetitionPenalty > 0) {
        penalties.push({
          type: 'repetition',
          name: '반복 활동 페널티',
          value: repetitionPenalty,
          reason: '동일한 활동 반복'
        })
        totalPenaltyMultiplier -= repetitionPenalty
      }

      // 피로도 체크
      const fatigueService = FatigueService.getInstance()
      const fatigueStateResult = await fatigueService.getFatigueState(activity.userId)
      
      let fatigueEfficiency = 1.0
      if (fatigueStateResult.success) {
        const fatigueState = fatigueStateResult.data
        fatigueEfficiency = fatigueState.experienceEfficiency
        
        // 피로도 페널티 추가
        if (fatigueEfficiency < 1.0) {
          penalties.push({
            type: 'fatigue',
            name: '피로도 페널티',
            value: 1 - fatigueEfficiency,
            reason: `현재 피로도: ${fatigueState.currentFatigue}%`
          })
        }
        
        // 피로도 경고 추가
        if (fatigueState.warnings.length > 0) {
          warnings.push(...fatigueState.warnings)
        }
      }
      
      // 균형 상태 확인 및 경고 추가
      const balanceStateResult = await balanceService.getBalanceState(activity.userId)
      if (balanceStateResult.success) {
        const balanceState = balanceStateResult.data
        if (balanceState.warnings.length > 0) {
          warnings.push(...balanceState.warnings)
        }
      }

      // 최종 경험치 계산 (피로도 효율 적용)
      const finalExp = Math.floor(
        baseExp * qualityMultiplier * totalBonusMultiplier * totalPenaltyMultiplier * fatigueEfficiency
      )

      // 일일 제한 체크
      const limitCheck = await this.checkDailyLimit(
        activity.userId,
        activity.statType,
        finalExp
      )

      // 검증 경고 추가
      if (verificationResult.warnings && verificationResult.warnings.length > 0) {
        warnings.push(...verificationResult.warnings)
      }

      const result: ExpCalculationResult = {
        baseExp,
        qualityMultiplier,
        bonuses,
        penalties,
        finalExp: limitCheck.grantedExp,
        capped: limitCheck.grantedExp < finalExp,
        cappedAt: limitCheck.grantedExp < finalExp ? limitCheck.grantedExp : undefined,
        warnings: warnings.length > 0 || limitCheck.reason ? [...warnings, ...(limitCheck.reason ? [limitCheck.reason] : [])] : undefined
      }

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  // 일일 제한 체크
  async checkDailyLimit(
    _userId: string,
    statType: StatType,
    requestedExp: number
  ): Promise<DailyLimitCheck> {
    const limitService = DailyLimitService.getInstance()
    const result = await limitService.tryAddExperience(userId, statType, requestedExp)
    
    const grantedExp = result.success ? result.data || 0 : 0
    
    const limitResult = await limitService.getDailyLimit(userId, statType)
    const limit = limitResult.success ? limitResult.data : null

    if (!limit) {
      return {
        allowed: true,
        grantedExp: requestedExp,
        remainingLimit: EXP_CONSTANTS.DEFAULT_DAILY_LIMIT - requestedExp,
        resetIn: this.getMinutesUntilReset()
      }
    }

    const totalLimit = limit.baseLimit + limit.bonusLimit
    const remainingLimit = totalLimit - limit.currentExp

    return {
      allowed: grantedExp > 0,
      grantedExp,
      remainingLimit: Math.max(0, remainingLimit),
      resetIn: this.getMinutesUntilReset(),
      reason: grantedExp === 0 ? '일일 경험치 한도에 도달했습니다' : undefined
    }
  }

  // 활동 품질별 기본 경험치
  private getBaseExpByQuality(quality: ActivityQuality): number {
    return EXP_CONSTANTS.QUALITY_BASE_EXP[quality]
  }

  // 시간대 보너스 계산 (deprecated - TimeRestrictionService 사용)
  private calculateTimeBonus(time: Date): number {
    // TimeRestrictionService로 대체됨
    const timeService = TimeRestrictionService.getInstance()
    const multiplier = timeService.calculateTimeMultiplier(time.getHours())
    return multiplier - 1 // 보너스/페널티 값으로 변환
  }

  // 연속 활동 보너스 계산
  private calculateStreakBonus(streakDays: number): number {
    if (streakDays < 3) return 0
    if (streakDays < 7) return 0.1 // 10%
    if (streakDays < 30) return 0.2 // 20%
    if (streakDays < 100) return 0.5 // 50%
    return 1.0 // 100%
  }

  // 다양성 보너스 계산
  private async calculateVarietyBonus(
    _userId: string,
    _currentStatType: StatType,
    previousActivities: ReadonlyArray<Activity>
  ): Promise<number> {
    // 오늘 수행한 활동의 고유 종류 수 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = previousActivities.filter(
      activity => new Date(activity.timestamp) >= today
    )

    const uniqueActivityNames = new Set(todayActivities.map(a => a.activityName))
    const uniqueStatTypes = new Set(todayActivities.map(a => a.statType))

    let bonus = 0

    // 다양한 활동 종류 보너스
    if (uniqueActivityNames.size >= 4) bonus += 0.1
    if (uniqueActivityNames.size >= 8) bonus += 0.2
    if (uniqueActivityNames.size >= 12) bonus += 0.3

    // 다양한 스탯 타입 보너스
    if (uniqueStatTypes.size >= 3) bonus += 0.2
    if (uniqueStatTypes.size === 4) bonus += 0.3

    return Math.min(bonus, 1.0) // 최대 100%
  }

  // 반복 페널티 계산
  private async calculateRepetitionPenalty(
    _userId: string,
    activityName: string,
    previousActivities: ReadonlyArray<Activity>
  ): Promise<number> {
    // 최근 1시간 내 동일한 활동 횟수 계산
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentSameActivities = previousActivities.filter(
      activity => 
        activity.activityName === activityName && 
        new Date(activity.timestamp) >= oneHourAgo
    )

    const count = recentSameActivities.length

    if (count < 2) return 0
    if (count < 5) return 0.1 // 10% 페널티
    if (count < 10) return 0.3 // 30% 페널티
    return 0.5 // 50% 페널티
  }

  // 리셋까지 남은 시간 (분)
  private getMinutesUntilReset(): number {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diffMs = tomorrow.getTime() - now.getTime()
    return Math.floor(diffMs / (1000 * 60))
  }

  // 활동 기록 저장
  async recordActivity(
    activity: Activity,
    grantedExp: number
  ): Promise<Result<void>> {
    try {
      await db.activities.add({
        ...activity,
        tags: activity.tags ? [...activity.tags] : undefined, // Convert readonly array to mutable
        experience: grantedExp,
        timestamp: new Date()
      })

      // 스탯 업데이트
      const stat = await db.playerStats
        .where('[userId+statType]')
        .equals([activity.userId, activity.statType])
        .first()

      if (stat) {
        const newTotalExp = stat.totalExp + grantedExp
        const levelInfo = this.calculateLevel(newTotalExp)
        
        await db.playerStats
          .where('[userId+statType]')
          .equals([activity.userId, activity.statType])
          .modify({
            level: levelInfo.level,
            experience: levelInfo.currentExp,
            totalExp: newTotalExp,
            lastUpdated: new Date()
          })
      } else {
        const levelInfo = this.calculateLevel(grantedExp)
        
        await db.playerStats.add({
          _userId: activity.userId,
          statType: activity.statType,
          level: levelInfo.level,
          experience: levelInfo.currentExp,
          totalExp: grantedExp,
          lastUpdated: new Date()
        })
      }

      // 피로도 기록
      const fatigueService = FatigueService.getInstance()
      await fatigueService.recordActivity(activity.userId, activity.statType)

      return { success: true, data: undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to record activity')
      }
    }
  }
}