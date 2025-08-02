/**
 * 재료 아이템 데이터 (40개)
 * 제작, 강화, 퀘스트 등에 사용되는 재료들
 */

import type { Item } from '@/lib/types/item-system'

export const MATERIAL_ITEMS: Record<string, Item> = {
  // === 광석류 ===
  iron_ore: {
    id: 'iron_ore',
    name: '철광석',
    description: '가장 기본적인 금속 광석.',
    type: 'material',
    rarity: 'common',
    level: 1,
    baseStats: {},
    value: 10,
    stackable: true,
    maxStack: 999
  },

  copper_ore: {
    id: 'copper_ore',
    name: '구리 광석',
    description: '붉은색을 띠는 부드러운 금속 광석.',
    type: 'material',
    rarity: 'common',
    level: 1,
    baseStats: {},
    value: 8,
    stackable: true,
    maxStack: 999
  },

  silver_ore: {
    id: 'silver_ore',
    name: '은광석',
    description: '빛나는 은색 광석.',
    type: 'material',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    value: 50,
    stackable: true,
    maxStack: 999
  },

  gold_ore: {
    id: 'gold_ore',
    name: '금광석',
    description: '귀중한 황금빛 광석.',
    type: 'material',
    rarity: 'uncommon',
    level: 15,
    baseStats: {},
    value: 100,
    stackable: true,
    maxStack: 999
  },

  mithril_ore: {
    id: 'mithril_ore',
    name: '미스릴 광석',
    description: '전설적인 은빛 금속 광석.',
    type: 'material',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    value: 300,
    stackable: true,
    maxStack: 999
  },

  adamantium_ore: {
    id: 'adamantium_ore',
    name: '아다만티움 광석',
    description: '세상에서 가장 단단한 금속 광석.',
    type: 'material',
    rarity: 'epic',
    level: 40,
    baseStats: {},
    value: 800,
    stackable: true,
    maxStack: 999
  },

  // === 보석류 ===
  rough_ruby: {
    id: 'rough_ruby',
    name: '다듬지 않은 루비',
    description: '가공하지 않은 붉은 보석.',
    type: 'material',
    rarity: 'uncommon',
    level: 12,
    baseStats: {},
    value: 80,
    stackable: true,
    maxStack: 99
  },

  rough_sapphire: {
    id: 'rough_sapphire',
    name: '다듬지 않은 사파이어',
    description: '가공하지 않은 푸른 보석.',
    type: 'material',
    rarity: 'uncommon',
    level: 12,
    baseStats: {},
    value: 80,
    stackable: true,
    maxStack: 99
  },

  rough_emerald: {
    id: 'rough_emerald',
    name: '다듬지 않은 에메랄드',
    description: '가공하지 않은 초록 보석.',
    type: 'material',
    rarity: 'uncommon',
    level: 12,
    baseStats: {},
    value: 80,
    stackable: true,
    maxStack: 99
  },

  rough_diamond: {
    id: 'rough_diamond',
    name: '다듬지 않은 다이아몬드',
    description: '가공하지 않은 투명한 보석.',
    type: 'material',
    rarity: 'rare',
    level: 20,
    baseStats: {},
    value: 200,
    stackable: true,
    maxStack: 99
  },

  star_fragment: {
    id: 'star_fragment',
    name: '별의 조각',
    description: '하늘에서 떨어진 신비한 조각.',
    type: 'material',
    rarity: 'epic',
    level: 35,
    baseStats: {},
    value: 500,
    stackable: true,
    maxStack: 99
  },

  // === 가죽/천 재료 ===
  wolf_pelt: {
    id: 'wolf_pelt',
    name: '늑대 가죽',
    description: '질긴 늑대의 가죽.',
    type: 'material',
    rarity: 'common',
    level: 5,
    baseStats: {},
    value: 25,
    stackable: true,
    maxStack: 99
  },

  bear_pelt: {
    id: 'bear_pelt',
    name: '곰 가죽',
    description: '두꺼운 곰의 가죽.',
    type: 'material',
    rarity: 'common',
    level: 8,
    baseStats: {},
    value: 40,
    stackable: true,
    maxStack: 99
  },

  silk_thread: {
    id: 'silk_thread',
    name: '비단실',
    description: '부드러운 비단으로 만든 실.',
    type: 'material',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    value: 60,
    stackable: true,
    maxStack: 999
  },

  magic_cloth: {
    id: 'magic_cloth',
    name: '마법 천',
    description: '마력이 깃든 특수한 천.',
    type: 'material',
    rarity: 'rare',
    level: 22,
    baseStats: {},
    value: 150,
    stackable: true,
    maxStack: 99
  },

  dragon_leather: {
    id: 'dragon_leather',
    name: '용가죽',
    description: '용의 질긴 가죽.',
    type: 'material',
    rarity: 'epic',
    level: 45,
    baseStats: {},
    value: 1000,
    stackable: true,
    maxStack: 99
  },

  // === 몬스터 재료 ===
  goblin_ear: {
    id: 'goblin_ear',
    name: '고블린 귀',
    description: '고블린에게서 얻은 귀.',
    type: 'material',
    rarity: 'common',
    level: 3,
    baseStats: {},
    value: 15,
    stackable: true,
    maxStack: 99
  },

  orc_fang: {
    id: 'orc_fang',
    name: '오크 송곳니',
    description: '날카로운 오크의 송곳니.',
    type: 'material',
    rarity: 'common',
    level: 10,
    baseStats: {},
    value: 35,
    stackable: true,
    maxStack: 99
  },

  troll_blood: {
    id: 'troll_blood',
    name: '트롤의 피',
    description: '재생력이 강한 트롤의 피.',
    type: 'material',
    rarity: 'uncommon',
    level: 18,
    baseStats: {},
    value: 90,
    stackable: true,
    maxStack: 99
  },

  dragon_scale: {
    id: 'dragon_scale',
    name: '용의 비늘',
    description: '단단한 용의 비늘.',
    type: 'material',
    rarity: 'rare',
    level: 40,
    baseStats: {},
    value: 500,
    stackable: true,
    maxStack: 99
  },

  phoenix_feather: {
    id: 'phoenix_feather',
    name: '불사조 깃털',
    description: '영원히 타오르는 불사조의 깃털.',
    type: 'material',
    rarity: 'legendary',
    level: 50,
    baseStats: {},
    value: 2000,
    stackable: true,
    maxStack: 99
  },

  // === 마법 재료 ===
  magic_dust: {
    id: 'magic_dust',
    name: '마법 가루',
    description: '기초적인 마법 재료.',
    type: 'material',
    rarity: 'common',
    level: 1,
    baseStats: {},
    value: 20,
    stackable: true,
    maxStack: 999
  },

  elemental_essence: {
    id: 'elemental_essence',
    name: '원소 정수',
    description: '순수한 원소의 힘이 담긴 정수.',
    type: 'material',
    rarity: 'uncommon',
    level: 15,
    baseStats: {},
    value: 100,
    stackable: true,
    maxStack: 99
  },

  arcane_crystal: {
    id: 'arcane_crystal',
    name: '비전 수정',
    description: '강력한 마력이 응축된 수정.',
    type: 'material',
    rarity: 'rare',
    level: 28,
    baseStats: {},
    value: 250,
    stackable: true,
    maxStack: 99
  },

  void_essence: {
    id: 'void_essence',
    name: '공허의 정수',
    description: '차원의 틈에서 얻은 정수.',
    type: 'material',
    rarity: 'epic',
    level: 42,
    baseStats: {},
    value: 750,
    stackable: true,
    maxStack: 99
  },

  // === 강화 재료 ===
  enhancement_stone_basic: {
    id: 'enhancement_stone_basic',
    name: '기본 강화석',
    description: '장비 강화에 사용되는 기본 강화석.',
    type: 'material',
    rarity: 'common',
    level: 1,
    baseStats: {},
    value: 50,
    stackable: true,
    maxStack: 999
  },

  enhancement_stone_advanced: {
    id: 'enhancement_stone_advanced',
    name: '상급 강화석',
    description: '높은 등급 장비 강화에 사용되는 강화석.',
    type: 'material',
    rarity: 'uncommon',
    level: 20,
    baseStats: {},
    value: 200,
    stackable: true,
    maxStack: 999
  },

  enhancement_stone_master: {
    id: 'enhancement_stone_master',
    name: '마스터 강화석',
    description: '최고급 장비 강화에 사용되는 강화석.',
    type: 'material',
    rarity: 'rare',
    level: 35,
    baseStats: {},
    value: 500,
    stackable: true,
    maxStack: 999
  },

  protection_scroll: {
    id: 'protection_scroll',
    name: '보호 주문서',
    description: '강화 실패 시 장비를 보호하는 주문서.',
    type: 'material',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    value: 1000,
    stackable: true,
    maxStack: 99
  },

  // === 특수 재료 ===
  ancient_rune: {
    id: 'ancient_rune',
    name: '고대의 룬',
    description: '고대 문명의 신비한 룬.',
    type: 'material',
    rarity: 'rare',
    level: 30,
    baseStats: {},
    value: 400,
    stackable: true,
    maxStack: 99
  },

  soul_shard: {
    id: 'soul_shard',
    name: '영혼의 파편',
    description: '강력한 존재의 영혼 파편.',
    type: 'material',
    rarity: 'epic',
    level: 38,
    baseStats: {},
    value: 600,
    stackable: true,
    maxStack: 99
  },

  time_crystal: {
    id: 'time_crystal',
    name: '시간의 수정',
    description: '시간을 담고 있는 신비한 수정.',
    type: 'material',
    rarity: 'legendary',
    level: 48,
    baseStats: {},
    value: 1500,
    stackable: true,
    maxStack: 99
  },

  chaos_orb: {
    id: 'chaos_orb',
    name: '혼돈의 구슬',
    description: '예측할 수 없는 힘이 담긴 구슬.',
    type: 'material',
    rarity: 'legendary',
    level: 50,
    baseStats: {},
    value: 3000,
    stackable: true,
    maxStack: 99
  },

  // === 제작 재료 ===
  wood_plank: {
    id: 'wood_plank',
    name: '나무 판자',
    description: '기본적인 목재 재료.',
    type: 'material',
    rarity: 'common',
    level: 1,
    baseStats: {},
    value: 5,
    stackable: true,
    maxStack: 999
  },

  hardwood: {
    id: 'hardwood',
    name: '단단한 나무',
    description: '더 단단한 종류의 목재.',
    type: 'material',
    rarity: 'common',
    level: 8,
    baseStats: {},
    value: 25,
    stackable: true,
    maxStack: 999
  },

  enchanted_wood: {
    id: 'enchanted_wood',
    name: '마법 나무',
    description: '마력이 깃든 특별한 나무.',
    type: 'material',
    rarity: 'uncommon',
    level: 20,
    baseStats: {},
    value: 120,
    stackable: true,
    maxStack: 999
  },

  living_root: {
    id: 'living_root',
    name: '살아있는 뿌리',
    description: '생명력이 넘치는 나무 뿌리.',
    type: 'material',
    rarity: 'rare',
    level: 32,
    baseStats: {},
    value: 350,
    stackable: true,
    maxStack: 99
  },

  world_tree_branch: {
    id: 'world_tree_branch',
    name: '세계수의 가지',
    description: '전설의 세계수에서 떨어진 가지.',
    type: 'material',
    rarity: 'legendary',
    level: 50,
    baseStats: {},
    value: 5000,
    stackable: true,
    maxStack: 10
  }
}
