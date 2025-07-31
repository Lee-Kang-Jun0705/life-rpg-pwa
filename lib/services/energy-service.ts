'use client'

export interface EnergyData {
  energy: number
  maxEnergy: number
  lastRegenTime: number
  tickets?: number
}

export class EnergyService {
  private static instance: EnergyService

  static getInstance(): EnergyService {
    if (!EnergyService.instance) {
      EnergyService.instance = new EnergyService()
    }
    return EnergyService.instance
  }

  async getEnergy(userId: string): Promise<EnergyData> {
    return {
      energy: 100,
      maxEnergy: 100,
      lastRegenTime: Date.now(),
      tickets: 0
    }
  }

  async updateEnergy(userId: string, energy: number): Promise<void> {
    // 에너지 업데이트 로직
  }

  async regenerateEnergy(userId: string): Promise<number> {
    // 에너지 재생 로직
    return 100
  }
}

export const energyService = EnergyService.getInstance()