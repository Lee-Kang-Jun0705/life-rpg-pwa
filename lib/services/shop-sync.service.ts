/**
 * 상점-인벤토리 동기화 서비스
 * 상점 구매와 인벤토리 시스템 간의 데이터 동기화 관리
 */

import { playerService } from './player.service'
import { inventoryService } from './inventory.service'
import { itemGeneratorService } from './item-generator.service'
import { ALL_ITEMS } from '@/lib/data/items'
import type { Item } from '@/lib/types/item-system'
import type { ShopItem } from '@/lib/shop/types'

class ShopSyncService {
  private static instance: ShopSyncService

  private constructor() {}

  static getInstance(): ShopSyncService {
    if (!ShopSyncService.instance) {
      ShopSyncService.instance = new ShopSyncService()
    }
    return ShopSyncService.instance
  }

  /**
   * 상점에서 아이템 구매 처리
   */
  async purchaseItem(_userId: string, _shopItem: ShopItem, _quantity = 1): Promise<{
    success: boolean
    message: string
    goldSpent?: number
  }> {
    try {
      const totalCost = shopItem.price * quantity

      // 1. 플레이어 골드 확인
      const player = await playerService.getPlayer(userId)
      if (!player || player.gold < totalCost) {
        return {
          success: false,
          message: `골드가 부족합니다. (필요: ${totalCost}, 보유: ${player?.gold || 0})`
        }
      }

      // 2. 골드 차감
      const goldUpdateSuccess = await playerService.updateGold(userId, -totalCost)
      if (!goldUpdateSuccess) {
        return {
          success: false,
          message: '골드 차감 중 오류가 발생했습니다.'
        }
      }

      // 3. 아이템 데이터 가져오기
      const baseItem = ALL_ITEMS[shopItem.id]
      if (!baseItem) {
        // 골드 롤백
        await playerService.updateGold(userId, totalCost)
        return {
          success: false,
          message: '아이템 데이터를 찾을 수 없습니다.'
        }
      }

      // 4. 아이템 생성 및 인벤토리 추가
      if (baseItem.type === 'weapon' || baseItem.type === 'armor' || baseItem.type === 'accessory') {
        // 장비 아이템은 개별적으로 생성
        for (let i = 0; i < quantity; i++) {
          const generatedItem = itemGeneratorService.generateItem({
            id: baseItem.id,
            name: baseItem.name,
            description: baseItem.description,
            type: baseItem.type,
            rarity: baseItem.rarity,
            level: baseItem.level,
            baseStats: baseItem.baseStats,
            value: baseItem.value,
            stackable: false
          })

          // 인벤토리 서비스에 추가
          const addSuccess = inventoryService.addItem(generatedItem, 1)
          if (!addSuccess) {
            console.error('Failed to add item to inventory service')
          }

          // DB에 추가
          await playerService.addItemToInventory(userId, {
            itemId: baseItem.id,
            type: baseItem.type,
            rarity: baseItem.rarity,
            level: baseItem.level,
            baseStats: baseItem.baseStats,
            _quantity: 1
          })
        }
      } else {
        // 소모품/재료는 스택으로 추가
        const generatedItem = itemGeneratorService.generateItem({
          ...baseItem,
          stackable: true,
          maxStack: baseItem.maxStack || 99
        })

        // 인벤토리 서비스에 추가
        const addSuccess = inventoryService.addItem(generatedItem, quantity)
        if (!addSuccess) {
          console.error('Failed to add stackable item to inventory service')
        }

        // DB에 추가
        await playerService.addItemToInventory(userId, {
          itemId: baseItem.id,
          type: baseItem.type,
          rarity: baseItem.rarity,
          level: baseItem.level,
          baseStats: baseItem.baseStats,
          quantity
        })
      }

      return {
        success: true,
        message: `${shopItem.name} ${quantity}개를 구매했습니다!`,
        goldSpent: totalCost
      }
    } catch (error) {
      console.error('Purchase error:', error)
      return {
        success: false,
        message: '구매 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 인벤토리에서 아이템 판매
   */
  async sellItems(_userId: string, _itemUniqueIds: string[]): Promise<{
    success: boolean
    message: string
    goldEarned?: number
  }> {
    try {
      // 인벤토리 서비스에서 아이템 판매 처리
      const { totalGold, soldCount } = inventoryService.sellItems(itemUniqueIds)

      if (soldCount === 0) {
        return {
          success: false,
          message: '판매할 수 있는 아이템이 없습니다.'
        }
      }

      // 골드 추가
      await playerService.updateGold(userId, totalGold)

      // TODO: DB에서도 아이템 제거

      return {
        success: true,
        message: `${soldCount}개 아이템을 ${totalGold} 골드에 판매했습니다!`,
        goldEarned: totalGold
      }
    } catch (error) {
      console.error('Sell items error:', error)
      return {
        success: false,
        message: '판매 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 플레이어 인벤토리 동기화
   * DB와 메모리 인벤토리 서비스 간 동기화
   */
  async syncInventory(_userId: string): Promise<void> {
    try {
      const player = await playerService.getPlayer(userId)
      if (!player) {
        return
      }

      // 인벤토리 서비스 초기화
      inventoryService.clearInventory()

      // DB 인벤토리 데이터를 인벤토리 서비스로 로드
      for (const invItem of player.inventory) {
        const baseItem = ALL_ITEMS[invItem.itemId]
        if (!baseItem) {
          continue
        }

        const generatedItem = itemGeneratorService.generateItem({
          ...baseItem,
          stackable: baseItem.type === 'consumable' || baseItem.type === 'material'
        })

        inventoryService.addItem(generatedItem, invItem.quantity)

        // 장착된 아이템 처리
        if (invItem.equipped && invItem.slot) {
          inventoryService.equipItem(generatedItem.uniqueId, invItem.slot as unknown)
        }
      }

      console.log('✅ Inventory synced successfully')
    } catch (error) {
      console.error('Inventory sync error:', error)
    }
  }

  /**
   * 아이템 장착 동기화
   */
  async syncEquipItem(_userId: string, itemUniqueId: string, slot: string): Promise<boolean> {
    try {
      // 메모리에서 장착
      const equipped = inventoryService.equipItem(itemUniqueId, slot as unknown)
      if (!equipped) {
        return false
      }

      // DB 업데이트
      const item = inventoryService.getItem(itemUniqueId)
      if (!item) {
        return false
      }

      await playerService.equipItem(userId, item.id, slot)

      return true
    } catch (error) {
      console.error('Equip sync error:', error)
      return false
    }
  }

  /**
   * 아이템 장착 해제 동기화
   */
  async syncUnequipItem(_userId: string, slot: string): Promise<boolean> {
    try {
      // 메모리에서 장착 해제
      const unequipped = inventoryService.unequipItem(slot as unknown)
      if (!unequipped) {
        return false
      }

      // TODO: DB 업데이트 구현

      return true
    } catch (error) {
      console.error('Unequip sync error:', error)
      return false
    }
  }
}

export const shopSyncService = ShopSyncService.getInstance()
