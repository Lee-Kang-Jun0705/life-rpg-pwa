import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('데이터 시드 후 레벨 연동 테스트', () => {
  test('테스트 데이터 생성 후 레벨 확인', async ({ page }) => {
    // 1. 테스트 시드 페이지로 이동
    console.log('1. 테스트 데이터 생성 중...');
    await page.goto(`${BASE_URL}/test-seed`);
    
    // 완료 메시지 대기
    await page.waitForSelector('text=테스트 데이터 생성 완료!', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 2. 대시보드로 이동
    console.log('2. 대시보드 확인...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 스탯 레벨 확인
    const statCards = await page.locator('[data-testid="stat-card"]').all();
    const stats: Record<string, number> = {};
    
    for (const card of statCards) {
      const levelElement = await card.locator('.text-xl.font-black:has-text("Lv.")');
      const nameElement = await card.locator('.text-lg.font-black').first();
      
      if (await levelElement.isVisible() && await nameElement.isVisible()) {
        const levelText = await levelElement.textContent();
        const statName = await nameElement.textContent();
        
        if (levelText && statName) {
          const level = parseInt(levelText.match(/Lv\.(\d+)/)?.[1] || '0');
          stats[statName] = level;
          console.log(`  - ${statName}: 레벨 ${level}`);
        }
      }
    }

    const totalDashboardLevel = Object.values(stats).reduce((sum, level) => sum + level, 0);
    console.log(`  총 대시보드 레벨: ${totalDashboardLevel}`);

    // 3. 모험 페이지로 이동
    console.log('3. 모험 페이지 확인...');
    await page.goto(`${BASE_URL}/adventure`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 캐릭터 레벨 확인
    const characterInfo = await page.locator('.bg-gray-800\\/50.rounded-xl.p-4.mb-6').first();
    const levelSpan = await characterInfo.locator('span:has-text("Lv.")').first();
    const characterLevelText = await levelSpan.textContent();
    const characterLevel = parseInt(characterLevelText?.match(/Lv\.(\d+)/)?.[1] || '0');
    
    console.log(`  모험 페이지 캐릭터 레벨: ${characterLevel}`);

    // 4. 레벨 연동 확인
    console.log('\n=== 테스트 결과 ===');
    console.log(`대시보드 총 레벨: ${totalDashboardLevel}`);
    console.log(`캐릭터 레벨: ${characterLevel}`);
    
    if (totalDashboardLevel === characterLevel && totalDashboardLevel > 0) {
      console.log('✅ 레벨 연동 성공!');
    } else {
      console.log('❌ 레벨 연동 실패!');
    }

    // 검증
    expect(totalDashboardLevel).toBeGreaterThan(0);
    expect(characterLevel).toBeGreaterThan(0);
    expect(characterLevel).toBe(totalDashboardLevel);
  });
});