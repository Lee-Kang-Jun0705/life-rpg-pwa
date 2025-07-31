// 중앙 타입 정의 및 재수출
export * from './dashboard'
export * from './character'
export * from './shop'
export * from './common'
export * from './api'
export * from './ui'
export * from './achievements'
export * from './collection'
export type {
  EquipmentType,
  EquipmentRarity,
  EquipmentTier,
  SpecialEffect,
  Equipment,
  SetBonus,
  EquipmentSet,
  EquippedGear,
  EquipmentInventory,
  EnhancementMaterial,
  EnhancementInfo,
  EquipmentFilter,
  EquipmentSortOption
} from './equipment'
export {
  calculateEquipmentPower,
  getActiveSetBonuses,
  calculateTotalStats,
  calculateEnhancementSuccessRate
} from './equipment'
export type { EquipmentStats as EquipmentStatsFromEquipment } from './equipment'
export * from './dungeon'
export type { 
  CharacterStats, 
  BattleAction, 
  BattleSkill, 
  StatusEffect, 
  BattleResult,
  StatusEffectType,
  ActionType,
  AppliedEffect
} from './battle'
export {
  isValidBattleSkill,
  isValidCharacterStats
} from './battle'
export * from './ranking'
export * from './daily-content'
export type { 
  Stage,
  StageReward,
  StageObjective,
  StageResult,
  StageProgress,
  StageUnlockCondition,
  DungeonStages,
  StageBattleConfig,
  StageClearRating
} from './stage'
export {
  STAGE_DIFFICULTY_SCALING,
  STAR_CONDITIONS,
  isStageCompleted,
  isStageAvailable,
  calculateStars
} from './stage'
export type { 
  Activity,
  ActivityQuality,
  ExpCalculationResult,
  ExpContext,
  DailyLimitCheck,
  LevelInfo,
  AppliedBonus,
  AppliedPenalty,
  StatLimits,
  BonusLimits,
  StreakBonus,
  QualityBonus,
  VarietyBonus,
  TimingBonus,
  SocialBonus,
  AchievementBonus,
  RepetitionPenalty,
  InactivityPenalty,
  ExpStatistics,
  ExpEvent,
  ExpEventType,
  UserExpContext,
  StreakInfo,
  ExpTrend,
  DailyExpLimit,
  ExperienceConfig,
  BonusConfig,
  PenaltyConfig,
  DailyLimitConfig
} from './experience'
export type {
  ItemRarity,
  EquipmentSlot,
  BaseItem,
  Item,
  EquipmentItem,
  EquipmentSubType,
  EquipmentRequirements,
  ConsumableItem,
  ConsumableSubType,
  UseEffect,
  UseEffectType,
  MaterialItem,
  MaterialSubType,
  MaterialCategory,
  MiscItem,
  MiscSubType,
  ItemEffect,
  ItemEffectStat,
  EffectCondition,
  InventorySlot,
  PlayerInventory,
  EquippedItem,
  EnhancementResult,
  EnhancementCost,
  ItemSet,
  ItemFilterOptions,
  ItemSortOptions,
  ItemSortField,
  Transaction,
  DropTable,
  DropTableEntry,
  DropCondition
} from './inventory'
export {
  ITEM_RARITY,
  isEquipmentItem,
  isConsumableItem,
  isMaterialItem,
  isMiscItem,
  isStackableItem,
  canEquipItem,
  INVENTORY_CONSTANTS
} from './inventory'
export type { EquipmentStats as EquipmentStatsFromInventory } from './inventory'
export type { EquippedGear as EquippedGearFromInventory } from './inventory'
export type { SetBonus as SetBonusFromInventory } from './inventory'
export * from './energy'
export type { Result } from './game-common'

// 공통 타입 정의
export interface BaseEntity {
  id?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface UserEntity extends BaseEntity {
  userId: string
}

// 타입 가드 유틸리티
export function isUserEntity(obj: unknown): obj is UserEntity {
  return obj !== null && typeof obj === 'object' && 'userId' in obj && typeof (obj as { userId: unknown }).userId === 'string'
}

// 에러 타입
export interface AppError {
  code: string
  message: string
  details?: unknown
  timestamp: Date
}