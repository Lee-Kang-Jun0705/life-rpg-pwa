// JRPG 시스템 타입 정의
import { ItemRarity } from './item-rarity'

// 기본 스탯 타입
export interface BaseStats {
  hp?: number
  mp?: number
  attack?: number
  defense?: number
  speed?: number
  magicPower?: number
  magicResist?: number
  criticalRate?: number
  criticalDamage?: number
  allStats?: number
  penetration?: number
}

// 아이템 타입
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material'

// 장비 슬롯
export enum EquipmentSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY_1 = 'accessory1',
  ACCESSORY_2 = 'accessory2',
  SPECIAL = 'special'
}

// 아이템 랜덤 옵션
export interface ItemRandomOption {
  stat: keyof BaseStats
  min: number
  max: number
  value?: number // 실제 부여된 값
}

// 아이템 인스턴스 (실제 소유한 아이템)
export interface ItemInstance {
  id: string // 고유 ID
  itemId: string // 아이템 정의 ID
  rarity: ItemRarity
  level?: number
  enhancement?: number // 강화 수치
  randomOptions?: ItemRandomOption[]
  equippedBy?: string // 캐릭터 ID
  acquiredAt: Date
  locked?: boolean // 잠금 여부
}

// 아이템 정의
export interface ItemDefinition {
  id: string
  name: string
  description: string
  type: ItemType
  slot?: EquipmentSlot
  rarity: ItemRarity
  levelRequirement: number
  baseStats: BaseStats
  randomOptions?: ItemRandomOption[]
  specialEffect?: string
  setBonus?: {
    setId: string
    pieces: number
    bonus: string
  }
  uniquePassive?: string
  mythicAbility?: string
  sellPrice: number
  icon?: string
}

// 스킬 타입
export type SkillElement = 'physical' | 'fire' | 'ice' | 'thunder' | 'nature' | 'light' | 'dark' | 'arcane'
export type SkillTargetType = 'single' | 'all' | 'self' | 'random' | 'all_allies'

// 스킬 정의
export interface SkillDefinition {
  id: string
  name: string
  description: string
  element: SkillElement
  targetType: SkillTargetType
  unlockLevel: number
  maxLevel: number
  
  // 데미지/회복
  baseDamage?: number
  damagePerLevel?: number
  baseHeal?: number
  healPerLevel?: number
  
  // 소모값
  baseMpCost: number
  mpReductionPerLevel: number
  hpCost?: number // HP 소모 스킬용
  
  // 쿨다운
  baseCooldown: number
  cooldownReduction: number
  
  // 특수 효과
  duration?: number
  castTime?: number
  chargeTime?: number
  specialEffects?: {
    level5?: string
    level10?: string
  }
  
  // 버프/디버프 효과
  attackBonus?: number
  attackBonusPerLevel?: number
  defenseBonus?: number
  defenseBonusPerLevel?: number
  speedReduction?: number
  speedReductionPerLevel?: number
  
  // 상태이상
  statusEffect?: StatusEffectType
  poisonDamage?: number
  poisonDuration?: number
}

// 스킬 인스턴스 (학습한 스킬)
export interface SkillInstance {
  id?: string // 고유 ID (옵셔널)
  skillId: string
  level: number
  experience: number
  cooldownRemaining: number
  equippedSlot?: number // 장착 슬롯
}

// 상태이상 타입
export enum StatusEffectType {
  POISON = 'poison',
  BURN = 'burn',
  FREEZE = 'freeze',
  STUN = 'stun',
  PARALYZE = 'paralyze',
  BLEED = 'bleed',
  BUFF_ATK = 'buff_atk',
  BUFF_DEF = 'buff_def',
  DEBUFF_ATK = 'debuff_atk',
  DEBUFF_DEF = 'debuff_def'
}

// 상태이상 효과
export interface StatusEffect {
  type: StatusEffectType
  duration: number
  stacks?: number
  source?: string // 스킬 ID 또는 아이템 ID
  damagePerTurn?: number
  statModifier?: Partial<BaseStats>
}

// 몬스터 AI 패턴
export type AIPattern = 'aggressive' | 'defensive' | 'balanced' | 'berserk'

// AI 행동 타입
export interface AIBehavior {
  pattern: AIPattern
  priorityTargeting?: 'lowest_hp' | 'highest_threat' | 'random'
  skillUsageRate: number // 스킬 사용 확률 (0-1)
  healThreshold?: number // HP 비율이 이 값 이하일 때 회복 우선
  buffDebuffPriority?: number // 버프/디버프 우선도 (0-1)
  escapeThreshold?: number // HP 비율이 이 값 이하일 때 도망 시도
}

// 몬스터 정의
export interface MonsterDefinition {
  id: string
  name: string
  level: number
  isBoss?: boolean
  stats: BaseStats & { hp: number; mp: number; attack: number; defense: number; speed: number }
  skills: string[]
  aiPattern: AIPattern
  phases?: {
    hpThreshold: number
    pattern: AIPattern
    newSkills?: string[]
  }[]
  weaknesses: SkillElement[]
  resistances: SkillElement[]
  immunities?: StatusEffectType[]
  dropTable: {
    gold: { min: number; max: number }
    items: {
      itemId: string
      dropRate: number
      quantity?: { min: number; max: number }
    }[]
  }
  sprite?: string
}

// 전투 유닛 (플레이어/몬스터 공통)
export interface BattleUnit {
  id: string
  name: string
  isPlayer?: boolean
  type?: 'player' | 'monster'
  level?: number
  stats: BaseStats & { hp: number; maxHp?: number; mp: number; maxMp?: number; attack?: number; defense?: number; speed?: number }
  currentHp: number
  currentMp: number
  maxHp: number
  maxMp: number
  skills: SkillInstance[]
  statusEffects: StatusEffect[]
  equipment?: Partial<Record<EquipmentSlot, ItemInstance>>
  position?: { x: number; y: number }
  aiPattern?: AIPattern
  weaknesses?: SkillElement[]
  resistances?: SkillElement[]
}

// 난이도
export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal', 
  HARD = 'hard',
  NIGHTMARE = 'nightmare'
}

export const DIFFICULTY_MODIFIERS = {
  [Difficulty.EASY]: {
    damageMultiplier: 0.7,
    rewardMultiplier: 0.8,
    enemyAILevel: 1,
    skillCooldownReduction: 0
  },
  [Difficulty.NORMAL]: {
    damageMultiplier: 1,
    rewardMultiplier: 1,
    enemyAILevel: 2,
    skillCooldownReduction: 0
  },
  [Difficulty.HARD]: {
    damageMultiplier: 1.5,
    rewardMultiplier: 1.5,
    enemyAILevel: 3,
    skillCooldownReduction: 0.1
  },
  [Difficulty.NIGHTMARE]: {
    damageMultiplier: 2,
    rewardMultiplier: 2,
    enemyAILevel: 4,
    skillCooldownReduction: 0.2
  }
} as const