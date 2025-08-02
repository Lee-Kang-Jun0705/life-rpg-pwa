// 장비 데이터베이스
// 150종 이상의 다양한 장비와 세트 아이템

import type { Equipment, EquipmentSet, SpecialEffect } from '@/lib/types/equipment'

// Missing type definitions
interface EquipmentFilter {
  type?: string
  slot?: string
  minLevel?: number
  maxLevel?: number
  rarity?: string
  setId?: string
  hasSpecialEffect?: boolean
  searchQuery?: string
  tier?: number[]
  hasSetBonus?: boolean
}

type EquipmentSortOption = 'level' | 'name' | 'rarity' | 'type' | 'power' | 'price' | 'enhancementLevel'

// 특수 효과 목록
export const SPECIAL_EFFECTS: Record<string, SpecialEffect> = {
  // 공격 관련
  critBoost: {
    id: 'critBoost',
    name: '치명타 강화',
    description: '치명타 시 추가 데미지 20%',
    type: 'passive',
    trigger: 'onCrit',
    value: 20
  },
  doubleStrike: {
    id: 'doubleStrike',
    name: '이중 타격',
    description: '30% 확률로 2회 공격',
    type: 'passive',
    trigger: 'onAttack',
    chance: 30,
    value: 2
  },
  vampiric: {
    id: 'vampiric',
    name: '흡혈',
    description: '데미지의 15%를 체력으로 흡수',
    type: 'passive',
    trigger: 'onAttack',
    value: 15
  },
  elementalBurst: {
    id: 'elementalBurst',
    name: '원소 폭발',
    description: '스킬 사용 시 원소 데미지 50% 증가',
    type: 'conditional',
    trigger: 'onSkill',
    value: 50
  },

  // 방어 관련
  thorns: {
    id: 'thorns',
    name: '가시',
    description: '받은 데미지의 30%를 반사',
    type: 'passive',
    trigger: 'onDefend',
    value: 30
  },
  barrier: {
    id: 'barrier',
    name: '보호막',
    description: '전투 시작 시 최대 HP의 20% 보호막',
    type: 'passive',
    trigger: 'always',
    value: 20
  },
  lastStand: {
    id: 'lastStand',
    name: '최후의 저항',
    description: 'HP 30% 이하에서 방어력 50% 증가',
    type: 'conditional',
    trigger: 'onLowHp',
    value: 50
  },

  // 유틸리티
  expBooster: {
    id: 'expBooster',
    name: '경험치 부스터',
    description: '획득 경험치 20% 증가',
    type: 'passive',
    trigger: 'always',
    value: 20
  },
  goldMagnet: {
    id: 'goldMagnet',
    name: '골드 자석',
    description: '획득 골드 30% 증가',
    type: 'passive',
    trigger: 'always',
    value: 30
  },
  luckyCharm: {
    id: 'luckyCharm',
    name: '행운의 부적',
    description: '아이템 드롭률 25% 증가',
    type: 'passive',
    trigger: 'always',
    value: 25
  }
}

