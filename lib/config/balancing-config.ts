/**
 * 게임 밸런싱 설정 파일
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 모든 수치는 이 파일에서 관리
 * - 주석 필수 - 각 수치의 의미와 영향 설명
 * - 불변성 - 모든 설정은 readonly
 */

import { Difficulty } from '@/lib/jrpg/types'

// ===============================
// 1. 캐릭터 관련 설정
// ===============================

export const CHARACTER_CONFIG = {
  // 기본 스탯
  BASE_STATS: {
    HP: 100,
    MP: 50,
    ATTACK: 10,
    DEFENSE: 10,
    SPEED: 10,
    MAGIC_POWER: 10,
    MAGIC_RESIST: 10
  },
  
  // 레벨당 스탯 증가량
  STATS_PER_LEVEL: {
    HP: 20,          // 레벨당 HP +20
    MP: 10,          // 레벨당 MP +10
    ATTACK: 2,       // 레벨당 공격력 +2
    DEFENSE: 2,      // 레벨당 방어력 +2
    SPEED: 1,        // 레벨당 속도 +1
    MAGIC_POWER: 2,  // 레벨당 마법력 +2
    MAGIC_RESIST: 1  // 레벨당 마법저항 +1
  },
  
  // 스탯별 성장 계수 (대시보드 스탯에 따른 보너스)
  STAT_GROWTH_MULTIPLIERS: {
    STRENGTH: {
      HP: 0.3,       // 힘 1당 HP +30%
      ATTACK: 0.5    // 힘 1당 공격력 +50%
    },
    INTELLIGENCE: {
      MP: 0.5,          // 지능 1당 MP +50%
      MAGIC_POWER: 0.5  // 지능 1당 마법력 +50%
    },
    AGILITY: {
      SPEED: 0.5,       // 민첩 1당 속도 +50%
      CRITICAL_RATE: 0.002 // 민첩 1당 크리티컬 확률 +0.2%
    },
    VITALITY: {
      HP: 0.5,          // 체력 1당 HP +50%
      DEFENSE: 0.3,     // 체력 1당 방어력 +30%
      MAGIC_RESIST: 0.3 // 체력 1당 마법저항 +30%
    }
  },
  
  // 최대값 제한
  MAX_LEVEL: 200,
  MAX_STATS: {
    HP: 99999,
    MP: 9999,
    ATTACK: 9999,
    DEFENSE: 9999,
    SPEED: 999,
    MAGIC_POWER: 9999,
    MAGIC_RESIST: 9999
  }
} as const

// ===============================
// 2. 전투 관련 설정
// ===============================

export const BATTLE_CONFIG = {
  // 기본 데미지 공식
  DAMAGE_FORMULA: {
    PHYSICAL: {
      BASE_MULTIPLIER: 2.0,     // 기본 배수
      DEFENSE_REDUCTION: 0.5,   // 방어력 감소율
      RANDOM_VARIANCE: 0.1      // ±10% 랜덤 편차
    },
    MAGICAL: {
      BASE_MULTIPLIER: 2.5,     // 마법은 물리보다 강하지만
      RESIST_REDUCTION: 0.6,    // 저항 감소가 더 큼
      RANDOM_VARIANCE: 0.15     // ±15% 랜덤 편차
    }
  },
  
  // 크리티컬 설정
  CRITICAL: {
    BASE_RATE: 0.05,           // 기본 5% 확률
    DAMAGE_MULTIPLIER: 2.0,    // 크리티컬 시 2배 데미지
    AGILITY_BONUS: 0.002       // 민첩 1당 +0.2% 확률
  },
  
  // 명중/회피 설정
  ACCURACY: {
    BASE_HIT_RATE: 0.95,       // 기본 95% 명중률
    SPEED_DIFFERENCE_FACTOR: 0.01, // 속도 차이 1당 ±1%
    MIN_HIT_RATE: 0.1,         // 최소 10% 명중률
    MAX_HIT_RATE: 1.0          // 최대 100% 명중률
  },
  
  // 상태이상 설정
  STATUS_EFFECTS: {
    POISON: {
      DAMAGE_PERCENT: 0.05,    // 매턴 최대 HP의 5% 데미지
      DURATION: 5              // 5턴 지속
    },
    BURN: {
      DAMAGE_PERCENT: 0.03,    // 매턴 최대 HP의 3% 데미지
      DURATION: 3              // 3턴 지속
    },
    FREEZE: {
      SKIP_TURN_CHANCE: 0.5,   // 50% 확률로 행동 불가
      DURATION: 2              // 2턴 지속
    },
    STUN: {
      SKIP_TURN_CHANCE: 1.0,   // 100% 행동 불가
      DURATION: 1              // 1턴 지속
    }
  },
  
  // 자동전투 설정
  AUTO_BATTLE: {
    ACTION_DELAY: 1000,        // 행동 간 딜레이 (ms)
    SKILL_USE_CHANCE: 0.3,     // 30% 확률로 스킬 사용
    ITEM_USE_HP_THRESHOLD: 0.3, // HP 30% 이하일 때 회복 아이템 사용
    SMART_TARGET_PRIORITY: [   // 타겟 우선순위
      'lowest_hp',             // 1. HP가 가장 낮은 적
      'highest_damage',        // 2. 데미지가 가장 높은 적
      'status_vulnerable'      // 3. 상태이상에 약한 적
    ]
  }
} as const

