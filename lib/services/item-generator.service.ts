/**
 * 아이템 생성 서비스
 * 기본 아이템 데이터로부터 고유한 게임 아이템 인스턴스 생성
 */

import type { Item } from '@/lib/types/item-system'
import type { GeneratedItem, RandomStat } from '@/lib/types/item-system'

class ItemGeneratorService {
  private static instance: ItemGeneratorService
  private itemCounter = 0
  
  private constructor() {}
  
  static getInstance(): ItemGeneratorService {
    if (!ItemGeneratorService.instance) {
      ItemGeneratorService.instance = new ItemGeneratorService()
    }
    return ItemGeneratorService.instance
  }

  /**
   * 기본 아이템 데이터로부터 게임에서 사용할 아이템 인스턴스 생성
   */
  generateItem(baseItem: Item): GeneratedItem {
    const uniqueId = this.generateUniqueId()
    
    // 랜덤 스탯 생성 (장비 아이템만)
    const randomStats: RandomStat[] = []
    if (baseItem.type === 'weapon' || baseItem.type === 'armor' || baseItem.type === 'accessory') {
      randomStats.push(...this.generateRandomStats(baseItem))
    }
    
    return {
      uniqueId,
      id: baseItem.id,
      name: baseItem.name,
      description: baseItem.description,
      type: baseItem.type,
      rarity: baseItem.rarity,
      level: baseItem.level,
      baseStats: { ...baseItem.baseStats },
      randomStats,
      value: this.calculateValue(baseItem, randomStats),
      stackable: baseItem.stackable || false,
      maxStack: baseItem.maxStack,
      specialEffects: baseItem.specialEffects ? [...baseItem.specialEffects] : undefined,
      setId: baseItem.setId,
      socketCount: this.getSocketCount(baseItem.rarity),
      enhancements: {
        level: 0,
        successRate: 1,
        failStacks: 0
      }
    }
  }

  /**
   * 고유 ID 생성
   */
  private generateUniqueId(): string {
    const timestamp = Date.now()
    const counter = this.itemCounter++
    const random = Math.floor(Math.random() * 10000)
    return `item_${timestamp}_${counter}_${random}`
  }

  /**
   * 랜덤 스탯 생성
   */
  private generateRandomStats(item: Item): RandomStat[] {
    const stats: RandomStat[] = []
    
    // 희귀도에 따른 랜덤 스탯 개수
    const statCount = this.getRandomStatCount(item.rarity)
    
    // 가능한 스탯 풀
    const possibleStats = this.getPossibleStats(item.type)
    
    // 랜덤하게 스탯 선택
    const selectedStats = this.selectRandomStats(possibleStats, statCount)
    
    // 각 스탯에 대해 값 생성
    selectedStats.forEach(stat => {
      const tier = this.getRandomTier(item.rarity)
      const value = this.getStatValue(stat, tier, item.level)
      
      stats.push({
        type: stat,
        value,
        tier
      })
    })
    
    return stats
  }

  /**
   * 희귀도에 따른 랜덤 스탯 개수
   */
  private getRandomStatCount(rarity: string): number {
    switch (rarity) {
      case 'common': return Math.random() < 0.3 ? 1 : 0
      case 'uncommon': return Math.random() < 0.7 ? 2 : 1
      case 'rare': return Math.random() < 0.5 ? 3 : 2
      case 'epic': return Math.random() < 0.5 ? 4 : 3
      case 'legendary': return Math.random() < 0.7 ? 5 : 4
      default: return 0
    }
  }

  /**
   * 아이템 타입별 가능한 스탯
   */
  private getPossibleStats(type: string): string[] {
    switch (type) {
      case 'weapon':
        return ['attack', 'critRate', 'critDamage', 'speed', 'accuracy']
      case 'armor':
        return ['defense', 'hp', 'resistance', 'dodge', 'hpRegen']
      case 'accessory':
        return ['hp', 'mp', 'speed', 'luck', 'mpRegen', 'cooldownReduction']
      default:
        return []
    }
  }

  /**
   * 랜덤하게 스탯 선택
   */
  private selectRandomStats(stats: string[], count: number): string[] {
    const shuffled = [...stats].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, stats.length))
  }

  /**
   * 랜덤 티어 결정
   */
  private getRandomTier(rarity: string): number {
    const rand = Math.random()
    
    switch (rarity) {
      case 'common':
        return rand < 0.8 ? 1 : 2
      case 'uncommon':
        return rand < 0.6 ? 1 : rand < 0.9 ? 2 : 3
      case 'rare':
        return rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3
      case 'epic':
        return rand < 0.1 ? 1 : rand < 0.5 ? 2 : rand < 0.9 ? 3 : 4
      case 'legendary':
        return rand < 0.3 ? 2 : rand < 0.7 ? 3 : rand < 0.95 ? 4 : 5
      default:
        return 1
    }
  }

  /**
   * 스탯 값 계산
   */
  private getStatValue(stat: string, tier: number, level: number): number {
    const baseValues: Record<string, number> = {
      attack: 5,
      defense: 4,
      hp: 20,
      mp: 15,
      speed: 3,
      critRate: 0.02,
      critDamage: 0.1,
      accuracy: 0.05,
      dodge: 0.03,
      hpRegen: 2,
      mpRegen: 1,
      resistance: 0.05,
      luck: 5,
      cooldownReduction: 0.02
    }
    
    const base = baseValues[stat] || 1
    const tierMultiplier = 1 + (tier - 1) * 0.5
    const levelMultiplier = 1 + (level / 50)
    const variance = 0.8 + Math.random() * 0.4 // 80% ~ 120%
    
    return Math.round(base * tierMultiplier * levelMultiplier * variance)
  }

  /**
   * 아이템 가치 계산
   */
  private calculateValue(item: Item, randomStats: RandomStat[]): number {
    let value = item.value
    
    // 랜덤 스탯에 따른 가치 증가
    randomStats.forEach(stat => {
      value += stat.value * stat.tier * 10
    })
    
    return Math.round(value)
  }

  /**
   * 희귀도에 따른 소켓 개수
   */
  private getSocketCount(rarity: string): number {
    switch (rarity) {
      case 'common': return 0
      case 'uncommon': return Math.random() < 0.3 ? 1 : 0
      case 'rare': return Math.random() < 0.5 ? 2 : 1
      case 'epic': return Math.random() < 0.5 ? 3 : 2
      case 'legendary': return Math.random() < 0.7 ? 4 : 3
      default: return 0
    }
  }

  /**
   * 아이템 복사 (고유 ID는 새로 생성)
   */
  duplicateItem(item: GeneratedItem): GeneratedItem {
    return {
      ...item,
      uniqueId: this.generateUniqueId(),
      randomStats: [...item.randomStats],
      specialEffects: item.specialEffects ? [...item.specialEffects] : undefined
    }
  }
}

export const itemGeneratorService = ItemGeneratorService.getInstance()