import type {
  ItemRarity
} from '@/lib/types/inventory'

// Define custom types for this database
interface Equipment {
  id: string
  name: string
  description: string
  type: 'equipment'
  equipmentType: 'weapon' | 'armor' | 'accessory'
  slot: string
  weaponType?: string
  armorType?: string
  accessoryType?: string
  rarity: ItemRarity
  level: number
  stats: {
    attack?: number
    defense?: number
    hp?: number
    critical?: number
    dodge?: number
    speed?: number
    accuracy?: number
    magicAttack?: number
    magicDefense?: number
    [key: string]: number | undefined // Allow any other stat properties
  }
  requirements?: {
    level?: number
    stat?: string
    value?: number
    stats?: { [key: string]: number }
  }
  value: number
  stackable: boolean
  tradeable: boolean
  setId?: string
  specialEffect?: {
    type: string
    value: number
    description: string
  }
  effects?: Array<{
    type: string
    element?: string
    value?: number
    [key: string]: unknown
  }>
}

interface Consumable {
  id: string
  name: string
  description: string
  type: 'consumable'
  consumableType: string
  rarity: ItemRarity
  value: number
  stackable: boolean
  maxStack?: number
  tradeable: boolean
  effect?: {
    type: string
    value: number
    duration?: number
  }
  effects?: Array<{
    type: string
    value?: number
    duration?: number
    [key: string]: unknown
  }>
  cooldown?: number
  level?: number
}

interface Material {
  id: string
  name: string
  description: string
  type: 'material'
  materialType: string
  category?: string
  rarity: ItemRarity
  value: number
  stackable: boolean
  maxStack?: number
  tradeable: boolean
  tier?: number
  level?: number
}

interface MiscItem {
  id: string
  name: string
  description: string
  type: 'misc'
  miscType: string
  rarity: ItemRarity
  value: number
  stackable: boolean
  maxStack?: number
  tradeable: boolean
  questItem?: boolean
  level?: number
  questId?: string
  usable?: boolean
}

type Item = Equipment | Consumable | Material | MiscItem

// 세트 보너스 타입 정의
interface SetBonusLevel {
  piecesRequired: number
  stats?: {
    [key: string]: number
  }
  effects?: Array<{
    type: string
    [key: string]: unknown
  }>
}

interface SetBonus {
  id: string
  name: string
  requiredPieces: number
  pieces: string[]
  bonuses: SetBonusLevel[]
}

// 아이템 데이터베이스 (200종)

// === 무기 (50종) ===
export const WEAPONS: { [id: string]: Equipment } = {
  // 초보자 무기 (레벨 1-10)
  wooden_sword: {
    id: 'wooden_sword',
    name: '나무 검',
    description: '초보자용 나무로 만든 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'common',
    level: 1,
    stats: {
      attack: 5
    },
    requirements: {
      level: 1
    },
    value: 10,
    stackable: false,
    tradeable: true
  },

  iron_sword: {
    id: 'iron_sword',
    name: '철 검',
    description: '기본적인 철제 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'common',
    level: 5,
    stats: {
      attack: 12,
      critical: 0.02
    },
    requirements: {
      level: 5
    },
    value: 50,
    stackable: false,
    tradeable: true
  },

  steel_sword: {
    id: 'steel_sword',
    name: '강철 검',
    description: '단단한 강철로 제작된 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'uncommon',
    level: 10,
    stats: {
      attack: 20,
      critical: 0.05,
      accuracy: 5
    },
    requirements: {
      level: 10
    },
    value: 150,
    stackable: false,
    tradeable: true
  },

  fire_blade: {
    id: 'fire_blade',
    name: '화염검',
    description: '불타는 마법이 깃든 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'rare',
    level: 15,
    stats: {
      attack: 30,
      magicAttack: 15,
      critical: 0.08
    },
    requirements: {
      level: 15
    },
    value: 500,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'element_damage',
      element: 'fire',
      value: 10
    }]
  },

  frost_blade: {
    id: 'frost_blade',
    name: '서리검',
    description: '얼음의 힘이 깃든 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'rare',
    level: 15,
    stats: {
      attack: 28,
      magicAttack: 18,
      speed: -2
    },
    requirements: {
      level: 15
    },
    value: 500,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'element_damage',
      element: 'ice',
      value: 10
    }, {
      type: 'status_chance',
      status: 'slow',
      chance: 0.15
    }]
  },

  thunder_sword: {
    id: 'thunder_sword',
    name: '뇌전검',
    description: '번개의 힘을 담은 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'rare',
    level: 20,
    stats: {
      attack: 35,
      speed: 5,
      critical: 0.1
    },
    requirements: {
      level: 20
    },
    value: 800,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'element_damage',
      element: 'electric',
      value: 15
    }]
  },

  dragon_slayer: {
    id: 'dragon_slayer',
    name: '용살검',
    description: '용을 잡기 위해 만들어진 거대한 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'epic',
    level: 30,
    stats: {
      attack: 60,
      critical: 0.15,
      criticalDamage: 0.5
    },
    requirements: {
      level: 30,
      stats: { health: 20 }
    },
    value: 2000,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'bonus_damage',
      target: 'dragon',
      value: 50
    }]
  },

  holy_sword: {
    id: 'holy_sword',
    name: '성검',
    description: '신성한 힘이 깃든 전설의 검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'legendary',
    level: 40,
    stats: {
      attack: 80,
      magicAttack: 40,
      critical: 0.2,
      hp: 100
    },
    requirements: {
      level: 40
    },
    value: 5000,
    stackable: false,
    tradeable: false,
    effects: [{
      type: 'element_damage',
      element: 'light',
      value: 30
    }, {
      type: 'healing_boost',
      value: 0.2
    }]
  },

  // 도끼류
  wooden_axe: {
    id: 'wooden_axe',
    name: '나무 도끼',
    description: '나무꾼이 사용하던 도끼',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'axe',
    rarity: 'common',
    level: 1,
    stats: {
      attack: 7,
      speed: -2
    },
    requirements: {
      level: 1
    },
    value: 15,
    stackable: false,
    tradeable: true
  },

  battle_axe: {
    id: 'battle_axe',
    name: '전투 도끼',
    description: '전투용으로 개조된 도끼',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'axe',
    rarity: 'uncommon',
    level: 12,
    stats: {
      attack: 25,
      critical: 0.1,
      speed: -3
    },
    requirements: {
      level: 12,
      stats: { health: 10 }
    },
    value: 200,
    stackable: false,
    tradeable: true
  },

  berserker_axe: {
    id: 'berserker_axe',
    name: '광전사의 도끼',
    description: '광기가 깃든 양날 도끼',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'axe',
    rarity: 'epic',
    level: 25,
    stats: {
      attack: 55,
      critical: 0.25,
      defense: -10
    },
    requirements: {
      level: 25,
      stats: { health: 15 }
    },
    value: 1500,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'berserk',
      threshold: 0.3,
      bonusAttack: 30
    }]
  },

  // 활류
  wooden_bow: {
    id: 'wooden_bow',
    name: '나무 활',
    description: '사냥용 기본 활',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'bow',
    rarity: 'common',
    level: 1,
    stats: {
      attack: 6,
      accuracy: 10
    },
    requirements: {
      level: 1
    },
    value: 12,
    stackable: false,
    tradeable: true
  },

  hunter_bow: {
    id: 'hunter_bow',
    name: '사냥꾼의 활',
    description: '정확도가 높은 사냥용 활',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'bow',
    rarity: 'uncommon',
    level: 8,
    stats: {
      attack: 18,
      accuracy: 20,
      critical: 0.12
    },
    requirements: {
      level: 8
    },
    value: 120,
    stackable: false,
    tradeable: true
  },

  elven_bow: {
    id: 'elven_bow',
    name: '엘프의 활',
    description: '엘프의 기술로 만들어진 활',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'bow',
    rarity: 'rare',
    level: 18,
    stats: {
      attack: 32,
      accuracy: 30,
      critical: 0.18,
      speed: 8
    },
    requirements: {
      level: 18
    },
    value: 700,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'multi_shot',
      chance: 0.2,
      shots: 2
    }]
  },

  // 지팡이류
  wooden_staff: {
    id: 'wooden_staff',
    name: '나무 지팡이',
    description: '견습 마법사의 지팡이',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'staff',
    rarity: 'common',
    level: 1,
    stats: {
      magicAttack: 8,
      mp: 20
    },
    requirements: {
      level: 1
    },
    value: 15,
    stackable: false,
    tradeable: true
  },

  crystal_staff: {
    id: 'crystal_staff',
    name: '수정 지팡이',
    description: '마력이 깃든 수정 지팡이',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'staff',
    rarity: 'uncommon',
    level: 10,
    stats: {
      magicAttack: 22,
      mp: 50,
      mpRegen: 2
    },
    requirements: {
      level: 10,
      stats: { learning: 10 }
    },
    value: 180,
    stackable: false,
    tradeable: true
  },

  archmage_staff: {
    id: 'archmage_staff',
    name: '대마법사의 지팡이',
    description: '강력한 마력이 응축된 지팡이',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'staff',
    rarity: 'epic',
    level: 30,
    stats: {
      magicAttack: 65,
      mp: 150,
      mpRegen: 5,
      critical: 0.15
    },
    requirements: {
      level: 30,
      stats: { learning: 25 }
    },
    value: 2200,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'spell_power',
      value: 0.2
    }]
  },

  // 단검류
  iron_dagger: {
    id: 'iron_dagger',
    name: '철 단검',
    description: '날카로운 철제 단검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'dagger',
    rarity: 'common',
    level: 3,
    stats: {
      attack: 10,
      speed: 5,
      critical: 0.08
    },
    requirements: {
      level: 3
    },
    value: 30,
    stackable: false,
    tradeable: true
  },

  assassin_dagger: {
    id: 'assassin_dagger',
    name: '암살자의 단검',
    description: '치명타에 특화된 단검',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'dagger',
    rarity: 'rare',
    level: 22,
    stats: {
      attack: 38,
      speed: 12,
      critical: 0.3,
      criticalDamage: 0.5
    },
    requirements: {
      level: 22,
      stats: { achievement: 15 }
    },
    value: 900,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'backstab',
      damageBonus: 2.0
    }]
  },

  // 창류
  iron_spear: {
    id: 'iron_spear',
    name: '철 창',
    description: '긴 사정거리의 철제 창',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'spear',
    rarity: 'common',
    level: 6,
    stats: {
      attack: 15,
      accuracy: 15
    },
    requirements: {
      level: 6
    },
    value: 70,
    stackable: false,
    tradeable: true
  },

  dragon_lance: {
    id: 'dragon_lance',
    name: '용기사의 창',
    description: '용을 상대하기 위한 특수 창',
    type: 'equipment',
    equipmentType: 'weapon',
    slot: 'weapon',
    weaponType: 'spear',
    rarity: 'epic',
    level: 35,
    stats: {
      attack: 70,
      accuracy: 25,
      critical: 0.12
    },
    requirements: {
      level: 35,
      stats: { health: 20, achievement: 20 }
    },
    value: 2500,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'pierce',
      defenseIgnore: 0.3
    }, {
      type: 'bonus_damage',
      target: 'flying',
      value: 40
    }]
  }
}

