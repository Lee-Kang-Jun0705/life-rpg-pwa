import { BaseEntity } from './common'

// 상점 관련 타입
export interface ShopItem extends BaseEntity {
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  price: number
  icon: string
  stats?: ItemStats
  requirements?: ItemRequirements
  effects?: ItemEffect[]
  appearanceModifier?: string
  stackable: boolean
  maxStack?: number
}

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'material'
  | 'special'

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export interface ItemStats {
  attack?: number
  defense?: number
  health?: number
  mana?: number
  speed?: number
  critChance?: number
  critDamage?: number
}

export interface ItemRequirements {
  level?: number
  stats?: Partial<{
    strength: number
    agility: number
    intelligence: number
    charisma: number
  }>
  achievements?: string[]
}

export interface ItemEffect {
  type: EffectType
  value: number
  duration?: number
  description: string
}

export type EffectType =
  | 'heal'
  | 'damage'
  | 'buff'
  | 'debuff'
  | 'restore'
  | 'experience'
  | 'gold'

export interface InventoryItem extends ShopItem {
  inventoryId: string
  ownerId: string
  quantity: number
  equipped: boolean
  acquiredAt: Date
  slot?: EquipmentSlot
}

export type EquipmentSlot =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'gloves'
  | 'boots'
  | 'accessory1'
  | 'accessory2'

export interface PurchaseRequest {
  userId: string
  itemId: string
  quantity: number
}

export interface PurchaseResponse {
  success: boolean
  item?: InventoryItem
  newBalance?: number
  error?: string
}

export interface ShopFilters {
  category?: ItemCategory[]
  rarity?: ItemRarity[]
  priceRange?: {
    min: number
    max: number
  }
  levelRange?: {
    min: number
    max: number
  }
  search?: string
}

export interface ShopSortOptions {
  sortBy: 'price' | 'name' | 'rarity' | 'level' | 'createdAt'
  order: 'asc' | 'desc'
}
