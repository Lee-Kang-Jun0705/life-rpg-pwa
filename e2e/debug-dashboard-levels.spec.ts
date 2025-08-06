import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('대시보드 레벨 디버깅', () => {
  test('대시보드 스탯 레벨 확인', async ({ page }) => {
    // 대시보드로 이동
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 데이터 로드 대기

    // 페이지 스크린샷
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });

    // 스탯 카드 확인
    const statCards = await page.locator('[data-testid="stat-card"]').all();
    console.log(`스탯 카드 개수: ${statCards.length}`);

    // 각 스탯 레벨 추출
    const stats: Record<string, number> = {};
    
    // 방법 1: data-testid를 통한 접근
    for (const card of statCards) {
      const levelText = await card.locator('.text-xl.font-black').textContent();
      const statName = await card.locator('.text-lg.font-black').first().textContent();
      
      if (levelText && statName) {
        const level = parseInt(levelText.match(/Lv\.(\d+)/)?.[1] || '0');
        stats[statName] = level;
        console.log(`${statName}: ${level}`);
      }
    }

    // 방법 2: 직접 선택자로 접근
    if (Object.keys(stats).length === 0) {
      console.log('방법 2로 시도...');
      
      // 각 스탯별로 찾기
      const statTypes = [
        { name: '건강', selector: '.gradient-health' },
        { name: '학습', selector: '.gradient-learning' },
        { name: '관계', selector: '.gradient-relationship' },
        { name: '성취', selector: '.gradient-achievement' }
      ];

      for (const statType of statTypes) {
        const card = page.locator(statType.selector).first();
        if (await card.isVisible()) {
          const levelText = await card.locator('div:has-text("Lv.")').textContent();
          const level = parseInt(levelText?.match(/Lv\.(\d+)/)?.[1] || '0');
          stats[statType.name] = level;
          console.log(`${statType.name}: ${level}`);
        }
      }
    }

    // 총 레벨 계산
    const totalLevel = Object.values(stats).reduce((sum, level) => sum + level, 0);
    console.log(`\n대시보드 총 레벨: ${totalLevel}`);

    // 모험 페이지로 이동하여 비교
    await page.goto(`${BASE_URL}/adventure`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 캐릭터 레벨 확인
    const characterLevelElement = await page.locator('span:has-text("Lv.")').first();
    const characterLevelText = await characterLevelElement.textContent();
    const characterLevel = parseInt(characterLevelText?.match(/Lv\.(\d+)/)?.[1] || '0');
    
    console.log(`모험 페이지 캐릭터 레벨: ${characterLevel}`);

    // 레벨 비교
    if (totalLevel === characterLevel) {
      console.log('✅ 레벨 연동 성공!');
    } else {
      console.log('❌ 레벨 불일치!');
    }

    // 디버그 정보 출력
    console.log('\n=== 디버그 정보 ===');
    console.log('대시보드 스탯:', stats);
    console.log('총 레벨:', totalLevel);
    console.log('캐릭터 레벨:', characterLevel);

    // 레벨이 0이 아닌지 확인
    expect(totalLevel).toBeGreaterThan(0);
    expect(characterLevel).toBeGreaterThan(0);
    expect(characterLevel).toBe(totalLevel);
  });
});