import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 E2E 테스트 환경 준비 중...');
  
  // 브라우저 컨텍스트 생성
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 서버가 준비될 때까지 대기
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log('✅ 개발 서버 준비 완료');
    
    // 초기 데이터 설정 (필요한 경우)
    await page.evaluate(() => {
      // 테스트용 초기 데이터 설정
      localStorage.setItem('test-mode', 'true');
      
      // 테스트 사용자 데이터
      const testUser = {
        id: 'test-user',
        nickname: 'TestPlayer',
        level: 1,
        exp: 0,
        stats: {
          health: { level: 1, exp: 0, maxExp: 100 },
          learning: { level: 1, exp: 0, maxExp: 100 },
          relationship: { level: 1, exp: 0, maxExp: 100 },
          achievement: { level: 1, exp: 0, maxExp: 100 }
        },
        gold: 1000,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user-data', JSON.stringify(testUser));
    });
    
    // Service Worker 등록 대기
    await page.evaluate(() => {
      return navigator.serviceWorker.ready;
    });
    
    console.log('✅ Service Worker 준비 완료');
    
  } catch (error) {
    console.error('❌ 테스트 환경 설정 실패:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ 모든 테스트 환경 준비 완료');
}

export default globalSetup;