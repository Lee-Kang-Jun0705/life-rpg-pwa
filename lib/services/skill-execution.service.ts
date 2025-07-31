/**
 * 스킬 실행 서비스
 * 스킬 사용, 효과 적용, 쿨다운 관리 등
 */

import type { 
  Skill, 
  SkillExecutionResult, 
  SkillContext,
  SkillEffect,
  TargetType,
  ElementType,
  EffectType
} from '@/lib/types/skill-system'
import type { CombatParticipant } from '@/lib/types/combat-system'
import { 
  SKILL_LEVEL_CONFIG, 
  ELEMENT_EFFECTIVENESS,
  SKILL_EFFECT_CONFIG,
  COMBO_CONFIG
} from '@/lib/constants/skill.constants'
import { baseSkills } from '@/lib/data/base-skills'
import { skillCombos, checkComboActivation } from '@/lib/data/skill-combos'

export class SkillExecutionService {
  private static instance: SkillExecutionService
  private cooldowns: Map<string, Map<string, number>> = new Map() // userId -> skillId -> cooldownEnd
  private recentSkills: Map<string, { skillId: string; timestamp: number }[]> = new Map()

  static getInstance(): SkillExecutionService {
    if (!this.instance) {
      this.instance = new SkillExecutionService()
    }
    return this.instance
  }

