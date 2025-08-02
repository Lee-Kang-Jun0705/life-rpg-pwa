// UI 관련 상수
export const UI_CONSTANTS = {
  // 배속 관련
  AVAILABLE_SPEEDS: [1, 2, 3] as const,

  // 로그 관련
  MAX_VISIBLE_LOG_COUNT: 5       // 화면에 표시할 최대 로그 수
} as const

// 전투 메시지 타입
export type BattleMessageType =
  | 'damage'    // 데미지
  | 'critical'  // 크리티컬
  | 'heal'      // 회복
  | 'status'    // 상태 변화
  | 'miss'      // 회피
  | 'start'     // 전투 시작
  | 'end'       // 전투 종료
  | 'normal'    // 일반 메시지

// 전투 상태 타입
export interface BattleStatus {
  frozen: boolean
  cursed: boolean
  poisonDamage: number
}
