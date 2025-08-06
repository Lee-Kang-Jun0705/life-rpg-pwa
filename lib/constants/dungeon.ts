// 던전 시스템 상수 정의

export const DUNGEON_CONFIG = {
  // 전투 관련
  NEXT_MONSTER_DELAY: 1000,
  BASE_ATTACK_INTERVAL: 1500,
  STAGE_TRANSITION_DELAY: 1000,
  MIN_DAMAGE: 1,
  
  // 레벨 요구사항
  LEVEL_REQUIREMENTS: {
    normal: 0,
    elite: 20,
    boss: 30,
    infinite: 50
  } as const,
  
  // 던전 정보
  DUNGEON_INFO: {
    normal: {
      name: '일반 던전',
      description: '레벨 1-50 몬스터 • 기본 보상',
      monsterLevelRange: [1, 50] as [number, number],
      goldMultiplier: 1,
      itemDropMultiplier: 1
    },
    elite: {
      name: '정예 던전',
      description: '레벨 20-70 몬스터 • 레벨 20 필요',
      monsterLevelRange: [20, 70] as [number, number],
      goldMultiplier: 1.5,
      itemDropMultiplier: 1.3
    },
    boss: {
      name: '보스 던전',
      description: '레벨 30-100 몬스터 • 레벨 30 필요',
      monsterLevelRange: [30, 100] as [number, number],
      goldMultiplier: 2,
      itemDropMultiplier: 1.5
    },
    infinite: {
      name: '무한 던전',
      description: '끝없는 도전 • 레벨 50 필요',
      monsterLevelRange: [1, 999] as [number, number],
      goldMultiplier: 1 + (0.1 * Math.floor(Date.now() / 1000)), // 스테이지에 따라 증가
      itemDropMultiplier: 1 + (0.05 * Math.floor(Date.now() / 1000))
    }
  } as const,
  
  // 스피드 설정
  SPEED_OPTIONS: [1, 2, 3] as const,
  DEFAULT_SPEED: 1 as const,
  
  // 사용자 설정
  DEFAULT_USER_ID: 'default-user' as const
} as const

// 던전 스타일 설정
export const DUNGEON_STYLES = {
  normal: {
    gradient: 'from-green-600/20 to-green-700/20',
    border: 'border-green-500/30',
    hoverBorder: 'hover:border-green-400',
    textColor: 'text-green-300'
  },
  elite: {
    gradient: 'from-blue-600/20 to-blue-700/20',
    border: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400',
    textColor: 'text-blue-300'
  },
  boss: {
    gradient: 'from-purple-600/20 to-purple-700/20',
    border: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-400',
    textColor: 'text-purple-300'
  },
  infinite: {
    gradient: 'from-red-600/20 to-red-700/20',
    border: 'border-red-500/30',
    hoverBorder: 'hover:border-red-400',
    textColor: 'text-red-300'
  }
} as const

// 스탯 아이콘 및 색상
export const STAT_DISPLAY = {
  health: {
    icon: '💪',
    name: '건강',
    color: 'text-red-400',
    bonusText: (level: number) => `체력 +${level * 20}, 방어력 +${level * 3}`
  },
  learning: {
    icon: '📚',
    name: '학습',
    color: 'text-blue-400',
    bonusText: (level: number) => `공격력 +${level * 5}, 치명타 +${(level * 0.5).toFixed(1)}%`
  },
  relationship: {
    icon: '👥',
    name: '관계',
    color: 'text-green-400',
    bonusText: (level: number) => `공격속도 +${level * 2}%, 회피 +${(level * 0.3).toFixed(1)}%`
  },
  achievement: {
    icon: '🏆',
    name: '성취',
    color: 'text-yellow-400',
    bonusText: (level: number) => `치명타 데미지 +${level}%, 관통력 +${(level * 0.5).toFixed(1)}%`
  }
} as const

// 전투 스탯 표시 설정
export const BATTLE_STAT_DISPLAY = [
  { key: 'maxHealth', icon: '❤️', name: '체력', color: 'text-red-400', format: (v: number) => v.toLocaleString() },
  { key: 'attack', icon: '⚔️', name: '공격력', color: 'text-orange-400', format: (v: number) => v.toString() },
  { key: 'defense', icon: '🛡️', name: '방어력', color: 'text-blue-400', format: (v: number) => v.toString() },
  { key: 'attackSpeed', icon: '⚡', name: '공격속도', color: 'text-yellow-400', format: (v: number) => `${v}%` },
  { key: 'criticalChance', icon: '💥', name: '치명타', color: 'text-purple-400', format: (v: number) => `${v.toFixed(1)}%` },
  { key: 'evasion', icon: '🌀', name: '회피', color: 'text-green-400', format: (v: number) => `${v.toFixed(1)}%` }
] as const

// 디버그 설정
export const DEBUG_CONFIG = {
  ENABLE_LOGS: process.env.NODE_ENV === 'development',
  LOG_BATTLE_EVENTS: false,
  LOG_MONSTER_SPAWN: false
} as const