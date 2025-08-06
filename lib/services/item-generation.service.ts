/**
 * 아이템 생성 서비스
 * 랜덤 스탯, 희귀도 기반 생성 등
 */

import type {
  Item,
  GeneratedItem,
  ItemGenerationOptions,
  ItemGenerationResult,
  ItemRarity,
  RandomStat,
  StatType,
  BaseStats,
  SpecialEffect
} from '@/lib/types/item-system'
import {
  ITEM_RARITY_CONFIG,
  RANDOM_STAT_POOLS,
  STAT_TIER_RANGES,
  ITEM_TYPE_DEFAULTS
} from '@/lib/constants/item.constants'
import { baseItems } from '@/lib/data/base-items'
import { IdGenerators } from '@/lib/utils/id-generator'

export class ItemGenerationService {
  private static instance: ItemGenerationService

  static getInstance(): ItemGenerationService {
    if (!this.instance) {
      this.instance = new ItemGenerationService()
    }
    return this.instance
  }

  /**
   * 아이템 생성
   */
  generateItem(options: ItemGenerationOptions): ItemGenerationResult {
    try {
      // 기본 아이템 찾기
      const baseItem = this.getBaseItem(options.baseItemId)
      if (!baseItem) {
        return {
          success: false,
          error: {
            code: 'INVALID_BASE_ITEM',
            message: `Base item not found: ${options.baseItemId}`
          }
        }
      }

      // 시드 설정
      const seed = options.seed || Date.now()
      const rng = this.createRNG(seed)

      // 기본 스탯 계산
      const baseStats = this.calculateBaseStats(
        baseItem.baseStats,
        options.level,
        options.rarity,
        rng
      )

      // 랜덤 스탯 생성
      const randomStats = this.generateRandomStats(
        baseItem.type,
        options.rarity,
        rng,
        options.guaranteedStats
      )

      // 특수 효과 생성 (희귀도에 따라)
      const specialEffects = this.generateSpecialEffects(
        options.rarity,
        baseItem.type,
        rng
      )

      // 생성된 아이템
      const generatedItem: GeneratedItem = {
        ...baseItem,
        uniqueId: this.generateUniqueId(),
        generatedAt: Date.now(),
        seed,
        level: options.level,
        rarity: options.rarity,
        baseStats,
        randomStats,
        specialEffects,
        value: this.calculateItemValue(baseItem, options.level, options.rarity),
        icon: this.getItemIcon(baseItem.type, options.rarity)
      }

      return { success: true, item: generatedItem }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * 기본 아이템 가져오기
   */
  private getBaseItem(itemId: string): Item | null {
    return baseItems[itemId] || null
  }

  /**
   * 고유 ID 생성
   */
  private generateUniqueId(): string {
    return IdGenerators.item()
  }

  /**
   * 의사 난수 생성기 생성
   */
  private createRNG(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 2147483647
      return s / 2147483647
    }
  }

  /**
   * 기본 스탯 계산
   */
  private calculateBaseStats(
    baseStats: Readonly<BaseStats>,
    level: number,
    rarity: ItemRarity,
    rng: () => number
  ): Readonly<BaseStats> {
    const rarityConfig = ITEM_RARITY_CONFIG[rarity]
    const levelMultiplier = 1 + (level - 1) * 0.1 // 레벨당 10% 증가

    const calculatedStatsObj: Record<string, number> = {}

    for (const [stat, value] of Object.entries(baseStats)) {
      if (typeof value === 'number') {
        // 희귀도 범위 내에서 랜덤 배율
        const rarityMultiplier =
          rarityConfig.statMultiplier.min +
          (rarityConfig.statMultiplier.max - rarityConfig.statMultiplier.min) * rng()

        calculatedStatsObj[stat] =
          Math.floor(value * levelMultiplier * rarityMultiplier)
      }
    }

    return calculatedStatsObj as BaseStats
  }

  /**
   * 랜덤 스탯 생성
   */
  private generateRandomStats(
    itemType: string,
    rarity: ItemRarity,
    rng: () => number,
    guaranteedStats?: ReadonlyArray<StatType>
  ): ReadonlyArray<RandomStat> {
    const rarityConfig = ITEM_RARITY_CONFIG[rarity]
    const statPool = RANDOM_STAT_POOLS[itemType as keyof typeof RANDOM_STAT_POOLS]

    if (!statPool || rarityConfig.maxRandomStats === 0) {
      return []
    }

    const randomStats: RandomStat[] = []
    const usedStats = new Set<StatType>()

    // 보장된 스탯 먼저 추가
    if (guaranteedStats) {
      for (const statType of guaranteedStats) {
        if (randomStats.length >= rarityConfig.maxRandomStats) {
          break
        }

        const tier = this.rollStatTier(rng)
        const value = this.rollStatValue(tier, rng)

        randomStats.push({ type: statType, value, tier })
        usedStats.add(statType)
      }
    }

    // 나머지 랜덤 스탯 추가
    const availableStats = [
      ...statPool.primary,
      ...statPool.secondary
    ].filter(stat => !usedStats.has(stat as StatType))

    while (randomStats.length < rarityConfig.maxRandomStats && availableStats.length > 0) {
      const index = Math.floor(rng() * availableStats.length)
      const statType = availableStats.splice(index, 1)[0] as StatType

      const tier = this.rollStatTier(rng)
      const value = this.rollStatValue(tier, rng)

      randomStats.push({ type: statType, value, tier })
    }

    return randomStats
  }

  /**
   * 스탯 티어 결정
   */
  private rollStatTier(rng: () => number): 1 | 2 | 3 | 4 | 5 {
    const roll = rng()
    let accumWeight = 0

    for (const [tier, config] of Object.entries(STAT_TIER_RANGES)) {
      accumWeight += config.weight
      if (roll <= accumWeight) {
        return Number(tier) as 1 | 2 | 3 | 4 | 5
      }
    }

    return 1
  }

  /**
   * 스탯 값 결정
   */
  private rollStatValue(tier: 1 | 2 | 3 | 4 | 5, rng: () => number): number {
    const range = STAT_TIER_RANGES[tier]
    return Math.floor(range.min + (range.max - range.min) * rng())
  }

  /**
   * 특수 효과 생성
   */
  private generateSpecialEffects(
    rarity: ItemRarity,
    itemType: string,
    rng: () => number
  ): ReadonlyArray<SpecialEffect> | undefined {
    // 레어 이상만 특수 효과 (6단계 시스템)
    const rarityConfig = ITEM_RARITY_CONFIG[rarity]
    if (rarityConfig.specialEffectChance === 0) {
      return undefined
    }

    // 특수 효과 확률 체크
    if (rng() > rarityConfig.specialEffectChance) {
      return undefined
    }

    const effects: SpecialEffect[] = []

    // 희귀도별 효과 개수
    const effectCount = rarity === 'mythic' ? 3 : rarity === 'legendary' ? 2 : 1

    // TODO: 특수 효과 풀에서 랜덤 선택
    // 현재는 간단한 예시만
    if (rng() < 0.5) {
      effects.push({
        id: 'lifesteal',
        name: '흡혈',
        description: '가한 피해의 10%를 체력으로 회복',
        type: 'passive',
        trigger: { type: 'onAttack', chance: 100 },
        effect: {
          type: 'heal',
          value: 0.1
        }
      })
    }

    return effects.length > 0 ? effects : undefined
  }

  /**
   * 아이템 가치 계산
   */
  private calculateItemValue(
    baseItem: Item,
    level: number,
    rarity: ItemRarity
  ): number {
    const baseValue = baseItem.value
    const levelMultiplier = 1 + (level - 1) * 0.1
    const rarityMultiplier = ITEM_RARITY_CONFIG[rarity].sellPriceMultiplier

    return Math.floor(baseValue * levelMultiplier * rarityMultiplier)
  }

  /**
   * 드롭 아이템 생성 (몬스터 처치 시)
   */
  generateDropItem(
    monsterLevel: number,
    monsterType: 'common' | 'elite' | 'boss' | 'legendary'
  ): GeneratedItem | null {
    const rng = this.createRNG(Date.now())

    // 드롭 여부 결정
    const dropChance = this.getDropChance(monsterType)
    if (rng() > dropChance) {
      return null
    }

    // 희귀도 결정
    const rarity = this.rollItemRarity(monsterType, rng)

    // 아이템 타입 결정
    const itemType = this.rollItemType(rng)

    // 해당 타입의 기본 아이템 중 랜덤 선택
    const baseItemId = this.selectRandomBaseItem(itemType, monsterLevel)

    if (!baseItemId) {
      return null
    }

    // 아이템 생성
    const result = this.generateItem({
      baseItemId,
      level: monsterLevel,
      rarity
    })

    return result.success ? result.item : null
  }

  /**
   * 드롭 확률 계산
   */
  private getDropChance(monsterType: string): number {
    const dropRates = {
      common: 0.3,
      elite: 0.5,
      boss: 0.8,
      legendary: 1
    }
    return dropRates[monsterType as keyof typeof dropRates] || 0.3
  }

  /**
   * 희귀도 결정
   */
  private rollItemRarity(
    monsterType: string,
    rng: () => number
  ): ItemRarity {
    const weights = {
      common: { common: 0.7, magic: 0.25, rare: 0.04, epic: 0.009, legendary: 0.0009, mythic: 0.0001 },
      elite: { common: 0.5, magic: 0.35, rare: 0.1, epic: 0.04, legendary: 0.009, mythic: 0.001 },
      boss: { common: 0.3, magic: 0.35, rare: 0.2, epic: 0.1, legendary: 0.049, mythic: 0.001 },
      legendary: { common: 0.1, magic: 0.3, rare: 0.3, epic: 0.2, legendary: 0.09, mythic: 0.01 }
    }

    const roll = rng()
    let accumWeight = 0
    const rarityWeights = weights[monsterType as keyof typeof weights] || weights.common

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      accumWeight += weight
      if (roll <= accumWeight) {
        return rarity as ItemRarity
      }
    }

    return 'common'
  }

