'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { db } from '@/lib/database/client'
import type { PlayerDataValue } from '@/lib/database/types'
import { dbHelpers } from '@/lib/database'
import {
  ShopState,
  ShopItem,
  InventoryItem,
  PlayerInventory,
  ItemCategory,
  ItemRarity,
  PurchaseRecord,
  DEFAULT_SHOP_ITEMS
} from './types'
import { ALL_ITEMS } from '@/lib/data/items'
import type { Item } from '@/lib/types/item-system'
import { playerService } from '@/lib/services/player.service'
import { shopSyncService } from '@/lib/services/shop-sync.service'
import { shops } from '@/lib/data/shops'

// 아이콘 매핑 함수
function getItemIcon(item: Item): string {
  const name = item.name.toLowerCase()

  if (item.type === 'weapon') {
    if (name.includes('검') || name.includes('sword')) {
      return '🗡️'
    }
    if (name.includes('도끼') || name.includes('axe')) {
      return '🪓'
    }
    if (name.includes('창') || name.includes('spear')) {
      return '🎯'
    }
    if (name.includes('활') || name.includes('bow')) {
      return '🏹'
    }
    if (name.includes('지팡이') || name.includes('staff')) {
      return '🪄'
    }
    return '⚔️'
  }

  if (item.type === 'armor') {
    if (name.includes('투구') || name.includes('helm')) {
      return '🦖'
    }
    if (name.includes('부츠') || name.includes('boot')) {
      return '👢'
    }
    if (name.includes('장갑') || name.includes('glove')) {
      return '🧤'
    }
    return '🛽️'
  }

  if (item.type === 'accessory') {
    if (name.includes('반지') || name.includes('ring')) {
      return '💍'
    }
    if (name.includes('목걸이') || name.includes('necklace')) {
      return '📿'
    }
    return '💎'
  }

  if (item.type === 'consumable') {
    if (name.includes('포션') || name.includes('potion')) {
      return '🧪'
    }
    if (name.includes('빵') || name.includes('음식')) {
      return '🍖'
    }
    if (name.includes('주문서') || name.includes('scroll')) {
      return '📜'
    }
    return '🧪'
  }

  if (item.type === 'material') {
    if (name.includes('광석') || name.includes('ore')) {
      return '⛏️'
    }
    if (name.includes('보석')) {
      return '💎'
    }
    if (name.includes('가죽')) {
      return '🧿'
    }
    return '🪵'
  }

  return '📦'
}

