// 데미지 관련 상수
export const DAMAGE_CONSTANTS = {
  // 확률
  CRITICAL_CHANCE: 0.2,           // 크리티컬 확률 20%
  STRONG_ATTACK_CHANCE: 0.15,     // 강공격 확률 15%

  // 배수
  CRITICAL_MULTIPLIER: 1.5,       // 크리티컬 배수
  STRONG_ATTACK_MULTIPLIER: 1.3,  // 강공격 배수
  CURSE_DAMAGE_REDUCTION: 0.7,    // 저주 시 데미지 감소율

  // 변동폭
  DAMAGE_VARIATION: 10           // 데미지 변동폭 ±5
} as const
