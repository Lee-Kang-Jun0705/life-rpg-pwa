/**
 * 플레이어 데이터 관리 서비스
 * 골드, 인벤토리, 장비 등 플레이어 정보를 통합 관리
 */

import { db } from '@/lib/database/client'
import { dbHelpers } from '@/lib/database'
import { ALL_ITEMS } from '@/lib/data/items'
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
  async getPlayer(_userId: string): Promise<PlayerData | null> {
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
  async updateGold(_userId: string, amount: number): Promise<boolean> {
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
  async addItemToInventory(_userId: string, _options: AddItemOptions): Promise<boolean> {
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
  async equipItem(_userId: string, itemId: string, _slot: string): Promise<boolean> {
    try {
      const equipment = await dbHelpers.getEquipmentInventory(userId)
      const item = equipment?.items.find(i => i.itemId === itemId)

      if (!item) {
        console.error('Item not found in equipment inventory')
        return false
      }

      // 기존 장착 해제
      const currentEquipped = equipment.items.find(i => i.equippedSlot === slot)
      if (currentEquipped) {
        await this.unequipItem(userId, currentEquipped.id)
      }

      // 새 아이템 장착
      await db.equipmentInventory.update({
        where: { id: item.id },
        data: {
          isEquipped: true,
          equippedSlot: slot
        }
      })

      console.log(`✅ Equipped ${item.itemId} to ${slot}`)
      return true
    } catch (error) {
      console.error('Failed to equip item:', error)
      return false
    }
  }

  /**
   * 아이템 장착 해제
   */
  async unequipItem(_userId: string, itemDbId: number): Promise<boolean> {
    try {
      await db.equipmentInventory.update({
        where: { id: itemDbId },
        data: {
          isEquipped: false,
          equippedSlot: null
        }
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
  private async getFullInventory(_userId: string): Promise<PlayerInventoryItem[]> {
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
            _slot: item.equippedSlot || undefined,
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
  async sellItems(_userId: string, itemIds: string[]): Promise<number> {
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
