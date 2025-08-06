/**
 * 플레이어 데이터 관리 서비스
 * 골드, 인벤토리, 장비 등 플레이어 정보를 통합 관리
 */

import { db } from '@/lib/database/client'
import { dbHelpers } from '@/lib/database'
import { ALL_ITEMS, getItemById } from '@/lib/data/items'
import type { Item } from '@/lib/types/item-system'
import type { UserResources, EquipmentInventory } from '@/lib/database/types'
import { soundService } from './sound.service'

export interface PlayerData {
  id: string
  level: number
  gold: number
  experience: number
  energy: number
  inventory: PlayerInventoryItem[]
  equipment: PlayerEquipment
}

export interface PlayerInventoryItem {
  itemId: string
  type: string
  quantity: number
  equipped?: boolean
  slot?: string
  obtainedAt: Date
  locked?: boolean
}

export interface PlayerEquipment {
  weapon?: string
  armor?: string
  accessory?: string
  helmet?: string
  gloves?: string
  boots?: string
}

export interface AddItemOptions {
  itemId: string
  type: string
  rarity?: string
  level?: number
  baseStats?: Record<string, number>
  quantity?: number
}

class PlayerService {
  private static instance: PlayerService

  private constructor() {}

  static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService()
    }
    return PlayerService.instance
  }

  /**
   * 플레이어 전체 데이터 가져오기
   */
  async getPlayer(userId: string): Promise<PlayerData | null> {
    try {
      const [profile, resources, equipment, inventory] = await Promise.all([
        dbHelpers.getProfile(userId),
        dbHelpers.getUserResources(userId),
        dbHelpers.getEquipmentInventory(userId),
        this.getFullInventory(userId)
      ])

      if (!profile || !resources) {
        return null
      }

      return {
        id: userId,
        level: profile.level,
        gold: resources.gold,
        experience: profile.experience,
        energy: resources.energy,
        inventory,
        equipment: this.mapEquipmentData(equipment)
      }
    } catch (error) {
      console.error('Failed to get player data:', error)
      return null
    }
  }

  /**
   * 골드 업데이트 (증가/감소)
   */
  async updateGold(userId: string, amount: number): Promise<boolean> {
    try {
      if (amount < 0) {
        // 골드 감소 (구매 등)
        return await dbHelpers.spendGold(userId, Math.abs(amount))
      } else {
        // 골드 증가 (보상 등)
        await dbHelpers.addGold(userId, amount)
        return true
      }
    } catch (error) {
      console.error('Failed to update gold:', error)
      return false
    }
  }

  /**
   * 아이템을 인벤토리에 추가
   */
  async addItemToInventory(userId: string, options: AddItemOptions): Promise<boolean> {
    try {
      const { itemId, type, quantity = 1 } = options

      // 아이템 데이터 확인
      const itemData = ALL_ITEMS[itemId]
      if (!itemData) {
        console.error(`Item not found: ${itemId}`)
        return false
      }

      // 장비류 (무기, 방어구, 액세서리)
      if (type === 'weapon' || type === 'armor' || type === 'accessory') {
        // 장비는 개별적으로 추가
        for (let i = 0; i < quantity; i++) {
          await dbHelpers.addEquipmentToInventory(
            userId,
            itemId,
            type as unknown,
            itemData.rarity || 'common'
          )
        }
      } else {
        // 소모품/재료는 수량으로 추가
        await dbHelpers.addInventoryItem(userId, type, itemId, quantity)
      }

      console.log(`✅ Added ${quantity}x ${itemData.name} to inventory`)
      return true
    } catch (error) {
      console.error('Failed to add item to inventory:', error)
      return false
    }
  }

  /**
   * 아이템 장착
   */
  async equipItem(userId: string, itemId: string, slot: string): Promise<boolean> {
    try {
      // 장비 인벤토리 확인 또는 생성
      let equipmentDbId: number | undefined
      const equipment = await dbHelpers.getEquipmentInventory(userId)
      
      // 이미 장비 인벤토리에 있는지 확인
      const existingItem = equipment?.items.find(i => i.itemId === itemId)
      
      if (existingItem) {
        equipmentDbId = existingItem.id
      } else {
        // 장비 인벤토리에 없으면 추가
        const itemData = getItemById(itemId)
        if (!itemData || itemData.type !== 'equipment') {
          console.error('Invalid equipment item:', itemId)
          return false
        }
        
        // slot 타입 확인 및 변환
        let dbSlot: 'weapon' | 'armor' | 'accessory' | 'helmet' = 'accessory'
        if (slot === 'weapon') dbSlot = 'weapon'
        else if (slot === 'armor') dbSlot = 'armor'
        else if (slot === 'helmet') dbSlot = 'helmet'
        else if (slot === 'accessory') dbSlot = 'accessory'
        
        equipmentDbId = await dbHelpers.addEquipmentToInventory(
          userId,
          itemId,
          dbSlot,
          itemData.rarity || 'common'
        )
      }

      // 기존 장착 해제
      const currentEquippedItems = equipment?.items || []
      const currentEquipped = currentEquippedItems.find(i => i.equippedSlot === slot && i.isEquipped)
      if (currentEquipped) {
        await this.unequipItem(userId, currentEquipped.id)
      }

      // 새 아이템 장착 - DB 업데이트
      if (equipmentDbId) {
        // Dexie의 update 메서드 사용
        await db.userEquipments.update(equipmentDbId, {
          isEquipped: true,
          equippedSlot: slot
        })
      }
      
      console.log(`✅ Equipped ${itemId} to ${slot}`)
      
      // 장비 변경 이벤트 발생
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('equipment-changed'))
      }
      
      return true
    } catch (error) {
      console.error('Failed to equip item:', error)
      return false
    }
  }

  /**
   * 아이템 장착 해제
   */
  async unequipItem(userId: string, itemDbId: number): Promise<boolean> {
    try {
      // Dexie의 update 메서드 사용
      await db.userEquipments.update(itemDbId, {
        isEquipped: false,
        equippedSlot: null
      })

      console.log(`✅ Unequipped item`)
      return true
    } catch (error) {
      console.error('Failed to unequip item:', error)
      return false
    }
  }

  /**
   * 전체 인벤토리 가져오기 (장비 + 소모품/재료)
   */
  private async getFullInventory(userId: string): Promise<PlayerInventoryItem[]> {
    try {
      const items: PlayerInventoryItem[] = []

      // 장비 인벤토리
      const equipment = await dbHelpers.getEquipmentInventory(userId)
      if (equipment) {
        equipment.items.forEach(item => {
          items.push({
            itemId: item.itemId,
            type: item.type,
            quantity: 1,
            equipped: item.isEquipped,
            slot: item.equippedSlot || undefined,
            obtainedAt: item.obtainedAt,
            locked: false
          })
        })
      }

      // 일반 인벤토리 (소모품/재료)
      const inventory = await db.userInventory
        .where('userId')
        .equals(userId)
        .toArray()

      inventory.forEach(item => {
        items.push({
          itemId: item.itemId,
          type: item.type,
          quantity: item.quantity,
          equipped: false,
          obtainedAt: item.createdAt,
          locked: false
        })
      })

      return items
    } catch (error) {
      console.error('Failed to get full inventory:', error)
      return []
    }
  }

  /**
   * 장비 데이터 매핑
   */
  private mapEquipmentData(equipment: EquipmentInventory | null): PlayerEquipment {
    if (!equipment) {
      return {}
    }

    const equipped: PlayerEquipment = {}

    equipment.items.forEach(item => {
      if (item.isEquipped && item.equippedSlot) {
        equipped[item.equippedSlot as keyof PlayerEquipment] = item.itemId
      }
    })

    return equipped
  }

  /**
   * 아이템 판매
   */
  async sellItems(userId: string, itemIds: string[]): Promise<number> {
    try {
      let totalGold = 0

      for (const itemId of itemIds) {
        const itemData = ALL_ITEMS[itemId]
        if (!itemData) {
          continue
        }

        // TODO: 인벤토리에서 아이템 제거 로직
        totalGold += itemData.value
      }

      if (totalGold > 0) {
        await this.updateGold(userId, totalGold)
      }

      return totalGold
    } catch (error) {
      console.error('Failed to sell items:', error)
      return 0
    }
  }
}

// 싱글톤 인스턴스 export
export const playerService = PlayerService.getInstance()
