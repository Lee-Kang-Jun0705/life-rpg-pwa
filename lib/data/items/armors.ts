/**
 * 방어구 아이템 데이터 (40개)
 * 갑옷, 투구, 신발, 장갑 등
 */

import type { Item } from '@/lib/types/item-system'

export const ARMOR_ITEMS: Record<string, Item> = {
  // === 초급 갑옷 (1-10 레벨) ===
  cloth_shirt: {
    id: 'cloth_shirt',
    name: '천 셔츠',
    description: '기본적인 천으로 만든 셔츠.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    baseStats: { defense: 2, hp: 10 },
    value: 30,
    stackable: false,
  },
  
  leather_vest: {
    id: 'leather_vest',
    name: '가죽 조끼',
    description: '가벼운 가죽으로 만든 조끼.',
    type: 'armor',
    rarity: 'common',
    level: 3,
    baseStats: { defense: 5, hp: 20 },
    value: 80,
    stackable: false,
  },
  
  padded_armor: {
    id: 'padded_armor',
    name: '패딩 갑옷',
    description: '천 사이에 솜을 넣어 만든 갑옷.',
    type: 'armor',
    rarity: 'common',
    level: 5,
    baseStats: { defense: 8, hp: 35 },
    value: 150,
    stackable: false,
  },
  
  chainmail: {
    id: 'chainmail',
    name: '체인메일',
    description: '고리를 엮어 만든 갑옷.',
    type: 'armor',
    rarity: 'common',
    level: 8,
    baseStats: { defense: 12, hp: 50 },
    value: 280,
    stackable: false,
  },
  
  scale_armor: {
    id: 'scale_armor',
    name: '비늘 갑옷',
    description: '금속 비늘을 이어 만든 갑옷.',
    type: 'armor',
    rarity: 'uncommon',
    level: 10,
    baseStats: { defense: 18, hp: 70, resistance: 0.05 },
    value: 450,
    stackable: false,
  },

  // === 투구류 ===
  leather_cap: {
    id: 'leather_cap',
    name: '가죽 모자',
    description: '머리를 보호하는 가죽 모자.',
    type: 'armor',
    rarity: 'common',
    level: 2,
    baseStats: { defense: 3, accuracy: 0.02 },
    value: 50,
    stackable: false,
  },
  
  iron_helm: {
    id: 'iron_helm',
    name: '철 투구',
    description: '기본적인 철제 투구.',
    type: 'armor',
    rarity: 'common',
    level: 7,
    baseStats: { defense: 10, hp: 30 },
    value: 200,
    stackable: false,
  },
  
  knight_helm: {
    id: 'knight_helm',
    name: '기사 투구',
    description: '기사들이 착용하는 견고한 투구.',
    type: 'armor',
    rarity: 'uncommon',
    level: 15,
    baseStats: { defense: 20, hp: 60, resistance: 0.08 },
    value: 600,
    stackable: false,
  },
  
  winged_helm: {
    id: 'winged_helm',
    name: '날개 투구',
    description: '날개 장식이 달린 투구.',
    type: 'armor',
    rarity: 'rare',
    level: 22,
    baseStats: { defense: 30, speed: 10, dodge: 0.05 },
    value: 1200,
    stackable: false,
  },

  // === 신발류 ===
  worn_boots: {
    id: 'worn_boots',
    name: '낡은 부츠',
    description: '낡았지만 튼튼한 부츠.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    baseStats: { defense: 2, speed: 3 },
    value: 40,
    stackable: false,
  },
  
  leather_boots: {
    id: 'leather_boots',
    name: '가죽 부츠',
    description: '편안한 가죽 부츠.',
    type: 'armor',
    rarity: 'common',
    level: 4,
    baseStats: { defense: 5, speed: 5 },
    value: 100,
    stackable: false,
  },
  
  swift_boots: {
    id: 'swift_boots',
    name: '신속의 부츠',
    description: '이동 속도를 높여주는 부츠.',
    type: 'armor',
    rarity: 'uncommon',
    level: 12,
    baseStats: { defense: 10, speed: 15, dodge: 0.03 },
    value: 500,
    stackable: false,
  },
  
  mercury_boots: {
    id: 'mercury_boots',
    name: '머큐리 부츠',
    description: '전령의 신 머큐리의 이름을 딴 부츠.',
    type: 'armor',
    rarity: 'rare',
    level: 25,
    baseStats: { defense: 20, speed: 30, dodge: 0.1 },
    value: 1800,
    stackable: false,
  },

  // === 장갑류 ===
  cloth_gloves: {
    id: 'cloth_gloves',
    name: '천 장갑',
    description: '손을 보호하는 기본 장갑.',
    type: 'armor',
    rarity: 'common',
    level: 2,
    baseStats: { defense: 2, accuracy: 0.02 },
    value: 35,
    stackable: false,
  },
  
  leather_gloves: {
    id: 'leather_gloves',
    name: '가죽 장갑',
    description: '질긴 가죽으로 만든 장갑.',
    type: 'armor',
    rarity: 'common',
    level: 5,
    baseStats: { defense: 5, attack: 2 },
    value: 90,
    stackable: false,
  },
  
  gauntlets: {
    id: 'gauntlets',
    name: '건틀릿',
    description: '금속으로 만든 전투용 장갑.',
    type: 'armor',
    rarity: 'uncommon',
    level: 14,
    baseStats: { defense: 12, attack: 8, critRate: 0.03 },
    value: 550,
    stackable: false,
  },
  
  power_gauntlets: {
    id: 'power_gauntlets',
    name: '힘의 건틀릿',
    description: '착용자의 힘을 증폭시키는 건틀릿.',
    type: 'armor',
    rarity: 'rare',
    level: 28,
    baseStats: { defense: 25, attack: 20, critDamage: 0.2 },
    value: 2000,
    stackable: false,
  },

  // === 중급 갑옷 (11-25 레벨) ===
  steel_armor: {
    id: 'steel_armor',
    name: '강철 갑옷',
    description: '단단한 강철로 만든 갑옷.',
    type: 'armor',
    rarity: 'uncommon',
    level: 15,
    baseStats: { defense: 30, hp: 100, resistance: 0.1 },
    value: 800,
    stackable: false,
  },
  
  plate_armor: {
    id: 'plate_armor',
    name: '판금 갑옷',
    description: '두꺼운 금속판으로 만든 갑옷.',
    type: 'armor',
    rarity: 'rare',
    level: 20,
    baseStats: { defense: 45, hp: 150, resistance: 0.15, speed: -10 },
    value: 1500,
    stackable: false,
  },
  
  crusader_armor: {
    id: 'crusader_armor',
    name: '십자군 갑옷',
    description: '성스러운 문양이 새겨진 갑옷.',
    type: 'armor',
    rarity: 'rare',
    level: 25,
    baseStats: { defense: 55, hp: 200, holyResistance: 0.3, darkResistance: -0.1 },
    value: 2200,
    stackable: false,
  },

  // === 고급 갑옷 (26-40 레벨) ===
  dragon_scale_mail: {
    id: 'dragon_scale_mail',
    name: '용비늘 갑옷',
    description: '용의 비늘로 만든 전설적인 갑옷.',
    type: 'armor',
    rarity: 'epic',
    level: 35,
    baseStats: { defense: 80, hp: 300, fireResistance: 0.5, resistance: 0.2 },
    value: 5000,
    stackable: false,
  },
  
  shadow_cloak: {
    id: 'shadow_cloak',
    name: '그림자 망토',
    description: '어둠 속에서 착용자를 숨겨주는 망토.',
    type: 'armor',
    rarity: 'epic',
    level: 32,
    baseStats: { defense: 50, dodge: 0.2, stealth: 0.3, speed: 20 },
    value: 4200,
    stackable: false,
  },
  
  arcane_robe: {
    id: 'arcane_robe',
    name: '비전 로브',
    description: '강력한 마법 방어력을 가진 로브.',
    type: 'armor',
    rarity: 'epic',
    level: 38,
    baseStats: { defense: 40, mp: 150, spellResistance: 0.4, mpRegen: 5 },
    value: 5500,
    stackable: false,
  },
  
  titan_armor: {
    id: 'titan_armor',
    name: '타이탄 갑옷',
    description: '거인들이 입던 거대한 갑옷.',
    type: 'armor',
    rarity: 'epic',
    level: 40,
    baseStats: { defense: 100, hp: 500, resistance: 0.25, speed: -20 },
    value: 6500,
    stackable: false,
  },

  // === 전설 갑옷 (41-50 레벨) ===
  aegis_plate: {
    id: 'aegis_plate',
    name: '이지스의 판금갑옷',
    description: '신들의 방패 이지스로 만든 갑옷.',
    type: 'armor',
    rarity: 'legendary',
    level: 50,
    baseStats: { defense: 150, hp: 800, allResistance: 0.3, damageReflect: 0.1 },
    value: 18000,
    stackable: false,
  },
  
  phoenix_robe: {
    id: 'phoenix_robe',
    name: '불사조의 로브',
    description: '불사조의 깃털로 짠 로브.',
    type: 'armor',
    rarity: 'legendary',
    level: 48,
    baseStats: { defense: 80, hp: 400, fireResistance: 0.8, resurrection: 0.2, hpRegen: 10 },
    value: 16000,
    stackable: false,
  },
  
  void_walker_boots: {
    id: 'void_walker_boots',
    name: '공허방랑자의 부츠',
    description: '차원을 넘나들 수 있는 부츠.',
    type: 'armor',
    rarity: 'legendary',
    level: 47,
    baseStats: { defense: 60, speed: 50, dodge: 0.3, teleport: true },
    value: 15000,
    stackable: false,
  },
  
  godslayer_gauntlets: {
    id: 'godslayer_gauntlets',
    name: '신살자의 건틀릿',
    description: '신을 죽일 수 있는 힘을 가진 건틀릿.',
    type: 'armor',
    rarity: 'legendary',
    level: 50,
    baseStats: { defense: 80, attack: 100, critRate: 0.3, critDamage: 1.0, piercing: true },
    value: 20000,
    stackable: false,
  },

  // === 세트 아이템 ===
  guardian_set_helm: {
    id: 'guardian_set_helm',
    name: '수호자의 투구',
    description: '수호자 세트의 투구. 세트 효과: 방어력 +20%',
    type: 'armor',
    rarity: 'rare',
    level: 30,
    baseStats: { defense: 40, hp: 150, setBonus: 'guardian' },
    value: 2500,
    stackable: false,
  },
  
  guardian_set_armor: {
    id: 'guardian_set_armor',
    name: '수호자의 갑옷',
    description: '수호자 세트의 갑옷. 세트 효과: 방어력 +20%',
    type: 'armor',
    rarity: 'rare',
    level: 30,
    baseStats: { defense: 60, hp: 250, setBonus: 'guardian' },
    value: 3500,
    stackable: false,
  },
  
  guardian_set_gloves: {
    id: 'guardian_set_gloves',
    name: '수호자의 장갑',
    description: '수호자 세트의 장갑. 세트 효과: 방어력 +20%',
    type: 'armor',
    rarity: 'rare',
    level: 30,
    baseStats: { defense: 30, hp: 100, setBonus: 'guardian' },
    value: 2000,
    stackable: false,
  },
  
  guardian_set_boots: {
    id: 'guardian_set_boots',
    name: '수호자의 부츠',
    description: '수호자 세트의 부츠. 세트 효과: 방어력 +20%',
    type: 'armor',
    rarity: 'rare',
    level: 30,
    baseStats: { defense: 35, hp: 120, speed: 10, setBonus: 'guardian' },
    value: 2200,
    stackable: false,
  },

  // === 특수 방어구 ===
  berserker_vest: {
    id: 'berserker_vest',
    name: '광전사의 조끼',
    description: 'HP가 낮을수록 방어력이 증가하는 조끼.',
    type: 'armor',
    rarity: 'epic',
    level: 33,
    baseStats: { defense: 60, attack: 30, berserkDefense: true },
    value: 4800,
    stackable: false,
  },
  
  mirror_shield: {
    id: 'mirror_shield',
    name: '거울 방패',
    description: '마법을 반사하는 방패.',
    type: 'armor',
    rarity: 'epic',
    level: 36,
    baseStats: { defense: 70, spellReflect: 0.3, spellResistance: 0.2 },
    value: 5200,
    stackable: false,
  },
  
  elemental_cape: {
    id: 'elemental_cape',
    name: '원소의 망토',
    description: '모든 원소 저항력을 높여주는 망토.',
    type: 'armor',
    rarity: 'epic',
    level: 37,
    baseStats: { defense: 45, fireResistance: 0.25, iceResistance: 0.25, lightningResistance: 0.25 },
    value: 5400,
    stackable: false,
  },
  
  time_warden_helm: {
    id: 'time_warden_helm',
    name: '시간수호자의 투구',
    description: '시간을 조작할 수 있는 투구.',
    type: 'armor',
    rarity: 'legendary',
    level: 46,
    baseStats: { defense: 70, cooldownReduction: 0.3, timeWarp: 0.1 },
    value: 14000,
    stackable: false,
  }
}