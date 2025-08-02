import { MonsterAbility, AbilityEffect, MONSTER_ABILITIES } from '@/lib/types/monster-abilities'
import { Monster } from '@/lib/types/dungeon'
import { BattleState } from '@/lib/types/battle-types'

export interface AbilityResult {
  success: boolean
  ability?: MonsterAbility
  effects: EffectResult[]
  message?: string
}

export interface EffectResult {
  type: AbilityEffect['type']
  target: string
  value?: number
  duration?: number
  actualDamage?: number
}

interface MonsterCooldowns {
  [monsterId: string]: {
    [abilityId: string]: number // 남은 쿨다운 턴
  }
}

interface ActiveStatusEffects {
  player: StatusEffect[]
  monsters: {
    [monsterId: string]: StatusEffect[]
  }
}

export interface StatusEffect {
  type: 'poison' | 'burn' | 'freeze' | 'stun' | 'buff' | 'debuff'
  value?: number
  duration: number
  stat?: 'attack' | 'defense' | 'speed' | 'critRate' | 'critDamage'
  multiplier?: number
  source: string // 능력 ID
}

export class MonsterAbilityService {
  private cooldowns: MonsterCooldowns = {}
  private statusEffects: ActiveStatusEffects = {
    player: [],
    monsters: {}
  }

  // 몬스터 능력 실행
  executeAbility(
    monster: Monster,
    abilityId: string,
    trigger: MonsterAbility['trigger'],
    battleState: BattleState
  ): AbilityResult {
    const ability = MONSTER_ABILITIES[abilityId]
    if (!ability) {
      return { success: false, effects: [], message: '존재하지 않는 능력입니다' }
    }

    // 트리거 확인
    if (ability.trigger !== trigger) {
      return { success: false, effects: [] }
    }

    // 쿨다운 확인
    if (this.isOnCooldown(monster.id, abilityId)) {
      return { success: false, effects: [] }
    }

    // 확률 체크
    if (Math.random() > ability.chance) {
      return { success: false, effects: [] }
    }

    // 특정 트리거 조건 확인
    if (trigger === 'onBelowHalfHp' && monster.hp > monster.maxHp / 2) {
      return { success: false, effects: [] }
    }

    // 능력 효과 적용
    const effects: EffectResult[] = []
    for (const effect of ability.effects) {
      const result = this.applyEffect(effect, monster, battleState)
      if (result) {
        effects.push(result)
      }
    }

    // 쿨다운 설정
    if (ability.cooldown) {
      this.setCooldown(monster.id, abilityId, ability.cooldown)
    }

    return {
      success: true,
      ability,
      effects,
      message: `${monster.name}의 ${ability.name}!`
    }
  }

  // 효과 적용
  private applyEffect(
    effect: AbilityEffect,
    monster: Monster,
    battleState: BattleState
  ): EffectResult | null {
    const result: EffectResult = {
      type: effect.type,
      target: effect.target,
      value: effect.value,
      duration: effect.duration
    }

    switch (effect.type) {
      case 'damage':
        if (effect.target === 'player') {
          const baseDamage = effect.value || monster.stats.attack
          const multiplier = effect.multiplier || 1
          result.actualDamage = Math.floor(baseDamage * multiplier)
        }
        break

      case 'heal':
        if (effect.target === 'self') {
          const healAmount = effect.value || Math.floor(monster.maxHp * (effect.multiplier || 0.3))
          result.actualDamage = -healAmount // 음수로 표시
        }
        break

      case 'poison':
      case 'burn':
      case 'freeze':
      case 'stun':
        this.applyStatusEffect(effect.target, {
          type: effect.type,
          value: effect.value,
          duration: effect.duration || 1,
          source: monster.id
        })
        break

      case 'buff':
      case 'debuff':
        this.applyStatusEffect(effect.target, {
          type: effect.type,
          stat: effect.stat,
          multiplier: effect.multiplier,
          duration: effect.duration || 1,
          source: monster.id
        })
        break

      case 'lifeDrain':
        if (effect.target === 'player') {
          const drainDamage = Math.floor(monster.stats.attack * (effect.multiplier || 0.5))
          result.actualDamage = drainDamage
          // 몬스터 회복은 별도로 처리
          this.applyEffect({
            type: 'heal',
            target: 'self',
            value: drainDamage
          }, monster, battleState)
        }
        break

      case 'multiHit':
        // 다단 공격은 별도 처리 필요
        result.value = effect.value || 2
        break
    }

    return result
  }

