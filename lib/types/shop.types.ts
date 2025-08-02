export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  type: 'equipment' | 'consumable' | 'skill' | 'special'
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  icon: string
  category?: string
  requirements?: {
    level?: number
    quest?: string
    achievement?: string
  }
  stock?: number // -1 for infinite
  refreshTime?: number // in milliseconds
  itemData?: any // Equipment, Consumable, or Skill data
}

export interface ShopData {
  id: string
  name: string
  description: string
  type: 'general' | 'equipment' | 'skill' | 'special' | 'event'
  icon: string
  items: ShopItem[]
  refreshInterval?: number // in milliseconds
  lastRefresh?: number
  unlockConditions?: {
    level?: number
    quest?: string
    achievement?: string
  }
}

export interface PurchaseHistory {
  shopId: string
  itemId: string
  quantity: number
  totalPrice: number
  purchasedAt: number
}

export interface ShopState {
  shops: Record<string, ShopData>
  purchaseHistory: PurchaseHistory[]
  lastVisit: number
}

export const SHOP_CONSTANTS = {
  REFRESH_INTERVALS: {
    DAILY: 24 * 60 * 60 * 1000, // 24 hours
    WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  PRICE_MULTIPLIERS: {
    common: 1,
    uncommon: 2.5,
    rare: 5,
    epic: 10,
    legendary: 25,
  },
  DISCOUNT_TIERS: {
    BRONZE: { minLevel: 10, discount: 0.05 }, // 5% discount
    SILVER: { minLevel: 25, discount: 0.10 }, // 10% discount
    GOLD: { minLevel: 50, discount: 0.15 }, // 15% discount
    PLATINUM: { minLevel: 100, discount: 0.20 }, // 20% discount
  }
}