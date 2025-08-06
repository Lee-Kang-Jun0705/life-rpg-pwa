/**
 * 플레이어 종합 스탯 계산 서비스
 * 기본 스탯 + 장비 스탯 + 패시브 스킬 효과 + 버프를 모두 계산
 */

import type { CharacterStats } from '@/lib/types/character'
import type { GeneratedItem } from '@/lib/types/item-system'
import type { Skill } from '@/lib/types/skill-system'
import { inventoryService } from './inventory.service'
import { skillManagementService } from './skill-management.service'
import { allSkills } from '@/lib/data/skills'

export interface CalculatedStats extends CharacterStats {
  // 추가 계산된 스탯
  lifeSteal?: number      // 흡혈 %
  expBonus?: number       // 경험치 보너스 %
  goldBonus?: number      // 골드 보너스 %
  dropRate?: number       // 드롭률 보너스 %
  cooldownReduction?: number  // 재사용 대기시간 감소 %
  resistances?: {
    fire?: number
    ice?: number
    lightning?: number
    poison?: number
    all?: number  // 모든 속성 저항
  }
}

export class PlayerStatsService {
  private static instance: PlayerStatsService
  private baseStats: CharacterStats = {
    level: 1,
    currentHP: 100,
    maxHP: 100,
    currentMP: 50,
    maxMP: 50,
    attack: 10,
    defense: 10,
    speed: 10,
    critRate: 5,
    critDamage: 50,
    accuracy: 95,
    dodge: 5
  }

  static getInstance(): PlayerStatsService {
    if (!this.instance) {
      this.instance = new PlayerStatsService()
    }
    return this.instance
  }

  /**
   * 종합 스탯 계산
   */
  async calculateTotalStats(baseStats?: CharacterStats): Promise<CalculatedStats> {
    const stats: CalculatedStats = {
      ...(baseStats || this.baseStats),
      resistances: {}
    }

    // 1. 장비 스탯 적용
    const equipmentStats = await this.applyEquipmentStats(stats)
    Object.assign(stats, equipmentStats)

    // 2. 패시브 스킬 효과 적용
    const passiveStats = await this.applyPassiveSkills(stats)
    Object.assign(stats, passiveStats)

    // 3. 아이템 특수 효과 적용
    const specialEffectStats = await this.applyItemSpecialEffects(stats)
    Object.assign(stats, specialEffectStats)

    // 4. 최종 보정 (최소/최대값)
    this.finalizeStats(stats)

    return stats
  }

  /**
   * 장비 스탯 적용
   */
  private async applyEquipmentStats(stats: CalculatedStats): Promise<CalculatedStats> {
    const equipment = await inventoryService.getEquipment()
    
    for (const slot in equipment) {
      const item = equipment[slot as keyof typeof equipment]
      if (!item) continue

      // 기본 스탯 적용
      if (item.baseStats) {
        for (const [stat, value] of Object.entries(item.baseStats)) {
          if (stat in stats && typeof value === 'number') {
            (stats as any)[stat] += value
          }
        }
      }

      // 랜덤 스탯 적용
      if (item.randomStats) {
        for (const randomStat of item.randomStats) {
          switch (randomStat.type) {
            case 'hp':
              stats.maxHP += randomStat.value
              break
            case 'mp':
              stats.maxMP += randomStat.value
              break
            case 'attack':
              stats.attack += randomStat.value
              break
            case 'defense':
              stats.defense += randomStat.value
              break
            case 'speed':
              stats.speed += randomStat.value
              break
            case 'critRate':
              stats.critRate += randomStat.value
              break
            case 'critDamage':
              stats.critDamage += randomStat.value
              break
            case 'accuracy':
              stats.accuracy += randomStat.value
              break
            case 'dodge':
              stats.dodge += randomStat.value
              break
            case 'lifeSteal':
              stats.lifeSteal = (stats.lifeSteal || 0) + randomStat.value
              break
            case 'expBonus':
              stats.expBonus = (stats.expBonus || 0) + randomStat.value
              break
            case 'goldBonus':
              stats.goldBonus = (stats.goldBonus || 0) + randomStat.value
              break
            case 'dropRate':
              stats.dropRate = (stats.dropRate || 0) + randomStat.value
              break
          }
        }
      }
    }

    return stats
  }

