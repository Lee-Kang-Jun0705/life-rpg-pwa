// JRPG 데이터베이스 헬퍼 함수들
import { db } from '../database'
import type { 
  JRPGInventory, 
  JRPGSkills, 
  JRPGBattleLog, 
  JRPGProgress 
} from '../database/types'
import type { ItemInstance, SkillInstance } from './types'
import { ItemRarity } from './item-rarity'
import { ITEM_DATABASE } from './items-database'
import { SKILL_DATABASE } from './skills-database'

export const jrpgDbHelpers = {
  // 인벤토리 관련
  async getJRPGInventory(userId: string): Promise<JRPGInventory | null> {
    if (typeof window === 'undefined' || !db) return null
    
    let inventory = await db.jrpgInventory.where('userId').equals(userId).first()
    
    if (!inventory) {
      // 기본 인벤토리 생성
      const defaultInventory: Omit<JRPGInventory, 'id'> = {
        userId,
        items: [],
        maxSlots: 50,
        updatedAt: new Date()
      }
      
      await db.jrpgInventory.add(defaultInventory)
      inventory = await db.jrpgInventory.where('userId').equals(userId).first()
    }
    
    return inventory || null
  },

  async addItemToInventory(userId: string, itemId: string, rarity?: ItemRarity): Promise<ItemInstance | null> {
    if (typeof window === 'undefined' || !db) return null
    
    const inventory = await this.getJRPGInventory(userId)
    if (!inventory || inventory.items.length >= inventory.maxSlots) return null
    
    const itemDef = ITEM_DATABASE[itemId]
    if (!itemDef) return null
    
    // 새 아이템 인스턴스 생성
    const newItem: ItemInstance = {
      id: `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      rarity: rarity || itemDef.rarity,
      level: 1,
      enhancement: 0,
      randomOptions: [],
      acquiredAt: new Date(),
      locked: false
    }
    
    // 랜덤 옵션 생성 (Rare 이상)
    if (itemDef.randomOptions && [ItemRarity.RARE, ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC].includes(newItem.rarity)) {
      newItem.randomOptions = itemDef.randomOptions.map(option => ({
        ...option,
        value: Math.floor(Math.random() * (option.max - option.min + 1)) + option.min
      }))
    }
    
    // 인벤토리 업데이트
    inventory.items.push(newItem)
    await db.jrpgInventory.update(inventory.id!, {
      items: inventory.items,
      updatedAt: new Date()
    })
    
    return newItem
  },

  async removeItemFromInventory(userId: string, itemInstanceId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const inventory = await this.getJRPGInventory(userId)
    if (!inventory) return false
    
    const itemIndex = inventory.items.findIndex(item => item.id === itemInstanceId)
    if (itemIndex === -1) return false
    
    inventory.items.splice(itemIndex, 1)
    await db.jrpgInventory.update(inventory.id!, {
      items: inventory.items,
      updatedAt: new Date()
    })
    
    return true
  },

  async equipItem(userId: string, itemInstanceId: string, characterId?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const inventory = await this.getJRPGInventory(userId)
    if (!inventory) return false
    
    const item = inventory.items.find(i => i.id === itemInstanceId)
    if (!item) return false
    
    // 이미 장착된 아이템이 있다면 해제
    inventory.items.forEach(i => {
      if (i.equippedBy === characterId || (!characterId && i.equippedBy)) {
        const itemDef = ITEM_DATABASE[i.itemId]
        const targetDef = ITEM_DATABASE[item.itemId]
        if (itemDef?.slot === targetDef?.slot) {
          i.equippedBy = undefined
        }
      }
    })
    
    // 새 아이템 장착
    item.equippedBy = characterId || userId
    
    await db.jrpgInventory.update(inventory.id!, {
      items: inventory.items,
      updatedAt: new Date()
    })
    
    return true
  },

  // 스킬 관련
  async getJRPGSkills(userId: string): Promise<JRPGSkills | null> {
    if (typeof window === 'undefined' || !db) return null
    
    let skills = await db.jrpgSkills.where('userId').equals(userId).first()
    
    if (!skills) {
      // 기본 스킬 생성
      const defaultSkills: Omit<JRPGSkills, 'id'> = {
        userId,
        skills: [
          {
            skillId: 'skill_001',
            level: 1,
            experience: 0,
            cooldownRemaining: 0
          },
          {
            skillId: 'skill_003',
            level: 1,
            experience: 0,
            cooldownRemaining: 0
          },
          {
            skillId: 'skill_005',
            level: 1,
            experience: 0,
            cooldownRemaining: 0
          }
        ],
        skillPoints: 0,
        updatedAt: new Date()
      }
      
      await db.jrpgSkills.add(defaultSkills)
      skills = await db.jrpgSkills.where('userId').equals(userId).first()
    }
    
    return skills || null
  },

  async learnSkill(userId: string, skillId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills) return false
    
    // 이미 배운 스킬인지 확인
    if (skills.skills.some(s => s.skillId === skillId)) return false
    
    const skillDef = SKILL_DATABASE[skillId]
    if (!skillDef) return false
    
    // 새 스킬 추가
    skills.skills.push({
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0
    })
    
    await db.jrpgSkills.update(skills.id!, {
      skills: skills.skills,
      updatedAt: new Date()
    })
    
    return true
  },

  async upgradeSkill(userId: string, skillId: string, experience: number): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills) return false
    
    const skill = skills.skills.find(s => s.skillId === skillId)
    if (!skill) return false
    
    const skillDef = SKILL_DATABASE[skillId]
    if (!skillDef || skill.level >= skillDef.maxLevel) return false
    
    skill.experience += experience
    
    // 레벨업 체크 (100 경험치당 1레벨)
    const requiredExp = skill.level * 100
    if (skill.experience >= requiredExp) {
      skill.level++
      skill.experience -= requiredExp
    }
    
    await db.jrpgSkills.update(skills.id!, {
      skills: skills.skills,
      updatedAt: new Date()
    })
    
    return true
  },

  // 전투 기록
  async saveBattleLog(log: Omit<JRPGBattleLog, 'id'>): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    await db.jrpgBattleLogs.add(log)
    return true
  },

  async getBattleLogs(userId: string, limit = 10): Promise<JRPGBattleLog[]> {
    if (typeof window === 'undefined' || !db) return []
    
    return await db.jrpgBattleLogs
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray()
  },

  // 진행상황
  async getJRPGProgress(userId: string): Promise<JRPGProgress | null> {
    if (typeof window === 'undefined' || !db) return null
    
    let progress = await db.jrpgProgress.where('userId').equals(userId).first()
    
    if (!progress) {
      // 기본 진행상황 생성
      const defaultProgress: Omit<JRPGProgress, 'id'> = {
        userId,
        highestDungeonCleared: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        totalDamageDealt: 0,
        totalGoldEarned: 0,
        unlockedDungeons: ['beginner_dungeon'],
        completedQuests: [],
        achievements: [],
        achievementProgress: {},
        achievementStats: {
          totalKills: 0,
          criticalHits: 0,
          totalGoldEarned: 0,
          totalItemsCollected: 0,
          questsCompleted: 0,
          dungeonClears: {},
          nightmareBossKills: 0,
          highestEnhancement: 0,
          skillsLearned: 0,
          consecutiveLogins: 0
        },
        updatedAt: new Date()
      }
      
      await db.jrpgProgress.add(defaultProgress)
      progress = await db.jrpgProgress.where('userId').equals(userId).first()
    }
    
    return progress || null
  },

  async updateJRPGProgress(userId: string, updates: Partial<JRPGProgress>): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const progress = await this.getJRPGProgress(userId)
    if (!progress || !progress.id) return false
    
    await db.jrpgProgress.update(progress.id, {
      ...updates,
      updatedAt: new Date()
    })
    
    return true
  },

  // 통계 계산
  async getEquippedItemStats(userId: string): Promise<Partial<import('./types').BaseStats>> {
    const inventory = await this.getJRPGInventory(userId)
    if (!inventory) return {}
    
    const stats: Partial<import('./types').BaseStats> = {}
    
    inventory.items
      .filter(item => item.equippedBy)
      .forEach(item => {
        const itemDef = ITEM_DATABASE[item.itemId]
        if (!itemDef) return
        
        // 기본 스탯
        Object.entries(itemDef.baseStats).forEach(([stat, value]) => {
          stats[stat as keyof import('./types').BaseStats] = 
            (stats[stat as keyof import('./types').BaseStats] || 0) + value
        })
        
        // 랜덤 옵션
        item.randomOptions?.forEach(option => {
          if (option.value) {
            stats[option.stat] = (stats[option.stat] || 0) + option.value
          }
        })
        
        // 강화 보너스 (강화당 10% 증가)
        if (item.enhancement) {
          Object.entries(itemDef.baseStats).forEach(([stat, value]) => {
            const bonus = Math.floor(value * item.enhancement! * 0.1)
            stats[stat as keyof import('./types').BaseStats] = 
              (stats[stat as keyof import('./types').BaseStats] || 0) + bonus
          })
        }
      })
    
    return stats
  },
  
  // 진행상황 저장 (achievement-manager용)
  async saveJRPGProgress(userId: string, progress: JRPGProgress): Promise<boolean> {
    if (typeof window === 'undefined' || !db || !progress.id) return false
    
    await db.jrpgProgress.update(progress.id, {
      ...progress,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // 스킬 업그레이드 (스킬 포인트 사용)
  async upgradeSkill(userId: string, skillId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills || skills.skillPoints <= 0) return false
    
    const skill = skills.skills.find(s => s.skillId === skillId)
    if (!skill) return false
    
    const skillDef = SKILL_DATABASE[skillId]
    if (!skillDef || skill.level >= skillDef.maxLevel) return false
    
    // 스킬 레벨업
    skill.level++
    skills.skillPoints--
    
    await db.jrpgSkills.update(skills.id!, {
      skills: skills.skills,
      skillPoints: skills.skillPoints,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // 스킬 장착
  async equipSkill(userId: string, skillId: string, slotIndex: number): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills) return false
    
    const skill = skills.skills.find(s => s.skillId === skillId)
    if (!skill) return false
    
    // 현재 장착된 스킬 확인
    if (!skills.equippedSkills) {
      skills.equippedSkills = [null, null, null, null]
    }
    
    // 이미 다른 슬롯에 장착되어 있으면 제거
    const currentSlot = skills.equippedSkills.findIndex(s => s === skillId)
    if (currentSlot !== -1) {
      skills.equippedSkills[currentSlot] = null
    }
    
    // 새 슬롯에 장착
    skills.equippedSkills[slotIndex] = skillId
    
    await db.jrpgSkills.update(skills.id!, {
      equippedSkills: skills.equippedSkills,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // 스킬 장착 해제
  async unequipSkill(userId: string, slotIndex: number): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills || !skills.equippedSkills) return false
    
    skills.equippedSkills[slotIndex] = null
    
    await db.jrpgSkills.update(skills.id!, {
      equippedSkills: skills.equippedSkills,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // 전투에서 스킬 사용 기록
  async useSkillInBattle(userId: string, skillId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const skills = await this.getJRPGSkills(userId)
    if (!skills) return false
    
    const skill = skills.skills.find(s => s.skillId === skillId)
    if (!skill) return false
    
    // 경험치 증가 (사용시마다 10 경험치)
    skill.experience = (skill.experience || 0) + 10
    
    // 레벨업 체크 (100 경험치당 1레벨)
    const requiredExp = skill.level * 100
    if (skill.experience >= requiredExp) {
      const skillDef = SKILL_DATABASE[skillId]
      if (skillDef && skill.level < skillDef.maxLevel) {
        skill.level++
        skill.experience -= requiredExp
      }
    }
    
    await db.jrpgSkills.update(skills.id!, {
      skills: skills.skills,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // 스킬 쿨다운 업데이트
  async updateSkillCooldowns(userId: string, skills: SkillInstance[]): Promise<boolean> {
    if (typeof window === 'undefined' || !db) return false
    
    const jrpgSkills = await this.getJRPGSkills(userId)
    if (!jrpgSkills) return false
    
    jrpgSkills.skills = skills
    
    await db.jrpgSkills.update(jrpgSkills.id!, {
      skills: jrpgSkills.skills,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // JRPG 인벤토리 저장
  async saveJRPGInventory(userId: string, inventory: JRPGInventory): Promise<boolean> {
    if (typeof window === 'undefined' || !db || !inventory.id) return false
    
    await db.jrpgInventory.update(inventory.id, {
      ...inventory,
      updatedAt: new Date()
    })
    
    return true
  },
  
  // JRPG 스킬 저장
  async saveJRPGSkills(userId: string, skills: JRPGSkills): Promise<boolean> {
    if (typeof window === 'undefined' || !db || !skills.id) return false
    
    await db.jrpgSkills.update(skills.id, {
      ...skills,
      updatedAt: new Date()
    })
    
    return true
  }
}