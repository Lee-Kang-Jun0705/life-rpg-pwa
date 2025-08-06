/**
 * 아이템 시스템 상수 정의
 * 하드코딩 제거, 모든 값을 상수로 관리
 */

// 아이템 희귀도별 설정 - 6단계 시스템
export const ITEM_RARITY_CONFIG = {
  common: {
    name: '일반',
    color: 'gray',
    statMultiplier: { min: 0.8, max: 1.0 },
    maxRandomStats: 0,
    dropRate: 0.6,
    sellPriceMultiplier: 1,
    enhanceSuccessBonus: 0,
    specialEffectChance: 0
  },
  magic: {
    name: '매직',
    color: 'blue',
    statMultiplier: { min: 1.0, max: 1.3 },
    maxRandomStats: 2,
    dropRate: 0.25,
    sellPriceMultiplier: 1.5,
    enhanceSuccessBonus: 5,
    specialEffectChance: 0.1
  },
  rare: {
    name: '레어',
    color: 'yellow',
    statMultiplier: { min: 1.3, max: 1.6 },
    maxRandomStats: 3,
    dropRate: 0.1,
    sellPriceMultiplier: 2,
    enhanceSuccessBonus: 10,
    specialEffectChance: 0.3
  },
  epic: {
    name: '에픽',
    color: 'purple',
    statMultiplier: { min: 1.6, max: 2.0 },
    maxRandomStats: 4,
    dropRate: 0.04,
    sellPriceMultiplier: 3,
    enhanceSuccessBonus: 15,
    specialEffectChance: 0.5
  },
  legendary: {
    name: '전설',
    color: 'orange',
    statMultiplier: { min: 2.0, max: 2.5 },
    maxRandomStats: 5,
    dropRate: 0.009,
    sellPriceMultiplier: 5,
    enhanceSuccessBonus: 20,
    specialEffectChance: 0.8
  },
  mythic: {
    name: '신화',
    color: 'red',
    statMultiplier: { min: 2.5, max: 3.0 },
    maxRandomStats: 6,
    dropRate: 0.001,
    sellPriceMultiplier: 10,
    enhanceSuccessBonus: 25,
    specialEffectChance: 1.0 // 100% 특수 효과
  }
} as const

// 랜덤 스탯 풀
export const RANDOM_STAT_POOLS = {
  weapon: {
    primary: ['attack', 'critRate', 'critDamage'],
    secondary: ['accuracy', 'speed', 'lifeSteal']
  },
  armor: {
    primary: ['defense', 'hp', 'resistance'],
    secondary: ['dodge', 'mpRegen', 'expBonus']
  },
  accessory: {
    primary: ['mp', 'speed', 'goldBonus'],
    secondary: ['critRate', 'dodge', 'expBonus']
  }
} as const

// 랜덤 스탯 티어별 범위
export const STAT_TIER_RANGES = {
  1: { min: 1, max: 5, weight: 0.4 },
  2: { min: 5, max: 10, weight: 0.3 },
  3: { min: 10, max: 15, weight: 0.2 },
  4: { min: 15, max: 20, weight: 0.08 },
  5: { min: 20, max: 30, weight: 0.02 }
} as const

// 세트 효과 설정
export const SET_BONUS_CONFIG = {
  2: { statBonus: 0.05, description: '2세트 효과' },
  3: { statBonus: 0.1, description: '3세트 효과' },
  4: { statBonus: 0.15, description: '4세트 효과' },
  5: { statBonus: 0.2, description: '5세트 효과' },
  6: { statBonus: 0.3, description: '6세트 완성' }
} as const

// 아이템 타입별 기본값
export const ITEM_TYPE_DEFAULTS = {
  weapon: {
    baseStats: { attack: 10 },
    stackable: false,
    maxStack: 1
  },
  armor: {
    baseStats: { defense: 10, hp: 50 },
    stackable: false,
    maxStack: 1
  },
  accessory: {
    baseStats: { mp: 20 },
    stackable: false,
    maxStack: 1
  },
  consumable: {
    baseStats: {},
    stackable: true,
    maxStack: 99
  },
  material: {
    baseStats: {},
    stackable: true,
    maxStack: 999
  }
} as const

