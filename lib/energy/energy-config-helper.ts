// 에너지 시스템 설정 헬퍼
import { ENERGY_CONFIG } from '@/lib/types/energy'

// 에너지 회복 계산 헬퍼
export const EnergyHelper = {
  // 다음 회복까지 남은 시간 (초)
  calculateTimeToNextRegen(lastUpdate: Date, currentEnergy: number, maxEnergy: number): number {
    if (currentEnergy >= maxEnergy) {
      return 0
    }

    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdate.getTime()
    const secondsSinceLastUpdate = timeSinceLastUpdate / 1000

    // 마지막 회복 이후 경과 시간의 나머지
    const remainingSeconds = ENERGY_CONFIG.REGEN_INTERVAL - (secondsSinceLastUpdate % ENERGY_CONFIG.REGEN_INTERVAL)

    return Math.ceil(remainingSeconds)
  },

  // 오프라인 회복 계산
  calculateOfflineRecovery(lastUpdate: Date, currentEnergy: number, maxEnergy: number, maxOfflineHours = 24): number {
    const now = Date.now()
    const offlineMs = now - lastUpdate.getTime()
    const maxOfflineMs = maxOfflineHours * 60 * 60 * 1000
    const effectiveMs = Math.min(offlineMs, maxOfflineMs)

    const regenCycles = Math.floor(effectiveMs / (ENERGY_CONFIG.REGEN_INTERVAL * 1000))
    const energyGained = regenCycles * ENERGY_CONFIG.REGEN_AMOUNT

    return Math.min(currentEnergy + energyGained, maxEnergy) - currentEnergy
  },

  // 전체 회복까지 필요한 시간 (초)
  calculateTimeToFull(currentEnergy: number, maxEnergy: number, nextRegenIn: number): number {
    if (currentEnergy >= maxEnergy) {
      return 0
    }

    const energyNeeded = maxEnergy - currentEnergy
    const cyclesNeeded = Math.ceil(energyNeeded / ENERGY_CONFIG.REGEN_AMOUNT)

    // 첫 회복까지 시간 + 나머지 사이클
    return nextRegenIn + ((cyclesNeeded - 1) * ENERGY_CONFIG.REGEN_INTERVAL)
  },

  // 에너지 사용 가능 여부
  canUseEnergy(currentEnergy: number, required: number): boolean {
    return currentEnergy >= required
  },

  // 일일 보너스 수령 가능 여부
  canClaimDailyBonus(lastClaim: Date | null): boolean {
    if (!lastClaim) {
      return true
    }

    const now = new Date()
    const timeDiff = now.getTime() - lastClaim.getTime()
    const dayInMs = 24 * 60 * 60 * 1000

    return timeDiff >= dayInMs
  },

  // 연속 보너스 일수 계산
  calculateBonusStreak(lastClaim: Date | null, currentStreak: number): number {
    if (!lastClaim) {
      return 1
    }

    const now = new Date()
    const diff = now.getTime() - lastClaim.getTime()
    const daysDiff = Math.floor(diff / (24 * 60 * 60 * 1000))

    // 정확히 1일 차이면 연속, 아니면 리셋
    return daysDiff === 1 ? currentStreak + 1 : 1
  }
}

// 배틀 티켓 헬퍼
export const TicketHelper = {
  // 다음 리셋까지 시간 (초)
  calculateTimeToReset(resetHour = 5): number {
    const now = new Date()
    const reset = new Date()
    reset.setHours(resetHour, 0, 0, 0)

    // 오늘 리셋 시간이 지났으면 내일로
    if (reset <= now) {
      reset.setDate(reset.getDate() + 1)
    }

    return Math.floor((reset.getTime() - now.getTime()) / 1000)
  },

  // 리셋 시간 포맷
  formatResetTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`
    } else {
      return `${secs}초`
    }
  },

  // 티켓 구매 가능 여부
  canPurchaseTicket(currentCount: number, maxCount = 50, userGold: number, ticketPrice = 100): boolean {
    return currentCount < maxCount && userGold >= ticketPrice
  }
}
