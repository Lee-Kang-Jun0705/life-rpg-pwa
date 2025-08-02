/**
 * 컴패니언 관리 서비스
 * 컴패니언의 생성, 관리, 성장, 활동 등을 담당
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  CompanionData,
  CompanionInstance,
  CompanionActivity,
  CompanionSettings,
  CompanionMood,
  CompanionSkill
} from '@/lib/types/companion'
import { COMPANION_DATA, getCompanionById } from '@/lib/data/companions'

const STORAGE_KEY = 'life-rpg-companions'
const SETTINGS_KEY = 'life-rpg-companion-settings'
const ACTIVE_COMPANION_KEY = 'life-rpg-active-companion'

// 컴패니언 시스템 상수
const COMPANION_CONSTANTS = {
  // 레벨 상수
  MAX_LEVEL: 100,
  EXP_PER_LEVEL: 100,
  EXP_SCALING: 1.15, // 레벨당 경험치 증가율
  
  // 상태 상수
  MAX_LOYALTY: 100,
  MAX_HUNGER: 100,
  MAX_FATIGUE: 100,
  
  // 상태 변화율
  HUNGER_DECAY_RATE: 5, // 시간당 감소량
  FATIGUE_INCREASE_RATE: 3, // 시간당 증가량
  LOYALTY_DECAY_RATE: 2, // 상호작용 없을 시 시간당 감소량
  
  // 활동 효과
  FEED_HUNGER_RESTORE: 30,
  PLAY_LOYALTY_GAIN: 10,
  PLAY_FATIGUE_COST: 10,
  TRAIN_EXP_GAIN: 50,
  TRAIN_FATIGUE_COST: 20,
  REST_FATIGUE_RESTORE: 40,
  GIFT_LOYALTY_GAIN: 20,
  
  // 기분 임계값
  MOOD_THRESHOLDS: {
    happy: { loyalty: 80, hunger: 60, fatigue: 40 },
    normal: { loyalty: 50, hunger: 40, fatigue: 60 },
    sad: { loyalty: 30, hunger: 20, fatigue: 80 },
    tired: { fatigue: 80 }, // 피로도가 높으면 무조건 tired
    hungry: { hunger: 20 } // 배고픔이 낮으면 무조건 hungry
  }
}

class CompanionService {
  private static instance: CompanionService

  static getInstance(): CompanionService {
    if (!CompanionService.instance) {
      CompanionService.instance = new CompanionService()
    }
    return CompanionService.instance
  }

  // 컴패니언 인스턴스 생성
  createCompanionInstance(companionDataId: string, nickname?: string): CompanionInstance | null {
    const companionData = getCompanionById(companionDataId)
    if (!companionData) {
      console.error('Companion data not found:', companionDataId)
      return null
    }

    const instance: CompanionInstance = {
      id: uuidv4(),
      companionId: companionDataId,
      nickname: nickname || companionData.name,
      level: 1,
      exp: 0,
      expToNext: COMPANION_CONSTANTS.EXP_PER_LEVEL,
      currentStats: {
        hp: companionData.baseStats.hp,
        maxHp: companionData.baseStats.hp,
        attack: companionData.baseStats.attack,
        defense: companionData.baseStats.defense,
        speed: companionData.baseStats.speed,
        critRate: companionData.baseStats.critRate,
        critDamage: companionData.baseStats.critDamage
      },
      mood: 'normal',
      loyalty: 50,
      hunger: 70,
      fatigue: 30,
      unlockedSkills: companionData.skills
        .filter(skill => skill.unlockLevel <= 1)
        .map(skill => skill.id),
      obtainedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
      battleStats: {
        victories: 0,
        defeats: 0,
        assistKills: 0,
        damageDealt: 0,
        healingDone: 0
      }
    }

    return instance
  }

  // 모든 컴패니언 가져오기
  getAllCompanions(userId: string): CompanionInstance[] {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load companions:', error)
    }
    return []
  }

  // 컴패니언 저장
  saveCompanions(userId: string, companions: CompanionInstance[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(companions))
    } catch (error) {
      console.error('Failed to save companions:', error)
    }
  }

  // 컴패니언 추가
  addCompanion(userId: string, companionDataId: string, nickname?: string): CompanionInstance | null {
    const newCompanion = this.createCompanionInstance(companionDataId, nickname)
    if (!newCompanion) return null

    const companions = this.getAllCompanions(userId)
    companions.push(newCompanion)
    this.saveCompanions(userId, companions)

    return newCompanion
  }

  // 특정 컴패니언 가져오기
  getCompanion(userId: string, instanceId: string): CompanionInstance | null {
    const companions = this.getAllCompanions(userId)
    return companions.find(c => c.id === instanceId) || null
  }

  // 활성 컴패니언 설정
  setActiveCompanion(userId: string, instanceId: string | null): boolean {
    if (instanceId && !this.getCompanion(userId, instanceId)) {
      return false
    }

    try {
      if (instanceId) {
        localStorage.setItem(`${ACTIVE_COMPANION_KEY}-${userId}`, instanceId)
      } else {
        localStorage.removeItem(`${ACTIVE_COMPANION_KEY}-${userId}`)
      }
      return true
    } catch (error) {
      console.error('Failed to set active companion:', error)
      return false
    }
  }

  // 활성 컴패니언 가져오기
  getActiveCompanion(userId: string): CompanionInstance | null {
    try {
      const activeId = localStorage.getItem(`${ACTIVE_COMPANION_KEY}-${userId}`)
      if (activeId) {
        return this.getCompanion(userId, activeId)
      }
    } catch (error) {
      console.error('Failed to get active companion:', error)
    }
    return null
  }

  // 컴패니언 레벨업
  private levelUpCompanion(companion: CompanionInstance, companionData: CompanionData): void {
    companion.level++
    companion.exp = companion.exp - companion.expToNext
    companion.expToNext = Math.floor(
      COMPANION_CONSTANTS.EXP_PER_LEVEL * Math.pow(COMPANION_CONSTANTS.EXP_SCALING, companion.level - 1)
    )

    // 스탯 증가
    companion.currentStats.maxHp += companionData.growthRates.hp
    companion.currentStats.hp = companion.currentStats.maxHp // 레벨업 시 풀 회복
    companion.currentStats.attack += companionData.growthRates.attack
    companion.currentStats.defense += companionData.growthRates.defense
    companion.currentStats.speed += companionData.growthRates.speed

    // 새로운 스킬 언락 체크
    companionData.skills.forEach(skill => {
      if (skill.unlockLevel === companion.level && !companion.unlockedSkills.includes(skill.id)) {
        companion.unlockedSkills.push(skill.id)
      }
    })
  }

  // 경험치 추가
  addExperience(userId: string, instanceId: string, amount: number): boolean {
    const companions = this.getAllCompanions(userId)
    const companion = companions.find(c => c.id === instanceId)
    if (!companion) return false

    const companionData = getCompanionById(companion.companionId)
    if (!companionData) return false

    companion.exp += amount

    // 레벨업 체크
    while (companion.exp >= companion.expToNext && companion.level < COMPANION_CONSTANTS.MAX_LEVEL) {
      this.levelUpCompanion(companion, companionData)
    }

    this.saveCompanions(userId, companions)
    return true
  }

  // 컴패니언 기분 계산
  private calculateMood(companion: CompanionInstance): CompanionMood {
    const { loyalty, hunger, fatigue } = companion
    const thresholds = COMPANION_CONSTANTS.MOOD_THRESHOLDS

    // 우선순위: hungry > tired > sad > normal > happy
    if (hunger <= thresholds.hungry.hunger) return 'hungry'
    if (fatigue >= thresholds.tired.fatigue) return 'tired'
    if (loyalty < thresholds.sad.loyalty) return 'sad'
    if (
      loyalty >= thresholds.happy.loyalty &&
      hunger >= thresholds.happy.hunger &&
      fatigue <= thresholds.happy.fatigue
    ) {
      return 'happy'
    }
    return 'normal'
  }

  // 시간 경과에 따른 상태 업데이트
  updateCompanionStates(userId: string): void {
    const companions = this.getAllCompanions(userId)
    const now = new Date()

    companions.forEach(companion => {
      const lastInteraction = new Date(companion.lastInteractionAt)
      const hoursPassed = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60)

      // 상태 변화 적용
      companion.hunger = Math.max(0, companion.hunger - (COMPANION_CONSTANTS.HUNGER_DECAY_RATE * hoursPassed))
      companion.fatigue = Math.min(100, companion.fatigue + (COMPANION_CONSTANTS.FATIGUE_INCREASE_RATE * hoursPassed))
      
      // 상호작용이 없으면 충성도 감소
      if (hoursPassed > 24) {
        companion.loyalty = Math.max(0, companion.loyalty - (COMPANION_CONSTANTS.LOYALTY_DECAY_RATE * hoursPassed))
      }

      // 기분 업데이트
      companion.mood = this.calculateMood(companion)
    })

    this.saveCompanions(userId, companions)
  }

  // 컴패니언 활동 수행
  performActivity(
    userId: string,
    instanceId: string,
    activityType: CompanionActivity['type']
  ): CompanionActivity | null {
    const companions = this.getAllCompanions(userId)
    const companion = companions.find(c => c.id === instanceId)
    if (!companion) return null

    const activity: CompanionActivity = {
      type: activityType,
      companionId: instanceId,
      timestamp: new Date().toISOString(),
      result: {}
    }

    switch (activityType) {
      case 'feed':
        if (companion.hunger >= 100) {
          return null // 이미 배부름
        }
        companion.hunger = Math.min(100, companion.hunger + COMPANION_CONSTANTS.FEED_HUNGER_RESTORE)
        activity.result.hungerChange = COMPANION_CONSTANTS.FEED_HUNGER_RESTORE
        break

      case 'play':
        if (companion.fatigue > 80) {
          return null // 너무 피곤함
        }
        companion.loyalty = Math.min(100, companion.loyalty + COMPANION_CONSTANTS.PLAY_LOYALTY_GAIN)
        companion.fatigue = Math.min(100, companion.fatigue + COMPANION_CONSTANTS.PLAY_FATIGUE_COST)
        activity.result.loyaltyChange = COMPANION_CONSTANTS.PLAY_LOYALTY_GAIN
        activity.result.fatigueChange = COMPANION_CONSTANTS.PLAY_FATIGUE_COST
        break

      case 'train':
        if (companion.fatigue > 70) {
          return null // 너무 피곤함
        }
        const expGain = COMPANION_CONSTANTS.TRAIN_EXP_GAIN
        this.addExperience(userId, instanceId, expGain)
        companion.fatigue = Math.min(100, companion.fatigue + COMPANION_CONSTANTS.TRAIN_FATIGUE_COST)
        activity.result.expGained = expGain
        activity.result.fatigueChange = COMPANION_CONSTANTS.TRAIN_FATIGUE_COST
        break

      case 'rest':
        companion.fatigue = Math.max(0, companion.fatigue - COMPANION_CONSTANTS.REST_FATIGUE_RESTORE)
        activity.result.fatigueChange = -COMPANION_CONSTANTS.REST_FATIGUE_RESTORE
        break

      case 'gift':
        companion.loyalty = Math.min(100, companion.loyalty + COMPANION_CONSTANTS.GIFT_LOYALTY_GAIN)
        activity.result.loyaltyChange = COMPANION_CONSTANTS.GIFT_LOYALTY_GAIN
        break
    }

    // 상호작용 시간 업데이트
    companion.lastInteractionAt = new Date().toISOString()
    companion.mood = this.calculateMood(companion)

    this.saveCompanions(userId, companions)
    return activity
  }

  // 전투 스탯 업데이트
  updateBattleStats(
    userId: string,
    instanceId: string,
    stats: Partial<CompanionInstance['battleStats']>
  ): boolean {
    const companions = this.getAllCompanions(userId)
    const companion = companions.find(c => c.id === instanceId)
    if (!companion) return false

    Object.assign(companion.battleStats, stats)
    this.saveCompanions(userId, companions)
    return true
  }

  // 컴패니언 스킬 가져오기
  getCompanionSkills(companion: CompanionInstance): CompanionSkill[] {
    const companionData = getCompanionById(companion.companionId)
    if (!companionData) return []

    return companionData.skills.filter(skill => 
      companion.unlockedSkills.includes(skill.id)
    )
  }

  // 컴패니언 설정 관리
  getSettings(userId: string): CompanionSettings {
    try {
      const saved = localStorage.getItem(`${SETTINGS_KEY}-${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load companion settings:', error)
    }

    return {
      autoFeed: false,
      notifyLowMood: true,
      notifyHungry: true
    }
  }

  saveSettings(userId: string, settings: CompanionSettings): void {
    try {
      localStorage.setItem(`${SETTINGS_KEY}-${userId}`, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save companion settings:', error)
    }
  }

  // 컴패니언 삭제
  removeCompanion(userId: string, instanceId: string): boolean {
    const companions = this.getAllCompanions(userId)
    const index = companions.findIndex(c => c.id === instanceId)
    
    if (index === -1) return false

    // 활성 컴패니언이면 해제
    const activeCompanion = this.getActiveCompanion(userId)
    if (activeCompanion?.id === instanceId) {
      this.setActiveCompanion(userId, null)
    }

    companions.splice(index, 1)
    this.saveCompanions(userId, companions)
    return true
  }

  // 컴패니언 장비 장착
  equipItem(userId: string, instanceId: string, itemId: string, slot: 'accessory' | 'costume'): boolean {
    const companions = this.getAllCompanions(userId)
    const companion = companions.find(c => c.id === instanceId)
    if (!companion) return false

    if (!companion.equipment) {
      companion.equipment = {}
    }

    companion.equipment[slot] = itemId
    this.saveCompanions(userId, companions)
    return true
  }

  // 컴패니언 장비 해제
  unequipItem(userId: string, instanceId: string, slot: 'accessory' | 'costume'): boolean {
    const companions = this.getAllCompanions(userId)
    const companion = companions.find(c => c.id === instanceId)
    if (!companion || !companion.equipment) return false

    delete companion.equipment[slot]
    this.saveCompanions(userId, companions)
    return true
  }
}

export const companionService = CompanionService.getInstance()