// ===============================
// 3. 몬스터 스케일링 설정
// ===============================

export const MONSTER_SCALING = {
  // 던전 레벨에 따른 몬스터 강화
  DUNGEON_LEVEL_MULTIPLIER: {
    HP: 0.1,          // 던전 레벨당 HP +10%
    STATS: 0.05       // 던전 레벨당 기타 스탯 +5%
  },
  
  // 층수에 따른 몬스터 강화
  FLOOR_MULTIPLIER: {
    HP: 0.05,         // 층당 HP +5%
    STATS: 0.03,      // 층당 기타 스탯 +3%
    GOLD: 0.1,        // 층당 골드 +10%
    EXP: 0.1          // 층당 경험치 +10%
  },
  
  // 난이도별 배수
  DIFFICULTY_MULTIPLIERS: {
    [Difficulty.EASY]: {
      HP: 0.7,
      STATS: 0.7,
      REWARDS: 0.7
    },
    [Difficulty.NORMAL]: {
      HP: 1.0,
      STATS: 1.0,
      REWARDS: 1.0
    },
    [Difficulty.HARD]: {
      HP: 1.5,
      STATS: 1.3,
      REWARDS: 1.5
    },
    [Difficulty.HELL]: {
      HP: 2.0,
      STATS: 1.8,
      REWARDS: 2.5
    }
  },
  
  // 보스 몬스터 배수
  BOSS_MULTIPLIERS: {
    HP: 5.0,          // 일반 몬스터 대비 5배 HP
    STATS: 2.0,       // 일반 몬스터 대비 2배 스탯
    REWARDS: 3.0      // 일반 몬스터 대비 3배 보상
  }
} as const

// ===============================
// 4. 아이템 및 장비 설정
// ===============================

export const ITEM_CONFIG = {
  // 장비 등급별 스탯 배수
  RARITY_MULTIPLIERS: {
    COMMON: 1.0,      // 일반
    UNCOMMON: 1.3,    // 고급
    RARE: 1.6,        // 희귀
    EPIC: 2.0,        // 영웅
    LEGENDARY: 2.5    // 전설
  },
  
  // 장비 강화 설정
  ENHANCEMENT: {
    MAX_LEVEL: 10,                // 최대 +10 강화
    STAT_INCREASE_PER_LEVEL: 0.1, // 강화당 10% 증가
    SUCCESS_RATES: [              // 강화 성공률
      1.0,   // +0 → +1: 100%
      0.9,   // +1 → +2: 90%
      0.8,   // +2 → +3: 80%
      0.7,   // +3 → +4: 70%
      0.6,   // +4 → +5: 60%
      0.5,   // +5 → +6: 50%
      0.4,   // +6 → +7: 40%
      0.3,   // +7 → +8: 30%
      0.2,   // +8 → +9: 20%
      0.1    // +9 → +10: 10%
    ],
    FAIL_PENALTY: {
      DOWNGRADE_CHANCE: 0.3,  // 실패 시 30% 확률로 강화도 감소
      DESTROY_CHANCE: 0.0     // 파괴 확률 없음 (너무 가혹함)
    }
  },
  
  // 아이템 드롭률
  DROP_RATES: {
    GOLD: 1.0,         // 100% 골드 드롭
    ITEM: 0.3,         // 30% 아이템 드롭
    RARE_ITEM: 0.05,   // 5% 희귀 아이템
    EPIC_ITEM: 0.01,   // 1% 영웅 아이템
    LEGENDARY_ITEM: 0.001 // 0.1% 전설 아이템
  }
} as const

