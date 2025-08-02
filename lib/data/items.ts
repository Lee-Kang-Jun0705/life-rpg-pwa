// 기본 아이템 데이터 정의
import type { Item, EquipmentItem, ConsumableItem, MaterialItem, MiscItem } from '@/lib/types/inventory'

// 소비 아이템
export const CONSUMABLE_ITEMS: Record<string, ConsumableItem> = {
  'health-potion-small': {
    id: 'health-potion-small',
    name: '소형 체력 포션',
    description: 'HP를 50 회복합니다.',
    type: 'consumable',
    subType: 'potion',
    rarity: 'common',
    icon: '🧪',
    stackable: true,
    maxStack: 99,
    sellPrice: 10,
    buyPrice: 30,
    levelRequirement: 1,
    useEffect: {
      type: 'heal_hp',
      target: 'self',
      value: 50
    }
  },
  'health-potion-medium': {
    id: 'health-potion-medium',
    name: '중형 체력 포션',
    description: 'HP를 150 회복합니다.',
    type: 'consumable',
    subType: 'potion',
    rarity: 'uncommon',
    icon: '🧪',
    stackable: true,
    maxStack: 99,
    sellPrice: 30,
    buyPrice: 100,
    levelRequirement: 10,
    useEffect: {
      type: 'heal_hp',
      target: 'self',
      value: 150
    }
  },
  'health-potion-large': {
    id: 'health-potion-large',
    name: '대형 체력 포션',
    description: 'HP를 300 회복합니다.',
    type: 'consumable',
    subType: 'potion',
    rarity: 'rare',
    icon: '🧪',
    stackable: true,
    maxStack: 99,
    sellPrice: 80,
    buyPrice: 250,
    levelRequirement: 20,
    useEffect: {
      type: 'heal_hp',
      target: 'self',
      value: 300
    }
  },
  'attack-buff-scroll': {
    id: 'attack-buff-scroll',
    name: '공격력 증가 주문서',
    description: '30초간 공격력을 20% 증가시킵니다.',
    type: 'consumable',
    subType: 'scroll',
    rarity: 'uncommon',
    icon: '📜',
    stackable: true,
    maxStack: 20,
    sellPrice: 50,
    buyPrice: 150,
    levelRequirement: 5,
    useEffect: {
      type: 'buff_attack',
      target: 'self',
      value: 20,
      duration: 30000
    },
    duration: 30000
  },
  'defense-buff-scroll': {
    id: 'defense-buff-scroll',
    name: '방어력 증가 주문서',
    description: '30초간 방어력을 20% 증가시킵니다.',
    type: 'consumable',
    subType: 'scroll',
    rarity: 'uncommon',
    icon: '📜',
    stackable: true,
    maxStack: 20,
    sellPrice: 50,
    buyPrice: 150,
    levelRequirement: 5,
    useEffect: {
      type: 'buff_defense',
      target: 'self',
      value: 20,
      duration: 30000
    },
    duration: 30000
  }
}

// 장비 아이템
export const EQUIPMENT_ITEMS: Record<string, EquipmentItem> = {
  'wooden-sword': {
    id: 'wooden-sword',
    name: '나무 검',
    description: '초보자용 나무로 만든 검입니다.',
    type: 'equipment',
    subType: 'sword',
    rarity: 'common',
    icon: '🗡️',
    stackable: false,
    maxStack: 1,
    sellPrice: 15,
    buyPrice: 50,
    levelRequirement: 1,
    slot: 'weapon',
    stats: {
      attack: 10
    },
    enhanceable: true,
    maxEnhancement: 5
  },
  'iron-sword': {
    id: 'iron-sword',
    name: '철검',
    description: '단단한 철로 만든 검입니다.',
    type: 'equipment',
    subType: 'sword',
    rarity: 'uncommon',
    icon: '⚔️',
    stackable: false,
    maxStack: 1,
    sellPrice: 100,
    buyPrice: 300,
    levelRequirement: 10,
    slot: 'weapon',
    stats: {
      attack: 25,
      critRate: 5
    },
    enhanceable: true,
    maxEnhancement: 10
  },
  'steel-sword': {
    id: 'steel-sword',
    name: '강철검',
    description: '정제된 강철로 만든 예리한 검입니다.',
    type: 'equipment',
    subType: 'sword',
    rarity: 'rare',
    icon: '⚔️',
    stackable: false,
    maxStack: 1,
    sellPrice: 300,
    buyPrice: 1000,
    levelRequirement: 20,
    slot: 'weapon',
    stats: {
      attack: 45,
      critRate: 10,
      speed: 5
    },
    enhanceable: true,
    maxEnhancement: 15
  },
  'leather-armor': {
    id: 'leather-armor',
    name: '가죽 갑옷',
    description: '가벼운 가죽으로 만든 갑옷입니다.',
    type: 'equipment',
    subType: 'light_armor',
    rarity: 'common',
    icon: '🛡️',
    stackable: false,
    maxStack: 1,
    sellPrice: 20,
    buyPrice: 60,
    levelRequirement: 1,
    slot: 'armor',
    stats: {
      defense: 15,
      hp: 50
    },
    enhanceable: true,
    maxEnhancement: 5
  },
  'iron-armor': {
    id: 'iron-armor',
    name: '철 갑옷',
    description: '튼튼한 철로 만든 갑옷입니다.',
    type: 'equipment',
    subType: 'heavy_armor',
    rarity: 'uncommon',
    icon: '🛡️',
    stackable: false,
    maxStack: 1,
    sellPrice: 120,
    buyPrice: 400,
    levelRequirement: 10,
    slot: 'armor',
    stats: {
      defense: 35,
      hp: 150
    },
    enhanceable: true,
    maxEnhancement: 10
  },
  'simple-ring': {
    id: 'simple-ring',
    name: '단순한 반지',
    description: '마법이 약간 깃든 반지입니다.',
    type: 'equipment',
    subType: 'ring',
    rarity: 'common',
    icon: '💍',
    stackable: false,
    maxStack: 1,
    sellPrice: 25,
    buyPrice: 80,
    levelRequirement: 5,
    slot: 'accessory1',
    stats: {
      attack: 5,
      hp: 30
    },
    enhanceable: false,
    maxEnhancement: 0
  },
  'silver-necklace': {
    id: 'silver-necklace',
    name: '은 목걸이',
    description: '은으로 만든 우아한 목걸이입니다.',
    type: 'equipment',
    subType: 'necklace',
    rarity: 'uncommon',
    icon: '📿',
    stackable: false,
    maxStack: 1,
    sellPrice: 80,
    buyPrice: 250,
    levelRequirement: 8,
    slot: 'accessory2',
    stats: {
      defense: 10,
      hp: 80,
      mp: 30
    },
    enhanceable: false,
    maxEnhancement: 0
  }
}