interface ShopContextType {
  state: ShopState
  isLoading: boolean
  coins: number
  purchaseItem: (item: ShopItem, quantity?: number) => Promise<boolean>
  equipItem: (itemId: string) => Promise<boolean>
  unequipItem: (itemId: string) => Promise<boolean>
  useConsumableItem: (itemId: string) => Promise<boolean>
  setSelectedCategory: (category: ItemCategory | 'all') => void
  getFilteredItems: () => ShopItem[]
  getInventoryItems: () => InventoryItem[]
  getEquippedItems: () => { weapon?: InventoryItem; armor?: InventoryItem; accessory?: InventoryItem }
  addCoins: (amount: number) => Promise<void>
  spendCoins: (amount: number) => Promise<boolean>
  addItemToInventory: (item: ShopItem, quantity?: number) => Promise<void>
  sellItem: (itemId: string, quantity?: number) => Promise<boolean>
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

const DEFAULT_INVENTORY: PlayerInventory = {
  items: [],
  equippedItems: {},
  coins: 100
}

const DEFAULT_SHOP_STATE: ShopState = {
  items: DEFAULT_SHOP_ITEMS,
  inventory: DEFAULT_INVENTORY,
  selectedCategory: 'all',
  purchaseHistory: []
}

// 타입 가드 함수들
function isInventoryData(data: unknown): data is PlayerInventory {
  if (!data || typeof data !== 'object') {
    return false
  }
  const obj = data as Record<string, unknown>
  return (
    Array.isArray(obj.items) &&
    typeof obj.equippedItems === 'object' &&
    obj.equippedItems !== null &&
    typeof obj.coins === 'number'
  )
}

function isPurchaseRecord(data: unknown): data is PurchaseRecord {
  if (!data || typeof data !== 'object') {
    return false
  }
  const obj = data as Record<string, unknown>
  return (
    typeof obj.itemId === 'string' &&
    typeof obj.itemName === 'string' &&
    typeof obj.price === 'number' &&
    (obj.purchaseDate instanceof Date || typeof obj.purchaseDate === 'string')
  )
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShopState>(DEFAULT_SHOP_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const timerIdRef = React.useRef(`shop-load-${Date.now()}`)

  // 안전한 데이터 로드 함수
  const loadShopData = useCallback(async() => {
    if (isInitialized) {
      return
    } // 이미 초기화된 경우 skip

    try {
      setIsLoading(true)

      // DB 연결 상태 확인
      if (!db || !db.playerData) {
        console.warn('⚠️ Database not ready, using default data')
        setState(DEFAULT_SHOP_STATE)
        return
      }

      // 병렬로 데이터 로드
      const [inventoryResult, historyResult] = await Promise.all([
        db.playerData.get('inventory').catch(error => {
          console.warn('⚠️ Failed to load inventory:', error)
          return null
        }),
        db.playerData.get('purchaseHistory').catch(error => {
          console.warn('⚠️ Failed to load purchase history:', error)
          return null
        })
      ])

      // 인벤토리 데이터 처리
      let inventory = DEFAULT_INVENTORY
      if (inventoryResult?.data && isInventoryData(inventoryResult.data)) {
        inventory = inventoryResult.data
      }

      // 구매 이력 처리
      let purchaseHistory: PurchaseRecord[] = []
      if (historyResult?.data && Array.isArray(historyResult.data)) {
        purchaseHistory = historyResult.data
          .filter(isPurchaseRecord)
          .map((record) => ({
            ...record,
            purchaseDate: record.purchaseDate instanceof Date
              ? record.purchaseDate
              : new Date(record.purchaseDate)
          }))
      }

      // 모든 아이템을 ShopItem으로 변환
      const itemsFromAllItems = Object.values(ALL_ITEMS).map(item => ({
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
          ...Object.entries(item.baseStats || {}).map(([stat, value]) => {
            const statNames: Record<string, string> = {
              attack: '공격력',
              defense: '방어력',
              hp: '체력',
              mp: '마나',
              speed: '속도',
              critRate: '치명타율',
              critDamage: '치명타 데미지'
            }
            return `${statNames[stat] || stat} +${value}`
          })
        ]
      }))

      // shops.ts에서 스킬 아이템 추가
      const skillShopItems: ShopItem[] = []
      if (shops.skillShop) {
        shops.skillShop.items.forEach(shopItem => {
          skillShopItems.push({
            id: shopItem.id,
            name: shopItem.name,
            description: shopItem.description,
            category: 'skill' as ItemCategory,
            rarity: (shopItem.rarity || 'common') as ItemRarity,
            price: shopItem.price,
            icon: shopItem.icon,
            isEquippable: false,
            effects: shopItem.itemData?.learnOnPurchase ? ['구매 시 즉시 스킬 습득'] : []
          })
        })
      }

      const allShopItems = [...itemsFromAllItems, ...skillShopItems]

      setState({
        items: allShopItems,
        inventory,
        selectedCategory: 'all',
        purchaseHistory
      })

      setIsInitialized(true)
    } catch (error) {
      console.error('🚫 Shop data load error:', error)
      setState(DEFAULT_SHOP_STATE)
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  // 초기 로드
  useEffect(() => {
    // DB가 준비되었는지 확인 후 즉시 로드
    if (db && db.playerData) {
      loadShopData()
    } else {
      // DB가 없으면 짧은 지연 후 재시도
      const timer = setTimeout(() => {
        loadShopData()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [loadShopData])

  // 인벤토리 저장 (디바운스 적용)
  const saveInventory = useCallback(async(inventory: PlayerInventory) => {
    try {
      if (!db || !db.playerData) {
        console.warn('⚠️ Cannot save inventory: database not ready')
        return
      }

      await db.playerData.put({
        id: 'inventory',
        data: inventory as PlayerDataValue,
        updatedAt: new Date()
      })

      setState(prev => ({ ...prev, inventory }))
    } catch (error) {
      console.error('❌ Failed to save inventory:', error)
    }
  }, [])

  // 구매 이력 저장
  const savePurchaseHistory = useCallback(async(history: PurchaseRecord[]) => {
    try {
      if (!db || !db.playerData) {
        console.warn('⚠️ Cannot save purchase history: database not ready')
        return
      }

      await db.playerData.put({
        id: 'purchaseHistory',
        data: history as PlayerDataValue,
        updatedAt: new Date()
      })

      setState(prev => ({ ...prev, purchaseHistory: history }))
    } catch (error) {
      console.error('❌ Failed to save purchase history:', error)
    }
  }, [])

  // 아이템 구매
  const purchaseItem = useCallback(async(item: ShopItem, quantity = 1): Promise<boolean> => {
    try {
      // 동기화 서비스를 통한 구매 처리
      const result = await shopSyncService.purchaseItem('current-user', item, quantity)

      if (!result.success) {
        console.error('❌ Purchase failed:', result.message)
        return false
      }

      // 플레이어 데이터 다시 불러오기
      const player = await playerService.getPlayer('current-user')
      if (!player) {
        return false
      }

      // 인벤토리 서비스와 동기화
      await shopSyncService.syncInventory('current-user')

      // UI 상태 업데이트
      const newInventory = { ...state.inventory }
      const existingItem = newInventory.items.find(invItem => invItem.id === item.id)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        const inventoryItem: InventoryItem = {
          ...item,
          quantity,
          isEquipped: false,
          purchaseDate: new Date()
        }
        newInventory.items.push(inventoryItem)
      }

      newInventory.coins = player.gold

      // 구매 기록 저장
      const purchaseRecord: PurchaseRecord = {
        itemId: item.id,
        itemName: item.name,
        price: result.goldSpent || 0,
        purchaseDate: new Date(),
        quantity
      }

      const newHistory = [...state.purchaseHistory, purchaseRecord]

      await Promise.all([
        saveInventory(newInventory),
        savePurchaseHistory(newHistory)
      ])

      console.log(result.message)
      return true
    } catch (error) {
      console.error('❌ Purchase failed:', error)
      return false
    }
  }, [state.inventory, state.purchaseHistory, saveInventory, savePurchaseHistory])

  // 아이템 장착
  const equipItem = useCallback(async(itemId: string): Promise<boolean> => {
    const item = state.inventory.items.find(item => item.id === itemId)
    if (!item || !item.isEquippable) {
      return false
    }

    // shopSyncService를 통해 장착 동기화
    const success = await shopSyncService.syncEquipItem('current-user', itemId, item.category)
    
    if (success) {
      const newInventory = { ...state.inventory }
      const itemCategory = item.category

      if (itemCategory === 'weapon' || itemCategory === 'armor' || itemCategory === 'accessory') {
        // 기존 장착 해제
        const currentEquippedId = newInventory.equippedItems[itemCategory]
        if (currentEquippedId) {
          const currentItem = newInventory.items.find(i => i.id === currentEquippedId)
          if (currentItem) {
            currentItem.isEquipped = false
          }
        }

        // 새 아이템 장착
        newInventory.equippedItems[itemCategory] = itemId
        const targetItem = newInventory.items.find(i => i.id === itemId)
        if (targetItem) {
          targetItem.isEquipped = true
        }

        await saveInventory(newInventory)
        
        // 장비 변경 이벤트 발생 (스탯 재계산을 위해)
        window.dispatchEvent(new Event('equipment-changed'))
      }
    }
    
    return success
  }, [state.inventory, saveInventory])

  // 아이템 장착 해제
  const unequipItem = useCallback(async(itemId: string): Promise<boolean> => {
    const item = state.inventory.items.find(item => item.id === itemId)
    if (!item || !item.isEquipped) {
      return false
    }

    const newInventory = { ...state.inventory }
    const itemCategory = item.category

    if (itemCategory === 'weapon' || itemCategory === 'armor' || itemCategory === 'accessory') {
      delete newInventory.equippedItems[itemCategory]

      const targetItem = newInventory.items.find(i => i.id === itemId)
      if (targetItem) {
        targetItem.isEquipped = false
      }

      await saveInventory(newInventory)
      return true
    }

    return false
  }, [state.inventory, saveInventory])

  // 소모품 사용
  const useConsumableItem = useCallback(async(itemId: string): Promise<boolean> => {
    const item = state.inventory.items.find(item => item.id === itemId)
    if (!item || item.category !== 'consumable' || item.quantity <= 0) {
      return false
    }

    const newInventory = { ...state.inventory }
    const itemIndex = newInventory.items.findIndex(item => item.id === itemId)

    if (itemIndex >= 0) {
      newInventory.items[itemIndex].quantity -= 1

      if (newInventory.items[itemIndex].quantity <= 0) {
        newInventory.items.splice(itemIndex, 1)
      }

      await saveInventory(newInventory)
      return true
    }

    return false
  }, [state.inventory, saveInventory])

  // 카테고리 선택
  const setSelectedCategory = useCallback((category: ItemCategory | 'all') => {
    setState(prev => ({ ...prev, selectedCategory: category }))
  }, [])

  // 필터링된 아이템 가져오기
  const getFilteredItems = useCallback((): ShopItem[] => {
    if (state.selectedCategory === 'all') {
      return state.items
    }
    return state.items.filter(item => item.category === state.selectedCategory)
  }, [state.items, state.selectedCategory])

  // 인벤토리 아이템 가져오기
  const getInventoryItems = useCallback((): InventoryItem[] => {
    return state.inventory.items
  }, [state.inventory.items])

  // 장착된 아이템 가져오기
  const getEquippedItems = useCallback(() => {
    const { equippedItems } = state.inventory
    const result: { weapon?: InventoryItem; armor?: InventoryItem; accessory?: InventoryItem } = {}

    if (equippedItems.weapon) {
      result.weapon = state.inventory.items.find(item => item.id === equippedItems.weapon)
    }
    if (equippedItems.armor) {
      result.armor = state.inventory.items.find(item => item.id === equippedItems.armor)
    }
    if (equippedItems.accessory) {
      result.accessory = state.inventory.items.find(item => item.id === equippedItems.accessory)
    }

    return result
  }, [state.inventory])

  // 코인 추가
  const addCoins = useCallback(async(amount: number) => {
    const newInventory = { ...state.inventory }
    newInventory.coins += amount
    await saveInventory(newInventory)
  }, [state.inventory, saveInventory])

  // 코인 사용
  const spendCoins = useCallback(async(amount: number): Promise<boolean> => {
    if (state.inventory.coins < amount) {
      return false
    }

    const newInventory = { ...state.inventory }
    newInventory.coins -= amount
    await saveInventory(newInventory)
    return true
  }, [state.inventory, saveInventory])

  // 아이템 추가
  const addItemToInventory = useCallback(async(item: ShopItem, quantity = 1) => {
    const newInventory = { ...state.inventory }
    const existingItem = newInventory.items.find(invItem => invItem.id === item.id)

    if (existingItem) {
      if (item.maxStack && existingItem.quantity < item.maxStack) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, item.maxStack)
      }
    } else {
      const inventoryItem: InventoryItem = {
        ...item,
        quantity,
        isEquipped: false,
        purchaseDate: new Date()
      }
      newInventory.items.push(inventoryItem)
    }

    await saveInventory(newInventory)
  }, [state.inventory, saveInventory])
  
  // 아이템 판매
  const sellItem = useCallback(async(itemId: string, quantity = 1): Promise<boolean> => {
    const item = state.inventory.items.find(invItem => invItem.id === itemId)
    if (!item || item.quantity < quantity) {
      return false
    }
    
    // 장착된 아이템은 판매 불가
    if (item.isEquipped) {
      console.warn('장착된 아이템은 판매할 수 없습니다.')
      return false
    }
    
    // 판매 가격은 구매 가격의 50%
    const sellPrice = Math.floor(item.price * 0.5) * quantity
    
    const newInventory = { ...state.inventory }
    const itemIndex = newInventory.items.findIndex(invItem => invItem.id === itemId)
    
    if (itemIndex >= 0) {
      newInventory.items[itemIndex].quantity -= quantity
      
      if (newInventory.items[itemIndex].quantity <= 0) {
        newInventory.items.splice(itemIndex, 1)
      }
      
      // 골드 추가
      newInventory.coins += sellPrice
      
      await saveInventory(newInventory)
      
      // 플레이어 서비스와 동기화
      try {
        const player = await playerService.getPlayer('current-user')
        if (player) {
          await playerService.updatePlayer('current-user', {
            gold: newInventory.coins
          })
        }
      } catch (error) {
        console.error('Failed to sync gold with player service:', error)
      }
      
      console.log(`아이템 판매 완료: ${item.name} x${quantity} = ${sellPrice} 골드`)
      return true
    }
    
    return false
  }, [state.inventory, saveInventory])

  // Context value 메모이제이션
  const value = useMemo<ShopContextType>(() => ({
    state,
    isLoading,
    coins: state.inventory.coins,
    purchaseItem,
    equipItem,
    unequipItem,
    useConsumableItem,
    setSelectedCategory,
    getFilteredItems,
    getInventoryItems,
    getEquippedItems,
    addCoins,
    spendCoins,
    addItemToInventory,
    sellItem
  }), [
    state,
    isLoading,
    purchaseItem,
    equipItem,
    unequipItem,
    useConsumableItem,
    setSelectedCategory,
    getFilteredItems,
    getInventoryItems,
    getEquippedItems,
    addCoins,
    spendCoins,
    addItemToInventory,
    sellItem
  ])

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}