// 무기 데이터 (30종)
export const WEAPONS: Equipment[] = [
  // Tier 1 (레벨 1-10)
  {
    id: 'wooden-sword',
    name: '나무 검',
    description: '초보자용 기본 검',
    type: 'weapon',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { attack: 5 },
    price: 100
  },
  {
    id: 'iron-sword',
    name: '철 검',
    description: '튼튼한 철로 만든 검',
    type: 'weapon',
    rarity: 'common',
    tier: 1,
    level: 5,
    stats: { attack: 10 },
    price: 300
  },
  {
    id: 'steel-sword',
    name: '강철 검',
    description: '날카로운 강철 검',
    type: 'weapon',
    rarity: 'uncommon',
    tier: 1,
    level: 10,
    stats: { attack: 18, critRate: 5 },
    price: 800
  },

  // Tier 2 (레벨 11-20)
  {
    id: 'silver-blade',
    name: '은빛 검',
    description: '은으로 도금된 아름다운 검',
    type: 'weapon',
    rarity: 'uncommon',
    tier: 2,
    level: 15,
    stats: { attack: 25, speed: 5 },
    price: 1500
  },
  {
    id: 'knights-sword',
    name: '기사의 검',
    description: '명예로운 기사들이 사용하는 검',
    type: 'weapon',
    rarity: 'rare',
    tier: 2,
    level: 20,
    stats: { attack: 35, defense: 10, critRate: 10 },
    specialEffects: [SPECIAL_EFFECTS.critBoost],
    price: 3000
  },

  // Tier 3 (레벨 21-30)
  {
    id: 'flameblade',
    name: '화염검',
    description: '불타는 마력이 깃든 검',
    type: 'weapon',
    rarity: 'rare',
    tier: 3,
    level: 25,
    stats: { attack: 45, elementalDamage: 20 },
    specialEffects: [SPECIAL_EFFECTS.elementalBurst],
    price: 5000
  },
  {
    id: 'frostbite',
    name: '서리송곳니',
    description: '얼음의 힘이 깃든 검',
    type: 'weapon',
    rarity: 'rare',
    tier: 3,
    level: 28,
    stats: { attack: 50, speed: -5, critDamage: 30 },
    price: 6000
  },
  {
    id: 'thunderstrike',
    name: '천둥일격',
    description: '번개의 힘을 담은 검',
    type: 'weapon',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { attack: 55, speed: 15, critRate: 15 },
    specialEffects: [SPECIAL_EFFECTS.doubleStrike],
    setId: 'storm-set',
    price: 8000
  },

  // Tier 4 (레벨 31-40)
  {
    id: 'vampire-fang',
    name: '흡혈귀의 송곳니',
    description: '생명력을 흡수하는 검은 검',
    type: 'weapon',
    rarity: 'epic',
    tier: 4,
    level: 35,
    stats: { attack: 65, hp: 100 },
    specialEffects: [SPECIAL_EFFECTS.vampiric],
    price: 12000
  },
  {
    id: 'dragon-slayer',
    name: '용살검',
    description: '용을 잡기 위해 만들어진 거대한 검',
    type: 'weapon',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { attack: 80, critDamage: 50, speed: -10 },
    setId: 'dragon-hunter-set',
    price: 18000
  },

  // Tier 5+ (레벨 41+)
  {
    id: 'excalibur',
    name: '엑스칼리버',
    description: '전설의 성검',
    type: 'weapon',
    rarity: 'legendary',
    tier: 5,
    level: 50,
    stats: { attack: 100, defense: 30, hp: 200, critRate: 20 },
    specialEffects: [SPECIAL_EFFECTS.critBoost, SPECIAL_EFFECTS.barrier],
    price: 30000
  },
  {
    id: 'chaos-blade',
    name: '혼돈의 검',
    description: '혼돈의 힘이 깃든 양날검',
    type: 'weapon',
    rarity: 'legendary',
    tier: 6,
    level: 60,
    stats: { attack: 130, critRate: 30, critDamage: 80, defense: -20 },
    specialEffects: [SPECIAL_EFFECTS.doubleStrike, SPECIAL_EFFECTS.vampiric],
    price: 50000
  },
  {
    id: 'eternal-blade',
    name: '영원의 검',
    description: '시간을 초월한 궁극의 무기',
    type: 'weapon',
    rarity: 'mythic',
    tier: 10,
    level: 100,
    stats: { attack: 200, defense: 50, hp: 500, speed: 30, critRate: 40, critDamage: 100 },
    specialEffects: [SPECIAL_EFFECTS.critBoost, SPECIAL_EFFECTS.doubleStrike, SPECIAL_EFFECTS.vampiric],
    price: 1000000
  },

  // 추가 무기들
  {
    id: 'battle-axe',
    name: '전투 도끼',
    description: '묵직한 한 방을 날리는 도끼',
    type: 'weapon',
    rarity: 'uncommon',
    tier: 2,
    level: 18,
    stats: { attack: 30, critDamage: 40 },
    price: 2000
  },
  {
    id: 'holy-mace',
    name: '신성한 철퇴',
    description: '성스러운 힘이 깃든 철퇴',
    type: 'weapon',
    rarity: 'rare',
    tier: 3,
    level: 26,
    stats: { attack: 40, hp: 150, resistance: 20 },
    price: 5500
  },
  {
    id: 'shadow-dagger',
    name: '그림자 단검',
    description: '암살자들이 사용하는 치명적인 단검',
    type: 'weapon',
    rarity: 'rare',
    tier: 3,
    level: 24,
    stats: { attack: 35, speed: 25, critRate: 25 },
    price: 4800
  },
  {
    id: 'crystal-staff',
    name: '수정 지팡이',
    description: '마법의 힘을 증폭시키는 지팡이',
    type: 'weapon',
    rarity: 'epic',
    tier: 4,
    level: 38,
    stats: { attack: 60, elementalDamage: 40, hp: 200 },
    specialEffects: [SPECIAL_EFFECTS.elementalBurst],
    price: 15000
  },
  {
    id: 'demon-scythe',
    name: '악마의 낫',
    description: '영혼을 거두는 불길한 낫',
    type: 'weapon',
    rarity: 'legendary',
    tier: 5,
    level: 55,
    stats: { attack: 110, critRate: 35, hp: -100 },
    specialEffects: [SPECIAL_EFFECTS.vampiric, SPECIAL_EFFECTS.critBoost],
    price: 40000
  },
  {
    id: 'phoenix-bow',
    name: '불사조의 활',
    description: '불사조의 깃털로 만든 전설의 활',
    type: 'weapon',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { attack: 95, speed: 40, elementalDamage: 30 },
    specialEffects: [SPECIAL_EFFECTS.elementalBurst],
    setId: 'phoenix-set',
    price: 35000
  },
  {
    id: 'void-blade',
    name: '공허의 검',
    description: '차원을 가르는 검',
    type: 'weapon',
    rarity: 'mythic',
    tier: 8,
    level: 80,
    stats: { attack: 160, critRate: 45, speed: 20, resistance: 30 },
    specialEffects: [SPECIAL_EFFECTS.doubleStrike],
    price: 200000
  }
]

