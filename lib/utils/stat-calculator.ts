/**
 * 스탯 계산 유틸리티
 * 레벨 기반 스탯 계산을 위한 중앙화된 로직
 */

import { CombatStats, CombatStat } from '@/lib/types/game-core'
import { BATTLE_CONSTANTS } from '@/lib/types/battle-extended'

export interface StatFormulas {
  hp: (level: number) => number
  mp: (level: number) => number
  attack: (level: number) => number
  defense: (level: number) => number
  speed: (level: number) => number
  critRate: (level: number) => number
  critDamage: (level: number) => number
  dodge: (level: number) => number
  accuracy: (level: number) => number
  resistance: (level: number) => number
}

/**
 * 레벨 기반 스탯 계산 공식
 * 모든 스탯 계산은 이 공식을 통해 일관성 있게 처리
 */
export const statFormulas: StatFormulas = {
  // HP: 기본 100 + 레벨당 50
  hp: (level: number) => BATTLE_CONSTANTS.BASE_HP + (level * 50),

  // MP: 기본 50 + 레벨당 10
  mp: (level: number) => BATTLE_CONSTANTS.BASE_MP + (level * 10),

  // 공격력: 기본 10 + 레벨당 3
  attack: (level: number) => BATTLE_CONSTANTS.BASE_ATTACK + (level * 3),

  // 방어력: 기본 5 + 레벨당 2
  defense: (level: number) => BATTLE_CONSTANTS.BASE_DEFENSE + (level * 2),

  // 속도: 기본 10 + 레벨당 1
  speed: (level: number) => BATTLE_CONSTANTS.BASE_SPEED + level,

  // 치명타율: 기본 5% + 2레벨당 1%
  critRate: (level: number) => BATTLE_CONSTANTS.BASE_CRITICAL + Math.floor(level / 2) * 0.01,

  // 치명타 데미지: 기본 150% + 레벨당 2%
  critDamage: (level: number) => BATTLE_CONSTANTS.BASE_CRITICAL_DAMAGE + (level * 0.02),

  // 회피율: 기본 5% + 3레벨당 1%
  dodge: (level: number) => BATTLE_CONSTANTS.BASE_EVASION + Math.floor(level / 3) * 0.01,

  // 명중률: 기본 95% + 5레벨당 1%
  accuracy: (level: number) => BATTLE_CONSTANTS.BASE_ACCURACY + Math.floor(level / 5) * 0.01,

  // 저항력: 2레벨당 1%
  resistance: (level: number) => Math.floor(level / 2) * 0.01
}

/**
 * 레벨에 따른 전체 전투 스탯 계산
 */
export function calculateCombatStats(level: number): Record<CombatStat, number> {
  return {
    [CombatStats.HP]: statFormulas.hp(level),
    [CombatStats.MP]: statFormulas.mp(level),
    [CombatStats.ATTACK]: statFormulas.attack(level),
    [CombatStats.DEFENSE]: statFormulas.defense(level),
    [CombatStats.SPEED]: statFormulas.speed(level),
    [CombatStats.CRIT_RATE]: statFormulas.critRate(level),
    [CombatStats.CRIT_DAMAGE]: statFormulas.critDamage(level),
    [CombatStats.DODGE]: statFormulas.dodge(level),
    [CombatStats.ACCURACY]: statFormulas.accuracy(level),
    [CombatStats.RESISTANCE]: statFormulas.resistance(level)
  }
}

/**
 * 경험치 요구량 계산
 * 새로운 공식: 10 × 2^(현재레벨)
 * 레벨 0→1: 10 EXP
 * 레벨 1→2: 20 EXP
 * 레벨 2→3: 40 EXP
 * 레벨 3→4: 80 EXP
 */
export function calculateRequiredExperience(level: number): number {
  if (level < 0) {
    return 0
  }

  // 10 × 2^(현재레벨)
  return 10 * Math.pow(2, level)
}

/**
 * 총 경험치로부터 레벨 계산
 */
export function calculateLevelFromExperience(totalExp: number): { level: number; currentExp: number } {
  let level = 0
  let remainingExp = totalExp

  while (remainingExp >= calculateRequiredExperience(level)) {
    remainingExp -= calculateRequiredExperience(level)
    level++

    // 최대 레벨 체크
    if (level >= 100) {
      break
    }
  }

  return {
    level,
    currentExp: remainingExp
  }
}

/**
 * 현재 레벨까지의 누적 경험치 계산
 */
export function calculateTotalExperience(level: number, currentExp = 0): number {
  let total = currentExp

  for (let i = 0; i < level; i++) {
    total += calculateRequiredExperience(i)
  }

  return total
}

/**
 * 전투력 계산
 */
export function calculateCombatPower(stats: Record<CombatStat, number>): number {
  const weights = {
    [CombatStats.HP]: 0.3,
    [CombatStats.MP]: 0.2,
    [CombatStats.ATTACK]: 2.0,
    [CombatStats.DEFENSE]: 1.5,
    [CombatStats.SPEED]: 1.2,
    [CombatStats.CRIT_RATE]: 50,
    [CombatStats.CRIT_DAMAGE]: 30,
    [CombatStats.DODGE]: 15,
    [CombatStats.ACCURACY]: 10,
    [CombatStats.RESISTANCE]: 20
  }

  let power = 0
  for (const [stat, value] of Object.entries(stats)) {
    power += value * (weights[stat as CombatStat] || 1)
  }

  return Math.round(power)
}
