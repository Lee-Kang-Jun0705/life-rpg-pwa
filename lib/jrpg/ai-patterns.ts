// JRPG 몬스터 AI 패턴 시스템
import type { AIPattern, AIBehavior, BattleUnit, SkillInstance, StatusEffectType } from './types'
import { SKILL_DATABASE } from './skills-database'

// AI 패턴별 기본 행동 정의
export const AI_PATTERN_BEHAVIORS: Record<AIPattern, AIBehavior> = {
  aggressive: {
    pattern: 'aggressive',
    priorityTargeting: 'lowest_hp',
    skillUsageRate: 0.8,
    healThreshold: 0.2,
    buffDebuffPriority: 0.3,
    escapeThreshold: 0.1
  },
  defensive: {
    pattern: 'defensive',
    priorityTargeting: 'highest_threat',
    skillUsageRate: 0.5,
    healThreshold: 0.6,
    buffDebuffPriority: 0.7,
    escapeThreshold: 0.3
  },
  balanced: {
    pattern: 'balanced',
    priorityTargeting: 'random',
    skillUsageRate: 0.6,
    healThreshold: 0.4,
    buffDebuffPriority: 0.5,
    escapeThreshold: 0.2
  },
  berserk: {
    pattern: 'berserk',
    priorityTargeting: 'random',
    skillUsageRate: 1.0,
    healThreshold: 0,
    buffDebuffPriority: 0,
    escapeThreshold: 0
  }
}

// AI 행동 선택 인터페이스
export interface AIDecision {
  action: 'attack' | 'skill' | 'defend' | 'escape'
  skillId?: string
  targetId?: string
  priority: number
}

// 스킬 카테고리 분류
function categorizeSkill(skillId: string): 'damage' | 'heal' | 'buff' | 'debuff' | 'other' {
  const skill = SKILL_DATABASE[skillId]
  if (!skill) return 'other'
  
  if (skill.baseDamage && skill.baseDamage > 0) return 'damage'
  if (skill.baseHeal && skill.baseHeal > 0) return 'heal'
  if (skill.attackBonus || skill.defenseBonus) return 'buff'
  if (skill.speedReduction || skill.statusEffect) return 'debuff'
  
  return 'other'
}

// 위협도 계산 (플레이어가 몬스터에게 주는 위협)
function calculateThreat(unit: BattleUnit, damageDealt: number = 0): number {
  const stats = unit.stats
  const attackPower = stats.attack || 100
  const level = unit.level || Math.floor(attackPower / 10) // 추정 레벨
  const currentHp = unit.currentHp || stats.hp
  const maxHp = stats.maxHp || stats.hp
  const hpRatio = currentHp / maxHp
  
  // 기본 위협도 = 공격력 + 최근 데미지 * 2 + 레벨 * 10
  let threat = attackPower + damageDealt * 2 + level * 10
  
  // HP가 낮을수록 위협도 증가 (마무리 가능성)
  if (hpRatio < 0.3) threat *= 1.5
  
  return threat
}

