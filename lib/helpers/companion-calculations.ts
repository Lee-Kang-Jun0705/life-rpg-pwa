/**
 * 컴패니언 계산 헬퍼 함수들
 * 레벨, 스탯, 전투력 등의 계산 로직
 */

import type { CompanionInstance, CompanionData, CompanionRarity } from '@/lib/types/companion'
import { getCompanionById } from '@/lib/data/companions'

// 희귀도별 보너스 배율
const RARITY_MULTIPLIERS: Record<CompanionRarity, number> = {
  common: 1.0,
  rare: 1.2,
  epic: 1.5,
  legendary: 2.0,
  mythic: 3.0
}

// 타입별 스탯 보너스
const TYPE_STAT_BONUSES = {
  offensive: { attack: 1.2, defense: 0.9, speed: 1.1 },
  defensive: { attack: 0.9, defense: 1.3, speed: 0.9 },
  support: { attack: 0.8, defense: 1.0, speed: 1.2 },
  balanced: { attack: 1.0, defense: 1.0, speed: 1.0 }
}

// 속성 상성 테이블
const ELEMENT_EFFECTIVENESS = {
  fire: { strong: ['earth', 'wind'], weak: ['water'] },
  water: { strong: ['fire'], weak: ['earth', 'wind'] },
  earth: { strong: ['water', 'wind'], weak: ['fire'] },
  wind: { strong: ['earth'], weak: ['fire', 'water'] },
  light: { strong: ['dark'], weak: ['dark'] },
  dark: { strong: ['light'], weak: ['light'] },
  normal: { strong: [], weak: [] }
}

/**
 * 컴패니언의 전투력 계산
 */
export function calculateCompanionPower(companion: CompanionInstance): number {
  const stats = companion.currentStats
  
  // 기본 전투력 = (공격력 * 2 + 방어력 * 1.5 + 체력 * 0.1 + 속도 * 1.2) * 레벨 보정
  const basePower = (
    stats.attack * 2 +
    stats.defense * 1.5 +
    stats.maxHp * 0.1 +
    stats.speed * 1.2
  ) * (1 + companion.level * 0.1)
  
  // 치명타 보정
  const critBonus = 1 + (stats.critRate * stats.critDamage) / 10000
  
  // 충성도 보정 (충성도가 높을수록 전투력 증가)
  const loyaltyBonus = 1 + (companion.loyalty / 100) * 0.2
  
  return Math.floor(basePower * critBonus * loyaltyBonus)
}

/**
 * 레벨업에 필요한 총 경험치 계산
 */
export function calculateTotalExpForLevel(level: number): number {
  let totalExp = 0
  for (let i = 1; i < level; i++) {
    totalExp += Math.floor(100 * Math.pow(1.15, i - 1))
  }
  return totalExp
}

/**
 * 현재 레벨에서의 진행률 계산 (0-100%)
 */
export function calculateLevelProgress(companion: CompanionInstance): number {
  return Math.floor((companion.exp / companion.expToNext) * 100)
}

/**
 * 컴패니언의 희귀도별 스탯 보너스 적용
 */
