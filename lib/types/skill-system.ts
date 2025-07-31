/**
 * 스킬 시스템 타입 정의
 * 다양한 스킬 효과와 조합 시스템 포함
 */

// 스킬 카테고리
export const SkillCategory = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SUPPORT: 'support',
  SPECIAL: 'special',
} as const

export type SkillCategory = typeof SkillCategory[keyof typeof SkillCategory]

// 스킬 타입
export const SkillType = {
  ACTIVE: 'active',
  PASSIVE: 'passive',
  TOGGLE: 'toggle',
  COMBO: 'combo',
} as const

export type SkillType = typeof SkillType[keyof typeof SkillType]

// 타겟 타입
export const TargetType = {
  SELF: 'self',
  SINGLE_ENEMY: 'singleEnemy',
  ALL_ENEMIES: 'allEnemies',
  SINGLE_ALLY: 'singleAlly',
  ALL_ALLIES: 'allAllies',
  RANDOM_ENEMY: 'randomEnemy',
  AREA: 'area',
} as const

export type TargetType = typeof TargetType[keyof typeof TargetType]

// 효과 타입
export const EffectType = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  DOT: 'dot', // Damage Over Time
  HOT: 'hot', // Heal Over Time
  STUN: 'stun',
  SILENCE: 'silence',
  SLOW: 'slow',
  KNOCKBACK: 'knockback',
  PULL: 'pull',
  TELEPORT: 'teleport',
  SUMMON: 'summon',
  TRANSFORM: 'transform',
  SHIELD: 'shield',
  REFLECT: 'reflect',
  ABSORB: 'absorb',
  DISPEL: 'dispel',
  STEAL: 'steal',
  COPY: 'copy',
  EXECUTE: 'execute',
} as const

export type EffectType = typeof EffectType[keyof typeof EffectType]

// 원소 타입
export const ElementType = {
  PHYSICAL: 'physical',
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  NATURE: 'nature',
  HOLY: 'holy',
  DARK: 'dark',
  NEUTRAL: 'neutral',
} as const

export type ElementType = typeof ElementType[keyof typeof ElementType]

// 스킬 효과
export interface SkillEffect {
  readonly type: EffectType
  readonly value: number | { min: number; max: number } | { base: number; scaling: number }
  readonly element?: ElementType
  readonly duration?: number
  readonly chance?: number // 0-100
  readonly stacks?: number
  readonly condition?: EffectCondition
}

// 효과 조건
export interface EffectCondition {
  readonly type: 'hp' | 'mp' | 'buff' | 'debuff' | 'combo' | 'critical'
  readonly operator: '<' | '>' | '=' | '<=' | '>='
  readonly value: number | string
}

// 스킬 인터페이스
export interface Skill {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: SkillCategory
  readonly type: SkillType
  readonly level: number
  readonly maxLevel: number
  readonly cooldown: number
  readonly mpCost: number | { base: number; perLevel: number }
  readonly castTime?: number
  readonly range: number
  readonly target: TargetType
  readonly effects: ReadonlyArray<SkillEffect>
  readonly requirements?: SkillRequirements
  readonly icon: string
  readonly animation?: string
  readonly sound?: string
}

// 스킬 요구사항
export interface SkillRequirements {
  readonly level?: number
  readonly stats?: Partial<{
    readonly strength: number
    readonly intelligence: number
    readonly agility: number
    readonly vitality: number
  }>
  readonly skills?: ReadonlyArray<{ id: string; level: number }>
  readonly items?: ReadonlyArray<string>
}

// 학습된 스킬
export interface LearnedSkill {
  readonly skillId: string
  readonly level: number
  readonly experience: number
  readonly cooldownRemaining: number
  readonly isActive: boolean // 토글 스킬용
  readonly slot?: number // 퀵슬롯 위치
}

// 스킬 콤보
export interface SkillCombo {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly sequence: ReadonlyArray<string> // 스킬 ID 순서
  readonly timeWindow: number // 콤보 입력 제한 시간
  readonly bonusEffect?: SkillEffect
  readonly replaceWithSkill?: string // 콤보 완성시 발동되는 특수 스킬
}

