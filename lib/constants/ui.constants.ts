/**
 * UI 관련 상수 정의
 */

// 애니메이션 지속 시간
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const

// 뷰포트 브레이크포인트
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const

// 타임아웃 설정
export const TIMEOUTS = {
  DEBOUNCE: 300,
  TOAST: 3000,
  LOADING: 10000,
  ANIMATION: 800,
} as const

// 레이아웃 크기
export const LAYOUT = {
  HEADER_HEIGHT: '56px', // h-14
  NAV_HEIGHT: '64px', // h-16
  MOBILE_NAV_HEIGHT: '56px',
  CONTENT_PADDING: '16px', // p-4
} as const

// 그리드 설정
export const GRID = {
  MOBILE_COLUMNS: 2,
  TABLET_COLUMNS: 3,
  DESKTOP_COLUMNS: 4,
  GAP_SMALL: '12px', // gap-3
  GAP_MEDIUM: '16px', // gap-4
} as const

// 색상 관련 (테마별로 다를 수 있음)
export const COLORS = {
  PRIMARY: 'purple',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'blue',
} as const

// z-index 레벨
export const Z_INDEX = {
  DROPDOWN: 10,
  STICKY: 20,
  MODAL_BACKDROP: 30,
  MODAL: 40,
  TOAST: 50,
  TOOLTIP: 60,
} as const