// ===============================
// 5. 스킬 설정
// ===============================

export const SKILL_CONFIG = {
  // 스킬 레벨업 설정
  LEVELING: {
    MAX_LEVEL: 10,            // 최대 레벨 10
    USES_PER_LEVEL: 10,       // 레벨업당 필요 사용 횟수
    DAMAGE_INCREASE: 0.15,    // 레벨당 15% 데미지 증가
    COST_REDUCTION: 0.05,     // 레벨당 5% MP 소모 감소
    COOLDOWN_REDUCTION: 0.1   // 레벨당 10% 쿨다운 감소
  },
  
  // 스킬 장착 제한
  EQUIPMENT: {
    MAX_ACTIVE_SKILLS: 4,     // 최대 4개 액티브 스킬
    MAX_PASSIVE_SKILLS: 3,    // 최대 3개 패시브 스킬
    UNLOCK_LEVELS: [1, 5, 10, 15] // 스킬 슬롯 해금 레벨
  },
  
  // 스킬 타입별 기본값
  TYPE_DEFAULTS: {
    PHYSICAL: {
      MP_COST: 10,
      COOLDOWN: 2,
      POWER_MULTIPLIER: 1.5
    },
    MAGICAL: {
      MP_COST: 20,
      COOLDOWN: 3,
      POWER_MULTIPLIER: 2.0
    },
    HEALING: {
      MP_COST: 15,
      COOLDOWN: 4,
      HEAL_MULTIPLIER: 1.0
    },
    BUFF: {
      MP_COST: 30,
      COOLDOWN: 5,
      DURATION: 3
    }
  }
} as const

// ===============================
// 6. 상점 설정
// ===============================

export const SHOP_CONFIG = {
  // 가격 계산
  PRICING: {
    BASE_MULTIPLIER: 100,     // 아이템 레벨 × 100 = 기본 가격
    RARITY_MULTIPLIERS: {
      COMMON: 1.0,
      UNCOMMON: 2.0,
      RARE: 5.0,
      EPIC: 10.0,
      LEGENDARY: 25.0
    },
    SELL_RATIO: 0.5           // 판매가는 구매가의 50%
  },
  
  // 재고 관리
  INVENTORY: {
    REFRESH_INTERVAL: 24 * 60 * 60 * 1000, // 24시간마다 갱신
    ITEMS_PER_REFRESH: 12,    // 갱신당 12개 아이템
    LEVEL_RANGE: 5,           // 플레이어 레벨 ±5 범위
    GUARANTEED_SLOTS: {       // 보장 슬롯
      POTION: 2,              // 포션 2개 보장
      EQUIPMENT: 3,           // 장비 3개 보장
      SKILL_BOOK: 1           // 스킬북 1개 보장
    }
  }
} as const

// ===============================
// 7. 던전 설정
// ===============================

export const DUNGEON_CONFIG = {
  // 던전 진행 설정
  PROGRESSION: {
    FLOORS_PER_DUNGEON: 10,   // 던전당 10층
    BOSS_FLOORS: [5, 10],     // 5층과 10층에 보스
    REST_FLOORS: [3, 7],      // 3층과 7층에 휴식 지점
    MONSTERS_PER_FLOOR: {
      MIN: 1,
      MAX: 3
    }
  },
  
  // 던전 보상
  REWARDS: {
    FLOOR_CLEAR_GOLD: 100,    // 층 클리어 시 기본 골드
    BOSS_BONUS_MULTIPLIER: 5, // 보스 보너스 5배
    FIRST_CLEAR_BONUS: 2.0,   // 첫 클리어 2배 보너스
    SPEED_BONUS: {            // 스피드 보너스
      TIME_LIMIT: 60,         // 60초 이내 클리어
      MULTIPLIER: 1.5         // 1.5배 보너스
    }
  },
  
  // 던전 제한
  RESTRICTIONS: {
    DAILY_ENTRIES: 3,         // 일일 입장 횟수
    REVIVAL_LIMIT: 1,         // 부활 횟수
    TIME_LIMIT: 30 * 60       // 30분 제한시간 (초)
  }
} as const

