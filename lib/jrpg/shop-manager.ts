import type { Shop, ShopItem, ShopRefreshData } from './shop-database'
import { SHOP_DATABASE, calculatePrice, isShopUnlocked } from './shop-database'
import { jrpgDbHelpers } from './database-helpers'
import { ITEM_DATABASE } from './items-database'
import { SPECIAL_ITEMS } from './shop-database'

export class JRPGShopManager {
  private userId: string
  private playerLevel: number
  private refreshData: Map<string, ShopRefreshData> = new Map()
  
  constructor(userId: string, playerLevel: number) {
    this.userId = userId
    this.playerLevel = playerLevel
  }
  
  // 상점 데이터 로드
  async loadShopData(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress?.shopRefreshData) {
        // 저장된 새로고침 데이터 복원
        Object.entries(progress.shopRefreshData).forEach(([shopId, data]) => {
          this.refreshData.set(shopId, {
            ...data,
            lastRefresh: new Date(data.lastRefresh)
          })
        })
      }
      
      // 상점 새로고침 확인
      this.checkShopRefresh()
    } catch (error) {
      console.error('Failed to load shop data:', error)
    }
  }
  
  // 사용 가능한 상점 목록
  getAvailableShops(): Shop[] {
    return Object.values(SHOP_DATABASE).filter(shop => 
      isShopUnlocked(shop, this.playerLevel)
    )
  }
  
  // 특정 상점의 아이템 목록 (재고 포함)
  getShopItems(shopId: string): Array<ShopItem & { currentStock: number; finalPrice: number }> {
    const shop = SHOP_DATABASE[shopId]
    if (!shop) return []
    
    const refreshData = this.refreshData.get(shopId)
    
    return shop.items
      .filter(item => this.playerLevel >= item.levelRequirement)
      .map(item => {
        // 현재 재고 확인
        let currentStock = item.stock
        if (item.stock !== -1 && refreshData?.stockData) {
          currentStock = refreshData.stockData[item.itemId] ?? item.stock
        }
        
        // 최종 가격 계산 (할인 적용)
        const finalPrice = calculatePrice(item.price, shopId, item.itemId)
        
        return {
          ...item,
          currentStock,
          finalPrice
        }
      })
  }
  
  // 아이템 구매
  async purchaseItem(
    shopId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; message: string }> {
    const shop = SHOP_DATABASE[shopId]
    if (!shop) {
      return { success: false, message: '존재하지 않는 상점입니다.' }
    }
    
    const shopItem = shop.items.find(item => item.itemId === itemId)
    if (!shopItem) {
      return { success: false, message: '상점에서 판매하지 않는 아이템입니다.' }
    }
    
    // 레벨 확인
    if (this.playerLevel < shopItem.levelRequirement) {
      return { success: false, message: `레벨 ${shopItem.levelRequirement} 이상이 필요합니다.` }
    }
    
    // 재고 확인
    const refreshData = this.refreshData.get(shopId)
    if (shopItem.stock !== -1) {
      const currentStock = refreshData?.stockData?.[itemId] ?? shopItem.stock
      if (currentStock < quantity) {
        return { success: false, message: '재고가 부족합니다.' }
      }
    }
    
    // 가격 계산
    const unitPrice = calculatePrice(shopItem.price, shopId, itemId)
    const totalPrice = unitPrice * quantity
    
    // 골드 확인은 상위 컴포넌트에서 처리
    
    // 아이템 추가
    const success = await jrpgDbHelpers.addItemToInventory(this.userId, itemId, quantity)
    if (!success) {
      return { success: false, message: '아이템 추가에 실패했습니다.' }
    }
    
    // 재고 감소
    if (shopItem.stock !== -1) {
      this.updateStock(shopId, itemId, -quantity)
      await this.saveRefreshData()
    }
    
    return { 
      success: true, 
      message: `${quantity}개 구매 완료! (${totalPrice} 골드)` 
    }
  }
  
  // 아이템 판매
  async sellItem(
    itemInstanceId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; goldEarned: number; message: string }> {
    // 인벤토리에서 아이템 확인
    const inventory = await jrpgDbHelpers.getJRPGInventory(this.userId)
    if (!inventory) {
      return { success: false, goldEarned: 0, message: '인벤토리를 불러올 수 없습니다.' }
    }
    
    const item = inventory.items.find(i => i.id === itemInstanceId)
    if (!item) {
      return { success: false, goldEarned: 0, message: '아이템을 찾을 수 없습니다.' }
    }
    
    if (item.quantity < quantity) {
      return { success: false, goldEarned: 0, message: '수량이 부족합니다.' }
    }
    
    // 장착 중인 아이템은 판매 불가
    if (item.equippedBy) {
      return { success: false, goldEarned: 0, message: '장착 중인 아이템은 판매할 수 없습니다.' }
    }
    
    // 아이템 정의 확인
    const itemDef = ITEM_DATABASE[item.itemId] || SPECIAL_ITEMS[item.itemId]
    if (!itemDef) {
      return { success: false, goldEarned: 0, message: '아이템 정보를 찾을 수 없습니다.' }
    }
    
    // 판매 가격 계산 (강화 보너스 포함)
    let sellPrice = itemDef.sellPrice || Math.floor(itemDef.price * 0.5)
    if (item.enhancement) {
      sellPrice = Math.floor(sellPrice * (1 + item.enhancement * 0.1))
    }
    const totalGold = sellPrice * quantity
    
    // 아이템 제거
    const success = await jrpgDbHelpers.removeItemFromInventory(this.userId, itemInstanceId, quantity)
    if (!success) {
      return { success: false, goldEarned: 0, message: '아이템 판매에 실패했습니다.' }
    }
    
    return {
      success: true,
      goldEarned: totalGold,
      message: `${itemDef.name} ${quantity}개를 ${totalGold} 골드에 판매했습니다.`
    }
  }
  
  // 상점 새로고침 확인
  private checkShopRefresh(): void {
    const now = new Date()
    
    Object.values(SHOP_DATABASE).forEach(shop => {
      if (shop.refreshTime === 'never') return
      
      const refreshData = this.refreshData.get(shop.id)
      const lastRefresh = refreshData?.lastRefresh || new Date(0)
      
      let shouldRefresh = false
      
      if (shop.refreshTime === 'daily') {
        // 자정 기준 새로고침
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const lastRefreshDay = new Date(lastRefresh.getFullYear(), lastRefresh.getMonth(), lastRefresh.getDate())
        shouldRefresh = today > lastRefreshDay
      } else if (shop.refreshTime === 'weekly') {
        // 일주일마다 새로고침
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        shouldRefresh = lastRefresh < weekAgo
      }
      
      if (shouldRefresh) {
        this.refreshShop(shop.id)
      }
    })
  }
  
  // 상점 새로고침
  private refreshShop(shopId: string): void {
    const shop = SHOP_DATABASE[shopId]
    if (!shop) return
    
    const stockData: Record<string, number> = {}
    
    // 재고 리셋
    shop.items.forEach(item => {
      if (item.stock !== -1 && item.refreshDaily) {
        stockData[item.itemId] = item.stock
      }
    })
    
    this.refreshData.set(shopId, {
      shopId,
      lastRefresh: new Date(),
      stockData
    })
  }
  
  // 재고 업데이트
  private updateStock(shopId: string, itemId: string, change: number): void {
    const refreshData = this.refreshData.get(shopId)
    if (!refreshData) return
    
    if (!refreshData.stockData) {
      refreshData.stockData = {}
    }
    
    const currentStock = refreshData.stockData[itemId] ?? 0
    refreshData.stockData[itemId] = Math.max(0, currentStock + change)
  }
  
  // 새로고침 데이터 저장
  private async saveRefreshData(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress) {
        const shopRefreshData: Record<string, any> = {}
        this.refreshData.forEach((data, shopId) => {
          shopRefreshData[shopId] = {
            ...data,
            lastRefresh: data.lastRefresh.toISOString()
          }
        })
        
        progress.shopRefreshData = shopRefreshData
        await jrpgDbHelpers.saveJRPGProgress(this.userId, progress)
      }
    } catch (error) {
      console.error('Failed to save shop refresh data:', error)
    }
  }
  
  // 상점별 할인 정보
  getShopDiscounts(shopId: string): Array<{ itemId?: string; discount: number; description: string }> {
    const discounts: Array<{ itemId?: string; discount: number; description: string }> = []
    const now = new Date()
    
    // 활성 할인 확인 (shop-database에서 import 필요)
    // ACTIVE_DISCOUNTS.forEach(discount => {
    //   if (discount.shopId === shopId &&
    //       now >= discount.startDate &&
    //       now <= discount.endDate) {
    //     discounts.push({
    //       itemId: discount.itemId,
    //       discount: discount.discountPercent,
    //       description: discount.description
    //     })
    //   }
    // })
    
    return discounts
  }
}