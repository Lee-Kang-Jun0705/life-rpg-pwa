// 인벤토리 관리 서비스
import type { 
  Item, 
  InventorySlot, 
  PlayerInventory, 
  EquippedGear, 
  EquipmentItem,
  EquipmentSlot,
  ItemFilterOptions,
  ItemSortOptions
} from '@/lib/types/inventory'
import { 
  isEquipmentItem, 
  isStackableItem, 
  canEquipItem,
  INVENTORY_CONSTANTS 
} from '@/lib/types/inventory'
import { getItemById } from '@/lib/data/items'
import { PlayerBehaviorService } from './player-behavior.service'

const STORAGE_KEY = 'life-rpg-inventory'
const EQUIPMENT_KEY = 'life-rpg-equipment'

class InventoryService {
  private static instance: InventoryService

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  // 인벤토리 초기화 또는 불러오기
  getInventory(userId: string): PlayerInventory {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${userId}`)
      if (saved) {
        const data = JSON.parse(saved)
        // Date 객체 복원
        data.slots = data.slots.map((slot: any) => ({
          ...slot,
          obtainedAt: new Date(slot.obtainedAt)
        }))
        return data
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }

    // 기본 인벤토리 생성
    return this.createDefaultInventory(userId)
  }

  // 기본 인벤토리 생성
  private createDefaultInventory(userId: string): PlayerInventory {
    const slots: InventorySlot[] = []
    
    // 기본 슬롯 생성
    for (let i = 0; i < INVENTORY_CONSTANTS.DEFAULT_MAX_SLOTS; i++) {
      slots.push({
        slotId: i,
        item: null,
        quantity: 0,
        enhancement: 0,
        locked: false,
        obtainedAt: new Date()
      })
    }

    const inventory: PlayerInventory = {
      userId,
      slots,
      maxSlots: INVENTORY_CONSTANTS.DEFAULT_MAX_SLOTS,
      gold: 0,
      diamonds: 0
    }

    this.saveInventory(userId, inventory)
    return inventory
  }

  // 인벤토리 저장
  saveInventory(userId: string, inventory: PlayerInventory): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(inventory))
    } catch (error) {
      console.error('Failed to save inventory:', error)
    }
  }

  // 아이템 추가
  addItem(userId: string, itemId: string, quantity: number = 1): boolean {
    const inventory = this.getInventory(userId)
    const item = getItemById(itemId)
    
    if (!item) {
      console.error('Item not found:', itemId)
      return false
    }

    if (isStackableItem(item)) {
      // 스택 가능한 아이템 - 기존 슬롯에 추가 시도
      const existingSlot = inventory.slots.find(
        slot => slot.item?.id === itemId && slot.quantity < item.maxStack
      )

      if (existingSlot) {
        const availableSpace = item.maxStack - existingSlot.quantity
        const toAdd = Math.min(quantity, availableSpace)
        existingSlot.quantity += toAdd
        
        if (toAdd < quantity) {
          // 남은 수량이 있으면 새 슬롯에 추가
          return this.addItemToNewSlot(userId, inventory, item, quantity - toAdd)
        }
        
        this.saveInventory(userId, inventory)
        return true
      }
    }

    // 새 슬롯에 추가
    const result = this.addItemToNewSlot(userId, inventory, item, quantity)
    
    // 아이템 수집 행동 기록
    if (result) {
      PlayerBehaviorService.recordCollectionActivity(userId, {
        itemId: itemId,
        itemType: item.type,
        quantity: quantity,
        fromCrafting: false
      })
    }
    
    return result
  }

  // 새 슬롯에 아이템 추가
  private addItemToNewSlot(
    userId: string, 
    inventory: PlayerInventory, 
    item: Item, 
    quantity: number
  ): boolean {
    const emptySlot = inventory.slots.find(slot => slot.item === null)
    
    if (!emptySlot) {
      console.error('Inventory full')
      return false
    }

    emptySlot.item = item
    emptySlot.quantity = Math.min(quantity, item.maxStack)
    emptySlot.obtainedAt = new Date()

    this.saveInventory(userId, inventory)
    
    // 남은 수량이 있으면 재귀적으로 추가
    const remaining = quantity - emptySlot.quantity
    if (remaining > 0) {
      return this.addItem(userId, item.id, remaining)
    }
    
    return true
  }

  // 아이템 제거
  removeItem(userId: string, slotId: number, quantity: number = 1): boolean {
    const inventory = this.getInventory(userId)
    const slot = inventory.slots.find(s => s.slotId === slotId)
    
    if (!slot || !slot.item || slot.quantity < quantity) {
      return false
    }

    slot.quantity -= quantity
    
    if (slot.quantity <= 0) {
      slot.item = null
      slot.quantity = 0
      slot.enhancement = 0
    }

    this.saveInventory(userId, inventory)
    return true
  }

  // 아이템 사용
  useItem(userId: string, slotId: number): boolean {
    const inventory = this.getInventory(userId)
    const slot = inventory.slots.find(s => s.slotId === slotId)
    
    if (!slot || !slot.item || slot.item.type !== 'consumable') {
      return false
    }

    // 여기서 실제 아이템 효과를 적용해야 함
    // 일단 아이템만 제거
    return this.removeItem(userId, slotId, 1)
  }

  // 장비 장착
  equipItem(userId: string, slotId: number, targetSlot: EquipmentSlot): boolean {
    const inventory = this.getInventory(userId)
    const inventorySlot = inventory.slots.find(s => s.slotId === slotId)
    
    if (!inventorySlot || !inventorySlot.item) {
      return false
    }

    const item = inventorySlot.item
    if (!isEquipmentItem(item) || item.slot !== targetSlot) {
      return false
    }

    const equipment = this.getEquippedGear(userId)
    
    // 기존 장착 아이템이 있으면 해제
    if (equipment[targetSlot]) {
      this.unequipItem(userId, targetSlot)
    }

    // 장비 장착
    equipment[targetSlot] = {
      item,
      enhancement: inventorySlot.enhancement,
      inventorySlotId: slotId,
      equippedAt: new Date()
    }

    this.saveEquipment(userId, equipment)
    return true
  }

  // 장비 해제
  unequipItem(userId: string, slot: EquipmentSlot): boolean {
    const equipment = this.getEquippedGear(userId)
    
    if (!equipment[slot]) {
      return false
    }

    equipment[slot] = null
    this.saveEquipment(userId, equipment)
    return true
  }

  // 장착된 장비 가져오기
  getEquippedGear(userId: string): EquippedGear {
    try {
      const saved = localStorage.getItem(`${EQUIPMENT_KEY}-${userId}`)
      if (saved) {
        const data = JSON.parse(saved)
        // Date 객체 복원
        Object.keys(data).forEach(key => {
          if (data[key] && data[key].equippedAt) {
            data[key].equippedAt = new Date(data[key].equippedAt)
          }
        })
        return data
      }
    } catch (error) {
      console.error('Failed to load equipment:', error)
    }

    return {
      userId,
      weapon: null,
      armor: null,
      accessory1: null,
      accessory2: null
    }
  }

  // 장비 저장
  private saveEquipment(userId: string, equipment: EquippedGear): void {
    try {
      localStorage.setItem(`${EQUIPMENT_KEY}-${userId}`, JSON.stringify(equipment))
      // 장비 변경 이벤트 발생
      window.dispatchEvent(new Event('equipment-changed'))
    } catch (error) {
      console.error('Failed to save equipment:', error)
    }
  }

  // 골드 추가/차감
  modifyGold(userId: string, amount: number): boolean {
    const inventory = this.getInventory(userId)
    
    if (inventory.gold + amount < 0) {
      return false
    }

    inventory.gold += amount
    this.saveInventory(userId, inventory)
    return true
  }

  // 아이템 판매
  sellItem(userId: string, slotId: number, quantity: number = 1): boolean {
    const inventory = this.getInventory(userId)
    const slot = inventory.slots.find(s => s.slotId === slotId)
    
    if (!slot || !slot.item || slot.quantity < quantity) {
      return false
    }

    const totalPrice = slot.item.sellPrice * quantity
    
    if (this.removeItem(userId, slotId, quantity)) {
      this.modifyGold(userId, totalPrice)
      return true
    }

    return false
  }

  // 인벤토리 필터링
  filterItems(inventory: PlayerInventory, filter: ItemFilterOptions): InventorySlot[] {
    return inventory.slots.filter(slot => {
      if (!slot.item) return false

      if (filter.type && slot.item.type !== filter.type) return false
      if (filter.rarity && slot.item.rarity !== filter.rarity) return false
      if (filter.minLevel && slot.item.levelRequirement < filter.minLevel) return false
      if (filter.maxLevel && slot.item.levelRequirement > filter.maxLevel) return false
      if (filter.stackable !== undefined && slot.item.stackable !== filter.stackable) return false
      
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        if (
          !slot.item.name.toLowerCase().includes(searchLower) &&
          !slot.item.description.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      return true
    })
  }

  // 인벤토리 정렬
  sortItems(slots: InventorySlot[], sort: ItemSortOptions): InventorySlot[] {
    const sorted = [...slots].sort((a, b) => {
      if (!a.item && !b.item) return 0
      if (!a.item) return 1
      if (!b.item) return -1

      let comparison = 0

      switch (sort.field) {
        case 'name':
          comparison = a.item.name.localeCompare(b.item.name)
          break
        case 'level':
          comparison = a.item.levelRequirement - b.item.levelRequirement
          break
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary']
          comparison = rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity)
          break
        case 'type':
          comparison = a.item.type.localeCompare(b.item.type)
          break
        case 'obtainedAt':
          comparison = a.obtainedAt.getTime() - b.obtainedAt.getTime()
          break
        case 'value':
          comparison = a.item.sellPrice - b.item.sellPrice
          break
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  // 인벤토리 슬롯 확장
  expandInventory(userId: string, additionalSlots: number): boolean {
    const inventory = this.getInventory(userId)
    
    if (inventory.maxSlots + additionalSlots > INVENTORY_CONSTANTS.MAX_INVENTORY_SLOTS) {
      return false
    }

    // 새 슬롯 추가
    const currentMaxId = Math.max(...inventory.slots.map(s => s.slotId))
    
    for (let i = 0; i < additionalSlots; i++) {
      inventory.slots.push({
        slotId: currentMaxId + i + 1,
        item: null,
        quantity: 0,
        enhancement: 0,
        locked: false,
        obtainedAt: new Date()
      })
    }

    inventory.maxSlots += additionalSlots
    this.saveInventory(userId, inventory)
    return true
  }

  // 아이템 개수 확인
  getItemCount(userId: string, itemId: string): number {
    const inventory = this.getInventory(userId)
    return inventory.slots
      .filter(slot => slot.item?.id === itemId)
      .reduce((total, slot) => total + slot.quantity, 0)
  }

  // 빈 슬롯 개수 확인
  getEmptySlotCount(userId: string): number {
    const inventory = this.getInventory(userId)
    return inventory.slots.filter(slot => slot.item === null).length
  }
}

export const inventoryService = InventoryService.getInstance()