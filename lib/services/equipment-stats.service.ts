import { inventoryService } from './inventory-service'
import { skillService } from './skill-service'
import type { EquippedGear } from '@/lib/types/inventory'

export interface EquipmentStats {
  attack: number
  defense: number
  hp: number
  speed: number
}

export class EquipmentStatsService {
  /**
   * 장착된 장비의 총 스탯을 계산합니다
   */
  static calculateEquipmentStats(userId: string): EquipmentStats {
    const equippedGear = inventoryService.getEquippedGear(userId)
    
    let totalAttack = 0
    let totalDefense = 0
    let totalHp = 0
    let totalSpeed = 0
    
    Object.values(equippedGear).forEach(equipped => {
      if (equipped && equipped.item.stats) {
        const stats = equipped.item.stats
        const enhancementBonus = 1 + (equipped.enhancement * 0.1) // 강화당 10% 보너스
        
        totalAttack += Math.floor((stats.attack || 0) * enhancementBonus)
        totalDefense += Math.floor((stats.defense || 0) * enhancementBonus)
        totalHp += Math.floor((stats.hp || 0) * enhancementBonus)
        totalSpeed += Math.floor((stats.speed || 0) * enhancementBonus)
      }
    })
    
    return {
      attack: totalAttack,
      defense: totalDefense,
      hp: totalHp,
      speed: totalSpeed
    }
  }
  
  /**
   * 전투용 플레이어 스탯을 계산합니다 (기본 스탯 + 장비 스탯 + 패시브 스킬)
   */
  static calculateBattleStats(baseStats: {
    hp: number
    attack: number
    defense?: number
    speed?: number
  }, userId: string) {
    const equipmentStats = this.calculateEquipmentStats(userId)
    const passiveEffects = skillService.calculatePassiveEffects(userId)
    
    // 기본 스탯 + 장비 스탯
    let totalHp = baseStats.hp + equipmentStats.hp
    let totalAttack = baseStats.attack + equipmentStats.attack
    let totalDefense = (baseStats.defense || 0) + equipmentStats.defense
    let totalSpeed = (baseStats.speed || 0) + equipmentStats.speed
    
    // 패시브 스킬 보너스 적용 (백분율)
    totalAttack = Math.floor(totalAttack * (1 + passiveEffects.attackBonus / 100))
    totalDefense = Math.floor(totalDefense * (1 + passiveEffects.defenseBonus / 100))
    totalHp = Math.floor(totalHp * (1 + passiveEffects.hpBonus / 100))
    totalSpeed = Math.floor(totalSpeed * (1 + passiveEffects.speedBonus / 100))
    
    return {
      hp: totalHp,
      attack: totalAttack,
      defense: totalDefense,
      speed: totalSpeed
    }
  }
}