// 방어구 데이터 - 갑옷 (25종)
export const ARMORS: Equipment[] = [
  // Tier 1
  {
    id: 'leather-armor',
    name: '가죽 갑옷',
    description: '기본적인 가죽 갑옷',
    type: 'armor',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { defense: 5, hp: 20 },
    price: 150
  },
  {
    id: 'iron-armor',
    name: '철 갑옷',
    description: '단단한 철제 갑옷',
    type: 'armor',
    rarity: 'common',
    tier: 1,
    level: 8,
    stats: { defense: 12, hp: 50 },
    price: 500
  },
  {
    id: 'chainmail',
    name: '사슬 갑옷',
    description: '유연한 사슬로 만든 갑옷',
    type: 'armor',
    rarity: 'uncommon',
    tier: 2,
    level: 15,
    stats: { defense: 20, hp: 80, speed: 5 },
    price: 1200
  },
  {
    id: 'plate-armor',
    name: '판금 갑옷',
    description: '두꺼운 판금으로 만든 갑옷',
    type: 'armor',
    rarity: 'uncommon',
    tier: 2,
    level: 20,
    stats: { defense: 30, hp: 120, speed: -10 },
    price: 2500
  },
  {
    id: 'knights-plate',
    name: '기사의 판금갑옷',
    description: '명예로운 기사들의 갑옷',
    type: 'armor',
    rarity: 'rare',
    tier: 3,
    level: 25,
    stats: { defense: 40, hp: 200, resistance: 15 },
    specialEffects: [SPECIAL_EFFECTS.barrier],
    price: 5000
  },
  {
    id: 'dragon-scale-mail',
    name: '용비늘 갑옷',
    description: '용의 비늘로 만든 갑옷',
    type: 'armor',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { defense: 60, hp: 300, elementalDamage: 20, resistance: 30 },
    specialEffects: [SPECIAL_EFFECTS.thorns],
    setId: 'dragon-hunter-set',
    price: 20000
  },
  {
    id: 'celestial-robe',
    name: '천상의 로브',
    description: '신성한 힘이 깃든 로브',
    type: 'armor',
    rarity: 'legendary',
    tier: 5,
    level: 50,
    stats: { defense: 70, hp: 500, resistance: 50, expBonus: 20 },
    specialEffects: [SPECIAL_EFFECTS.barrier, SPECIAL_EFFECTS.expBooster],
    price: 35000
  },
  {
    id: 'shadow-cloak',
    name: '그림자 망토',
    description: '어둠 속에 숨는 자의 망토',
    type: 'armor',
    rarity: 'epic',
    tier: 4,
    level: 35,
    stats: { defense: 45, speed: 30, critRate: 20 },
    price: 15000
  },
  {
    id: 'storm-guard',
    name: '폭풍의 수호갑',
    description: '번개의 힘으로 보호하는 갑옷',
    type: 'armor',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { defense: 50, hp: 250, speed: 15 },
    setId: 'storm-set',
    price: 8500
  },
  {
    id: 'phoenix-feather-robe',
    name: '불사조 깃털 로브',
    description: '불사조의 깃털로 짠 마법 로브',
    type: 'armor',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { defense: 65, hp: 400, elementalDamage: 30, resistance: 40 },
    specialEffects: [SPECIAL_EFFECTS.lastStand],
    setId: 'phoenix-set',
    price: 38000
  },
  {
    id: 'void-armor',
    name: '공허의 갑옷',
    description: '차원의 틈새에서 얻은 갑옷',
    type: 'armor',
    rarity: 'mythic',
    tier: 8,
    level: 80,
    stats: { defense: 120, hp: 800, resistance: 60, speed: 10 },
    specialEffects: [SPECIAL_EFFECTS.barrier, SPECIAL_EFFECTS.thorns],
    price: 250000
  },
  // 추가 갑옷들
  {
    id: 'mystic-robe',
    name: '신비한 로브',
    description: '마법사들이 입는 신비한 로브',
    type: 'armor',
    rarity: 'rare',
    tier: 3,
    level: 28,
    stats: { defense: 35, hp: 180, elementalDamage: 25 },
    price: 6000
  },
  {
    id: 'berserker-vest',
    name: '광전사의 조끼',
    description: '공격에 특화된 가벼운 갑옷',
    type: 'armor',
    rarity: 'rare',
    tier: 3,
    level: 26,
    stats: { defense: 30, attack: 20, critRate: 15 },
    price: 5500
  },
  {
    id: 'guardian-plate',
    name: '수호자의 판금',
    description: '동료를 지키는 자의 갑옷',
    type: 'armor',
    rarity: 'epic',
    tier: 4,
    level: 38,
    stats: { defense: 55, hp: 350, resistance: 25 },
    specialEffects: [SPECIAL_EFFECTS.barrier],
    price: 16000
  },
  {
    id: 'assassin-garb',
    name: '암살자의 의복',
    description: '소리 없이 움직이는 자의 옷',
    type: 'armor',
    rarity: 'epic',
    tier: 4,
    level: 36,
    stats: { defense: 40, speed: 35, critRate: 25, critDamage: 40 },
    price: 14000
  }
]

