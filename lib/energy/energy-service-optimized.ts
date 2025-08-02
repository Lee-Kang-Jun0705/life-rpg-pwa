// 최적화된 에너지 서비스 - 이벤트 기반 업데이트
import { dbHelpers } from '@/lib/database/client'
import { ENERGY_CONFIG } from '@/lib/types/energy'
import type { PlayerEnergyState, EnergyRegenTimer } from '@/lib/types/energy'

export class OptimizedEnergyService {
  private static instance: OptimizedEnergyService
  private lastCalculationTime: Map<string, number> = new Map()
  private cachedStates: Map<string, PlayerEnergyState> = new Map()

  static getInstance(): OptimizedEnergyService {
    if (!OptimizedEnergyService.instance) {
      OptimizedEnergyService.instance = new OptimizedEnergyService()
    }
    return OptimizedEnergyService.instance
  }

  // 에너지 상태를 계산 (실시간 계산, DB 호출 최소화)
  async calculateEnergyState(userId: string): Promise<PlayerEnergyState> {
    // 캐시된 상태 가져오기
    const cached = this.cachedStates.get(userId)
    const lastCalc = this.lastCalculationTime.get(userId) || 0
    const now = Date.now()

    // 초기 로드 또는 캐시 만료 (10분)
    if (!cached || now - lastCalc > 10 * 60 * 1000) {
      const dbState = await this.loadFromDatabase(userId)
      this.cachedStates.set(userId, dbState)
      this.lastCalculationTime.set(userId, now)
      return dbState
    }

    // 시간 경과에 따른 에너지 회복 계산
    const timeDiff = now - cached.lastEnergyUpdate.getTime()
    const regenCycles = Math.floor(timeDiff / (ENERGY_CONFIG.REGEN_INTERVAL * 1000))

    if (regenCycles > 0) {
      const newEnergy = Math.min(
        cached.energy.current + (regenCycles * ENERGY_CONFIG.REGEN_AMOUNT),
        cached.energy.max
      )

      // 상태 업데이트
      const updatedState: PlayerEnergyState = {
        ...cached,
        energy: {
          ...cached.energy,
          current: newEnergy
        },
        lastEnergyUpdate: new Date(cached.lastEnergyUpdate.getTime() + (regenCycles * ENERGY_CONFIG.REGEN_INTERVAL * 1000))
      }

      this.cachedStates.set(userId, updatedState)

      // 10회복마다 DB 저장 (비동기)
      if (regenCycles >= 10) {
        this.saveToDatabase(userId, updatedState).catch(console.error)
      }

      return updatedState
    }

    return cached
  }

  // 다음 회복까지 남은 시간 계산 (실시간)
  getTimeUntilNextRegen(state: PlayerEnergyState): number {
    if (state.energy.current >= state.energy.max) {
      return 0
    }

    const now = Date.now()
    const lastUpdate = state.lastEnergyUpdate.getTime()
    const timeSinceLastRegen = (now - lastUpdate) / 1000
    const timeUntilNext = ENERGY_CONFIG.REGEN_INTERVAL - (timeSinceLastRegen % ENERGY_CONFIG.REGEN_INTERVAL)

    return Math.ceil(timeUntilNext)
  }

  // 전체 회복까지 시간 계산
  getTimeUntilFull(state: PlayerEnergyState): number {
    if (state.energy.current >= state.energy.max) {
      return 0
    }

    const energyNeeded = state.energy.max - state.energy.current
    const cyclesNeeded = Math.ceil(energyNeeded / ENERGY_CONFIG.REGEN_AMOUNT)
    const timeUntilNext = this.getTimeUntilNextRegen(state)

    return timeUntilNext + ((cyclesNeeded - 1) * ENERGY_CONFIG.REGEN_INTERVAL)
  }

  // 에너지 사용 (즉시 DB 저장)
  async consumeEnergy(userId: string, amount: number): Promise<PlayerEnergyState> {
    const state = await this.calculateEnergyState(userId)

    if (state.energy.current < amount) {
      throw new Error('에너지가 부족합니다')
    }

    const updatedState: PlayerEnergyState = {
      ...state,
      energy: {
        ...state.energy,
        current: state.energy.current - amount
      },
      totalEnergyUsed: state.totalEnergyUsed + amount
    }

    // 즉시 저장
    await this.saveToDatabase(userId, updatedState)
    this.cachedStates.set(userId, updatedState)
    this.lastCalculationTime.set(userId, Date.now())

    return updatedState
  }

