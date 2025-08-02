/**
 * 보상 시스템 서비스
 * 골드, 아이템, 에너지 등 다양한 보상을 관리
 */

import { dbHelpers } from '@/lib/database/client'
import { EnergyService } from '@/lib/energy/energy-service'
import { GAME_CONFIG } from '@/lib/config/game-config'

// 보상 타입 정의
export interface RewardItem {
  id: string
  name: string
  type: 'consumable' | 'equipment' | 'material' | 'special'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  quantity: number
  description?: string
}

export interface CurrencyReward {
  gold?: number
  gems?: number
  tokens?: number
}

export interface StatReward {
  health?: number
  learning?: number
  relationship?: number
  achievement?: number
}

export interface RewardBundle {
  exp?: number
  energy?: number
  currency?: CurrencyReward
  items?: RewardItem[]
  stats?: StatReward
}

export interface RewardTransaction {
  id: string
  userId: string
  rewards: RewardBundle
  source: string
  summary: string
  timestamp: string
}

export class RewardService {
  private static instance: RewardService

  static getInstance(): RewardService {
    if (!RewardService.instance) {
      RewardService.instance = new RewardService()
    }
    return RewardService.instance
  }

  /**
   * 보상 번들을 플레이어에게 지급
   */
  async grantRewards(userId: string, rewards: RewardBundle, source = 'achievement'): Promise<void> {
    try {
      const results: string[] = []

      // 경험치 지급
      if (rewards.exp) {
        await this.grantExperience(userId, rewards.exp, source)
        results.push(`경험치 +${rewards.exp}`)
      }

      // 에너지 지급
      if (rewards.energy) {
        await this.grantEnergy(userId, rewards.energy)
        results.push(`에너지 +${rewards.energy}`)
      }

      // 화폐 지급
      if (rewards.currency) {
        await this.grantCurrency(userId, rewards.currency)
        if (rewards.currency.gold) {
          results.push(`골드 +${rewards.currency.gold}`)
        }
        if (rewards.currency.gems) {
          results.push(`보석 +${rewards.currency.gems}`)
        }
        if (rewards.currency.tokens) {
          results.push(`토큰 +${rewards.currency.tokens}`)
        }
      }

      // 아이템 지급
      if (rewards.items && rewards.items.length > 0) {
        await this.grantItems(userId, rewards.items)
        rewards.items.forEach(item => {
          results.push(`${item.name} x${item.quantity}`)
        })
      }

      // 스탯 직접 지급
      if (rewards.stats) {
        await this.grantStats(userId, rewards.stats, source)
        Object.entries(rewards.stats).forEach(([stat, value]) => {
          if (value && value > 0) {
            results.push(`${this.getStatName(stat)} +${value}`)
          }
        })
      }

      // 보상 지급 기록
      await this.recordRewardTransaction(userId, rewards, source, results.join(', '))

      console.log(`✅ Rewards granted to ${userId}:`, results.join(', '))
    } catch (error) {
      console.error('보상 지급 실패:', error)
      throw error
    }
  }

  /**
   * 경험치 지급 (모든 스탯에 균등 분배)
   */
  private async grantExperience(userId: string, totalExp: number, source: string): Promise<void> {
    const expPerStat = Math.floor(totalExp / 4)
    const statTypes: ('health' | 'learning' | 'relationship' | 'achievement')[] =
      ['health', 'learning', 'relationship', 'achievement']

    for (const statType of statTypes) {
      await dbHelpers.addActivity({
        userId,
        statType,
        activityName: `보상 (${source})`,
        description: `${source}으로부터 경험치 획득`,
        experience: expPerStat,
        timestamp: new Date(),
        synced: false
      })
    }
  }