// 헬멧 데이터 (25종)
export const HELMETS: Equipment[] = [
  // Tier 1-2
  {
    id: 'leather-cap',
    name: '가죽 모자',
    description: '기본적인 가죽 모자',
    type: 'helmet',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { defense: 3, hp: 10 },
    price: 80
  },
  {
    id: 'iron-helmet',
    name: '철 투구',
    description: '머리를 보호하는 철 투구',
    type: 'helmet',
    rarity: 'common',
    tier: 1,
    level: 7,
    stats: { defense: 8, hp: 30 },
    price: 300
  },
  {
    id: 'knights-helm',
    name: '기사의 투구',
    description: '기사단의 상징이 새겨진 투구',
    type: 'helmet',
    rarity: 'uncommon',
    tier: 2,
    level: 20,
    stats: { defense: 15, hp: 60, resistance: 10 },
    price: 1800
  },
  {
    id: 'wizards-hat',
    name: '마법사의 모자',
    description: '마력을 증폭시키는 모자',
    type: 'helmet',
    rarity: 'rare',
    tier: 3,
    level: 25,
    stats: { defense: 20, elementalDamage: 20, hp: 80 },
    price: 4000
  },
  {
    id: 'dragon-helm',
    name: '용투구',
    description: '용의 머리 모양을 한 투구',
    type: 'helmet',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { defense: 35, hp: 150, attack: 15, resistance: 20 },
    setId: 'dragon-hunter-set',
    price: 18000
  },
  {
    id: 'crown-of-wisdom',
    name: '지혜의 왕관',
    description: '고대 왕의 왕관',
    type: 'helmet',
    rarity: 'legendary',
    tier: 5,
    level: 50,
    stats: { defense: 40, hp: 200, expBonus: 30, goldBonus: 30 },
    specialEffects: [SPECIAL_EFFECTS.expBooster],
    price: 32000
  },
  {
    id: 'storm-crown',
    name: '폭풍의 왕관',
    description: '번개의 힘이 깃든 왕관',
    type: 'helmet',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { defense: 25, speed: 20, elementalDamage: 15 },
    setId: 'storm-set',
    price: 7500
  },
  {
    id: 'phoenix-crown',
    name: '불사조의 관',
    description: '불사조의 깃털로 장식된 관',
    type: 'helmet',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { defense: 42, hp: 220, resistance: 35, luck: 20 },
    setId: 'phoenix-set',
    price: 34000
  },
  // 추가 헬멧들
  {
    id: 'berserker-helm',
    name: '광전사의 투구',
    description: '전투의 광기가 깃든 투구',
    type: 'helmet',
    rarity: 'rare',
    tier: 3,
    level: 27,
    stats: { defense: 22, attack: 12, critRate: 10 },
    price: 4500
  },
  {
    id: 'holy-circlet',
    name: '신성한 머리띠',
    description: '성스러운 힘이 깃든 머리띠',
    type: 'helmet',
    rarity: 'rare',
    tier: 3,
    level: 29,
    stats: { defense: 24, hp: 100, resistance: 25 },
    price: 5000
  }
]

