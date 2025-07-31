// 장비 관련 서비스
import { dbHelpers } from '@/lib/database/client'
import type { Equipment, EquippedGear, EnhancementMaterial } from '@/lib/types/equipment'
import type { UserEquipment } from '@/lib/database'
import { calculateEnhancementSuccessRate } from '@/lib/types/equipment'
import { getEnhancementFailurePenalty, getEnhancementBonus } from './enhancement-materials'
import { EQUIPMENT_DATA } from './equipment-data'

export class EquipmentService {
  private static instance: EquipmentService

  static getInstance(): EquipmentService {
    if (!EquipmentService.instance) {
      EquipmentService.instance = new EquipmentService()
    }
    return EquipmentService.instance
  }

  // 장비 인벤토리 로드
  async loadInventory(_userId: string): Promise<Equipment[]> {
    const { dbHelpers } = await import('@/lib/database')
    const userEquipments = await dbHelpers.getUserEquipments(userId)
    
    // DB에 저장된 장비가 없으면 기본 장비 몇 개 추가
    if (userEquipments.length === 0) {
      const defaultEquipments = EQUIPMENT_DATA.slice(0, 5)
      for (const equipment of defaultEquipments) {
        await dbHelpers.addEquipmentToInventory(
          userId, 
          equipment.id, 
          equipment.type, 
          equipment.rarity
        )
      }
      // 다시 로드
      const newUserEquipments = await dbHelpers.getUserEquipments(userId)
      return this.convertToEquipmentFormat(newUserEquipments)
    }
    
    return this.convertToEquipmentFormat(userEquipments)
  }

  // UserEquipment를 Equipment 형태로 변환
  private convertToEquipmentFormat(userEquipments: UserEquipment[]): Equipment[] {
    return userEquipments.map(userEquip => {
      const baseEquipment = EQUIPMENT_DATA.find(eq => eq.id === userEquip.equipmentId)
      if (!baseEquipment) return null
      
      return {
        ...baseEquipment,
        enhancementLevel: userEquip.enhancementLevel,
        locked: false // 기본값
      }
    }).filter(Boolean) as Equipment[]
  }

  // 장착된 장비 로드
  async loadEquippedGear(_userId: string): Promise<EquippedGear> {
    const { dbHelpers } = await import('@/lib/database')
    const equippedItems = await dbHelpers.getEquippedItems(userId)
    
    const equippedGear: EquippedGear = {}
    
    for (const userEquip of equippedItems) {
      const baseEquipment = EQUIPMENT_DATA.find(eq => eq.id === userEquip.equipmentId)
      if (!baseEquipment) continue
      
      const _equipment: Equipment = {
        ...baseEquipment,
        enhancementLevel: userEquip.enhancementLevel,
        locked: false
      }
      
      if (userEquip.type === 'accessory' && userEquip.slot) {
        // Type guard for accessory slots
        if (userEquip.slot === 'accessory1' || userEquip.slot === 'accessory2' || userEquip.slot === 'accessory3') {
          equippedGear[userEquip.slot] = equipment
        }
      } else {
        // Type guard for other equipment types
        const equipType = userEquip.type as keyof EquippedGear
        if (equipType !== 'accessory1' && equipType !== 'accessory2' && equipType !== 'accessory3') {
          equippedGear[equipType] = equipment
        }
      }
    }
    
    return equippedGear
  }

  // 장비 장착
  async equipItem(
    _userId: string, 
    _equipment: Equipment,
    slot?: 'accessory1' | 'accessory2' | 'accessory3'
  ): Promise<void> {
    const { dbHelpers } = await import('@/lib/database')
    
    // 같은 타입의 기존 장착 장비 해제
    if (equipment.type !== 'accessory') {
      const equippedItems = await dbHelpers.getEquippedItems(userId)
      const sameTypeEquipped = equippedItems.find(item => item.type === equipment.type)
      if (sameTypeEquipped) {
        await dbHelpers.unequipItem(userId, sameTypeEquipped.equipmentId)
      }
    }
    
    // 새 장비 장착
    await dbHelpers.equipItem(userId, equipment.id, slot)
    console.log(`✅ Equipped ${equipment.id} for user ${userId}`)
  }

  // 장비 해제
  async unequipItem(
    _userId: string,
    _equipmentType: string,
    slot?: 'accessory1' | 'accessory2' | 'accessory3'
  ): Promise<void> {
    const { dbHelpers } = await import('@/lib/database')
    
    // 장착된 장비 찾기
    const equippedItems = await dbHelpers.getEquippedItems(userId)
    let targetEquipment = null
    
    if (equipmentType === 'accessory' && slot) {
      targetEquipment = equippedItems.find(item => 
        item.type === 'accessory' && item.slot === slot
      )
    } else {
      targetEquipment = equippedItems.find(item => item.type === equipmentType)
    }
    
    if (targetEquipment) {
      await dbHelpers.unequipItem(userId, targetEquipment.equipmentId)
      console.log(`✅ Unequipped ${targetEquipment.equipmentId} for user ${userId}`)
    }
  }

