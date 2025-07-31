/**
 * 통합 전투 시스템 타입 정의
 * 던전 내 전투, 스킬, 아이템 사용 등 포함
 */

import type { Character, CombatStats as CombatStat } from './game-core'
import type { GeneratedItem } from './item-system'
import type { Skill, SkillEffect, ElementType, TargetType } from './skill-system'

// 전투 참가자
export interface CombatParticipant {
  readonly id: string
  readonly name: string
  readonly type: 'player' | 'monster' | 'npc' | 'summon'
  readonly level: number
  readonly stats: CombatStats
  readonly currentHp: number
  readonly currentMp: number
  readonly position: Position
  readonly team: 'player' | 'enemy'
  readonly element?: ElementType
  readonly skills: ReadonlyArray<string>
  readonly equipment?: ReadonlyArray<GeneratedItem>
  readonly statusEffects: ReadonlyArray<ActiveStatusEffect>
  readonly ai?: CombatAI
}

// 전투 스탯
export interface CombatStats {
  readonly [CombatStat.HP]: number
  readonly [CombatStat.MP]: number
  readonly [CombatStat.ATTACK]: number
  readonly [CombatStat.DEFENSE]: number
  readonly [CombatStat.SPEED]: number
  readonly [CombatStat.CRIT_RATE]: number
  readonly [CombatStat.CRIT_DAMAGE]: number
  readonly [CombatStat.DODGE]: number
  readonly [CombatStat.ACCURACY]: number
  readonly [CombatStat.RESISTANCE]: number
  readonly elementalResistance?: Partial<Record<ElementType, number>>
}

// 위치 정보
export interface Position {
  readonly x: number
  readonly y: number
  readonly z?: number // 공중 유닛용
}

// 활성 상태 효과
export interface ActiveStatusEffect {
  readonly id: string
  readonly type: StatusEffectType
  readonly source: string // 시전자 ID
  readonly remainingDuration: number
  readonly stacks: number
  readonly value: number
  readonly appliedAt: number
}

// 상태 효과 타입
export const StatusEffectType = {
  // 버프
  ATTACK_UP: 'attackUp',
  DEFENSE_UP: 'defenseUp',
  SPEED_UP: 'speedUp',
  CRIT_UP: 'critUp',
  REGEN: 'regen',
  SHIELD: 'shield',
  IMMUNITY: 'immunity',
  REFLECT: 'reflect',
  
  // 디버프
  ATTACK_DOWN: 'attackDown',
  DEFENSE_DOWN: 'defenseDown',
  SPEED_DOWN: 'speedDown',
  ACCURACY_DOWN: 'accuracyDown',
  POISON: 'poison',
  BURN: 'burn',
  FREEZE: 'freeze',
  STUN: 'stun',
  SILENCE: 'silence',
  BLIND: 'blind',
  CURSE: 'curse',
  
  // 특수
  TAUNT: 'taunt',
  STEALTH: 'stealth',
  INVINCIBLE: 'invincible',
  BERSERK: 'berserk',
} as const

export type StatusEffectType = typeof StatusEffectType[keyof typeof StatusEffectType]

// 전투 AI 타입
export interface CombatAI {
  readonly type: AIType
  readonly aggressiveness: number // 0-100
  readonly skillPreference: 'random' | 'optimal' | 'pattern'
  readonly targetingPriority: TargetingPriority
  readonly specialBehaviors?: ReadonlyArray<AIBehavior>
}

export type AIType = 'aggressive' | 'defensive' | 'balanced' | 'support' | 'boss'
export type TargetingPriority = 'lowest_hp' | 'highest_hp' | 'highest_damage' | 'random' | 'closest'

export interface AIBehavior {
  readonly trigger: 'hp_threshold' | 'turn_count' | 'ally_death' | 'phase_change'
  readonly condition: unknown
  readonly action: string // 스킬 ID 또는 특수 행동
}

// 전투 상태
export interface CombatState {
  readonly id: string
  readonly participants: ReadonlyArray<CombatParticipant>
  readonly turnOrder: ReadonlyArray<string> // 참가자 ID 순서
  readonly currentTurn: string
  readonly turnCount: number
  readonly phase: CombatPhase
  readonly environment?: CombatEnvironment
  readonly history: ReadonlyArray<CombatAction>
  readonly startedAt: number
  readonly endedAt?: number
  readonly difficulty?: 'easy' | 'normal' | 'hard' | 'nightmare' | 'expert' | 'legendary'
  readonly rewards?: CombatRewards
}

export type CombatPhase = 'preparation' | 'battle' | 'victory' | 'defeat' | 'escaped'

// 전투 환경
export interface CombatEnvironment {
  readonly type: 'dungeon' | 'arena' | 'field' | 'boss_room'
  readonly terrain: TerrainType
  readonly weather?: WeatherType
  readonly modifiers: ReadonlyArray<EnvironmentModifier>
}

