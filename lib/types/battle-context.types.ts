import { BattleMessage, EnemyData } from './battle.types'
import { ElementType } from './element-system'
import { StatusEffectManager } from '../services/status-effect.service'
import { StatusEffect } from './status-effects'
import { CompanionInstance } from './companion'

// 전투 상태 컨텍스트
export interface BattleStateContext {
  playerHp: number
  maxPlayerHp: number
  playerAttack: number
  playerElement?: ElementType
  enemyList: EnemyData[]
  turn: number
  playerFrozen: boolean
  playerCursed: boolean
  poisonDamage: number
  playerStatusManager?: StatusEffectManager
  enemyStatusManagers?: Map<number, StatusEffectManager>
  // 컴패니언 관련
  companion?: CompanionInstance
  companionHp?: number
  companionMaxHp?: number
  companionStatusManager?: StatusEffectManager
}

// 전투 제어 컨텍스트
export interface BattleControlContext {
  battleSpeed: number
  abortSignal: AbortSignal
}

// 전투 UI 컨텍스트
export interface BattleUIContext {
  addLog: (message: string, type: BattleMessage['type']) => void
  showDamageEffect: (damage: number, targetId?: number, isPlayer?: boolean) => void
  animationDelay: (duration: number) => Promise<void>
  setShowEffect: (effect: 'playerAttack' | 'enemyAttack' | null) => void
  setTargetedEnemy: (id: number | null) => void
  setCurrentTurn: (turn: 'player' | 'enemy' | null) => void
}

// 전투 업데이트 컨텍스트
export interface BattleUpdateContext {
  updateEnemyHp: (enemyId: number, newHp: number) => void
  setPlayerHp: (hp: number) => void
  updatePlayerStatusEffects?: (effects: StatusEffect[]) => void
}

// 전체 전투 컨텍스트
export interface BattleContext
  extends BattleStateContext,
          BattleControlContext,
          BattleUIContext,
          BattleUpdateContext {}
