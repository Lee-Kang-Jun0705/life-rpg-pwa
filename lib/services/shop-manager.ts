/**
 * ShopManager - 상점 시스템 관리자
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 트랜잭션 보장 - 구매/판매 원자성
 * - 확장성 - 새로운 아이템 타입 추가 가능
 */

import { gameStateManager } from './game-state-manager'
import { levelSyncService } from './level-sync.service'
import { transactionManager } from './transaction-manager'
import { inventoryManager } from './inventory-manager'
import { PREDEFINED_MUTEXES, withMutex } from '@/lib/utils/async-mutex'
import { SHOP_CONFIG } from '@/lib/config/balancing-config'
import { STORAGE_KEYS, GAME_EVENTS } from '@/lib/config/game-constants'

// 아이템 타입
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'skill_book' | 'material'

// 아이템 희귀도
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// 기본 아이템 인터페이스
export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  level: number
  price: number
  sellPrice: number
  stackable: boolean
  maxStack: number
  stats?: ItemStats
  effects?: ItemEffect[]
  requirements?: ItemRequirement[]
  iconUrl?: string
}

// 아이템 스탯
export interface ItemStats {
  attack?: number
  defense?: number
  magicPower?: number
  magicResist?: number
  hp?: number
  mp?: number
  speed?: number
  criticalRate?: number
}

// 아이템 효과
export interface ItemEffect {
  type: 'heal' | 'buff' | 'damage' | 'status_cure'
  value: number
  duration?: number
  target: 'self' | 'enemy' | 'all_enemies' | 'all_allies'
}

// 아이템 요구사항
export interface ItemRequirement {
  type: 'level' | 'stat' | 'item'
  requirement: string | number
  value?: number
}

// 상점 아이템
export interface ShopItem {
  item: Item
  stock: number // -1이면 무한
  discount: number // 0~1 (0.2 = 20% 할인)
  isNew: boolean
  isFeatured: boolean
}

// 상점 상태
export interface ShopState {
  id: string
  items: ShopItem[]
  lastRefresh: number
  nextRefreshTime: number
  refreshCount: number
  playerGold: number
}

// 구매 결과
export interface PurchaseResult {
  success: boolean
  item?: Item
  quantity?: number
  totalCost?: number
  error?: string
  remainingGold?: number
}

// 판매 결과
export interface SellResult {
  success: boolean
  item?: Item
  quantity?: number
  totalEarned?: number
  error?: string
  newGold?: number
}

// 설정 상수
const CONFIG = {
  SHOP_ID: 'main_shop',
  BASE_ITEM_COUNT: 12,
  FEATURED_ITEM_COUNT: 3,
  NEW_ITEM_COUNT: 2,
  REFRESH_COST: 100,
  MAX_DAILY_REFRESHES: 3,
  STOCK_RANGE: { min: 1, max: 10 },
  DISCOUNT_CHANCE: 0.2,
  DISCOUNT_RANGE: { min: 0.1, max: 0.3 }
} as const

export class ShopManager {
  private static instance: ShopManager | null = null
  private currentShop: ShopState | null = null
  private itemDatabase: Map<string, Item> = new Map()
  
  // 통계
  private stats = {
    totalPurchases: 0,
    totalSales: 0,
    goldSpent: 0,
    goldEarned: 0,
    itemsPurchased: new Map<string, number>(),
    itemsSold: new Map<string, number>(),
    refreshCount: 0
  }
  
  private constructor() {
    this.initializeItemDatabase()
    this.loadShopState()
  }
  
  static getInstance(): ShopManager {
    if (!ShopManager.instance) {
      ShopManager.instance = new ShopManager()
    }
    return ShopManager.instance
  }
  