// 재료 아이템
export const MATERIAL_ITEMS: Record<string, MaterialItem> = {
  'slime-gel': {
    id: 'slime-gel',
    name: '슬라임 젤',
    description: '슬라임에서 얻은 끈적한 젤입니다.',
    type: 'material',
    subType: 'monster_part',
    rarity: 'common',
    icon: '🟢',
    stackable: true,
    maxStack: 999,
    sellPrice: 5,
    levelRequirement: 1,
    grade: 1,
    category: 'crafting'
  },
  'goblin-tooth': {
    id: 'goblin-tooth',
    name: '고블린 이빨',
    description: '고블린의 날카로운 이빨입니다.',
    type: 'material',
    subType: 'monster_part',
    rarity: 'common',
    icon: '🦷',
    stackable: true,
    maxStack: 999,
    sellPrice: 10,
    levelRequirement: 1,
    grade: 1,
    category: 'crafting'
  },
  'enhancement-stone-low': {
    id: 'enhancement-stone-low',
    name: '하급 강화석',
    description: '장비를 강화할 수 있는 마법석입니다.',
    type: 'material',
    subType: 'enhancement_stone',
    rarity: 'uncommon',
    icon: '💎',
    stackable: true,
    maxStack: 999,
    sellPrice: 50,
    buyPrice: 200,
    levelRequirement: 1,
    grade: 1,
    category: 'enhancement'
  },
  'enhancement-stone-mid': {
    id: 'enhancement-stone-mid',
    name: '중급 강화석',
    description: '더 강력한 장비 강화용 마법석입니다.',
    type: 'material',
    subType: 'enhancement_stone',
    rarity: 'rare',
    icon: '💎',
    stackable: true,
    maxStack: 999,
    sellPrice: 200,
    buyPrice: 800,
    levelRequirement: 10,
    grade: 2,
    category: 'enhancement'
  }
}

// 기타 아이템
export const MISC_ITEMS: Record<string, MiscItem> = {
  'old-key': {
    id: 'old-key',
    name: '낡은 열쇠',
    description: '어딘가의 문을 열 수 있을 것 같은 열쇠입니다.',
    type: 'misc',
    subType: 'key',
    rarity: 'uncommon',
    icon: '🗝️',
    stackable: false,
    maxStack: 1,
    sellPrice: 0,
    levelRequirement: 1,
    usable: false
  },
  'mysterious-letter': {
    id: 'mysterious-letter',
    name: '수수께끼의 편지',
    description: '알 수 없는 문자로 쓰여진 편지입니다.',
    type: 'misc',
    subType: 'quest_item',
    rarity: 'rare',
    icon: '📧',
    stackable: false,
    maxStack: 1,
    sellPrice: 0,
    levelRequirement: 1,
    usable: true,
    questId: 'quest-mysterious-letter'
  }
}

// 모든 아이템 통합
export const ALL_ITEMS: Record<string, Item> = {
  ...CONSUMABLE_ITEMS,
  ...EQUIPMENT_ITEMS,
  ...MATERIAL_ITEMS,
  ...MISC_ITEMS
}

// 아이템 ID로 아이템 가져오기
export function getItemById(itemId: string): Item | undefined {
  return ALL_ITEMS[itemId]
}

// 타입별 아이템 필터링
export function getItemsByType(type: Item['type']): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.type === type)
}

// 희귀도별 아이템 필터링
export function getItemsByRarity(rarity: Item['rarity']): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.rarity === rarity)
}