// 강화 시스템 상수
export const ENHANCEMENT_CONFIG = {
  maxLevel: 15,
  statMultiplierPerLevel: 0.1,
  costMultiplierPerLevel: 1.5,
  baseCost: 100,

  // 강화 성공률 (인덱스 = 현재 레벨)
  successRates: [
    100, // 0→1
    100, // 1→2
    100, // 2→3
    95,  // 3→4
    90,  // 4→5
    85,  // 5→6
    75,  // 6→7
    65,  // 7→8
    55,  // 8→9
    45,  // 9→10
    35,  // 10→11
    25,  // 11→12
    15,  // 12→13
    10,  // 13→14
    5   // 14→15
  ],

  // 파괴 확률 (7강부터)
  destructionRates: {
    7: 0,
    8: 0,
    9: 0,
    10: 0.05,
    11: 0.1,
    12: 0.15,
    13: 0.2,
    14: 0.25,
    15: 0.3
  }
} as const

// 아이템 드롭 설정
export const DROP_CONFIG = {
  // 몬스터 등급별 드롭 개수
  dropCounts: {
    common: { min: 0, max: 1 },
    elite: { min: 1, max: 2 },
    boss: { min: 2, max: 4 },
    legendary: { min: 3, max: 5 }
  },

  // 희귀도 가중치 (몬스터 등급별)
  rarityWeights: {
    common: {
      common: 0.7,
      uncommon: 0.25,
      rare: 0.04,
      epic: 0.009,
      legendary: 0.001
    },
    elite: {
      common: 0.5,
      uncommon: 0.35,
      rare: 0.1,
      epic: 0.04,
      legendary: 0.01
    },
    boss: {
      common: 0.3,
      uncommon: 0.35,
      rare: 0.2,
      epic: 0.1,
      legendary: 0.05
    },
    legendary: {
      common: 0.1,
      uncommon: 0.3,
      rare: 0.3,
      epic: 0.2,
      legendary: 0.1
    }
  }
} as const

// 조합 시스템 상수
export const CRAFTING_CONFIG = {
  // 등급 업그레이드 (같은 등급 3개 → 다음 등급 1개)
  upgradeRequirement: 3,
  upgradeSuccessRate: 0.6,

  // 재료 보호
  protectionItemId: 'protection_scroll',

  // 특수 조합
  specialRecipes: {
    goldBonus: {
      materials: ['goldRing', 'goldRing', 'goldEssence'],
      result: 'greedyRing',
      successRate: 0.8
    },
    expBonus: {
      materials: ['expRing', 'expRing', 'wisdomEssence'],
      result: 'scholarRing',
      successRate: 0.8
    }
  }
} as const

// 아이템 가격 계산 설정
export const PRICE_CONFIG = {
  basePrice: {
    weapon: 100,
    armor: 80,
    accessory: 120,
    consumable: 20,
    material: 10
  },

  rarityMultiplier: {
    common: 1,
    uncommon: 2,
    rare: 5,
    epic: 10,
    legendary: 25
  },

  levelMultiplier: 1.1, // 레벨당 10% 증가
  enhancementMultiplier: 1.2 // 강화 레벨당 20% 증가
} as const

// 인벤토리 설정
export const INVENTORY_CONFIG = {
  baseSlots: 50,
  maxSlots: 300,
  slotUpgradeCost: 1000, // 슬롯당 골드
  slotUpgradeAmount: 10 // 한 번에 증가하는 슬롯 수
} as const

// 아이템 이모지 매핑
export const ITEM_EMOJI_MAP = {
  // 무기
  sword: '⚔️',
  staff: '🔮',
  bow: '🏹',
  dagger: '🗡️',
  hammer: '🔨',

  // 방어구
  helmet: '🪖',
  armor: '🛡️',
  gloves: '🧤',
  boots: '👢',
  shield: '🛡️',

  // 액세서리
  ring: '💍',
  necklace: '📿',
  bracelet: '⌚',
  earring: '💎',

  // 소비/재료
  potion: '🧪',
  scroll: '📜',
  essence: '💠',
  ore: '⛏️',
  gem: '💎'
} as const