// AI 의사결정 함수
export function makeAIDecision(
  self: BattleUnit,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  behavior: AIBehavior,
  difficulty: number = 2, // 1-4 난이도
  recentDamage: Record<string, number> = {}
): AIDecision {
  const decisions: AIDecision[] = []
  const currentHp = self.currentHp || self.stats.hp
  const maxHp = self.stats.maxHp || self.stats.hp
  const hpRatio = currentHp / maxHp
  
  // 1. 도망 체크
  if (behavior.escapeThreshold && hpRatio <= behavior.escapeThreshold) {
    decisions.push({
      action: 'escape',
      priority: 100
    })
  }
  
  // 2. 회복 체크
  if (behavior.healThreshold && hpRatio <= behavior.healThreshold) {
    const healSkills = self.skills.filter(s => {
      const skillDef = SKILL_DATABASE[s.skillId]
      return skillDef && categorizeSkill(s.skillId) === 'heal' && s.cooldownRemaining === 0
    })
    
    if (healSkills.length > 0) {
      const skill = healSkills[0]
      decisions.push({
        action: 'skill',
        skillId: skill.skillId,
        targetId: self.id,
        priority: 90
      })
    }
  }
  
  // 3. 버프/디버프 체크
  if (behavior.buffDebuffPriority > Math.random()) {
    // 버프 스킬 체크
    const buffSkills = self.skills.filter(s => {
      const skillDef = SKILL_DATABASE[s.skillId]
      return skillDef && categorizeSkill(s.skillId) === 'buff' && s.cooldownRemaining === 0
    })
    
    if (buffSkills.length > 0 && Math.random() < behavior.buffDebuffPriority) {
      const skill = buffSkills[Math.floor(Math.random() * buffSkills.length)]
      const targetId = SKILL_DATABASE[skill.skillId]?.targetType === 'self' ? self.id : undefined
      
      decisions.push({
        action: 'skill',
        skillId: skill.skillId,
        targetId,
        priority: 70
      })
    }
    
    // 디버프 스킬 체크
    const debuffSkills = self.skills.filter(s => {
      const skillDef = SKILL_DATABASE[s.skillId]
      return skillDef && categorizeSkill(s.skillId) === 'debuff' && s.cooldownRemaining === 0
    })
    
    if (debuffSkills.length > 0 && Math.random() < behavior.buffDebuffPriority) {
      const skill = debuffSkills[Math.floor(Math.random() * debuffSkills.length)]
      const target = selectTarget(enemies, behavior.priorityTargeting || 'random', recentDamage)
      
      if (target) {
        decisions.push({
          action: 'skill',
          skillId: skill.skillId,
          targetId: target.id,
          priority: 65
        })
      }
    }
  }
  
  // 4. 공격 스킬 사용
  if (Math.random() < behavior.skillUsageRate) {
    const damageSkills = self.skills.filter(s => {
      const skillDef = SKILL_DATABASE[s.skillId]
      return skillDef && categorizeSkill(s.skillId) === 'damage' && s.cooldownRemaining === 0
    })
    
    if (damageSkills.length > 0) {
      // 난이도에 따라 더 강력한 스킬 선택
      const sortedSkills = damageSkills.sort((a, b) => {
        const skillA = SKILL_DATABASE[a.skillId]
        const skillB = SKILL_DATABASE[b.skillId]
        const damageA = (skillA?.baseDamage || 0) + (skillA?.damagePerLevel || 0) * a.level
        const damageB = (skillB?.baseDamage || 0) + (skillB?.damagePerLevel || 0) * b.level
        return damageB - damageA
      })
      
      // 높은 난이도일수록 강한 스킬 선택 확률 증가
      const skillIndex = Math.floor(Math.random() * Math.max(1, sortedSkills.length - (4 - difficulty)))
      const skill = sortedSkills[skillIndex]
      const skillDef = SKILL_DATABASE[skill.skillId]
      
      if (skillDef) {
        let targetId: string | undefined
        
        if (skillDef.targetType === 'single') {
          const target = selectTarget(enemies, behavior.priorityTargeting || 'random', recentDamage)
          targetId = target?.id
        } else if (skillDef.targetType === 'self') {
          targetId = self.id
        }
        
        decisions.push({
          action: 'skill',
          skillId: skill.skillId,
          targetId,
          priority: 80
        })
      }
    }
  }
  
  // 5. 기본 공격
  const target = selectTarget(enemies, behavior.priorityTargeting || 'random', recentDamage)
  if (target) {
    decisions.push({
      action: 'attack',
      targetId: target.id,
      priority: 50
    })
  }
  
  // 6. 방어
  if (hpRatio < 0.5 && behavior.pattern === 'defensive') {
    decisions.push({
      action: 'defend',
      priority: 60
    })
  }
  
  // 가장 높은 우선순위 행동 선택
  decisions.sort((a, b) => b.priority - a.priority)
  return decisions[0] || { action: 'attack', priority: 0 }
}

// 타겟 선택 함수
function selectTarget(
  enemies: BattleUnit[],
  targeting: 'lowest_hp' | 'highest_threat' | 'random',
  recentDamage: Record<string, number>
): BattleUnit | null {
  const aliveEnemies = enemies.filter(e => (e.currentHp || e.stats.hp) > 0)
  if (aliveEnemies.length === 0) return null
  
  switch (targeting) {
    case 'lowest_hp':
      return aliveEnemies.reduce((lowest, current) => {
        const currentHp = current.currentHp || current.stats.hp
        const lowestHp = lowest.currentHp || lowest.stats.hp
        return currentHp < lowestHp ? current : lowest
      })
      
    case 'highest_threat':
      return aliveEnemies.reduce((highest, current) => {
        const currentThreat = calculateThreat(current, recentDamage[current.id] || 0)
        const highestThreat = calculateThreat(highest, recentDamage[highest.id] || 0)
        return currentThreat > highestThreat ? current : highest
      })
      
    case 'random':
    default:
      return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
  }
}

// AI 행동 패턴 학습/적응 (고급 기능)
export class AdaptiveAI {
  private successRates: Map<string, number> = new Map()
  private actionHistory: Array<{ action: AIDecision; result: 'success' | 'failure' }> = []
  
  recordAction(action: AIDecision, success: boolean) {
    const key = `${action.action}_${action.skillId || 'basic'}`
    const currentRate = this.successRates.get(key) || 0.5
    const newRate = currentRate * 0.9 + (success ? 0.1 : 0)
    this.successRates.set(key, newRate)
    
    this.actionHistory.push({ action, result: success ? 'success' : 'failure' })
    if (this.actionHistory.length > 100) {
      this.actionHistory.shift()
    }
  }
  
  adjustDecision(decision: AIDecision): AIDecision {
    const key = `${decision.action}_${decision.skillId || 'basic'}`
    const successRate = this.successRates.get(key) || 0.5
    
    // 성공률이 낮은 행동의 우선순위 감소
    if (successRate < 0.3) {
      decision.priority *= 0.5
    } else if (successRate > 0.7) {
      decision.priority *= 1.2
    }
    
    return decision
  }
  
  getInsights(): { preferredActions: string[]; avoidedActions: string[] } {
    const sorted = Array.from(this.successRates.entries())
      .sort((a, b) => b[1] - a[1])
    
    return {
      preferredActions: sorted.slice(0, 3).map(([key]) => key),
      avoidedActions: sorted.slice(-3).map(([key]) => key)
    }
  }
}