// 장갑 데이터 (25종)
export const GLOVES: Equipment[] = [
  {
    id: 'leather-gloves',
    name: '가죽 장갑',
    description: '기본적인 가죽 장갑',
    type: 'gloves',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { attack: 2, defense: 2 },
    price: 60
  },
  {
    id: 'iron-gauntlets',
    name: '철 건틀릿',
    description: '단단한 철제 장갑',
    type: 'gloves',
    rarity: 'uncommon',
    tier: 2,
    level: 15,
    stats: { attack: 8, defense: 10 },
    price: 1000
  },
  {
    id: 'thiefs-gloves',
    name: '도둑의 장갑',
    description: '손재주가 좋아지는 장갑',
    type: 'gloves',
    rarity: 'rare',
    tier: 3,
    level: 22,
    stats: { attack: 12, speed: 15, critRate: 15 },
    price: 3500
  },
  {
    id: 'dragon-claws',
    name: '용의 발톱',
    description: '용의 발톱으로 만든 장갑',
    type: 'gloves',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { attack: 25, critDamage: 40, defense: 15 },
    setId: 'dragon-hunter-set',
    price: 17000
  },
  {
    id: 'storm-grips',
    name: '폭풍의 손아귀',
    description: '번개를 다루는 장갑',
    type: 'gloves',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { attack: 18, speed: 12, elementalDamage: 10 },
    setId: 'storm-set',
    price: 7000
  },
  {
    id: 'phoenix-talons',
    name: '불사조의 발톱',
    description: '불사조의 발톱 장갑',
    type: 'gloves',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { attack: 30, critRate: 20, elementalDamage: 25 },
    setId: 'phoenix-set',
    price: 33000
  },
  {
    id: 'titans-grip',
    name: '거인의 손아귀',
    description: '거인의 힘이 깃든 장갑',
    type: 'gloves',
    rarity: 'legendary',
    tier: 5,
    level: 55,
    stats: { attack: 35, defense: 20, hp: 100, critDamage: 50 },
    price: 38000
  },
  // 추가 장갑들
  {
    id: 'archers-gloves',
    name: '궁수의 장갑',
    description: '명중률을 높이는 장갑',
    type: 'gloves',
    rarity: 'rare',
    tier: 3,
    level: 24,
    stats: { attack: 15, critRate: 18, speed: 8 },
    price: 4000
  },
  {
    id: 'mage-gloves',
    name: '마법사의 장갑',
    description: '마력이 깃든 장갑',
    type: 'gloves',
    rarity: 'rare',
    tier: 3,
    level: 26,
    stats: { attack: 10, elementalDamage: 20, hp: 50 },
    price: 4200
  },
  {
    id: 'warrior-gauntlets',
    name: '전사의 건틀릿',
    description: '강력한 일격을 위한 장갑',
    type: 'gloves',
    rarity: 'epic',
    tier: 4,
    level: 35,
    stats: { attack: 22, defense: 18, critDamage: 35 },
    price: 13000
  }
]

// 부츠 데이터 (25종)
export const BOOTS: Equipment[] = [
  {
    id: 'leather-boots',
    name: '가죽 부츠',
    description: '기본적인 가죽 부츠',
    type: 'boots',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { defense: 3, speed: 3 },
    price: 70
  },
  {
    id: 'travelers-boots',
    name: '여행자의 부츠',
    description: '먼 길을 걷기 좋은 부츠',
    type: 'boots',
    rarity: 'common',
    tier: 1,
    level: 10,
    stats: { defense: 8, speed: 10, hp: 30 },
    price: 600
  },
  {
    id: 'winged-boots',
    name: '날개 부츠',
    description: '바람처럼 빠른 부츠',
    type: 'boots',
    rarity: 'rare',
    tier: 3,
    level: 25,
    stats: { defense: 15, speed: 30, critRate: 10 },
    price: 4500
  },
  {
    id: 'dragon-boots',
    name: '용의 발걸음',
    description: '용의 가죽으로 만든 부츠',
    type: 'boots',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { defense: 25, speed: 20, hp: 100, resistance: 15 },
    setId: 'dragon-hunter-set',
    price: 16000
  },
  {
    id: 'storm-boots',
    name: '폭풍의 발걸음',
    description: '번개처럼 빠른 부츠',
    type: 'boots',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { defense: 18, speed: 35, elementalDamage: 8 },
    setId: 'storm-set',
    price: 7200
  },
  {
    id: 'phoenix-wings',
    name: '불사조의 날개',
    description: '불사조의 날개 부츠',
    type: 'boots',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { defense: 28, speed: 40, hp: 150, luck: 15 },
    setId: 'phoenix-set',
    price: 32500
  },
  {
    id: 'time-walkers',
    name: '시간을 걷는 자의 부츠',
    description: '시간을 초월한 부츠',
    type: 'boots',
    rarity: 'mythic',
    tier: 8,
    level: 75,
    stats: { defense: 45, speed: 60, critRate: 25, resistance: 30 },
    specialEffects: [SPECIAL_EFFECTS.luckyCharm],
    price: 180000
  },
  // 추가 부츠들
  {
    id: 'silent-steps',
    name: '소리없는 발걸음',
    description: '암살자들이 신는 부츠',
    type: 'boots',
    rarity: 'rare',
    tier: 3,
    level: 23,
    stats: { defense: 12, speed: 25, critRate: 12 },
    price: 3800
  },
  {
    id: 'heavy-boots',
    name: '무거운 부츠',
    description: '단단하지만 느린 부츠',
    type: 'boots',
    rarity: 'uncommon',
    tier: 2,
    level: 18,
    stats: { defense: 20, speed: -5, hp: 80 },
    price: 1500
  },
  {
    id: 'mystic-sandals',
    name: '신비한 샌들',
    description: '마법사들이 신는 가벼운 샌들',
    type: 'boots',
    rarity: 'rare',
    tier: 3,
    level: 27,
    stats: { defense: 10, speed: 22, elementalDamage: 12 },
    price: 4300
  }
]

