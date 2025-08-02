// 전투 시스템 타입 정의
// 모든 any 타입을 제거하고 엄격한 타입 안전성 보장

export interface CharacterStats {
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  readonly maxMp: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly critRate: number;
  readonly dodgeRate: number;
}

export interface BattleCharacter {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly stats: CharacterStats;
  readonly skills: ReadonlyArray<BattleSkill>;
  readonly position: { x: number; y: number };
  readonly emoji: string;
}

export interface BattleSkill {
  readonly id: string;
  readonly name: string;
  readonly type: SkillType;
  readonly power: number;
  readonly mpCost: number;
  readonly cooldown: number;
  readonly currentCooldown: number;
  readonly animation: string;
  readonly range: number;
  readonly effects?: ReadonlyArray<StatusEffect>;
  readonly description?: string;
}

export type SkillType = 'physical' | 'magical' | 'heal' | 'buff' | 'debuff';

export interface StatusEffect {
  readonly type: StatusEffectType;
  readonly duration: number;
  readonly value: number;
  readonly chance: number;
  readonly stackable: boolean;
}

export type StatusEffectType =
  | 'stun'
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'slow'
  | 'weakness'
  | 'strength'
  | 'defense_up'
  | 'defense_down'
  | 'regen';

export interface BattleAction {
  readonly turn: number;
  readonly actor: 'player' | 'enemy';
  readonly action: ActionType;
  readonly skillId?: string;
  readonly itemId?: string;
  readonly target?: string;
  readonly damage?: number;
  readonly healing?: number;
  readonly isCritical?: boolean;
  readonly isDodged?: boolean;
  readonly effects?: ReadonlyArray<AppliedEffect>;
  readonly timestamp: number;
}

export type ActionType = 'attack' | 'skill' | 'item' | 'flee' | 'defend';

export interface AppliedEffect {
  readonly type: StatusEffectType;
  readonly duration: number;
  readonly value: number;
  readonly source: string;
}

export interface BattleConfig {
  readonly battleSpeed: 1 | 2 | 3;
  readonly autoUsePotion: boolean;
  readonly potionHpThreshold: number;
  readonly skillPriority: ReadonlyArray<string>;
  readonly targetingMode: TargetingMode;
  readonly combatStyle: CombatStyle;
}

export type TargetingMode = 'weakest' | 'strongest' | 'random' | 'nearest';
export type CombatStyle = 'aggressive' | 'defensive' | 'balanced';

export interface BattleResult {
  readonly winner: 'player' | 'enemy';
  readonly turns: number;
  readonly actions: ReadonlyArray<BattleAction>;
  readonly rewards?: BattleRewards;
  readonly duration: number;
  readonly playerDamageDealt: number;
  readonly playerDamageTaken: number;
  readonly skillsUsed: number;
  readonly itemsUsed: number;
}

export interface BattleRewards {
  readonly exp: number;
  readonly gold: number;
  readonly items: ReadonlyArray<RewardItem>;
  readonly bonusExp?: number;
  readonly bonusGold?: number;
}

export interface RewardItem {
  readonly itemId: string;
  readonly quantity: number;
  readonly isRare: boolean;
}

export interface CombatLog {
  readonly id: string;
  readonly timestamp: number;
  readonly message: string;
  readonly type: LogType;
  readonly value?: number;
  readonly actorId?: string;
  readonly targetId?: string;
}

export type LogType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'critical'
  | 'dodge'
  | 'skill'
  | 'item'
  | 'system';

// 타입 가드 함수들
export function isValidBattleSkill(skill: unknown): skill is BattleSkill {
  if (typeof skill !== 'object' || skill === null) {
    return false
  }

  const s = skill as Record<string, unknown>

  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    ['physical', 'magical', 'heal', 'buff', 'debuff'].includes(s.type as string) &&
    typeof s.power === 'number' &&
    typeof s.mpCost === 'number' &&
    typeof s.cooldown === 'number' &&
    typeof s.currentCooldown === 'number' &&
    typeof s.animation === 'string' &&
    typeof s.range === 'number'
  )
}

export function isValidCharacterStats(stats: unknown): stats is CharacterStats {
  if (typeof stats !== 'object' || stats === null) {
    return false
  }

  const s = stats as Record<string, unknown>

  return (
    typeof s.hp === 'number' && s.hp >= 0 &&
    typeof s.maxHp === 'number' && s.maxHp > 0 &&
    typeof s.mp === 'number' && s.mp >= 0 &&
    typeof s.maxMp === 'number' && s.maxMp >= 0 &&
    typeof s.attack === 'number' && s.attack >= 0 &&
    typeof s.defense === 'number' && s.defense >= 0 &&
    typeof s.speed === 'number' && s.speed >= 0 &&
    typeof s.critRate === 'number' && s.critRate >= 0 && s.critRate <= 1 &&
    typeof s.dodgeRate === 'number' && s.dodgeRate >= 0 && s.dodgeRate <= 1
  )
}

// 전투 관련 상수
export const BATTLE_CONSTANTS = {
  MAX_TURNS: 100,
  BASE_CRIT_MULTIPLIER: 2.0,
  COMBO_DAMAGE_MULTIPLIER: 0.1,
  MAX_COMBO_COUNT: 10,
  DODGE_CAP: 0.75,
  CRIT_CAP: 0.5,
  MIN_DAMAGE: 1,
  STATUS_EFFECT_CAP: 5,
  SKILL_COOLDOWN_REDUCTION_PER_TURN: 1
} as const

// 콤보 시스템 타입
export interface ComboState {
  count: number;
  lastSkillId: string | null;
  multiplier: number;
  timestamp: number;
}

// 버프/디버프 관리
export interface BuffDebuffState {
  readonly buffs: ReadonlyArray<ActiveStatusEffect>;
  readonly debuffs: ReadonlyArray<ActiveStatusEffect>;
}

export interface ActiveStatusEffect extends StatusEffect {
  readonly id: string;
  readonly sourceId: string;
  readonly remainingDuration: number;
  readonly appliedAt: number;
}

// Result 타입 (에러 처리용)
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 전투 이벤트 타입
export interface BattleEvent {
  readonly type: BattleEventType;
  readonly timestamp: number;
  readonly data: Record<string, unknown>;
}

export type BattleEventType =
  | 'battle_start'
  | 'turn_start'
  | 'turn_end'
  | 'skill_used'
  | 'damage_dealt'
  | 'healing_done'
  | 'effect_applied'
  | 'effect_expired'
  | 'battle_end';