// 스킬 시너지
export interface SkillSynergy {
  readonly skills: ReadonlyArray<string>
  readonly bonus: {
    readonly type: 'damage' | 'cooldown' | 'cost' | 'effect'
    readonly value: number // 배율 또는 감소량
  }
  readonly description: string
}

// 스킬 트리 노드
export interface SkillTreeNode {
  readonly id: string
  readonly skillId: string
  readonly position: { x: number; y: number }
  readonly prerequisites: ReadonlyArray<string> // 선행 노드 ID
  readonly cost: {
    readonly points: number
    readonly gold?: number
    readonly items?: ReadonlyArray<{ id: string; quantity: number }>
  }
}

// 스킬 사용 결과
export interface SkillExecutionResult {
  readonly skillId: string
  readonly caster: string
  readonly targets: ReadonlyArray<string>
  readonly effects: ReadonlyArray<{
    readonly targetId: string
    readonly effect: SkillEffect
    readonly actualValue: number
    readonly isCritical?: boolean
    readonly isResisted?: boolean
    readonly isDodged?: boolean
  }>
  readonly combos?: ReadonlyArray<string>
  readonly timestamp: number
}

// 스킬 업그레이드 옵션
export interface SkillUpgrade {
  readonly type: 'damage' | 'range' | 'cooldown' | 'cost' | 'effect'
  readonly value: number
  readonly cost: {
    readonly gold: number
    readonly materials: ReadonlyArray<{ id: string; quantity: number }>
  }
}

// 타입 가드 함수
export function isValidSkill(value: unknown): value is Skill {
  if (typeof value !== 'object' || value === null) return false
  
  const skill = value as Record<string, unknown>
  
  return (
    typeof skill.id === 'string' &&
    typeof skill.name === 'string' &&
    typeof skill.description === 'string' &&
    Object.values(SkillCategory).includes(skill.category as SkillCategory) &&
    Object.values(SkillType).includes(skill.type as SkillType) &&
    typeof skill.level === 'number' &&
    typeof skill.maxLevel === 'number' &&
    typeof skill.cooldown === 'number' &&
    (typeof skill.mpCost === 'number' || typeof skill.mpCost === 'object') &&
    typeof skill.range === 'number' &&
    Object.values(TargetType).includes(skill.target as TargetType) &&
    Array.isArray(skill.effects) &&
    typeof skill.icon === 'string'
  )
}

// 스킬 필터
export interface SkillFilter {
  readonly category?: SkillCategory[]
  readonly type?: SkillType[]
  readonly element?: ElementType[]
  readonly minLevel?: number
  readonly maxLevel?: number
  readonly learned?: boolean
}

// 스킬 정렬 옵션
export type SkillSortOption = 
  | 'name'
  | 'level'
  | 'category'
  | 'damage'
  | 'cooldown'
  | 'mpCost'

// 스킬 계산 유틸리티 타입
export interface SkillCalculation {
  readonly baseDamage: number
  readonly elementalBonus: number
  readonly criticalBonus: number
  readonly comboBonus: number
  readonly synergyBonus: number
  readonly totalDamage: number
}

// 스킬 쿨다운 관리
export interface CooldownState {
  readonly [skillId: string]: {
    readonly remaining: number
    readonly total: number
    readonly reducedBy: number
  }
}

// 스킬 실행 컨텍스트
export interface SkillContext {
  readonly caster: {
    readonly id: string
    readonly stats: Record<string, number>
    readonly buffs: ReadonlyArray<string>
    readonly debuffs: ReadonlyArray<string>
  }
  readonly targets: ReadonlyArray<{
    readonly id: string
    readonly stats: Record<string, number>
    readonly resistances: Partial<Record<ElementType, number>>
  }>
  readonly environment?: {
    readonly weather?: 'sunny' | 'rainy' | 'stormy' | 'foggy'
    readonly terrain?: 'plains' | 'forest' | 'mountain' | 'water'
  }
}