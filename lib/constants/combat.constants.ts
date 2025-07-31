/**
 * 전투 시스템 상수 정의
 * 전투 계산, AI, 보상 등
 */

// 전투 기본 설정
export const COMBAT_CONFIG = {
  // 턴 설정
  turnDuration: 1000, // 1초로 단축
  maxTurns: 100,
  speedTicksPerTurn: 1000, // 속도 1당 필요한 틱
  
  // 기본 확률
  baseCritRate: 0.05, // 5%
  baseDodgeRate: 0.05, // 5%
  baseAccuracy: 0.95, // 95%
  
  // 한계값
  maxCritRate: 0.5, // 50%
  maxDodgeRate: 0.3, // 30%
  maxAccuracy: 1.0, // 100%
  minAccuracy: 0.5, // 50%
  
  // 데미지 계산
  minDamage: 1,
  damageVariance: 0.1, // ±10%
  defenseEffectiveness: 0.5, // 방어력 1당 0.5 데미지 감소
  
  // 치명타
  baseCritDamage: 1.5,
  maxCritDamage: 3.0,
} as const

// 전투 페이즈 설정
export const COMBAT_PHASE_CONFIG = {
  preparation: {
    duration: 500, // 0.5초로 단축 (바로 시작)
    allowActions: false,
    description: '전투 준비 중...',
  },
  battle: {
    duration: null, // 무제한
    allowActions: true,
    description: '전투 진행 중',
  },
  victory: {
    duration: 5000, // 5초
    allowActions: false,
    description: '승리!',
  },
  defeat: {
    duration: 3000, // 3초
    allowActions: false,
    description: '패배...',
  },
  escaped: {
    duration: 2000, // 2초
    allowActions: false,
    description: '도망쳤다!',
  },
} as const

// AI 행동 패턴
export const AI_BEHAVIOR_PATTERNS = {
  aggressive: {
    attackWeight: 0.7,
    skillWeight: 0.2,
    defendWeight: 0.05,
    itemWeight: 0.05,
    targetPriority: 'lowest_hp',
    skillUsageThreshold: 0.8, // MP 80% 이상일 때 스킬 사용
  },
  defensive: {
    attackWeight: 0.3,
    skillWeight: 0.2,
    defendWeight: 0.4,
    itemWeight: 0.1,
    targetPriority: 'highest_damage',
    skillUsageThreshold: 0.5,
  },
  balanced: {
    attackWeight: 0.5,
    skillWeight: 0.3,
    defendWeight: 0.15,
    itemWeight: 0.05,
    targetPriority: 'random',
    skillUsageThreshold: 0.6,
  },
  support: {
    attackWeight: 0.2,
    skillWeight: 0.5,
    defendWeight: 0.2,
    itemWeight: 0.1,
    targetPriority: 'lowest_hp',
    skillUsageThreshold: 0.7,
  },
  boss: {
    attackWeight: 0.4,
    skillWeight: 0.5,
    defendWeight: 0.05,
    itemWeight: 0.05,
    targetPriority: 'highest_damage',
    skillUsageThreshold: 0.9,
  },
} as const

// 보스 페이즈 전환
export const BOSS_PHASE_CONFIG = {
  phase1: {
    hpThreshold: 1.0, // 100%
    damageMultiplier: 1,
    defenseMultiplier: 1,
    speedMultiplier: 1,
    pattern: 'normal',
  },
  phase2: {
    hpThreshold: 0.75, // 75%
    damageMultiplier: 1.2,
    defenseMultiplier: 0.9,
    speedMultiplier: 1.1,
    pattern: 'aggressive',
  },
  phase3: {
    hpThreshold: 0.5, // 50%
    damageMultiplier: 1.5,
    defenseMultiplier: 0.8,
    speedMultiplier: 1.3,
    pattern: 'berserk',
  },
  phase4: {
    hpThreshold: 0.25, // 25%
    damageMultiplier: 2,
    defenseMultiplier: 0.5,
    speedMultiplier: 1.5,
    pattern: 'desperate',
  },
} as const

// 전투 보상 설정
export const COMBAT_REWARD_CONFIG = {
  // 기본 보상 계산
  baseExpFormula: {
    base: 100,
    levelMultiplier: 10,
    difficultyMultiplier: {
      easy: 0.8,
      normal: 1,
      hard: 1.5,
      nightmare: 2,
    },
  },
  
  baseGoldFormula: {
    base: 50,
    levelMultiplier: 5,
    randomRange: { min: 0.8, max: 1.2 },
  },
  
  // 보너스 보상
  bonuses: {
    perfectVictory: { exp: 1.5, gold: 1.5 }, // 무피해
    speedBonus: { exp: 1.2, gold: 1.2 }, // 빠른 처치
    overkill: { exp: 1.3, gold: 1.1 }, // 오버킬
    combo: { exp: 1.1, gold: 1.1 }, // 높은 콤보
    firstTime: { exp: 2, gold: 2 }, // 첫 클리어
  },
  
  // 드롭 설정
  itemDropChance: {
    common: 0.3,
    elite: 0.5,
    boss: 0.8,
    legendary: 1,
  },
} as const