  // 일일 보너스 (사용자 액션)
  async claimDailyBonus(userId: string): Promise<PlayerEnergyState> {
    const state = await this.calculateEnergyState(userId)

    // 보너스 수령 가능 여부 체크
    if (state.lastDailyBonus) {
      const lastClaim = new Date(state.lastDailyBonus)
      const now = new Date()
      const timeDiff = now.getTime() - lastClaim.getTime()

      if (timeDiff < 24 * 60 * 60 * 1000) {
        throw new Error('일일 보너스는 24시간마다 받을 수 있습니다')
      }
    }

    const updatedState: PlayerEnergyState = {
      ...state,
      energy: {
        ...state.energy,
        current: Math.min(state.energy.current + 30, state.energy.max)
      },
      lastDailyBonus: new Date(),
      dailyBonusStreak: this.calculateBonusStreak(state.lastDailyBonus, state.dailyBonusStreak)
    }

    // 즉시 저장
    await this.saveToDatabase(userId, updatedState)
    this.cachedStates.set(userId, updatedState)
    this.lastCalculationTime.set(userId, Date.now())

    return updatedState
  }

  // 오프라인 회복 계산 (앱 시작 시)
  async calculateOfflineRecovery(userId: string): Promise<PlayerEnergyState> {
    const state = await this.loadFromDatabase(userId)
    const now = Date.now()
    const lastUpdate = state.lastEnergyUpdate.getTime()
    const offlineTime = now - lastUpdate

    // 최대 24시간까지만 계산
    const maxOfflineTime = 24 * 60 * 60 * 1000
    const effectiveTime = Math.min(offlineTime, maxOfflineTime)

    const regenCycles = Math.floor(effectiveTime / (ENERGY_CONFIG.REGEN_INTERVAL * 1000))
    const energyGained = regenCycles * ENERGY_CONFIG.REGEN_AMOUNT

    if (energyGained > 0) {
      const updatedState: PlayerEnergyState = {
        ...state,
        energy: {
          ...state.energy,
          current: Math.min(state.energy.current + energyGained, state.energy.max)
        },
        lastEnergyUpdate: new Date()
      }

      await this.saveToDatabase(userId, updatedState)
      this.cachedStates.set(userId, updatedState)
      this.lastCalculationTime.set(userId, now)

      return updatedState
    }

    return state
  }

  // 캐시 무효화 (명시적 새로고침)
  invalidateCache(userId: string) {
    this.cachedStates.delete(userId)
    this.lastCalculationTime.delete(userId)
  }

  // DB 로드
  private async loadFromDatabase(userId: string): Promise<PlayerEnergyState> {
    try {
      const saved = await dbHelpers.loadEnergyState(userId)
      if (saved) {
        return {
          ...saved,
          lastEnergyUpdate: new Date(saved.lastEnergyUpdate),
          lastDailyBonus: saved.lastDailyBonus ? new Date(saved.lastDailyBonus) : null
        }
      }
    } catch (error) {
      console.error('Failed to load energy state:', error)
    }

    // 기본값
    return {
      userId,
      energy: {
        current: ENERGY_CONFIG.MAX_ENERGY,
        max: ENERGY_CONFIG.MAX_ENERGY
      },
      battleTickets: 10,
      lastEnergyUpdate: new Date(),
      lastDailyBonus: null,
      dailyBonusStreak: 0,
      totalEnergyUsed: 0
    }
  }

  // DB 저장
  private async saveToDatabase(userId: string, state: PlayerEnergyState): Promise<void> {
    await dbHelpers.saveEnergyState(userId, {
      ...state,
      lastEnergyUpdate: state.lastEnergyUpdate.toISOString(),
      lastDailyBonus: state.lastDailyBonus?.toISOString() || null
    })
  }

  // 보너스 연속일수 계산
  private calculateBonusStreak(lastBonus: Date | null, currentStreak: number): number {
    if (!lastBonus) {
      return 1
    }

    const now = new Date()
    const diff = now.getTime() - lastBonus.getTime()
    const daysDiff = Math.floor(diff / (24 * 60 * 60 * 1000))

    return daysDiff === 1 ? currentStreak + 1 : 1
  }
}