  /**
   * 패시브 스킬 효과 적용
   */
  private async applyPassiveSkills(stats: CalculatedStats): Promise<CalculatedStats> {
    const learnedSkills = await skillManagementService.getLearnedSkills()
    
    for (const learned of learnedSkills) {
      const skill = allSkills[learned.skillId]
      if (!skill || skill.type !== 'passive') continue

      // 패시브 스킬 효과 적용
      for (const effect of skill.effects) {
        switch (effect.type) {
          case 'stat_increase':
            this.applyStatIncrease(stats, effect, learned.level)
            break
          case 'regeneration':
            this.applyRegeneration(stats, effect, learned.level)
            break
          case 'resistance':
            this.applyResistance(stats, effect, learned.level)
            break
          case 'conditional_buff':
            // 조건부 버프는 전투 중에 처리
            break
          case 'conditional_stat':
            // 조건부 스탯은 전투 중에 처리
            break
        }
      }
    }

    return stats
  }

  /**
   * 스탯 증가 효과 적용
   */
  private applyStatIncrease(stats: CalculatedStats, effect: any, skillLevel: number): void {
    const value = effect.value.base + (effect.value.perLevel * (skillLevel - 1))
    
    switch (effect.stat) {
      case 'hp':
        stats.maxHP += value
        break
      case 'mp':
        stats.maxMP += value
        break
      case 'attack':
        stats.attack += value
        break
      case 'defense':
        stats.defense += value
        break
      case 'speed':
        stats.speed += value
        break
      case 'critRate':
        stats.critRate += value
        break
      case 'critDamage':
        stats.critDamage += value
        break
      case 'dodge':
        stats.dodge += value
        break
      case 'lifeSteal':
        stats.lifeSteal = (stats.lifeSteal || 0) + value
        break
      case 'dropRate':
        stats.dropRate = (stats.dropRate || 0) + value
        break
      case 'goldBonus':
        stats.goldBonus = (stats.goldBonus || 0) + value
        break
      case 'expBonus':
        stats.expBonus = (stats.expBonus || 0) + value
        break
      case 'all':
        // 모든 스탯 증가
        const allStatBonus = value / 100 // 퍼센트로 적용
        stats.attack *= (1 + allStatBonus)
        stats.defense *= (1 + allStatBonus)
        stats.maxHP *= (1 + allStatBonus)
        stats.maxMP *= (1 + allStatBonus)
        stats.speed *= (1 + allStatBonus)
        break
    }
  }

  /**
   * 재생 효과 적용
   */
  private applyRegeneration(stats: CalculatedStats, effect: any, skillLevel: number): void {
    const value = effect.value.base + (effect.value.perLevel * (skillLevel - 1))
    
    // 재생 효과는 별도 속성으로 저장
    if (effect.stat === 'hp') {
      (stats as any).hpRegen = ((stats as any).hpRegen || 0) + value
    } else if (effect.stat === 'mp') {
      (stats as any).mpRegen = ((stats as any).mpRegen || 0) + value
    }
  }

  /**
   * 저항 효과 적용
   */
  private applyResistance(stats: CalculatedStats, effect: any, skillLevel: number): void {
    const value = effect.value.base + (effect.value.perLevel * (skillLevel - 1))
    
    if (!stats.resistances) {
      stats.resistances = {}
    }

    if (effect.element === 'all') {
      stats.resistances.all = (stats.resistances.all || 0) + value
    } else {
      const element = effect.element as keyof typeof stats.resistances
      (stats.resistances as any)[element] = ((stats.resistances as any)[element] || 0) + value
    }
  }

