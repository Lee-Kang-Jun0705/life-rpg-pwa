/**
 * 게임 상수 정의 파일
 * 
 * 코딩 규칙:
 * - any 타입 금지
 * - 하드코딩 금지 - 모든 상수는 이 파일에서 관리
 * - 네이밍 규칙 - 대문자 스네이크 케이스
 * - 불변성 - as const 사용
 */

// ===============================
// 1. 게임 시스템 상수
// ===============================

export const GAME_SYSTEM = {
  // 버전 정보
  VERSION: '1.0.0',
  BUILD: 'alpha',
  
  // 저장 관련
  SAVE_SLOTS: 3,
  AUTO_SAVE_INTERVAL: 60 * 1000, // 1분마다 자동 저장
  
  // 세션 관리
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30분 세션 타임아웃
  IDLE_WARNING_TIME: 25 * 60 * 1000, // 25분 후 경고
  
  // 성능 설정
  MAX_PARTICLES: 100,
  MAX_SOUND_INSTANCES: 10,
  ANIMATION_FPS: 60
} as const

// ===============================
// 2. UI/UX 상수
// ===============================

export const UI_CONSTANTS = {
  // 애니메이션 지속 시간 (ms)
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000
  },
  
  // 토스트 메시지
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000
  },
  
  // 모달 설정
  MODAL_Z_INDEX: {
    BASE: 1000,
    OVERLAY: 999,
    ALERT: 2000,
    CRITICAL: 3000
  },
  
  // 색상 테마
  COLORS: {
    // 희귀도 색상
    RARITY: {
      COMMON: '#9CA3AF',    // gray-400
      UNCOMMON: '#10B981',  // green-500
      RARE: '#3B82F6',      // blue-500
      EPIC: '#A855F7',      // purple-500
      LEGENDARY: '#F59E0B'  // amber-500
    },
    
    // 스탯 색상
    STATS: {
      HP: '#EF4444',        // red-500
      MP: '#3B82F6',        // blue-500
      STRENGTH: '#F59E0B',  // amber-500
      INTELLIGENCE: '#A855F7', // purple-500
      AGILITY: '#10B981',   // green-500
      VITALITY: '#EC4899'   // pink-500
    },
    
    // 상태 색상
    STATUS: {
      SUCCESS: '#10B981',   // green-500
      WARNING: '#F59E0B',   // amber-500
      ERROR: '#EF4444',     // red-500
      INFO: '#3B82F6'       // blue-500
    }
  }
} as const

// ===============================
// 3. 게임 플레이 상수
// ===============================

export const GAMEPLAY = {
  // 인벤토리
  INVENTORY: {
    MAX_SLOTS: 50,
    STACK_SIZE: 99,
    EQUIPMENT_SLOTS: ['weapon', 'armor', 'accessory1', 'accessory2'] as const
  },
  
  // 전투
  BATTLE: {
    MAX_PARTY_SIZE: 1,      // 싱글 플레이어
    MAX_ENEMIES: 3,         // 최대 적 수
    TURN_TIME_LIMIT: 30,    // 턴당 30초 제한
    ESCAPE_CHANCE: 0.5      // 도망 성공률 50%
  },
  
  // 스킬
  SKILLS: {
    MAX_ACTIVE: 4,          // 액티브 스킬 최대 4개
    MAX_PASSIVE: 3,         // 패시브 스킬 최대 3개
    COOLDOWN_TICK: 1000     // 쿨다운 업데이트 주기 (1초)
  },
  
  // 일일 제한
  DAILY_LIMITS: {
    DUNGEON_ENTRIES: 10,    // 던전 입장 횟수
    SHOP_REFRESH: 1,        // 상점 새로고침
    FREE_REVIVAL: 1         // 무료 부활
  }
} as const

// ===============================
// 4. 리소스 경로
// ===============================

export const RESOURCES = {
  // 이미지 경로
  IMAGES: {
    CHARACTERS: '/images/characters/',
    MONSTERS: '/images/monsters/',
    ITEMS: '/images/items/',
    SKILLS: '/images/skills/',
    UI: '/images/ui/',
    BACKGROUNDS: '/images/backgrounds/'
  },
  
  // 사운드 경로
  SOUNDS: {
    BGM: '/sounds/bgm/',
    SFX: '/sounds/sfx/',
    VOICE: '/sounds/voice/'
  },
  
  // 데이터 경로
  DATA: {
    MONSTERS: '/data/monsters.json',
    ITEMS: '/data/items.json',
    SKILLS: '/data/skills.json',
    DUNGEONS: '/data/dungeons.json'
  }
} as const

// ===============================
// 5. 로컬 스토리지 키
// ===============================

export const STORAGE_KEYS = {
  // 게임 데이터
  SAVE_DATA: 'life_rpg_save',
  SAVE_SLOTS: 'life_rpg_save_slots',
  SAVE_BACKUP: 'life_rpg_save_backup',
  SETTINGS: 'life_rpg_settings',
  
  // 캐릭터 데이터
  CHARACTER_DATA: 'life_rpg_character',
  CHARACTER_LEVEL: 'life_rpg_character_level',
  
  // 진행도
  DUNGEON_PROGRESS: 'life_rpg_dungeon_progress',
  QUEST_PROGRESS: 'life_rpg_quest_progress',
  ACHIEVEMENT_PROGRESS: 'life_rpg_achievements',
  
  // 임시 데이터
  BATTLE_STATE: 'life_rpg_battle_state',
  SHOP_STATE: 'life_rpg_shop_state',
  
  // 시스템 데이터
  SKILLS: 'life_rpg_skills',
  INVENTORY: 'life_rpg_inventory',
  
  // 설정
  AUDIO_SETTINGS: 'life_rpg_audio',
  DISPLAY_SETTINGS: 'life_rpg_display',
  GAMEPLAY_SETTINGS: 'life_rpg_gameplay'
} as const

