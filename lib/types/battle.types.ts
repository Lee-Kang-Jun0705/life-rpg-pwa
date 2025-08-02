import { SpecialAbility, BattleMessageType } from '@/lib/constants/battle.constants'
import { ElementType } from './element-system'
import { AIPattern, MonsterAIState } from './monster-ai'
import { StatusEffect } from './status-effects'

// 전투 스탯 인터페이스
export interface CombatStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  specialAbility?: SpecialAbility | null
  element?: ElementType // 속성 추가
  statusEffects?: StatusEffect[] // 상태이상 추가
  statusResistance?: number // 상태이상 저항력
}

// 적 데이터 인터페이스
export interface EnemyData extends CombatStats {
  id: number
  name: string
  emoji: string
  aiPattern?: AIPattern // AI 패턴 추가
  aiState?: MonsterAIState // AI 상태 추가
}

// 전투 메시지 인터페이스
export interface BattleMessage {
  text: string
  timestamp: Date
  type: BattleMessageType
}

// 데미지 결과 인터페이스
export interface DamageResult {
  damage: number
  isCritical: boolean
  isStrong?: boolean
}

// 특수 능력 결과 인터페이스
export interface AbilityResult {
  success: boolean
  effect?: string
  value?: number
}

// 전투 상태 인터페이스
export interface BattleState {
  playerHp: number
  maxPlayerHp: number
  playerAttack: number
  playerElement?: ElementType // 플레이어 속성 추가
  playerStatusEffects: StatusEffect[] // 플레이어 상태이상
  enemyList: EnemyData[]
  turn: number
  playerFrozen: boolean // 호환성을 위해 유지
  playerCursed: boolean // 호환성을 위해 유지
  poisonDamage: number // 호환성을 위해 유지
  battleHistory: BattleMessage[]
}

// 전투 턴 결과 인터페이스
export interface TurnResult {
  playerHp: number
  enemyList: EnemyData[]
  messages: BattleMessage[]
  statusEffects?: {
    frozen?: boolean
    cursed?: boolean
    poisonDamage?: number
  }
}

// 전투 화면 Props 인터페이스
export interface SimpleBattleScreenProps {
  enemies: Array<{
    name: string
    emoji: string
    stats: {
      hp: number
      attack: number
      defense: number
      speed?: number
      specialAbility?: string | null
      element?: ElementType // 속성 추가
    }
    aiPattern?: AIPattern // AI 패턴 추가
  }>
  enemyLevel: number
  playerLevel?: number
  initialHpRatio?: number
  onBattleEnd: (victory: boolean, hpRatio?: number) => void
  floorInfo?: {
    currentFloor: number
    totalFloors: number
    dungeonName: string
  }
}

// 데미지 표시 상태 인터페이스
export interface DamageDisplay {
  player?: number
  enemies: Map<number, number>
}

// 애니메이션 효과 타입
export type AnimationEffect = 'playerAttack' | 'enemyAttack' | null

// 턴 타입
export type TurnType = 'player' | 'enemy' | null
