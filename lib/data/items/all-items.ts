/**
 * 모든 아이템을 통합한 전체 아이템 데이터베이스
 * 총 200개 아이템 (무기 40, 방어구 40, 액세서리 40, 소비 40, 재료 40)
 */

import type { Item } from '@/lib/types/item-system'
import { WEAPON_ITEMS } from './weapons'
import { ARMOR_ITEMS } from './armors'
import { ACCESSORY_ITEMS } from './accessories'
import { CONSUMABLE_ITEMS } from './consumables'
import { MATERIAL_ITEMS } from './materials'

// 모든 아이템을 하나로 통합
export const ALL_ITEMS: Record<string, Item> = {
  ...WEAPON_ITEMS,
  ...ARMOR_ITEMS,
  ...ACCESSORY_ITEMS,
  ...CONSUMABLE_ITEMS,
  ...MATERIAL_ITEMS
}

// 아이템 통계
export const ITEM_STATISTICS = {
  total: Object.keys(ALL_ITEMS).length,
  byType: {
    weapon: Object.values(ALL_ITEMS).filter(item => item.type === 'weapon').length,
    armor: Object.values(ALL_ITEMS).filter(item => item.type === 'armor').length,
    accessory: Object.values(ALL_ITEMS).filter(item => item.type === 'accessory').length,
    consumable: Object.values(ALL_ITEMS).filter(item => item.type === 'consumable').length,
    material: Object.values(ALL_ITEMS).filter(item => item.type === 'material').length
  },
  byRarity: {
    common: Object.values(ALL_ITEMS).filter(item => item.rarity === 'common').length,
    uncommon: Object.values(ALL_ITEMS).filter(item => item.rarity === 'uncommon').length,
    rare: Object.values(ALL_ITEMS).filter(item => item.rarity === 'rare').length,
    epic: Object.values(ALL_ITEMS).filter(item => item.rarity === 'epic').length,
    legendary: Object.values(ALL_ITEMS).filter(item => item.rarity === 'legendary').length
  },
  byLevel: {
    '1-10': Object.values(ALL_ITEMS).filter(item => item.level >= 1 && item.level <= 10).length,
    '11-20': Object.values(ALL_ITEMS).filter(item => item.level >= 11 && item.level <= 20).length,
    '21-30': Object.values(ALL_ITEMS).filter(item => item.level >= 21 && item.level <= 30).length,
    '31-40': Object.values(ALL_ITEMS).filter(item => item.level >= 31 && item.level <= 40).length,
    '41-50': Object.values(ALL_ITEMS).filter(item => item.level >= 41 && item.level <= 50).length
  }
}

// 아이템 검색 함수들
export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS[id]
}

export function getItemsByType(type: Item['type']): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.type === type)
}

export function getItemsByRarity(rarity: Item['rarity']): Item[] {
  return Object.values(ALL_ITEMS).filter(item => item.rarity === rarity)
}

export function getItemsByLevelRange(minLevel: number, maxLevel: number): Item[] {
  return Object.values(ALL_ITEMS).filter(
    item => item.level >= minLevel && item.level <= maxLevel
  )
}

export function searchItemsByName(query: string): Item[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(ALL_ITEMS).filter(
    item => item.name.toLowerCase().includes(lowerQuery)
  )
}
