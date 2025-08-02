// 에너지 시스템 서비스
// 던전 입장 및 게임 플레이 제한 관리

import {
  Energy,
  EnergyTransaction,
  EnergyUpdateResult,
  EnergyCheckResult,
  PlayerEnergyState,
  ENERGY_CONFIG,
  DUNGEON_ENERGY_COST,
  calculateEnergyRegen,
  calculateTimeUntilFull,
  ENERGY_CONSTANTS,
  DailyLimits,
  EnergyRegenTimer
} from '@/lib/types/energy'
import { GameError } from '@/lib/types/game-common'
import { db } from '@/lib/database'

export class EnergyService {
  private static instance: EnergyService

  static getInstance(): EnergyService {
    if (!EnergyService.instance) {
      EnergyService.instance = new EnergyService()
    }
    return EnergyService.instance
  }

  // 플레이어 에너지 상태 가져오기
  async getPlayerEnergyState(userId: string): Promise<PlayerEnergyState> {
    try {
      // IndexedDB에서 에너지 정보 가져오기
      let energyData = await db.playerEnergy
        .where('userId')
        .equals(userId)
        .first()

      // 없으면 초기화
      if (!energyData) {
        energyData = await this.initializePlayerEnergy(userId)
      }

      // 자연 회복 계산
      const currentTime = new Date()
      const regenAmount = calculateEnergyRegen(energyData.lastRegenTime, currentTime)

      if (regenAmount > 0) {
        const newEnergy = Math.min(
          energyData.current + regenAmount,
          energyData.max
        )

        // 업데이트
        await db.playerEnergy.update(energyData.id!, {
          current: newEnergy,
          lastRegenTime: currentTime
        })

        energyData.current = newEnergy
        energyData.lastRegenTime = currentTime
      }

      // 전투 티켓 정보 가져오기
      const tickets = await db.battleTickets
        .where('userId')
        .equals(userId)
        .first()

      // 트랜잭션 히스토리 가져오기 (최근 50개)
      const transactions = await db.energyTransactions
        .where('userId')
        .equals(userId)
        .reverse()
        .limit(50)
        .toArray()

      return {
        userId,
        energy: {
          current: energyData.current,
          max: energyData.max,
          lastRegenTime: energyData.lastRegenTime,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: tickets?.count || 0,
        lastDailyBonus: energyData.lastDailyBonus,
        energyPotions: [], // Would be loaded from inventory
        premiumTickets: [], // Would be loaded from inventory
        transactions: transactions.map(t => ({
          id: t.id?.toString() || `trans_${Date.now()}`,
          _userId: t.userId,
          type: t.type,
          amount: t.amount,
          _reason: t.reason,
          timestamp: t.timestamp,
          beforeAmount: t.beforeAmount,
          afterAmount: t.afterAmount
        }))
      }
    } catch (error) {
      throw new GameError(
        'ENERGY_ERROR',
        '에너지 정보를 가져올 수 없습니다',
        { originalError: error }
      )
    }
  }

  // 에너지 소비
  async consumeEnergy(
    userId: string,
    amount: number,
    _reason: string
  ): Promise<EnergyUpdateResult> {
    try {
      const state = await this.getPlayerEnergyState(userId)

      // 에너지 부족 체크
      if (state.energy.current < amount) {
        return {
          success: false,
          error: `에너지가 부족합니다. 필요: ${amount}, 현재: ${state.energy.current}`
        }
      }

      const newEnergy = state.energy.current - amount
      const transaction: EnergyTransaction = {
        id: `trans_${Date.now()}`,
        userId,
        type: 'consume',
        amount: -amount,
        reason,
        timestamp: new Date(),
        beforeAmount: state.energy.current,
        afterAmount: newEnergy
      }

      // DB 업데이트
      await db.playerEnergy
        .where('userId')
        .equals(userId)
        .modify({ current: newEnergy })

      await db.energyTransactions.add({
        _userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        _reason: transaction.reason,
        timestamp: transaction.timestamp,
        beforeAmount: transaction.beforeAmount,
        afterAmount: transaction.afterAmount
      })

      return {
        success: true,
        energy: {
          ...state.energy,
          current: newEnergy
        },
        transaction
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '에너지 소비 실패'
      }
    }
  }

  // 에너지 회복
  async restoreEnergy(
    userId: string,
    amount: number,
    _reason: string,
    allowOverflow = false
  ): Promise<EnergyUpdateResult> {
    try {
      const state = await this.getPlayerEnergyState(userId)

      let newEnergy = state.energy.current + amount
      let overflow = 0

      if (!allowOverflow && newEnergy > state.energy.max) {
        overflow = newEnergy - state.energy.max
        newEnergy = state.energy.max
      }

      const transaction: EnergyTransaction = {
        id: `trans_${Date.now()}`,
        userId,
        type: 'bonus',
        amount,
        reason,
        timestamp: new Date(),
        beforeAmount: state.energy.current,
        afterAmount: newEnergy
      }

      // DB 업데이트
      await db.playerEnergy
        .where('userId')
        .equals(userId)
        .modify({
          current: newEnergy,
          lastRegenTime: new Date() // 회복 시간 리셋
        })

      await db.energyTransactions.add({
        _userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        _reason: transaction.reason,
        timestamp: transaction.timestamp,
        beforeAmount: transaction.beforeAmount,
        afterAmount: transaction.afterAmount
      })

      return {
        success: true,
        energy: {
          ...state.energy,
          current: newEnergy
        },
        transaction,
        overflow
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '에너지 회복 실패'
      }
    }
  }

  // 일일 보너스 수령
  async claimDailyBonus(userId: string): Promise<EnergyUpdateResult> {
    try {
      const energyData = await db.playerEnergy
        .where('userId')
        .equals(userId)
        .first()

      if (!energyData) {
        throw new GameError('ENERGY_ERROR', '에너지 정보를 찾을 수 없습니다')
      }

      // 이미 받았는지 체크
      if (energyData.lastDailyBonus) {
        const lastClaim = new Date(energyData.lastDailyBonus)
        const now = new Date()
        const timeDiff = now.getTime() - lastClaim.getTime()

        if (timeDiff < ENERGY_CONSTANTS.BONUS_CLAIM_COOLDOWN) {
          const hoursLeft = Math.ceil((ENERGY_CONSTANTS.BONUS_CLAIM_COOLDOWN - timeDiff) / (1000 * 60 * 60))
          return {
            success: false,
            error: `일일 보너스는 ${hoursLeft}시간 후에 받을 수 있습니다`
          }
        }
      }

      // 보너스 지급
      const result = await this.restoreEnergy(
        userId,
        ENERGY_CONFIG.DAILY_BONUS,
        '일일 출석 보너스',
        false
      )

      if (result.success) {
        // 수령 시간 업데이트
        await db.playerEnergy
          .where('userId')
          .equals(userId)
          .modify({ lastDailyBonus: new Date() })
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '일일 보너스 수령 실패'
      }
    }
  }

  // 에너지 체크 (던전 입장 가능 여부)
  async checkEnergy(
    userId: string,
    dungeonType: string
  ): Promise<EnergyCheckResult> {
    const state = await this.getPlayerEnergyState(userId)
    const required = DUNGEON_ENERGY_COST[dungeonType as keyof typeof DUNGEON_ENERGY_COST] || 20
    const hasEnough = state.energy.current >= required

    return {
      hasEnough,
      current: state.energy.current,
      required,
      deficit: hasEnough ? 0 : required - state.energy.current,
      canUsePotions: state.energyPotions.length > 0,
      availablePotions: state.energyPotions
    }
  }

  // 일일 제한 확인
  async getDailyLimits(userId: string): Promise<DailyLimits> {
    const now = new Date()
    const resetTime = new Date(now)
    resetTime.setHours(ENERGY_CONSTANTS.DAILY_RESET_HOUR, 0, 0, 0)
    if (resetTime <= now) {
      resetTime.setDate(resetTime.getDate() + 1)
    }

    // DB에서 실제 데이터 가져오기
    const { dbHelpers } = await import('@/lib/database')
    const activities = await dbHelpers.getActivitiesByDateRange(
      userId,
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(new Date().setHours(23, 59, 59, 999))
    )

    const dungeonActivities = activities.filter(a =>
      a.activityName.includes('던전') || a.activityName.includes('dungeon')
    )

    return {
      dungeonRuns: {
        current: dungeonActivities.length,
        max: 999, // 무제한 (에너지로만 제한)
        resetTime
      },
      battleTickets: {
        used: dungeonActivities.length,
        remaining: Math.max(0, 10 - dungeonActivities.length),
        bonus: 0
      },
      energyPurchases: {
        count: 0, // 추후 구매 기록 테이블에서 가져오기
        maxPerDay: 3,
        nextCost: 100 // 골드 또는 캐시
      }
    }
  }

  // 에너지 회복 타이머 정보
  async getEnergyRegenTimer(userId: string): Promise<EnergyRegenTimer> {
    const state = await this.getPlayerEnergyState(userId)
    const now = new Date()

    // 다음 회복까지 시간
    const timeSinceLastRegen = now.getTime() - state.energy.lastRegenTime.getTime()
    const minutesSinceLastRegen = timeSinceLastRegen / (1000 * 60)
    const nextRegenMinutes = Math.ceil(1 / ENERGY_CONFIG.REGEN_RATE) - (minutesSinceLastRegen % (1 / ENERGY_CONFIG.REGEN_RATE))
    const timeUntilNext = nextRegenMinutes * 60 // 초 단위

    // 최대치까지 시간
    const timeUntilFull = calculateTimeUntilFull(
      state.energy.current,
      state.energy.max,
      ENERGY_CONFIG.REGEN_RATE
    )

    const willBeFullAt = new Date(now.getTime() + timeUntilFull * 1000)

    return {
      nextRegenTime: new Date(now.getTime() + timeUntilNext * 1000),
      timeUntilNext,
      timeUntilFull,
      willBeFullAt
    }
  }

  // 플레이어 에너지 초기화
  private async initializePlayerEnergy(userId: string) {
    const initialEnergy = {
      userId,
      current: ENERGY_CONFIG.MAX_ENERGY,
      max: ENERGY_CONFIG.MAX_ENERGY,
      lastRegenTime: new Date(),
      lastDailyBonus: undefined
    }

    const id = await db.playerEnergy.add(initialEnergy)

    // 초기 전투 티켓도 생성
    await db.battleTickets.add({
      userId,
      count: 10,
      lastReset: new Date()
    })

    return { ...initialEnergy, id }
  }

  // 레벨업 시 에너지 충전
  async onLevelUp(userId: string): Promise<void> {
    if (ENERGY_CONFIG.LEVEL_UP_REFILL) {
      await this.restoreEnergy(
        userId,
        ENERGY_CONFIG.MAX_ENERGY,
        '레벨업 보상',
        true // 오버플로우 허용
      )
    }
  }

  // 에너지 구매
  async purchaseEnergy(userId: string, _cost: number): Promise<EnergyUpdateResult> {
    const { dbHelpers } = await import('@/lib/database')

    // 프리미엄 화폐로 비용 차감
    const resources = await dbHelpers.getUserResources(userId)
    if (!resources || resources.premiumCurrency < cost) {
      throw new GameError('INSUFFICIENT_CURRENCY', '프리미엄 화폐가 부족합니다')
    }

    await dbHelpers.updateUserResources(userId, {
      premiumCurrency: resources.premiumCurrency - cost
    })

    return this.restoreEnergy(
      userId,
      ENERGY_CONFIG.PURCHASE_AMOUNT,
      '에너지 구매',
      true
    )
  }

  // 인벤토리에서 에너지 포션 가져오기
  private async getEnergyPotionsFromInventory(userId: string) {
    const { dbHelpers } = await import('@/lib/database')
    const potions = await dbHelpers.getInventoryItems(userId, 'consumable')

    return potions
      .filter(item => item.itemId.includes('energy_potion'))
      .map(item => ({
        id: item.itemId,
        name: '에너지 포션',
        energyRestore: 50, // 기본값
        quantity: item.quantity
      }))
  }

  // 인벤토리에서 프리미엄 티켓 가져오기
  private async getPremiumTicketsFromInventory(userId: string) {
    const { dbHelpers } = await import('@/lib/database')
    const tickets = await dbHelpers.getInventoryItems(userId, 'consumable')

    return tickets
      .filter(item => item.itemId.includes('premium_ticket'))
      .map(item => ({
        id: item.itemId,
        name: '프리미엄 티켓',
        energyRestore: 100, // 기본값
        quantity: item.quantity
      }))
  }
}