  /**
   * 에너지 지급
   */
  private async grantEnergy(userId: string, energy: number): Promise<void> {
    const energyService = EnergyService.getInstance()

    // 현재 에너지 상태 가져오기
    const currentEnergy = await energyService.getEnergy(userId)

    // 에너지 추가 (최대치 초과 가능하도록 보너스 에너지로 처리)
    const newEnergy = Math.min(
      currentEnergy.currentEnergy + energy,
      currentEnergy.maxEnergy + energy // 보너스 에너지 허용
    )

    // 에너지 업데이트 (실제 구현은 EnergyService에 의존)
    console.log(`에너지 ${energy} 지급: ${currentEnergy.currentEnergy} → ${newEnergy}`)
  }

  /**
   * 화폐 지급
   */
  private async grantCurrency(userId: string, currency: CurrencyReward): Promise<void> {
    // 간단한 로컬 스토리지 기반 화폐 시스템
    if (typeof window !== 'undefined') {
      const currentCurrency = this.getCurrencyBalance(userId)

      const newBalance = {
        gold: (currentCurrency.gold || 0) + (currency.gold || 0),
        gems: (currentCurrency.gems || 0) + (currency.gems || 0),
        tokens: (currentCurrency.tokens || 0) + (currency.tokens || 0)
      }

      localStorage.setItem(`currency_${userId}`, JSON.stringify(newBalance))
    }
  }

  /**
   * 아이템 지급
   */
  private async grantItems(userId: string, items: RewardItem[]): Promise<void> {
    // 간단한 로컬 스토리지 기반 인벤토리 시스템
    if (typeof window !== 'undefined') {
      const currentInventory = this.getInventory(userId)

      for (const item of items) {
        const existingItem = currentInventory.find(inv => inv.id === item.id)

        if (existingItem) {
          existingItem.quantity += item.quantity
        } else {
          currentInventory.push({ ...item })
        }
      }

      localStorage.setItem(`inventory_${userId}`, JSON.stringify(currentInventory))
    }
  }

  /**
   * 스탯 직접 지급
   */
  private async grantStats(userId: string, stats: StatReward, source: string): Promise<void> {
    for (const [statType, value] of Object.entries(stats)) {
      if (value && value > 0) {
        await dbHelpers.addActivity({
          userId,
          statType: statType as 'health' | 'learning' | 'relationship' | 'achievement',
          activityName: `보상 (${source})`,
          description: `${source}으로부터 ${this.getStatName(statType)} 보상`,
          experience: value,
          timestamp: new Date(),
          synced: false
        })
      }
    }
  }

  /**
   * 보상 거래 기록
   */
  private async recordRewardTransaction(
    userId: string,
    rewards: RewardBundle,
    source: string,
    summary: string
  ): Promise<void> {
    // 보상 지급 기록을 로컬 스토리지에 저장
    if (typeof window !== 'undefined') {
      const transactions = this.getRewardHistory(userId)

      transactions.unshift({
        id: `reward_${Date.now()}`,
        userId,
        rewards,
        source,
        summary,
        timestamp: new Date().toISOString()
      })

      // 최근 100개 기록만 유지
      transactions.splice(100)

      localStorage.setItem(`reward_history_${userId}`, JSON.stringify(transactions))
    }
  }

  /**
   * 화폐 잔액 조회
   */
  getCurrencyBalance(userId: string): CurrencyReward {
    if (typeof window === 'undefined') {
      return {}
    }

    const stored = localStorage.getItem(`currency_${userId}`)
    return stored ? JSON.parse(stored) : { gold: 0, gems: 0, tokens: 0 }
  }

  /**
   * 인벤토리 조회
   */
  getInventory(userId: string): RewardItem[] {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = localStorage.getItem(`inventory_${userId}`)
    return stored ? JSON.parse(stored) : []
  }

  /**
   * 보상 기록 조회
   */
  getRewardHistory(userId: string): RewardTransaction[] {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = localStorage.getItem(`reward_history_${userId}`)
    return stored ? JSON.parse(stored) : []
  }

  /**
   * 스탯 이름 변환
   */
  private getStatName(statType: string): string {
    const statNames: Record<string, string> = {
      health: '건강',
      learning: '학습',
      relationship: '관계',
      achievement: '성취'
    }
    return statNames[statType] || statType
  }
}
