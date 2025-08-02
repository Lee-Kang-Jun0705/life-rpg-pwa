import { db } from '@/lib/database/client'
import {
  ShopItem,
  InventoryItem,
  PlayerInventory,
  PurchaseRecord,
  DEFAULT_SHOP_ITEMS
} from '../types'

// 상점 비즈니스 로직을 순수 함수로 분리하여 테스트
export class ShopService {
  async purchaseItem(
    inventory: PlayerInventory,
    item: ShopItem,
    quantity = 1
  ): Promise<{ success: boolean; newInventory?: PlayerInventory; error?: string }> {
    const totalCost = item.price * quantity

    if (inventory.coins < totalCost) {
      return { success: false, error: '코인이 부족합니다' }
    }

    const newInventory = { ...inventory }
    newInventory.coins -= totalCost

    // 기존 아이템이 있는지 확인
    const existingItemIndex = newInventory.items.findIndex(invItem => invItem.id === item.id)

    if (existingItemIndex >= 0) {
      // 기존 아이템 수량 증가
      newInventory.items[existingItemIndex].quantity += quantity
    } else {
      // 새 아이템 추가
      const newInventoryItem: InventoryItem = {
        ...item,
        quantity,
        purchaseDate: new Date()
      }
      newInventory.items.push(newInventoryItem)
    }

    return { success: true, newInventory }
  }

  equipItem(
    inventory: PlayerInventory,
    itemId: string
  ): { success: boolean; newInventory?: PlayerInventory; error?: string } {
    const item = inventory.items.find(item => item.id === itemId)
    if (!item || !item.isEquippable) {
      return { success: false, error: '장착할 수 없는 아이템입니다' }
    }

    const newInventory = { ...inventory }
    const itemCategory = item.category

    // 장착 가능한 카테고리 체크
    if (itemCategory !== 'weapon' && itemCategory !== 'armor' && itemCategory !== 'accessory') {
      return { success: false, error: '장착할 수 없는 카테고리입니다' }
    }

    // 같은 카테고리의 기존 장착 아이템 해제
    const currentEquippedId = newInventory.equippedItems[itemCategory]
    if (currentEquippedId) {
      const currentEquippedItem = newInventory.items.find(item => item.id === currentEquippedId)
      if (currentEquippedItem) {
        currentEquippedItem.isEquipped = false
      }
    }

    // 새 아이템 장착
    newInventory.equippedItems[itemCategory] = itemId
    const inventoryItem = newInventory.items.find(item => item.id === itemId)
    if (inventoryItem) {
      inventoryItem.isEquipped = true
    }

    return { success: true, newInventory }
  }

  unequipItem(
    inventory: PlayerInventory,
    itemId: string
  ): { success: boolean; newInventory?: PlayerInventory; error?: string } {
    const item = inventory.items.find(item => item.id === itemId)
    if (!item || !item.isEquipped) {
      return { success: false, error: '장착되지 않은 아이템입니다' }
    }

    const newInventory = { ...inventory }
    const itemCategory = item.category

    if (itemCategory === 'weapon' || itemCategory === 'armor' || itemCategory === 'accessory') {
      delete newInventory.equippedItems[itemCategory]

      const inventoryItem = newInventory.items.find(item => item.id === itemId)
      if (inventoryItem) {
        inventoryItem.isEquipped = false
      }

      return { success: true, newInventory }
    }

    return { success: false, error: '해제할 수 없는 아이템입니다' }
  }

  useConsumableItem(
    inventory: PlayerInventory,
    itemId: string
  ): { success: boolean; newInventory?: PlayerInventory; error?: string } {
    const item = inventory.items.find(item => item.id === itemId)
    if (!item || item.category !== 'consumable' || item.quantity <= 0) {
      return { success: false, error: '사용할 수 없는 아이템입니다' }
    }

    const newInventory = { ...inventory }
    const itemIndex = newInventory.items.findIndex(item => item.id === itemId)

    if (itemIndex >= 0) {
      newInventory.items[itemIndex].quantity -= 1

      // 수량이 0이 되면 아이템 제거
      if (newInventory.items[itemIndex].quantity <= 0) {
        newInventory.items.splice(itemIndex, 1)
      }

      return { success: true, newInventory }
    }

    return { success: false, error: '아이템을 찾을 수 없습니다' }
  }

  addCoins(inventory: PlayerInventory, amount: number): PlayerInventory {
    return {
      ...inventory,
      coins: inventory.coins + amount
    }
  }

