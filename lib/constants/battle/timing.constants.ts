// 타이밍 관련 상수
export const TIMING_CONSTANTS = {
  // 기본 타이밍
  BASE_WAIT_TIME: 2000,           // 기본 대기 시간 (ms)
  ANIMATION_DURATION: 300,        // 애니메이션 지속 시간 (ms)
  DAMAGE_DISPLAY_DURATION: 1000,  // 데미지 표시 지속 시간 (ms)
  EFFECT_DELAY: 500,              // 효과 지연 시간 (ms)

  // 전투 시작/종료
  BATTLE_START_DELAY: 0,          // 전투 시작 지연 시간 (ms) - 즉시 시작
  BATTLE_END_DELAY: 1000,         // 전투 종료 지연 시간 (ms)

  // 결과 화면
  FLOOR_CLEAR_DELAY: 2000,        // 층 클리어 화면 표시 시간 (ms)
  RESULT_SCREEN_DELAY: 3000      // 결과 화면 표시 시간 (ms)
} as const
