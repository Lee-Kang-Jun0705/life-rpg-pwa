/**
 * 스킬 시스템 상수 정의
 * 스킬 효과, 쿨다운, 데미지 계산 등
 */

// 스킬 카테고리별 기본값
export const SKILL_CATEGORY_DEFAULTS = {
  attack: {
    baseManaCost: 10,
    baseCooldown: 5,
    baseDamageMultiplier: 1.5,
    color: 'red',
    icon: '⚔️',
  },
  defense: {
    baseManaCost: 15,
    baseCooldown: 10,
    baseDamageMultiplier: 0,
    color: 'blue',
    icon: '🛡️',
  },
  support: {
    baseManaCost: 20,
    baseCooldown: 15,
    baseDamageMultiplier: 0,
    color: 'green',
    icon: '💚',
  },
  special: {
    baseManaCost: 50,
    baseCooldown: 30,
    baseDamageMultiplier: 3,
    color: 'purple',
    icon: '✨',
  },
} as const

// 스킬 레벨업 설정
export const SKILL_LEVEL_CONFIG = {
  maxLevel: 10,
  expRequiredBase: 100,
  expMultiplier: 1.5,
  
  // 레벨별 보너스
  damagePerLevel: 0.1, // 10% 증가
  cooldownReductionPerLevel: 0.05, // 5% 감소
  manaCostReductionPerLevel: 0.03, // 3% 감소
  rangeIncreasePerLevel: 0.1, // 10% 증가
} as const

// 원소 상성 테이블
export const ELEMENT_EFFECTIVENESS = {
  physical: {
    physical: 1,
    fire: 1,
    ice: 1,
    lightning: 1,
    nature: 1,
    holy: 0.8,
    dark: 1.2,
    neutral: 1,
  },
  fire: {
    physical: 1,
    fire: 0.5,
    ice: 2,
    lightning: 1,
    nature: 1.5,
    holy: 1,
    dark: 1,
    neutral: 1,
  },
  ice: {
    physical: 1,
    fire: 0.5,
    ice: 0.5,
    lightning: 1.5,
    nature: 1,
    holy: 1,
    dark: 1,
    neutral: 1,
  },
  lightning: {
    physical: 1,
    fire: 1,
    ice: 1,
    lightning: 0.5,
    nature: 0.5,
    holy: 1,
    dark: 1.5,
    neutral: 1,
  },
  nature: {
    physical: 1,
    fire: 0.5,
    ice: 1.5,
    lightning: 2,
    nature: 0.5,
    holy: 1.5,
    dark: 0.5,
    neutral: 1,
  },
  holy: {
    physical: 1.2,
    fire: 1,
    ice: 1,
    lightning: 1,
    nature: 0.5,
    holy: 0.5,
    dark: 2,
    neutral: 1,
  },
  dark: {
    physical: 0.8,
    fire: 1,
    ice: 1,
    lightning: 0.5,
    nature: 1.5,
    holy: 0.5,
    dark: 0.5,
    neutral: 1,
  },
  neutral: {
    physical: 1,
    fire: 1,
    ice: 1,
    lightning: 1,
    nature: 1,
    holy: 1,
    dark: 1,
    neutral: 1,
  },
} as const

// 스킬 이펙트 설정
export const SKILL_EFFECT_CONFIG = {
  // 데미지 타입별 설정
  damage: {
    baseVariance: 0.1, // ±10% 변동
    criticalMultiplier: 2,
    comboMultiplier: 0.1, // 콤보당 10% 증가
    maxComboBonus: 1, // 최대 100% 추가
  },
  
  // 상태이상 지속시간
  statusDuration: {
    stun: 2,
    silence: 3,
    slow: 5,
    poison: 10,
    burn: 5,
    freeze: 3,
    blind: 4,
    curse: 6,
  },
  
  // 상태이상 기본값
  statusValues: {
    poison: 0.05, // 최대 HP의 5%
    burn: 0.03, // 최대 HP의 3%
    slow: 0.3, // 30% 감속
    weakness: 0.2, // 20% 공격력 감소
    defenseDown: 0.2, // 20% 방어력 감소
  },
} as const

