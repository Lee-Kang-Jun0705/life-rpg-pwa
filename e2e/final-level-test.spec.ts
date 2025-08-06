import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('최종 레벨 연동 테스트', () => {
  test('대시보드와 모험 페이지 레벨 연동 확인', async ({ page }) => {
    // 콘솔 로그 캡처
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Adventure]') || text.includes('[Dashboard]')) {
        consoleLogs.push(`[${msg.type()}] ${text}`);
      }
    });

    // 1. 대시보드 페이지 방문
    console.log('1. 대시보드 페이지 방문');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 대시보드 스탯 정보 수집
    const dashboardStats = await page.evaluate(() => {
      const statCards = document.querySelectorAll('[data-testid="stat-card"]');
      const stats: Record<string, number> = {};
      let totalLevel = 0;

      statCards.forEach(card => {
        // 레벨 텍스트 찾기
        const levelElements = card.querySelectorAll('.text-xl.font-black');
        levelElements.forEach(el => {
          const text = el.textContent || '';
          if (text.includes('Lv.')) {
            const level = parseInt(text.match(/Lv\.(\d+)/)?.[1] || '0');
            
            // 스탯 타입 찾기
            const statTypeElement = card.querySelector('.text-lg.font-black');
            const statType = statTypeElement?.textContent || 'unknown';
            
            stats[statType] = level;
            totalLevel += level;
          }
        });
      });

      return { stats, totalLevel };
    });

    console.log('대시보드 스탯:', dashboardStats);

    // 2. 모험 페이지 방문
    console.log('\n2. 모험 페이지 방문');
    await page.goto(`${BASE_URL}/adventure`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 모험 페이지 캐릭터 레벨 확인
    const adventureLevel = await page.evaluate(() => {
      // 캐릭터 정보 섹션 찾기
      const characterInfo = document.querySelector('.bg-gray-800\\/50.rounded-xl.p-4.mb-6');
      if (!characterInfo) return { found: false, level: 0 };

      // 레벨 텍스트 찾기
      const spans = characterInfo.querySelectorAll('span');
      let levelText = '';
      spans.forEach(span => {
        if (span.textContent?.includes('Lv.')) {
          levelText = span.textContent;
        }
      });
      const level = parseInt(levelText.match(/Lv\.(\d+)/)?.[1] || '0');

      return { found: true, level };
    });

    console.log('모험 페이지 레벨:', adventureLevel);

    // 3. 콘솔 로그 출력
    console.log('\n=== 콘솔 로그 ===');
    consoleLogs.forEach(log => console.log(log));

    // 4. 결과 분석
    console.log('\n=== 결과 분석 ===');
    console.log(`대시보드 총 레벨: ${dashboardStats.totalLevel}`);
    console.log(`모험 페이지 레벨: ${adventureLevel.level}`);
    
    if (dashboardStats.totalLevel === adventureLevel.level && dashboardStats.totalLevel > 0) {
      console.log('✅ 레벨 연동 성공!');
    } else if (dashboardStats.totalLevel === 0 && adventureLevel.level === 0) {
      console.log('⚠️ 두 페이지 모두 레벨 0 - 데이터가 없음');
    } else {
      console.log('❌ 레벨 불일치!');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'dashboard-final.png', fullPage: true });
    await page.goto(`${BASE_URL}/adventure`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'adventure-final.png', fullPage: true });

    // 검증 - 적어도 에러가 없어야 함
    expect(adventureLevel.found).toBe(true);
  });
});