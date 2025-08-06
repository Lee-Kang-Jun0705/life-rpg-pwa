// JRPG 아이템 데이터베이스
import type { ItemDefinition } from './types'
import { ItemRarity } from './item-rarity'
import { EquipmentSlot } from './types'

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
  // 무기 - Common
  'weapon_001': {
    id: 'weapon_001',
    name: '낡은 검',
    description: '오래된 철제 검입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.COMMON,
    levelRequirement: 1,
    baseStats: {
      attack: 10
    },
    sellPrice: 50,
    icon: '⚔️'
  },

  // 무기 - Uncommon
  'weapon_002': {
    id: 'weapon_002',
    name: '강철 검',
    description: '잘 단련된 강철 검입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    levelRequirement: 5,
    baseStats: {
      attack: 25,
      criticalRate: 5
    },
    randomOptions: [
      { stat: 'attack', min: 3, max: 7 },
      { stat: 'speed', min: 1, max: 3 }
    ],
    sellPrice: 200,
    icon: '⚔️'
  },

  // 무기 - Rare
  'weapon_003': {
    id: 'weapon_003',
    name: '마법 검',
    description: '마력이 깃든 검입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.RARE,
    levelRequirement: 10,
    baseStats: {
      attack: 40,
      magicPower: 20,
      criticalRate: 10
    },
    randomOptions: [
      { stat: 'attack', min: 5, max: 10 },
      { stat: 'magicPower', min: 3, max: 7 },
      { stat: 'criticalDamage', min: 10, max: 20 }
    ],
    specialEffect: '공격 시 10% 확률로 화염 폭발',
    sellPrice: 500,
    icon: '🗡️'
  },

  // 무기 - Epic
  'weapon_004': {
    id: 'weapon_004',
    name: '용살자의 검',
    description: '용을 사냥한 영웅의 검입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.EPIC,
    levelRequirement: 20,
    baseStats: {
      attack: 80,
      criticalRate: 15,
      criticalDamage: 50,
      penetration: 10
    },
    randomOptions: [
      { stat: 'attack', min: 10, max: 20 },
      { stat: 'allStats', min: 5, max: 10 }
    ],
    specialEffect: '용족 몬스터에게 50% 추가 데미지',
    setBonus: {
      setId: 'dragon_slayer',
      pieces: 2,
      bonus: '공격력 +20%, 방어력 +20%'
    },
    sellPrice: 2000,
    icon: '🗡️'
  },

  // 무기 - Legendary
  'weapon_005': {
    id: 'weapon_005',
    name: '엑스칼리버',
    description: '전설의 성검입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.LEGENDARY,
    levelRequirement: 30,
    baseStats: {
      attack: 150,
      allStats: 20,
      criticalRate: 20,
      criticalDamage: 100
    },
    uniquePassive: '빛의 가호: 공격 시 체력 5% 회복',
    sellPrice: 10000,
    icon: '⚔️✨'
  },

  // 무기 - Mythic
  'weapon_006': {
    id: 'weapon_006',
    name: '천상의 검',
    description: '신들이 사용했다는 전설의 무기입니다.',
    type: 'weapon',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.MYTHIC,
    levelRequirement: 50,
    baseStats: {
      attack: 300,
      allStats: 50,
      criticalRate: 30,
      criticalDamage: 150,
      penetration: 30
    },
    mythicAbility: '신의 심판: 공격 시 30% 확률로 즉사 효과',
    sellPrice: 50000,
    icon: '⚔️🌟'
  },

  // 방어구 - Common
  'armor_001': {
    id: 'armor_001',
    name: '가죽 갑옷',
    description: '기본적인 가죽 갑옷입니다.',
    type: 'armor',
    slot: EquipmentSlot.ARMOR,
    rarity: ItemRarity.COMMON,
    levelRequirement: 1,
    baseStats: {
      defense: 10,
      hp: 50
    },
    sellPrice: 50,
    icon: '🛡️'
  },

  // 방어구 - Uncommon
  'armor_002': {
    id: 'armor_002',
    name: '사슬 갑옷',
    description: '사슬로 만든 갑옷입니다.',
    type: 'armor',
    slot: EquipmentSlot.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    levelRequirement: 5,
    baseStats: {
      defense: 25,
      hp: 100,
      magicResist: 10
    },
    randomOptions: [
      { stat: 'defense', min: 3, max: 7 },
      { stat: 'hp', min: 20, max: 50 }
    ],
    sellPrice: 200,
    icon: '🛡️'
  },

  // 방어구 - Rare
  'armor_003': {
    id: 'armor_003',
    name: '미스릴 갑옷',
    description: '미스릴로 제작된 가벼운 갑옷입니다.',
    type: 'armor',
    slot: EquipmentSlot.ARMOR,
    rarity: ItemRarity.RARE,
    levelRequirement: 10,
    baseStats: {
      defense: 40,
      hp: 200,
      speed: 10,
      magicResist: 20
    },
    specialEffect: '받는 데미지 10% 감소',
    sellPrice: 500,
    icon: '🛡️'
  },

  // 액세서리 - Uncommon
  'accessory_001': {
    id: 'accessory_001',
    name: '힘의 반지',
    description: '착용자의 힘을 증가시킵니다.',
    type: 'accessory',
    rarity: ItemRarity.UNCOMMON,
    levelRequirement: 1,
    baseStats: {
      attack: 10
    },
    sellPrice: 150,
    icon: '💍'
  },

  // 액세서리 - Rare
  'accessory_002': {
    id: 'accessory_002',
    name: '마나 목걸이',
    description: '마력을 증폭시키는 목걸이입니다.',
    type: 'accessory',
    rarity: ItemRarity.RARE,
    levelRequirement: 10,
    baseStats: {
      mp: 50,
      magicPower: 15
    },
    specialEffect: '스킬 쿨다운 10% 감소',
    sellPrice: 400,
    icon: '📿'
  },

  // 액세서리 - Epic
  'accessory_003': {
    id: 'accessory_003',
    name: '불사조의 깃털',
    description: '불사조의 힘이 깃든 신비한 아이템입니다.',
    type: 'accessory',
    rarity: ItemRarity.EPIC,
    levelRequirement: 20,
    baseStats: {
      hp: 300,
      allStats: 10
    },
    uniquePassive: '부활: 사망 시 50% 체력으로 부활 (전투당 1회)',
    sellPrice: 1500,
    icon: '🪶'
  },

  // 소모품
  'consumable_001': {
    id: 'consumable_001',
    name: '체력 포션',
    description: '체력을 50 회복합니다.',
    type: 'consumable',
    rarity: ItemRarity.COMMON,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 20,
    icon: '🧪'
  },

  'consumable_002': {
    id: 'consumable_002',
    name: '마나 포션',
    description: '마나를 30 회복합니다.',
    type: 'consumable',
    rarity: ItemRarity.COMMON,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 20,
    icon: '💙'
  },

  'consumable_003': {
    id: 'consumable_003',
    name: '엘릭서',
    description: '체력과 마나를 모두 회복합니다.',
    type: 'consumable',
    rarity: ItemRarity.RARE,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 200,
    icon: '⚗️'
  },

  // 재료
  'material_001': {
    id: 'material_001',
    name: '철광석',
    description: '무기 제작에 사용되는 재료입니다.',
    type: 'material',
    rarity: ItemRarity.COMMON,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 10,
    icon: '🪨'
  },

  'material_002': {
    id: 'material_002',
    name: '마법석',
    description: '마법 아이템 제작에 필요한 재료입니다.',
    type: 'material',
    rarity: ItemRarity.UNCOMMON,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 50,
    icon: '💎'
  },

  'material_003': {
    id: 'material_003',
    name: '용의 비늘',
    description: '전설급 장비 제작에 필요한 희귀 재료입니다.',
    type: 'material',
    rarity: ItemRarity.EPIC,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 500,
    icon: '🐉'
  }
}