  spendCoins(
    inventory: PlayerInventory,
    amount: number
  ): { success: boolean; newInventory?: PlayerInventory; error?: string } {
    if (inventory.coins < amount) {
      return { success: false, error: '코인이 부족합니다' }
    }

    return {
      success: true,
      newInventory: {
        ...inventory,
        coins: inventory.coins - amount
      }
    }
  }

  calculateTotalStatBonus(inventory: PlayerInventory) {
    const equipped = this.getEquippedItems(inventory)
    const totalBonus = {
      health: 0,
      learning: 0,
      relationship: 0,
      achievement: 0
    }

    Object.values(equipped).forEach(item => {
      if (item?.statBonus) {
        totalBonus.health += item.statBonus.health || 0
        totalBonus.learning += item.statBonus.learning || 0
        totalBonus.relationship += item.statBonus.relationship || 0
        totalBonus.achievement += item.statBonus.achievement || 0
      }
    })

    return totalBonus
  }

  getEquippedItems(inventory: PlayerInventory) {
    const { equippedItems } = inventory
    const result: { weapon?: InventoryItem; armor?: InventoryItem; accessory?: InventoryItem } = {}

    if (equippedItems.weapon) {
      result.weapon = inventory.items.find(item => item.id === equippedItems.weapon)
    }
    if (equippedItems.armor) {
      result.armor = inventory.items.find(item => item.id === equippedItems.armor)
    }
    if (equippedItems.accessory) {
      result.accessory = inventory.items.find(item => item.id === equippedItems.accessory)
    }

    return result
  }
}