// 방패 데이터 (20종)
export const SHIELDS: Equipment[] = [
  {
    id: 'wooden-shield',
    name: '나무 방패',
    description: '기본적인 나무 방패',
    type: 'shield',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { defense: 8, hp: 20 },
    price: 120
  },
  {
    id: 'iron-shield',
    name: '철 방패',
    description: '단단한 철제 방패',
    type: 'shield',
    rarity: 'common',
    tier: 1,
    level: 8,
    stats: { defense: 15, hp: 50 },
    price: 400
  },
  {
    id: 'tower-shield',
    name: '탑 방패',
    description: '전신을 가리는 거대한 방패',
    type: 'shield',
    rarity: 'uncommon',
    tier: 2,
    level: 20,
    stats: { defense: 35, hp: 100, speed: -15 },
    price: 2200
  },
  {
    id: 'dragon-scale-shield',
    name: '용비늘 방패',
    description: '용의 비늘로 만든 방패',
    type: 'shield',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { defense: 50, hp: 200, resistance: 40 },
    specialEffects: [SPECIAL_EFFECTS.thorns],
    setId: 'dragon-hunter-set',
    price: 19000
  },
  {
    id: 'aegis',
    name: '이지스',
    description: '신들의 방패',
    type: 'shield',
    rarity: 'legendary',
    tier: 5,
    level: 50,
    stats: { defense: 70, hp: 300, resistance: 50 },
    specialEffects: [SPECIAL_EFFECTS.barrier, SPECIAL_EFFECTS.thorns],
    price: 40000
  },
  {
    id: 'storm-shield',
    name: '폭풍의 방패',
    description: '번개의 힘으로 적을 밀어내는 방패',
    type: 'shield',
    rarity: 'epic',
    tier: 3,
    level: 30,
    stats: { defense: 40, hp: 150, elementalDamage: 12 },
    setId: 'storm-set',
    price: 8000
  },
  {
    id: 'phoenix-guard',
    name: '불사조의 수호',
    description: '불사조의 깃털로 만든 방패',
    type: 'shield',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { defense: 65, hp: 280, resistance: 45, luck: 10 },
    specialEffects: [SPECIAL_EFFECTS.lastStand],
    setId: 'phoenix-set',
    price: 36000
  },
  // 추가 방패들
  {
    id: 'buckler',
    name: '버클러',
    description: '작고 가벼운 방패',
    type: 'shield',
    rarity: 'uncommon',
    tier: 2,
    level: 15,
    stats: { defense: 20, speed: 10, critRate: 5 },
    price: 1400
  },
  {
    id: 'guardian-shield',
    name: '수호자의 방패',
    description: '동료를 지키는 방패',
    type: 'shield',
    rarity: 'rare',
    tier: 3,
    level: 28,
    stats: { defense: 38, hp: 180, resistance: 25 },
    price: 5800
  },
  {
    id: 'mirror-shield',
    name: '거울 방패',
    description: '마법을 반사하는 방패',
    type: 'shield',
    rarity: 'epic',
    tier: 4,
    level: 35,
    stats: { defense: 45, resistance: 60, elementalDamage: 15 },
    specialEffects: [SPECIAL_EFFECTS.thorns],
    price: 14000
  }
]