// 환경 효과
export const ENVIRONMENT_EFFECTS = {
  terrain: {
    plains: {
      name: '평원',
      effects: [],
      description: '특별한 효과 없음',
    },
    forest: {
      name: '숲',
      effects: [
        { stat: 'dodge', value: 0.1 },
        { stat: 'accuracy', value: -0.05 },
      ],
      description: '회피율 +10%, 명중률 -5%',
    },
    mountain: {
      name: '산악',
      effects: [
        { stat: 'defense', value: 0.2 },
        { stat: 'speed', value: -0.1 },
      ],
      description: '방어력 +20%, 속도 -10%',
    },
    water: {
      name: '수중',
      effects: [
        { stat: 'speed', value: -0.2 },
        { element: 'lightning', value: 1.5 },
      ],
      description: '속도 -20%, 전기 데미지 +50%',
    },
    lava: {
      name: '용암',
      effects: [
        { element: 'fire', value: -0.3 },
        { dot: 'burn', value: 0.02 },
      ],
      description: '화염 저항 -30%, 지속 화상',
    },
    ice: {
      name: '빙판',
      effects: [
        { stat: 'dodge', value: -0.1 },
        { element: 'ice', value: -0.2 },
      ],
      description: '회피율 -10%, 빙결 저항 -20%',
    },
  },
  
  weather: {
    clear: {
      name: '맑음',
      effects: [],
      description: '특별한 효과 없음',
    },
    rain: {
      name: '비',
      effects: [
        { element: 'fire', value: -0.2 },
        { element: 'lightning', value: 0.2 },
      ],
      description: '화염 데미지 -20%, 전기 데미지 +20%',
    },
    storm: {
      name: '폭풍',
      effects: [
        { stat: 'accuracy', value: -0.1 },
        { element: 'lightning', value: 0.5 },
      ],
      description: '명중률 -10%, 전기 데미지 +50%',
    },
    snow: {
      name: '눈',
      effects: [
        { stat: 'speed', value: -0.15 },
        { element: 'ice', value: 0.3 },
      ],
      description: '속도 -15%, 빙결 데미지 +30%',
    },
    fog: {
      name: '안개',
      effects: [
        { stat: 'accuracy', value: -0.2 },
        { stat: 'dodge', value: 0.15 },
      ],
      description: '명중률 -20%, 회피율 +15%',
    },
  },
} as const

// 전투 로그 설정
export const COMBAT_LOG_CONFIG = {
  maxLogs: 100,
  
  // 로그 타입별 색상
  colors: {
    damage: 'red',
    heal: 'green',
    buff: 'blue',
    debuff: 'purple',
    critical: 'orange',
    dodge: 'gray',
    skill: 'cyan',
    item: 'yellow',
    system: 'white',
  },
  
  // 로그 포맷
  formats: {
    damage: '[{actor}]이(가) [{target}]에게 {amount} 피해!',
    critical: '치명타! [{actor}]이(가) [{target}]에게 {amount} 피해!',
    heal: '[{actor}]이(가) [{target}]을(를) {amount} 회복!',
    dodge: '[{target}]이(가) 공격을 회피!',
    buff: '[{actor}]이(가) [{target}]에게 {effect} 부여!',
    debuff: '[{actor}]이(가) [{target}]에게 {effect} 부여!',
    skill: '[{actor}]이(가) {skill} 사용!',
    item: '[{actor}]이(가) {item} 사용!',
  },
} as const

// 도망 설정
export const ESCAPE_CONFIG = {
  baseChance: 0.5, // 50%
  speedBonus: 0.002, // 속도 1당 0.2% 증가
  levelPenalty: 0.05, // 레벨 차이 1당 5% 감소
  maxAttempts: 3,
  cooldown: 5000, // 5초
} as const

// 콤보 데미지 계산
export const COMBO_DAMAGE_CONFIG = {
  baseMultiplier: 1,
  increasePerHit: 0.05, // 5% 증가
  maxMultiplier: 2, // 최대 2배
  resetTime: 3000, // 3초
} as const

// 전투 애니메이션 타이밍
export const COMBAT_ANIMATION_TIMING = {
  attackDelay: 200,
  skillCastTime: 500,
  damageNumberDuration: 1000,
  statusEffectDuration: 2000,
  deathAnimation: 1500,
  victoryAnimation: 3000,
} as const