// 콤보 시스템 설정
export const COMBO_CONFIG = {
  timeWindow: 3000, // 3초
  maxComboCount: 10,
  
  // 콤보 보너스
  damageBonus: 0.1, // 콤보당 10%
  critBonus: 0.02, // 콤보당 2%
  
  // 특수 콤보
  specialCombos: {
    tripleStrike: {
      sequence: ['strike', 'strike', 'strike'],
      bonus: { damage: 0.5, stun: 0.3 },
    },
    elementalBurst: {
      sequence: ['fire', 'ice', 'lightning'],
      bonus: { damage: 1, aoe: true },
    },
    defensiveCounter: {
      sequence: ['defend', 'defend', 'strike'],
      bonus: { damage: 0.3, reflect: 0.5 },
    },
  },
} as const

// 스킬 애니메이션 설정
export const SKILL_ANIMATION_CONFIG = {
  // 기본 애니메이션 시간 (ms)
  durations: {
    instant: 200,
    fast: 500,
    normal: 1000,
    slow: 1500,
    channel: 3000,
  },
  
  // 이펙트 이모지
  effects: {
    // 공격
    slash: '⚔️',
    stab: '🗡️',
    smash: '🔨',
    shoot: '🏹',
    
    // 마법
    fireball: '🔥',
    iceShard: '❄️',
    lightning: '⚡',
    poison: '☠️',
    
    // 방어
    block: '🛡️',
    dodge: '💨',
    parry: '🤺',
    
    // 버프/디버프
    buff: '⬆️',
    debuff: '⬇️',
    heal: '💚',
    shield: '🛡️',
    
    // 특수
    critical: '💥',
    miss: '❌',
    resist: '🚫',
  },
} as const

// 스킬 타겟팅 설정
export const TARGETING_CONFIG = {
  // 범위 기본값 (타일 단위)
  ranges: {
    melee: 1,
    ranged: 4,
    magic: 3,
    global: 999,
  },
  
  // AOE 범위
  areaOfEffect: {
    small: 1, // 3x3
    medium: 2, // 5x5
    large: 3, // 7x7
  },
  
  // 타겟 제한
  maxTargets: {
    single: 1,
    cleave: 3,
    aoe: 5,
    all: 999,
  },
} as const

// 스킬북 설정
export const SKILLBOOK_CONFIG = {
  // 드롭률
  dropRates: {
    common: 0.1,
    elite: 0.2,
    boss: 0.4,
    legendary: 0.8,
  },
  
  // 학습 비용
  learnCost: {
    gold: 1000,
    level: 10,
  },
  
  // 희귀도
  rarities: {
    basic: { color: 'gray', dropRate: 0.6 },
    advanced: { color: 'green', dropRate: 0.3 },
    expert: { color: 'blue', dropRate: 0.08 },
    master: { color: 'purple', dropRate: 0.019 },
    legendary: { color: 'orange', dropRate: 0.001 },
  },
} as const

// 스킬 시너지 보너스
export const SYNERGY_BONUS = {
  // 동일 원소 시너지
  sameElement: {
    2: 0.1, // 10% 보너스
    3: 0.2, // 20% 보너스
    4: 0.35, // 35% 보너스
  },
  
  // 콤보 시너지
  comboChain: {
    2: 0.15,
    3: 0.3,
    4: 0.5,
  },
  
  // 카테고리 시너지
  categoryMix: {
    attackDefense: 0.1, // 공수 균형
    supportSpecial: 0.15, // 서포트 특화
    allCategories: 0.25, // 올라운드
  },
} as const

// 스킬 쿨다운 감소 한계
export const COOLDOWN_REDUCTION_CAP = 0.5 // 최대 50% 감소

// 스킬 비용 감소 한계
export const COST_REDUCTION_CAP = 0.7 // 최대 70% 감소

// 스킬 이모지 매핑
export const SKILL_EMOJI_MAP = {
  // 공격 스킬
  powerStrike: '💥',
  multiSlash: '⚡',
  whirlwind: '🌪️',
  focusShot: '🎯',
  
  // 방어 스킬
  ironWall: '🛡️',
  counter: '🔄',
  dodge: '💨',
  regeneration: '💚',
  
  // 서포트 스킬
  berserk: '😡',
  focus: '🧘',
  haste: '🏃',
  luck: '🍀',
  
  // 특수 스킬
  timeStop: '⏱️',
  clone: '👥',
  storm: '🌀',
  lastStand: '⚔️',
} as const

// 스킬 설정
export const SKILL_CONFIG = {
  MAX_QUICK_SLOTS: 10,
  POINTS_PER_LEVEL: 1,
  MAX_SKILL_LEVEL: 10,
} as const