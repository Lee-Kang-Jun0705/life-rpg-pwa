import type { 
  Item, 
  ItemRarity, 
  ItemType, 
  ItemBonus,
  ItemRarityConfig,
  CharacterBattleStats 
} from '@/lib/types/dungeon'

// 아이템 등급별 설정
export const ITEM_RARITY_CONFIG: Record<ItemRarity, ItemRarityConfig> = {
  common: {
    color: '#9CA3AF', // gray-400
    minBonuses: 1,
    maxBonuses: 1,
    minBonusValue: 5,
    maxBonusValue: 10,
    dropRate: 60
  },
  uncommon: {
    color: '#22C55E', // green-500
    minBonuses: 2,
    maxBonuses: 2,
    minBonusValue: 10,
    maxBonusValue: 15,
    dropRate: 25
  },
  rare: {
    color: '#3B82F6', // blue-500
    minBonuses: 2,
    maxBonuses: 2,
    minBonusValue: 15,
    maxBonusValue: 25,
    dropRate: 10
  },
  epic: {
    color: '#A855F7', // purple-500
    minBonuses: 3,
    maxBonuses: 3,
    minBonusValue: 25,
    maxBonusValue: 35,
    dropRate: 4
  },
  legendary: {
    color: '#F97316', // orange-500
    minBonuses: 3,
    maxBonuses: 3,
    minBonusValue: 35,
    maxBonusValue: 50,
    dropRate: 0.9
  },
  mythic: {
    color: '#EF4444', // red-500
    minBonuses: 4,
    maxBonuses: 4,
    minBonusValue: 50,
    maxBonusValue: 75,
    dropRate: 0.1
  }
}

// 아이템 이름 접두사 (등급별)
const ITEM_PREFIXES: Record<ItemRarity, string[]> = {
  common: ['낡은', '평범한', '기본', '단순한'],
  uncommon: ['튼튼한', '정교한', '숙련된', '개선된'],
  rare: ['희귀한', '정제된', '강화된', '특별한'],
  epic: ['영웅의', '전설적인', '장인의', '고대의'],
  legendary: ['신화의', '불멸의', '천상의', '용의'],
  mythic: ['신의', '창조의', '운명의', '차원의']
}

// 아이템 기본 이름 (타입별)
const ITEM_BASE_NAMES: Record<ItemType, string[]> = {
  weapon: ['검', '도끼', '창', '활', '지팡이', '단검', '해머', '대검'],
  armor: ['갑옷', '로브', '튜닉', '판금갑옷', '가죽갑옷', '사슬갑옷'],
  accessory: ['반지', '목걸이', '팔찌', '귀걸이', '부적', '벨트']
}

// 스탯 이름 한글화
const STAT_NAMES: Partial<Record<keyof CharacterBattleStats, string>> = {
  attack: '공격력',
  defense: '방어력',
  maxHealth: '최대 체력',
  attackSpeed: '공격 속도',
  criticalChance: '치명타 확률',
  criticalDamage: '치명타 데미지',
  evasion: '회피율',
  penetration: '관통력',
  lifeSteal: '흡혈'
}

// 타입별 주요 스탯
const TYPE_PRIMARY_STATS: Record<ItemType, (keyof CharacterBattleStats)[]> = {
  weapon: ['attack', 'criticalChance', 'criticalDamage', 'attackSpeed'],
  armor: ['defense', 'maxHealth', 'evasion'],
  accessory: ['attackSpeed', 'criticalChance', 'evasion', 'penetration', 'lifeSteal']
}

/**
 * 아이템 등급 결정
 */
export function determineItemRarity(): ItemRarity {
  const roll = Math.random() * 100
  let accumulated = 0
  
  const rarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  
  for (const rarity of rarities) {
    accumulated += ITEM_RARITY_CONFIG[rarity].dropRate
    if (roll <= accumulated) {
      return rarity
    }
  }
  
  return 'common'
}

/**
 * 랜덤 아이템 생성
 */
export function generateRandomItem(playerLevel: number): Item {
  const rarity = determineItemRarity()
  const type = (['weapon', 'armor', 'accessory'] as ItemType[])[Math.floor(Math.random() * 3)]
  
  return generateItem(type, rarity, playerLevel)
}

/**
 * 특정 타입과 등급의 아이템 생성
 */
export function generateItem(type: ItemType, rarity: ItemRarity, playerLevel: number): Item {
  const config = ITEM_RARITY_CONFIG[rarity]
  
  // 이름 생성
  const prefix = ITEM_PREFIXES[rarity][Math.floor(Math.random() * ITEM_PREFIXES[rarity].length)]
  const baseName = ITEM_BASE_NAMES[type][Math.floor(Math.random() * ITEM_BASE_NAMES[type].length)]
  const name = `${prefix} ${baseName}`
  
  // 보너스 개수 결정
  const bonusCount = config.minBonuses + Math.floor(Math.random() * (config.maxBonuses - config.minBonuses + 1))
  
  // 보너스 생성
  const bonuses: ItemBonus[] = []
  const usedStats = new Set<keyof CharacterBattleStats>()
  const availableStats = TYPE_PRIMARY_STATS[type]
  
  for (let i = 0; i < bonusCount; i++) {
    // 사용 가능한 스탯 중 랜덤 선택
    const remainingStats = availableStats.filter(stat => !usedStats.has(stat))
    if (remainingStats.length === 0) break
    
    const stat = remainingStats[Math.floor(Math.random() * remainingStats.length)]
    usedStats.add(stat)
    
    // 보너스 값 계산 (레벨에 따라 약간 증가)
    const levelBonus = Math.floor(playerLevel / 10)
    const minValue = config.minBonusValue + levelBonus
    const maxValue = config.maxBonusValue + levelBonus
    const value = minValue + Math.floor(Math.random() * (maxValue - minValue + 1))
    
    bonuses.push({ stat, value })
  }
  
  // 특수 효과 (신화 등급만)
  let specialEffect: string | undefined
  if (rarity === 'mythic') {
    const effects = [
      '전투 시작 시 3초간 무적',
      '체력 30% 이하에서 50% 추가 데미지',
      '처치 시 최대 체력의 10% 회복',
      '10% 확률로 2배 데미지',
      '피격 시 15% 확률로 데미지 반사'
    ]
    specialEffect = effects[Math.floor(Math.random() * effects.length)]
  }
  
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    rarity,
    bonuses,
    specialEffect
  }
}

/**
 * 아이템 설명 생성
 */
export function getItemDescription(item: Item): string[] {
  const lines: string[] = []
  
  // 보너스 효과
  item.bonuses.forEach(bonus => {
    const statName = STAT_NAMES[bonus.stat] || bonus.stat
    lines.push(`+${bonus.value}% ${statName}`)
  })
  
  // 특수 효과
  if (item.specialEffect) {
    lines.push('')
    lines.push(`특수: ${item.specialEffect}`)
  }
  
  return lines
}

/**
 * 아이템 가치 계산 (판매 가격)
 */
export function calculateItemValue(item: Item): number {
  const rarityMultipliers: Record<ItemRarity, number> = {
    common: 10,
    uncommon: 25,
    rare: 60,
    epic: 150,
    legendary: 400,
    mythic: 1000
  }
  
  const baseValue = rarityMultipliers[item.rarity]
  const bonusValue = item.bonuses.reduce((sum, bonus) => sum + bonus.value, 0)
  
  return Math.floor(baseValue * (1 + bonusValue / 100))
}