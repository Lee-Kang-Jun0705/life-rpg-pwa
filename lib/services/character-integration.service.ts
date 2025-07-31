/**
 * 캐릭터 데이터 통합 서비스
 * DB에 저장된 캐릭터 데이터를 게임 시스템과 연동
 */

import { dbHelpers } from '@/lib/database/client'
import type { Character, CoreStat } from '@/lib/types/game-core'
import type { UserProfile, Stat } from '@/lib/database/types'
import type { Equipment } from '@/lib/types/equipment'
import type { Skill } from '@/lib/types/skill-system'
import { equipmentService } from '@/lib/equipment/equipment-service'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { inventoryService } from '@/lib/services/inventory.service'

// 스탯 타입 매핑
const STAT_TYPE_MAP = {
  health: 'health' as const,
  learning: 'learning' as const,
  relationship: 'relationship' as const,
  achievement: 'achievement' as const
}

export class CharacterIntegrationService {
  private static instance: CharacterIntegrationService
  private characterCache: Map<string, Character> = new Map()
  private equipmentCache: Map<string, Equipment[]> = new Map()
  private skillCache: Map<string, Skill[]> = new Map()

  static getInstance(): CharacterIntegrationService {
    if (!this.instance) {
      this.instance = new CharacterIntegrationService()
    }
    return this.instance
  }

