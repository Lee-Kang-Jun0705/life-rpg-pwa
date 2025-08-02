import { BATTLE_CONFIG, SpecialAbility } from '@/lib/constants/battle.constants'
import {
  CombatStats,
  DamageResult,
  AbilityResult,
  BattleState,
  EnemyData,
  BattleMessage
} from '@/lib/types/battle.types'
import { ElementType, calculateElementalDamage } from '@/lib/types/element-system'
import { AIPattern, MonsterAI, MonsterAIState, AI_PATTERN_TRAITS } from '@/lib/types/monster-ai'
import { StatusEffectManager, STATUS_CHANCE_TABLE } from './status-effect.service'
import { StatusEffectType, createStatusEffect } from '@/lib/types/status-effects'
import { MONSTER_STATUS_SKILLS, ELEMENT_STATUS_BONUS } from '@/lib/data/monster-status-skills'
import { DifficultyService } from './difficulty.service'

export class BattleEngine {
  // 데미지 계산 (속성 상성 포함)
  static calculateDamage(
    attacker: { attack: number; element?: ElementType },
    defender: { element?: ElementType },
    isCursed = false,
    isPlayerAttacking = true
  ): DamageResult & { elementMessage?: string } {
    const baseDamage = Math.floor(Math.random() * BATTLE_CONFIG.DAMAGE_VARIATION) + attacker.attack
    const finalBaseDamage = isCursed ? Math.floor(baseDamage * BATTLE_CONFIG.CURSE_DAMAGE_REDUCTION) : baseDamage
    
    // 난이도에 따른 치명타 확률 조정
    const modifiers = DifficultyService.getDifficultyModifiers()
    const critChance = isPlayerAttacking 
      ? BATTLE_CONFIG.CRITICAL_CHANCE
      : BATTLE_CONFIG.CRITICAL_CHANCE * modifiers.enemyCriticalChanceMultiplier
    
    const isCritical = Math.random() < critChance
    let damage = isCritical ? Math.floor(finalBaseDamage * BATTLE_CONFIG.CRITICAL_MULTIPLIER) : finalBaseDamage

    // 속성 상성 계산
    let elementMessage: string | undefined
    if (attacker.element && defender.element) {
      const elementalResult = calculateElementalDamage(attacker.element, defender.element, damage)
      damage = elementalResult.damage
      elementMessage = elementalResult.message
    }
    
    // 난이도에 따른 최종 데미지 조정
    if (!isPlayerAttacking) {
      damage = DifficultyService.applyDifficultyToDamage(damage, true)
    }

    return { damage, isCritical, elementMessage }
  }

  // 적 공격 데미지 계산
  static calculateEnemyDamage(enemy: { attack: number }): DamageResult {
    const damageVariation = Math.floor(Math.random() * BATTLE_CONFIG.DAMAGE_VARIATION) - 5
    const baseDamage = Math.max(1, enemy.attack + damageVariation)
    const isStrong = Math.random() < BATTLE_CONFIG.STRONG_ATTACK_CHANCE
    const damage = isStrong ? Math.floor(baseDamage * BATTLE_CONFIG.STRONG_ATTACK_MULTIPLIER) : baseDamage

    return { damage, isCritical: false, isStrong }
  }