// 테스트
describe('ShopService', () => {
  let shopService: ShopService
  let mockInventory: PlayerInventory
  let mockItem: ShopItem

  beforeEach(() => {
    shopService = new ShopService()

    mockInventory = {
      items: [],
      equippedItems: {},
      coins: 100
    }

    mockItem = DEFAULT_SHOP_ITEMS[0] // 기본 검 (50 코인)
  })

  describe('purchaseItem', () => {
    it('충분한 코인이 있을 때 아이템을 구매할 수 있어야 함', async() => {
      const result = await shopService.purchaseItem(mockInventory, mockItem, 1)

      expect(result.success).toBe(true)
      expect(result.newInventory?.coins).toBe(50) // 100 - 50
      expect(result.newInventory?.items).toHaveLength(1)
      expect(result.newInventory?.items[0].id).toBe(mockItem.id)
      expect(result.newInventory?.items[0].quantity).toBe(1)
    })

    it('코인이 부족할 때 구매에 실패해야 함', async() => {
      mockInventory.coins = 30 // 50 코인 아이템을 살 수 없는 금액

      const result = await shopService.purchaseItem(mockInventory, mockItem, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('코인이 부족합니다')
    })

    it('같은 아이템을 다시 구매하면 수량이 증가해야 함', async() => {
      // 첫 번째 구매
      const firstResult = await shopService.purchaseItem(mockInventory, mockItem, 1)
      expect(firstResult.success).toBe(true)

      // 두 번째 구매
      const secondResult = await shopService.purchaseItem(firstResult.newInventory!, mockItem, 1)

      expect(secondResult.success).toBe(true)
      expect(secondResult.newInventory?.coins).toBe(0) // 100 - 50 - 50
      expect(secondResult.newInventory?.items).toHaveLength(1)
      expect(secondResult.newInventory?.items[0].quantity).toBe(2)
    })

    it('여러 개 수량을 한 번에 구매할 수 있어야 함', async() => {
      mockInventory.coins = 200

      const result = await shopService.purchaseItem(mockInventory, mockItem, 3)

      expect(result.success).toBe(true)
      expect(result.newInventory?.coins).toBe(50) // 200 - (50 * 3)
      expect(result.newInventory?.items[0].quantity).toBe(3)
    })
  })

  describe('equipItem', () => {
    beforeEach(() => {
      // 인벤토리에 장착 가능한 아이템 추가
      mockInventory.items = [{
        ...mockItem,
        quantity: 1,
        purchaseDate: new Date()
      }]
    })

    it('장착 가능한 아이템을 장착할 수 있어야 함', () => {
      const result = shopService.equipItem(mockInventory, mockItem.id)

      expect(result.success).toBe(true)
      expect(result.newInventory?.equippedItems.weapon).toBe(mockItem.id)
      expect(result.newInventory?.items[0].isEquipped).toBe(true)
    })

    it('장착 불가능한 아이템은 장착할 수 없어야 함', () => {
      const consumableItem = DEFAULT_SHOP_ITEMS.find(item => item.category === 'consumable')!
      mockInventory.items = [{
        ...consumableItem,
        quantity: 1,
        purchaseDate: new Date()
      }]

      const result = shopService.equipItem(mockInventory, consumableItem.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('장착할 수 없는 아이템입니다')
    })

    it('같은 카테고리의 기존 장착 아이템을 교체해야 함', () => {
      const weapon2 = DEFAULT_SHOP_ITEMS.find(item => item.id === 'sword_steel')!
      mockInventory.items = [
        { ...mockItem, quantity: 1, purchaseDate: new Date(), isEquipped: true },
        { ...weapon2, quantity: 1, purchaseDate: new Date() }
      ]
      mockInventory.equippedItems.weapon = mockItem.id

      const result = shopService.equipItem(mockInventory, weapon2.id)

      expect(result.success).toBe(true)
      expect(result.newInventory?.equippedItems.weapon).toBe(weapon2.id)
      expect(result.newInventory?.items[0].isEquipped).toBe(false) // 기존 아이템 해제
      expect(result.newInventory?.items[1].isEquipped).toBe(true) // 새 아이템 장착
    })
  })

  describe('unequipItem', () => {
    beforeEach(() => {
      mockInventory.items = [{
        ...mockItem,
        quantity: 1,
        purchaseDate: new Date(),
        isEquipped: true
      }]
      mockInventory.equippedItems.weapon = mockItem.id
    })

    it('장착된 아이템을 해제할 수 있어야 함', () => {
      const result = shopService.unequipItem(mockInventory, mockItem.id)

      expect(result.success).toBe(true)
      expect(result.newInventory?.equippedItems.weapon).toBeUndefined()
      expect(result.newInventory?.items[0].isEquipped).toBe(false)
    })

    it('장착되지 않은 아이템은 해제할 수 없어야 함', () => {
      mockInventory.items[0].isEquipped = false
      delete mockInventory.equippedItems.weapon

      const result = shopService.unequipItem(mockInventory, mockItem.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('장착되지 않은 아이템입니다')
    })
  })

  describe('useConsumableItem', () => {
    let consumableItem: ShopItem

    beforeEach(() => {
      consumableItem = DEFAULT_SHOP_ITEMS.find(item => item.category === 'consumable')!
      mockInventory.items = [{
        ...consumableItem,
        quantity: 3,
        purchaseDate: new Date()
      }]
    })

    it('소비아이템을 사용하면 수량이 감소해야 함', () => {
      const result = shopService.useConsumableItem(mockInventory, consumableItem.id)

      expect(result.success).toBe(true)
      expect(result.newInventory?.items[0].quantity).toBe(2)
    })

    it('마지막 소비아이템을 사용하면 인벤토리에서 제거되어야 함', () => {
      mockInventory.items[0].quantity = 1

      const result = shopService.useConsumableItem(mockInventory, consumableItem.id)

      expect(result.success).toBe(true)
      expect(result.newInventory?.items).toHaveLength(0)
    })

    it('소비아이템이 아닌 아이템은 사용할 수 없어야 함', () => {
      const result = shopService.useConsumableItem(mockInventory, mockItem.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('사용할 수 없는 아이템입니다')
    })
  })

  describe('addCoins', () => {
    it('코인을 추가할 수 있어야 함', () => {
      const result = shopService.addCoins(mockInventory, 50)

      expect(result.coins).toBe(150)
    })
  })

  describe('spendCoins', () => {
    it('충분한 코인이 있을 때 사용할 수 있어야 함', () => {
      const result = shopService.spendCoins(mockInventory, 30)

      expect(result.success).toBe(true)
      expect(result.newInventory?.coins).toBe(70)
    })

    it('코인이 부족할 때 사용할 수 없어야 함', () => {
      const result = shopService.spendCoins(mockInventory, 150)

      expect(result.success).toBe(false)
      expect(result.error).toBe('코인이 부족합니다')
    })
  })

  describe('calculateTotalStatBonus', () => {
    it('장착된 아이템들의 스탯 보너스를 합산해야 함', () => {
      const weapon = DEFAULT_SHOP_ITEMS.find(item => item.id === 'sword_basic')!
      const armor = DEFAULT_SHOP_ITEMS.find(item => item.id === 'armor_leather')!

      mockInventory.items = [
        { ...weapon, quantity: 1, purchaseDate: new Date(), isEquipped: true },
        { ...armor, quantity: 1, purchaseDate: new Date(), isEquipped: true }
      ]
      mockInventory.equippedItems = {
        weapon: weapon.id,
        armor: armor.id
      }

      const totalBonus = shopService.calculateTotalStatBonus(mockInventory)

      expect(totalBonus.health).toBe(13) // 5 + 8
      expect(totalBonus.learning).toBe(2) // 0 + 2
      expect(totalBonus.achievement).toBe(3) // 3 + 0
    })
  })
})
