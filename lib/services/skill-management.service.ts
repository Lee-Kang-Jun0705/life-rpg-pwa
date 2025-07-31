/**
 * 스킬 관리 서비스
 * 스킬 학습, 레벨업, 쿨다운, 퀵슬롯 관리
 */

import type { 
  Skill, 
  LearnedSkill, 
  SkillFilter, 
  SkillSortOption,
  SkillTreeNode,
  SkillUpgrade
} from '../types/skill-system'
import { SKILL_CONFIG } from '../constants/skill.constants'
import { baseSkills } from '../data/base-skills'
import { allSkills } from '../data/skills'
import { dbHelpers, type LearnedSkillData } from '../database'
import { GAME_CONFIG } from '../types/dashboard'

export interface SkillSlot {
  slot: number
  skillId: string | null
}

class SkillManagementService {
  private static instance: SkillManagementService
  private learnedSkills: Map<string, LearnedSkill> = new Map()
  private quickSlots: Map<number, string> = new Map()
  private skillPoints: number = 0
  private userId: string = GAME_CONFIG.DEFAULT_USER_ID
  private initialized: boolean = false

  private constructor() {
    // 초기화는 별도로 수행
  }

  static getInstance(): SkillManagementService {
    if (!SkillManagementService.instance) {
      SkillManagementService.instance = new SkillManagementService()
    }
    return SkillManagementService.instance
  }

  // DB에서 데이터 로드 및 초기화
  async initialize(userId: string = GAME_CONFIG.DEFAULT_USER_ID): Promise<void> {
    if (this.initialized && this.userId === userId) return
    
    this.userId = userId
    this.learnedSkills.clear()
    this.quickSlots.clear()
    
    // 학습한 스킬 로드
    const learnedSkillsData = await dbHelpers.getLearnedSkills(userId)
    for (const skillData of learnedSkillsData) {
      const learned: LearnedSkill = {
        skillId: skillData.skillId,
        level: skillData.level,
        experience: skillData.experience,
        cooldownRemaining: skillData.cooldownRemaining,
        isActive: skillData.isActive,
        slot: skillData.slot
      }
      this.learnedSkills.set(skillData.skillId, learned)
      
      if (skillData.slot) {
        this.quickSlots.set(skillData.slot, skillData.skillId)
      }
    }
    
    // 스킬 포인트 로드
    const skillPointData = await dbHelpers.getSkillPoints(userId)
    if (skillPointData) {
      this.skillPoints = skillPointData.availablePoints
    } else {
      // 초기 스킬 포인트 설정
      this.skillPoints = 1
      await dbHelpers.saveSkillPoints({
        userId,
        totalPoints: 1,
        availablePoints: 1,
        updatedAt: new Date()
      })
    }
    
    // 기본 스킬이 없으면 학습
    if (this.learnedSkills.size === 0) {
      await this.learnBasicSkills()
    }
    
    this.initialized = true
  }

  // 기본 스킬 학습 및 자동 장착
  private async learnBasicSkills(): Promise<void> {
    // 기본 공격 스킬 학습 및 퀵슬롯 1번에 장착
    await this.learnSkill('basic_attack')
    await this.assignToQuickSlot('basic_attack', 1)
    
    // 방어 스킬 학습 및 퀵슬롯 2번에 장착
    await this.learnSkill('defend')
    await this.assignToQuickSlot('defend', 2)
  }

  // 스킬 학습
  async learnSkill(skillId: string): Promise<boolean> {
    const skill = this.getSkill(skillId)
    if (!skill) return false

    // 이미 학습한 스킬인지 확인
    if (this.learnedSkills.has(skillId)) return false

    // 요구사항 확인
    if (!this.checkSkillRequirements(skill)) return false

    // 스킬 학습
    const learned: LearnedSkill = {
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0,
      isActive: false,
      slot: undefined
    }
    
    this.learnedSkills.set(skillId, learned)
    
    // DB에 저장
    await dbHelpers.saveLearnedSkill({
      userId: this.userId,
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0,
      isActive: false,
      learnedAt: new Date()
    })

    return true
  }