// ===============================
// 6. 이벤트 이름
// ===============================

export const GAME_EVENTS = {
  // 시스템 이벤트
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  GAME_SAVED: 'game:saved',
  GAME_LOADED: 'game:loaded',
  
  // 캐릭터 이벤트
  LEVEL_UP: 'character:levelup',
  STATS_UPDATED: 'character:stats-updated',
  EQUIPMENT_CHANGED: 'character:equipment-changed',
  SKILL_LEARNED: 'character:skill-learned',
  
  // 전투 이벤트
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',
  TURN_START: 'turn:start',
  TURN_END: 'turn:end',
  DAMAGE_DEALT: 'battle:damage',
  HEALING_DONE: 'battle:heal',
  STATUS_APPLIED: 'battle:status',
  
  // UI 이벤트
  MODAL_OPEN: 'ui:modal-open',
  MODAL_CLOSE: 'ui:modal-close',
  TAB_CHANGED: 'ui:tab-changed',
  NOTIFICATION_SHOW: 'ui:notification',
  
  // 게임 상태 이벤트
  STATE_CHANGED: 'game-state-changed',
  INVENTORY_UPDATED: 'inventory:updated',
  SHOP_REFRESHED: 'shop:refreshed',
  DUNGEON_ENTERED: 'dungeon:entered',
  DUNGEON_COMPLETED: 'dungeon:completed'
} as const

// ===============================
// 7. 에러 코드
// ===============================

export const ERROR_CODES = {
  // 시스템 에러
  SYSTEM_ERROR: 'SYS_001',
  NETWORK_ERROR: 'NET_001',
  STORAGE_FULL: 'STO_001',
  
  // 게임 플레이 에러
  INSUFFICIENT_GOLD: 'GAME_001',
  INSUFFICIENT_LEVEL: 'GAME_002',
  INVENTORY_FULL: 'GAME_003',
  SKILL_ON_COOLDOWN: 'GAME_004',
  INVALID_TARGET: 'GAME_005',
  
  // 전투 에러
  BATTLE_NOT_STARTED: 'BTL_001',
  INVALID_ACTION: 'BTL_002',
  TURN_TIMEOUT: 'BTL_003',
  
  // 검증 에러
  INVALID_ITEM: 'VAL_001',
  INVALID_SKILL: 'VAL_002',
  INVALID_DUNGEON: 'VAL_003'
} as const

// ===============================
// 8. 정규 표현식
// ===============================

export const REGEX_PATTERNS = {
  // ID 패턴
  ITEM_ID: /^item_[a-z0-9_]+$/,
  SKILL_ID: /^skill_[a-z0-9_]+$/,
  MONSTER_ID: /^monster_[a-z0-9_]+$/,
  DUNGEON_ID: /^dungeon_[a-z0-9_]+$/,
  
  // 이름 패턴
  CHARACTER_NAME: /^[a-zA-Z0-9가-힣]{2,12}$/,
  
  // 숫자 패턴
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  PERCENTAGE: /^(100|[1-9]?\d)$/
} as const

// ===============================
// 9. 기본값
// ===============================

export const DEFAULT_VALUES = {
  // 캐릭터 기본값
  CHARACTER: {
    NAME: 'Player',
    LEVEL: 1,
    GOLD: 0,
    STATS: {
      strength: 1,
      intelligence: 1,
      agility: 1,
      vitality: 1
    }
  },
  
  // 설정 기본값
  SETTINGS: {
    AUDIO: {
      masterVolume: 0.7,
      bgmVolume: 0.5,
      sfxVolume: 0.8,
      muted: false
    },
    DISPLAY: {
      particleEffects: true,
      damageNumbers: true,
      autoSave: true,
      language: 'ko'
    },
    GAMEPLAY: {
      autoBattle: false,
      skipAnimations: false,
      confirmActions: true
    }
  }
} as const

// ===============================
// 10. 타입 가드 함수들
// ===============================

/**
 * 유효한 아이템 ID인지 확인
 */
export function isValidItemId(id: string): boolean {
  return REGEX_PATTERNS.ITEM_ID.test(id)
}

/**
 * 유효한 스킬 ID인지 확인
 */
export function isValidSkillId(id: string): boolean {
  return REGEX_PATTERNS.SKILL_ID.test(id)
}

/**
 * 유효한 몬스터 ID인지 확인
 */
export function isValidMonsterId(id: string): boolean {
  return REGEX_PATTERNS.MONSTER_ID.test(id)
}

/**
 * 유효한 던전 ID인지 확인
 */
export function isValidDungeonId(id: string): boolean {
  return REGEX_PATTERNS.DUNGEON_ID.test(id)
}

/**
 * 유효한 캐릭터 이름인지 확인
 */
export function isValidCharacterName(name: string): boolean {
  return REGEX_PATTERNS.CHARACTER_NAME.test(name)
}

// 전체 상수 export
export const CONSTANTS = {
  SYSTEM: GAME_SYSTEM,
  UI: UI_CONSTANTS,
  GAMEPLAY,
  RESOURCES,
  STORAGE: STORAGE_KEYS,
  EVENTS: GAME_EVENTS,
  ERRORS: ERROR_CODES,
  REGEX: REGEX_PATTERNS,
  DEFAULTS: DEFAULT_VALUES
} as const