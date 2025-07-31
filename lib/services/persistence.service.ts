/**
 * 데이터 영속성 서비스
 * 게임 데이터를 IndexedDB에 저장하고 불러오기
 */

import { db } from '../db'
import type { Character } from '../types/game-core'
import type { InventoryItem } from '../types/item-system'
import type { LearnedSkill } from '../types/skill-system'
import type { Equipment } from './inventory.service'
import { inventoryService } from './inventory.service'
import { skillManagementService } from './skill-management.service'
import { characterService } from './character.service'

class PersistenceService {
  private static instance: PersistenceService
  private autoSaveInterval: NodeJS.Timeout | null = null
  private lastSaveTime: number = 0

  private constructor() {
    // 자동 저장 시작
    this.startAutoSave()
  }

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService()
    }
    return PersistenceService.instance
  }

  // 자동 저장 시작
  private startAutoSave(): void {
    // 30초마다 자동 저장
    this.autoSaveInterval = setInterval(() => {
      this.saveAll()
    }, 30000)

    // 페이지 종료 시 저장
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveAll()
      })

      // 페이지 숨김 시 저장 (모바일 대응)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.saveAll()
        }
      })
    }
  }

  // 자동 저장 중지
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  // 캐릭터 저장
  async saveCharacter(characterId: string): Promise<void> {
    try {
      const character = characterService.getCharacter()
      if (!character) return

      await db.characters.put({
        id: characterId,
        character,
        lastUpdated: new Date()
      })
      console.log('Character saved successfully')
    } catch (error) {
      console.error('Failed to save character:', error)
    }
  }

  // 캐릭터 불러오기
  async loadCharacter(characterId: string): Promise<boolean> {
    try {
      const data = await db.characters.get(characterId)
      if (!data) return false

      characterService.restoreCharacter(data.character)
      console.log('Character loaded successfully')
      return true
    } catch (error) {
      console.error('Failed to load character:', error)
      return false
    }
  }

  // 인벤토리 저장
  async saveInventory(characterId: string): Promise<void> {
    try {
      const inventoryState = inventoryService.getInventoryState()
      
      await db.inventory.put({
        id: characterId,
        items: inventoryState.items,
        equipment: inventoryState.equipment,
        maxSlots: inventoryState.maxSlots,
        lastUpdated: new Date()
      })
      console.log('Inventory saved successfully')
    } catch (error) {
      console.error('Failed to save inventory:', error)
    }
  }

  // 인벤토리 불러오기
  async loadInventory(characterId: string): Promise<boolean> {
    try {
      const data = await db.inventory.get(characterId)
      if (!data) return false

      // 인벤토리 서비스 복원 메소드 사용
      inventoryService.restoreInventory(
        data.items,
        data.equipment,
        data.maxSlots
      )

      console.log('Inventory loaded successfully')
      return true
    } catch (error) {
      console.error('Failed to load inventory:', error)
      return false
    }
  }

  // 스킬 저장
  async saveSkills(characterId: string): Promise<void> {
    try {
      const learnedSkills = skillManagementService.getAllLearnedSkills()
      const quickSlots = skillManagementService.getQuickSlots()
      const skillPoints = skillManagementService.getSkillPoints()

      // 퀵슬롯을 Record 형태로 변환
      const quickSlotsRecord: Record<number, string> = {}
      quickSlots.forEach(slot => {
        if (slot.skillId) {
          quickSlotsRecord[slot.slot] = slot.skillId
        }
      })

      await db.skills.put({
        id: characterId,
        learnedSkills,
        quickSlots: quickSlotsRecord,
        skillPoints,
        lastUpdated: new Date()
      })
      console.log('Skills saved successfully')
    } catch (error) {
      console.error('Failed to save skills:', error)
    }
  }

  // 스킬 불러오기
  async loadSkills(characterId: string): Promise<boolean> {
    try {
      console.time('loadSkills')
      const data = await db.skills.get(characterId)
      if (!data) {
        console.timeEnd('loadSkills')
        return false
      }

      console.log(`Loading ${data.learnedSkills.length} skills...`)
      
      // 배치 복원 메서드를 사용하여 성능 최적화
      console.time('restoreAllSkills')
      await skillManagementService.restoreAllSkills({
        learnedSkills: data.learnedSkills,
        quickSlots: data.quickSlots,
        skillPoints: data.skillPoints
      })
      console.timeEnd('restoreAllSkills')

      console.log('Skills loaded successfully')
      console.timeEnd('loadSkills')
      return true
    } catch (error) {
      console.error('Failed to load skills:', error)
      console.timeEnd('loadSkills')
      return false
    }
  }

  // 모든 데이터 저장
  async saveAll(characterId: string = 'player-1'): Promise<void> {
    const now = Date.now()
    
    // 최소 저장 간격 (5초)
    if (now - this.lastSaveTime < 5000) {
      return
    }

    try {
      await Promise.all([
        this.saveCharacter(characterId),
        this.saveInventory(characterId),
        this.saveSkills(characterId)
      ])
      
      this.lastSaveTime = now
      console.log('All data saved successfully')
    } catch (error) {
      console.error('Failed to save all data:', error)
    }
  }

  // 모든 데이터 불러오기
  async loadAll(characterId: string = 'player-1'): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.loadCharacter(characterId),
        this.loadInventory(characterId),
        this.loadSkills(characterId)
      ])
      
      const success = results.every(result => result)
      if (success) {
        console.log('All data loaded successfully')
      }
      
      return success
    } catch (error) {
      console.error('Failed to load all data:', error)
      return false
    }
  }

  // 특정 캐릭터의 모든 데이터 삭제
  async deleteCharacterData(characterId: string): Promise<void> {
    try {
      await Promise.all([
        db.characters.delete(characterId),
        db.inventory.delete(characterId),
        db.skills.delete(characterId),
        // 던전 진행도 삭제
        db.dungeonProgress.where('userId').equals(characterId).delete()
      ])
      
      console.log('Character data deleted successfully')
    } catch (error) {
      console.error('Failed to delete character data:', error)
    }
  }

  // 마지막 저장 시간 가져오기
  async getLastSaveTime(characterId: string): Promise<Date | null> {
    try {
      const results = await Promise.all([
        db.characters.get(characterId),
        db.inventory.get(characterId),
        db.skills.get(characterId)
      ])

      const times = results
        .filter(r => r)
        .map(r => r!.lastUpdated)
        .sort((a, b) => b.getTime() - a.getTime())

      return times[0] || null
    } catch (error) {
      console.error('Failed to get last save time:', error)
      return null
    }
  }

  // 저장 상태 확인
  async getSaveStatus(characterId: string): Promise<{
    hasCharacterSave: boolean
    hasInventorySave: boolean
    hasSkillsSave: boolean
    lastSaveTime: Date | null
  }> {
    try {
      const [character, inventory, skills] = await Promise.all([
        db.characters.get(characterId),
        db.inventory.get(characterId),
        db.skills.get(characterId)
      ])

      const lastSaveTime = await this.getLastSaveTime(characterId)

      return {
        hasCharacterSave: !!character,
        hasInventorySave: !!inventory,
        hasSkillsSave: !!skills,
        lastSaveTime
      }
    } catch (error) {
      console.error('Failed to get save status:', error)
      return {
        hasCharacterSave: false,
        hasInventorySave: false,
        hasSkillsSave: false,
        lastSaveTime: null
      }
    }
  }
}

export const persistenceService = PersistenceService.getInstance()