  /**
   * 아이템 특수 효과 적용
   */
  private async applyItemSpecialEffects(stats: CalculatedStats): Promise<CalculatedStats> {
    const equipment = await inventoryService.getEquipment()
    
    for (const slot in equipment) {
      const item = equipment[slot as keyof typeof equipment]
      if (!item || !item.specialEffects) continue

      for (const effect of item.specialEffects) {
        // 패시브 효과만 적용 (액티브 효과는 전투 중 처리)
        if (effect.type === 'passive') {
          switch (effect.effect.type) {
            case 'stat_boost':
              const boostValue = effect.effect.value as number
              if (effect.effect.stat === 'all') {
                stats.attack *= (1 + boostValue)
                stats.defense *= (1 + boostValue)
                stats.speed *= (1 + boostValue)
              } else {
                (stats as any)[effect.effect.stat] += boostValue
              }
              break
            case 'cooldown_reduction':
              stats.cooldownReduction = (stats.cooldownReduction || 0) + (effect.effect.value as number)
              break
          }
        }
      }
    }

    return stats
  }

  /**
   * 최종 스탯 보정
   */
  private finalizeStats(stats: CalculatedStats): void {
    // 최소값 보정
    stats.attack = Math.max(1, Math.floor(stats.attack))
    stats.defense = Math.max(0, Math.floor(stats.defense))
    stats.maxHP = Math.max(1, Math.floor(stats.maxHP))
    stats.maxMP = Math.max(0, Math.floor(stats.maxMP))
    stats.speed = Math.max(1, Math.floor(stats.speed))
    
    // 백분율 스탯 범위 제한
    stats.critRate = Math.min(100, Math.max(0, stats.critRate))
    stats.critDamage = Math.max(0, stats.critDamage)
    stats.accuracy = Math.min(100, Math.max(0, stats.accuracy))
    stats.dodge = Math.min(95, Math.max(0, stats.dodge)) // 회피율 최대 95%
    
    // 추가 스탯 범위 제한
    if (stats.lifeSteal) {
      stats.lifeSteal = Math.min(50, Math.max(0, stats.lifeSteal)) // 흡혈 최대 50%
    }
    if (stats.cooldownReduction) {
      stats.cooldownReduction = Math.min(50, Math.max(0, stats.cooldownReduction)) // 재사용 대기시간 감소 최대 50%
    }
    
    // 저항 범위 제한
    if (stats.resistances) {
      for (const key in stats.resistances) {
        const resistance = stats.resistances[key as keyof typeof stats.resistances]
        if (resistance !== undefined) {
          stats.resistances[key as keyof typeof stats.resistances] = Math.min(90, Math.max(0, resistance)) // 저항 최대 90%
        }
      }
    }

    // 현재 HP/MP 조정
    stats.currentHP = Math.min(stats.currentHP, stats.maxHP)
    stats.currentMP = Math.min(stats.currentMP, stats.maxMP)
  }

  /**
   * 전투 중 조건부 효과 계산
   */
  calculateCombatStats(baseStats: CalculatedStats, conditions: {
    inCombat?: boolean
    lowHP?: boolean
    hpPercent?: number
  }): CalculatedStats {
    const stats = { ...baseStats }

    // 패시브 스킬의 조건부 효과 적용
    skillManagementService.getLearnedSkills().then(learnedSkills => {
      for (const learned of learnedSkills) {
        const skill = allSkills[learned.skillId]
        if (!skill || skill.type !== 'passive') continue

        for (const effect of skill.effects) {
          if (effect.type === 'conditional_buff' && conditions.inCombat) {
            // 전투 중 버프 적용
            const value = effect.value.base + (effect.value.perLevel * (learned.level - 1))
            this.applyStatIncrease(stats, { ...effect, value: { base: value, perLevel: 0 } }, 1)
          } else if (effect.type === 'conditional_stat' && conditions.lowHP) {
            // HP 조건부 스탯 적용
            const threshold = (effect as any).threshold || 30
            if (conditions.hpPercent && conditions.hpPercent <= threshold) {
              const value = effect.value.base + (effect.value.perLevel * (learned.level - 1))
              this.applyStatIncrease(stats, { ...effect, value: { base: value, perLevel: 0 } }, 1)
            }
          }
        }
      }
    })

    return stats
  }
}

// 싱글톤 인스턴스 export
export const playerStatsService = PlayerStatsService.getInstance()