export type TerrainType = 'plains' | 'forest' | 'mountain' | 'water' | 'lava' | 'ice'
export type WeatherType = 'clear' | 'rain' | 'storm' | 'snow' | 'fog'

export interface EnvironmentModifier {
  readonly type: string
  readonly effect: string
  readonly value: number
}

// 전투 행동
export interface CombatAction {
  readonly id: string
  readonly turn: number
  readonly actorId: string
  readonly type: ActionType
  readonly targetIds: ReadonlyArray<string>
  readonly skillId?: string
  readonly itemId?: string
  readonly results: ReadonlyArray<ActionResult>
  readonly timestamp: number
}

export type ActionType = 'attack' | 'skill' | 'item' | 'defend' | 'flee' | 'wait'

// 행동 결과
export interface ActionResult {
  readonly targetId: string
  readonly damage?: DamageResult
  readonly healing?: number
  readonly statusEffects?: ReadonlyArray<{
    readonly type: StatusEffectType
    readonly duration: number
    readonly applied: boolean
  }>
  readonly special?: string // 특수 효과 설명
}

// 데미지 결과
export interface DamageResult {
  readonly amount: number
  readonly type: DamageType
  readonly element: ElementType
  readonly isCritical: boolean
  readonly isDodged: boolean
  readonly isBlocked: boolean
  readonly isResisted: boolean
  readonly combo?: number
}

export type DamageType = 'physical' | 'magical' | 'true' | 'percent'

// 전투 보상
export interface CombatRewards {
  readonly experience: number
  readonly gold: number
  readonly items: ReadonlyArray<{
    readonly itemId: string
    readonly quantity: number
    readonly chance: number
  }>
  readonly bonuses: {
    readonly perfectVictory?: boolean // 무피해 승리
    readonly speedBonus?: boolean // 빠른 처치
    readonly overkill?: boolean // 오버킬
    readonly combo?: number // 최대 콤보
  }
}

// 전투 통계
export interface CombatStatistics {
  readonly totalDamageDealt: number
  readonly totalDamageTaken: number
  readonly totalHealingDone: number
  readonly skillsUsed: number
  readonly itemsUsed: number
  readonly criticalHits: number
  readonly dodges: number
  readonly blocks: number
  readonly maxCombo: number
  readonly turnsSurvived: number
  readonly enemiesDefeated: number
}

// 전투 시작 옵션
export interface CombatStartOptions {
  readonly type: 'dungeon' | 'pvp' | 'raid' | 'event'
  readonly difficulty?: 'easy' | 'normal' | 'hard' | 'nightmare'
  readonly modifiers?: ReadonlyArray<string>
  readonly rewards?: CombatRewards
}

// 전투 결과
export interface CombatResult {
  readonly combatId: string
  readonly winner: 'player' | 'enemy' | 'draw'
  readonly reason: 'defeat_all' | 'timeout' | 'escape' | 'surrender'
  readonly statistics: CombatStatistics
  readonly rewards?: CombatRewards
  readonly experience: {
    readonly [participantId: string]: number
  }
  readonly duration: number
}

// 타입 가드
export function isValidCombatParticipant(value: unknown): value is CombatParticipant {
  if (typeof value !== 'object' || value === null) return false
  
  const participant = value as Record<string, unknown>
  
  return (
    typeof participant.id === 'string' &&
    typeof participant.name === 'string' &&
    ['player', 'monster', 'npc', 'summon'].includes(participant.type as string) &&
    typeof participant.level === 'number' &&
    typeof participant.stats === 'object' &&
    typeof participant.currentHp === 'number' &&
    typeof participant.currentMp === 'number' &&
    typeof participant.position === 'object' &&
    ['player', 'enemy'].includes(participant.team as string) &&
    Array.isArray(participant.skills) &&
    Array.isArray(participant.statusEffects)
  )
}

// 전투 계산 유틸리티
export interface DamageCalculation {
  readonly baseDamage: number
  readonly attackPower: number
  readonly defense: number
  readonly elementalBonus: number
  readonly criticalMultiplier: number
  readonly randomVariance: number
  readonly finalDamage: number
}

export function calculateDamage(
  attacker: CombatStats,
  defender: CombatStats,
  skill?: Skill,
  isCritical: boolean = false
): DamageCalculation {
  const baseDamage = skill?.effects[0]?.value as number || attacker.attack
  const attackPower = attacker.attack
  const defense = defender.defense
  
  // 기본 데미지 = (공격력 * 스킬 계수 - 방어력) * 난수
  const rawDamage = Math.max(1, baseDamage + attackPower - defense)
  const variance = 0.9 + Math.random() * 0.2 // 90% ~ 110%
  
  let finalDamage = rawDamage * variance
  
  if (isCritical) {
    finalDamage *= attacker.critDamage
  }
  
  return {
    baseDamage,
    attackPower,
    defense,
    elementalBonus: 1, // TODO: 원소 계산
    criticalMultiplier: isCritical ? attacker.critDamage : 1,
    randomVariance: variance,
    finalDamage: Math.floor(finalDamage)
  }
}