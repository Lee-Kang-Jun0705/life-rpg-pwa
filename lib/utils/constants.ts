// 애플리케이션 전체에서 사용되는 상수들

// 애니메이션 설정
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const

// 브레이크포인트
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// 색상 테마
export const THEME_COLORS = {
  PRIMARY: 'hsl(237, 97%, 64%)',
  SECONDARY: 'hsl(210, 40%, 96.1%)',
  SUCCESS: 'hsl(142, 76%, 36%)',
  WARNING: 'hsl(38, 92%, 50%)',
  ERROR: 'hsl(0, 84%, 60%)',
  INFO: 'hsl(199, 89%, 48%)',
} as const

// 스탯 색상
export const STAT_COLORS = {
  HEALTH: {
    START: '#FF6B6B',
    END: '#FFB6C1',
    HSL: 'hsl(0, 84%, 60%)',
  },
  LEARNING: {
    START: '#4ECDC4',
    END: '#87CEEB',
    HSL: 'hsl(217, 91%, 60%)',
  },
  RELATIONSHIP: {
    START: '#95E1D3',
    END: '#98FB98',
    HSL: 'hsl(158, 64%, 52%)',
  },
  ACHIEVEMENT: {
    START: '#FFD93D',
    END: '#FFEB9C',
    HSL: 'hsl(38, 92%, 50%)',
  },
} as const

// 게임 설정
export const GAME_CONFIG = {
  DEFAULT_USER_ID: 'current-user',
  MAX_LEVEL: 100,
  EXP_PER_LEVEL: 1000,
  DAILY_EXP_LIMIT: 5000,
  ENERGY_REGEN_TIME: 5 * 60 * 1000, // 5분
  MAX_ENERGY: 100,
} as const

// API 설정
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_SETTINGS: 'life-rpg-user-settings',
  THEME: 'life-rpg-theme',
  ACCESSIBILITY: 'life-rpg-accessibility',
  OFFLINE_DATA: 'life-rpg-offline-data',
  LAST_SYNC: 'life-rpg-last-sync',
} as const

// 데이터베이스 설정
export const DB_CONFIG = {
  NAME: 'LifeRPGDB',
  VERSION: 1,
  BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24시간
  MAX_BACKUP_FILES: 7,
} as const

// 폼 검증 설정
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_NAME_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

// 알림 설정
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000,
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 7000,
  MAX_NOTIFICATIONS: 5,
} as const

// 성능 설정
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  VIRTUAL_LIST_ITEM_HEIGHT: 60,
  IMAGE_LAZY_LOAD_THRESHOLD: 100,
} as const

// 접근성 설정
export const ACCESSIBILITY_CONFIG = {
  FOCUS_VISIBLE_OUTLINE_WIDTH: 2,
  SKIP_LINK_HEIGHT: 44,
  MIN_TOUCH_TARGET_SIZE: 44,
  HIGH_CONTRAST_RATIO: 7,
} as const

// 오프라인 설정
export const OFFLINE_CONFIG = {
  CACHE_VERSION: 'v1',
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  SYNC_RETRY_DELAY: 30000, // 30초
  MAX_SYNC_RETRIES: 3,
} as const

// 개발/프로덕션 플래그
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const IS_CLIENT = typeof window !== 'undefined'
export const IS_SERVER = typeof window === 'undefined'