  /**
   * DB에서 캐릭터 데이터를 가져와 Character 타입으로 변환
   */
  async getCharacter(userId: string): Promise<Character | null> {
    try {
      // 캐시 확인
      const cached = this.characterCache.get(userId)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }

      // DB에서 프로필과 스탯 가져오기
      const [profile, stats] = await Promise.all([
        dbHelpers.getProfile(userId),
        dbHelpers.getStats(userId)
      ])
      
      console.log('[CharacterIntegration] Profile loaded:', profile)
      console.log('[CharacterIntegration] Stats loaded:', stats)

      if (!profile) {
        console.log('[CharacterIntegration] No profile found for userId:', userId)
        return null
      }

      // 플레이어 데이터 (골드, 젬, 에너지 등) 가져오기
      const [goldData, gemsData, energyData] = await Promise.all([
        dbHelpers.getPlayerData(`${userId}_gold`),
        dbHelpers.getPlayerData(`${userId}_gems`),
        dbHelpers.getPlayerData(`${userId}_energy`)
      ])

      // 장비와 스킬 정보 가져오기
      const [equipment, skills] = await Promise.all([
        this.getEquippedItems(userId),
        this.getActiveSkills(userId)
      ])

      // Core Stats 변환
      const coreStats: Record<CoreStat, number> = {
        health: stats.find(s => s.type === 'health')?.level || 1,
        learning: stats.find(s => s.type === 'learning')?.level || 1,
        relationship: stats.find(s => s.type === 'relationship')?.level || 1,
        achievement: stats.find(s => s.type === 'achievement')?.level || 1
      }
      
      // 총 레벨은 스탯 레벨의 합계
      const totalLevel = Object.values(coreStats).reduce((sum, level) => sum + level, 0)

      // 전투 스탯 계산 (기본값 + 장비 보너스 + 스킬 보너스)
      const combatStats = this.calculateCombatStats(coreStats, equipment, skills)

      // Character 객체 생성
      const character: Character = {
        id: userId,
        name: profile.name,
        level: totalLevel, // 스탯 레벨의 합계 사용
        experience: profile.totalExperience || profile.experience || 0, // 총 경험치 우선 사용
        coreStats,
        combatStats,
        energy: (energyData?.data as number) || 100,
        maxEnergy: 100 + (coreStats.health * 5), // 건강 레벨당 +5
        gold: (goldData?.data as number) || 0,
        gems: (gemsData?.data as number) || 0,
        createdAt: profile.createdAt.getTime(),
        lastActiveAt: profile.updatedAt.getTime()
      }

      // 캐시 저장
      this.characterCache.set(userId, character)
      
      return character
    } catch (error) {
      console.error('Failed to get character:', error)
      return null
    }
  }

  /**
   * 장착된 아이템 가져오기
   */
  private async getEquippedItems(userId: string): Promise<Equipment[]> {
    try {
      // 캐시 확인
      if (this.equipmentCache.has(userId)) {
        return this.equipmentCache.get(userId) || []
      }

      // 장비 서비스에서 장착 아이템 가져오기
      const equippedGear = await equipmentService.loadEquippedGear(userId)
      const equipment = Object.values(equippedGear).filter(Boolean) as Equipment[]

      // 캐시 저장
      this.equipmentCache.set(userId, equipment)
      
      return equipment
    } catch (error) {
      console.error('Failed to get equipped items:', error)
      return []
    }
  }

  /**
   * 활성화된 스킬 가져오기
   */
  private async getActiveSkills(userId: string): Promise<Skill[]> {
    try {
      // 캐시 확인
      if (this.skillCache.has(userId)) {
        return this.skillCache.get(userId) || []
      }

      // TODO: 스킬 서비스와 연동 필요 (userId 기반 조회)
      // 임시로 빈 배열 반환
      const skills: Skill[] = []

      // 캐시 저장
      this.skillCache.set(userId, skills)
      
      return skills
    } catch (error) {
      console.error('Failed to get active skills:', error)
      return []
    }
  }

  /**
   * 전투 스탯 계산
   */
  private calculateCombatStats(
    coreStats: Record<CoreStat, number>, 
    equipment: Equipment[], 
    skills: Skill[]
  ) {
    // 기본 스탯 (코어 스탯 기반)
    let hp = 100 + (coreStats.health * 20)
    let mp = 50 + (coreStats.learning * 10)
    let attack = 10 + (coreStats.achievement * 5)
    let defense = 5 + (coreStats.health * 3)
    let speed = 50 + (coreStats.relationship * 2)
    let critRate = 0.05 + (coreStats.achievement * 0.01)
    let critDamage = 1.5 + (coreStats.achievement * 0.05)
    let dodge = 0.05 + (coreStats.relationship * 0.01)
    let accuracy = 0.9 + (coreStats.learning * 0.01)
    let resistance = 0.1 + (coreStats.health * 0.01)

    // 장비 보너스 적용
    equipment.forEach(item => {
      if (item.stats.hp) hp += item.stats.hp
      if (item.stats.attack) attack += item.stats.attack
      if (item.stats.defense) defense += item.stats.defense
      if (item.stats.speed) speed += item.stats.speed
      if (item.stats.critRate) critRate += item.stats.critRate
      if (item.stats.critDamage) critDamage += item.stats.critDamage
      if (item.stats.resistance) resistance += item.stats.resistance
    })

    // 패시브 스킬 보너스 적용
    // TODO: 스킬 시스템과 통합 필요 - 현재 Skill 타입 구조가 다름
    // skills.forEach(skill => {
    //   if (skill.type === 'passive') {
    //     // skill.effects를 통해 스탯 보너스 적용
    //   }
    // })

    return {
      hp: Math.floor(hp),
      mp: Math.floor(mp),
      attack: Math.floor(attack),
      defense: Math.floor(defense),
      speed: Math.floor(speed),
      critRate: Math.min(critRate, 1), // 최대 100%
      critDamage: Math.min(critDamage, 5), // 최대 500%
      dodge: Math.min(dodge, 0.5), // 최대 50%
      accuracy: Math.min(accuracy, 1), // 최대 100%
      resistance: Math.min(resistance, 0.75) // 최대 75%
    }
  }

  /**
   * 캐릭터 데이터 업데이트
   */
  async updateCharacter(userId: string, updates: Partial<Character>): Promise<boolean> {
    try {
      const promises: Promise<unknown>[] = []

      // 레벨/경험치 업데이트
      if (updates.level !== undefined || updates.experience !== undefined) {
        promises.push(
          dbHelpers.updateProfile(userId, {
            level: updates.level,
            experience: updates.experience
          })
        )
      }

      // 골드 업데이트
      if (updates.gold !== undefined) {
        promises.push(
          dbHelpers.setPlayerData(`${userId}_gold`, updates.gold)
        )
      }

      // 젬 업데이트
      if (updates.gems !== undefined) {
        promises.push(
          dbHelpers.setPlayerData(`${userId}_gems`, updates.gems)
        )
      }

      // 에너지 업데이트
      if (updates.energy !== undefined) {
        promises.push(
          dbHelpers.setPlayerData(`${userId}_energy`, updates.energy)
        )
      }

      await Promise.all(promises)

      // 캐시 무효화
      this.invalidateCache(userId)

      return true
    } catch (error) {
      console.error('Failed to update character:', error)
      return false
    }
  }

  /**
   * 에너지 사용
   */
  async useEnergy(userId: string, amount: number): Promise<boolean> {
    const character = await this.getCharacter(userId)
    if (!character || character.energy < amount) {
      return false
    }

    return this.updateCharacter(userId, {
      energy: character.energy - amount
    })
  }

  /**
   * 에너지 회복
   */
  async restoreEnergy(userId: string, amount: number): Promise<boolean> {
    const character = await this.getCharacter(userId)
    if (!character) {
      return false
    }

    const newEnergy = Math.min(character.energy + amount, character.maxEnergy)
    return this.updateCharacter(userId, { energy: newEnergy })
  }

  /**
   * 골드 획득
   */
  async addGold(userId: string, amount: number): Promise<boolean> {
    const character = await this.getCharacter(userId)
    if (!character) {
      return false
    }

    return this.updateCharacter(userId, {
      gold: character.gold + amount
    })
  }

  /**
   * 골드 사용
   */
  async useGold(userId: string, amount: number): Promise<boolean> {
    const character = await this.getCharacter(userId)
    if (!character || character.gold < amount) {
      return false
    }

    return this.updateCharacter(userId, {
      gold: character.gold - amount
    })
  }

  /**
   * 경험치 획득
   */
  async addExperience(userId: string, amount: number): Promise<{
    levelUp: boolean
    newLevel: number
    newExperience: number
  }> {
    const character = await this.getCharacter(userId)
    if (!character) {
      return { levelUp: false, newLevel: 1, newExperience: 0 }
    }

    const newExperience = character.experience + amount
    const experienceForNextLevel = this.getExperienceForLevel(character.level + 1)
    
    let newLevel = character.level
    let remainingExperience = newExperience
    
    // 레벨업 체크
    while (remainingExperience >= experienceForNextLevel) {
      remainingExperience -= experienceForNextLevel
      newLevel++
    }

    const levelUp = newLevel > character.level

    await this.updateCharacter(userId, {
      level: newLevel,
      experience: remainingExperience
    })

    return {
      levelUp,
      newLevel,
      newExperience: remainingExperience
    }
  }

  /**
   * 레벨별 필요 경험치 계산
   */
  private getExperienceForLevel(level: number): number {
    return level * 100 * Math.pow(1.1, level - 1)
  }

  /**
   * 캐시 유효성 검사
   */
  private isCacheValid(character: Character): boolean {
    const cacheTime = 5 * 60 * 1000 // 5분
    return Date.now() - character.lastActiveAt < cacheTime
  }

  /**
   * 캐시 무효화
   */
  private invalidateCache(userId: string) {
    this.characterCache.delete(userId)
    this.equipmentCache.delete(userId)
    this.skillCache.delete(userId)
  }
  
  /**
   * 캐시 클리어 (외부에서 호출 가능)
   */
  clearCache(userId: string) {
    this.invalidateCache(userId)
  }

  /**
   * 전체 캐시 초기화
   */
  clearAllCache() {
    this.characterCache.clear()
    this.equipmentCache.clear()
    this.skillCache.clear()
  }
}

export const characterIntegrationService = CharacterIntegrationService.getInstance()