/**
 * 기본 아이템 데이터베이스
 * 모든 아이템의 기본 정보 정의
 * @deprecated 새로운 아이템 시스템은 lib/data/items 폴더를 사용하세요
 */

import type { Item } from '@/lib/types/item-system'
import { ItemType, ItemRarity } from '@/lib/types/item-system'
import { ALL_ITEMS } from './items/all-items'

// 새로운 아이템 시스템으로 마이그레이션
export const baseItems: Record<string, Item> = ALL_ITEMS

// 기존 호환성을 위한 레거시 아이템 정의
const legacyItems: Record<string, Item> = {
  // === 무기 ===
  // 초급 무기 (1-10 레벨)
  rusty_sword: {
    id: 'rusty_sword',
    name: '녹슨 검',
    description: '오래되어 녹이 슨 검. 그래도 쓸만하다.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: { attack: 5 },
    randomStats: [],
    value: 50,
    stackable: false,
  },
  
  wooden_staff: {
    id: 'wooden_staff',
    name: '나무 지팡이',
    description: '마법사들이 사용하는 기본적인 지팡이.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: { attack: 3, mp: 10 },
    randomStats: [],
    value: 60,
    stackable: false,
  },

  iron_sword: {
    id: 'iron_sword',
    name: '철검',
    description: '단단한 철로 만든 검.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    level: 5,
    baseStats: { attack: 10 },
    randomStats: [],
    value: 150,
    stackable: false,
  },

  // 중급 무기 (10-25 레벨)
  silver_blade: {
    id: 'silver_blade',
    name: '은빛 검',
    description: '은으로 도금된 날카로운 검.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    level: 15,
    baseStats: { attack: 20, speed: 5 },
    randomStats: [],
    value: 500,
    stackable: false,
  },

  mystic_staff: {
    id: 'mystic_staff',
    name: '신비한 지팡이',
    description: '마력이 깃든 신비로운 지팡이.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    level: 15,
    baseStats: { attack: 15, mp: 30 },
    randomStats: [],
    value: 600,
    stackable: false,
  },

  // 고급 무기 (25-50 레벨)
  crimson_blade: {
    id: 'crimson_blade',
    name: '진홍의 검',
    description: '붉은 기운이 감도는 강력한 검.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    level: 30,
    baseStats: { attack: 35 },
    randomStats: [],
    value: 1500,
    stackable: false,
  },

  // 최고급 무기 (50+ 레벨)
  dragon_slayer: {
    id: 'dragon_slayer',
    name: '용 사냥꾼',
    description: '용을 사냥하기 위해 만들어진 전설의 검.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.LEGENDARY,
    level: 60,
    baseStats: { attack: 80 },
    randomStats: [],
    specialEffects: [{
      id: 'dragon_bane',
      name: '용 살해자',
      description: '용족에게 50% 추가 피해',
      type: 'passive',
      effect: { type: 'damage', value: 1.5 }
    }],
    value: 10000,
    stackable: false,
  },

  // === 방어구 ===
  // 초급 방어구
  cloth_armor: {
    id: 'cloth_armor',
    name: '천 갑옷',
    description: '가볍지만 방어력은 낮은 갑옷.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: { defense: 3, hp: 20 },
    randomStats: [],
    value: 40,
    stackable: false,
  },

  leather_armor: {
    id: 'leather_armor',
    name: '가죽 갑옷',
    description: '질긴 가죽으로 만든 갑옷.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    level: 5,
    baseStats: { defense: 8, hp: 50 },
    randomStats: [],
    value: 120,
    stackable: false,
  },

  // 중급 방어구
  chain_mail: {
    id: 'chain_mail',
    name: '사슬 갑옷',
    description: '작은 쇠사슬로 엮은 갑옷.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    level: 15,
    baseStats: { defense: 20, hp: 100, speed: -5 },
    randomStats: [],
    value: 450,
    stackable: false,
  },

  // 고급 방어구
  mithril_armor: {
    id: 'mithril_armor',
    name: '미스릴 갑옷',
    description: '가볍고 단단한 미스릴로 만든 갑옷.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    level: 30,
    baseStats: { defense: 40, hp: 200, speed: 10 },
    randomStats: [],
    value: 1200,
    stackable: false,
  },

  // === 액세서리 ===
  // 초급 액세서리
  wooden_ring: {
    id: 'wooden_ring',
    name: '나무 반지',
    description: '나무로 깎아 만든 소박한 반지.',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: { mp: 10 },
    randomStats: [],
    value: 30,
    stackable: false,
  },

  copper_necklace: {
    id: 'copper_necklace',
    name: '구리 목걸이',
    description: '구리로 만든 목걸이.',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.COMMON,
    level: 5,
    baseStats: { hp: 30, mp: 20 },
    randomStats: [],
    value: 80,
    stackable: false,
  },

  // 중급 액세서리
  silver_ring: {
    id: 'silver_ring',
    name: '은 반지',
    description: '은으로 만든 반짝이는 반지.',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.UNCOMMON,
    level: 15,
    baseStats: { mp: 40, speed: 5 },
    randomStats: [],
    value: 300,
    stackable: false,
  },

  // 고급 액세서리
  ruby_pendant: {
    id: 'ruby_pendant',
    name: '루비 펜던트',
    description: '붉은 루비가 박힌 펜던트.',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    level: 30,
    baseStats: { attack: 10 },
    randomStats: [],
    value: 1000,
    stackable: false,
  },

  // === 소비 아이템 ===
  health_potion_small: {
    id: 'health_potion_small',
    name: '체력 포션 (소)',
    description: 'HP를 50 회복한다.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: {},
    randomStats: [],
    value: 20,
    stackable: true,
    maxStack: 99,
  },

  health_potion_medium: {
    id: 'health_potion_medium',
    name: '체력 포션 (중)',
    description: 'HP를 150 회복한다.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    level: 10,
    baseStats: {},
    randomStats: [],
    value: 50,
    stackable: true,
    maxStack: 99,
  },

  mana_potion_small: {
    id: 'mana_potion_small',
    name: '마나 포션 (소)',
    description: 'MP를 30 회복한다.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: {},
    randomStats: [],
    value: 25,
    stackable: true,
    maxStack: 99,
  },

  energy_drink: {
    id: 'energy_drink',
    name: '에너지 드링크',
    description: '에너지를 20 회복한다.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    level: 1,
    baseStats: {},
    randomStats: [],
    value: 100,
    stackable: true,
    maxStack: 50,
  },

  // === 재료 아이템 ===
  iron_ore: {
    id: 'iron_ore',
    name: '철광석',
    description: '무기나 방어구 제작에 사용되는 재료.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    level: 1,
    baseStats: {},
    randomStats: [],
    value: 10,
    stackable: true,
    maxStack: 999,
  },

  silver_ore: {
    id: 'silver_ore',
    name: '은광석',
    description: '고급 장비 제작에 사용되는 재료.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.UNCOMMON,
    level: 10,
    baseStats: {},
    randomStats: [],
    value: 50,
    stackable: true,
    maxStack: 999,
  },

  mithril_ore: {
    id: 'mithril_ore',
    name: '미스릴 광석',
    description: '최고급 장비 제작에 사용되는 희귀한 재료.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    level: 25,
    baseStats: {},
    randomStats: [],
    value: 200,
    stackable: true,
    maxStack: 999,
  },

  dragon_scale: {
    id: 'dragon_scale',
    name: '용의 비늘',
    description: '용에게서 얻은 단단한 비늘.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.LEGENDARY,
    level: 50,
    baseStats: {},
    randomStats: [],
    value: 1000,
    stackable: true,
    maxStack: 99,
  },

  // === 세트 아이템 ===
  warrior_set_sword: {
    id: 'warrior_set_sword',
    name: '전사의 검',
    description: '전사 세트의 일부.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    level: 25,
    baseStats: { attack: 30 },
    randomStats: [],
    setId: 'warrior_set',
    value: 1000,
    stackable: false,
  },

  warrior_set_armor: {
    id: 'warrior_set_armor',
    name: '전사의 갑옷',
    description: '전사 세트의 일부.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    level: 25,
    baseStats: { defense: 35, hp: 150 },
    randomStats: [],
    setId: 'warrior_set',
    value: 1000,
    stackable: false,
  },

  warrior_set_ring: {
    id: 'warrior_set_ring',
    name: '전사의 반지',
    description: '전사 세트의 일부.',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    level: 25,
    baseStats: { attack: 10, hp: 50 },
    randomStats: [],
    setId: 'warrior_set',
    value: 800,
    stackable: false,
  },
}