  /**
   * 아이템 데이터베이스 초기화
   */
  private initializeItemDatabase(): void {
    // 기본 아이템들 추가
    const baseItems: Item[] = [
      // 무기
      {
        id: 'item_sword_basic',
        name: '기본 검',
        description: '평범한 철제 검입니다.',
        type: 'weapon',
        rarity: 'common',
        level: 1,
        price: 100,
        sellPrice: 50,
        stackable: false,
        maxStack: 1,
        stats: { attack: 5 }
      },
      {
        id: 'item_sword_iron',
        name: '철제 검',
        description: '단단한 철로 만든 검입니다.',
        type: 'weapon',
        rarity: 'uncommon',
        level: 5,
        price: 500,
        sellPrice: 250,
        stackable: false,
        maxStack: 1,
        stats: { attack: 12 }
      },
      
      // 방어구
      {
        id: 'item_armor_leather',
        name: '가죽 갑옷',
        description: '가벼운 가죽 갑옷입니다.',
        type: 'armor',
        rarity: 'common',
        level: 1,
        price: 150,
        sellPrice: 75,
        stackable: false,
        maxStack: 1,
        stats: { defense: 3, hp: 20 }
      },
      {
        id: 'item_armor_chain',
        name: '사슬 갑옷',
        description: '튼튼한 사슬로 만든 갑옷입니다.',
        type: 'armor',
        rarity: 'uncommon',
        level: 5,
        price: 600,
        sellPrice: 300,
        stackable: false,
        maxStack: 1,
        stats: { defense: 8, hp: 50 }
      },
      
      // 액세서리
      {
        id: 'item_ring_power',
        name: '힘의 반지',
        description: '착용자의 힘을 증가시킵니다.',
        type: 'accessory',
        rarity: 'uncommon',
        level: 3,
        price: 400,
        sellPrice: 200,
        stackable: false,
        maxStack: 1,
        stats: { attack: 3 }
      },
      {
        id: 'item_amulet_protection',
        name: '보호의 목걸이',
        description: '마법 저항력을 높여줍니다.',
        type: 'accessory',
        rarity: 'rare',
        level: 7,
        price: 800,
        sellPrice: 400,
        stackable: false,
        maxStack: 1,
        stats: { magicResist: 10, hp: 30 }
      },
      
      // 소모품
      {
        id: 'item_potion_hp_small',
        name: '작은 체력 포션',
        description: 'HP를 50 회복합니다.',
        type: 'consumable',
        rarity: 'common',
        level: 1,
        price: 50,
        sellPrice: 25,
        stackable: true,
        maxStack: 99,
        effects: [{ type: 'heal', value: 50, target: 'self' }]
      },
      {
        id: 'item_potion_hp_medium',
        name: '중간 체력 포션',
        description: 'HP를 150 회복합니다.',
        type: 'consumable',
        rarity: 'common',
        level: 5,
        price: 150,
        sellPrice: 75,
        stackable: true,
        maxStack: 99,
        effects: [{ type: 'heal', value: 150, target: 'self' }]
      },
      {
        id: 'item_potion_mp_small',
        name: '작은 마나 포션',
        description: 'MP를 30 회복합니다.',
        type: 'consumable',
        rarity: 'common',
        level: 1,
        price: 60,
        sellPrice: 30,
        stackable: true,
        maxStack: 99,
        effects: [{ type: 'heal', value: 30, target: 'self' }]
      },
      
      // 스킬북
      {
        id: 'item_skillbook_fireball',
        name: '파이어볼 스킬북',
        description: '파이어볼 스킬을 배울 수 있습니다.',
        type: 'skill_book',
        rarity: 'uncommon',
        level: 3,
        price: 1000,
        sellPrice: 500,
        stackable: false,
        maxStack: 1,
        requirements: [{ type: 'level', requirement: 3 }]
      },
      {
        id: 'item_skillbook_heal',
        name: '힐 스킬북',
        description: '힐 스킬을 배울 수 있습니다.',
        type: 'skill_book',
        rarity: 'rare',
        level: 5,
        price: 1500,
        sellPrice: 750,
        stackable: false,
        maxStack: 1,
        requirements: [{ type: 'level', requirement: 5 }]
      }
    ]
    
    // 데이터베이스에 추가
    baseItems.forEach(item => {
      this.itemDatabase.set(item.id, item)
    })
  }
  
