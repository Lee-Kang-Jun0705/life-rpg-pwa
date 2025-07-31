/**
 * 인벤토리 관리 서비스
 * 아이템 저장, 정렬, 필터링, 장착 관리
 */

import type { 
  GeneratedItem, 
  InventoryItem, 
  ItemFilter, 
  ItemSortOption,
  ItemType,
  ItemRarity,
  ItemComparison,
  StatType
} from '../types/item-system'
import { INVENTORY_CONFIG } from '../constants/game.constants'
import { soundService } from './sound.service'

export type EquipmentSlot = 
  | 'weapon'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'accessory1'
  | 'accessory2'
  | 'accessory3'

export interface Equipment {
  readonly [key: string]: GeneratedItem | null
  readonly weapon: GeneratedItem | null
  readonly helmet: GeneratedItem | null
  readonly armor: GeneratedItem | null
  readonly gloves: GeneratedItem | null
  readonly boots: GeneratedItem | null
  readonly accessory1: GeneratedItem | null
  readonly accessory2: GeneratedItem | null
  readonly accessory3: GeneratedItem | null
}

export interface InventoryState {
  items: InventoryItem[]
  equipment: Equipment
  maxSlots: number
  usedSlots: number
}

class InventoryService {
  private static instance: InventoryService
  private inventory: Map<string, InventoryItem> = new Map()
  private equipment: Equipment = {
    weapon: null,
    helmet: null,
    armor: null,
    gloves: null,
    boots: null,
    accessory1: null,
    accessory2: null,
    accessory3: null
  }
  private maxSlots: number = INVENTORY_CONFIG.BASE_SLOTS

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  // 아이템 추가
  addItem(item: GeneratedItem, quantity: number = 1): boolean {
    if (quantity <= 0) return false

    const existingItem = this.inventory.get(item.uniqueId)
    
    if (existingItem) {
      // 스택 가능한 아이템인 경우
      if (item.stackable && existingItem.quantity < (item.maxStack || INVENTORY_CONFIG.DEFAULT_MAX_STACK)) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          item.maxStack || INVENTORY_CONFIG.DEFAULT_MAX_STACK
        )
        
        this.inventory.set(item.uniqueId, {
          ...existingItem,
          quantity: newQuantity
        })
        return true
      }
      return false
    }

    // 인벤토리 공간 체크
    if (this.getUsedSlots() >= this.maxSlots) {
      return false
    }

    // 새 아이템 추가
    this.inventory.set(item.uniqueId, {
      item,
      quantity: item.stackable ? quantity : 1,
      equipped: false,
      locked: false,
      obtainedAt: Date.now()
    })

    // 아이템 획득 효과음 재생
    soundService.playEffect('item_pickup')

    return true
  }

  // 아이템 제거
  removeItem(uniqueId: string, quantity: number = 1): boolean {
    const inventoryItem = this.inventory.get(uniqueId)
    if (!inventoryItem) return false

    if (inventoryItem.equipped) return false // 장착된 아이템은 제거 불가

    if (inventoryItem.quantity > quantity) {
      // 수량 감소
      this.inventory.set(uniqueId, {
        ...inventoryItem,
        quantity: inventoryItem.quantity - quantity
      })
    } else {
      // 완전 제거
      this.inventory.delete(uniqueId)
    }

    return true
  }

  // 아이템 장착
  equipItem(uniqueId: string, slot?: EquipmentSlot): boolean {
    const inventoryItem = this.inventory.get(uniqueId)
    if (!inventoryItem) return false

    const item = inventoryItem.item
    const targetSlot = slot || this.getSlotForItemType(item.type)
    
    if (!targetSlot) return false

    // 현재 장착된 아이템 해제
    const currentEquipped = this.equipment[targetSlot]
    if (currentEquipped) {
      this.unequipItem(targetSlot)
    }

    // 새 아이템 장착
    this.equipment = {
      ...this.equipment,
      [targetSlot]: item
    }

    // 인벤토리에서 장착 상태 업데이트
    this.inventory.set(uniqueId, {
      ...inventoryItem,
      equipped: true
    })

    // 장착 효과음 재생
    soundService.playEffect('button_click')

    return true
  }

  // 아이템 장착 해제
  unequipItem(slot: EquipmentSlot): boolean {
    const item = this.equipment[slot]
    if (!item) return false

    // 장비 슬롯에서 제거
    this.equipment = {
      ...this.equipment,
      [slot]: null
    }

    // 인벤토리에서 장착 상태 업데이트
    const inventoryItem = this.inventory.get(item.uniqueId)
    if (inventoryItem) {
      this.inventory.set(item.uniqueId, {
        ...inventoryItem,
        equipped: false
      })
    }

    return true
  }

  // 아이템 타입에 따른 장비 슬롯 결정
  private getSlotForItemType(type: ItemType): EquipmentSlot | null {
    switch (type) {
      case 'weapon':
        return 'weapon'
      case 'armor':
        return 'armor'
      case 'accessory':
        // 빈 액세서리 슬롯 찾기
        if (!this.equipment.accessory1) return 'accessory1'
        if (!this.equipment.accessory2) return 'accessory2'
        if (!this.equipment.accessory3) return 'accessory3'
        return null
      default:
        return null
    }
  }

  // 아이템 잠금/해제
  toggleItemLock(uniqueId: string): boolean {
    const item = this.inventory.get(uniqueId)
    if (!item) return false

    this.inventory.set(uniqueId, {
      ...item,
      locked: !item.locked
    })

    return true
  }

  // 아이템 필터링
  filterItems(filter: ItemFilter): InventoryItem[] {
    const items = Array.from(this.inventory.values())

    return items.filter(invItem => {
      const item = invItem.item

      if (filter.type && !filter.type.includes(item.type)) return false
      if (filter.rarity && !filter.rarity.includes(item.rarity)) return false
      if (filter.minLevel && item.level < filter.minLevel) return false
      if (filter.maxLevel && item.level > filter.maxLevel) return false
      if (filter.hasSetBonus !== undefined && !!item.setId !== filter.hasSetBonus) return false
      if (filter.hasSpecialEffect !== undefined && 
          !!(item.specialEffects && item.specialEffects.length > 0) !== filter.hasSpecialEffect) return false

      return true
    })
  }

  // 아이템 정렬
  sortItems(items: InventoryItem[], sortBy: ItemSortOption, ascending: boolean = true): InventoryItem[] {
    const sorted = [...items].sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'name':
          compareValue = a.item.name.localeCompare(b.item.name)
          break
        case 'level':
          compareValue = a.item.level - b.item.level
          break
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary']
          compareValue = rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity)
          break
        case 'type':
          compareValue = a.item.type.localeCompare(b.item.type)
          break
        case 'value':
          compareValue = a.item.value - b.item.value
          break
        case 'power':
          compareValue = this.calculateItemPower(a.item) - this.calculateItemPower(b.item)
          break
        case 'obtainedAt':
          compareValue = a.obtainedAt - b.obtainedAt
          break
      }

      return ascending ? compareValue : -compareValue
    })

    return sorted
  }

  // 아이템 비교
  compareItems(item1: GeneratedItem, item2: GeneratedItem): ItemComparison {
    const better: Array<{ stat: StatType; difference: number }> = []
    const worse: Array<{ stat: StatType; difference: number }> = []
    const same: StatType[] = []

    // 모든 스탯 수집
    const allStats = new Set<StatType>()
    
    // 기본 스탯
    Object.entries(item1.baseStats).forEach(([stat]) => allStats.add(stat as StatType))
    Object.entries(item2.baseStats).forEach(([stat]) => allStats.add(stat as StatType))
    
    // 랜덤 스탯
    item1.randomStats.forEach(rs => allStats.add(rs.type))
    item2.randomStats.forEach(rs => allStats.add(rs.type))

    // 스탯 비교
    allStats.forEach(stat => {
      const value1 = this.getItemStatValue(item1, stat)
      const value2 = this.getItemStatValue(item2, stat)
      const difference = value1 - value2

      if (difference > 0) {
        better.push({ stat, difference })
      } else if (difference < 0) {
        worse.push({ stat, difference: Math.abs(difference) })
      } else if (value1 > 0 || value2 > 0) {
        same.push(stat)
      }
    })

    // 전체 점수 계산
    const betterScore = better.reduce((sum, b) => sum + b.difference, 0)
    const worseScore = worse.reduce((sum, w) => sum + w.difference, 0)
    const totalScore = betterScore + worseScore
    
    const overallScore = totalScore === 0 ? 0 : (betterScore - worseScore) / totalScore

    return {
      better,
      worse,
      same,
      overallScore
    }
  }

  // 아이템 스탯 합계 계산
  private getItemStatValue(item: GeneratedItem, stat: StatType): number {
    let value = 0

    // 기본 스탯
    if (stat in item.baseStats && item.baseStats[stat as keyof typeof item.baseStats] !== undefined) {
      value += item.baseStats[stat as keyof typeof item.baseStats]!
    }

    // 랜덤 스탯
    item.randomStats.forEach(rs => {
      if (rs.type === stat) {
        value += rs.value
      }
    })

    return value
  }

  // 아이템 전투력 계산
  private calculateItemPower(item: GeneratedItem): number {
    const statWeights = {
      attack: 1.5,
      defense: 1.2,
      hp: 0.2,
      mp: 0.3,
      speed: 1.0,
      critRate: 20,
      critDamage: 15,
      dodge: 10
    }

    let power = 0

    // 기본 스탯
    Object.entries(item.baseStats).forEach(([stat, value]) => {
      power += (value || 0) * (statWeights[stat as keyof typeof statWeights] || 1)
    })

    // 랜덤 스탯
    item.randomStats.forEach(rs => {
      const weight = statWeights[rs.type as keyof typeof statWeights] || 1
      power += rs.value * weight * (rs.tier / 3) // 티어 보너스
    })

    // 희귀도 보너스
    const rarityMultiplier = {
      common: 1,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2,
      legendary: 3
    }
    power *= rarityMultiplier[item.rarity]

    // 레벨 보너스
    power *= (1 + item.level / 100)

    return Math.round(power)
  }

  // 현재 사용 슬롯 수
  getUsedSlots(): number {
    return this.inventory.size
  }

  // 전체 인벤토리 상태
  getInventoryState(): InventoryState {
    return {
      items: Array.from(this.inventory.values()),
      equipment: { ...this.equipment },
      maxSlots: this.maxSlots,
      usedSlots: this.getUsedSlots()
    }
  }

  // 인벤토리 슬롯 확장
  expandInventory(slots: number): boolean {
    if (this.maxSlots + slots > INVENTORY_CONFIG.MAX_SLOTS) {
      return false
    }

    this.maxSlots += slots
    return true
  }

  // 아이템 검색
  searchItems(query: string): InventoryItem[] {
    const lowerQuery = query.toLowerCase()
    
    return Array.from(this.inventory.values()).filter(invItem => {
      const item = invItem.item
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.type.toLowerCase().includes(lowerQuery) ||
        item.rarity.toLowerCase().includes(lowerQuery)
      )
    })
  }

  // 아이템 일괄 판매
  sellItems(uniqueIds: string[]): { totalGold: number; soldCount: number } {
    let totalGold = 0
    let soldCount = 0

    uniqueIds.forEach(id => {
      const item = this.inventory.get(id)
      if (item && !item.equipped && !item.locked) {
        totalGold += item.item.value * item.quantity
        soldCount += item.quantity
        this.inventory.delete(id)
      }
    })

    return { totalGold, soldCount }
  }

  // 인벤토리 초기화
  clearInventory(): void {
    // 장착된 아이템만 유지
    const equippedItems = Array.from(this.inventory.values()).filter(item => item.equipped)
    
    this.inventory.clear()
    
    equippedItems.forEach(item => {
      this.inventory.set(item.item.uniqueId, item)
    })
  }

  // 인벤토리 데이터 복원 (영속성을 위한)
  restoreInventory(
    items: InventoryItem[], 
    equipment: Equipment, 
    maxSlots: number
  ): void {
    // 인벤토리 초기화
    this.inventory.clear()
    this.equipment = {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
      accessory3: null
    }
    this.maxSlots = maxSlots

    // 아이템 복원
    items.forEach(item => {
      this.inventory.set(item.item.uniqueId, item)
    })

    // 장비 복원
    this.equipment = { ...equipment }
  }

  // 단일 아이템 가져오기
  getItem(uniqueId: string): GeneratedItem | null {
    const invItem = this.inventory.get(uniqueId)
    return invItem ? invItem.item : null
  }

  // 모든 아이템 가져오기
  getItems(): GeneratedItem[] {
    return Array.from(this.inventory.values()).map(invItem => invItem.item)
  }

  // 아이템 업데이트
  updateItem(uniqueId: string, updates: Partial<GeneratedItem>): boolean {
    const invItem = this.inventory.get(uniqueId)
    if (!invItem) return false

    // ReadonlyArray를 일반 배열로 변환
    const updatedItem = {
      ...invItem.item,
      ...updates,
      baseStats: updates.baseStats || invItem.item.baseStats,
      randomStats: updates.randomStats ? [...updates.randomStats] : [...invItem.item.randomStats],
      specialEffects: updates.specialEffects ? [...updates.specialEffects] : 
        (invItem.item.specialEffects ? [...invItem.item.specialEffects] : undefined)
    } as GeneratedItem

    this.inventory.set(uniqueId, {
      ...invItem,
      item: updatedItem
    })

    return true
  }
}

export const inventoryService = InventoryService.getInstance()