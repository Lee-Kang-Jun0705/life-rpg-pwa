// 스킬 시스템 서비스
import type { LearnedSkill, Skill, SkillEffect, SkillExecutionResult } from '@/lib/types/skill-system'
import { allSkills } from '@/lib/data/skills'
import { SKILL_CONSTANTS } from '@/lib/types/skill.types'

const STORAGE_KEY = 'life-rpg-skills'

interface PlayerSkillData {
  userId: string
  learnedSkills: LearnedSkill[]
  equippedSkills: (string | null)[]
  skillPoints: number
  cooldowns: Record<string, number> // 스킬별 남은 쿨다운
}

class SkillService {
  private static instance: SkillService

  static getInstance(): SkillService {
    if (!SkillService.instance) {
      SkillService.instance = new SkillService()
    }
    return SkillService.instance
  }

  // 플레이어 스킬 데이터 가져오기
  getPlayerSkills(userId: string): PlayerSkillData {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load skills:', error)
    }

    // 기본 스킬 데이터 생성
    return this.createDefaultSkillData(userId)
  }

  // 기본 스킬 데이터 생성
  private createDefaultSkillData(userId: string): PlayerSkillData {
    const defaultData: PlayerSkillData = {
      userId,
      learnedSkills: [
        {
          skillId: 'basic_attack',
          level: 1,
          experience: 0,
          cooldownRemaining: 0,
          isActive: false,
          slot: 1
        }
      ],
      equippedSkills: ['basic_attack', null, null, null],
      skillPoints: 0,
      cooldowns: {}
    }

    this.savePlayerSkills(userId, defaultData)
    return defaultData
  }

  // 스킬 데이터 저장
  private savePlayerSkills(userId: string, data: PlayerSkillData): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(data))
      window.dispatchEvent(new Event('skills-changed'))
    } catch (error) {
      console.error('Failed to save skills:', error)
    }
  }

  // 스킬 학습
  learnSkill(userId: string, skillId: string): boolean {
    const playerData = this.getPlayerSkills(userId)
    const skill = allSkills[skillId]
    
    if (!skill) {
      console.error('Skill not found:', skillId)
      return false
    }

    // 이미 학습한 스킬인지 확인
    if (playerData.learnedSkills.some(ls => ls.skillId === skillId)) {
      console.error('Skill already learned:', skillId)
      return false
    }

    // 스킬 포인트 확인
    if (playerData.skillPoints <= 0) {
      console.error('Not enough skill points')
      return false
    }

    // 새 스킬 추가
    playerData.learnedSkills.push({
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0,
      isActive: false
    })

    playerData.skillPoints -= 1
    this.savePlayerSkills(userId, playerData)
    return true
  }

  // 스킬 레벨업
  upgradeSkill(userId: string, skillId: string): boolean {
    const playerData = this.getPlayerSkills(userId)
    const learnedSkill = playerData.learnedSkills.find(ls => ls.skillId === skillId)
    
    if (!learnedSkill) {
      console.error('Skill not learned:', skillId)
      return false
    }

    const skill = allSkills[skillId]
    if (!skill) {
      return false
    }

    // 최대 레벨 확인
    if (learnedSkill.level >= skill.maxLevel) {
      console.error('Skill already at max level')
      return false
    }

    // 스킬 포인트 확인
    if (playerData.skillPoints <= 0) {
      console.error('Not enough skill points')
      return false
    }

    // 레벨업
    learnedSkill.level += 1
    playerData.skillPoints -= 1
    this.savePlayerSkills(userId, playerData)
    return true
  }

  // 스킬 장착
  equipSkill(userId: string, skillId: string, slot: number): boolean {
    if (slot < 1 || slot > SKILL_CONSTANTS.MAX_EQUIPPED_SKILLS) {
      console.error('Invalid slot number')
      return false
    }

    const playerData = this.getPlayerSkills(userId)
    const learnedSkill = playerData.learnedSkills.find(ls => ls.skillId === skillId)
    
    if (!learnedSkill) {
      console.error('Skill not learned:', skillId)
      return false
    }

    // 기존 슬롯 해제
    const slotIndex = slot - 1
    const previousSkillId = playerData.equippedSkills[slotIndex]
    if (previousSkillId) {
      const previousSkill = playerData.learnedSkills.find(ls => ls.skillId === previousSkillId)
      if (previousSkill) {
        previousSkill.slot = undefined
      }
    }

    // 새 스킬 장착
    playerData.equippedSkills[slotIndex] = skillId
    learnedSkill.slot = slot

    this.savePlayerSkills(userId, playerData)
    return true
  }

  // 스킬 사용
  useSkill(userId: string, skillId: string, context: {
    playerStats: { attack: number; hp: number; maxHp: number; mp: number; maxMp: number }
    targets?: any[]
  }): SkillExecutionResult | null {
    const playerData = this.getPlayerSkills(userId)
    const learnedSkill = playerData.learnedSkills.find(ls => ls.skillId === skillId)
    
    if (!learnedSkill) {
      console.error('Skill not learned:', skillId)
      return null
    }

    const skill = allSkills[skillId]
    if (!skill) {
      return null
    }

    // 쿨다운 확인
    const cooldownRemaining = playerData.cooldowns[skillId] || 0
    if (cooldownRemaining > 0) {
      console.error('Skill on cooldown:', cooldownRemaining)
      return null
    }

    // MP 비용 계산
    const mpCost = typeof skill.mpCost === 'number' 
      ? skill.mpCost 
      : skill.mpCost.base + (skill.mpCost.perLevel * (learnedSkill.level - 1))

    if (context.playerStats.mp < mpCost) {
      console.error('Not enough MP')
      return null
    }

    // 스킬 효과 적용
    const effects: SkillExecutionResult['effects'] = []
    
    skill.effects.forEach(effect => {
      const baseValue = this.calculateEffectValue(effect, learnedSkill.level, context.playerStats)
      
      effects.push({
        targetId: 'target', // 실제 구현시 타겟 ID 사용
        effect,
        actualValue: baseValue,
        isCritical: false,
        isResisted: false,
        isDodged: false
      })
    })

    // 쿨다운 설정
    playerData.cooldowns[skillId] = skill.cooldown
    this.savePlayerSkills(userId, playerData)

    return {
      skillId,
      caster: userId,
      targets: context.targets?.map(t => t.id) || [],
      effects,
      timestamp: Date.now()
    }
  }

  // 효과 값 계산
  private calculateEffectValue(effect: SkillEffect, skillLevel: number, playerStats: any): number {
    let baseValue = 0
    
    if (typeof effect.value === 'number') {
      baseValue = effect.value
    } else if ('base' in effect.value && 'scaling' in effect.value) {
      if (effect.type === 'damage') {
        baseValue = (effect.value.base / 100) * playerStats.attack * effect.value.scaling
      } else if (effect.type === 'heal') {
        baseValue = (effect.value.base / 100) * playerStats.maxHp
      } else {
        baseValue = effect.value.base
      }
    }

    // 스킬 레벨 보너스 적용
    const levelBonus = 1 + ((skillLevel - 1) * 0.1)
    return Math.floor(baseValue * levelBonus)
  }

  // 쿨다운 감소 (턴 경과)
  reduceCooldowns(userId: string, amount: number = 1): void {
    const playerData = this.getPlayerSkills(userId)
    
    Object.keys(playerData.cooldowns).forEach(skillId => {
      if (playerData.cooldowns[skillId] > 0) {
        playerData.cooldowns[skillId] = Math.max(0, playerData.cooldowns[skillId] - amount)
      }
    })

    this.savePlayerSkills(userId, playerData)
  }

  // 스킬 포인트 추가
  addSkillPoints(userId: string, points: number): void {
    const playerData = this.getPlayerSkills(userId)
    playerData.skillPoints += points
    this.savePlayerSkills(userId, playerData)
  }

  // 장착된 스킬 가져오기
  getEquippedSkills(userId: string): (Skill | null)[] {
    const playerData = this.getPlayerSkills(userId)
    return playerData.equippedSkills.map(skillId => {
      if (!skillId) return null
      return allSkills[skillId] || null
    })
  }

  // 학습 가능한 스킬 목록
  getAvailableSkills(userId: string, playerLevel: number): Skill[] {
    const playerData = this.getPlayerSkills(userId)
    const learnedSkillIds = new Set(playerData.learnedSkills.map(ls => ls.skillId))
    
    return Object.values(allSkills).filter(skill => {
      // 이미 학습한 스킬 제외
      if (learnedSkillIds.has(skill.id)) return false
      
      // 레벨 요구사항 확인
      if (skill.requirements?.level && skill.requirements.level > playerLevel) return false
      
      // 선행 스킬 요구사항 확인
      if (skill.requirements?.skills) {
        for (const req of skill.requirements.skills) {
          const learned = playerData.learnedSkills.find(ls => ls.skillId === req.id)
          if (!learned || learned.level < req.level) return false
        }
      }
      
      return true
    })
  }

  // 패시브 스킬 효과 계산
  calculatePassiveEffects(userId: string): {
    attackBonus: number
    defenseBonus: number
    hpBonus: number
    speedBonus: number
  } {
    const playerData = this.getPlayerSkills(userId)
    let attackBonus = 0
    let defenseBonus = 0
    let hpBonus = 0
    let speedBonus = 0

    playerData.learnedSkills.forEach(learnedSkill => {
      const skill = allSkills[learnedSkill.skillId]
      if (!skill || skill.type !== 'passive') return

      skill.effects.forEach(effect => {
        if (effect.type === 'buff' && typeof effect.value === 'number') {
          const bonus = effect.value + (learnedSkill.level - 1) * 2 // 레벨당 2% 추가
          
          // stat 필드가 없는 경우 기본적으로 공격력에 적용
          attackBonus += bonus
        }
      })
    })

    return { attackBonus, defenseBonus, hpBonus, speedBonus }
  }
}

export const skillService = SkillService.getInstance()