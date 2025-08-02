import { 
  StatusEffect, 
  StatusEffectType, 
  createStatusEffect,
  shouldApplyStatus,
  calculateStatusResistance 
} from '../types/status-effects'

// 상태이상 관리자 클래스
export class StatusEffectManager {
  private statusEffects: StatusEffect[] = []
  
  constructor() {
    this.statusEffects = []
  }
  
  // 상태이상 추가
  addStatusEffect(
    type: StatusEffectType, 
    duration?: number, 
    stacks?: number,
    resistance: number = 0,
    baseChance: number = 100
  ): boolean {
    // 저항 확률 체크
    if (!shouldApplyStatus(baseChance, resistance)) {
      return false // 저항 성공
    }
    
    const existingEffect = this.statusEffects.find(effect => effect.type === type)
    
    if (existingEffect) {
      if (existingEffect.stackable) {
        // 중첩 가능한 경우 스택 증가
        existingEffect.currentStacks = Math.min(
          existingEffect.currentStacks + (stacks || 1),
          existingEffect.maxStacks
        )
        // 지속 시간 갱신
        existingEffect.duration = Math.max(
          existingEffect.duration,
          duration || existingEffect.maxDuration
        )
      } else {
        // 중첩 불가능한 경우 지속 시간만 갱신
        existingEffect.duration = Math.max(
          existingEffect.duration,
          duration || existingEffect.maxDuration
        )
      }
    } else {
      // 새로운 상태이상 추가
      const newEffect = createStatusEffect(type, duration, stacks)
      this.statusEffects.push(newEffect)
      
      // onApply 콜백 실행
      if (newEffect.onApply) {
        newEffect.onApply(this)
      }
    }
    
    return true // 적용 성공
  }
  
  // 상태이상 제거
  removeStatusEffect(type: StatusEffectType): void {
    const index = this.statusEffects.findIndex(effect => effect.type === type)
    if (index !== -1) {
      const effect = this.statusEffects[index]
      
      // onRemove 콜백 실행
      if (effect.onRemove) {
        effect.onRemove(this)
      }
      
      this.statusEffects.splice(index, 1)
    }
  }
  
  // 특정 ID로 상태이상 제거
  removeStatusEffectById(id: string): void {
    const index = this.statusEffects.findIndex(effect => effect.id === id)
    if (index !== -1) {
      const effect = this.statusEffects[index]
      
      // onRemove 콜백 실행
      if (effect.onRemove) {
        effect.onRemove(this)
      }
      
      this.statusEffects.splice(index, 1)
    }
  }
  
  // 모든 디버프 제거
  removeAllDebuffs(): void {
    this.statusEffects = this.statusEffects.filter(effect => {
      if (effect.category === 'debuff') {
        if (effect.onRemove) {
          effect.onRemove(this)
        }
        return false
      }
      return true
    })
  }
  
  // 모든 버프 제거
  removeAllBuffs(): void {
    this.statusEffects = this.statusEffects.filter(effect => {
      if (effect.category === 'buff') {
        if (effect.onRemove) {
          effect.onRemove(this)
        }
        return false
      }
      return true
    })
  }
  
  // 턴 시작 시 처리
  processTurnStart(target: any): Array<{ type: string; message: string; value?: number }> {
    const effects: Array<{ type: string; message: string; value?: number }> = []
    
    this.statusEffects.forEach(effect => {
      // 턴 시작 효과 처리
      if (effect.onTurnStart) {
        effect.onTurnStart(target)
      }
      
      // 행동 불가 체크
      if (effect.skipTurnChance && Math.random() * 100 < effect.skipTurnChance) {
        switch (effect.type) {
          case 'freeze':
            effects.push({ type: 'skip', message: '빙결 상태로 행동할 수 없습니다!' })
            break
          case 'sleep':
            effects.push({ type: 'skip', message: '수면 상태로 행동할 수 없습니다!' })
            break
          case 'paralysis':
            effects.push({ type: 'skip', message: '마비로 인해 행동에 실패했습니다!' })
            break
          case 'confusion':
            effects.push({ type: 'confusion', message: '혼란 상태로 자신을 공격합니다!' })
            break
        }
      }
    })
    
    return effects
  }
  
  // 턴 종료 시 처리
  processTurnEnd(target: any): Array<{ type: string; message: string; value?: number }> {
    const effects: Array<{ type: string; message: string; value?: number }> = []
    const expiredEffects: string[] = []
    
    this.statusEffects.forEach(effect => {
      // 턴 종료 효과 처리
      if (effect.onTurnEnd) {
        effect.onTurnEnd(target)
      }
      
      // 지속 데미지/회복 처리
      if (effect.effectValue || effect.effectPercentage) {
        switch (effect.type) {
          case 'poison':
            const poisonDamage = Math.floor(target.maxHp * (effect.effectPercentage! / 100) * effect.currentStacks)
            effects.push({ 
              type: 'damage', 
              message: `중독으로 ${poisonDamage}의 피해를 입었습니다!`,
              value: poisonDamage
            })
            break
            
          case 'burn':
            const burnDamage = effect.effectValue! * effect.currentStacks
            effects.push({ 
              type: 'damage', 
              message: `화상으로 ${burnDamage}의 피해를 입었습니다!`,
              value: burnDamage
            })
            break
            
          case 'regeneration':
            const healAmount = Math.floor(target.maxHp * (effect.effectPercentage! / 100))
            effects.push({ 
              type: 'heal', 
              message: `재생으로 ${healAmount}의 HP를 회복했습니다!`,
              value: healAmount
            })
            break
        }
      }
      
      // 지속 시간 감소
      effect.duration--
      
      // 만료된 효과 체크
      if (effect.duration <= 0) {
        expiredEffects.push(effect.id)
        effects.push({ 
          type: 'expired', 
          message: `${effect.name} 효과가 사라졌습니다.`
        })
      }
    })
    
    // 만료된 효과 제거
    expiredEffects.forEach(id => this.removeStatusEffectById(id))
    
    return effects
  }
  
