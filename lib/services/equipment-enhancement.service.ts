/**
 * 장비 강화 시스템 서비스
 * 장비 강화, 진화, 재련 등의 기능 제공
 */

import type { GeneratedItem, EnhanceableItem, ItemRarity } from '@/lib/types/item-system'
import { dbHelpers } from '@/lib/database'
import { inventoryService } from './inventory.service'
import { characterIntegrationService } from './character-integration.service'

type Rarity = ItemRarity | 'mythic'

// 강화 재료 타입
export interface EnhancementMaterial {
  id: string
  name: string
  icon: string
  rarity: Rarity
  type: 'stone' | 'essence' | 'crystal' | 'fragment'
  tier: number // 1-5
}

// 강화 결과
export interface EnhancementResult {
  success: boolean
  item: GeneratedItem
  previousLevel: number
  newLevel: number
  statsImproved: Record<string, number>
  goldCost: number
  materialsUsed: Array<{ id: string; quantity: number }>
  criticalSuccess?: boolean // 대성공 여부
}

// 강화 비용 설정
const ENHANCEMENT_CONFIG = {
  // 강화 성공률 (레벨별)
  successRates: [
    100, // 0→1
    100, // 1→2
    95,  // 2→3
    90,  // 3→4
    85,  // 4→5
    75,  // 5→6
    65,  // 6→7
    55,  // 7→8
    45,  // 8→9
    35,  // 9→10
    30,  // 10→11
    25,  // 11→12
    20,  // 12→13
    15,  // 13→14
    10  // 14→15
  ],

  // 강화 실패 패널티
  failurePenalty: {
    0: { downgrade: false, destroy: false },
    5: { downgrade: true, destroy: false },  // 5레벨부터 하락 가능
    10: { downgrade: true, destroy: true }  // 10레벨부터 파괴 가능
  },

  // 골드 비용 계산
  goldCostFormula: (level: number, rarity: Rarity) => {
    const rarityMultiplier: Record<Rarity, number> = {
      common: 1,
      uncommon: 1.5,
      rare: 2.5,
      epic: 4,
      legendary: 6,
      mythic: 10
    }
    return Math.floor(100 * Math.pow(1.5, level) * rarityMultiplier[rarity])
  },

  // 스탯 증가율
  statIncreaseRate: {
    common: 1.05,
    uncommon: 1.08,
    rare: 1.12,
    epic: 1.15,
    legendary: 1.18,
    mythic: 1.22
  },

  // 대성공 확률
  criticalSuccessRate: 0.1, // 10%
  criticalSuccessBonus: 1.5 // 스탯 증가량 50% 추가
}

class EquipmentEnhancementService {
  private static instance: EquipmentEnhancementService

  static getInstance(): EquipmentEnhancementService {
    if (!this.instance) {
      this.instance = new EquipmentEnhancementService()
    }
    return this.instance
  }

  /**
   * GeneratedItem을 EnhanceableItem으로 변환
   */
  private toEnhanceableItem(item: GeneratedItem): EnhanceableItem {
    return {
      ...item,
      enhancementLevel: (item as unknown).enhancementLevel || 0,
      stats: (item as unknown).stats || item.baseStats,
      quantity: (item as unknown).quantity || 1
    }
  }

