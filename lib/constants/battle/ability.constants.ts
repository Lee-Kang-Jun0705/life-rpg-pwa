// 특수 능력 관련 상수
export const ABILITY_CONSTANTS = {
  // 발동 확률
  SPECIAL_ABILITY_CHANCE: 0.3,    // 특수능력 발동 확률 30%

  // 특수 능력별 효과
  REFLECT_DAMAGE_RATIO: 0.3,      // 용암 갑옷 반사 데미지 비율
  DOUBLE_STRIKE_RATIO: 0.7,       // 더블 스트라이크 두 번째 타격 비율
  LIFE_DRAIN_RATIO: 0.5,          // 생명력 흡수 비율

  // 상태 이상
  POISON_TURN_INTERVAL: 2,        // 독 데미지 발동 턴 간격
  POISON_DAMAGE_DECAY: 2         // 독 데미지 감소량
} as const

// 특수 능력 타입
export type SpecialAbility =
  | 'doubleStrike'  // 연속 공격
  | 'lifeDrain'     // 생명력 흡수
  | 'freeze'        // 빙결
  | 'poison'        // 독
  | 'curse'         // 저주
  | 'lavaArmor'     // 용암 갑옷
  | 'fireBreath'    // 화염 숨결
  | 'heal'          // 치유
  | 'hellfire'      // 지옥불
  | 'timeWarp'      // 시간 왜곡
  | 'shadowClone'   // 그림자 분신
  | 'divineWrath'   // 신의 분노
  | 'voidCall'      // 심연의 부름
  | 'tentacleGrab'  // 촉수 붙잡기

// 특수 능력 효과 타입
export interface SpecialAbilityEffect {
  type: SpecialAbility
  duration?: number
  power?: number
  chance: number
}