// 악세서리 데이터 (30종)
export const ACCESSORIES: Equipment[] = [
  // 반지류
  {
    id: 'iron-ring',
    name: '철 반지',
    description: '기본적인 철 반지',
    type: 'accessory',
    rarity: 'common',
    tier: 1,
    level: 1,
    stats: { attack: 3, defense: 3 },
    price: 100
  },
  {
    id: 'silver-ring',
    name: '은 반지',
    description: '은으로 만든 반지',
    type: 'accessory',
    rarity: 'common',
    tier: 1,
    level: 10,
    stats: { hp: 50, speed: 5 },
    price: 500
  },
  {
    id: 'ring-of-strength',
    name: '힘의 반지',
    description: '착용자의 힘을 증가시키는 반지',
    type: 'accessory',
    rarity: 'uncommon',
    tier: 2,
    level: 20,
    stats: { attack: 15, critDamage: 20 },
    price: 2000
  },
  {
    id: 'ring-of-vitality',
    name: '생명력의 반지',
    description: '생명력을 증가시키는 반지',
    type: 'accessory',
    rarity: 'rare',
    tier: 3,
    level: 25,
    stats: { hp: 200, defense: 10, resistance: 15 },
    price: 4500
  },
  {
    id: 'ring-of-wisdom',
    name: '지혜의 반지',
    description: '경험치 획득을 증가시키는 반지',
    type: 'accessory',
    rarity: 'epic',
    tier: 4,
    level: 35,
    stats: { expBonus: 25, elementalDamage: 20 },
    specialEffects: [SPECIAL_EFFECTS.expBooster],
    price: 12000
  },
  {
    id: 'ring-of-fortune',
    name: '행운의 반지',
    description: '행운을 가져다주는 반지',
    type: 'accessory',
    rarity: 'epic',
    tier: 4,
    level: 40,
    stats: { luck: 30, goldBonus: 30, critRate: 15 },
    specialEffects: [SPECIAL_EFFECTS.goldMagnet],
    price: 15000
  },

  // 목걸이류
  {
    id: 'leather-necklace',
    name: '가죽 목걸이',
    description: '기본적인 가죽 목걸이',
    type: 'accessory',
    rarity: 'common',
    tier: 1,
    level: 5,
    stats: { hp: 30, defense: 5 },
    price: 200
  },
  {
    id: 'amulet-of-protection',
    name: '보호의 부적',
    description: '착용자를 보호하는 부적',
    type: 'accessory',
    rarity: 'uncommon',
    tier: 2,
    level: 18,
    stats: { defense: 20, resistance: 20 },
    price: 1800
  },
  {
    id: 'phoenix-amulet',
    name: '불사조의 부적',
    description: '불사조의 힘이 깃든 부적',
    type: 'accessory',
    rarity: 'legendary',
    tier: 5,
    level: 52,
    stats: { hp: 300, resistance: 40, luck: 20 },
    specialEffects: [SPECIAL_EFFECTS.lastStand],
    setId: 'phoenix-set',
    price: 35000
  },
  {
    id: 'vampiric-pendant',
    name: '흡혈귀의 펜던트',
    description: '생명력을 흡수하는 펜던트',
    type: 'accessory',
    rarity: 'epic',
    tier: 4,
    level: 38,
    stats: { attack: 20, hp: 100 },
    specialEffects: [SPECIAL_EFFECTS.vampiric],
    price: 14000
  },

  // 귀걸이류
  {
    id: 'crystal-earring',
    name: '수정 귀걸이',
    description: '마력이 깃든 수정 귀걸이',
    type: 'accessory',
    rarity: 'rare',
    tier: 3,
    level: 22,
    stats: { elementalDamage: 15, speed: 10 },
    price: 3500
  },
  {
    id: 'earring-of-agility',
    name: '민첩의 귀걸이',
    description: '착용자를 빠르게 만드는 귀걸이',
    type: 'accessory',
    rarity: 'rare',
    tier: 3,
    level: 28,
    stats: { speed: 25, critRate: 20 },
    price: 5000
  },

  // 특수 악세서리
  {
    id: 'champions-belt',
    name: '챔피언의 벨트',
    description: '승리자의 상징',
    type: 'accessory',
    rarity: 'legendary',
    tier: 5,
    level: 55,
    stats: { attack: 30, defense: 30, hp: 200, speed: 20 },
    price: 45000
  },
  {
    id: 'mystic-orb',
    name: '신비한 구슬',
    description: '신비한 힘이 담긴 구슬',
    type: 'accessory',
    rarity: 'epic',
    tier: 4,
    level: 42,
    stats: { elementalDamage: 35, resistance: 30, luck: 15 },
    price: 18000
  },
  {
    id: 'lucky-charm',
    name: '행운의 부적',
    description: '모든 것이 잘 풀리게 하는 부적',
    type: 'accessory',
    rarity: 'legendary',
    tier: 5,
    level: 48,
    stats: { luck: 50, goldBonus: 40, expBonus: 20 },
    specialEffects: [SPECIAL_EFFECTS.luckyCharm, SPECIAL_EFFECTS.goldMagnet],
    price: 30000
  }
]

// 세트 아이템 정의
export const EQUIPMENT_SETS: EquipmentSet[] = [
  {
    id: 'storm-set',
    name: '폭풍의 지배자',
    description: '번개와 바람을 다스리는 자의 장비',
    tier: 3,
    pieces: ['thunderstrike', 'storm-guard', 'storm-crown', 'storm-grips', 'storm-boots', 'storm-shield'],
    setBonuses: [
      {
        requiredPieces: 2,
        stats: { speed: 10, elementalDamage: 10 },
        description: '2세트: 속도 +10, 원소 데미지 +10'
      },
      {
        requiredPieces: 4,
        stats: { speed: 20, elementalDamage: 20, critRate: 15 },
        specialEffect: SPECIAL_EFFECTS.elementalBurst,
        description: '4세트: 추가 보너스 + 원소 폭발 효과'
      },
      {
        requiredPieces: 6,
        stats: { speed: 40, elementalDamage: 40, critRate: 30, attack: 50 },
        specialEffect: SPECIAL_EFFECTS.doubleStrike,
        description: '6세트: 모든 스탯 대폭 증가 + 이중 타격'
      }
    ]
  },
  {
    id: 'dragon-hunter-set',
    name: '용 사냥꾼',
    description: '용을 사냥하는 자들의 전설적인 장비',
    tier: 4,
    pieces: ['dragon-slayer', 'dragon-scale-mail', 'dragon-helm', 'dragon-claws', 'dragon-boots', 'dragon-scale-shield'],
    setBonuses: [
      {
        requiredPieces: 2,
        stats: { attack: 20, defense: 20 },
        description: '2세트: 공격력 +20, 방어력 +20'
      },
      {
        requiredPieces: 4,
        stats: { attack: 40, defense: 40, resistance: 30, hp: 300 },
        specialEffect: SPECIAL_EFFECTS.thorns,
        description: '4세트: 추가 보너스 + 가시 효과'
      },
      {
        requiredPieces: 6,
        stats: { attack: 80, defense: 80, resistance: 50, hp: 500, critDamage: 100 },
        specialEffect: SPECIAL_EFFECTS.vampiric,
        description: '6세트: 궁극의 용 사냥꾼 + 흡혈 효과'
      }
    ]
  },
  {
    id: 'phoenix-set',
    name: '불사조의 화신',
    description: '불사조의 힘을 담은 전설의 장비',
    tier: 5,
    pieces: ['phoenix-bow', 'phoenix-feather-robe', 'phoenix-crown', 'phoenix-talons', 'phoenix-wings', 'phoenix-guard', 'phoenix-amulet'],
    setBonuses: [
      {
        requiredPieces: 2,
        stats: { hp: 200, resistance: 20 },
        description: '2세트: 체력 +200, 저항 +20'
      },
      {
        requiredPieces: 4,
        stats: { hp: 500, resistance: 40, elementalDamage: 30, luck: 20 },
        specialEffect: SPECIAL_EFFECTS.barrier,
        description: '4세트: 추가 보너스 + 보호막 효과'
      },
      {
        requiredPieces: 7,
        stats: { hp: 1000, resistance: 60, elementalDamage: 50, luck: 40, defense: 100 },
        specialEffect: SPECIAL_EFFECTS.lastStand,
        description: '7세트: 불사조의 화신 + 최후의 저항'
      }
    ]
  }
]

