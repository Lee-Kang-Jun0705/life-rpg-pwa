/**
 * 컴패니언 스킬 관리 서비스
 * 스킬 사용, 쿨다운 관리, 효과 적용 등을 담당
 */

import type {
  CompanionInstance,
  CompanionSkill
} from '@/lib/types/companion'
import { getCompanionById } from '@/lib/data/companions'
import { companionService } from './companion.service'

interface SkillCooldownData {
  companionId: string
  skillId: string
  remainingCooldown: number
  lastUsedTurn: number
}

interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special'
  target: 'self' | 'player' | 'enemy' | 'all-enemies' | 'all-allies'
  value: number
  duration?: number
  statusType?: string
}

class CompanionSkillService {
  private static instance: CompanionSkillService
  private cooldowns: Map<string, SkillCooldownData> = new Map()

  static getInstance(): CompanionSkillService {
    if (!CompanionSkillService.instance) {
      CompanionSkillService.instance = new CompanionSkillService()
    }
    return CompanionSkillService.instance
  }

  /**
   * 컴패니언이 사용 가능한 스킬 목록 반환
   */
  getAvailableSkills(companion: CompanionInstance, currentTurn: number): CompanionSkill[] {
    const companionData = getCompanionById(companion.companionId)
    if (!companionData) return []

    return companionData.skills.filter(skill => {
      // 언락된 스킬인지 확인
      if (!companion.unlockedSkills.includes(skill.id)) return false
      
      // 패시브 스킬은 항상 활성화
      if (skill.type === 'passive') return true
      
      // 액티브 스킬의 쿨다운 확인
      const cooldownKey = `${companion.id}-${skill.id}`
      const cooldownData = this.cooldowns.get(cooldownKey)
      
      if (!cooldownData) return true
      
      const turnsPassed = currentTurn - cooldownData.lastUsedTurn
      return turnsPassed >= skill.cooldown!
    })
  }

  /**
   * 스킬 사용 처리
   */
  useSkill(
    companion: CompanionInstance,
    skillId: string,
    currentTurn: number,
    targets?: { playerHp?: number; enemyHp?: number[] }
  ): {
    success: boolean
    effects: SkillEffect[]
    message: string
  } {
    const companionData = getCompanionById(companion.companionId)
    if (!companionData) {
      return { success: false, effects: [], message: '컴패니언 데이터를 찾을 수 없습니다.' }
    }

    const skill = companionData.skills.find(s => s.id === skillId)
    if (!skill) {
      return { success: false, effects: [], message: '스킬을 찾을 수 없습니다.' }
    }

    // 스킬 사용 가능 여부 확인
    if (!companion.unlockedSkills.includes(skillId)) {
      return { success: false, effects: [], message: '아직 언락되지 않은 스킬입니다.' }
    }

    // 쿨다운 확인 (액티브 스킬만)
    if (skill.type === 'active' && skill.cooldown) {
      const cooldownKey = `${companion.id}-${skillId}`
      const cooldownData = this.cooldowns.get(cooldownKey)
      
      if (cooldownData) {
        const turnsPassed = currentTurn - cooldownData.lastUsedTurn
        if (turnsPassed < skill.cooldown) {
          const remaining = skill.cooldown - turnsPassed
          return { 
            success: false, 
            effects: [], 
            message: `쿨다운 중입니다. (${remaining}턴 남음)` 
          }
        }
      }
    }

    // 스킬 효과 계산
    const effects: SkillEffect[] = []
    let message = `${companion.nickname || companionData.name}이(가) ${skill.name}을(를) 사용했다!`

    // 데미지 효과
    if (skill.effects.damage) {
      const baseDamage = companion.currentStats.attack * (skill.effects.damage / 100)
      effects.push({
        type: 'damage',
        target: skill.targetType as any,
        value: Math.floor(baseDamage)
      })
    }

    // 힐링 효과
    if (skill.effects.healing) {
      const healAmount = skill.effects.healing
      effects.push({
        type: 'heal',
        target: skill.targetType as any,
        value: healAmount
      })
    }

    // 버프 효과
    if (skill.effects.buff) {
      effects.push({
        type: 'buff',
        target: skill.targetType as any,
        value: skill.effects.buff.value,
        duration: skill.effects.buff.duration,
        statusType: skill.effects.buff.stat
      })
    }

    // 디버프 효과
    if (skill.effects.debuff) {
      effects.push({
        type: 'debuff',
        target: skill.targetType as any,
        value: skill.effects.debuff.value,
        duration: skill.effects.debuff.duration,
        statusType: skill.effects.debuff.stat
      })
    }

    // 상태이상 효과
    if (skill.effects.statusEffect) {
      const chance = Math.random() * 100
      if (chance <= skill.effects.statusEffect.chance) {
        effects.push({
          type: 'special',
          target: skill.targetType as any,
          value: skill.effects.statusEffect.chance,
          duration: skill.effects.statusEffect.duration,
          statusType: skill.effects.statusEffect.type
        })
        message += ` 상태이상 ${skill.effects.statusEffect.type} 발동!`
      }
    }

    // 쿨다운 설정 (액티브 스킬만)
    if (skill.type === 'active' && skill.cooldown) {
      const cooldownKey = `${companion.id}-${skillId}`
      this.cooldowns.set(cooldownKey, {
        companionId: companion.id,
        skillId: skillId,
        remainingCooldown: skill.cooldown,
        lastUsedTurn: currentTurn
      })
    }

    return { success: true, effects, message }
  }

