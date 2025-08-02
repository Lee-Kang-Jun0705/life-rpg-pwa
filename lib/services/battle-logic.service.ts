import { BattleEngine } from './battle-engine.service'
import { BATTLE_CONFIG } from '@/lib/constants/battle.constants'
import { EnemyData } from '@/lib/types/battle.types'
import { BattleContext } from '@/lib/types/battle-context.types'
import { MonsterAI } from '@/lib/types/monster-ai'
import { StatusEffectManager } from './status-effect.service'

export class BattleLogicService {
  // 플레이어 턴 처리
  static async processPlayerTurn(context: BattleContext): Promise<{
    playerHp: number
    enemyList: EnemyData[]
    playerCursed: boolean
  }> {
    const {
      playerHp,
      playerAttack,
      enemyList,
      playerCursed,
      playerFrozen,
      addLog,
      showDamageEffect,
      animationDelay,
      updateEnemyHp,
      setPlayerHp,
      setCurrentTurn,
      setShowEffect,
      setTargetedEnemy,
      playerStatusManager,
      updatePlayerStatusEffects,
      maxPlayerHp
    } = context

    // 상태이상 처리 - 턴 시작
    const statusProcessResult = BattleEngine.processStatusEffects(
      playerStatusManager,
      { hp: playerHp, maxHp: maxPlayerHp },
      false // 플레이어 턴 시작
    )

    // 상태이상 메시지 추가
    statusProcessResult.messages.forEach(msg => {
      addLog(msg.text, msg.type)
    })

    // 행동 불가 체크 (기존 동결 체크 + 새로운 상태이상 체크)
    if (playerFrozen || !statusProcessResult.canAct) {
      if (playerFrozen) {
        addLog('❄️ 플레이어가 얼어붙어 움직일 수 없습니다!', 'status')
      }
      return { playerHp, enemyList, playerCursed }
    }

    setCurrentTurn('player')
    setShowEffect('playerAttack')

    // 살아있는 적 중 하나를 랜덤 선택
    const aliveEnemies = BattleEngine.getAliveEnemies(enemyList)
    if (aliveEnemies.length === 0) {
      return { playerHp, enemyList, playerCursed }
    }

    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    setTargetedEnemy(target.id)

    // 상태이상에 의한 스탯 수정
    const statModifiers = playerStatusManager.getStatModifiers()
    const modifiedAttack = Math.floor(playerAttack * statModifiers.attackMultiplier)
    
    // 데미지 계산 (속성 상성 포함)
    const { damage, isCritical, elementMessage } = BattleEngine.calculateDamage(
      { attack: modifiedAttack, element: context.playerElement },
      { element: target.element },
      playerCursed
    )

    await animationDelay(BATTLE_CONFIG.ANIMATION_DURATION)
    showDamageEffect(damage, target.id)
    await animationDelay(BATTLE_CONFIG.EFFECT_DELAY)

    // 적 HP 업데이트
    const currentTarget = enemyList.find(e => e.id === target.id)
    if (currentTarget && currentTarget.hp > 0) {
      const newHp = Math.max(0, currentTarget.hp - damage)
      updateEnemyHp(target.id, newHp)

      // 로그 추가
      if (isCritical) {
        addLog(`⚔️ 플레이어의 강력한 일격! ${currentTarget.name}에게 치명타 ${damage}의 피해!`, 'critical')
      } else {
        addLog(`⚔️ 플레이어가 ${currentTarget.name}을(를) 공격! ${damage}의 피해를 입혔습니다.`, 'damage')
      }
      
      // 속성 상성 메시지
      if (elementMessage) {
        addLog(elementMessage, 'status')
      }

      if (newHp <= 0) {
        addLog(`💀 ${currentTarget.name}을(를) 처치했습니다!`, 'end')
      }

      // 용암 갑옷 반사 데미지
      if (currentTarget.specialAbility === 'lavaArmor' && newHp > 0) {
        const reflectResult = BattleEngine.processSpecialAbility('lavaArmor', {
          damage,
          attacker: currentTarget
        })

        if (reflectResult.success && reflectResult.value) {
          const newPlayerHp = Math.max(0, playerHp - reflectResult.value)
          setPlayerHp(newPlayerHp)
          addLog(reflectResult.effect!, 'damage')
          return {
            playerHp: newPlayerHp,
            enemyList: enemyList.map(e => e.id === target.id ? { ...e, hp: newHp } : e),
            playerCursed
          }
        }
      }

      // 플레이어 턴 종료 처리
      const turnEndResult = BattleEngine.processStatusEffects(
        playerStatusManager,
        { hp: playerHp, maxHp: maxPlayerHp },
        true // 플레이어 턴 종료
      )

      // 턴 종료 메시지 및 데미지 처리
      let finalPlayerHp = playerHp
      if (turnEndResult.damageDealt > 0) {
        finalPlayerHp = Math.max(0, playerHp - turnEndResult.damageDealt)
        setPlayerHp(finalPlayerHp)
      } else if (turnEndResult.damageDealt < 0) { // 회복
        finalPlayerHp = Math.min(maxPlayerHp, playerHp - turnEndResult.damageDealt)
        setPlayerHp(finalPlayerHp)
      }

      turnEndResult.messages.forEach(msg => {
        addLog(msg.text, msg.type)
      })

      // 상태이상 업데이트
      updatePlayerStatusEffects(playerStatusManager.getActiveEffects())

      return {
        playerHp: finalPlayerHp,
        enemyList: enemyList.map(e => e.id === target.id ? { ...e, hp: newHp } : e),
        playerCursed
      }
    }

    // 플레이어 턴 종료 처리 (공격하지 않은 경우에도)
    const turnEndResult = BattleEngine.processStatusEffects(
      playerStatusManager,
      { hp: playerHp, maxHp: maxPlayerHp },
      true
    )

    let finalPlayerHp = playerHp
    if (turnEndResult.damageDealt > 0) {
      finalPlayerHp = Math.max(0, playerHp - turnEndResult.damageDealt)
      setPlayerHp(finalPlayerHp)
    } else if (turnEndResult.damageDealt < 0) {
      finalPlayerHp = Math.min(maxPlayerHp, playerHp - turnEndResult.damageDealt)
      setPlayerHp(finalPlayerHp)
    }

    turnEndResult.messages.forEach(msg => {
      addLog(msg.text, msg.type)
    })

    updatePlayerStatusEffects(playerStatusManager.getActiveEffects())

    return { playerHp: finalPlayerHp, enemyList, playerCursed }
  }

