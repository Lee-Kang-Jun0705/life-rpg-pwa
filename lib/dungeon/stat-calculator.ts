import type { Stat } from '@/lib/database/types'
import type { CharacterBattleStats } from '@/lib/types/dungeon'
import { getCharacterLevelDetails } from '@/lib/utils/character-level'

/**
 * 대시보드 스탯을 전투 스탯으로 변환
 */
export function calculateBattleStats(stats: Stat[]): CharacterBattleStats {
  const levelDetails = getCharacterLevelDetails(stats)
  const totalLevel = Math.max(1, levelDetails.total) // 최소 레벨 1
  
  // 각 스탯 레벨 (기본값 0)
  const healthLevel = levelDetails.health || 0
  const learningLevel = levelDetails.learning || 0
  const relationshipLevel = levelDetails.relationship || 0
  const achievementLevel = levelDetails.achievement || 0
  
  // 기본 스탯 계산 (최소값 보장)
  const baseHealth = Math.max(200, (totalLevel * 50) + (healthLevel * 20) + 200)
  const baseAttack = Math.max(50, (totalLevel * 10) + (learningLevel * 5) + 50)
  const baseDefense = Math.max(20, (totalLevel * 5) + (healthLevel * 3) + 20)
  
  // 부가 스탯 계산
  const attackSpeed = Math.max(0, relationshipLevel * 2) // 관계 레벨당 2%
  const criticalChance = Math.max(5, 5 + (learningLevel * 0.5)) // 기본 5% + 학습 레벨당 0.5%
  const criticalDamage = Math.max(150, 150 + (achievementLevel * 1)) // 기본 150% + 성취 레벨당 1%
  const evasion = Math.max(5, 5 + (relationshipLevel * 0.3)) // 기본 5% + 관계 레벨당 0.3%
  const penetration = Math.max(0, achievementLevel * 0.5) // 성취 레벨당 0.5%
  const lifeSteal = Math.max(0, healthLevel * 0.1) // 건강 레벨당 0.1%
  
  // 전체 스탯 보너스 적용 (성취 레벨)
  const statBonus = 1 + (achievementLevel * 0.002) // 성취 레벨당 0.2%
  
  const finalMaxHealth = Math.floor(baseHealth * statBonus)
  
  return {
    health: finalMaxHealth, // 현재 체력도 최대 체력과 동일하게 설정
    maxHealth: finalMaxHealth,
    attack: Math.floor(baseAttack * statBonus),
    defense: Math.floor(baseDefense * statBonus),
    attackSpeed,
    criticalChance: Math.min(criticalChance, 100), // 최대 100%
    criticalDamage,
    evasion: Math.min(evasion, 50), // 최대 50%
    penetration: Math.min(penetration, 50), // 최대 50%
    lifeSteal: Math.min(lifeSteal, 30), // 최대 30%
    totalLevel,
    healthLevel,
    learningLevel,
    relationshipLevel,
    achievementLevel
  }
}

/**
 * 공격 속도에 따른 실제 공격 간격 계산
 * @param baseInterval 기본 공격 간격 (ms)
 * @param attackSpeed 공격 속도 (%)
 * @returns 실제 공격 간격 (ms)
 */
export function calculateAttackInterval(baseInterval: number, attackSpeed: number): number {
  // 공격속도 0% = 1초, 100% = 0.5초, 200% = 0.33초
  const speedMultiplier = 1 + (attackSpeed / 100)
  return Math.floor(baseInterval / speedMultiplier)
}

/**
 * 데미지 계산
 */
export function calculateDamage(
  attacker: { attack: number; criticalChance: number; criticalDamage: number; penetration: number },
  defender: { defense: number; evasion: number }
): {
  damage: number
  isCritical: boolean
  isEvaded: boolean
  actualDamage: number
} {
  // 값 검증 및 기본값 설정
  const attackPower = Math.max(1, attacker.attack || 1)
  const defensePower = Math.max(0, defender.defense || 0)
  const critChance = Math.max(0, Math.min(100, attacker.criticalChance || 0))
  const critDamage = Math.max(100, attacker.criticalDamage || 150)
  const penetrationRate = Math.max(0, Math.min(100, attacker.penetration || 0))
  const evasionRate = Math.max(0, Math.min(100, defender.evasion || 0))
  
  // 회피 판정
  if (Math.random() * 100 < evasionRate) {
    return {
      damage: 0,
      isCritical: false,
      isEvaded: true,
      actualDamage: 0
    }
  }
  
  // 기본 데미지 계산
  let damage = attackPower - (defensePower * 0.5)
  damage = Math.max(1, damage) // 최소 1 데미지
  
  // 치명타 판정
  const isCritical = Math.random() * 100 < critChance
  if (isCritical) {
    damage = Math.floor(damage * (critDamage / 100))
  }
  
  // 관통력 적용
  damage = damage + Math.floor(damage * (penetrationRate / 100))
  
  // 최종 데미지 검증
  const finalDamage = Math.max(1, Math.floor(damage))
  
  return {
    damage: finalDamage,
    isCritical,
    isEvaded: false,
    actualDamage: finalDamage
  }
}

/**
 * 흡혈 계산
 */
export function calculateLifeSteal(damage: number, lifeSteal: number): number {
  return Math.floor(damage * (lifeSteal / 100))
}

/**
 * 아이템 보너스 적용
 */
export function applyItemBonuses(
  baseStats: CharacterBattleStats,
  items: Array<{ bonuses: Array<{ stat: keyof CharacterBattleStats; value: number }> }>
): CharacterBattleStats {
  const stats = { ...baseStats }
  
  items.forEach(item => {
    item.bonuses.forEach(bonus => {
      const stat = bonus.stat
      const value = bonus.value
      
      // 퍼센트 보너스 적용
      if (typeof stats[stat] === 'number') {
        const currentValue = stats[stat] as number
        const bonusValue = currentValue * (value / 100)
        ;(stats[stat] as number) = currentValue + bonusValue
      }
    })
  })
  
  // 정수로 변환
  stats.health = Math.floor(stats.health)
  stats.maxHealth = Math.floor(stats.maxHealth)
  stats.attack = Math.floor(stats.attack)
  stats.defense = Math.floor(stats.defense)
  
  return stats
}