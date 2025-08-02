/**
 * 게임 전반적인 설정 상수
 * 하드코딩된 값들을 모아놓은 중앙 집중식 설정 파일
 */

// 기본 사용자 설정
export const USER_CONFIG = {
  DEFAULT_USER_ID: 'default-user'
} as const

// 경험치 시스템 설정
export const EXPERIENCE_CONFIG = {
  MIN_EXPERIENCE_GAIN: 10,
  MAX_EXPERIENCE_GAIN: 100,
  LEVEL_UP_BASE_EXP: 100,
  LEVEL_UP_MULTIPLIER: 1.2
} as const

// 에너지 시스템 설정
export const ENERGY_CONFIG = {
  MAX_ENERGY: 100,
  ENERGY_REGEN_RATE: 1, // 시간당 회복량
  ENERGY_REGEN_INTERVAL: 300000, // 5분 (밀리초)
  ENERGY_COST_PER_ACTIVITY: 10
} as const

// 전투 티켓 시스템 설정
export const TICKET_CONFIG = {
  MAX_TICKETS: 10,
  TICKET_REGEN_RATE: 1,
  TICKET_REGEN_INTERVAL: 1800000, // 30분 (밀리초)
  TICKET_COST_PER_BATTLE: 1
} as const

// 시간 제한 설정
export const TIME_RESTRICTION_CONFIG = {
  DAILY_PLAY_LIMIT: 14400000, // 4시간 (밀리초)
  BREAK_REMINDER_INTERVAL: 3600000, // 1시간 (밀리초)
  WEEKEND_BONUS_MULTIPLIER: 1.5
} as const

// 캐시 설정
export const CACHE_CONFIG = {
  MAX_SIZE: 100,
  CLEANUP_INTERVAL: 60000, // 1분
  DEFAULT_TTL: 300000, // 5분
  MEMORY_CACHE_PREFIX: 'life-rpg-'
} as const

// API 설정
export const API_CONFIG = {
  REQUEST_TIMEOUT: 10000, // 10초
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1초
  BATCH_SIZE: 10
} as const

// UI 설정
export const UI_CONFIG = {
  TOAST_DURATION: 3000, // 3초
  ANIMATION_DURATION: 200, // 0.2초
  LOADING_DELAY: 500, // 0.5초
  DEBOUNCE_DELAY: 300, // 0.3초

  // 애니메이션 타이밍
  ANIMATION_DAMAGE_DELAY: 1000, // 1초
  ANIMATION_BATTLE_DELAY: 1500, // 1.5초
  ANIMATION_REWARD_STEP_1: 300, // 0.3초
  ANIMATION_REWARD_STEP_2: 800, // 0.8초
  ANIMATION_REWARD_STEP_3: 1300, // 1.3초

  // 기타 UI 타이밍
  PAGE_RELOAD_DELAY: 1000, // 1초
  SCROLL_TIMEOUT: 1000, // 1초
  ACTION_RESET_DELAY: 300, // 0.3초
  DATABASE_CHECK_INTERVAL: 100, // 0.1초
  REFRESH_DELAY: 100, // 0.1초

  // 전투 애니메이션
  BATTLE_ANIMATION_STEP: 300, // 0.3초
  BATTLE_DAMAGE_DISPLAY_DURATION: 1000, // 1초
  BATTLE_ACTION_INTERVAL: 500, // 0.5초
  BATTLE_END_DELAY: 1000, // 1초
  BATTLE_VICTORY_DELAY: 2000 // 2초
} as const

// 던전 시스템 설정
export const DUNGEON_CONFIG = {
  MAX_FLOORS: 100,
  CHECKPOINT_INTERVAL: 10,
  BOSS_FLOOR_INTERVAL: 10,
  DIFFICULTY_SCALING_RATE: 0.1,
  REWARD_MULTIPLIER_PER_FLOOR: 0.05
} as const

// 무한의 탑 설정
export const INFINITE_TOWER_CONFIG = {
  CHECKPOINT_INTERVAL: 10,
  BUFF_SHOP_INTERVAL: 5,
  REST_FLOOR_INTERVAL: 25,
  BOSS_FLOOR_INTERVAL: 10,
  SPECIAL_BOSS_INTERVAL: 50,
  MAX_FLOOR: 999,
  DIFFICULTY_SCALING: {
    HP_PER_FLOOR: 0.1,
    ATTACK_PER_FLOOR: 0.1,
    DEFENSE_PER_FLOOR: 0.05,
    SPEED_PER_FLOOR: 0.02,
    EXP_PER_FLOOR: 0.15,
    GOLD_PER_FLOOR: 0.2
  }
} as const

// 음성 입력 설정
export const VOICE_CONFIG = {
  MAX_RECORDING_TIME: 30000, // 30초
  SILENCE_THRESHOLD: 0.01,
  SILENCE_DURATION: 2000, // 2초
  SUPPORTED_LANGUAGES: ['ko-KR', 'en-US'],
  DEFAULT_LANGUAGE: 'ko-KR'
} as const

// 성취 시스템 설정
export const ACHIEVEMENT_CONFIG = {
  MAX_DAILY_ACHIEVEMENTS: 10,
  ACHIEVEMENT_NOTIFICATION_DURATION: 5000, // 5초
  REWARD_TYPES: ['gold', 'exp', 'item', 'energy'] as const
} as const

// 통계 및 데이터 분석 설정
export const STATS_CONFIG = {
  ACTIVITY_HISTORY_DAYS: 30, // 활동 기록 조회 일수
  TOP_ACTIVITIES_LIMIT: 10, // 상위 활동 표시 개수
  PERFORMANCE_TRACKING_DAYS: 7, // 성과 추적 일수
  STREAK_RESET_HOURS: 24 // 연속 기록 리셋 시간
} as const

// 인벤토리 설정
export const INVENTORY_CONFIG = {
  MAX_INVENTORY_SIZE: 100,
  MAX_STACK_SIZE: 99,
  AUTO_SORT_ENABLED: true,
  RARITY_COLORS: {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444'
  }
} as const

// 전투 시스템 설정
export const BATTLE_CONFIG = {
  MAX_PARTY_SIZE: 4,
  ATB_SPEED_MULTIPLIER: 100,
  CRITICAL_HIT_MULTIPLIER: 1.5,
  ELEMENTAL_ADVANTAGE_MULTIPLIER: 1.25,
  TURN_TIME_LIMIT: 30000, // 30초
  AUTO_BATTLE_SPEED: 2.0
} as const

// 하위 호환성을 위한 기존 GAME_CONFIG 유지
export const GAME_CONFIG = {
  ...USER_CONFIG,
  ...EXPERIENCE_CONFIG,
  ...ENERGY_CONFIG,
  ...TICKET_CONFIG
} as const

// 개발/프로덕션 환경별 설정
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableAnalytics: process.env.NODE_ENV === 'production'
} as const

// 전체 설정을 하나로 묶은 타입
export type GameConfig = typeof GAME_CONFIG
export type UIConfig = typeof UI_CONFIG
export type BattleConfig = typeof BATTLE_CONFIG
export type DungeonConfig = typeof DUNGEON_CONFIG