// === 방어구 (50종) ===
export const ARMORS: { [id: string]: Equipment } = {
  // 헬멧
  leather_cap: {
    id: 'leather_cap',
    name: '가죽 모자',
    description: '기본적인 가죽 모자',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'head',
    armorType: 'light',
    rarity: 'common',
    level: 1,
    stats: {
      defense: 2,
      magicDefense: 1
    },
    requirements: {
      level: 1
    },
    value: 10,
    stackable: false,
    tradeable: true
  },

  iron_helmet: {
    id: 'iron_helmet',
    name: '철 투구',
    description: '머리를 보호하는 철제 투구',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'head',
    armorType: 'heavy',
    rarity: 'common',
    level: 8,
    stats: {
      defense: 8,
      magicDefense: 4,
      speed: -2
    },
    requirements: {
      level: 8
    },
    value: 100,
    stackable: false,
    tradeable: true
  },

  mage_hat: {
    id: 'mage_hat',
    name: '마법사의 모자',
    description: '마력을 증폭시키는 모자',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'head',
    armorType: 'cloth',
    rarity: 'uncommon',
    level: 12,
    stats: {
      defense: 4,
      magicDefense: 10,
      magicAttack: 8,
      mp: 30
    },
    requirements: {
      level: 12,
      stats: { learning: 10 }
    },
    value: 200,
    stackable: false,
    tradeable: true
  },

  dragon_helm: {
    id: 'dragon_helm',
    name: '드래곤 투구',
    description: '용의 비늘로 만든 투구',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'head',
    armorType: 'heavy',
    rarity: 'epic',
    level: 30,
    stats: {
      defense: 25,
      magicDefense: 20,
      hp: 50,
      fireResist: 20
    },
    requirements: {
      level: 30,
      stats: { health: 25 }
    },
    value: 1500,
    stackable: false,
    tradeable: true
  },

  // 갑옷
  cloth_shirt: {
    id: 'cloth_shirt',
    name: '천 셔츠',
    description: '가벼운 천으로 만든 셔츠',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'body',
    armorType: 'cloth',
    rarity: 'common',
    level: 1,
    stats: {
      defense: 3,
      magicDefense: 2
    },
    requirements: {
      level: 1
    },
    value: 15,
    stackable: false,
    tradeable: true
  },

  leather_armor: {
    id: 'leather_armor',
    name: '가죽 갑옷',
    description: '유연한 가죽 갑옷',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'body',
    armorType: 'light',
    rarity: 'common',
    level: 5,
    stats: {
      defense: 10,
      magicDefense: 6,
      evasion: 0.02
    },
    requirements: {
      level: 5
    },
    value: 60,
    stackable: false,
    tradeable: true
  },

  chain_mail: {
    id: 'chain_mail',
    name: '사슬 갑옷',
    description: '고리로 엮은 사슬 갑옷',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'body',
    armorType: 'medium',
    rarity: 'uncommon',
    level: 15,
    stats: {
      defense: 20,
      magicDefense: 12,
      speed: -3
    },
    requirements: {
      level: 15
    },
    value: 300,
    stackable: false,
    tradeable: true
  },

  plate_armor: {
    id: 'plate_armor',
    name: '판금 갑옷',
    description: '두꺼운 철판으로 만든 갑옷',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'body',
    armorType: 'heavy',
    rarity: 'rare',
    level: 25,
    stats: {
      defense: 40,
      magicDefense: 25,
      hp: 100,
      speed: -8
    },
    requirements: {
      level: 25,
      stats: { health: 20 }
    },
    value: 1000,
    stackable: false,
    tradeable: true
  },

  mystic_robe: {
    id: 'mystic_robe',
    name: '신비한 로브',
    description: '마법의 힘이 깃든 로브',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'body',
    armorType: 'cloth',
    rarity: 'rare',
    level: 20,
    stats: {
      defense: 12,
      magicDefense: 30,
      magicAttack: 15,
      mp: 80,
      mpRegen: 3
    },
    requirements: {
      level: 20,
      stats: { learning: 15 }
    },
    value: 800,
    stackable: false,
    tradeable: true
  },

  // 장갑
  leather_gloves: {
    id: 'leather_gloves',
    name: '가죽 장갑',
    description: '손을 보호하는 가죽 장갑',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'hands',
    armorType: 'light',
    rarity: 'common',
    level: 3,
    stats: {
      defense: 3,
      attack: 2
    },
    requirements: {
      level: 3
    },
    value: 20,
    stackable: false,
    tradeable: true
  },

  iron_gauntlets: {
    id: 'iron_gauntlets',
    name: '철 건틀릿',
    description: '무거운 철제 장갑',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'hands',
    armorType: 'heavy',
    rarity: 'uncommon',
    level: 12,
    stats: {
      defense: 10,
      attack: 5,
      speed: -2
    },
    requirements: {
      level: 12
    },
    value: 150,
    stackable: false,
    tradeable: true
  },

  // 신발
  leather_boots: {
    id: 'leather_boots',
    name: '가죽 부츠',
    description: '편안한 가죽 부츠',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'feet',
    armorType: 'light',
    rarity: 'common',
    level: 2,
    stats: {
      defense: 2,
      speed: 2
    },
    requirements: {
      level: 2
    },
    value: 15,
    stackable: false,
    tradeable: true
  },

  speed_boots: {
    id: 'speed_boots',
    name: '신속의 부츠',
    description: '이동 속도를 높여주는 부츠',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'feet',
    armorType: 'light',
    rarity: 'rare',
    level: 18,
    stats: {
      defense: 8,
      speed: 15,
      evasion: 0.05
    },
    requirements: {
      level: 18
    },
    value: 600,
    stackable: false,
    tradeable: true
  },

  // 방패
  wooden_shield: {
    id: 'wooden_shield',
    name: '나무 방패',
    description: '기본적인 나무 방패',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'shield',
    armorType: 'shield',
    rarity: 'common',
    level: 2,
    stats: {
      defense: 5,
      blockChance: 0.1
    },
    requirements: {
      level: 2
    },
    value: 20,
    stackable: false,
    tradeable: true
  },

  iron_shield: {
    id: 'iron_shield',
    name: '철 방패',
    description: '단단한 철제 방패',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'shield',
    armorType: 'shield',
    rarity: 'uncommon',
    level: 10,
    stats: {
      defense: 15,
      magicDefense: 8,
      blockChance: 0.15,
      speed: -3
    },
    requirements: {
      level: 10
    },
    value: 120,
    stackable: false,
    tradeable: true
  },

  guardian_shield: {
    id: 'guardian_shield',
    name: '수호자의 방패',
    description: '강력한 방어력을 자랑하는 방패',
    type: 'equipment',
    equipmentType: 'armor',
    slot: 'shield',
    armorType: 'shield',
    rarity: 'epic',
    level: 28,
    stats: {
      defense: 35,
      magicDefense: 25,
      hp: 80,
      blockChance: 0.25
    },
    requirements: {
      level: 28,
      stats: { health: 20 }
    },
    value: 1800,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'damage_reduction',
      value: 0.1
    }]
  }
}