// ===============================
// 8. 경험치 곡선
// ===============================

export const EXPERIENCE_CURVE = {
  // 레벨업 필요 경험치 공식
  // EXP = BASE * (LEVEL ^ EXPONENT) + LINEAR * LEVEL
  BASE: 100,
  EXPONENT: 1.5,
  LINEAR: 50,
  
  // 경험치 획득량
  SOURCES: {
    MONSTER_KILL: 10,         // 몬스터 처치
    BOSS_KILL: 100,           // 보스 처치
    QUEST_COMPLETE: 50,       // 퀘스트 완료
    DAILY_BONUS: 200,         // 일일 보너스
    ACHIEVEMENT: 100          // 업적 달성
  }
} as const

// ===============================
// 유틸리티 함수들
// ===============================

/**
 * 레벨업에 필요한 경험치 계산
 */
export function calculateRequiredExp(level: number): number {
  const { BASE, EXPONENT, LINEAR } = EXPERIENCE_CURVE
  return Math.floor(BASE * Math.pow(level, EXPONENT) + LINEAR * level)
}

/**
 * 물리 데미지 계산
 */
export function calculatePhysicalDamage(
  attackPower: number,
  defense: number,
  criticalHit = false
): number {
  const { BASE_MULTIPLIER, DEFENSE_REDUCTION, RANDOM_VARIANCE } = BATTLE_CONFIG.DAMAGE_FORMULA.PHYSICAL
  
  // 기본 데미지 = 공격력 * 배수 - 방어력 * 감소율
  let damage = attackPower * BASE_MULTIPLIER - defense * DEFENSE_REDUCTION
  
  // 최소 데미지는 1
  damage = Math.max(1, damage)
  
  // 랜덤 편차 적용
  const variance = 1 + (Math.random() * 2 - 1) * RANDOM_VARIANCE
  damage *= variance
  
  // 크리티컬 적용
  if (criticalHit) {
    damage *= BATTLE_CONFIG.CRITICAL.DAMAGE_MULTIPLIER
  }
  
  return Math.floor(damage)
}

/**
 * 마법 데미지 계산
 */
export function calculateMagicalDamage(
  magicPower: number,
  magicResist: number,
  elementalBonus = 1.0
): number {
  const { BASE_MULTIPLIER, RESIST_REDUCTION, RANDOM_VARIANCE } = BATTLE_CONFIG.DAMAGE_FORMULA.MAGICAL
  
  // 기본 데미지 = 마법력 * 배수 - 마법저항 * 감소율
  let damage = magicPower * BASE_MULTIPLIER - magicResist * RESIST_REDUCTION
  
  // 속성 보너스 적용
  damage *= elementalBonus
  
  // 최소 데미지는 1
  damage = Math.max(1, damage)
  
  // 랜덤 편차 적용
  const variance = 1 + (Math.random() * 2 - 1) * RANDOM_VARIANCE
  damage *= variance
  
  return Math.floor(damage)
}

/**
 * 명중률 계산
 */
export function calculateHitRate(attackerSpeed: number, defenderSpeed: number): number {
  const { BASE_HIT_RATE, SPEED_DIFFERENCE_FACTOR, MIN_HIT_RATE, MAX_HIT_RATE } = BATTLE_CONFIG.ACCURACY
  
  const speedDiff = attackerSpeed - defenderSpeed
  const hitRate = BASE_HIT_RATE + speedDiff * SPEED_DIFFERENCE_FACTOR
  
  return Math.max(MIN_HIT_RATE, Math.min(MAX_HIT_RATE, hitRate))
}

/**
 * 크리티컬 확률 계산
 */
export function calculateCriticalRate(agility: number): number {
  const { BASE_RATE, AGILITY_BONUS } = BATTLE_CONFIG.CRITICAL
  return Math.min(1.0, BASE_RATE + agility * AGILITY_BONUS)
}

// 전체 설정 export
export const GAME_BALANCE = {
  CHARACTER: CHARACTER_CONFIG,
  BATTLE: BATTLE_CONFIG,
  MONSTER_SCALING,
  ITEM: ITEM_CONFIG,
  SKILL: SKILL_CONFIG,
  SHOP: SHOP_CONFIG,
  DUNGEON: DUNGEON_CONFIG,
  EXPERIENCE: EXPERIENCE_CURVE
} as const