  /**
   * 장비 강화
   */
  async enhanceEquipment(
    itemId: string,
    materials: Array<{ id: string; quantity: number }>,
    useProtection = false
  ): Promise<EnhancementResult | { success: false; error: string }> {
    try {
      // 장비 정보 가져오기
      const baseItem = inventoryService.getItem(itemId)
      if (!baseItem) {
        return { success: false, error: '장비를 찾을 수 없습니다.' }
      }

      // EnhanceableItem으로 변환
      const equipment = this.toEnhanceableItem(baseItem)

      // 최대 레벨 체크
      if ((equipment.enhancementLevel || 0) >= 15) {
        return { success: false, error: '최대 강화 레벨에 도달했습니다.' }
      }

      // 골드 비용 계산
      const goldCost = ENHANCEMENT_CONFIG.goldCostFormula(
        equipment.enhancementLevel || 0,
        equipment.rarity
      )

      // 골드 체크
      const character = await characterIntegrationService.getCharacter('current-user')
      if (!character || character.gold < goldCost) {
        return { success: false, error: '골드가 부족합니다.' }
      }

      // 재료 체크
      for (const material of materials) {
        const item = inventoryService.getItem(material.id)
        const itemQuantity = (item as unknown)?.quantity || 1
        if (!item || itemQuantity < material.quantity) {
          return { success: false, error: '재료가 부족합니다.' }
        }
      }

      // 성공률 계산
      const baseSuccessRate = ENHANCEMENT_CONFIG.successRates[equipment.enhancementLevel || 0] || 10
      const materialBonus = this.calculateMaterialBonus(materials)
      const finalSuccessRate = Math.min(100, baseSuccessRate + materialBonus)

      // 강화 시도
      const roll = Math.random() * 100
      const success = roll < finalSuccessRate
      const criticalSuccess = success && roll < finalSuccessRate * ENHANCEMENT_CONFIG.criticalSuccessRate

      // 골드 차감
      await characterIntegrationService.useGold('current-user', goldCost)

      // 재료 소모
      for (const material of materials) {
        inventoryService.removeItem(material.id, material.quantity)
      }

      if (success) {
        // 강화 성공
        const previousLevel = equipment.enhancementLevel || 0
        const newLevel = previousLevel + 1

        // 스탯 증가 계산
        const statsImproved = this.calculateStatImprovement(
          equipment,
          criticalSuccess
        )

        // 장비 업데이트
        equipment.enhancementLevel = newLevel
        if (equipment.stats) {
          for (const [stat, value] of Object.entries(statsImproved)) {
            if (equipment.stats[stat as keyof typeof equipment.stats]) {
              (equipment.stats[stat as keyof typeof equipment.stats] as number) += value
            }
          }
        }

        // 인벤토리 업데이트
        inventoryService.updateItem(itemId, equipment)

        // 성공 토스트
        // TODO: Toast notification 처리

        return {
          success: true,
          item: equipment,
          previousLevel,
          newLevel,
          statsImproved,
          goldCost,
          materialsUsed: materials,
          criticalSuccess
        }
      } else {
        // 강화 실패
        const failureHandled = await this.handleEnhancementFailure(
          equipment,
          useProtection
        )

        // 실패 토스트
        // TODO: Toast notification 처리

        return {
          success: false,
          item: failureHandled.item,
          previousLevel: equipment.enhancementLevel || 0,
          newLevel: (failureHandled.item as unknown).enhancementLevel || 0,
          statsImproved: {},
          goldCost,
          materialsUsed: materials
        }
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
      return { success: false, error: '강화 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 재료에 의한 성공률 보너스 계산
   */
  private calculateMaterialBonus(materials: Array<{ id: string; quantity: number }>): number {
    let bonus = 0

    for (const material of materials) {
      const item = inventoryService.getItem(material.id)
      if (item && item.type === 'material') {
        // 재료 등급에 따른 보너스
        const tierBonus = (item as unknown).tier || 1
        bonus += tierBonus * material.quantity * 2 // 티어당 2% 보너스
      }
    }

    return bonus
  }

  /**
   * 스탯 증가량 계산
   */
  private calculateStatImprovement(
    equipment: EnhanceableItem,
    criticalSuccess: boolean
  ): Record<string, number> {
    const improvement: Record<string, number> = {}

    if (!equipment.stats) {
      return improvement
    }

    const increaseRate = ENHANCEMENT_CONFIG.statIncreaseRate[equipment.rarity]
    const multiplier = criticalSuccess ? ENHANCEMENT_CONFIG.criticalSuccessBonus : 1

    // 각 스탯별 증가량 계산
    for (const [stat, value] of Object.entries(equipment.stats)) {
      if (typeof value === 'number' && value > 0) {
        const increase = Math.ceil(value * (increaseRate - 1) * multiplier)
        improvement[stat] = increase
      }
    }

    return improvement
  }

  /**
   * 강화 실패 처리
   */
  private async handleEnhancementFailure(
    equipment: EnhanceableItem,
    useProtection: boolean
  ): Promise<{ item: EnhanceableItem; destroyed: boolean; downgraded: boolean }> {
    const level = equipment.enhancementLevel || 0

    // 보호 아이템 사용 시 패널티 없음
    if (useProtection) {
      return { item: equipment, destroyed: false, downgraded: false }
    }

    // 레벨별 패널티 확인
    if (level >= 10 && ENHANCEMENT_CONFIG.failurePenalty[10].destroy) {
      // 파괴 확률 (10% + 레벨당 2%)
      const destroyChance = 10 + (level - 10) * 2
      if (Math.random() * 100 < destroyChance) {
        inventoryService.removeItem(equipment.id, 1)
        return { item: equipment, destroyed: true, downgraded: false }
      }
    }

    if (level >= 5 && ENHANCEMENT_CONFIG.failurePenalty[5].downgrade) {
      // 하락 확률 (30% + 레벨당 5%)
      const downgradeChance = 30 + (level - 5) * 5
      if (Math.random() * 100 < downgradeChance) {
        equipment.enhancementLevel = Math.max(0, level - 1)

        // 스탯 감소
        if (equipment.stats) {
          const decreaseRate = 1 / ENHANCEMENT_CONFIG.statIncreaseRate[equipment.rarity]
          for (const [stat, value] of Object.entries(equipment.stats)) {
            if (typeof value === 'number' && value > 0) {
              (equipment.stats[stat as keyof typeof equipment.stats] as number) =
                Math.floor(value * decreaseRate)
            }
          }
        }

        inventoryService.updateItem(equipment.id, equipment)
        return { item: equipment, destroyed: false, downgraded: true }
      }
    }

    return { item: equipment, destroyed: false, downgraded: false }
  }

  /**
   * 강화 시뮬레이션
   */
  simulateEnhancement(
    equipment: EnhanceableItem,
    materials: Array<{ id: string; quantity: number }>
  ): {
    successRate: number
    goldCost: number
    expectedStats: Record<string, number>
    risks: {
      canDowngrade: boolean
      canDestroy: boolean
      downgradeChance?: number
      destroyChance?: number
    }
  } {
    const level = equipment.enhancementLevel || 0
    const baseSuccessRate = ENHANCEMENT_CONFIG.successRates[level] || 10
    const materialBonus = this.calculateMaterialBonus(materials)
    const successRate = Math.min(100, baseSuccessRate + materialBonus)

    const goldCost = ENHANCEMENT_CONFIG.goldCostFormula(level, equipment.rarity)
    const expectedStats = this.calculateStatImprovement(equipment, false)

    const risks = {
      canDowngrade: level >= 5,
      canDestroy: level >= 10,
      downgradeChance: level >= 5 ? 30 + (level - 5) * 5 : 0,
      destroyChance: level >= 10 ? 10 + (level - 10) * 2 : 0
    }

    return { successRate, goldCost, expectedStats, risks }
  }

  /**
   * 강화 재료 목록 가져오기
   */
  getEnhancementMaterials(): GeneratedItem[] {
    return inventoryService.getItems().filter(item =>
      item.type === 'material' &&
      ['stone', 'essence', 'crystal', 'fragment'].includes((item as unknown).subType || '')
    )
  }

  /**
   * 필요 재료 추천
   */
  recommendMaterials(
    equipment: EnhanceableItem,
    targetSuccessRate = 80
  ): Array<{ id: string; quantity: number }> {
    const level = equipment.enhancementLevel || 0
    const baseSuccessRate = ENHANCEMENT_CONFIG.successRates[level] || 10
    const needed = targetSuccessRate - baseSuccessRate

    if (needed <= 0) {
      return []
    }

    const materials = this.getEnhancementMaterials()
    const recommendations: Array<{ id: string; quantity: number }> = []

    // 높은 티어 재료부터 추천
    materials.sort((a, b) => ((b as unknown).tier || 1) - ((a as unknown).tier || 1))

    let remainingBonus = needed
    for (const material of materials) {
      if (remainingBonus <= 0) {
        break
      }

      const tier = (material as unknown).tier || 1
      const bonusPerItem = tier * 2
      const quantity = Math.ceil(remainingBonus / bonusPerItem)
      const materialQuantity = (material as unknown)?.quantity || 1

      if (materialQuantity >= quantity) {
        recommendations.push({ id: material.id, quantity })
        break
      } else if (materialQuantity > 0) {
        recommendations.push({ id: material.id, quantity: materialQuantity })
        remainingBonus -= materialQuantity * bonusPerItem
      }
    }

    return recommendations
  }
}

export const equipmentEnhancementService = EquipmentEnhancementService.getInstance()