// === 액세서리 (30종) ===
export const ACCESSORIES: { [id: string]: Equipment } = {
  // 반지
  copper_ring: {
    id: 'copper_ring',
    name: '구리 반지',
    description: '간단한 구리 반지',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'ring',
    accessoryType: 'ring',
    rarity: 'common',
    level: 1,
    stats: {
      hp: 10
    },
    requirements: {
      level: 1
    },
    value: 10,
    stackable: false,
    tradeable: true
  },

  silver_ring: {
    id: 'silver_ring',
    name: '은 반지',
    description: '반짝이는 은 반지',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'ring',
    accessoryType: 'ring',
    rarity: 'uncommon',
    level: 10,
    stats: {
      hp: 30,
      mp: 20
    },
    requirements: {
      level: 10
    },
    value: 100,
    stackable: false,
    tradeable: true
  },

  power_ring: {
    id: 'power_ring',
    name: '힘의 반지',
    description: '착용자의 힘을 증가시키는 반지',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'ring',
    accessoryType: 'ring',
    rarity: 'rare',
    level: 20,
    stats: {
      attack: 15,
      critical: 0.05
    },
    requirements: {
      level: 20
    },
    value: 500,
    stackable: false,
    tradeable: true
  },

  wisdom_ring: {
    id: 'wisdom_ring',
    name: '지혜의 반지',
    description: '마법의 힘을 증폭시키는 반지',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'ring',
    accessoryType: 'ring',
    rarity: 'rare',
    level: 20,
    stats: {
      magicAttack: 15,
      mp: 50,
      mpRegen: 2
    },
    requirements: {
      level: 20
    },
    value: 500,
    stackable: false,
    tradeable: true
  },

  // 목걸이
  leather_necklace: {
    id: 'leather_necklace',
    name: '가죽 목걸이',
    description: '부적이 달린 가죽 목걸이',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'necklace',
    accessoryType: 'necklace',
    rarity: 'common',
    level: 5,
    stats: {
      defense: 3,
      magicDefense: 3
    },
    requirements: {
      level: 5
    },
    value: 30,
    stackable: false,
    tradeable: true
  },

  crystal_necklace: {
    id: 'crystal_necklace',
    name: '수정 목걸이',
    description: '마력이 담긴 수정 목걸이',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'necklace',
    accessoryType: 'necklace',
    rarity: 'uncommon',
    level: 15,
    stats: {
      magicDefense: 12,
      mp: 40,
      allElementResist: 5
    },
    requirements: {
      level: 15
    },
    value: 250,
    stackable: false,
    tradeable: true
  },

  phoenix_feather_necklace: {
    id: 'phoenix_feather_necklace',
    name: '불사조 깃털 목걸이',
    description: '불사조의 깃털로 만든 목걸이',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'necklace',
    accessoryType: 'necklace',
    rarity: 'legendary',
    level: 40,
    stats: {
      hp: 200,
      hpRegen: 10,
      fireResist: 30
    },
    requirements: {
      level: 40
    },
    value: 3000,
    stackable: false,
    tradeable: false,
    effects: [{
      type: 'revival',
      chance: 0.1,
      hpRestore: 0.5
    }]
  },

  // 귀걸이
  mana_earring: {
    id: 'mana_earring',
    name: '마나 귀걸이',
    description: '마나를 증가시키는 귀걸이',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'earring',
    accessoryType: 'earring',
    rarity: 'uncommon',
    level: 12,
    stats: {
      mp: 60,
      mpRegen: 3
    },
    requirements: {
      level: 12
    },
    value: 180,
    stackable: false,
    tradeable: true
  },

  // 벨트
  leather_belt: {
    id: 'leather_belt',
    name: '가죽 벨트',
    description: '튼튼한 가죽 벨트',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'belt',
    accessoryType: 'belt',
    rarity: 'common',
    level: 8,
    stats: {
      defense: 5,
      inventorySlots: 5
    },
    requirements: {
      level: 8
    },
    value: 50,
    stackable: false,
    tradeable: true
  },

  warrior_belt: {
    id: 'warrior_belt',
    name: '전사의 벨트',
    description: '전투에 특화된 벨트',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'belt',
    accessoryType: 'belt',
    rarity: 'rare',
    level: 25,
    stats: {
      hp: 80,
      attack: 10,
      defense: 10
    },
    requirements: {
      level: 25,
      stats: { health: 15 }
    },
    value: 800,
    stackable: false,
    tradeable: true
  },

  champion_belt: {
    id: 'champion_belt',
    name: '챔피언 벨트',
    description: '최강자의 증표',
    type: 'equipment',
    equipmentType: 'accessory',
    slot: 'belt',
    accessoryType: 'belt',
    rarity: 'epic',
    level: 35,
    stats: {
      hp: 150,
      attack: 25,
      defense: 20,
      critical: 0.05
    },
    requirements: {
      level: 35,
      stats: { achievement: 30 }
    },
    value: 2000,
    stackable: false,
    tradeable: true
  }
}

