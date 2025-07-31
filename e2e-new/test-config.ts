// E2E 테스트 공통 설정
import { Page, expect } from '@playwright/test';

export const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  
  // 타임아웃 설정
  timeouts: {
    page: 30000,      // 페이지 로드 타임아웃
    action: 10000,    // 액션 타임아웃
    navigation: 20000, // 네비게이션 타임아웃
    api: 15000        // API 응답 타임아웃
  },
  
  // 공통 선택자
  selectors: {
    loading: '[data-testid="loading"], .loading, .skeleton',
    error: '[data-testid="error"], .error-message',
    modal: '[role="dialog"], [data-testid="modal"], .modal',
    navigationBar: '[data-testid="navigation-bar"], nav',
    statCard: '[data-testid="stat-card"], .stat-card',
    button: 'button:not(:disabled)',
    toast: '[data-testid="toast"], .toast'
  },
  
  // 페이지 경로
  pages: {
    home: '/',
    dashboard: '/dashboard',
    skills: '/skills',
    dungeon: '/dungeon',
    shop: '/shop',
    inventory: '/inventory',
    equipment: '/equipment',
    achievements: '/achievements',
    activities: '/activities',
    aiCoach: '/ai-coach',
    battle: '/battle',
    collection: '/collection',
    daily: '/daily',
    leaderboard: '/leaderboard',
    profile: '/profile',
    ranking: '/ranking',
    settings: '/settings'
  },
  
  // 테스트 데이터
  testData: {
    user: {
      email: 'test@example.com',
      password: 'testpassword123',
      nickname: 'TestPlayer'
    },
    activities: [
      { stat: '건강', activity: '운동하기', exp: 10 },
      { stat: '학습', activity: '책 읽기', exp: 15 },
      { stat: '관계', activity: '친구와 대화', exp: 10 },
      { stat: '성취', activity: '프로젝트 완성', exp: 20 }
    ]
  }
};

// 공통 헬퍼 함수
export const helpers = {
  // 페이지 로드 대기
  async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(TEST_CONFIG.selectors.loading, { state: 'hidden' }).catch(() => {});
  },
  
  // 모달 대기
  async waitForModal(page: Page) {
    await page.waitForSelector(TEST_CONFIG.selectors.modal, { 
      state: 'visible',
      timeout: TEST_CONFIG.timeouts.action 
    });
  },
  
  // 토스트 메시지 확인
  async checkToast(page: Page, message: string) {
    const toast = page.locator(TEST_CONFIG.selectors.toast);
    await expect(toast).toContainText(message);
  },
  
  // 에러 체크
  async checkNoErrors(page: Page) {
    const errors = await page.locator(TEST_CONFIG.selectors.error).count();
    expect(errors).toBe(0);
  }
};