  // 스킬북으로 스킬 학습 (스킬 포인트 소비 없음)
  learnSkillFromBook(skillId: string): boolean {
    const skill = this.getSkill(skillId)
    if (!skill) return false

    // 이미 학습한 스킬인지 확인
    if (this.learnedSkills.has(skillId)) return false

    // 스킬 학습
    const learned: LearnedSkill = {
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0,
      isActive: false,
      slot: undefined
    }
    
    this.learnedSkills.set(skillId, learned)
    
    // DB에 저장 (async 호출하지만 결과 기다리지 않음)
    void dbHelpers.saveLearnedSkill({
      userId: this.userId,
      skillId,
      level: 1,
      experience: 0,
      cooldownRemaining: 0,
      isActive: false,
      learnedAt: new Date()
    }).catch(error => console.error('Failed to save learned skill:', error))

    return true
  }

  // 스킬 학습 취소 (롤백용)
  unlearnSkill(skillId: string): boolean {
    if (!this.learnedSkills.has(skillId)) return false
    
    this.learnedSkills.delete(skillId)
    
    // 퀵슬롯에서도 제거
    for (const [slot, id] of this.quickSlots.entries()) {
      if (id === skillId) {
        this.quickSlots.delete(slot)
        break
      }
    }
    
    // DB에서 삭제 (async 호출하지만 결과 기다리지 않음)
    void dbHelpers.deleteLearnedSkill(this.userId, skillId)
      .catch(error => console.error('Failed to delete learned skill:', error))
    
    return true
  }

  // 스킬 레벨업
  async upgradeSkill(skillId: string): Promise<boolean> {
    const learnedSkill = this.learnedSkills.get(skillId)
    if (!learnedSkill) return false

    const skill = this.getSkill(skillId)
    if (!skill) return false

    // 최대 레벨 확인
    if (learnedSkill.level >= skill.maxLevel) return false

    // 스킬 포인트 확인
    const pointsRequired = this.getUpgradePointsCost(learnedSkill.level)
    if (this.skillPoints < pointsRequired) return false

    // 레벨업
    this.skillPoints -= pointsRequired
    const updatedSkill = {
      ...learnedSkill,
      level: learnedSkill.level + 1,
      experience: 0
    }
    this.learnedSkills.set(skillId, updatedSkill)
    
    // DB 업데이트
    const skillData = await dbHelpers.getLearnedSkill(this.userId, skillId)
    if (skillData) {
      await dbHelpers.saveLearnedSkill({
        ...skillData,
        level: updatedSkill.level,
        experience: 0
      })
    }
    
    // 스킬 포인트 업데이트
    const pointData = await dbHelpers.getSkillPoints(this.userId)
    if (pointData) {
      await dbHelpers.saveSkillPoints({
        ...pointData,
        availablePoints: this.skillPoints
      })
    }

    return true
  }

  // 스킬 요구사항 확인
  private checkSkillRequirements(skill: Skill): boolean {
    if (!skill.requirements) return true

    // 레벨 요구사항
    if (skill.requirements.level) {
      // TODO: 플레이어 레벨 확인
      const playerLevel = 10
      if (playerLevel < skill.requirements.level) return false
    }

    // 선행 스킬 요구사항
    if (skill.requirements.skills) {
      for (const req of skill.requirements.skills) {
        const learned = this.learnedSkills.get(req.id)
        if (!learned || learned.level < req.level) return false
      }
    }

    return true
  }

