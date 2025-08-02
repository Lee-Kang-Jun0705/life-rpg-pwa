import { EnemyData, TurnResult, BattleMessage } from '@/lib/types/battle.types'
import { BattleEngine } from './battle-engine.service'
import { BattleLogicService } from './battle-logic.service'
import { StatusEffectManager } from './status-effect.service'
import { CompanionInstance } from '@/lib/types/companion'
import { CompanionBattleService } from './companion-battle.service'

export interface BattleGeneratorContext {
  playerHp: number
  maxPlayerHp: number
  playerAttack: number
  enemyList: EnemyData[]
  playerLevel: number
  battleSpeed: number
  addLog: (message: string, type: BattleMessage['type']) => void
  showDamageEffect: (damage: number, targetId?: number, isPlayer?: boolean) => void
  animationDelay: (duration: number) => Promise<void>
  updateEnemyHp: (enemyId: number, newHp: number) => void
  setPlayerHp: (hp: number) => void
  setCurrentTurn: (turn: 'player' | 'enemy' | null) => void
  setShowEffect: (effect: 'playerAttack' | 'enemyAttack' | null) => void
  setTargetedEnemy: (id: number | null) => void
  playerStatusManager: StatusEffectManager
  enemyStatusManagers: Map<number, StatusEffectManager>
  updatePlayerStatusEffects: (effects: import('@/lib/types/status-effects').StatusEffect[]) => void
  // 컴패니언 관련
  companion?: CompanionInstance | null
  companionHp?: number
  setCompanionHp?: (hp: number) => void
  companionStatusManager?: StatusEffectManager
  showCompanionDamage?: (damage: number) => void
  showCompanionHeal?: (heal: number) => void
  companionSkillCooldowns?: Map<string, number>
}

export interface BattleGeneratorState {
  playerHp: number
  enemyList: EnemyData[]
  turn: number
  playerFrozen: boolean
  playerCursed: boolean
  poisonDamage: number
  isComplete: boolean
  victory: boolean
  companionHp?: number
}