  // 특수 능력 처리
  static processSpecialAbility(
    ability: SpecialAbility | undefined | null,
    context: {
      damage: number
      attacker: EnemyData
      attackerMaxHp?: number
    }
  ): AbilityResult {
    // 난이도에 따른 스킬 발동 확률 조정
    const modifiers = DifficultyService.getDifficultyModifiers()
    const skillChance = BATTLE_CONFIG.SPECIAL_ABILITY_CHANCE * modifiers.enemySkillChanceMultiplier
    
    if (!ability || Math.random() >= skillChance) {
      return { success: false }
    }

    switch (ability) {
      case 'doubleStrike':
        const secondDamage = Math.floor(context.damage * BATTLE_CONFIG.DOUBLE_STRIKE_RATIO)
        return {
          success: true,
          effect: `${context.attacker.name}의 연속 공격! 추가로 ${secondDamage}의 피해!`,
          value: secondDamage
        }

      case 'lifeDrain':
        const drainAmount = Math.floor(context.damage * BATTLE_CONFIG.LIFE_DRAIN_RATIO)
        return {
          success: true,
          effect: `${context.attacker.name}가 생명력을 흡수! ${drainAmount}의 체력을 회복!`,
          value: drainAmount
        }

      case 'freeze':
        return {
          success: true,
          effect: `${context.attacker.name}의 빙결 공격! 다음 턴을 쉬게 됩니다!`
        }

      case 'poison':
        const poisonDamage = Math.floor(context.attacker.attack * BATTLE_CONFIG.LIFE_DRAIN_RATIO)
        return {
          success: true,
          effect: `${context.attacker.name}의 독 공격! 지속적인 피해를 입습니다!`,
          value: poisonDamage
        }

      case 'curse':
        return {
          success: true,
          effect: `${context.attacker.name}의 저주! 공격력이 감소합니다!`
        }

      case 'lavaArmor':
        const reflectDamage = Math.floor(context.damage * BATTLE_CONFIG.REFLECT_DAMAGE_RATIO)
        return {
          success: true,
          effect: `용암 갑옷이 ${reflectDamage}의 반사 피해를 입혔습니다!`,
          value: reflectDamage
        }

      default:
        return { success: false }
    }
  }

  // 적 데이터를 EnemyData 형식으로 변환
  static convertToEnemyData(
    enemies: Array<{
      name: string
      emoji: string
      stats: {
        hp: number
        attack: number
        defense: number
        speed?: number
        specialAbility?: string | null
        element?: ElementType
      }
      aiPattern?: AIPattern
    }>
  ): EnemyData[] {
    return enemies.map((enemy, index) => {
      const aiPattern = enemy.aiPattern || 'balanced'
      const traits = AI_PATTERN_TRAITS[aiPattern]
      
      return {
        id: index,
        name: enemy.name,
        emoji: enemy.emoji,
        hp: enemy.stats.hp,
        maxHp: enemy.stats.hp,
        attack: enemy.stats.attack,
        defense: enemy.stats.defense,
        speed: enemy.stats.speed || 1.0,
        specialAbility: enemy.stats.specialAbility as SpecialAbility | null,
        element: enemy.stats.element,
        aiPattern,
        aiState: {
          pattern: aiPattern,
          aggression: traits.baseTraits.aggression,
          intelligence: traits.baseTraits.intelligence,
          teamwork: traits.baseTraits.teamwork,
          currentMood: 'calm'
        },
        statusEffects: [],
        statusResistance: 0
      }
    })
  }

  // 살아있는 적 필터링
  static getAliveEnemies(enemies: EnemyData[]): EnemyData[] {
    return enemies.filter(e => e.hp > 0)
  }

  // 평균 속도 계산
  static calculateAverageSpeed(enemies: EnemyData[]): number {
    const aliveEnemies = this.getAliveEnemies(enemies)
    if (aliveEnemies.length === 0) {
      return 1.0
    }

    return aliveEnemies.reduce((sum, e) => sum + (e.speed || 1.0), 0) / aliveEnemies.length
  }

  // 대기 시간 계산
  static calculateWaitTime(avgSpeed: number, battleSpeed: number): number {
    const baseWaitTime = BATTLE_CONFIG.BASE_WAIT_TIME / avgSpeed
    return Math.floor(baseWaitTime / battleSpeed)
  }

  // 독 데미지 처리
  static processPoisonDamage(turn: number, poisonDamage: number): {
    damage: number
    remainingPoison: number
  } | null {
    if (poisonDamage > 0 && turn % BATTLE_CONFIG.POISON_TURN_INTERVAL === 1) {
      return {
        damage: poisonDamage,
        remainingPoison: Math.max(0, poisonDamage - BATTLE_CONFIG.POISON_DAMAGE_DECAY)
      }
    }
    return null
  }

