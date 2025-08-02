/**
 * 컴패니언 전투 서비스
 * 전투 중 컴패니언의 행동과 로직을 담당
 */

import type { CompanionInstance } from '@/lib/types/companion'
import type { EnemyData, BattleMessage } from '@/lib/types/battle.types'
import { getCompanionById } from '@/lib/data/companions'
import { companionSkillService } from './companion-skill.service'
import { calculateCombatStats, getElementalDamageMultiplier } from '@/lib/helpers/companion-calculations'
import { BattleEngine } from './battle-engine.service'
import { StatusEffectManager } from './status-effect.service'

export interface CompanionBattleContext {
  companion: CompanionInstance
  companionHp: number
  maxCompanionHp: number
  playerHp: number
  maxPlayerHp: number
  enemyList: EnemyData[]
  currentTurn: number
  companionStatusManager: StatusEffectManager
  companionSkillCooldowns: Map<string, number>
}

export interface CompanionTurnResult {
  companionHp: number
  enemyList: EnemyData[]
  messages: BattleMessage[]
  animations: {
    type: 'attack' | 'skill' | 'heal' | 'buff'
    targetId?: number
    value?: number
    skillIcon?: string
  }[]
}

export class CompanionBattleService {
  /**
   * 컴패니언 턴 처리
   */
  static async processCompanionTurn(
    context: CompanionBattleContext,
    addLog: (message: string, type: BattleMessage['type']) => void,
    showDamageEffect: (damage: number, targetId?: number) => void,
    showCompanionHeal?: (heal: number) => void
  ): Promise<CompanionTurnResult> {
    const { companion, companionHp, maxCompanionHp, playerHp, maxPlayerHp, enemyList, currentTurn } = context
    const companionData = getCompanionById(companion.companionId)
    
    if (!companionData || companionHp <= 0) {
      return {
        companionHp,
        enemyList,
        messages: [],
        animations: []
      }
    }

    const messages: BattleMessage[] = []
    const animations: CompanionTurnResult['animations'] = []

    // 상태이상 체크
    const statusResult = BattleEngine.processStatusEffects(
      context.companionStatusManager,
      { hp: companionHp, maxHp: maxCompanionHp },
      false
    )

    statusResult.messages.forEach(msg => {
      addLog(`🐾 ${companion.nickname}: ${msg.text}`, msg.type)
      messages.push(BattleEngine.createBattleMessage(`🐾 ${companion.nickname}: ${msg.text}`, msg.type))
    })

    if (!statusResult.canAct) {
      return { companionHp, enemyList, messages, animations }
    }

    // AI 전투 상황 분석
    const battleContext = {
      playerHpRatio: playerHp / maxPlayerHp,
      enemyCount: enemyList.filter(e => e.hp > 0).length,
      companionHpRatio: companionHp / maxCompanionHp
    }

    // 스킬 선택
    const selectedSkillId = companionSkillService.selectSkillForAI(
      companion,
      currentTurn,
      battleContext
    )

    // 전투 스탯 계산 (기분 보정 포함)
    const combatStats = calculateCombatStats(companion)

    if (selectedSkillId) {
      // 스킬 사용
      const skillResult = companionSkillService.useSkill(
        companion,
        selectedSkillId,
        currentTurn,
        { playerHp, enemyHp: enemyList.map(e => e.hp) }
      )

      if (skillResult.success) {
        addLog(`🐾 ${skillResult.message}`, 'skill')
        messages.push(BattleEngine.createBattleMessage(skillResult.message, 'skill'))

        // 스킬 효과 적용
        for (const effect of skillResult.effects) {
          switch (effect.type) {
            case 'damage':
              // 데미지 처리
              if (effect.target === 'enemy' || effect.target === 'all-enemies') {
                const targets = effect.target === 'all-enemies' 
                  ? enemyList.filter(e => e.hp > 0)
                  : [enemyList.find(e => e.hp > 0)].filter(Boolean)

                for (const target of targets) {
                  if (!target) continue

                  // 속성 상성 계산
                  const elementalMultiplier = getElementalDamageMultiplier(
                    companionData.element,
                    target.element || 'normal'
                  )
                  const finalDamage = Math.floor(effect.value * elementalMultiplier)

                  target.hp = Math.max(0, target.hp - finalDamage)
                  showDamageEffect(finalDamage, target.id)
                  
                  animations.push({
                    type: 'skill',
                    targetId: target.id,
                    value: finalDamage
                  })

                  if (elementalMultiplier > 1) {
                    addLog(`🌟 효과적이다!`, 'status')
                  } else if (elementalMultiplier < 1) {
                    addLog(`💢 효과가 별로다...`, 'status')
                  }

                  if (target.hp <= 0) {
                    addLog(`💀 ${companion.nickname}이(가) ${target.name}을(를) 처치했습니다!`, 'end')
                  }
                }
              }
              break

            case 'heal':
              // 힐 처리
              if (effect.target === 'player' && showCompanionHeal) {
                showCompanionHeal(effect.value)
                animations.push({
                  type: 'heal',
                  value: effect.value
                })
              }
              break

            case 'buff':
              // 버프 처리
              animations.push({
                type: 'buff',
                value: effect.value
              })
              break
          }
        }
      }
    } else {
      // 기본 공격
      const aliveEnemies = enemyList.filter(e => e.hp > 0)
      if (aliveEnemies.length > 0) {
        const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
        
        // 속성 상성 계산
        const elementalMultiplier = getElementalDamageMultiplier(
          companionData.element,
          target.element || 'normal'
        )
        
        const baseDamage = combatStats.attack
        const damage = Math.floor(baseDamage * elementalMultiplier)
        
        target.hp = Math.max(0, target.hp - damage)
        showDamageEffect(damage, target.id)
        
        addLog(`🐾 ${companion.nickname}이(가) ${target.name}을(를) 공격! ${damage}의 피해!`, 'damage')
        messages.push(BattleEngine.createBattleMessage(
          `🐾 ${companion.nickname}이(가) ${target.name}을(를) 공격! ${damage}의 피해!`,
          'damage'
        ))
        
        animations.push({
          type: 'attack',
          targetId: target.id,
          value: damage
        })

        if (elementalMultiplier > 1) {
          addLog(`🌟 효과적이다!`, 'status')
        } else if (elementalMultiplier < 1) {
          addLog(`💢 효과가 별로다...`, 'status')
        }

        if (target.hp <= 0) {
          addLog(`💀 ${companion.nickname}이(가) ${target.name}을(를) 처치했습니다!`, 'end')
          
          // 컴패니언 전투 통계 업데이트
          companion.battleStats.assistKills++
        }
      }
    }

    // 턴 종료 처리
    const turnEndResult = BattleEngine.processStatusEffects(
      context.companionStatusManager,
      { hp: companionHp, maxHp: maxCompanionHp },
      true
    )

    let finalCompanionHp = companionHp
    if (turnEndResult.damageDealt > 0) {
      finalCompanionHp = Math.max(0, companionHp - turnEndResult.damageDealt)
    } else if (turnEndResult.damageDealt < 0) {
      finalCompanionHp = Math.min(maxCompanionHp, companionHp - turnEndResult.damageDealt)
    }

    turnEndResult.messages.forEach(msg => {
      addLog(`🐾 ${companion.nickname}: ${msg.text}`, msg.type)
      messages.push(BattleEngine.createBattleMessage(`🐾 ${companion.nickname}: ${msg.text}`, msg.type))
    })

    // 쿨다운 업데이트
    companionSkillService.updateCooldowns(currentTurn)

    return {
      companionHp: finalCompanionHp,
      enemyList,
      messages,
      animations
    }
  }