// 아이템 드롭 테이블
export const ITEM_DROP_TABLES = {
  common_monster: [
    { itemId: 'consumable_001', dropRate: 0.3 },
    { itemId: 'material_001', dropRate: 0.5 },
    { itemId: 'weapon_001', dropRate: 0.1 },
    { itemId: 'armor_001', dropRate: 0.1 }
  ],
  rare_monster: [
    { itemId: 'consumable_002', dropRate: 0.3 },
    { itemId: 'material_002', dropRate: 0.4 },
    { itemId: 'weapon_002', dropRate: 0.15 },
    { itemId: 'accessory_001', dropRate: 0.15 }
  ],
  boss_monster: [
    { itemId: 'consumable_003', dropRate: 0.5 },
    { itemId: 'material_003', dropRate: 0.3 },
    { itemId: 'weapon_003', dropRate: 0.1 },
    { itemId: 'armor_003', dropRate: 0.1 }
  ]
}

// 세트 아이템 정보
export const ITEM_SETS = {
  dragon_slayer: {
    name: '용살자 세트',
    items: ['weapon_004', 'armor_004', 'accessory_004'],
    bonuses: {
      2: '공격력 +20%, 방어력 +20%',
      3: '용족에게 받는 데미지 50% 감소, 크리티컬 확률 +30%'
    }
  }
}