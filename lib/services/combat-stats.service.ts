/**
 * 전투 스탯 계산 서비스
 * 실생활 스탯과 장비를 합산하여 최종 전투 스탯을 계산
 */

import { inventoryService, type Equipment } from './inventory.service'
import { playerService } from './player.service'
import { db } from '@/lib/database'
import type { CharacterStats } from '@/lib/types/battle-extended'
import type { GeneratedItem } from '@/lib/types/item-system'
import { BATTLE_CONSTANTS } from '@/lib/types/battle-extended'

export interface CombatStats {
  // 기본 스탯
  attack: number
  defense: number
  hp: number
  mp: number
  speed: number

  // 부가 스탯
  critRate: number
  critDamage: number
  accuracy: number
  dodge: number

  // 저항력
  resistance: number

  // 총 전투력
  combatPower: number
}

class CombatStatsService {
  private static instance: CombatStatsService

  private constructor() {}

  static getInstance(): CombatStatsService {
    if (!CombatStatsService.instance) {
      CombatStatsService.instance = new CombatStatsService()
    }
    return CombatStatsService.instance
  }

  /**
   * 플레이어의 전투 스탯 계산
   * 실생활 스탯 + 장비 스탯 = 최종 전투력
   */
  async calculatePlayerCombatStats(userId: string): Promise<CombatStats> {
    const player = await playerService.getPlayer(userId)
    if (!player) {
      return this.getBaseCombatStats(1)
    }

    // 실생활 스탯 가져오기
    const stats = await db.playerStats
      .where('userId')
      .equals(userId)
      .toArray()

    const health = stats.find(s => s.statType === 'health') || { level: 1, totalExp: 0 }
    const learning = stats.find(s => s.statType === 'learning') || { level: 1, totalExp: 0 }
    const relationship = stats.find(s => s.statType === 'relationship') || { level: 1, totalExp: 0 }
    const achievement = stats.find(s => s.statType === 'achievement') || { level: 1, totalExp: 0 }

    // 실생활 기반 스탯 계산
    const lifeStats = this.calculateLifeStats(health.level, learning.level, relationship.level, achievement.level)

    // 장비 스탯 계산
    const equipment = inventoryService.getInventoryState().equipment
    const equipmentStats = this.calculateEquipmentStats(equipment)

    // 최종 스탯 합산 (실생활 + 장비)
    const combatStats: CombatStats = {
      attack: lifeStats.attack + equipmentStats.attack,
      defense: lifeStats.defense + equipmentStats.defense,
      hp: lifeStats.hp + equipmentStats.hp,
      mp: lifeStats.mp + equipmentStats.mp,
      speed: lifeStats.speed + equipmentStats.speed,
      critRate: lifeStats.critRate + equipmentStats.critRate,
      critDamage: lifeStats.critDamage + equipmentStats.critDamage,
      accuracy: lifeStats.accuracy + equipmentStats.accuracy,
      dodge: lifeStats.dodge + equipmentStats.dodge,
      resistance: lifeStats.resistance + equipmentStats.resistance,
      combatPower: 0
    }

    // 전투력 계산
    combatStats.combatPower = this.calculateCombatPower(combatStats)

    return combatStats
  }

  /**
   * 레벨 기반 기본 스탯 (최소한의 기본값만)
   */
  private getBaseCombatStats(level: number): CombatStats {
    return {
      attack: BATTLE_CONSTANTS.BASE_ATTACK,
      defense: BATTLE_CONSTANTS.BASE_DEFENSE,
      hp: BATTLE_CONSTANTS.BASE_HP,
      mp: BATTLE_CONSTANTS.BASE_MP,
      speed: BATTLE_CONSTANTS.BASE_SPEED,
      critRate: BATTLE_CONSTANTS.BASE_CRITICAL,
      critDamage: BATTLE_CONSTANTS.BASE_CRITICAL_DAMAGE,
      accuracy: BATTLE_CONSTANTS.BASE_ACCURACY,
      dodge: BATTLE_CONSTANTS.BASE_EVASION,
      resistance: 0,
      combatPower: 0
    }
  }

