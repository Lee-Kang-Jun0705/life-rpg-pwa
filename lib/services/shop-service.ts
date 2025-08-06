import { shops } from '../data/shops'
import { ShopData, ShopItem, ShopState, PurchaseHistory, SHOP_CONSTANTS } from '../types/shop.types'
import { inventoryService } from './inventory-service'
import { skillService } from './skill-service'
import { Equipment } from '../types/equipment.types'
import { useUserStore } from '../stores/userStore'
import { safeLocalStorage } from '@/lib/utils/storage'

const SHOP_STORAGE_KEY = 'life-rpg-shop-state'

class ShopService {
  private state: ShopState = {
    shops: {},
    purchaseHistory: [],
    lastVisit: Date.now()
  }

  constructor() {
    this.loadState()
    this.initializeShops()
  }

  private loadState(): void {
    try {
      const saved = safeLocalStorage.getItem(SHOP_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        this.state = {
          ...this.state,
          ...parsed
        }
      }
    } catch (error) {
      console.error('Failed to load shop state:', error)
    }
  }

  private saveState(): void {
    try {
      safeLocalStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(this.state))
    } catch (error) {
      console.error('Failed to save shop state:', error)
    }
  }

  private initializeShops(): void {
    // 기본 상점 데이터로 초기화
    Object.entries(shops).forEach(([shopId, shopData]) => {
      if (!this.state.shops[shopId]) {
        this.state.shops[shopId] = {
          ...shopData,
          lastRefresh: Date.now()
        }
      }
    })
    
    // 갱신이 필요한 상점 확인
    this.checkAndRefreshShops()
    this.saveState()
  }

  private checkAndRefreshShops(): void {
    const now = Date.now()
    
    Object.values(this.state.shops).forEach(shop => {
      if (shop.refreshInterval && shop.lastRefresh) {
        const timeSinceRefresh = now - shop.lastRefresh
        if (timeSinceRefresh >= shop.refreshInterval) {
          this.refreshShop(shop.id)
        }
      }
    })
  }

  private refreshShop(shopId: string): void {
    const shop = this.state.shops[shopId]
    if (!shop) return

    // 특별 상점의 경우 랜덤하게 아이템 선택
    if (shop.type === 'special' || shop.type === 'event') {
      // 여기서는 간단하게 원본 데이터를 사용하지만,
      // 실제로는 더 복잡한 로직으로 랜덤 아이템을 생성할 수 있습니다
      const originalShop = shops[shopId]
      if (originalShop) {
        shop.items = [...originalShop.items]
        shop.lastRefresh = Date.now()
      }
    }
    
    this.saveState()
  }

  getAvailableShops(userId: string): ShopData[] {
    const user = useUserStore.getState().user
    const userLevel = user?.level || 1
    
    this.checkAndRefreshShops()
    
    return Object.values(this.state.shops).filter(shop => {
      // 잠금 조건 확인
      if (shop.unlockConditions) {
        if (shop.unlockConditions.level && userLevel < shop.unlockConditions.level) {
          return false
        }
        // 퀘스트나 업적 조건도 여기서 확인 가능
      }
      return true
    })
  }

  getShop(shopId: string): ShopData | null {
    this.checkAndRefreshShops()
    return this.state.shops[shopId] || null
  }

  getAvailableItems(shopId: string, userId: string): ShopItem[] {
    const shop = this.getShop(shopId)
    if (!shop) return []
    
    const user = useUserStore.getState().user
    const userLevel = user?.level || 1
    
    return shop.items.filter(item => {
      // 재고 확인
      if (item.stock !== undefined && item.stock === 0) {
        return false
      }
      
      // 요구 사항 확인
      if (item.requirements) {
        if (item.requirements.level && userLevel < item.requirements.level) {
          return false
        }
        // 퀘스트나 업적 요구사항도 여기서 확인 가능
      }
      
      // 스킬북의 경우 이미 배운 스킬인지 확인
      if (item.type === 'skill' && item.itemData?.skillId) {
        const playerSkills = skillService.getPlayerSkills(userId)
        if (playerSkills.learned[item.itemData.skillId]) {
          return false
        }
      }
      
      return true
    })
  }

  calculatePrice(item: ShopItem, userId: string): number {
    const user = useUserStore.getState().user
    const userLevel = user?.level || 1
    let price = item.price
    
    // 레벨 기반 할인 적용
    const discountTiers = Object.values(SHOP_CONSTANTS.DISCOUNT_TIERS).sort((a, b) => b.minLevel - a.minLevel)
    for (const tier of discountTiers) {
      if (userLevel >= tier.minLevel) {
        price = Math.floor(price * (1 - tier.discount))
        break
      }
    }
    
    return price
  }

  canPurchase(shopId: string, itemId: string, userId: string, quantity: number = 1): { canPurchase: boolean; reason?: string } {
    const shop = this.getShop(shopId)
    if (!shop) {
      return { canPurchase: false, reason: '상점을 찾을 수 없습니다' }
    }
    
    const item = shop.items.find(i => i.id === itemId)
    if (!item) {
      return { canPurchase: false, reason: '아이템을 찾을 수 없습니다' }
    }
    
    // 재고 확인
    if (item.stock !== undefined && item.stock !== -1 && item.stock < quantity) {
      return { canPurchase: false, reason: '재고가 부족합니다' }
    }
    
    // 가격 확인
    const user = useUserStore.getState().user
    const totalPrice = this.calculatePrice(item, userId) * quantity
    if (!user || user.coins < totalPrice) {
      return { canPurchase: false, reason: '코인이 부족합니다' }
    }
    
    // 요구 사항 확인
    if (item.requirements) {
      if (item.requirements.level && user.level < item.requirements.level) {
        return { canPurchase: false, reason: `레벨 ${item.requirements.level} 이상이어야 합니다` }
      }
    }
    
    // 스킬북의 경우 이미 배운 스킬인지 확인
    if (item.type === 'skill' && item.itemData?.skillId) {
      const playerSkills = skillService.getPlayerSkills(userId)
      if (playerSkills.learned[item.itemData.skillId]) {
        return { canPurchase: false, reason: '이미 배운 스킬입니다' }
      }
    }
    
    return { canPurchase: true }
  }

  purchaseItem(shopId: string, itemId: string, userId: string, quantity: number = 1): boolean {
    const canPurchaseResult = this.canPurchase(shopId, itemId, userId, quantity)
    if (!canPurchaseResult.canPurchase) {
      console.error(canPurchaseResult.reason)
      return false
    }
    
    const shop = this.state.shops[shopId]
    const item = shop.items.find(i => i.id === itemId)!
    const totalPrice = this.calculatePrice(item, userId) * quantity
    
    // 코인 차감
    const { spendCoins } = useUserStore.getState()
    spendCoins(totalPrice)
    
    // 아이템 타입에 따른 처리
    switch (item.type) {
      case 'equipment':
        // 장비 아이템 추가
        for (let i = 0; i < quantity; i++) {
          // itemData가 있으면 itemData.id 사용, 없으면 item.id 사용
          const itemIdToAdd = item.itemData?.id || item.id
          const success = inventoryService.addItem(userId, itemIdToAdd, 1)
          if (!success) {
            console.error('Failed to add equipment to inventory')
            return false
          }
        }
        break
        
      case 'skill':
        // 스킬 학습
        if (item.itemData?.skillId) {
          skillService.learnSkill(userId, item.itemData.skillId)
        }
        break
        
      case 'consumable':
        // 소모품 추가
        const consumableId = item.itemData?.id || item.id
        const success = inventoryService.addItem(userId, consumableId, quantity)
        if (!success) {
          console.error('Failed to add consumable to inventory')
          return false
        }
        break
        
      case 'special':
        // 특수 아이템은 나중에 구현
        console.log('특수 아이템 구매:', item, quantity)
        break
    }
    
    // 재고 감소
    if (item.stock !== undefined && item.stock !== -1) {
      item.stock -= quantity
    }
    
    // 구매 기록 추가
    const purchaseRecord: PurchaseHistory = {
      shopId,
      itemId,
      quantity,
      totalPrice,
      purchasedAt: Date.now()
    }
    this.state.purchaseHistory.push(purchaseRecord)
    
    this.saveState()
    
    // 인벤토리 업데이트 이벤트 발생
    const eventItemId = item.itemData?.id || item.id
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-updated', {
        detail: { 
          userId, 
          itemId: eventItemId, 
          quantity 
        }
      }))
    }
    
    return true
  }

  getPurchaseHistory(userId: string): PurchaseHistory[] {
    return this.state.purchaseHistory
  }

  getTimeUntilRefresh(shopId: string): number | null {
    const shop = this.state.shops[shopId]
    if (!shop || !shop.refreshInterval || !shop.lastRefresh) {
      return null
    }
    
    const now = Date.now()
    const nextRefresh = shop.lastRefresh + shop.refreshInterval
    return Math.max(0, nextRefresh - now)
  }
}

export const shopService = new ShopService()