// === 소비 아이템 (70종) ===
export const CONSUMABLES: { [id: string]: Consumable } = {
  // 회복 포션
  small_health_potion: {
    id: 'small_health_potion',
    name: '소형 체력 포션',
    description: 'HP를 50 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'common',
    level: 1,
    value: 10,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 50
    }]
  },

  health_potion: {
    id: 'health_potion',
    name: '체력 포션',
    description: 'HP를 150 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'common',
    level: 10,
    value: 30,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 150
    }]
  },

  large_health_potion: {
    id: 'large_health_potion',
    name: '대형 체력 포션',
    description: 'HP를 300 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 20,
    value: 80,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 300
    }]
  },

  mega_health_potion: {
    id: 'mega_health_potion',
    name: '메가 체력 포션',
    description: 'HP를 800 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 30,
    value: 200,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 800
    }]
  },

  small_mana_potion: {
    id: 'small_mana_potion',
    name: '소형 마나 포션',
    description: 'MP를 30 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'common',
    level: 1,
    value: 15,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'restore_mp',
      value: 30
    }]
  },

  mana_potion: {
    id: 'mana_potion',
    name: '마나 포션',
    description: 'MP를 80 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'common',
    level: 10,
    value: 40,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'restore_mp',
      value: 80
    }]
  },

  large_mana_potion: {
    id: 'large_mana_potion',
    name: '대형 마나 포션',
    description: 'MP를 150 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 20,
    value: 100,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'restore_mp',
      value: 150
    }]
  },

  rejuvenation_potion: {
    id: 'rejuvenation_potion',
    name: '회춘의 포션',
    description: 'HP와 MP를 모두 회복한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 25,
    value: 250,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 400
    }, {
      type: 'restore_mp',
      value: 200
    }]
  },

  // 버프 포션
  strength_potion: {
    id: 'strength_potion',
    name: '힘의 포션',
    description: '공격력을 일시적으로 증가시킨다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 15,
    value: 150,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'buff',
      stat: 'attack',
      value: 20,
      duration: 300
    }]
  },

  defense_potion: {
    id: 'defense_potion',
    name: '방어의 포션',
    description: '방어력을 일시적으로 증가시킨다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 15,
    value: 150,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'buff',
      stat: 'defense',
      value: 20,
      duration: 300
    }]
  },

  speed_potion: {
    id: 'speed_potion',
    name: '신속의 포션',
    description: '이동속도를 일시적으로 증가시킨다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 12,
    value: 120,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'buff',
      stat: 'speed',
      value: 15,
      duration: 300
    }]
  },

  critical_potion: {
    id: 'critical_potion',
    name: '치명타 포션',
    description: '치명타율을 일시적으로 증가시킨다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 20,
    value: 300,
    stackable: true,
    maxStack: 30,
    tradeable: true,
    effects: [{
      type: 'buff',
      stat: 'critical',
      value: 0.15,
      duration: 300
    }]
  },

  // 특수 포션
  antidote: {
    id: 'antidote',
    name: '해독제',
    description: '독 상태를 치료한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'common',
    level: 5,
    value: 25,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'cure',
      status: 'poison'
    }]
  },

  paralyze_cure: {
    id: 'paralyze_cure',
    name: '마비 치료제',
    description: '마비 상태를 치료한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 10,
    value: 50,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'cure',
      status: 'paralyzed'
    }]
  },

  panacea: {
    id: 'panacea',
    name: '만병통치약',
    description: '모든 상태이상을 치료한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 25,
    value: 500,
    stackable: true,
    maxStack: 30,
    tradeable: true,
    effects: [{
      type: 'cure_all'
    }]
  },

  invisibility_potion: {
    id: 'invisibility_potion',
    name: '투명 포션',
    description: '일시적으로 투명해진다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 22,
    value: 400,
    stackable: true,
    maxStack: 30,
    tradeable: true,
    effects: [{
      type: 'stealth',
      duration: 60
    }]
  },

  // 스크롤
  teleport_scroll: {
    id: 'teleport_scroll',
    name: '순간이동 스크롤',
    description: '마을로 순간이동한다',
    type: 'consumable',
    consumableType: 'scroll',
    rarity: 'uncommon',
    level: 10,
    value: 200,
    stackable: true,
    maxStack: 20,
    tradeable: true,
    effects: [{
      type: 'teleport',
      destination: 'town'
    }]
  },

  identify_scroll: {
    id: 'identify_scroll',
    name: '감정 스크롤',
    description: '미확인 아이템을 감정한다',
    type: 'consumable',
    consumableType: 'scroll',
    rarity: 'common',
    level: 5,
    value: 50,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'identify'
    }]
  },

  enchant_weapon_scroll: {
    id: 'enchant_weapon_scroll',
    name: '무기 강화 스크롤',
    description: '무기를 강화한다',
    type: 'consumable',
    consumableType: 'scroll',
    rarity: 'rare',
    level: 20,
    value: 1000,
    stackable: true,
    maxStack: 10,
    tradeable: true,
    effects: [{
      type: 'enchant',
      target: 'weapon',
      successRate: 0.6
    }]
  },

  enchant_armor_scroll: {
    id: 'enchant_armor_scroll',
    name: '방어구 강화 스크롤',
    description: '방어구를 강화한다',
    type: 'consumable',
    consumableType: 'scroll',
    rarity: 'rare',
    level: 20,
    value: 1000,
    stackable: true,
    maxStack: 10,
    tradeable: true,
    effects: [{
      type: 'enchant',
      target: 'armor',
      successRate: 0.6
    }]
  },

  blessed_enchant_scroll: {
    id: 'blessed_enchant_scroll',
    name: '축복받은 강화 스크롤',
    description: '100% 확률로 강화한다',
    type: 'consumable',
    consumableType: 'scroll',
    rarity: 'epic',
    level: 30,
    value: 5000,
    stackable: true,
    maxStack: 5,
    tradeable: true,
    effects: [{
      type: 'enchant',
      target: 'any',
      successRate: 1.0
    }]
  },

  // 음식
  bread: {
    id: 'bread',
    name: '빵',
    description: '기본적인 음식',
    type: 'consumable',
    consumableType: 'food',
    rarity: 'common',
    level: 1,
    value: 5,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 20
    }, {
      type: 'restore_stamina',
      value: 10
    }]
  },

  meat: {
    id: 'meat',
    name: '고기',
    description: '영양가 높은 음식',
    type: 'consumable',
    consumableType: 'food',
    rarity: 'common',
    level: 5,
    value: 15,
    stackable: true,
    maxStack: 99,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 50
    }, {
      type: 'restore_stamina',
      value: 20
    }]
  },

  cooked_meat: {
    id: 'cooked_meat',
    name: '구운 고기',
    description: '맛있게 구운 고기',
    type: 'consumable',
    consumableType: 'food',
    rarity: 'uncommon',
    level: 10,
    value: 40,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 100
    }, {
      type: 'restore_stamina',
      value: 40
    }, {
      type: 'buff',
      stat: 'hp_regen',
      value: 5,
      duration: 600
    }]
  },

  energy_bar: {
    id: 'energy_bar',
    name: '에너지 바',
    description: '빠르게 에너지를 보충한다',
    type: 'consumable',
    consumableType: 'food',
    rarity: 'uncommon',
    level: 15,
    value: 60,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'restore_stamina',
      value: 100
    }, {
      type: 'buff',
      stat: 'speed',
      value: 10,
      duration: 300
    }]
  },

  feast: {
    id: 'feast',
    name: '성찬',
    description: '호화로운 식사',
    type: 'consumable',
    consumableType: 'food',
    rarity: 'rare',
    level: 25,
    value: 300,
    stackable: true,
    maxStack: 20,
    tradeable: true,
    effects: [{
      type: 'heal',
      value: 300
    }, {
      type: 'restore_mp',
      value: 150
    }, {
      type: 'restore_stamina',
      value: 100
    }, {
      type: 'buff',
      stat: 'all_stats',
      value: 10,
      duration: 1800
    }]
  },

  // 폭탄류
  small_bomb: {
    id: 'small_bomb',
    name: '소형 폭탄',
    description: '작은 폭발을 일으킨다',
    type: 'consumable',
    consumableType: 'throwable',
    rarity: 'common',
    level: 8,
    value: 30,
    stackable: true,
    maxStack: 50,
    tradeable: true,
    effects: [{
      type: 'damage',
      value: 100,
      element: 'fire',
      aoe: true
    }]
  },

  large_bomb: {
    id: 'large_bomb',
    name: '대형 폭탄',
    description: '큰 폭발을 일으킨다',
    type: 'consumable',
    consumableType: 'throwable',
    rarity: 'uncommon',
    level: 18,
    value: 100,
    stackable: true,
    maxStack: 30,
    tradeable: true,
    effects: [{
      type: 'damage',
      value: 300,
      element: 'fire',
      aoe: true
    }]
  },

  ice_bomb: {
    id: 'ice_bomb',
    name: '얼음 폭탄',
    description: '얼음 폭발로 적을 둔화시킨다',
    type: 'consumable',
    consumableType: 'throwable',
    rarity: 'rare',
    level: 22,
    value: 200,
    stackable: true,
    maxStack: 20,
    tradeable: true,
    effects: [{
      type: 'damage',
      value: 200,
      element: 'ice',
      aoe: true
    }, {
      type: 'debuff',
      status: 'slow',
      duration: 5
    }]
  },

  smoke_bomb: {
    id: 'smoke_bomb',
    name: '연막탄',
    description: '연막을 생성한다',
    type: 'consumable',
    consumableType: 'throwable',
    rarity: 'uncommon',
    level: 15,
    value: 80,
    stackable: true,
    maxStack: 30,
    tradeable: true,
    effects: [{
      type: 'blind',
      aoe: true,
      duration: 10
    }]
  },

  // 부활 아이템
  resurrection_stone: {
    id: 'resurrection_stone',
    name: '부활석',
    description: '죽었을 때 자동으로 부활한다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'epic',
    level: 30,
    value: 2000,
    stackable: true,
    maxStack: 5,
    tradeable: true,
    effects: [{
      type: 'auto_revive',
      hp_restore: 0.5
    }]
  },

  phoenix_down: {
    id: 'phoenix_down',
    name: '불사조의 깃털',
    description: '동료를 부활시킨다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'rare',
    level: 25,
    value: 1000,
    stackable: true,
    maxStack: 10,
    tradeable: true,
    effects: [{
      type: 'revive_other',
      hp_restore: 0.3
    }]
  },

  // 경험치 부스터
  exp_potion_small: {
    id: 'exp_potion_small',
    name: '소형 경험치 포션',
    description: '경험치 획득량이 50% 증가한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'uncommon',
    level: 10,
    value: 300,
    stackable: true,
    maxStack: 20,
    tradeable: false,
    effects: [{
      type: 'exp_boost',
      value: 0.5,
      duration: 1800
    }]
  },

  exp_potion_large: {
    id: 'exp_potion_large',
    name: '대형 경험치 포션',
    description: '경험치 획득량이 100% 증가한다',
    type: 'consumable',
    consumableType: 'potion',
    rarity: 'rare',
    level: 20,
    value: 1000,
    stackable: true,
    maxStack: 10,
    tradeable: false,
    effects: [{
      type: 'exp_boost',
      value: 1.0,
      duration: 1800
    }]
  },

  // 특수 소비 아이템
  skill_reset_potion: {
    id: 'skill_reset_potion',
    name: '스킬 초기화 포션',
    description: '스킬 포인트를 초기화한다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'epic',
    level: 20,
    value: 5000,
    stackable: false,
    tradeable: false,
    effects: [{
      type: 'reset_skills'
    }]
  },

  stat_reset_potion: {
    id: 'stat_reset_potion',
    name: '스탯 초기화 포션',
    description: '스탯 포인트를 초기화한다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'epic',
    level: 20,
    value: 5000,
    stackable: false,
    tradeable: false,
    effects: [{
      type: 'reset_stats'
    }]
  },

  lucky_charm: {
    id: 'lucky_charm',
    name: '행운의 부적',
    description: '아이템 드롭율이 증가한다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'rare',
    level: 15,
    value: 800,
    stackable: true,
    maxStack: 10,
    tradeable: true,
    effects: [{
      type: 'drop_rate_boost',
      value: 0.3,
      duration: 3600
    }]
  },

  treasure_map: {
    id: 'treasure_map',
    name: '보물 지도',
    description: '숨겨진 보물의 위치를 표시한다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'rare',
    level: 20,
    value: 1500,
    stackable: false,
    tradeable: true,
    effects: [{
      type: 'reveal_treasure'
    }]
  },

  mystery_box: {
    id: 'mystery_box',
    name: '미스터리 박스',
    description: '무작위 아이템이 나온다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'rare',
    level: 15,
    value: 500,
    stackable: true,
    maxStack: 20,
    tradeable: true,
    effects: [{
      type: 'random_item',
      pool: 'rare'
    }]
  },

  golden_ticket: {
    id: 'golden_ticket',
    name: '황금 티켓',
    description: '특별한 던전에 입장할 수 있다',
    type: 'consumable',
    consumableType: 'special',
    rarity: 'legendary',
    level: 30,
    value: 10000,
    stackable: true,
    maxStack: 5,
    tradeable: false,
    effects: [{
      type: 'dungeon_access',
      dungeon: 'golden_vault'
    }]
  }
}

