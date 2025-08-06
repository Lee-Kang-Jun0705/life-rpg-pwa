import { ItemRarity } from './item-rarity'
import type { ItemDefinition } from './types'

export interface ShopItem {
  itemId: string
  price: number
  stock: number // -1은 무한
  levelRequirement: number
  refreshDaily?: boolean
  category: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'special'
}

export interface Shop {
  id: string
  name: string
  description: string
  icon: string
  levelRequirement: number
  items: ShopItem[]
  refreshTime?: 'daily' | 'weekly' | 'never'
}

export const SHOP_DATABASE: Record<string, Shop> = {
  // 기본 상점
  'shop_basic': {
    id: 'shop_basic',
    name: '모험가 상점',
    description: '초보 모험가를 위한 기본 장비를 판매합니다.',
    icon: '🏪',
    levelRequirement: 1,
    refreshTime: 'never',
    items: [
      // 무기
      {
        itemId: 'weapon_001',
        price: 100,
        stock: -1,
        levelRequirement: 1,
        category: 'weapon'
      },
      {
        itemId: 'weapon_002',
        price: 300,
        stock: -1,
        levelRequirement: 3,
        category: 'weapon'
      },
      // 방어구
      {
        itemId: 'armor_001',
        price: 150,
        stock: -1,
        levelRequirement: 1,
        category: 'armor'
      },
      {
        itemId: 'armor_002',
        price: 400,
        stock: -1,
        levelRequirement: 3,
        category: 'armor'
      },
      // 소모품
      {
        itemId: 'consumable_001',
        price: 50,
        stock: -1,
        levelRequirement: 1,
        category: 'consumable'
      },
      {
        itemId: 'consumable_002',
        price: 80,
        stock: -1,
        levelRequirement: 1,
        category: 'consumable'
      },
      {
        itemId: 'consumable_003',
        price: 150,
        stock: -1,
        levelRequirement: 5,
        category: 'consumable'
      },
      // 강화 재료
      {
        itemId: 'material_001',
        price: 200,
        stock: -1,
        levelRequirement: 1,
        category: 'material'
      }
    ]
  },

  // 고급 상점
  'shop_advanced': {
    id: 'shop_advanced',
    name: '전문가 상점',
    description: '숙련된 모험가를 위한 고급 장비를 판매합니다.',
    icon: '⚔️',
    levelRequirement: 10,
    refreshTime: 'daily',
    items: [
      // 고급 무기
      {
        itemId: 'weapon_003',
        price: 1000,
        stock: 3,
        levelRequirement: 10,
        category: 'weapon',
        refreshDaily: true
      },
      {
        itemId: 'weapon_004',
        price: 3000,
        stock: 1,
        levelRequirement: 15,
        category: 'weapon',
        refreshDaily: true
      },
      // 고급 방어구
      {
        itemId: 'armor_003',
        price: 1500,
        stock: 3,
        levelRequirement: 10,
        category: 'armor',
        refreshDaily: true
      },
      // 고급 장신구
      {
        itemId: 'accessory_001',
        price: 800,
        stock: 2,
        levelRequirement: 8,
        category: 'accessory',
        refreshDaily: true
      },
      {
        itemId: 'accessory_002',
        price: 1200,
        stock: 2,
        levelRequirement: 12,
        category: 'accessory',
        refreshDaily: true
      },
      // 고급 강화 재료
      {
        itemId: 'material_002',
        price: 1000,
        stock: 10,
        levelRequirement: 5,
        category: 'material',
        refreshDaily: true
      },
      {
        itemId: 'material_003',
        price: 4000,
        stock: 5,
        levelRequirement: 10,
        category: 'material',
        refreshDaily: true
      },
      // 보호 부적
      {
        itemId: 'consumable_004',
        price: 20000,
        stock: 1,
        levelRequirement: 10,
        category: 'consumable',
        refreshDaily: true
      }
    ]
  },

  // 특수 상점
  'shop_special': {
    id: 'shop_special',
    name: '신비한 상인',
    description: '희귀하고 특별한 아이템을 판매합니다.',
    icon: '🔮',
    levelRequirement: 20,
    refreshTime: 'weekly',
    items: [
      // 전설 장비
      {
        itemId: 'weapon_005',
        price: 10000,
        stock: 1,
        levelRequirement: 20,
        category: 'weapon',
        refreshDaily: false
      },
      // 희귀 정수
      {
        itemId: 'material_004',
        price: 10000,
        stock: 3,
        levelRequirement: 15,
        category: 'material',
        refreshDaily: false
      },
      // 특수 아이템
      {
        itemId: 'item_special_001',
        price: 50000,
        stock: 1,
        levelRequirement: 25,
        category: 'special',
        refreshDaily: false
      }
    ]
  },

  // 이벤트 상점
  'shop_event': {
    id: 'shop_event',
    name: '축제 상점',
    description: '기간 한정 특별 아이템을 판매합니다!',
    icon: '🎪',
    levelRequirement: 1,
    refreshTime: 'never',
    items: [
      {
        itemId: 'item_event_001',
        price: 5000,
        stock: 1,
        levelRequirement: 10,
        category: 'special'
      },
      {
        itemId: 'item_event_002',
        price: 10000,
        stock: 1,
        levelRequirement: 15,
        category: 'special'
      }
    ]
  }
}

