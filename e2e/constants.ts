// E2E 테스트 공통 상수

// 타임아웃 상수
export const TIMEOUTS = {
  // 페이지 로딩
  PAGE_LOAD: 30000,
  NETWORK_IDLE: 5000,
  
  // UI 인터랙션
  MODAL_ANIMATION: 500,
  BUTTON_DEBOUNCE: 300,
  
  // 데이터 동기화
  DB_UPDATE: 2000,
  STATE_UPDATE: 1000,
  DATA_LOADING: 3000,
  
  // 서비스 워커
  SW_INSTALL: 2000,
  
  // 동적 로딩
  DYNAMIC_IMPORT: 3000,
} as const

// 포트 설정
export const PORTS = {
  DEFAULT: 3000,
  TEST: 3006,
} as const

// 기본 URL
export const BASE_URL = `http://localhost:${PORTS.TEST}`

// 셀렉터 상수
export const SELECTORS = {
  LOADING_TEXT: 'text=모험 준비 중',
  STAT_CARD: '[data-testid="stat-card"]',
  NAVIGATION_BAR: '[data-testid="navigation-bar"]',
  MODAL: '[role="dialog"]',
} as const

// 뷰포트 크기
export const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1280, height: 800 },
} as const