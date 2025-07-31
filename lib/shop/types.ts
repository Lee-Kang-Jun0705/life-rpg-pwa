// 상점 및 아이템 관련 타입 정의

import { ALL_ITEMS } from '@/lib/data/items'
import type { Item } from '@/lib/types/item-system'

export type ItemCategory = 
  | 'weapon'      // 무기
  | 'armor'       // 갑옷
  | 'accessory'   // 액세서리
  | 'consumable'  // 소비아이템
  | 'cosmetic'    // 코스메틱

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type StatBonus = {
  health?: number
  learning?: number
  relationship?: number
  achievement?: number
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  price: number
  icon: string
  statBonus?: StatBonus
  isEquippable: boolean
  maxStack?: number // 소비아이템의 경우 스택 가능 개수
  effects?: string[] // 아이템 효과 설명
}

export interface InventoryItem extends ShopItem {
  quantity: number
  isEquipped?: boolean
  purchaseDate: Date
}

export interface PlayerInventory {
  items: InventoryItem[]
  equippedItems: {
    weapon?: string // 아이템 ID
    armor?: string
    accessory?: string
  }
  coins: number
}

export interface ShopState {
  items: ShopItem[]
  inventory: PlayerInventory
  selectedCategory: ItemCategory | 'all'
  purchaseHistory: PurchaseRecord[]
}

export interface PurchaseRecord {
  itemId: string
  itemName: string
  price: number
  purchaseDate: Date
  quantity: number
}

// 아이콘 매핑 (아이템 타입별)
const ITEM_ICONS: Record<string, string> = {
  // 무기
  weapon: '⚔️',
  sword: '🗡️',
  axe: '🪓',
  spear: '🎯',
  bow: '🏹',
  staff: '🪄',
  hammer: '🔨',
  dagger: '🗡️',
  
  // 방어구
  armor: '🛽️',
  helmet: '🦖',
  boots: '👢',
  gloves: '🧤',
  shield: '🛽️',
  
  // 액세서리
  ring: '💍',
  necklace: '📿',
  earring: '💎',
  bracelet: '⛓️',
  
  // 소모품
  potion: '🧪',
  food: '🍖',
  scroll: '📜',
  bomb: '💣',
  
  // 재료
  ore: '⛏️',
  gem: '💎',
  leather: '🧿',
  wood: '🪵',
  herb: '🌿',
  
  // 기타
  default: '📦'
}

// 아이템 타입에 따른 아이콘 반환
function getItemIcon(item: Item): string {
  // 아이템 이름에서 키워드 찾기
  const name = item.name.toLowerCase()
  
  // 무기류
  if (item.type === 'weapon') {
    if (name.includes('검') || name.includes('sword')) return ITEM_ICONS.sword
    if (name.includes('도끼') || name.includes('axe')) return ITEM_ICONS.axe
    if (name.includes('창') || name.includes('spear')) return ITEM_ICONS.spear
    if (name.includes('활') || name.includes('bow')) return ITEM_ICONS.bow
    if (name.includes('지팡이') || name.includes('staff')) return ITEM_ICONS.staff
    if (name.includes('망치') || name.includes('hammer')) return ITEM_ICONS.hammer
    if (name.includes('단검') || name.includes('dagger')) return ITEM_ICONS.dagger
    return ITEM_ICONS.weapon
  }
  
  // 방어구
  if (item.type === 'armor') {
    if (name.includes('투구') || name.includes('모자') || name.includes('helm')) return ITEM_ICONS.helmet
    if (name.includes('부츠') || name.includes('신발') || name.includes('boot')) return ITEM_ICONS.boots
    if (name.includes('장갑') || name.includes('glove')) return ITEM_ICONS.gloves
    if (name.includes('방패') || name.includes('shield')) return ITEM_ICONS.shield
    return ITEM_ICONS.armor
  }
  
  // 액세서리
  if (item.type === 'accessory') {
    if (name.includes('반지') || name.includes('ring')) return ITEM_ICONS.ring
    if (name.includes('목걸이') || name.includes('necklace')) return ITEM_ICONS.necklace
    if (name.includes('귀걸이') || name.includes('earring')) return ITEM_ICONS.earring
    if (name.includes('팔찌') || name.includes('bracelet')) return ITEM_ICONS.bracelet
    return ITEM_ICONS.ring
  }
  
  // 소모품
  if (item.type === 'consumable') {
    if (name.includes('포션') || name.includes('potion')) return ITEM_ICONS.potion
    if (name.includes('빵') || name.includes('고기') || name.includes('음식')) return ITEM_ICONS.food
    if (name.includes('주문서') || name.includes('scroll')) return ITEM_ICONS.scroll
    if (name.includes('폭탄') || name.includes('bomb')) return ITEM_ICONS.bomb
    return ITEM_ICONS.potion
  }
  
  // 재료
  if (item.type === 'material') {
    if (name.includes('광석') || name.includes('ore')) return ITEM_ICONS.ore
    if (name.includes('보석') || name.includes('다이아') || name.includes('루비')) return ITEM_ICONS.gem
    if (name.includes('가죽') || name.includes('leather')) return ITEM_ICONS.leather
    if (name.includes('나무') || name.includes('wood')) return ITEM_ICONS.wood
    if (name.includes('약초') || name.includes('herb')) return ITEM_ICONS.herb
    return ITEM_ICONS.ore
  }
  
  return ITEM_ICONS.default
}