  // 적 턴 처리
  static async processEnemyTurn(context: BattleContext): Promise<{
    playerHp: number
    enemyList: EnemyData[]
    playerFrozen: boolean
    playerCursed: boolean
    poisonDamage: number
  }> {
    const {
      playerHp,
      enemyList,
      playerFrozen,
      playerCursed,
      poisonDamage,
      addLog,
      showDamageEffect,
      animationDelay,
      setPlayerHp,
      setCurrentTurn,
      setShowEffect
    } = context

    setCurrentTurn('enemy')
    setShowEffect('enemyAttack')

    const aliveEnemies = BattleEngine.getAliveEnemies(enemyList)
    let totalDamage = 0
    let newPlayerFrozen = playerFrozen
    let newPlayerCursed = playerCursed
    let newPoisonDamage = poisonDamage
    const updatedEnemyList = [...enemyList]

    for (const enemy of aliveEnemies) {
      // AI 상태 업데이트
      if (enemy.aiState) {
        enemy.aiState.currentMood = MonsterAI.updateMood(
          enemy.hp,
          enemy.maxHp,
          aliveEnemies.length - 1,
          enemy.aiState.pattern
        )
      }
      
      // AI 행동 결정
      const aiDecision = enemy.aiState
        ? MonsterAI.decideAction(enemy.aiState, {
            selfHp: enemy.hp,
            selfMaxHp: enemy.maxHp,
            playerHp,
            playerMaxHp: context.maxPlayerHp,
            allyCount: aliveEnemies.length - 1,
            turnCount: context.turn
          })
        : { action: 'attack', priority: 50 }
      
      // AI 행동에 따른 처리
      if (aiDecision.action === 'defend') {
        addLog(`👹 ${enemy.name}이(가) 방어 자세를 취했습니다!`, 'status')
        continue
      }
      
      if (aiDecision.action === 'heal' && enemy.hp < enemy.maxHp) {
        const healAmount = Math.floor(enemy.maxHp * 0.3)
        const enemyIndex = updatedEnemyList.findIndex(e => e.id === enemy.id)
        if (enemyIndex !== -1) {
          updatedEnemyList[enemyIndex].hp = Math.min(
            enemy.maxHp,
            updatedEnemyList[enemyIndex].hp + healAmount
          )
          addLog(`👹 ${enemy.name}이(가) ${healAmount}의 체력을 회복했습니다!`, 'heal')
        }
        continue
      }
      
      // 공격 처리 (기본 공격 또는 특수 공격)
      const isSpecialAttack = aiDecision.action === 'special'
      const { damage, isStrong } = BattleEngine.calculateEnemyDamage(enemy)
      const finalDamage = isSpecialAttack ? Math.floor(damage * 1.5) : damage
      totalDamage += finalDamage

      if (isSpecialAttack) {
        addLog(`👹 ${enemy.name}의 특수 공격! ${finalDamage}의 강력한 피해!`, 'critical')
      } else if (isStrong) {
        addLog(`👹 ${enemy.name}의 강력한 공격! ${damage}의 큰 피해!`, 'critical')
      } else {
        addLog(`👹 ${enemy.name}이(가) 플레이어를 공격! ${damage}의 피해!`, 'damage')
      }

      // 특수 능력 처리
      const abilityResult = BattleEngine.processSpecialAbility(enemy.specialAbility, {
        damage,
        attacker: enemy,
        attackerMaxHp: enemy.maxHp
      })

      if (abilityResult.success) {
        if (abilityResult.effect) {
          addLog(abilityResult.effect, 'status')
        }

        // 상태이상 부여 체크
        if (enemy.specialAbility && context.playerStatusManager) {
          const statusMessage = BattleEngine.applyMonsterStatusEffect(
            enemy.specialAbility,
            context.playerStatusManager,
            enemy.element,
            false, // 일반 몬스터
            0 // 플레이어 저항력 (추후 장비나 버프로 증가 가능)
          )
          
          if (statusMessage) {
            addLog(statusMessage.text, statusMessage.type)
            context.updatePlayerStatusEffects(context.playerStatusManager.getActiveEffects())
          }
        }

        // 특수 능력 효과 적용
        switch (enemy.specialAbility) {
          case 'doubleStrike':
            if (abilityResult.value) {
              totalDamage += abilityResult.value
            }
            break

          case 'lifeDrain':
            if (abilityResult.value) {
              const enemyIndex = updatedEnemyList.findIndex(e => e.id === enemy.id)
              if (enemyIndex !== -1) {
                updatedEnemyList[enemyIndex].hp = Math.min(
                  updatedEnemyList[enemyIndex].maxHp,
                  updatedEnemyList[enemyIndex].hp + abilityResult.value
                )
              }
            }
            break

          case 'freeze':
            newPlayerFrozen = true
            break

          case 'poison':
            if (abilityResult.value) {
              newPoisonDamage = abilityResult.value
            }
            break

          case 'curse':
            newPlayerCursed = true
            break
        }
      }
    }

    await animationDelay(BATTLE_CONFIG.ANIMATION_DURATION)
    showDamageEffect(totalDamage, undefined, true)
    await animationDelay(BATTLE_CONFIG.EFFECT_DELAY)

    const newPlayerHp = Math.max(0, playerHp - totalDamage)
    setPlayerHp(newPlayerHp)

    return {
      playerHp: newPlayerHp,
      enemyList: updatedEnemyList,
      playerFrozen: newPlayerFrozen,
      playerCursed: newPlayerCursed,
      poisonDamage: newPoisonDamage
    }
  }

  // 독 데미지 처리
  static processPoisonTurn(
    turn: number,
    playerHp: number,
    poisonDamage: number,
    setPlayerHp: (hp: number) => void,
    addLog: (message: string, type: string) => void
  ): { playerHp: number; poisonDamage: number } {
    const poisonResult = BattleEngine.processPoisonDamage(turn, poisonDamage)

    if (poisonResult) {
      const newPlayerHp = Math.max(0, playerHp - poisonResult.damage)
      setPlayerHp(newPlayerHp)
      addLog(`🟢 독 데미지로 ${poisonResult.damage}의 피해를 입었습니다!`, 'damage')

      return {
        playerHp: newPlayerHp,
        poisonDamage: poisonResult.remainingPoison
      }
    }

    return { playerHp, poisonDamage }
  }
}