// === 재료 아이템 (50종) ===
export const MATERIALS: { [id: string]: Material } = {
  // 광석
  iron_ore: {
    id: 'iron_ore',
    name: '철광석',
    description: '기본적인 광석',
    type: 'material',
    materialType: 'ore',
    rarity: 'common',
    level: 1,
    value: 5,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  silver_ore: {
    id: 'silver_ore',
    name: '은광석',
    description: '반짝이는 은광석',
    type: 'material',
    materialType: 'ore',
    rarity: 'uncommon',
    level: 10,
    value: 20,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  gold_ore: {
    id: 'gold_ore',
    name: '금광석',
    description: '귀중한 금광석',
    type: 'material',
    materialType: 'ore',
    rarity: 'rare',
    level: 20,
    value: 100,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  mithril_ore: {
    id: 'mithril_ore',
    name: '미스릴 광석',
    description: '전설적인 금속 광석',
    type: 'material',
    materialType: 'ore',
    rarity: 'epic',
    level: 30,
    value: 500,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  adamantium_ore: {
    id: 'adamantium_ore',
    name: '아다만티움 광석',
    description: '가장 단단한 금속 광석',
    type: 'material',
    materialType: 'ore',
    rarity: 'legendary',
    level: 40,
    value: 2000,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  // 보석
  ruby: {
    id: 'ruby',
    name: '루비',
    description: '붉은 보석',
    type: 'material',
    materialType: 'gem',
    rarity: 'rare',
    level: 15,
    value: 300,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  sapphire: {
    id: 'sapphire',
    name: '사파이어',
    description: '푸른 보석',
    type: 'material',
    materialType: 'gem',
    rarity: 'rare',
    level: 15,
    value: 300,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  emerald: {
    id: 'emerald',
    name: '에메랄드',
    description: '초록 보석',
    type: 'material',
    materialType: 'gem',
    rarity: 'rare',
    level: 15,
    value: 300,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  diamond: {
    id: 'diamond',
    name: '다이아몬드',
    description: '가장 단단한 보석',
    type: 'material',
    materialType: 'gem',
    rarity: 'epic',
    level: 25,
    value: 1000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  black_pearl: {
    id: 'black_pearl',
    name: '흑진주',
    description: '희귀한 검은 진주',
    type: 'material',
    materialType: 'gem',
    rarity: 'epic',
    level: 30,
    value: 1500,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  // 가죽/천
  leather: {
    id: 'leather',
    name: '가죽',
    description: '동물의 가죽',
    type: 'material',
    materialType: 'leather',
    rarity: 'common',
    level: 1,
    value: 10,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  thick_leather: {
    id: 'thick_leather',
    name: '두꺼운 가죽',
    description: '질긴 동물의 가죽',
    type: 'material',
    materialType: 'leather',
    rarity: 'uncommon',
    level: 10,
    value: 30,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  dragon_leather: {
    id: 'dragon_leather',
    name: '용가죽',
    description: '용의 가죽',
    type: 'material',
    materialType: 'leather',
    rarity: 'epic',
    level: 30,
    value: 800,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  silk: {
    id: 'silk',
    name: '비단',
    description: '부드러운 비단',
    type: 'material',
    materialType: 'cloth',
    rarity: 'uncommon',
    level: 12,
    value: 40,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  magic_cloth: {
    id: 'magic_cloth',
    name: '마법의 천',
    description: '마력이 깃든 천',
    type: 'material',
    materialType: 'cloth',
    rarity: 'rare',
    level: 20,
    value: 150,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  // 목재
  wood: {
    id: 'wood',
    name: '나무',
    description: '일반적인 나무',
    type: 'material',
    materialType: 'wood',
    rarity: 'common',
    level: 1,
    value: 3,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  hardwood: {
    id: 'hardwood',
    name: '단단한 나무',
    description: '질긴 나무',
    type: 'material',
    materialType: 'wood',
    rarity: 'uncommon',
    level: 10,
    value: 15,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  ancient_wood: {
    id: 'ancient_wood',
    name: '고대 나무',
    description: '수천년 된 나무',
    type: 'material',
    materialType: 'wood',
    rarity: 'rare',
    level: 25,
    value: 200,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  // 특수 재료
  monster_bone: {
    id: 'monster_bone',
    name: '몬스터 뼈',
    description: '강한 몬스터의 뼈',
    type: 'material',
    materialType: 'bone',
    rarity: 'uncommon',
    level: 15,
    value: 50,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  dragon_scale: {
    id: 'dragon_scale',
    name: '용비늘',
    description: '용의 비늘',
    type: 'material',
    materialType: 'scale',
    rarity: 'epic',
    level: 35,
    value: 1000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  phoenix_feather: {
    id: 'phoenix_feather',
    name: '불사조 깃털',
    description: '불사조의 깃털',
    type: 'material',
    materialType: 'feather',
    rarity: 'legendary',
    level: 40,
    value: 3000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  unicorn_horn: {
    id: 'unicorn_horn',
    name: '유니콘 뿔',
    description: '신성한 유니콘의 뿔',
    type: 'material',
    materialType: 'horn',
    rarity: 'legendary',
    level: 45,
    value: 5000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  elemental_essence: {
    id: 'elemental_essence',
    name: '정령의 정수',
    description: '순수한 원소의 힘',
    type: 'material',
    materialType: 'essence',
    rarity: 'rare',
    level: 22,
    value: 250,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  dark_essence: {
    id: 'dark_essence',
    name: '어둠의 정수',
    description: '어둠의 순수한 힘',
    type: 'material',
    materialType: 'essence',
    rarity: 'epic',
    level: 28,
    value: 600,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  holy_water: {
    id: 'holy_water',
    name: '성수',
    description: '축복받은 물',
    type: 'material',
    materialType: 'liquid',
    rarity: 'uncommon',
    level: 15,
    value: 80,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  demon_blood: {
    id: 'demon_blood',
    name: '악마의 피',
    description: '강력한 악마의 피',
    type: 'material',
    materialType: 'liquid',
    rarity: 'epic',
    level: 32,
    value: 1200,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  // 제작 재료
  iron_ingot: {
    id: 'iron_ingot',
    name: '철 주괴',
    description: '제련된 철',
    type: 'material',
    materialType: 'ingot',
    rarity: 'common',
    level: 5,
    value: 15,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  steel_ingot: {
    id: 'steel_ingot',
    name: '강철 주괴',
    description: '정제된 강철',
    type: 'material',
    materialType: 'ingot',
    rarity: 'uncommon',
    level: 15,
    value: 60,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  mithril_ingot: {
    id: 'mithril_ingot',
    name: '미스릴 주괴',
    description: '제련된 미스릴',
    type: 'material',
    materialType: 'ingot',
    rarity: 'epic',
    level: 35,
    value: 1500,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  magic_powder: {
    id: 'magic_powder',
    name: '마법 가루',
    description: '마법 제작에 사용되는 가루',
    type: 'material',
    materialType: 'powder',
    rarity: 'uncommon',
    level: 10,
    value: 35,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  enchant_dust: {
    id: 'enchant_dust',
    name: '강화 가루',
    description: '장비 강화에 사용되는 가루',
    type: 'material',
    materialType: 'powder',
    rarity: 'rare',
    level: 20,
    value: 200,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  soul_stone: {
    id: 'soul_stone',
    name: '영혼석',
    description: '영혼이 담긴 돌',
    type: 'material',
    materialType: 'stone',
    rarity: 'rare',
    level: 25,
    value: 400,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  void_stone: {
    id: 'void_stone',
    name: '공허석',
    description: '공허의 힘이 담긴 돌',
    type: 'material',
    materialType: 'stone',
    rarity: 'epic',
    level: 38,
    value: 1800,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  crystal_shard: {
    id: 'crystal_shard',
    name: '수정 조각',
    description: '마력이 담긴 수정 조각',
    type: 'material',
    materialType: 'shard',
    rarity: 'uncommon',
    level: 12,
    value: 45,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  ancient_rune: {
    id: 'ancient_rune',
    name: '고대 룬',
    description: '신비한 힘이 담긴 룬',
    type: 'material',
    materialType: 'rune',
    rarity: 'epic',
    level: 30,
    value: 1000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  // 약초/꽃
  healing_herb: {
    id: 'healing_herb',
    name: '치유 약초',
    description: '치유 효과가 있는 약초',
    type: 'material',
    materialType: 'herb',
    rarity: 'common',
    level: 1,
    value: 8,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  mana_flower: {
    id: 'mana_flower',
    name: '마나 꽃',
    description: '마나가 풍부한 꽃',
    type: 'material',
    materialType: 'flower',
    rarity: 'uncommon',
    level: 10,
    value: 25,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  moonlight_flower: {
    id: 'moonlight_flower',
    name: '월광화',
    description: '달빛에서만 피는 꽃',
    type: 'material',
    materialType: 'flower',
    rarity: 'rare',
    level: 20,
    value: 180,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  life_root: {
    id: 'life_root',
    name: '생명의 뿌리',
    description: '강력한 생명력을 지닌 뿌리',
    type: 'material',
    materialType: 'herb',
    rarity: 'epic',
    level: 35,
    value: 1200,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  // 기타 재료
  monster_eye: {
    id: 'monster_eye',
    name: '몬스터의 눈',
    description: '특수한 시야를 가진 눈',
    type: 'material',
    materialType: 'organ',
    rarity: 'uncommon',
    level: 8,
    value: 30,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  giant_heart: {
    id: 'giant_heart',
    name: '거인의 심장',
    description: '거대한 생명력의 원천',
    type: 'material',
    materialType: 'organ',
    rarity: 'rare',
    level: 28,
    value: 500,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  spider_silk: {
    id: 'spider_silk',
    name: '거미줄',
    description: '질긴 거미줄',
    type: 'material',
    materialType: 'thread',
    rarity: 'common',
    level: 5,
    value: 12,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  golden_thread: {
    id: 'golden_thread',
    name: '황금실',
    description: '빛나는 황금빛 실',
    type: 'material',
    materialType: 'thread',
    rarity: 'rare',
    level: 25,
    value: 300,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  star_fragment: {
    id: 'star_fragment',
    name: '별조각',
    description: '하늘에서 떨어진 별조각',
    type: 'material',
    materialType: 'fragment',
    rarity: 'legendary',
    level: 50,
    value: 10000,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  time_crystal: {
    id: 'time_crystal',
    name: '시간의 수정',
    description: '시간을 담은 신비한 수정',
    type: 'material',
    materialType: 'crystal',
    rarity: 'legendary',
    level: 48,
    value: 8000,
    stackable: true,
    maxStack: 99,
    tradeable: false
  },

  chaos_orb: {
    id: 'chaos_orb',
    name: '혼돈의 구슬',
    description: '예측할 수 없는 힘을 지닌 구슬',
    type: 'material',
    materialType: 'orb',
    rarity: 'epic',
    level: 40,
    value: 2500,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  infinity_dust: {
    id: 'infinity_dust',
    name: '무한의 가루',
    description: '무한한 가능성을 지닌 가루',
    type: 'material',
    materialType: 'powder',
    rarity: 'legendary',
    level: 50,
    value: 15000,
    stackable: true,
    maxStack: 999,
    tradeable: false
  }
}

// === 기타 아이템 (20종) ===
export const MISC_ITEMS: { [id: string]: MiscItem } = {
  // 퀘스트 아이템
  ancient_map_piece: {
    id: 'ancient_map_piece',
    name: '고대 지도 조각',
    description: '무언가의 위치를 나타내는 지도 조각',
    type: 'misc',
    miscType: 'quest',
    rarity: 'uncommon',
    level: 15,
    value: 0,
    stackable: false,
    tradeable: false,
    questId: 'ancient_treasure'
  },

  kings_seal: {
    id: 'kings_seal',
    name: '왕의 인장',
    description: '왕국의 권위를 상징하는 인장',
    type: 'misc',
    miscType: 'quest',
    rarity: 'rare',
    level: 25,
    value: 0,
    stackable: false,
    tradeable: false,
    questId: 'royal_succession'
  },

  lost_diary: {
    id: 'lost_diary',
    name: '잃어버린 일기장',
    description: '누군가의 비밀이 담긴 일기장',
    type: 'misc',
    miscType: 'quest',
    rarity: 'common',
    level: 10,
    value: 0,
    stackable: false,
    tradeable: false,
    questId: 'missing_person'
  },

  // 열쇠
  iron_key: {
    id: 'iron_key',
    name: '철 열쇠',
    description: '어딘가의 문을 여는 열쇠',
    type: 'misc',
    miscType: 'key',
    rarity: 'common',
    level: 5,
    value: 50,
    stackable: true,
    maxStack: 20,
    tradeable: true
  },

  golden_key: {
    id: 'golden_key',
    name: '황금 열쇠',
    description: '보물 상자를 여는 열쇠',
    type: 'misc',
    miscType: 'key',
    rarity: 'rare',
    level: 20,
    value: 500,
    stackable: true,
    maxStack: 10,
    tradeable: true
  },

  master_key: {
    id: 'master_key',
    name: '마스터 키',
    description: '모든 문을 열 수 있는 열쇠',
    type: 'misc',
    miscType: 'key',
    rarity: 'legendary',
    level: 40,
    value: 5000,
    stackable: false,
    tradeable: false
  },

  dungeon_key_forest: {
    id: 'dungeon_key_forest',
    name: '숲 던전 열쇠',
    description: '숲 던전에 입장할 수 있는 열쇠',
    type: 'misc',
    miscType: 'key',
    rarity: 'uncommon',
    level: 10,
    value: 200,
    stackable: true,
    maxStack: 5,
    tradeable: true
  },

  // 수집품
  ancient_coin: {
    id: 'ancient_coin',
    name: '고대 동전',
    description: '옛 왕국의 화폐',
    type: 'misc',
    miscType: 'collectible',
    rarity: 'uncommon',
    level: 12,
    value: 100,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  rare_stamp: {
    id: 'rare_stamp',
    name: '희귀 우표',
    description: '수집가들이 찾는 우표',
    type: 'misc',
    miscType: 'collectible',
    rarity: 'rare',
    level: 18,
    value: 300,
    stackable: true,
    maxStack: 99,
    tradeable: true
  },

  music_box: {
    id: 'music_box',
    name: '오르골',
    description: '아름다운 멜로디를 연주하는 오르골',
    type: 'misc',
    miscType: 'collectible',
    rarity: 'rare',
    level: 22,
    value: 800,
    stackable: false,
    tradeable: true
  },

  // 책/문서
  skill_book_swordsmanship: {
    id: 'skill_book_swordsmanship',
    name: '검술 교본',
    description: '검술 스킬을 배울 수 있는 책',
    type: 'misc',
    miscType: 'book',
    rarity: 'uncommon',
    level: 15,
    value: 500,
    stackable: false,
    tradeable: true
  },

  recipe_health_potion: {
    id: 'recipe_health_potion',
    name: '체력 포션 제조법',
    description: '체력 포션을 만드는 방법이 적힌 책',
    type: 'misc',
    miscType: 'recipe',
    rarity: 'common',
    level: 5,
    value: 100,
    stackable: false,
    tradeable: true
  },

  ancient_tome: {
    id: 'ancient_tome',
    name: '고대의 서',
    description: '해독할 수 없는 고대 문자로 쓰여진 책',
    type: 'misc',
    miscType: 'book',
    rarity: 'epic',
    level: 35,
    value: 2000,
    stackable: false,
    tradeable: true
  },

  // 기타
  fishing_rod: {
    id: 'fishing_rod',
    name: '낚싯대',
    description: '물고기를 잡을 수 있는 도구',
    type: 'misc',
    miscType: 'tool',
    rarity: 'common',
    level: 1,
    value: 50,
    stackable: false,
    tradeable: true
  },

  pickaxe: {
    id: 'pickaxe',
    name: '곡괭이',
    description: '광석을 캘 수 있는 도구',
    type: 'misc',
    miscType: 'tool',
    rarity: 'common',
    level: 1,
    value: 60,
    stackable: false,
    tradeable: true
  },

  empty_bottle: {
    id: 'empty_bottle',
    name: '빈 병',
    description: '무언가를 담을 수 있는 병',
    type: 'misc',
    miscType: 'container',
    rarity: 'common',
    level: 1,
    value: 5,
    stackable: true,
    maxStack: 999,
    tradeable: true
  },

  soul_gem_empty: {
    id: 'soul_gem_empty',
    name: '빈 영혼석',
    description: '영혼을 담을 수 있는 보석',
    type: 'misc',
    miscType: 'container',
    rarity: 'rare',
    level: 20,
    value: 200,
    stackable: true,
    maxStack: 50,
    tradeable: true
  },

  dice: {
    id: 'dice',
    name: '주사위',
    description: '행운을 시험하는 주사위',
    type: 'misc',
    miscType: 'toy',
    rarity: 'common',
    level: 1,
    value: 10,
    stackable: false,
    tradeable: true
  },

  mirror: {
    id: 'mirror',
    name: '거울',
    description: '자신의 모습을 비추는 거울',
    type: 'misc',
    miscType: 'tool',
    rarity: 'uncommon',
    level: 8,
    value: 80,
    stackable: false,
    tradeable: true
  },

  broken_sword: {
    id: 'broken_sword',
    name: '부러진 검',
    description: '한때 위대했던 검의 잔해',
    type: 'misc',
    miscType: 'junk',
    rarity: 'common',
    level: 1,
    value: 2,
    stackable: false,
    tradeable: true
  }
}

// 전체 아이템 통합
export const ALL_ITEMS = {
  ...WEAPONS,
  ...ARMORS,
  ...ACCESSORIES,
  ...CONSUMABLES,
  ...MATERIALS,
  ...MISC_ITEMS
}

// 세트 보너스 정의
export const SET_BONUSES: { [setId: string]: SetBonus } = {
  dragon_set: {
    id: 'dragon_set',
    name: '드래곤 세트',
    requiredPieces: 4,
    pieces: ['dragon_helm', 'dragon_armor', 'dragon_gloves', 'dragon_boots'],
    bonuses: [
      {
        piecesRequired: 2,
        stats: {
          fireResist: 20,
          hp: 100
        }
      },
      {
        piecesRequired: 4,
        stats: {
          attack: 50,
          defense: 30,
          fireResist: 50,
          hp: 300
        },
        effects: [{
          type: 'dragon_breath',
          cooldown: 60
        }]
      }
    ]
  },

  holy_set: {
    id: 'holy_set',
    name: '신성 세트',
    requiredPieces: 3,
    pieces: ['holy_sword', 'holy_shield', 'holy_armor'],
    bonuses: [
      {
        piecesRequired: 2,
        stats: {
          lightResist: 30,
          magicDefense: 20
        }
      },
      {
        piecesRequired: 3,
        stats: {
          magicAttack: 40,
          magicDefense: 40,
          lightResist: 50,
          mp: 200
        },
        effects: [{
          type: 'divine_protection',
          duration: 10,
          cooldown: 300
        }]
      }
    ]
  }
}

// 아이템 관련 유틸리티 함수
export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS[id]
}

export function getItemsByType(type: 'equipment' | 'consumable' | 'material' | 'misc'): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.type === type)
}

export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.rarity === rarity)
}

export function getItemsByLevel(minLevel: number, maxLevel: number): Item[] {
  return Object.values(ALL_ITEMS).filter(
    item => {
      const itemLevel = (item as unknown).level
      return itemLevel !== undefined && itemLevel >= minLevel && itemLevel <= maxLevel
    }
  )
}

export function getSetBonus(setId: string): SetBonus | undefined {
  return SET_BONUSES[setId]
}

export function getItemValue(item: Item, enchantLevel?: number): number {
  let baseValue = (item as unknown).value || 0

  if (enchantLevel && enchantLevel > 0) {
    baseValue *= (1 + enchantLevel * 0.2)
  }

  return Math.floor(baseValue)
}
