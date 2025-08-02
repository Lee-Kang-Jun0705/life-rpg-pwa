/**
 * 액세서리 아이템 데이터 (40개)
 * 반지, 목걸이, 귀걸이, 팔찌 등
 */

import type { Item } from '@/lib/types/item-system'

export const ACCESSORY_ITEMS: Record<string, Item> = {
  // === 반지류 ===
  // 초급 반지 (1-10 레벨)
  copper_ring: {
    id: 'copper_ring',
    name: '구리 반지',
    description: '단순한 구리로 만든 반지.',
    type: 'accessory',
    rarity: 'common',
    level: 1,
    baseStats: { hp: 20 },
    value: 25,
    stackable: false
  },

  silver_ring: {
    id: 'silver_ring',
    name: '은 반지',
    description: '빛나는 은으로 만든 반지.',
    type: 'accessory',
    rarity: 'common',
    level: 5,
    baseStats: { mp: 25, mpRegen: 1 },
    value: 100,
    stackable: false
  },

  gold_ring: {
    id: 'gold_ring',
    name: '금 반지',
    description: '순금으로 만든 고급 반지.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 10,
    baseStats: { hp: 50, mp: 30 },
    value: 350,
    stackable: false
  },

  ruby_ring: {
    id: 'ruby_ring',
    name: '루비 반지',
    description: '붉은 루비가 박힌 반지.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 15,
    baseStats: { attack: 10, critRate: 0.05 },
    value: 600,
    stackable: false
  },

  sapphire_ring: {
    id: 'sapphire_ring',
    name: '사파이어 반지',
    description: '푸른 사파이어가 박힌 반지.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 15,
    baseStats: { mp: 60, spellPower: 15 },
    value: 600,
    stackable: false
  },

  emerald_ring: {
    id: 'emerald_ring',
    name: '에메랄드 반지',
    description: '초록빛 에메랄드가 박힌 반지.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 15,
    baseStats: { hpRegen: 5, mpRegen: 3 },
    value: 600,
    stackable: false
  },

  // 중급 반지 (20-30 레벨)
  ring_of_power: {
    id: 'ring_of_power',
    name: '힘의 반지',
    description: '착용자의 힘을 증폭시키는 반지.',
    type: 'accessory',
    rarity: 'rare',
    level: 25,
    baseStats: { attack: 25, critDamage: 0.2 },
    value: 1500,
    stackable: false
  },

  ring_of_wisdom: {
    id: 'ring_of_wisdom',
    name: '지혜의 반지',
    description: '고대의 지혜가 담긴 반지.',
    type: 'accessory',
    rarity: 'rare',
    level: 25,
    baseStats: { mp: 100, spellPower: 30, cooldownReduction: 0.1 },
    value: 1500,
    stackable: false
  },

  ring_of_protection: {
    id: 'ring_of_protection',
    name: '수호의 반지',
    description: '착용자를 보호하는 마법이 걸린 반지.',
    type: 'accessory',
    rarity: 'rare',
    level: 28,
    baseStats: { defense: 15, resistance: 0.1, damageReduction: 0.05 },
    value: 1800,
    stackable: false
  },

  // 고급 반지 (35-50 레벨)
  eternity_ring: {
    id: 'eternity_ring',
    name: '영원의 반지',
    description: '시간을 초월한 힘을 가진 반지.',
    type: 'accessory',
    rarity: 'epic',
    level: 40,
    baseStats: { allStats: 20, cooldownReduction: 0.2 },
    value: 6000,
    stackable: false
  },

  soul_ring: {
    id: 'soul_ring',
    name: '영혼의 반지',
    description: '영혼의 힘을 다루는 반지.',
    type: 'accessory',
    rarity: 'legendary',
    level: 48,
    baseStats: { hp: 200, mp: 200, lifesteal: 0.15, spellVamp: 0.15 },
    value: 15000,
    stackable: false
  },

  // === 목걸이류 ===
  // 초급 목걸이
  leather_necklace: {
    id: 'leather_necklace',
    name: '가죽 목걸이',
    description: '동물 가죽으로 만든 목걸이.',
    type: 'accessory',
    rarity: 'common',
    level: 2,
    baseStats: { hp: 30, speed: 2 },
    value: 40,
    stackable: false
  },

  bead_necklace: {
    id: 'bead_necklace',
    name: '구슬 목걸이',
    description: '여러 색의 구슬로 만든 목걸이.',
    type: 'accessory',
    rarity: 'common',
    level: 6,
    baseStats: { mp: 40, resistance: 0.03 },
    value: 120,
    stackable: false
  },

  iron_chain_necklace: {
    id: 'iron_chain_necklace',
    name: '철사슬 목걸이',
    description: '견고한 철사슬 목걸이.',
    type: 'accessory',
    rarity: 'common',
    level: 8,
    baseStats: { defense: 8, hp: 40 },
    value: 180,
    stackable: false
  },

  // 중급 목걸이
  amulet_of_strength: {
    id: 'amulet_of_strength',
    name: '힘의 부적',
    description: '물리적 힘을 증가시키는 부적.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 18,
    baseStats: { attack: 15, hp: 80 },
    value: 700,
    stackable: false
  },

  amulet_of_magic: {
    id: 'amulet_of_magic',
    name: '마법의 부적',
    description: '마법 능력을 향상시키는 부적.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 18,
    baseStats: { spellPower: 25, mp: 80 },
    value: 700,
    stackable: false
  },

  holy_symbol: {
    id: 'holy_symbol',
    name: '성스러운 심볼',
    description: '신성한 힘이 깃든 목걸이.',
    type: 'accessory',
    rarity: 'rare',
    level: 30,
    baseStats: { holyDamage: 20, darkResistance: 0.3, healingPower: 0.2 },
    value: 2000,
    stackable: false
  },

  // 고급 목걸이
  eye_of_dragon: {
    id: 'eye_of_dragon',
    name: '용의 눈',
    description: '고대 용의 눈으로 만든 목걸이.',
    type: 'accessory',
    rarity: 'epic',
    level: 38,
    baseStats: { allStats: 15, critRate: 0.15, accuracy: 0.2 },
    value: 5500,
    stackable: false
  },

  heart_of_ocean: {
    id: 'heart_of_ocean',
    name: '바다의 심장',
    description: '깊은 바다의 정수가 담긴 목걸이.',
    type: 'accessory',
    rarity: 'epic',
    level: 42,
    baseStats: { hp: 300, mp: 200, waterResistance: 0.5, breathUnderwater: true },
    value: 7000,
    stackable: false
  },

  celestial_pendant: {
    id: 'celestial_pendant',
    name: '천상의 펜던트',
    description: '하늘의 별빛이 담긴 펜던트.',
    type: 'accessory',
    rarity: 'legendary',
    level: 50,
    baseStats: { allStats: 30, dodge: 0.15, divineProtection: 0.1 },
    value: 20000,
    stackable: false
  },

  // === 귀걸이류 ===
  simple_earring: {
    id: 'simple_earring',
    name: '심플한 귀걸이',
    description: '장식이 없는 단순한 귀걸이.',
    type: 'accessory',
    rarity: 'common',
    level: 3,
    baseStats: { accuracy: 0.05, speed: 3 },
    value: 60,
    stackable: false
  },

  crystal_earring: {
    id: 'crystal_earring',
    name: '수정 귀걸이',
    description: '작은 수정이 달린 귀걸이.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 12,
    baseStats: { mp: 50, mpRegen: 2 },
    value: 400,
    stackable: false
  },

  moonstone_earring: {
    id: 'moonstone_earring',
    name: '월장석 귀걸이',
    description: '신비로운 월장석이 달린 귀걸이.',
    type: 'accessory',
    rarity: 'rare',
    level: 26,
    baseStats: { dodge: 0.08, speed: 15, nightVision: true },
    value: 1600,
    stackable: false
  },

  phoenix_feather_earring: {
    id: 'phoenix_feather_earring',
    name: '불사조 깃털 귀걸이',
    description: '불사조의 깃털로 만든 귀걸이.',
    type: 'accessory',
    rarity: 'epic',
    level: 45,
    baseStats: { fireResistance: 0.4, hpRegen: 10, reviveChance: 0.05 },
    value: 8000,
    stackable: false
  },

  // === 팔찌류 ===
  rope_bracelet: {
    id: 'rope_bracelet',
    name: '밧줄 팔찌',
    description: '질긴 밧줄로 엮은 팔찌.',
    type: 'accessory',
    rarity: 'common',
    level: 2,
    baseStats: { hp: 25, defense: 2 },
    value: 35,
    stackable: false
  },

  bone_bracelet: {
    id: 'bone_bracelet',
    name: '뼈 팔찌',
    description: '동물의 뼈로 만든 팔찌.',
    type: 'accessory',
    rarity: 'common',
    level: 7,
    baseStats: { attack: 5, lifesteal: 0.02 },
    value: 150,
    stackable: false
  },

  mana_bracelet: {
    id: 'mana_bracelet',
    name: '마나 팔찌',
    description: '마나를 저장할 수 있는 팔찌.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 16,
    baseStats: { mp: 80, mpRegen: 4 },
    value: 650,
    stackable: false
  },

  warrior_bracelet: {
    id: 'warrior_bracelet',
    name: '전사의 팔찌',
    description: '전투에 특화된 팔찌.',
    type: 'accessory',
    rarity: 'rare',
    level: 32,
    baseStats: { attack: 30, attackSpeed: 0.15, critRate: 0.1 },
    value: 2500,
    stackable: false
  },

  // === 특수 액세서리 ===
  lucky_charm: {
    id: 'lucky_charm',
    name: '행운의 부적',
    description: '행운을 가져다주는 부적.',
    type: 'accessory',
    rarity: 'rare',
    level: 20,
    baseStats: { luck: 20, dropRate: 0.2, goldFind: 0.2 },
    value: 1000,
    stackable: false
  },

  berserker_tattoo: {
    id: 'berserker_tattoo',
    name: '광전사의 문신',
    description: '피부에 새겨진 마법 문신.',
    type: 'accessory',
    rarity: 'epic',
    level: 35,
    baseStats: { attack: 40, berserkMode: true, damageReduction: -0.1 },
    value: 4500,
    stackable: false
  },

  scholar_monocle: {
    id: 'scholar_monocle',
    name: '학자의 모노클',
    description: '지식을 향상시키는 특수 렌즈.',
    type: 'accessory',
    rarity: 'rare',
    level: 24,
    baseStats: { mp: 100, experienceGain: 0.2, identifyItems: true },
    value: 1400,
    stackable: false
  },

  assassin_cloak_pin: {
    id: 'assassin_cloak_pin',
    name: '암살자의 망토핀',
    description: '그림자 속으로 사라질 수 있게 해주는 핀.',
    type: 'accessory',
    rarity: 'epic',
    level: 36,
    baseStats: { critRate: 0.25, stealth: 0.3, backstabDamage: 0.5 },
    value: 5000,
    stackable: false
  },

  crown_of_kings: {
    id: 'crown_of_kings',
    name: '왕의 왕관',
    description: '고대 왕국의 왕관.',
    type: 'accessory',
    rarity: 'legendary',
    level: 50,
    baseStats: { allStats: 40, leadership: true, auraEffect: 'royal' },
    value: 25000,
    stackable: false
  },

  dimensional_key: {
    id: 'dimensional_key',
    name: '차원의 열쇠',
    description: '다른 차원으로 통하는 문을 열 수 있는 열쇠.',
    type: 'accessory',
    rarity: 'legendary',
    level: 49,
    baseStats: { portalAccess: true, spaceTimeResistance: 0.5 },
    value: 22000,
    stackable: false
  },

  infinity_stone_holder: {
    id: 'infinity_stone_holder',
    name: '무한의 돌 홀더',
    description: '무한의 돌을 장착할 수 있는 특수 액세서리.',
    type: 'accessory',
    rarity: 'legendary',
    level: 50,
    baseStats: { socketSlots: 6, powerAmplification: 2.0 },
    value: 30000,
    stackable: false
  },

  // === 세트 액세서리 ===
  element_set_ring: {
    id: 'element_set_ring',
    name: '원소술사의 반지',
    description: '원소술사 세트의 반지. 세트 효과: 모든 원소 데미지 +20%',
    type: 'accessory',
    rarity: 'rare',
    level: 30,
    baseStats: { spellPower: 35, elementalAffinity: 0.1, setBonus: 'elementalist' },
    value: 2200,
    stackable: false
  },

  element_set_necklace: {
    id: 'element_set_necklace',
    name: '원소술사의 목걸이',
    description: '원소술사 세트의 목걸이. 세트 효과: 모든 원소 데미지 +20%',
    type: 'accessory',
    rarity: 'rare',
    level: 30,
    baseStats: { mp: 150, elementalResistance: 0.2, setBonus: 'elementalist' },
    value: 2500,
    stackable: false
  },

  thief_set_gloves_accessory: {
    id: 'thief_set_gloves_accessory',
    name: '도적의 장갑 장신구',
    description: '도적 세트의 장갑 장신구. 세트 효과: 회피율 +15%, 치명타율 +10%',
    type: 'accessory',
    rarity: 'rare',
    level: 28,
    baseStats: { dodge: 0.1, critRate: 0.15, stealChance: 0.1, setBonus: 'thief' },
    value: 2000,
    stackable: false
  }
}
