/**
 * 게임 관련 상수 정의
 */

// 경험치 관련
export const EXPERIENCE = {
  BASE_EXP_PER_LEVEL: 1000,
  EXP_MULTIPLIER: 1.2,
  MAX_LEVEL: 100,
  QUALITY_MULTIPLIERS: {
    D: 0.5,
    C: 0.75,
    B: 1.0,
    A: 1.5,
    S: 2.0,
  },
} as const

// 스탯 타입
export const STAT_TYPES = {
  HEALTH: 'health',
  LEARNING: 'learning',
  RELATIONSHIP: 'relationship',
  ACHIEVEMENT: 'achievement',
} as const

// 에너지 시스템
export const ENERGY = {
  MAX_ENERGY: 100,
  REGEN_RATE: 1, // 분당
  ACTIVITY_COST: {
    LOW: 10,
    MEDIUM: 20,
    HIGH: 30,
  },
} as const

// 배틀 시스템
export const BATTLE = {
  TURN_DURATION: 3000, // ms
  MAX_TURNS: 50,
  CRIT_CHANCE: 0.1,
  CRIT_MULTIPLIER: 1.5,
  DODGE_CHANCE: 0.05,
} as const

// 던전 설정
export const DUNGEON = {
  MAX_FLOORS: 100,
  BOSS_INTERVAL: 10, // 10층마다 보스
  REWARD_MULTIPLIER: {
    NORMAL: 1,
    ELITE: 1.5,
    BOSS: 2,
  },
} as const

// 아이템 등급
export const ITEM_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const

// 일일 제한
export const DAILY_LIMITS = {
  FREE_ENERGY_REFILLS: 3,
  DUNGEON_ENTRIES: 5,
  PVP_BATTLES: 10,
  MISSION_REFRESHES: 2,
} as const

// 레벨 설정
export const LEVEL_CONFIG = {
  BASE_EXP: 100,
  EXP_MULTIPLIER: 1.5,
  MAX_LEVEL: 100,
} as const

// 인벤토리 설정
export const INVENTORY_CONFIG = {
  BASE_SLOTS: 50,
  MAX_SLOTS: 200,
  DEFAULT_MAX_STACK: 999,
} as const