  // 퀵슬롯 설정
  async assignToQuickSlot(skillId: string, slot: number): Promise<boolean> {
    const learnedSkill = this.learnedSkills.get(skillId)
    if (!learnedSkill) return false

    const skill = this.getSkill(skillId)
    if (!skill || skill.type === 'passive') return false

    // 슬롯 범위 확인
    if (slot < 1 || slot > SKILL_CONFIG.MAX_QUICK_SLOTS) return false

    // 기존 슬롯에서 제거
    const currentSkillInSlot = this.quickSlots.get(slot)
    if (currentSkillInSlot) {
      const currentLearned = this.learnedSkills.get(currentSkillInSlot)
      if (currentLearned) {
        this.learnedSkills.set(currentSkillInSlot, {
          ...currentLearned,
          slot: undefined
        })
        
        // DB 업데이트
        const skillData = await dbHelpers.getLearnedSkill(this.userId, currentSkillInSlot)
        if (skillData) {
          await dbHelpers.saveLearnedSkill({
            ...skillData,
            slot: undefined
          })
        }
      }
    }

    // 기존 슬롯에서 제거
    if (learnedSkill.slot) {
      this.quickSlots.delete(learnedSkill.slot)
      await dbHelpers.clearQuickSlot(this.userId, learnedSkill.slot)
    }

    // 새 슬롯에 할당
    this.quickSlots.set(slot, skillId)
    this.learnedSkills.set(skillId, {
      ...learnedSkill,
      slot
    })
    
    // DB에 저장
    await dbHelpers.saveQuickSlot({
      userId: this.userId,
      slot,
      skillId,
      updatedAt: new Date()
    })
    
    const skillData = await dbHelpers.getLearnedSkill(this.userId, skillId)
    if (skillData) {
      await dbHelpers.saveLearnedSkill({
        ...skillData,
        slot
      })
    }

    return true
  }

  // 퀵슬롯 제거
  async removeFromQuickSlot(slot: number): Promise<boolean> {
    const skillId = this.quickSlots.get(slot)
    if (!skillId) return false

    const learnedSkill = this.learnedSkills.get(skillId)
    if (!learnedSkill) return false

    this.quickSlots.delete(slot)
    this.learnedSkills.set(skillId, {
      ...learnedSkill,
      slot: undefined
    })
    
    // DB 업데이트
    await dbHelpers.clearQuickSlot(this.userId, slot)
    
    const skillData = await dbHelpers.getLearnedSkill(this.userId, skillId)
    if (skillData) {
      await dbHelpers.saveLearnedSkill({
        ...skillData,
        slot: undefined
      })
    }

    return true
  }

  // 스킬 필터링
  filterSkills(filter: SkillFilter): Skill[] {
    let skills = Object.values(allSkills)

    if (filter.category && filter.category.length > 0) {
      skills = skills.filter(skill => filter.category!.includes(skill.category))
    }

    if (filter.type && filter.type.length > 0) {
      skills = skills.filter(skill => filter.type!.includes(skill.type))
    }

    if (filter.minLevel !== undefined) {
      skills = skills.filter(skill => skill.level >= filter.minLevel!)
    }

    if (filter.maxLevel !== undefined) {
      skills = skills.filter(skill => skill.level <= filter.maxLevel!)
    }

    if (filter.learned !== undefined) {
      skills = skills.filter(skill => this.learnedSkills.has(skill.id) === filter.learned)
    }

    return skills
  }

  // 스킬 정렬
  sortSkills(skills: Skill[], sortBy: SkillSortOption, ascending: boolean = true): Skill[] {
    const sorted = [...skills].sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'level':
          compareValue = a.level - b.level
          break
        case 'category':
          compareValue = a.category.localeCompare(b.category)
          break
        case 'damage':
          compareValue = this.getSkillDamage(a) - this.getSkillDamage(b)
          break
        case 'cooldown':
          compareValue = a.cooldown - b.cooldown
          break
        case 'mpCost':
          const aCost = typeof a.mpCost === 'number' ? a.mpCost : a.mpCost.base
          const bCost = typeof b.mpCost === 'number' ? b.mpCost : b.mpCost.base
          compareValue = aCost - bCost
          break
      }

