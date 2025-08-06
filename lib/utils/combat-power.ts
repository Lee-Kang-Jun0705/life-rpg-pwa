import type { EquipmentStats } from '@/lib/services/equipment-stats.service'

// 전투력 계산 계수
export const COMBAT_POWER_COEFFICIENTS = {
  LEVEL_MULTIPLIER: 100,
  ATTACK_MULTIPLIER: 10,
  DEFENSE_MULTIPLIER: 8,
  HP_MULTIPLIER: 1,
  SPEED_MULTIPLIER: 5
} as const

/**
 * 캐릭터의 전투력을 계산합니다.
 * @param characterLevel 캐릭터 레벨
 * @param equipmentStats 장비 스탯
 * @returns 계산된 전투력
 */
export function calculateCombatPower(
  characterLevel: number,
  equipmentStats: EquipmentStats
): number {
  return (
    characterLevel * COMBAT_POWER_COEFFICIENTS.LEVEL_MULTIPLIER +
    equipmentStats.attack * COMBAT_POWER_COEFFICIENTS.ATTACK_MULTIPLIER +
    equipmentStats.defense * COMBAT_POWER_COEFFICIENTS.DEFENSE_MULTIPLIER +
    equipmentStats.hp * COMBAT_POWER_COEFFICIENTS.HP_MULTIPLIER +
    equipmentStats.speed * COMBAT_POWER_COEFFICIENTS.SPEED_MULTIPLIER
  )
}

/**
 * 기본 전투력을 계산합니다. (장비 없이)
 * @param characterLevel 캐릭터 레벨
 * @returns 기본 전투력
 */
export function calculateBaseCombatPower(characterLevel: number): number {
  return characterLevel * COMBAT_POWER_COEFFICIENTS.LEVEL_MULTIPLIER
}