  /**
   * 패시브 스킬 효과 계산
   */
  getPassiveEffects(companion: CompanionInstance): {
    statBonuses: { [key: string]: number }
    specialEffects: { type: string; value: number }[]
  } {
    const companionData = getCompanionById(companion.companionId)
    if (!companionData) return { statBonuses: {}, specialEffects: [] }

    const statBonuses: { [key: string]: number } = {}
    const specialEffects: { type: string; value: number }[] = []

    // 패시브 스킬 효과 수집
    companionData.skills
      .filter(skill => skill.type === 'passive' && companion.unlockedSkills.includes(skill.id))
      .forEach(skill => {
        if (skill.effects.buff && skill.effects.buff.duration === -1) {
          const stat = skill.effects.buff.stat
          statBonuses[stat] = (statBonuses[stat] || 0) + skill.effects.buff.value
        }
      })

    // 특성 효과 추가
    companionData.traits.forEach(trait => {
      if (trait.effects.statBonus) {
        const stat = trait.effects.statBonus.stat
        statBonuses[stat] = (statBonuses[stat] || 0) + trait.effects.statBonus.value
      }
      
      if (trait.effects.combatEffect) {
        specialEffects.push({
          type: trait.effects.combatEffect.type,
          value: trait.effects.combatEffect.value
        })
      }
    })

    return { statBonuses, specialEffects }
  }

  /**
   * AI가 자동으로 스킬 선택
   */
  selectSkillForAI(
    companion: CompanionInstance,
    currentTurn: number,
    battleContext: {
      playerHpRatio: number
      enemyCount: number
      companionHpRatio: number
    }
  ): string | null {
    const availableSkills = this.getAvailableSkills(companion, currentTurn)
    const activeSkills = availableSkills.filter(s => s.type === 'active')
    
    if (activeSkills.length === 0) return null

    // 간단한 AI 로직
    // 1. 플레이어 HP가 낮으면 힐링 스킬 우선
    if (battleContext.playerHpRatio < 0.3) {
      const healSkill = activeSkills.find(s => s.effects.healing)
      if (healSkill) return healSkill.id
    }

    // 2. 적이 많으면 광역 스킬 우선
    if (battleContext.enemyCount > 2) {
      const aoeSkill = activeSkills.find(s => s.targetType === 'all-enemies')
      if (aoeSkill) return aoeSkill.id
    }

    // 3. 버프가 없으면 버프 스킬 사용
    const buffSkill = activeSkills.find(s => s.effects.buff && s.targetType === 'player')
    if (buffSkill && Math.random() > 0.5) return buffSkill.id

    // 4. 가장 강력한 공격 스킬 선택
    const attackSkills = activeSkills.filter(s => s.effects.damage)
    if (attackSkills.length > 0) {
      return attackSkills.sort((a, b) => 
        (b.effects.damage || 0) - (a.effects.damage || 0)
      )[0].id
    }

    // 5. 아무 스킬이나 선택
    return activeSkills[0].id
  }

  /**
   * 턴 종료 시 쿨다운 업데이트
   */
  updateCooldowns(currentTurn: number): void {
    // 쿨다운 정리 (오래된 것 제거)
    this.cooldowns.forEach((cooldown, key) => {
      const turnsPassed = currentTurn - cooldown.lastUsedTurn
      if (turnsPassed >= cooldown.remainingCooldown * 2) {
        this.cooldowns.delete(key)
      }
    })
  }

  /**
   * 전투 종료 시 쿨다운 초기화
   */
  resetCooldowns(): void {
    this.cooldowns.clear()
  }

  /**
   * 특정 컴패니언의 쿨다운 초기화
   */
  resetCompanionCooldowns(companionId: string): void {
    const keysToDelete: string[] = []
    this.cooldowns.forEach((_, key) => {
      if (key.startsWith(companionId)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cooldowns.delete(key))
  }

  /**
   * 스킬 업그레이드 가능 여부 확인
   */
  canUpgradeSkill(companion: CompanionInstance, skillId: string): boolean {
    // 추후 스킬 레벨 시스템 구현 시 사용
    return false
  }

  /**
   * 스킬 설명 텍스트 생성
   */
  getSkillDescription(skill: CompanionSkill, companion: CompanionInstance): string {
    let description = skill.description

    // 동적 값 치환
    if (skill.effects.damage) {
      const damage = Math.floor(companion.currentStats.attack * (skill.effects.damage / 100))
      description = description.replace('{damage}', damage.toString())
    }

    if (skill.effects.healing) {
      description = description.replace('{healing}', skill.effects.healing.toString())
    }

    if (skill.effects.buff) {
      description = description.replace('{buff_value}', skill.effects.buff.value.toString())
      description = description.replace('{duration}', skill.effects.buff.duration.toString())
    }

    return description
  }
}

export const companionSkillService = CompanionSkillService.getInstance()