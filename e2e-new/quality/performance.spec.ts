import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-config';

test.describe('성능 테스트', () => {
  test('페이지 로딩 성능 측정', async ({ page }) => {
    const pagesToTest = [
      { name: '대시보드', url: TEST_CONFIG.pages.dashboard },
      { name: '스킬', url: TEST_CONFIG.pages.skills },
      { name: '던전', url: TEST_CONFIG.pages.dungeon },
      { name: '상점', url: TEST_CONFIG.pages.shop },
      { name: '인벤토리', url: TEST_CONFIG.pages.inventory }
    ];

    for (const pageInfo of pagesToTest) {
      await test.step(`${pageInfo.name} 페이지 로딩 시간`, async () => {
        const startTime = Date.now();
        
        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        console.log(`${pageInfo.name} 로딩 시간: ${loadTime}ms`);
        
        // 2초 이내 로딩 목표
        expect(loadTime).toBeLessThan(2000);
        
        // Core Web Vitals 측정
        const metrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            let fcp = 0;
            let lcp = 0;
            
            // First Contentful Paint
            const fcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              fcp = entries[entries.length - 1].startTime;
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
            
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              lcp = entries[entries.length - 1].startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // 측정 완료 대기
            setTimeout(() => {
              resolve({ fcp, lcp });
            }, 1000);
          });
        });
        
        console.log(`  FCP: ${metrics.fcp}ms, LCP: ${metrics.lcp}ms`);
      });
    }
  });

  test('대량 데이터 처리 성능', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.inventory);
    
    // 인벤토리에 많은 아이템이 있는 상황 시뮬레이션
    await page.evaluate(() => {
      // localStorage에 대량 아이템 데이터 주입
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `테스트 아이템 ${i}`,
        type: ['weapon', 'armor', 'consumable'][i % 3],
        level: Math.floor(Math.random() * 100) + 1,
        rarity: ['common', 'rare', 'epic', 'legendary'][i % 4]
      }));
      
      localStorage.setItem('test-inventory-items', JSON.stringify(items));
    });
    
    // 페이지 새로고침하여 대량 데이터 로드
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const renderTime = Date.now() - startTime;
    console.log(`1000개 아이템 렌더링 시간: ${renderTime}ms`);
    
    // 3초 이내 렌더링 목표
    expect(renderTime).toBeLessThan(3000);
    
    // 스크롤 성능 테스트
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - scrollStartTime;
    
    console.log(`스크롤 시간: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(200);
  });

  test('메모리 누수 검사', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
    
    // 초기 메모리 사용량 측정
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 반복적인 액션 수행
    for (let i = 0; i < 10; i++) {
      // 스탯 카드 클릭
      const statCard = page.locator('button').filter({ hasText: '건강' }).first();
      await statCard.click();
      
      // 모달 대기
      const modal = page.locator(TEST_CONFIG.selectors.modal);
      await expect(modal).toBeVisible();
      
      // 모달 닫기
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
      
      await page.waitForTimeout(100);
    }
    
    // 가비지 컬렉션 강제 실행
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // 최종 메모리 사용량 측정
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    console.log(`메모리 증가량: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    // 메모리 증가량이 50MB 미만이어야 함
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('네트워크 성능 (3G 시뮬레이션)', async ({ page, context }) => {
    // 3G 네트워크 조건 설정
    await context.route('**/*', async route => {
      // 150ms 지연 추가 (3G 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 150));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto(TEST_CONFIG.pages.dashboard);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`3G 네트워크에서 로딩 시간: ${loadTime}ms`);
    
    // 5초 이내 로딩 목표
    expect(loadTime).toBeLessThan(5000);
    
    // 중요 콘텐츠가 표시되는지 확인
    const header = page.locator('h1').filter({ hasText: 'Life RPG' });
    await expect(header).toBeVisible({ timeout: 3000 });
  });

  test('애니메이션 성능 (FPS 측정)', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
    
    // FPS 측정 시작
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        let lastTime = performance.now();
        const fpsValues: number[] = [];
        
        function measureFPS() {
          frames++;
          const currentTime = performance.now();
          
          if (currentTime >= lastTime + 1000) {
            const currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
            fpsValues.push(currentFPS);
            frames = 0;
            lastTime = currentTime;
            
            if (fpsValues.length >= 3) {
              const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
              resolve(avgFPS);
              return;
            }
          }
          
          requestAnimationFrame(measureFPS);
        }
        
        requestAnimationFrame(measureFPS);
      });
    });
    
    console.log(`평균 FPS: ${fps}`);
    
    // 30 FPS 이상 목표
    expect(fps).toBeGreaterThan(30);
  });

  test('동시 사용자 시뮬레이션', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    // 5명의 동시 사용자 생성
    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    // 모든 사용자가 동시에 대시보드 접속
    const startTime = Date.now();
    
    await Promise.all(
      pages.map(page => page.goto(TEST_CONFIG.pages.dashboard))
    );
    
    await Promise.all(
      pages.map(page => page.waitForLoadState('networkidle'))
    );
    
    const totalLoadTime = Date.now() - startTime;
    console.log(`5명 동시 접속 총 로딩 시간: ${totalLoadTime}ms`);
    
    // 평균 로딩 시간 계산
    const avgLoadTime = totalLoadTime / 5;
    console.log(`평균 로딩 시간: ${avgLoadTime}ms`);
    
    // 평균 3초 이내 로딩 목표
    expect(avgLoadTime).toBeLessThan(3000);
    
    // 정리
    await Promise.all(contexts.map(context => context.close()));
  });

  test('이미지 최적화 확인', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
    
    // 모든 이미지 요소 찾기
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (!src) continue;
      
      // 이미지 로딩 속성 확인
      const loading = await img.getAttribute('loading');
      expect(loading).toBe('lazy');
      
      // 이미지 크기 속성 확인
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      expect(width).toBeTruthy();
      expect(height).toBeTruthy();
      
      // WebP 형식 사용 확인 (권장)
      if (src.includes('.') && !src.startsWith('data:')) {
        console.log(`이미지 형식: ${src.split('.').pop()}`);
      }
    }
  });
});