  /**
   * 스킬 실행
   */
  executeSkill(
    skillId: string,
    casterId: string,
    targets: string[],
    context: SkillContext,
    skillLevel: number = 1
  ): SkillExecutionResult {
    const skill = this.getSkill(skillId)
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`)
    }

    // 쿨다운 체크
    if (this.isOnCooldown(casterId, skillId)) {
      throw new Error('Skill is on cooldown')
    }

    // MP 체크
    const mpCost = this.calculateMPCost(skill, skillLevel)
    if (context.caster.stats.mp < mpCost) {
      throw new Error('Not enough MP')
    }

    // 타겟 유효성 체크
    const validTargets = this.validateTargets(skill, casterId, targets, context)
    if (validTargets.length === 0) {
      throw new Error('No valid targets')
    }

    // 스킬 효과 적용
    const effects = this.applySkillEffects(
      skill,
      skillLevel,
      casterId,
      validTargets,
      context
    )

    // 쿨다운 설정
    this.setCooldown(casterId, skillId, skill.cooldown, skillLevel)

    // 최근 스킬 기록 (콤보용)
    this.recordSkillUsage(casterId, skillId)

    // 콤보 체크
    const combo = this.checkForCombo(casterId)

    const result: SkillExecutionResult = {
      skillId,
      caster: casterId,
      targets: validTargets,
      effects,
      combos: combo ? [combo.id] : undefined,
      timestamp: Date.now()
    }

    return result
  }

  /**
   * 스킬 가져오기
   */
  private getSkill(skillId: string): Skill | null {
    return baseSkills[skillId] || null
  }

  /**
   * 쿨다운 체크
   */
  isOnCooldown(userId: string, skillId: string): boolean {
    const userCooldowns = this.cooldowns.get(userId)
    if (!userCooldowns) return false

    const cooldownEnd = userCooldowns.get(skillId)
    if (!cooldownEnd) return false

    return Date.now() < cooldownEnd
  }

  /**
   * 남은 쿨다운 시간
   */
  getRemainingCooldown(userId: string, skillId: string): number {
    const userCooldowns = this.cooldowns.get(userId)
    if (!userCooldowns) return 0

    const cooldownEnd = userCooldowns.get(skillId)
    if (!cooldownEnd) return 0

    const remaining = cooldownEnd - Date.now()
    return remaining > 0 ? remaining : 0
  }

  /**
   * 쿨다운 설정
   */
  private setCooldown(
    userId: string,
    skillId: string,
    baseCooldown: number,
    skillLevel: number
  ): void {
    if (!this.cooldowns.has(userId)) {
      this.cooldowns.set(userId, new Map())
    }

    // 레벨에 따른 쿨다운 감소
    const cooldownReduction = skillLevel * SKILL_LEVEL_CONFIG.cooldownReductionPerLevel
    const finalCooldown = baseCooldown * (1 - Math.min(cooldownReduction, 0.5))

    const userCooldowns = this.cooldowns.get(userId)!
    userCooldowns.set(skillId, Date.now() + finalCooldown * 1000)
  }

  /**
   * MP 소비량 계산
   */
  private calculateMPCost(skill: Skill, level: number): number {
    let baseCost: number
    
    if (typeof skill.mpCost === 'number') {
      baseCost = skill.mpCost
    } else {
      baseCost = skill.mpCost.base + (level - 1) * skill.mpCost.perLevel
    }

    // 레벨에 따른 MP 감소
    const costReduction = level * SKILL_LEVEL_CONFIG.manaCostReductionPerLevel
    return Math.floor(baseCost * (1 - Math.min(costReduction, 0.7)))
  }

  /**
   * 타겟 검증
   */
  private validateTargets(
    skill: Skill,
    casterId: string,
    targets: string[],
    context: SkillContext
  ): string[] {
    const validTargets: string[] = []
    const casterTeam = context.caster.id === casterId ? 'player' : 'enemy'

    switch (skill.target) {
      case 'self':
        return [casterId]
      
      case 'singleEnemy':
        const enemy = context.targets.find(t => 
          t.id === targets[0] && 
          this.isEnemy(casterTeam, t.id, context)
        )
        return enemy ? [enemy.id] : []
      
      case 'allEnemies':
        return context.targets
          .filter(t => this.isEnemy(casterTeam, t.id, context))
          .map(t => t.id)
      
      case 'singleAlly':
        const ally = context.targets.find(t => 
          t.id === targets[0] && 
          !this.isEnemy(casterTeam, t.id, context)
        )
        return ally ? [ally.id] : []
      
      case 'allAllies':
        return context.targets
          .filter(t => !this.isEnemy(casterTeam, t.id, context))
          .map(t => t.id)
      
      case 'randomEnemy':
        const enemies = context.targets.filter(t => 
          this.isEnemy(casterTeam, t.id, context)
        )
        if (enemies.length > 0) {
          const random = enemies[Math.floor(Math.random() * enemies.length)]
          return [random.id]
        }
        return []
      
      case 'area':
        // TODO: 범위 공격 구현
        return targets.slice(0, 3) // 임시로 최대 3명
      
      default:
        return []
    }
  }

  /**
   * 적인지 확인
   */
  private isEnemy(casterTeam: string, targetId: string, context: SkillContext): boolean {
    // context에서 target 정보를 찾아서 팀 확인
    const target = context.targets.find(t => t.id === targetId)
    if (!target) return false
    
    // CombatParticipant에 team 속성이 있다면 사용
    if ('team' in target) {
      return (target as any).team !== casterTeam
    }
    
    // 없다면 ID 기반으로 판단
    return targetId.startsWith('enemy_')
  }

  /**
   * 스킬 효과 적용
   */
  private applySkillEffects(
    skill: Skill,
    level: number,
    casterId: string,
    targets: string[],
    context: SkillContext
  ): Array<{
    targetId: string
    effect: SkillEffect
    actualValue: number
    isCritical?: boolean
    isResisted?: boolean
    isDodged?: boolean
  }> {
    const results = []
    const caster = context.caster

    for (const targetId of targets) {
      const target = context.targets.find(t => t.id === targetId)
      if (!target) continue

      for (const effect of skill.effects) {
        const result = this.applySingleEffect(
          effect,
          level,
          caster,
          target,
          skill,
          context
        )
        
        results.push({
          targetId,
          effect,
          ...result
        })
      }
    }

    return results
  }

  /**
   * 단일 효과 적용
   */
  private applySingleEffect(
    effect: SkillEffect,
    level: number,
    caster: SkillContext['caster'],
    target: SkillContext['targets'][0],
    skill: Skill,
    context: SkillContext
  ): {
    actualValue: number
    isCritical?: boolean
    isResisted?: boolean
    isDodged?: boolean
  } {
    let value = 0
    let isCritical = false
    let isResisted = false
    let isDodged = false

    // 기본 값 계산
    if (typeof effect.value === 'number') {
      value = effect.value
    } else if ('min' in effect.value && 'max' in effect.value) {
      value = effect.value.min + Math.random() * (effect.value.max - effect.value.min)
    } else if ('base' in effect.value && 'scaling' in effect.value) {
      value = effect.value.base + (level - 1) * effect.value.scaling
    }

    // 레벨 보너스
    value *= (1 + (level - 1) * SKILL_LEVEL_CONFIG.damagePerLevel)

    switch (effect.type) {
      case 'damage':
        // 회피 체크
        if (Math.random() < target.stats.dodge) {
          isDodged = true
          return { actualValue: 0, isDodged }
        }

        // 치명타 체크
        if (Math.random() < caster.stats.critRate) {
          isCritical = true
          value *= caster.stats.critDamage
        }

        // 원소 상성 적용
        if (effect.element) {
          const effectiveness = this.getElementalEffectiveness(
            effect.element,
            target.resistances
          )
          value *= effectiveness
        }

        // 방어력 적용
        value = Math.max(1, value - target.stats.defense * 0.5)

        // 데미지 변동
        value *= (0.9 + Math.random() * 0.2)
        break

      case 'heal':
        // 회복량은 대상의 최대 HP 비율로 제한
        value = Math.min(value, target.stats.maxHp - target.stats.hp)
        break

      case 'buff':
      case 'debuff':
        // 저항 체크
        if (effect.type === 'debuff' && Math.random() < target.stats.resistance) {
          isResisted = true
          return { actualValue: 0, isResisted }
        }
        break
    }

    return {
      actualValue: Math.floor(value),
      isCritical,
      isResisted,
      isDodged
    }
  }

  /**
   * 원소 효과 계산
   */
  private getElementalEffectiveness(
    attackElement: ElementType,
    targetResistances?: Partial<Record<ElementType, number>>
  ): number {
    // 기본 원소 상성
    let effectiveness = 1

    // 타겟의 원소 저항 적용
    if (targetResistances && targetResistances[attackElement]) {
      effectiveness *= (1 - targetResistances[attackElement]!)
    }

    return effectiveness
  }

  /**
   * 스킬 사용 기록
   */
  private recordSkillUsage(userId: string, skillId: string): void {
    if (!this.recentSkills.has(userId)) {
      this.recentSkills.set(userId, [])
    }

    const userSkills = this.recentSkills.get(userId)!
    userSkills.push({ skillId, timestamp: Date.now() })

    // 오래된 기록 제거 (10초 이상)
    const cutoff = Date.now() - 10000
    const filtered = userSkills.filter(s => s.timestamp > cutoff)
    this.recentSkills.set(userId, filtered)
  }

  /**
   * 콤보 체크
   */
  private checkForCombo(userId: string): { id: string; name: string } | null {
    const userSkills = this.recentSkills.get(userId) || []
    const combos = Object.values(skillCombos)
    
    return checkComboActivation(userSkills, combos)
  }

  /**
   * 스킬 레벨업
   */
  levelUpSkill(
    userId: string,
    skillId: string,
    currentLevel: number
  ): { success: boolean; newLevel: number; cost: number } {
    const skill = this.getSkill(skillId)
    if (!skill) {
      return { success: false, newLevel: currentLevel, cost: 0 }
    }

    if (currentLevel >= skill.maxLevel) {
      return { success: false, newLevel: currentLevel, cost: 0 }
    }

    // 레벨업 비용 계산
    const cost = this.calculateLevelUpCost(currentLevel)

    return {
      success: true,
      newLevel: currentLevel + 1,
      cost
    }
  }

  /**
   * 레벨업 비용 계산
   */
  private calculateLevelUpCost(currentLevel: number): number {
    const base = SKILL_LEVEL_CONFIG.expRequiredBase
    const multiplier = SKILL_LEVEL_CONFIG.expMultiplier
    return Math.floor(base * Math.pow(multiplier, currentLevel))
  }

  /**
   * 모든 쿨다운 초기화
   */
  clearAllCooldowns(userId: string): void {
    this.cooldowns.delete(userId)
  }

  /**
   * 특정 스킬 쿨다운 초기화
   */
  clearSkillCooldown(userId: string, skillId: string): void {
    const userCooldowns = this.cooldowns.get(userId)
    if (userCooldowns) {
      userCooldowns.delete(skillId)
    }
  }
}

// 싱글톤 인스턴스 export
export const skillExecutionService = SkillExecutionService.getInstance()