  /**
   * 상점 상태 로드
   */
  private loadShopState(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOP_STATE)
      if (saved) {
        this.currentShop = JSON.parse(saved)
        
        // 새로고침 시간 확인
        if (this.currentShop && Date.now() >= this.currentShop.nextRefreshTime) {
          this.refreshShop()
        }
      } else {
        this.initializeShop()
      }
    } catch (error) {
      console.error('[ShopManager] Failed to load shop state:', error)
      this.initializeShop()
    }
  }
  
  /**
   * 상점 초기화
   */
  private initializeShop(): void {
    const now = Date.now()
    
    this.currentShop = {
      id: CONFIG.SHOP_ID,
      items: this.generateShopItems(),
      lastRefresh: now,
      nextRefreshTime: now + SHOP_CONFIG.INVENTORY.REFRESH_INTERVAL,
      refreshCount: 0,
      playerGold: 0
    }
    
    this.saveShopState()
  }
  
  /**
   * 상점 아이템 생성
   */
  private generateShopItems(): ShopItem[] {
    const playerLevel = levelSyncService.getLevel()
    const levelRange = SHOP_CONFIG.INVENTORY.LEVEL_RANGE
    const minLevel = Math.max(1, playerLevel - levelRange)
    const maxLevel = playerLevel + levelRange
    
    // 레벨 범위에 맞는 아이템 필터링
    const availableItems = Array.from(this.itemDatabase.values()).filter(item => 
      item.level >= minLevel && item.level <= maxLevel
    )
    
    // 카테고리별로 분류
    const itemsByType = new Map<ItemType, Item[]>()
    availableItems.forEach(item => {
      const list = itemsByType.get(item.type) || []
      list.push(item)
      itemsByType.set(item.type, list)
    })
    
    const shopItems: ShopItem[] = []
    
    // 보장된 슬롯 채우기
    const guaranteedSlots = SHOP_CONFIG.INVENTORY.GUARANTEED_SLOTS
    
    // 포션 슬롯
    const potions = itemsByType.get('consumable') || []
    for (let i = 0; i < guaranteedSlots.POTION && i < potions.length; i++) {
      shopItems.push(this.createShopItem(potions[i]))
    }
    
    // 장비 슬롯
    const equipment = [
      ...(itemsByType.get('weapon') || []),
      ...(itemsByType.get('armor') || []),
      ...(itemsByType.get('accessory') || [])
    ]
    for (let i = 0; i < guaranteedSlots.EQUIPMENT && i < equipment.length; i++) {
      shopItems.push(this.createShopItem(equipment[i]))
    }
    
    // 스킬북 슬롯
    const skillBooks = itemsByType.get('skill_book') || []
    for (let i = 0; i < guaranteedSlots.SKILL_BOOK && i < skillBooks.length; i++) {
      shopItems.push(this.createShopItem(skillBooks[i]))
    }
    
    // 나머지 슬롯 랜덤 채우기
    const remainingSlots = CONFIG.BASE_ITEM_COUNT - shopItems.length
    const remainingItems = availableItems.filter(item => 
      !shopItems.some(si => si.item.id === item.id)
    )
    
    for (let i = 0; i < remainingSlots && i < remainingItems.length; i++) {
      const randomItem = remainingItems[Math.floor(Math.random() * remainingItems.length)]
      shopItems.push(this.createShopItem(randomItem))
    }
    
    // 특별 아이템 표시
    this.markSpecialItems(shopItems)
    
    return shopItems
  }
  
  /**
   * 상점 아이템 생성
   */
  private createShopItem(item: Item): ShopItem {
    const isStackable = item.stackable
    const stock = isStackable ? 
      Math.floor(Math.random() * (CONFIG.STOCK_RANGE.max - CONFIG.STOCK_RANGE.min + 1)) + CONFIG.STOCK_RANGE.min :
      1
    
    const hasDiscount = Math.random() < CONFIG.DISCOUNT_CHANCE
    const discount = hasDiscount ?
      Math.random() * (CONFIG.DISCOUNT_RANGE.max - CONFIG.DISCOUNT_RANGE.min) + CONFIG.DISCOUNT_RANGE.min :
      0
    
    return {
      item,
      stock,
      discount,
      isNew: false,
      isFeatured: false
    }
  }
  
  /**
   * 특별 아이템 표시
   */
  private markSpecialItems(items: ShopItem[]): void {
    // 추천 아이템
    const featured = Math.min(CONFIG.FEATURED_ITEM_COUNT, items.length)
    for (let i = 0; i < featured; i++) {
      const randomIndex = Math.floor(Math.random() * items.length)
      items[randomIndex].isFeatured = true
    }
    
    // 신규 아이템
    const newItems = Math.min(CONFIG.NEW_ITEM_COUNT, items.length)
    for (let i = 0; i < newItems; i++) {
      const randomIndex = Math.floor(Math.random() * items.length)
      items[randomIndex].isNew = true
    }
  }
  
  /**
   * 상점 새로고침
   */
  async refreshShop(force = false): Promise<boolean> {
    if (!this.currentShop) return false
    
    // 강제가 아니면 비용 확인
    if (!force) {
      const refreshCost = CONFIG.REFRESH_COST * (this.currentShop.refreshCount + 1)
      
      if (this.currentShop.playerGold < refreshCost) {
        console.log('[ShopManager] Not enough gold to refresh')
        return false
      }
      
      if (this.currentShop.refreshCount >= CONFIG.MAX_DAILY_REFRESHES) {
        console.log('[ShopManager] Daily refresh limit reached')
        return false
      }
      
      // 골드 차감
      this.currentShop.playerGold -= refreshCost
      this.currentShop.refreshCount++
    }
    
    // 새 아이템 생성
    this.currentShop.items = this.generateShopItems()
    this.currentShop.lastRefresh = Date.now()
    
    if (!force) {
      this.stats.refreshCount++
    }
    
    // 저장
    this.saveShopState()
    
    // 이벤트 발생
    window.dispatchEvent(new CustomEvent(GAME_EVENTS.SHOP_REFRESHED, {
      detail: { shopId: this.currentShop.id, items: this.currentShop.items }
    }))
    
    console.log('[ShopManager] Shop refreshed')
    return true
  }
  
  /**
   * 아이템 구매
   */
  async purchaseItem(
    itemId: string,
    quantity = 1
  ): Promise<PurchaseResult> {
    return withMutex(PREDEFINED_MUTEXES.shop, async () => {
      if (!this.currentShop) {
        return { success: false, error: '상점이 초기화되지 않았습니다.' }
      }
      
      // 상점 아이템 찾기
      const shopItem = this.currentShop.items.find(si => si.item.id === itemId)
      if (!shopItem) {
        return { success: false, error: '해당 아이템을 찾을 수 없습니다.' }
      }
      
      // 재고 확인
      if (shopItem.stock !== -1 && shopItem.stock < quantity) {
        return { success: false, error: '재고가 부족합니다.' }
      }
      
      // 요구사항 확인
      if (!this.checkRequirements(shopItem.item)) {
        return { success: false, error: '아이템 요구사항을 충족하지 못했습니다.' }
      }
      
      // 가격 계산
      const basePrice = shopItem.item.price
      const discountedPrice = Math.floor(basePrice * (1 - shopItem.discount))
      const totalCost = discountedPrice * quantity
      
      // 골드 확인
      const playerGold = await this.getPlayerGold()
      if (playerGold < totalCost) {
        return { success: false, error: '골드가 부족합니다.' }
      }
      
      // 트랜잭션으로 구매 처리
      const result = await transactionManager.executeTransaction([
        {
          id: 'deduct_gold',
          description: '골드 차감',
          execute: async () => {
            await this.updatePlayerGold(-totalCost)
          },
          rollback: async () => {
            await this.updatePlayerGold(totalCost)
          }
        },
        {
          id: 'add_item',
          description: '아이템 추가',
          execute: async () => {
            const added = await inventoryManager.addItem(shopItem.item.id, quantity, 'purchase')
            if (!added) {
              throw new Error('인벤토리가 가득 찼습니다.')
            }
          },
          rollback: async () => {
            await inventoryManager.removeItem(shopItem.item.id, quantity, 'purchase_rollback')
          }
        },
        {
          id: 'update_stock',
          description: '재고 업데이트',
          execute: async () => {
            if (shopItem.stock !== -1) {
              shopItem.stock -= quantity
            }
          },
          rollback: async () => {
            if (shopItem.stock !== -1) {
              shopItem.stock += quantity
            }
          }
        }
      ])
      
      if (result.success) {
        // 통계 업데이트
        this.stats.totalPurchases++
        this.stats.goldSpent += totalCost
        this.stats.itemsPurchased.set(
          itemId,
          (this.stats.itemsPurchased.get(itemId) || 0) + quantity
        )
        
        // 저장
        this.saveShopState()
        
        return {
          success: true,
          item: shopItem.item,
          quantity,
          totalCost,
          remainingGold: playerGold - totalCost
        }
      } else {
        return {
          success: false,
          error: '구매 처리 중 오류가 발생했습니다.'
        }
      }
    })
  }
  
  /**
   * 아이템 판매
   */
  async sellItem(
    itemId: string,
    quantity = 1
  ): Promise<SellResult> {
    return withMutex(PREDEFINED_MUTEXES.shop, async () => {
      // 아이템 정보 가져오기
      const item = this.itemDatabase.get(itemId)
      if (!item) {
        return { success: false, error: '알 수 없는 아이템입니다.' }
      }
      
      // 인벤토리에서 아이템 확인
      const hasItem = inventoryManager.hasItem(itemId, quantity)
      if (!hasItem) {
        return { success: false, error: '아이템이 부족합니다.' }
      }
      
      // 판매 가격 계산
      const totalEarned = item.sellPrice * quantity
      
      // 트랜잭션으로 판매 처리
      const result = await transactionManager.executeTransaction([
        {
          id: 'remove_item',
          description: '아이템 제거',
          execute: async () => {
            const removed = await inventoryManager.removeItem(itemId, quantity, 'sold')
            if (!removed) {
              throw new Error('아이템 제거에 실패했습니다.')
            }
          },
          rollback: async () => {
            await inventoryManager.addItem(itemId, quantity, 'sell_rollback')
          }
        },
        {
          id: 'add_gold',
          description: '골드 추가',
          execute: async () => {
            await this.updatePlayerGold(totalEarned)
          },
          rollback: async () => {
            await this.updatePlayerGold(-totalEarned)
          }
        }
      ])
      
      if (result.success) {
        // 통계 업데이트
        this.stats.totalSales++
        this.stats.goldEarned += totalEarned
        this.stats.itemsSold.set(
          itemId,
          (this.stats.itemsSold.get(itemId) || 0) + quantity
        )
        
        const newGold = await this.getPlayerGold()
        
        return {
          success: true,
          item,
          quantity,
          totalEarned,
          newGold
        }
      } else {
        return {
          success: false,
          error: '판매 처리 중 오류가 발생했습니다.'
        }
      }
    })
  }
  
  /**
   * 요구사항 확인
   */
  private checkRequirements(item: Item): boolean {
    if (!item.requirements) return true
    
    const playerLevel = levelSyncService.getLevel()
    
    for (const req of item.requirements) {
      switch (req.type) {
        case 'level':
          if (playerLevel < (req.requirement as number)) {
            return false
          }
          break
          
        case 'stat':
          // TODO: 스탯 요구사항 확인
          break
          
        case 'item':
          // TODO: 아이템 요구사항 확인
          break
      }
    }
    
    return true
  }
  
  /**
   * 플레이어 골드 가져오기
   */
  private async getPlayerGold(): Promise<number> {
    // TODO: 실제 플레이어 골드 가져오기
    return this.currentShop?.playerGold || 1000
  }
  
  /**
   * 플레이어 골드 업데이트
   */
  private async updatePlayerGold(amount: number): Promise<void> {
    if (!this.currentShop) return
    
    this.currentShop.playerGold = Math.max(0, this.currentShop.playerGold + amount)
    this.saveShopState()
  }
  
  /**
   * 상점 상태 저장
   */
  private saveShopState(): void {
    if (!this.currentShop) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_STATE, JSON.stringify(this.currentShop))
    } catch (error) {
      console.error('[ShopManager] Failed to save shop state:', error)
    }
  }
  
  /**
   * 상점 열기
   */
  async openShop(): Promise<boolean> {
    // 게임 상태 변경
    if (!await gameStateManager.transitionTo('shopping')) {
      console.error('[ShopManager] Cannot open shop - state transition failed')
      return false
    }
    
    // 현재 골드 업데이트
    this.currentShop!.playerGold = await this.getPlayerGold()
    
    console.log('[ShopManager] Shop opened')
    return true
  }
  
  /**
   * 상점 닫기
   */
  async closeShop(): Promise<void> {
    await gameStateManager.transitionTo('idle')
    console.log('[ShopManager] Shop closed')
  }
  
  // 공개 메서드들
  
  /**
   * 현재 상점 상태 가져오기
   */
  getShopState(): ShopState | null {
    return this.currentShop
  }
  
  /**
   * 아이템 정보 가져오기
   */
  getItem(itemId: string): Item | null {
    return this.itemDatabase.get(itemId) || null
  }
  
  /**
   * 모든 아이템 가져오기
   */
  getAllItems(): Item[] {
    return Array.from(this.itemDatabase.values())
  }
  
  /**
   * 아이템 등록 (확장용)
   */
  registerItem(item: Item): void {
    this.itemDatabase.set(item.id, item)
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return { 
      ...this.stats,
      itemsPurchased: new Map(this.stats.itemsPurchased),
      itemsSold: new Map(this.stats.itemsSold)
    }
  }
  
  /**
   * 디버그 정보
   */
  debug(): void {
    console.log('[ShopManager] Debug Info:')
    console.log('- Current Shop:', this.currentShop)
    console.log('- Item Database Size:', this.itemDatabase.size)
    console.log('- Stats:', this.stats)
  }
}

// 전역 인스턴스 export
export const shopManager = ShopManager.getInstance()