  /**
   * 아이템 타입 결정
   */
  private rollItemType(rng: () => number): string {
    const types = ['weapon', 'armor', 'accessory']
    return types[Math.floor(rng() * types.length)]
  }

  /**
   * 랜덤 기본 아이템 선택
   */
  private selectRandomBaseItem(itemType: string, level: number): string | null {
    const candidates = Object.entries(baseItems)
      .filter(([_, item]) =>
        item.type === itemType &&
        item.level <= level &&
        item.level >= Math.max(1, level - 10)
      )
      .map(([id]) => id)

    if (candidates.length === 0) {
      return null
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  /**
   * 아이템 아이콘 결정
   */
  private getItemIcon(itemType: string, rarity: ItemRarity): string {
    const icons = {
      weapon: {
        common: '⚔️',
        magic: '🗡️',
        rare: '🔱',
        epic: '⚡',
        legendary: '🌟',
        mythic: '💫'
      },
      armor: {
        common: '🛡️',
        magic: '🏽',
        rare: '🦺',
        epic: '⛑️',
        legendary: '💎',
        mythic: '🔮'
      },
      accessory: {
        common: '💍',
        magic: '🔿',
        rare: '💎',
        epic: '🔮',
        legendary: '👑',
        mythic: '✨'
      },
      consumable: {
        common: '🧪',
        magic: '⚗️',
        rare: '🍷',
        epic: '🏺',
        legendary: '🌟',
        mythic: '💊'
      },
      material: {
        common: '📦',
        magic: '🎁',
        rare: '💼',
        epic: '🗳️',
        legendary: '🏆',
        mythic: '🌈'
      }
    }

    const typeIcons = icons[itemType as keyof typeof icons]
    return typeIcons?.[rarity as keyof typeof typeIcons] || '📦'
  }
}

// 싱글톤 인스턴스 export
export const itemGenerationService = ItemGenerationService.getInstance()