export function applyRarityBonus(baseStats: CompanionData['baseStats'], rarity: CompanionRarity) {
  const multiplier = RARITY_MULTIPLIERS[rarity]
  
  return {
    hp: Math.floor(baseStats.hp * multiplier),
    attack: Math.floor(baseStats.attack * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    speed: Math.floor(baseStats.speed * multiplier),
    critRate: baseStats.critRate, // 치명타율은 그대로
    critDamage: baseStats.critDamage // 치명타 데미지는 그대로
  }
}

/**
 * 속성 상성에 따른 데미지 배율 계산
 */
export function getElementalDamageMultiplier(
  attackerElement: CompanionData['element'],
  defenderElement: CompanionData['element']
): number {
  const effectiveness = ELEMENT_EFFECTIVENESS[attackerElement]
  
  if (effectiveness.strong.includes(defenderElement)) {
    return 1.5 // 효과적
  } else if (effectiveness.weak.includes(defenderElement)) {
    return 0.7 // 효과가 별로
  }
  
  return 1.0 // 보통
}

/**
 * 컴패니언의 기분에 따른 성능 보정
 */
export function getMoodModifier(mood: CompanionInstance['mood']): {
  attack: number
  defense: number
  speed: number
  expGain: number
} {
  switch (mood) {
    case 'happy':
      return { attack: 1.2, defense: 1.1, speed: 1.15, expGain: 1.3 }
    case 'normal':
      return { attack: 1.0, defense: 1.0, speed: 1.0, expGain: 1.0 }
    case 'sad':
      return { attack: 0.8, defense: 0.9, speed: 0.85, expGain: 0.7 }
    case 'tired':
      return { attack: 0.7, defense: 0.8, speed: 0.6, expGain: 0.5 }
    case 'hungry':
      return { attack: 0.75, defense: 0.85, speed: 0.7, expGain: 0.6 }
  }
}

/**
 * 컴패니언의 실제 전투 스탯 계산 (버프, 장비 등 모든 보정 적용)
 */
export function calculateCombatStats(
  companion: CompanionInstance,
  buffs?: { stat: string; value: number }[]
): CompanionInstance['currentStats'] {
  const companionData = getCompanionById(companion.companionId)
  if (!companionData) return companion.currentStats
  
  const moodModifier = getMoodModifier(companion.mood)
  const typeBonus = TYPE_STAT_BONUSES[companionData.type]
  
  // 기본 스탯에 모든 보정 적용
  let stats = { ...companion.currentStats }
  
  // 타입 보너스 적용
  stats.attack = Math.floor(stats.attack * typeBonus.attack)
  stats.defense = Math.floor(stats.defense * typeBonus.defense)
  stats.speed = Math.floor(stats.speed * typeBonus.speed)
  
  // 기분 보정 적용
  stats.attack = Math.floor(stats.attack * moodModifier.attack)
  stats.defense = Math.floor(stats.defense * moodModifier.defense)
  stats.speed = Math.floor(stats.speed * moodModifier.speed)
  
  // 버프 적용
  if (buffs) {
    buffs.forEach(buff => {
      const statKey = buff.stat as keyof typeof stats
      if (statKey in stats && typeof stats[statKey] === 'number') {
        (stats as any)[statKey] = Math.floor((stats as any)[statKey] * (1 + buff.value / 100))
      }
    })
  }
  
  return stats
}

/**
 * 컴패니언 진화 가능 여부 확인
 */
export function canEvolve(companion: CompanionInstance, playerInventory?: any): {
  canEvolve: boolean
  reason?: string
} {
  const companionData = getCompanionById(companion.companionId)
  if (!companionData || !companionData.evolution) {
    return { canEvolve: false, reason: '이 컴패니언은 진화할 수 없습니다.' }
  }
  
  const evolution = companionData.evolution
  
  // 레벨 확인
  if (companion.level < evolution.requiredLevel) {
    return { 
      canEvolve: false, 
      reason: `레벨 ${evolution.requiredLevel} 필요 (현재: ${companion.level})` 
    }
  }
  
  // 아이템 확인 (인벤토리가 제공된 경우)
  if (evolution.requiredItems && playerInventory) {
    for (const item of evolution.requiredItems) {
      // TODO: 실제 인벤토리 확인 로직
      // const hasItem = inventoryService.getItemCount(item.itemId) >= item.quantity
      // if (!hasItem) {
      //   return { canEvolve: false, reason: `${item.itemId} ${item.quantity}개 필요` }
      // }
    }
  }
  
  return { canEvolve: true }
}

/**
 * 컴패니언의 다음 스킬 언락 정보
 */
export function getNextSkillUnlock(companion: CompanionInstance): {
  skill: any | null
  levelsNeeded: number
} {
  const companionData = getCompanionById(companion.companionId)
  if (!companionData) return { skill: null, levelsNeeded: 0 }
  
  // 아직 언락하지 않은 스킬 중 가장 가까운 것 찾기
  const unlockedSkillIds = companion.unlockedSkills
  const nextSkill = companionData.skills
    .filter(skill => !unlockedSkillIds.includes(skill.id))
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0]
  
  if (!nextSkill) {
    return { skill: null, levelsNeeded: 0 }
  }
  
  return {
    skill: nextSkill,
    levelsNeeded: nextSkill.unlockLevel - companion.level
  }
}

/**
 * 컴패니언 활동에 필요한 비용 계산
 */
export function getActivityCost(activityType: CompanionActivity['type']): {
  gold?: number
  items?: { itemId: string; quantity: number }[]
} {
  switch (activityType) {
    case 'feed':
      return { gold: 50 }
    case 'play':
      return { gold: 0 } // 무료
    case 'train':
      return { gold: 100 }
    case 'rest':
      return { gold: 0 } // 무료
    case 'gift':
      return { gold: 200 }
    default:
      return {}
  }
}

/**
 * 컴패니언의 전투 기여도 계산
 */
export function calculateBattleContribution(
  companion: CompanionInstance,
  playerLevel: number
): number {
  const companionPower = calculateCompanionPower(companion)
  const levelDifference = Math.abs(companion.level - playerLevel)
  
  // 레벨 차이가 클수록 기여도 감소
  const levelPenalty = Math.max(0.5, 1 - levelDifference * 0.05)
  
  // 충성도가 높을수록 기여도 증가
  const loyaltyBonus = 0.5 + (companion.loyalty / 100) * 0.5
  
  return companionPower * levelPenalty * loyaltyBonus
}