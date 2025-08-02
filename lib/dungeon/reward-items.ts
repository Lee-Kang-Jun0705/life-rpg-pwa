import { ShopItem } from '@/lib/shop/types'

// 던전 보상 전용 아이템들
export const DUNGEON_REWARD_ITEMS: Record<string, ShopItem> = {
  // 일일 던전 보상
  'health-potion': {
    id: 'health-potion',
    name: '건강 물약',
    description: '피로를 회복시켜주는 마법의 물약',
    category: 'consumable',
    rarity: 'common',
    price: 0,
    icon: '🧪',
    statBonus: { health: 20 },
    isEquippable: false,
    maxStack: 99,
    effects: ['즉시 체력 +20 경험치']
  },
  'wisdom-scroll': {
    id: 'wisdom-scroll',
    name: '지혜의 두루마리',
    description: '고대의 지식이 담긴 신비한 두루마리',
    category: 'consumable',
    rarity: 'common',
    price: 0,
    icon: '📜',
    statBonus: { learning: 20 },
    isEquippable: false,
    maxStack: 99,
    effects: ['즉시 학습 +20 경험치']
  },

  // 주간 보스 보상
  'legendary-sword': {
    id: 'legendary-sword',
    name: '전설의 검',
    description: '영웅들이 사용했던 전설적인 무기',
    category: 'weapon',
    rarity: 'legendary',
    price: 0,
    icon: '⚡',
    statBonus: { health: 20, achievement: 15, learning: 10 },
    isEquippable: true,
    effects: ['체력 +20', '성취 +15', '학습 +10']
  },
  'boss-badge': {
    id: 'boss-badge',
    name: '보스 슬레이어 뱃지',
    description: '주간 보스를 처치한 증표',
    category: 'accessory',
    rarity: 'epic',
    price: 0,
    icon: '🏅',
    statBonus: { achievement: 25 },
    isEquippable: true,
    effects: ['성취 +25', '명예의 상징']
  },

  // 특별 보상
  'dungeon-key': {
    id: 'dungeon-key',
    name: '비밀 던전 열쇠',
    description: '숨겨진 던전으로 가는 신비한 열쇠',
    category: 'consumable',
    rarity: 'epic',
    price: 0,
    icon: '🗝️',
    isEquippable: false,
    maxStack: 10,
    effects: ['특별 던전 입장 가능']
  },
  'exp-booster': {
    id: 'exp-booster',
    name: '경험치 부스터',
    description: '30분간 경험치 획득량 2배',
    category: 'consumable',
    rarity: 'rare',
    price: 0,
    icon: '✨',
    isEquippable: false,
    maxStack: 20,
    effects: ['30분간 경험치 2배']
  },

  // 난이도별 추가 보상
  'champion-armor': {
    id: 'champion-armor',
    name: '챔피언의 갑옷',
    description: '최강의 전사만이 착용할 수 있는 갑옷',
    category: 'armor',
    rarity: 'legendary',
    price: 0,
    icon: '🛡️',
    statBonus: { health: 30, relationship: 15 },
    isEquippable: true,
    effects: ['체력 +30', '관계 +15', '위압감 발산']
  },
  'mystic-ring': {
    id: 'mystic-ring',
    name: '신비한 반지',
    description: '알 수 없는 힘이 깃든 반지',
    category: 'accessory',
    rarity: 'epic',
    price: 0,
    icon: '💍',
    statBonus: { learning: 20, relationship: 20 },
    isEquippable: true,
    effects: ['학습 +20', '관계 +20']
  }
}

// 난이도별 보상 아이템 ID 목록
export const DIFFICULTY_REWARDS = {
  easy: ['health-potion', 'wisdom-scroll'],
  normal: ['health-potion', 'wisdom-scroll', 'exp-booster'],
  hard: ['exp-booster', 'dungeon-key', 'mystic-ring'],
  nightmare: ['legendary-sword', 'champion-armor', 'boss-badge']
}