  // 상태이상 적용
  private applyStatusEffect(target: string, effect: StatusEffect) {
    if (target === 'player') {
      this.statusEffects.player.push(effect)
    } else if (target === 'self') {
      // 몬스터 자신에게 적용
      const monsterId = effect.source
      if (!this.statusEffects.monsters[monsterId]) {
        this.statusEffects.monsters[monsterId] = []
      }
      this.statusEffects.monsters[monsterId].push(effect)
    }
  }

  // 턴 시작 시 처리
  onTurnStart(isPlayerTurn: boolean): StatusEffect[] {
    const activeEffects: StatusEffect[] = []

    if (isPlayerTurn) {
      // 플레이어 상태이상 처리
      this.statusEffects.player = this.statusEffects.player.filter(effect => {
        if (effect.duration > 0) {
          effect.duration--
          if (effect.type === 'poison' || effect.type === 'burn') {
            activeEffects.push(effect)
          }
          return effect.duration > 0
        }
        return false
      })
    } else {
      // 몬스터 상태이상 처리
      for (const monsterId in this.statusEffects.monsters) {
        this.statusEffects.monsters[monsterId] = this.statusEffects.monsters[monsterId].filter(effect => {
          if (effect.duration > 0) {
            effect.duration--
            return effect.duration > 0
          }
          return false
        })
      }
    }

    // 쿨다운 감소
    this.reduceCooldowns()

    return activeEffects
  }

  // 플레이어 상태이상 효과 가져오기
  getPlayerStatusEffects(): StatusEffect[] {
    return this.statusEffects.player
  }

  // 몬스터 상태이상 효과 가져오기
  getMonsterStatusEffects(monsterId: string): StatusEffect[] {
    return this.statusEffects.monsters[monsterId] || []
  }

  // 스탯 수정치 계산
  calculateStatModifier(
    baseValue: number,
    stat: StatusEffect['stat'],
    effects: StatusEffect[]
  ): number {
    let modifier = 1
    
    for (const effect of effects) {
      if (effect.stat === stat && effect.multiplier) {
        if (effect.type === 'buff') {
          modifier *= effect.multiplier
        } else if (effect.type === 'debuff') {
          modifier *= effect.multiplier
        }
      }
    }

    return Math.floor(baseValue * modifier)
  }

  // 플레이어가 동결 상태인지 확인
  isPlayerFrozen(): boolean {
    return this.statusEffects.player.some(effect => effect.type === 'freeze')
  }

  // 플레이어가 기절 상태인지 확인
  isPlayerStunned(): boolean {
    return this.statusEffects.player.some(effect => effect.type === 'stun')
  }

  // 쿨다운 관리
  private isOnCooldown(monsterId: string, abilityId: string): boolean {
    return this.cooldowns[monsterId]?.[abilityId] > 0
  }

  private setCooldown(monsterId: string, abilityId: string, turns: number) {
    if (!this.cooldowns[monsterId]) {
      this.cooldowns[monsterId] = {}
    }
    this.cooldowns[monsterId][abilityId] = turns
  }

  private reduceCooldowns() {
    for (const monsterId in this.cooldowns) {
      for (const abilityId in this.cooldowns[monsterId]) {
        if (this.cooldowns[monsterId][abilityId] > 0) {
          this.cooldowns[monsterId][abilityId]--
        }
      }
    }
  }

  // 전투 종료 시 초기화
  reset() {
    this.cooldowns = {}
    this.statusEffects = {
      player: [],
      monsters: {}
    }
  }
}

// 싱글톤 인스턴스
export const monsterAbilityService = new MonsterAbilityService()