export class BattleGeneratorService {
  private static async* battleGenerator(
    context: BattleGeneratorContext
  ): AsyncGenerator<BattleGeneratorState, void, void> {
    let { playerHp } = context
    let enemyList = [...context.enemyList]
    let turn = 0
    let playerFrozen = false
    let playerCursed = false
    let poisonDamage = 0
    let companionHp = context.companionHp || 0

    // 적 상태이상 매니저 초기화
    enemyList.forEach(enemy => {
      if (!context.enemyStatusManagers.has(enemy.id)) {
        context.enemyStatusManagers.set(enemy.id, new StatusEffectManager())
      }
    })

    // 전투 시작 로그
    context.addLog(`⚔️ ${context.enemyList.length}마리의 몬스터와 전투 시작!`, 'start')
    context.addLog(`⚔️ 플레이어 Lv.${context.playerLevel} - HP: ${playerHp}, 공격력: ${context.playerAttack}`, 'status')
    
    // 컴패니언 로그
    if (context.companion && companionHp > 0) {
      context.addLog(`🐾 ${context.companion.nickname} 참전! - HP: ${companionHp}, 공격력: ${context.companion.currentStats.attack}`, 'status')
    }

    context.enemyList.forEach((enemy) => {
      context.addLog(`👹 ${enemy.name} - HP: ${enemy.hp}, 공격력: ${enemy.attack}`, 'status')
      if (enemy.specialAbility) {
        context.addLog(`⚡ ${enemy.name}의 특수 능력 주의!`, 'status')
      }
      if (enemy.element) {
        context.addLog(`🌟 ${enemy.name}의 속성: ${enemy.element}`, 'status')
      }
    })

    // 전투 루프
    while (playerHp > 0 && enemyList.some(e => e.hp > 0)) {
      turn++

      // 독 데미지 처리
      if (turn % 2 === 1) {
        const poisonResult = BattleLogicService.processPoisonTurn(
          turn,
          playerHp,
          poisonDamage,
          context.setPlayerHp,
          context.addLog
        )
        playerHp = poisonResult.playerHp
        poisonDamage = poisonResult.poisonDamage
      }

      // 전투 컨텍스트 생성
      const battleContext = {
        playerHp,
        playerAttack: context.playerAttack,
        enemyList,
        turn,
        playerFrozen,
        playerCursed,
        poisonDamage,
        battleSpeed: context.battleSpeed,
        abortSignal: new AbortController().signal,
        addLog: context.addLog,
        showDamageEffect: context.showDamageEffect,
        animationDelay: context.animationDelay,
        updateEnemyHp: context.updateEnemyHp,
        setPlayerHp: context.setPlayerHp,
        setCurrentTurn: context.setCurrentTurn,
        setShowEffect: context.setShowEffect,
        setTargetedEnemy: context.setTargetedEnemy,
        playerStatusManager: context.playerStatusManager,
        enemyStatusManagers: context.enemyStatusManagers,
        updatePlayerStatusEffects: context.updatePlayerStatusEffects,
        maxPlayerHp: context.maxPlayerHp
      }

      // 플레이어 턴
      if (turn % 2 === 1) {
        const result = await BattleLogicService.processPlayerTurn(battleContext)
        playerHp = result.playerHp
        enemyList = result.enemyList
        playerCursed = result.playerCursed

        if (playerFrozen) {
          playerFrozen = false
        }
        
        // 컴패니언 턴 (플레이어 턴 직후)
        if (context.companion && companionHp > 0 && enemyList.some(e => e.hp > 0)) {
          const companionResult = await CompanionBattleService.processCompanionTurn(
            {
              companion: context.companion,
              companionHp,
              maxCompanionHp: context.companion.currentStats.maxHp,
              playerHp,
              maxPlayerHp: context.maxPlayerHp,
              enemyList,
              currentTurn: turn,
              companionStatusManager: context.companionStatusManager!,
              companionSkillCooldowns: context.companionSkillCooldowns!
            },
            context.addLog,
            context.showDamageEffect,
            context.showCompanionHeal
          )
          
          companionHp = companionResult.companionHp
          enemyList = companionResult.enemyList
          
          if (context.setCompanionHp) {
            context.setCompanionHp(companionHp)
          }
          
          // 컴패니언 애니메이션 딜레이
          if (companionResult.animations.length > 0) {
            await context.animationDelay(800)
          }
        }
      }
      // 적 턴
      else {
        const result = await BattleLogicService.processEnemyTurn(battleContext)
        playerHp = result.playerHp
        enemyList = result.enemyList
        playerFrozen = result.playerFrozen
        playerCursed = result.playerCursed
        poisonDamage = result.poisonDamage
        
        // 컴패니언도 적의 공격 대상이 될 수 있음
        if (context.companion && companionHp > 0 && Math.random() < 0.3) {
          // 30% 확률로 컴패니언이 공격받음
          const targetingCompanion = enemyList.filter(e => e.hp > 0).slice(0, 1)[0]
          if (targetingCompanion) {
            const damage = BattleEngine.calculateEnemyDamage(targetingCompanion).damage
            const damageResult = CompanionBattleService.processCompanionDamage(
              context.companion,
              damage,
              companionHp,
              context.companion.currentStats.maxHp
            )
            
            companionHp = damageResult.newHp
            if (context.setCompanionHp) {
              context.setCompanionHp(companionHp)
            }
            if (context.showCompanionDamage) {
              context.showCompanionDamage(damageResult.finalDamage)
            }
            
            context.addLog(
              `👹 ${targetingCompanion.name}이(가) ${context.companion.nickname}을(를) 공격! ${damageResult.finalDamage}의 피해!`,
              'damage'
            )
            
            if (companionHp <= 0) {
              context.addLog(`😢 ${context.companion.nickname}이(가) 쓰러졌습니다...`, 'end')
            }
          }
        }
      }

      context.setCurrentTurn(null)

      // 현재 상태 yield
      yield {
        playerHp,
        enemyList,
        turn,
        playerFrozen,
        playerCursed,
        poisonDamage,
        isComplete: false,
        victory: false,
        companionHp
      }
    }

    // 전투 종료
    const victory = playerHp > 0
    if (victory) {
      context.addLog(`🎉 승리! 모든 몬스터를 물리쳤습니다!`, 'end')
    } else {
      context.addLog(`💀 패배... 쓰러졌습니다...`, 'end')
    }

    // 최종 상태
    yield {
      playerHp,
      enemyList,
      turn,
      playerFrozen,
      playerCursed,
      poisonDamage,
      isComplete: true,
      victory,
      companionHp
    }
  }

  static createBattleGenerator(context: BattleGeneratorContext) {
    return this.battleGenerator(context)
  }
}