      return ascending ? compareValue : -compareValue
    })

    return sorted
  }

  // 스킬 데미지 계산 (정렬용)
  private getSkillDamage(skill: Skill): number {
    const damageEffect = skill.effects.find(e => e.type === 'damage')
    if (!damageEffect) return 0

    if (typeof damageEffect.value === 'number') {
      return damageEffect.value
    } else if ('min' in damageEffect.value) {
      return (damageEffect.value.min + damageEffect.value.max) / 2
    } else if ('base' in damageEffect.value) {
      return damageEffect.value.base
    }

    return 0
  }

  // 스킬 가져오기
  getSkill(skillId: string): Skill | null {
    return baseSkills[skillId] || null
  }

  // 학습한 스킬 정보
  getLearnedSkill(skillId: string): LearnedSkill | null {
    return this.learnedSkills.get(skillId) || null
  }

  // 모든 학습한 스킬
  getAllLearnedSkills(): LearnedSkill[] {
    return Array.from(this.learnedSkills.values())
  }

  // 학습한 스킬 Map 반환 (AutoBattleManager용)
  getLearnedSkills(): Map<string, LearnedSkill> {
    return this.learnedSkills
  }

  // 모든 스킬
  getAllSkills(): Skill[] {
    return Object.values(allSkills)
  }

  // 퀵슬롯 상태
  getQuickSlots(): SkillSlot[] {
    const slots: SkillSlot[] = []
    
    for (let i = 1; i <= SKILL_CONFIG.MAX_QUICK_SLOTS; i++) {
      slots.push({
        slot: i,
        skillId: this.quickSlots.get(i) || null
      })
    }

    return slots
  }

  // 스킬 포인트
  getSkillPoints(): number {
    return this.skillPoints
  }

  // 스킬 포인트 추가
  async addSkillPoints(points: number): Promise<void> {
    this.skillPoints += points
    await dbHelpers.addSkillPoints(this.userId, points)
  }

  // 업그레이드 비용
  private getUpgradePointsCost(currentLevel: number): number {
    return currentLevel + 1
  }

  // 스킬 쿨다운 업데이트
  updateCooldowns(deltaTime: number): void {
    this.learnedSkills.forEach((learned, skillId) => {
      if (learned.cooldownRemaining > 0) {
        this.learnedSkills.set(skillId, {
          ...learned,
          cooldownRemaining: Math.max(0, learned.cooldownRemaining - deltaTime)
        })
      }
    })
  }

  // 스킬 사용 (쿨다운 적용)
  useSkill(skillId: string): boolean {
    const learned = this.learnedSkills.get(skillId)
    if (!learned) return false

    if (learned.cooldownRemaining > 0) return false

    const skill = this.getSkill(skillId)
    if (!skill) return false

    // 쿨다운 적용
    this.learnedSkills.set(skillId, {
      ...learned,
      cooldownRemaining: skill.cooldown
    })

    return true
  }

  // 토글 스킬 상태 변경
  toggleSkill(skillId: string): boolean {
    const learned = this.learnedSkills.get(skillId)
    if (!learned) return false

    const skill = this.getSkill(skillId)
    if (!skill || skill.type !== 'toggle') return false

    this.learnedSkills.set(skillId, {
      ...learned,
      isActive: !learned.isActive
    })

    return true
  }

  // 스킬 초기화
  async resetSkills(): Promise<void> {
    // 모든 스킬 포인트 환불
    let totalPoints = 0
    this.learnedSkills.forEach(learned => {
      totalPoints += learned.level - 1
    })

    this.skillPoints += totalPoints
    
    // 모든 스킬 삭제
    for (const [skillId] of this.learnedSkills) {
      await dbHelpers.deleteLearnedSkill(this.userId, skillId)
    }
    
    // 모든 퀵슬롯 삭제
    for (let i = 1; i <= SKILL_CONFIG.MAX_QUICK_SLOTS; i++) {
      await dbHelpers.clearQuickSlot(this.userId, i)
    }
    
    this.learnedSkills.clear()
    this.quickSlots.clear()
    
    // 스킬 포인트 업데이트
    const pointData = await dbHelpers.getSkillPoints(this.userId)
    if (pointData) {
      await dbHelpers.saveSkillPoints({
        ...pointData,
        availablePoints: this.skillPoints
      })
    }

    // 기본 스킬 재학습
    await this.learnBasicSkills()
  }

  // 스킬 트리에서 학습 가능한 스킬
  getAvailableSkills(): Skill[] {
    return this.getAllSkills().filter(skill => {
      // 이미 학습한 스킬 제외
      if (this.learnedSkills.has(skill.id)) return false
      
      // 요구사항 충족 확인
      return this.checkSkillRequirements(skill)
    })
  }

  // 스킬 경험치 추가
  addSkillExperience(skillId: string, exp: number): void {
    const learned = this.learnedSkills.get(skillId)
    if (!learned) return

    const skill = this.getSkill(skillId)
    if (!skill) return

    const newExp = learned.experience + exp
    const expRequired = this.getExpRequiredForLevel(learned.level)

    if (newExp >= expRequired && learned.level < skill.maxLevel) {
      // 자동 레벨업
      this.learnedSkills.set(skillId, {
        ...learned,
        level: learned.level + 1,
        experience: newExp - expRequired
      })
    } else {
      this.learnedSkills.set(skillId, {
        ...learned,
        experience: newExp
      })
    }
  }

  // 레벨업에 필요한 경험치
  private getExpRequiredForLevel(level: number): number {
    return level * 100 * (level + 1)
  }

  // 배치 복원 메서드 - 성능 최적화를 위해 추가
  async restoreAllSkills(data: {
    learnedSkills: LearnedSkill[],
    quickSlots: Record<number, string>,
    skillPoints: number
  }): Promise<void> {
    console.time('restoreAllSkills-internal')
    
    // 스킬 초기화
    this.learnedSkills.clear()
    this.quickSlots.clear()
    this.skillPoints = data.skillPoints

    console.log(`Restoring ${data.learnedSkills.length} skills to memory...`)
    
    // 학습한 스킬 메모리에 로드 (DB 업데이트 없이)
    for (const learned of data.learnedSkills) {
      this.learnedSkills.set(learned.skillId, learned)
    }

    // 퀵슬롯 메모리에 로드 (DB 업데이트 없이)
    for (const [slot, skillId] of Object.entries(data.quickSlots)) {
      const slotNumber = Number(slot)
      this.quickSlots.set(slotNumber, skillId)
      
      // 해당 스킬의 슬롯 정보도 업데이트
      const learned = this.learnedSkills.get(skillId)
      if (learned) {
        this.learnedSkills.set(skillId, {
          ...learned,
          slot: slotNumber
        })
      }
    }

    console.log('Memory restore complete. Starting DB sync...')
    console.time('restoreAllSkills-db')
    
    // 모든 데이터를 한 번에 DB에 저장
    const dbPromises: Promise<unknown>[] = []

    // 학습한 스킬 저장
    for (const learned of data.learnedSkills) {
      dbPromises.push(dbHelpers.saveLearnedSkill({
        userId: this.userId,
        skillId: learned.skillId,
        level: learned.level,
        experience: learned.experience,
        cooldownRemaining: learned.cooldownRemaining,
        isActive: learned.isActive,
        slot: learned.slot,
        learnedAt: new Date()
      }))
    }

    // 퀵슬롯 저장
    for (const [slot, skillId] of Object.entries(data.quickSlots)) {
      dbPromises.push(dbHelpers.saveQuickSlot({
        userId: this.userId,
        slot: Number(slot),
        skillId,
        updatedAt: new Date()
      }))
    }

    // 스킬 포인트 저장
    const existingPointData = await dbHelpers.getSkillPoints(this.userId)
    if (existingPointData) {
      dbPromises.push(dbHelpers.saveSkillPoints({
        ...existingPointData,
        availablePoints: this.skillPoints
      }))
    } else {
      dbPromises.push(dbHelpers.saveSkillPoints({
        userId: this.userId,
        totalPoints: this.skillPoints,
        availablePoints: this.skillPoints,
        updatedAt: new Date()
      }))
    }

    // 모든 DB 작업을 병렬로 실행
    await Promise.all(dbPromises)
    
    console.timeEnd('restoreAllSkills-db')
    console.timeEnd('restoreAllSkills-internal')
    console.log(`Restored ${data.learnedSkills.length} skills successfully`)
  }
}

export const skillManagementService = SkillManagementService.getInstance()