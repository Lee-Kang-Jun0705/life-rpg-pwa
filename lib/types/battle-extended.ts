// 확장된 전투 시스템 타입
// 기존 battle.ts를 확장하여 더 상세한 전투 메커니즘 구현

import type {
  CharacterStats as BaseCharacterStats,
  BattleSkill as BaseBattleSkill,
  StatusEffect as BaseStatusEffect,
  BattleAction as BaseBattleAction,
  Result
} from './battle'
import type { EquipmentItem } from './inventory'
import type { StatType } from './game-common'

// 확장된 캐릭터 능력치
export interface CharacterStats extends BaseCharacterStats {
  readonly level: number;
  readonly magicAttack: number;
  readonly magicDefense: number;
  readonly accuracy: number;
  readonly evasion: number;
  readonly critical: number;
  readonly criticalDamage: number;
}

// 속성 타입
export type ElementType =
  | 'neutral'
  | 'fire'
  | 'water'
  | 'earth'
  | 'wind'
  | 'light'
  | 'dark'
  | 'electric'
  | 'ice'
  | 'poison';

// 확장된 전투 스킬
export interface BattleSkill extends Omit<BaseBattleSkill, 'type'> {
  readonly type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  readonly damageType?: 'physical' | 'magical';
  readonly element?: ElementType;
  readonly targetType: 'single' | 'all' | 'self' | 'random';
  readonly hitCount?: number;
  readonly accuracy: number;
  readonly comboWith?: ReadonlyArray<string>;
  readonly statusEffect?: StatusEffect;
  readonly healAmount?: number;
}

// 확장된 상태 이상 효과
export interface StatusEffect extends Omit<BaseStatusEffect, 'type'> {
  readonly id: string;
  readonly name: string;
  readonly type: 'buff' | 'debuff';
  readonly stats?: Partial<CharacterStats>;
  readonly damagePerTurn?: number;
  readonly healPerTurn?: number;
  readonly duration: number;
  readonly stackable: boolean;
  readonly chance: number;
}

// 확장된 전투 캐릭터
export interface BattleCharacter {
  readonly id: string;
  readonly name: string;
  readonly type: 'player' | 'enemy' | 'ally';
  readonly emoji?: string;
  readonly stats: CharacterStats;
  readonly skills: BattleSkill[];
  readonly position: { x: number; y: number };
  readonly statusEffects: StatusEffect[];
  readonly equipment?: ReadonlyArray<EquipmentItem>;
  readonly resistances?: ReadonlyArray<ElementType>;
  readonly weaknesses?: ReadonlyArray<ElementType>;
}

// 확장된 전투 액션
export interface BattleAction extends Omit<BaseBattleAction, 'actor'> {
  readonly id: string;
  readonly attacker: string;
  readonly target: string;
  readonly skill: BattleSkill;
  readonly damage?: number;
  readonly healing?: number;
  readonly isCritical?: boolean;
  readonly isEvaded?: boolean;
  readonly elementalBonus?: number;
  readonly comboCount?: number;
  readonly statusEffectApplied?: string;
  readonly turn: number;
  readonly timestamp: number;
}

// 전투 상태
export interface BattleState {
  readonly id: string;
  readonly player: BattleCharacter;
  readonly enemy: BattleCharacter;
  readonly turn: number;
  readonly phase: 'preparing' | 'fighting' | 'finished' | 'interrupted';
  readonly timestamp: Date;
  readonly actions: ReadonlyArray<BattleAction>;
  readonly activeEffects: ReadonlyArray<ActiveEffect>;
}

// 활성 효과
export interface ActiveEffect {
  readonly effectId: string;
  readonly targetId: string;
  readonly sourceId: string;
  readonly remainingTurns: number;
  readonly appliedAt: number;
}

// 전투 결과
export interface BattleResult {
  readonly winner: 'player' | 'enemy' | null;
  readonly turns: number;
  readonly actions: ReadonlyArray<BattleAction>;
  readonly experience: number;
  readonly rewards?: {
    gold: number;
    items: ReadonlyArray<string>;
  };
}

// 몬스터 데이터
export interface MonsterData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly emoji?: string;
  readonly tier: MonsterTier;
  readonly stats: CharacterStats;
  readonly skills: ReadonlyArray<BattleSkill>;
  readonly dropTable?: ReadonlyArray<DropTableEntry>;
  readonly weaknesses?: ReadonlyArray<ElementType>;
  readonly resistances?: ReadonlyArray<ElementType>;
}

export type MonsterTier = 'common' | 'elite' | 'boss' | 'legendary';

export interface DropTableEntry {
  readonly itemId: string;
  readonly chance: number;
  readonly minQuantity: number;
  readonly maxQuantity: number;
}

// 전투 계산 컨텍스트
export interface BattleContext {
  readonly attacker: BattleCharacter;
  readonly defender: BattleCharacter;
  readonly skill: BattleSkill;
  readonly comboCount: number;
  readonly environmentEffects?: ReadonlyArray<EnvironmentEffect>;
}

export interface EnvironmentEffect {
  readonly type: string;
  readonly modifier: number;
  readonly affectsElements?: ReadonlyArray<ElementType>;
}

// 전투 상수
export const BATTLE_CONSTANTS = {
  BASE_HP: 100,
  BASE_MP: 50,
  BASE_ATTACK: 10,
  BASE_MAGIC_ATTACK: 10,
  BASE_DEFENSE: 5,
  BASE_MAGIC_DEFENSE: 5,
  BASE_SPEED: 10,
  BASE_ACCURACY: 95,
  BASE_EVASION: 0.05,
  BASE_CRITICAL: 0.05,
  BASE_CRITICAL_DAMAGE: 1.5,
  ELEMENT_WEAKNESS_MULTIPLIER: 1.5,
  ELEMENT_RESISTANCE_MULTIPLIER: 0.5,
  COMBO_DAMAGE_BONUS: 0.1,
  MAX_COMBO_COUNT: 10,
  TURN_LIMIT: 100
} as const