// 새로운 아이템 시스템에서 상점 아이템으로 변환
function convertToShopItem(item: Item): ShopItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.type as ItemCategory,
    rarity: item.rarity as ItemRarity,
    price: item.value,
    icon: getItemIcon(item),
    isEquippable: item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory',
    maxStack: item.maxStack,
    effects: [
      // 기본 스탯 표시
      ...Object.entries(item.baseStats || {}).map(([stat, value]) => {
        const statNames: Record<string, string> = {
          attack: '공격력',
          defense: '방어력',
          hp: '체력',
          mp: '마나',
          speed: '속도',
          critRate: '치명타율',
          critDamage: '치명타 데미지',
          accuracy: '명중률',
          dodge: '회피율',
          hpRegen: 'HP 재생',
          mpRegen: 'MP 재생'
        }
        return `${statNames[stat] || stat} +${value}`
      }),
      // 특수 효과
      ...(item.specialEffects?.map(effect => effect.description) || [])
    ]
  }
}

// 기본 상점 아이템 데이터 (새로운 아이템 시스템에서 가져온 일부 아이템)
export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // 초급 무기
  ...['rusty_sword', 'wooden_sword', 'wooden_staff', 'stone_axe', 'wooden_spear', 'hunting_bow']
    .map(id => ALL_ITEMS[id])
    .filter(Boolean)
    .map(convertToShopItem),
  
  // 초급 방어구
  ...['cloth_shirt', 'leather_vest', 'leather_cap', 'worn_boots', 'cloth_gloves']
    .map(id => ALL_ITEMS[id])
    .filter(Boolean)
    .map(convertToShopItem),
  
  // 초급 액세서리
  ...['copper_ring', 'leather_necklace', 'simple_earring', 'rope_bracelet']
    .map(id => ALL_ITEMS[id])
    .filter(Boolean)
    .map(convertToShopItem),
  
  // 소모품
  ...['small_health_potion', 'small_mana_potion', 'bread', 'antidote', 'teleport_scroll']
    .map(id => ALL_ITEMS[id])
    .filter(Boolean)
    .map(convertToShopItem),
  
  // 재료
  ...['iron_ore', 'copper_ore', 'wolf_pelt', 'magic_dust', 'wood_plank']
    .map(id => ALL_ITEMS[id])
    .filter(Boolean)
    .map(convertToShopItem)
].filter(Boolean)

// 레어도별 색상 매핑
export const RARITY_COLORS = {
  common: 'text-gray-600 bg-gray-100',
  rare: 'text-blue-600 bg-blue-100', 
  epic: 'text-purple-600 bg-purple-100',
  legendary: 'text-orange-600 bg-orange-100'
} as const

// 카테고리별 한글 이름
export const CATEGORY_NAMES = {
  all: '전체',
  weapon: '무기',
  armor: '갑옷', 
  accessory: '액세서리',
  consumable: '소비아이템',
  cosmetic: '코스메틱'
} as const