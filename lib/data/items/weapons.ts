/**
 * 무기 아이템 데이터 (40개)
 * 레벨별, 희귀도별로 구성
 */

import type { Item } from '@/lib/types/item-system'

export const WEAPON_ITEMS: Record<string, Item> = {
  // === 초급 무기 (1-10 레벨) ===
  // 검류
  rusty_sword: {
    id: 'rusty_sword',
    name: '녹슨 검',
    description: '오래되어 녹이 슨 검. 그래도 쓸만하다.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    baseStats: { attack: 5 },
    value: 50,
    stackable: false
  },

  wooden_sword: {
    id: 'wooden_sword',
    name: '나무 검',
    description: '훈련용 나무 검. 가볍고 다루기 쉽다.',
    type: 'weapon',
    rarity: 'common',
    level: 2,
    baseStats: { attack: 7, speed: 2 },
    value: 80,
    stackable: false
  },

  bronze_sword: {
    id: 'bronze_sword',
    name: '청동 검',
    description: '청동으로 만든 기본적인 검.',
    type: 'weapon',
    rarity: 'common',
    level: 5,
    baseStats: { attack: 12 },
    value: 150,
    stackable: false
  },

  iron_sword: {
    id: 'iron_sword',
    name: '철검',
    description: '단단한 철로 만든 검.',
    type: 'weapon',
    rarity: 'common',
    level: 8,
    baseStats: { attack: 18 },
    value: 250,
    stackable: false
  },

  fine_steel_sword: {
    id: 'fine_steel_sword',
    name: '정제된 강철검',
    description: '잘 정제된 강철로 만든 날카로운 검.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 10,
    baseStats: { attack: 25, critRate: 0.05 },
    value: 400,
    stackable: false
  },

  // 도끼류
  stone_axe: {
    id: 'stone_axe',
    name: '돌도끼',
    description: '원시적이지만 강력한 돌도끼.',
    type: 'weapon',
    rarity: 'common',
    level: 3,
    baseStats: { attack: 9, critDamage: 0.1 },
    value: 100,
    stackable: false
  },

  lumberjack_axe: {
    id: 'lumberjack_axe',
    name: '벌목용 도끼',
    description: '나무를 베는 데 사용하던 도끼. 전투에도 쓸만하다.',
    type: 'weapon',
    rarity: 'common',
    level: 6,
    baseStats: { attack: 15, critDamage: 0.15 },
    value: 180,
    stackable: false
  },

  battle_axe: {
    id: 'battle_axe',
    name: '전투 도끼',
    description: '전투를 위해 특별히 제작된 도끼.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 12,
    baseStats: { attack: 30, critDamage: 0.2 },
    value: 500,
    stackable: false
  },

  // 창류
  wooden_spear: {
    id: 'wooden_spear',
    name: '나무 창',
    description: '끝을 뾰족하게 깎은 나무 창.',
    type: 'weapon',
    rarity: 'common',
    level: 2,
    baseStats: { attack: 6, accuracy: 0.05 },
    value: 70,
    stackable: false
  },

  hunting_spear: {
    id: 'hunting_spear',
    name: '사냥용 창',
    description: '동물을 사냥하는 데 사용하는 창.',
    type: 'weapon',
    rarity: 'common',
    level: 7,
    baseStats: { attack: 16, accuracy: 0.1 },
    value: 200,
    stackable: false
  },

  pike: {
    id: 'pike',
    name: '파이크',
    description: '긴 자루에 날카로운 창날이 달린 무기.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 15,
    baseStats: { attack: 35, accuracy: 0.15, speed: -5 },
    value: 600,
    stackable: false
  },

  // 지팡이류 (마법사용)
  wooden_staff: {
    id: 'wooden_staff',
    name: '나무 지팡이',
    description: '마법사들이 사용하는 기본적인 지팡이.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    baseStats: { attack: 3, mp: 10 },
    value: 60,
    stackable: false
  },

  apprentice_staff: {
    id: 'apprentice_staff',
    name: '견습생의 지팡이',
    description: '마법 견습생들이 사용하는 지팡이.',
    type: 'weapon',
    rarity: 'common',
    level: 5,
    baseStats: { attack: 8, mp: 20 },
    value: 160,
    stackable: false
  },

  crystal_staff: {
    id: 'crystal_staff',
    name: '수정 지팡이',
    description: '끝에 마력 수정이 달린 지팡이.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 10,
    baseStats: { attack: 15, mp: 35, mpRegen: 2 },
    value: 450,
    stackable: false
  },

  // === 중급 무기 (11-25 레벨) ===
  steel_blade: {
    id: 'steel_blade',
    name: '강철 검',
    description: '숙련된 대장장이가 만든 강철 검.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 15,
    baseStats: { attack: 40, critRate: 0.08 },
    value: 800,
    stackable: false
  },

  knights_sword: {
    id: 'knights_sword',
    name: '기사의 검',
    description: '기사단에서 사용하는 정식 검.',
    type: 'weapon',
    rarity: 'rare',
    level: 20,
    baseStats: { attack: 55, defense: 10, critRate: 0.1 },
    value: 1500,
    stackable: false
  },

  dual_blades: {
    id: 'dual_blades',
    name: '쌍검',
    description: '양손에 하나씩 드는 한 쌍의 검.',
    type: 'weapon',
    rarity: 'rare',
    level: 22,
    baseStats: { attack: 50, speed: 15, critRate: 0.15 },
    value: 1800,
    stackable: false
  },

  executioner_axe: {
    id: 'executioner_axe',
    name: '처형자의 도끼',
    description: '무시무시한 크기의 양손 도끼.',
    type: 'weapon',
    rarity: 'rare',
    level: 25,
    baseStats: { attack: 70, critDamage: 0.5, speed: -10 },
    value: 2000,
    stackable: false
  },

  war_hammer: {
    id: 'war_hammer',
    name: '전쟁 망치',
    description: '갑옷도 부술 수 있는 무거운 망치.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 18,
    baseStats: { attack: 45, armorPenetration: 20 },
    value: 1000,
    stackable: false
  },

  // === 고급 무기 (26-40 레벨) ===
  mithril_sword: {
    id: 'mithril_sword',
    name: '미스릴 검',
    description: '전설의 금속 미스릴로 만든 검.',
    type: 'weapon',
    rarity: 'epic',
    level: 30,
    baseStats: { attack: 80, speed: 20, critRate: 0.15 },
    value: 3500,
    stackable: false
  },

  flame_sword: {
    id: 'flame_sword',
    name: '화염검',
    description: '불꽃이 타오르는 마법 검.',
    type: 'weapon',
    rarity: 'epic',
    level: 35,
    baseStats: { attack: 90, fireDamage: 30 },
    value: 4500,
    stackable: false
  },

  frost_blade: {
    id: 'frost_blade',
    name: '서리 검',
    description: '차가운 냉기가 흐르는 검.',
    type: 'weapon',
    rarity: 'epic',
    level: 35,
    baseStats: { attack: 85, iceDamage: 35, slowChance: 0.2 },
    value: 4500,
    stackable: false
  },

  thunder_spear: {
    id: 'thunder_spear',
    name: '뇌전창',
    description: '번개의 힘이 깃든 창.',
    type: 'weapon',
    rarity: 'epic',
    level: 38,
    baseStats: { attack: 95, lightningDamage: 40, accuracy: 0.2 },
    value: 5000,
    stackable: false
  },

  archmage_staff: {
    id: 'archmage_staff',
    name: '대마법사의 지팡이',
    description: '강력한 마력이 응축된 지팡이.',
    type: 'weapon',
    rarity: 'epic',
    level: 40,
    baseStats: { attack: 50, mp: 100, mpRegen: 10, spellPower: 50 },
    value: 6000,
    stackable: false
  },

  // === 전설 무기 (41-50 레벨) ===
  excalibur: {
    id: 'excalibur',
    name: '엑스칼리버',
    description: '전설의 성검.',
    type: 'weapon',
    rarity: 'legendary',
    level: 50,
    baseStats: { attack: 150, defense: 30, hp: 100, critRate: 0.25, holyDamage: 50 },
    value: 15000,
    stackable: false
  },

  ragnarok: {
    id: 'ragnarok',
    name: '라그나로크',
    description: '세계를 멸망시킬 수 있는 파괴의 검.',
    type: 'weapon',
    rarity: 'legendary',
    level: 50,
    baseStats: { attack: 180, critDamage: 1.0, darkDamage: 60 },
    value: 18000,
    stackable: false
  },

  mjolnir: {
    id: 'mjolnir',
    name: '묠니르',
    description: '천둥신의 망치.',
    type: 'weapon',
    rarity: 'legendary',
    level: 48,
    baseStats: { attack: 160, lightningDamage: 80, stunChance: 0.3 },
    value: 16000,
    stackable: false
  },

  gungnir: {
    id: 'gungnir',
    name: '궁니르',
    description: '반드시 목표를 관통하는 신의 창.',
    type: 'weapon',
    rarity: 'legendary',
    level: 49,
    baseStats: { attack: 170, accuracy: 0.5, critRate: 0.3, piercing: true },
    value: 17000,
    stackable: false
  },

  staff_of_eternity: {
    id: 'staff_of_eternity',
    name: '영원의 지팡이',
    description: '무한한 마력이 흐르는 지팡이.',
    type: 'weapon',
    rarity: 'legendary',
    level: 50,
    baseStats: { attack: 80, mp: 200, mpRegen: 25, spellPower: 100, cooldownReduction: 0.3 },
    value: 20000,
    stackable: false
  },

  // === 특수 무기 ===
  assassin_dagger: {
    id: 'assassin_dagger',
    name: '암살자의 단검',
    description: '소리 없이 적을 처치하는 단검.',
    type: 'weapon',
    rarity: 'rare',
    level: 25,
    baseStats: { attack: 45, speed: 30, critRate: 0.3, critDamage: 0.5 },
    value: 2200,
    stackable: false
  },

  berserker_axe: {
    id: 'berserker_axe',
    name: '광전사의 도끼',
    description: 'HP가 낮을수록 강해지는 도끼.',
    type: 'weapon',
    rarity: 'epic',
    level: 35,
    baseStats: { attack: 100, lifesteal: 0.15, berserkBonus: true },
    value: 5500,
    stackable: false
  },

  soul_reaper: {
    id: 'soul_reaper',
    name: '영혼 수확자',
    description: '적의 영혼을 거두는 낫.',
    type: 'weapon',
    rarity: 'epic',
    level: 40,
    baseStats: { attack: 110, lifesteal: 0.2, soulHarvest: 0.1 },
    value: 7000,
    stackable: false
  },

  void_blade: {
    id: 'void_blade',
    name: '공허의 검',
    description: '차원을 가르는 검.',
    type: 'weapon',
    rarity: 'legendary',
    level: 45,
    baseStats: { attack: 140, voidDamage: 50, ignoreDefense: 0.3 },
    value: 12000,
    stackable: false
  },

  phoenix_staff: {
    id: 'phoenix_staff',
    name: '불사조의 지팡이',
    description: '죽음에서 되살아나는 힘을 가진 지팡이.',
    type: 'weapon',
    rarity: 'legendary',
    level: 47,
    baseStats: { attack: 70, mp: 150, spellPower: 80, resurrection: 0.1 },
    value: 14000,
    stackable: false
  },

  // 활/석궁류
  hunting_bow: {
    id: 'hunting_bow',
    name: '사냥활',
    description: '사냥에 사용되는 기본적인 활.',
    type: 'weapon',
    rarity: 'common',
    level: 4,
    baseStats: { attack: 8, accuracy: 0.1, range: 10 },
    value: 120,
    stackable: false
  },

  longbow: {
    id: 'longbow',
    name: '장궁',
    description: '멀리까지 화살을 날릴 수 있는 긴 활.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 12,
    baseStats: { attack: 28, accuracy: 0.15, range: 15 },
    value: 550,
    stackable: false
  },

  elven_bow: {
    id: 'elven_bow',
    name: '엘프의 활',
    description: '엘프들이 사용하는 정교한 활.',
    type: 'weapon',
    rarity: 'rare',
    level: 28,
    baseStats: { attack: 65, accuracy: 0.25, critRate: 0.2, range: 20 },
    value: 3000,
    stackable: false
  },

  windforce: {
    id: 'windforce',
    name: '윈드포스',
    description: '바람의 힘으로 화살을 날리는 전설의 활.',
    type: 'weapon',
    rarity: 'legendary',
    level: 46,
    baseStats: { attack: 130, speed: 40, knockback: 0.5, multishot: 2 },
    value: 13000,
    stackable: false
  },

  repeating_crossbow: {
    id: 'repeating_crossbow',
    name: '연발 석궁',
    description: '연속으로 화살을 발사할 수 있는 석궁.',
    type: 'weapon',
    rarity: 'rare',
    level: 24,
    baseStats: { attack: 40, attackSpeed: 0.5, accuracy: 0.2 },
    value: 2400,
    stackable: false
  }
}