  // 스탯 수정자 계산
  getStatModifiers(): {
    attackMultiplier: number
    defenseMultiplier: number
    speedMultiplier: number
    accuracyMultiplier: number
    criticalMultiplier: number
  } {
    let attackMultiplier = 1
    let defenseMultiplier = 1
    let speedMultiplier = 1
    let accuracyMultiplier = 1
    let criticalMultiplier = 1
    
    this.statusEffects.forEach(effect => {
      switch (effect.type) {
        case 'attack_up':
          attackMultiplier += (effect.effectPercentage! / 100) * effect.currentStacks
          break
        case 'defense_up':
          defenseMultiplier += (effect.effectPercentage! / 100) * effect.currentStacks
          break
        case 'speed_up':
          speedMultiplier += (effect.effectPercentage! / 100)
          break
        case 'burn':
          attackMultiplier += (effect.effectPercentage! / 100) // 음수값
          break
        case 'curse':
          const curseReduction = (effect.effectPercentage! / 100) * effect.currentStacks
          attackMultiplier += curseReduction
          defenseMultiplier += curseReduction
          speedMultiplier += curseReduction
          break
        case 'fear':
          defenseMultiplier += (effect.effectPercentage! / 100)
          break
        case 'blind':
          accuracyMultiplier += (effect.effectPercentage! / 100)
          break
        case 'focus':
          criticalMultiplier += (effect.effectPercentage! / 100)
          break
        case 'berserk':
          attackMultiplier += (effect.effectPercentage! / 100)
          defenseMultiplier -= 0.25 // 방어력 25% 감소
          break
      }
    })
    
    // 최소값 보장
    return {
      attackMultiplier: Math.max(0.1, attackMultiplier),
      defenseMultiplier: Math.max(0.1, defenseMultiplier),
      speedMultiplier: Math.max(0.1, speedMultiplier),
      accuracyMultiplier: Math.max(0.1, accuracyMultiplier),
      criticalMultiplier: Math.max(0, criticalMultiplier)
    }
  }
  
  // 특정 상태이상 보유 여부
  hasStatusEffect(type: StatusEffectType): boolean {
    return this.statusEffects.some(effect => effect.type === type)
  }
  
  // 스킬 사용 가능 여부
  canUseSkills(): boolean {
    return !this.hasStatusEffect('silence')
  }
  
  // 행동 가능 여부
  canAct(): boolean {
    const skipEffects = this.statusEffects.filter(effect => 
      effect.skipTurnChance === 100 && ['freeze', 'sleep'].includes(effect.type)
    )
    return skipEffects.length === 0
  }
  
  // 수면 상태 해제
  wakeUp(): void {
    this.removeStatusEffect('sleep')
  }
  
  // 보호막 데미지 처리
  processShieldDamage(): boolean {
    const shield = this.statusEffects.find(effect => effect.type === 'shield')
    if (shield && shield.currentStacks > 0) {
      shield.currentStacks--
      if (shield.currentStacks === 0) {
        this.removeStatusEffectById(shield.id)
      }
      return true // 데미지 차단됨
    }
    return false // 데미지 통과
  }
  
  // 현재 상태이상 목록 가져오기
  getActiveEffects(): StatusEffect[] {
    return [...this.statusEffects]
  }
  
  // 상태이상 아이콘 문자열 생성
  getStatusIcons(): string {
    return this.statusEffects
      .map(effect => effect.icon)
      .join(' ')
  }
  
  // 상태이상 정보 요약
  getStatusSummary(): Array<{ name: string; duration: number; stacks?: number }> {
    return this.statusEffects.map(effect => ({
      name: effect.name,
      duration: effect.duration,
      stacks: effect.stackable ? effect.currentStacks : undefined
    }))
  }
}

// 상태이상 부여 확률 테이블
export const STATUS_CHANCE_TABLE: Record<string, number> = {
  // 몬스터 스킬별 기본 확률
  poison: 30,
  burn: 25,
  freeze: 20,
  paralysis: 25,
  silence: 20,
  blind: 30,
  confusion: 20,
  sleep: 15,
  curse: 15,
  fear: 25,
  
  // 보스 스킬은 더 높은 확률
  boss_poison: 50,
  boss_burn: 40,
  boss_freeze: 35,
  boss_paralysis: 40,
  boss_curse: 30
}