// 상점 새로고침 시간 관리
export interface ShopRefreshData {
  shopId: string
  lastRefresh: Date
  stockData: Record<string, number> // itemId -> current stock
}

// 상점 카테고리 필터
export const SHOP_CATEGORIES = [
  { id: 'all', label: '전체', icon: '📦' },
  { id: 'weapon', label: '무기', icon: '⚔️' },
  { id: 'armor', label: '방어구', icon: '🛡️' },
  { id: 'accessory', label: '장신구', icon: '💍' },
  { id: 'consumable', label: '소모품', icon: '🧪' },
  { id: 'material', label: '재료', icon: '💎' },
  { id: 'special', label: '특수', icon: '✨' }
]

// 할인 이벤트 시스템
export interface ShopDiscount {
  shopId: string
  itemId?: string // 특정 아이템만 할인, 없으면 전체
  discountPercent: number // 0-100
  startDate: Date
  endDate: Date
  description: string
}

// 현재 활성화된 할인
export const ACTIVE_DISCOUNTS: ShopDiscount[] = [
  // {
  //   shopId: 'shop_basic',
  //   discountPercent: 20,
  //   startDate: new Date('2024-01-01'),
  //   endDate: new Date('2024-01-07'),
  //   description: '신년 맞이 20% 할인!'
  // }
]

// 상점별 해금 조건
export function isShopUnlocked(
  shop: Shop,
  playerLevel: number,
  completedQuests?: string[]
): boolean {
  // 레벨 확인
  if (playerLevel < shop.levelRequirement) {
    return false
  }
  
  // 특수 조건 확인 (추후 확장 가능)
  switch (shop.id) {
    case 'shop_special':
      // 특정 퀘스트 완료 필요
      // return completedQuests?.includes('quest_main_010') || false
      return true
      
    case 'shop_event':
      // 이벤트 기간 확인
      const now = new Date()
      const eventStart = new Date('2024-12-01')
      const eventEnd = new Date('2024-12-31')
      return now >= eventStart && now <= eventEnd
      
    default:
      return true
  }
}

// 가격 계산 (할인 적용)
export function calculatePrice(
  basePrice: number,
  shopId: string,
  itemId: string
): number {
  let finalPrice = basePrice
  
  // 할인 적용
  const now = new Date()
  for (const discount of ACTIVE_DISCOUNTS) {
    if (discount.shopId !== shopId) continue
    if (discount.itemId && discount.itemId !== itemId) continue
    if (now < discount.startDate || now > discount.endDate) continue
    
    finalPrice = Math.floor(basePrice * (1 - discount.discountPercent / 100))
  }
  
  return finalPrice
}

// 특수 아이템 정의 (이벤트, 특별 아이템 등)
export const SPECIAL_ITEMS: Record<string, ItemDefinition> = {
  'item_special_001': {
    id: 'item_special_001',
    name: '경험치 부스터',
    description: '1시간 동안 획득 경험치가 2배가 됩니다.',
    icon: '🌟',
    type: 'consumable',
    rarity: ItemRarity.LEGENDARY,
    levelRequirement: 25,
    baseStats: {},
    sellPrice: 25000
  },
  
  'item_event_001': {
    id: 'item_event_001',
    name: '크리스마스 의상',
    description: '특별한 크리스마스 한정 의상입니다.',
    icon: '🎅',
    type: 'armor',
    rarity: ItemRarity.EPIC,
    levelRequirement: 10,
    baseStats: {
      defense: 50,
      hp: 100,
      allStats: 10
    },
    sellPrice: 2500,
    slot: 'armor'
  },
  
  'item_event_002': {
    id: 'item_event_002',
    name: '신년 폭죽',
    description: '사용 시 화려한 폭죽이 터집니다!',
    icon: '🎆',
    type: 'consumable',
    rarity: ItemRarity.RARE,
    levelRequirement: 1,
    baseStats: {},
    sellPrice: 5000
  }
}