  /**
   * 실생활 스탯 기반 전투 스탯 계산
   */
  private calculateLifeStats(
    healthLevel: number,
    learningLevel: number,
    relationshipLevel: number,
    achievementLevel: number
  ): CombatStats {
    // 총 레벨 (캐릭터 레벨) - 스탯 레벨의 합
    const totalLevel = healthLevel + learningLevel + relationshipLevel + achievementLevel
    
    return {
      // 건강: 체력과 물리 공격력에 영향 (증가율 상향)
      hp: BATTLE_CONSTANTS.BASE_HP + healthLevel * 50 + totalLevel * 30,
      attack: BATTLE_CONSTANTS.BASE_ATTACK + healthLevel * 10 + totalLevel * 5,

      // 학습: 마나와 마법 공격력에 영향 (증가율 상향)
      mp: BATTLE_CONSTANTS.BASE_MP + learningLevel * 20 + totalLevel * 10,

      // 관계: 방어력에 영향 (증가율 상향)
      defense: BATTLE_CONSTANTS.BASE_DEFENSE + relationshipLevel * 6 + totalLevel * 3,

      // 성취: 속도와 치명타에 영향 (증가율 상향)
      speed: BATTLE_CONSTANTS.BASE_SPEED + achievementLevel * 3 + totalLevel * 2,
      critRate: BATTLE_CONSTANTS.BASE_CRITICAL + achievementLevel * 0.03 + totalLevel * 0.01,
      dodge: BATTLE_CONSTANTS.BASE_EVASION + achievementLevel * 0.03 + totalLevel * 0.01,

      // 기본값
      critDamage: BATTLE_CONSTANTS.BASE_CRITICAL_DAMAGE + totalLevel * 0.02,
      accuracy: BATTLE_CONSTANTS.BASE_ACCURACY + totalLevel * 0.01,
      resistance: totalLevel * 2,
      combatPower: 0
    }
  }

  /**
   * 장비 스탯 계산
   */
  private calculateEquipmentStats(equipment: Equipment): CombatStats {
    const stats: CombatStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      mp: 0,
      speed: 0,
      critRate: 0,
      critDamage: 0,
      accuracy: 0,
      dodge: 0,
      resistance: 0,
      combatPower: 0
    }

    // 모든 장비 슬롯 순회
    Object.values(equipment).forEach((item: GeneratedItem | null) => {
      if (!item) {
        return
      }

      // 기본 스탯 합산
      if (item.baseStats) {
        stats.attack += item.baseStats.attack || 0
        stats.defense += item.baseStats.defense || 0
        stats.hp += item.baseStats.hp || 0
        stats.mp += item.baseStats.mp || 0
        stats.speed += item.baseStats.speed || 0
        stats.critRate += item.baseStats.critRate || 0
        stats.critDamage += item.baseStats.critDamage || 0
        stats.accuracy += item.baseStats.accuracy || 0
        stats.dodge += item.baseStats.dodge || 0
        stats.resistance += item.baseStats.resistance || 0
      }

      // 랜덤 스탯 합산
      if (item.randomStats) {
        item.randomStats.forEach(randomStat => {
          switch (randomStat.type) {
            case 'attack':
              stats.attack += randomStat.value
              break
            case 'defense':
              stats.defense += randomStat.value
              break
            case 'hp':
              stats.hp += randomStat.value
              break
            case 'mp':
              stats.mp += randomStat.value
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
            case 'resistance':
              stats.resistance += randomStat.value
              break
          }
        })
      }
    })

    return stats
  }

  /**
   * 전투력 계산
   */
  private calculateCombatPower(stats: CombatStats): number {
    // 가중치를 적용한 전투력 계산
    const weights = {
      attack: 2.0,
      defense: 1.5,
      hp: 0.3,
      mp: 0.2,
      speed: 1.2,
      critRate: 50,    // 크리티컬률은 %이므로 높은 가중치
      critDamage: 30,   // 크리티컬 데미지도 %
      accuracy: 10,
      dodge: 15,
      resistance: 20
    }

    let power = 0
    power += stats.attack * weights.attack
    power += stats.defense * weights.defense
    power += stats.hp * weights.hp
    power += stats.mp * weights.mp
    power += stats.speed * weights.speed
    power += stats.critRate * weights.critRate
    power += stats.critDamage * weights.critDamage
    power += stats.accuracy * weights.accuracy
    power += stats.dodge * weights.dodge
    power += stats.resistance * weights.resistance

    return Math.round(power)
  }

  /**
   * Battle Character Stats로 변환
   */
  toBattleCharacterStats(combatStats: CombatStats, level: number, learningLevel: number): CharacterStats {
    return {
      level,
      hp: combatStats.hp,
      maxHp: combatStats.hp,
      mp: combatStats.mp,
      maxMp: combatStats.mp,
      attack: combatStats.attack,
      magicAttack: combatStats.attack + learningLevel * 5, // 학습 레벨이 마법 공격력에 추가 영향
      defense: combatStats.defense,
      magicDefense: combatStats.defense + learningLevel * 3, // 학습 레벨이 마법 방어력에 추가 영향
      speed: combatStats.speed,
      accuracy: combatStats.accuracy,
      evasion: combatStats.dodge,
      critical: combatStats.critRate,
      criticalDamage: combatStats.critDamage,
      critRate: combatStats.critRate,
      dodgeRate: combatStats.dodge
    }
  }
}

export const combatStatsService = CombatStatsService.getInstance()