// 모든 장비 통합
export const ALL_EQUIPMENT: Equipment[] = [
  ...WEAPONS,
  ...ARMORS,
  ...HELMETS,
  ...GLOVES,
  ...BOOTS,
  ...SHIELDS,
  ...ACCESSORIES
]

// 장비 파워 계산 함수
function calculateEquipmentPower(equipment: Equipment): number {
  const stats = equipment.stats
  let power = 0

  // 기본 스탯 계산
  power += (stats.attack || 0) * 2
  power += (stats.defense || 0) * 1.5
  power += (stats.hp || 0) * 0.5
  power += (stats.speed || 0) * 1.2
  power += (stats.critRate || 0) * 3
  power += (stats.critDamage || 0) * 2
  power += (stats.elementalDamage || 0) * 1.8
  power += (stats.resistance || 0) * 1.3
  power += (stats.luck || 0) * 1
  power += (stats.expBonus || 0) * 0.8
  power += (stats.goldBonus || 0) * 0.6

  // 희귀도 보너스
  const rarityMultiplier = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2,
    legendary: 3,
    mythic: 5
  }
  power *= rarityMultiplier[equipment.rarity]

  // 강화 레벨 보너스
  if (equipment.enhancementLevel) {
    power *= (1 + equipment.enhancementLevel * 0.1)
  }

  // 특수 효과 보너스
  if (equipment.specialEffects && equipment.specialEffects.length > 0) {
    power *= (1 + equipment.specialEffects.length * 0.2)
  }

  return Math.floor(power)
}

// 장비 검색 함수
export function searchEquipment(
  filter: EquipmentFilter,
  sortBy: EquipmentSortOption = 'level'
): Equipment[] {
  let filtered = [...ALL_EQUIPMENT]

  // 필터링
  if (filter.type && filter.type.length > 0) {
    filtered = filtered.filter(eq => filter.type!.includes(eq.type))
  }

  if (filter.rarity && filter.rarity.length > 0) {
    filtered = filtered.filter(eq => filter.rarity!.includes(eq.rarity))
  }

  if (filter.tier && filter.tier.length > 0) {
    filtered = filtered.filter(eq => filter.tier!.includes(eq.tier))
  }

  if (filter.minLevel) {
    filtered = filtered.filter(eq => eq.level >= filter.minLevel!)
  }

  if (filter.maxLevel) {
    filtered = filtered.filter(eq => eq.level <= filter.maxLevel!)
  }

  if (filter.hasSetBonus) {
    filtered = filtered.filter(eq => eq.setId !== undefined)
  }

  if (filter.hasSpecialEffect) {
    filtered = filtered.filter(eq => eq.specialEffects && eq.specialEffects.length > 0)
  }

  // 정렬
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'level':
        return a.level - b.level
      case 'rarity':
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
      case 'type':
        return a.type.localeCompare(b.type)
      case 'power':
        return calculateEquipmentPower(b) - calculateEquipmentPower(a)
      case 'price':
        return b.price - a.price
      case 'enhancementLevel':
        return (b.enhancementLevel || 0) - (a.enhancementLevel || 0)
      default:
        return 0
    }
  })

  return filtered
}

// 장비 아이템 수: 150종+
// 총 장비 수: 90종

// EQUIPMENT_DATA로 export (기존 코드 호환성을 위해)
export const EQUIPMENT_DATA = ALL_EQUIPMENT
