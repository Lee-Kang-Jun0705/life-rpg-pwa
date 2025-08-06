import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('간단한 레벨 확인', () => {
  test('현재 레벨 상태 확인', async ({ page }) => {
    // 콘솔 로그 캡처
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // 1. 대시보드 확인
    console.log('=== 대시보드 확인 ===');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 충분한 로드 시간

    // 페이지 내용 디버깅
    const pageContent = await page.content();
    const hasStatCards = pageContent.includes('stat-card');
    console.log(`스탯 카드 존재: ${hasStatCards}`);

    // 레벨 텍스트 찾기
    const levelTexts = await page.locator('text=/Lv\\.\\d+/').all();
    console.log(`레벨 텍스트 개수: ${levelTexts.length}`);

    for (const levelText of levelTexts) {
      const text = await levelText.textContent();
      console.log(`  - ${text}`);
    }

    // 2. 모험 페이지 확인
    console.log('\n=== 모험 페이지 확인 ===');
    await page.goto(`${BASE_URL}/adventure`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 캐릭터 정보 섹션 찾기
    const characterInfoSection = await page.locator('.bg-gray-800\\/50.rounded-xl.p-4').first();
    const isVisible = await characterInfoSection.isVisible();
    console.log(`캐릭터 정보 섹션 표시: ${isVisible}`);

    if (isVisible) {
      const characterText = await characterInfoSection.textContent();
      console.log(`캐릭터 정보: ${characterText}`);
    }

    // 3. 콘솔 로그 확인
    console.log('\n=== 콘솔 로그 ===');
    consoleLogs.forEach(log => console.log(`  - ${log}`));

    // 4. localStorage 확인
    const localStorage = await page.evaluate(() => {
      const items: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });

    console.log('\n=== localStorage ===');
    Object.entries(localStorage).forEach(([key, value]) => {
      if (key.includes('stat') || key.includes('level') || key.includes('user')) {
        console.log(`  ${key}: ${value?.substring(0, 100)}...`);
      }
    });

    // 기본 검증 - 페이지가 로드되었는지만 확인
    expect(page.url()).toContain('adventure');
  });
});