  /**
   * 컴패니언이 적의 공격을 받을 때 처리
   */
  static processCompanionDamage(
    companion: CompanionInstance,
    damage: number,
    companionHp: number,
    maxCompanionHp: number
  ): { 
    finalDamage: number
    newHp: number 
  } {
    const companionData = getCompanionById(companion.companionId)
    if (!companionData) {
      return { finalDamage: damage, newHp: Math.max(0, companionHp - damage) }
    }

    // 방어력 계산
    const combatStats = calculateCombatStats(companion)
    const defenseReduction = Math.floor(damage * (combatStats.defense / (combatStats.defense + 100)))
    const finalDamage = Math.max(1, damage - defenseReduction)

    const newHp = Math.max(0, companionHp - finalDamage)

    return { finalDamage, newHp }
  }

  /**
   * 전투 종료 시 컴패니언 보상 처리
   */
  static processCompanionRewards(
    companion: CompanionInstance,
    victory: boolean,
    enemiesDefeated: number,
    userId: string
  ): {
    expGained: number
    loyaltyChange: number
  } {
    if (!victory) {
      // 패배 시 충성도 감소
      return {
        expGained: 0,
        loyaltyChange: -5
      }
    }

    // 기본 경험치 계산
    const baseExp = enemiesDefeated * 20
    
    // 기분에 따른 경험치 보너스
    const moodBonus = {
      happy: 1.3,
      normal: 1.0,
      sad: 0.7,
      tired: 0.5,
      hungry: 0.6
    }[companion.mood]

    const finalExp = Math.floor(baseExp * moodBonus)

    // 충성도 증가
    const loyaltyGain = Math.min(10, enemiesDefeated * 2)

    return {
      expGained: finalExp,
      loyaltyChange: loyaltyGain
    }
  }
}