  // 장비 강화
  async enhanceEquipment(
    _userId: string,
    _equipment: Equipment,
    material?: EnhancementMaterial,
    _useProtection: boolean = false
  ): Promise<{
    success: boolean
    newLevel?: number
    destroyed?: boolean
    equipment?: Equipment
  }> {
    const currentLevel = equipment.enhancementLevel || 0
    
    // 최대 레벨 체크
    if (currentLevel >= 15) {
      throw new Error('장비가 이미 최대 강화 레벨입니다')
    }

    // 성공률 계산
    const baseSuccessRate = calculateEnhancementSuccessRate(currentLevel, material)
    const roll = Math.random() * 100

    if (roll <= baseSuccessRate || material?.guaranteedSuccess) {
      // 강화 성공
      const newEquipment = {
        ...equipment,
        enhancementLevel: currentLevel + 1,
      }
      
      // DB에 저장
      const { dbHelpers } = await import('@/lib/database')
      // TODO: 장비 업데이트 함수 구현 필요
      // 임시로 장비 정보 업데이트는 스킵하고 메모리에서만 관리
      
      return {
        success: true,
        newLevel: currentLevel + 1,
        _equipment: newEquipment,
      }
    } else {
      // 강화 실패
      const penalty = getEnhancementFailurePenalty(currentLevel)
      
      // 파괴 체크
      if (penalty.destruction && !useProtection && !material?.protectDestruction) {
        // 장비 파괴
        // TODO: DB에서 장비 제거
        
        return {
          success: false,
          destroyed: true,
        }
      }
      
      // 레벨 감소
      const newLevel = Math.max(0, currentLevel - penalty.levelDecrease)
      const newEquipment = {
        ...equipment,
        enhancementLevel: newLevel,
      }
      
      // TODO: DB에 저장
      
      return {
        success: false,
        newLevel: newLevel,
        _equipment: newEquipment,
      }
    }
  }

  // 장비 판매
  async sellEquipment(_userId: string, _equipmentIds: string[]): Promise<number> {
    const { dbHelpers } = await import('@/lib/database')
    let totalGold = 0
    
    for (const id of equipmentIds) {
      const equipment = EQUIPMENT_DATA.find(e => e.id === id)
      if (equipment) {
        // 판매 가격 계산 (구매 가격의 50%)
        const sellPrice = Math.floor(equipment.price * 0.5)
        totalGold += sellPrice
        
        // DB에서 장비 제거 (실제로는 유저 장비 테이블에서 제거)
        const userEquipments = await dbHelpers.getUserEquipments(userId)
        const targetEquipment = userEquipments.find(ue => ue.equipmentId === id)
        if (targetEquipment && targetEquipment.id) {
          // 장착 해제 후 판매
          if (targetEquipment.isEquipped) {
            await dbHelpers.unequipItem(userId, id)
          }
          // 인벤토리에서 제거는 아직 구현 안함 (removeUserEquipment 함수 필요)
        }
      }
    }
    
    // 골드 추가
    if (totalGold > 0) {
      await dbHelpers.addGold(userId, totalGold)
      console.log(`✅ Sold equipment for ${totalGold} gold`)
    }
    
    return totalGold
  }

  // 장비 잠금/해제
  async toggleEquipmentLock(_userId: string, equipmentId: string): Promise<boolean> {
    // TODO: DB에서 장비 잠금 상태 토글
    console.log(`Toggling lock for equipment ${equipmentId}`)
    return true
  }

  // 장비 검색
  searchEquipment(query: string, inventory: Equipment[]): Equipment[] {
    const lowerQuery = query.toLowerCase()
    
    return inventory.filter(equipment => 
      equipment.name.toLowerCase().includes(lowerQuery) ||
      equipment.description.toLowerCase().includes(lowerQuery) ||
      equipment.type.toLowerCase().includes(lowerQuery) ||
      equipment.rarity.toLowerCase().includes(lowerQuery)
    )
  }

  // 장비 스탯 계산 (강화 포함)
  calculateEnhancedStats(_equipment: Equipment): Equipment['stats'] {
    const enhancementBonus = getEnhancementBonus(equipment.enhancementLevel || 0)
    const enhancedStats: Equipment['stats'] = {}
    
    for (const [stat, value] of Object.entries(equipment.stats)) {
      enhancedStats[stat as keyof Equipment['stats']] = 
        Math.floor(value * (1 + enhancementBonus))
    }
    
    return enhancedStats
  }

  // 장비 비교
  compareEquipment(_equipment1: Equipment, _equipment2: Equipment): {
    betterStats: string[]
    worseStats: string[]
    powerDifference: number
  } {
    const stats1 = this.calculateEnhancedStats(equipment1)
    const stats2 = this.calculateEnhancedStats(equipment2)
    
    const betterStats: string[] = []
    const worseStats: string[] = []
    let power1 = 0
    let power2 = 0
    
    // 스탯 비교
    const allStats = new Set([
      ...Object.keys(stats1),
      ...Object.keys(stats2)
    ])
    
    for (const stat of allStats) {
      const value1 = stats1[stat as keyof Equipment['stats']] || 0
      const value2 = stats2[stat as keyof Equipment['stats']] || 0
      
      if (value1 > value2) {
        betterStats.push(stat)
      } else if (value1 < value2) {
        worseStats.push(stat)
      }
      
      // 전투력 계산용
      const weight = stat === 'attack' ? 2 : stat === 'defense' ? 1.5 : 1
      power1 += value1 * weight
      power2 += value2 * weight
    }
    
    return {
      betterStats,
      worseStats,
      powerDifference: power1 - power2,
    }
  }
}

// Export singleton instance
export const equipmentService = new EquipmentService()