  // 전투 메시지 생성
  static createBattleMessage(text: string, type: BattleMessage['type']): BattleMessage {
    return {
      text,
      timestamp: new Date(),
      type
    }
  }
  
  // 상태이상 처리
  static processStatusEffects(
    statusManager: StatusEffectManager,
    target: { hp: number; maxHp: number },
    isPlayerTurn: boolean
  ): {
    canAct: boolean
    messages: BattleMessage[]
    damageDealt: number
  } {
    const messages: BattleMessage[] = []
    let damageDealt = 0
    let canAct = true
    
    // 턴 시작 처리
    const turnStartEffects = statusManager.processTurnStart(target)
    turnStartEffects.forEach(effect => {
      if (effect.type === 'skip' || effect.type === 'confusion') {
        canAct = false
        messages.push(this.createBattleMessage(effect.message, 'status'))
      }
    })
    
    // 턴 종료 처리 (플레이어 턴 종료 시말)
    if (isPlayerTurn) {
      const turnEndEffects = statusManager.processTurnEnd(target)
      turnEndEffects.forEach(effect => {
        if (effect.type === 'damage' && effect.value) {
          damageDealt += effect.value
          messages.push(this.createBattleMessage(effect.message, 'damage'))
        } else if (effect.type === 'heal' && effect.value) {
          damageDealt -= effect.value // 음수로 회복 표현
          messages.push(this.createBattleMessage(effect.message, 'system'))
        } else if (effect.type === 'expired') {
          messages.push(this.createBattleMessage(effect.message, 'info'))
        }
      })
    }
    
    return { canAct, messages, damageDealt }
  }
  
  // 몬스터 스킬로 상태이상 부여
  static applyMonsterStatusEffect(
    ability: string,
    targetStatusManager: StatusEffectManager,
    monsterElement?: ElementType,
    isBoss: boolean = false,
    targetResistance: number = 0
  ): BattleMessage | null {
    // 난이도에 따른 상태이상 확률 조정
    const difficultyModifiers = DifficultyService.getDifficultyModifiers()
    const adjustedResistance = targetResistance + difficultyModifiers.playerStatusResistanceBonus
    // 스킬별 상태이상 확인
    const statusSkill = MONSTER_STATUS_SKILLS[ability]
    if (!statusSkill) {
      // 속성별 추가 상태이상 확인
      if (monsterElement && ELEMENT_STATUS_BONUS[monsterElement]) {
        const elementBonus = ELEMENT_STATUS_BONUS[monsterElement]
        const baseChance = elementBonus.chance + (isBoss ? 20 : 0)
        
        const applied = targetStatusManager.addStatusEffect(
          elementBonus.effect,
          undefined,
          1,
          adjustedResistance,
          baseChance
        )
        
        if (applied) {
          return this.createBattleMessage(
            `속성 효과로 ${elementBonus.effect} 상태가 되었습니다!`,
            'status'
          )
        }
      }
      return null
    }
    
    // 보스 보너스 및 난이도 적용
    const baseChance = (statusSkill.applyChance + (isBoss ? 20 : 0)) * difficultyModifiers.enemySkillChanceMultiplier
    const duration = (statusSkill.duration || undefined) ? 
      Math.floor((statusSkill.duration + (isBoss ? 1 : 0)) * difficultyModifiers.statusEffectDurationModifier) : undefined
    
    const applied = targetStatusManager.addStatusEffect(
      statusSkill.statusEffect,
      duration,
      statusSkill.stacks,
      adjustedResistance,
      baseChance
    )
    
    if (applied) {
      return this.createBattleMessage(
        `${statusSkill.skillName}으로 ${statusSkill.statusEffect} 상태가 되었습니다!`,
        'status'
      )
    } else {
      return this.createBattleMessage(
        `상태이상을 저항했습니다!`,
        'info'
      )
    }
  }
}
