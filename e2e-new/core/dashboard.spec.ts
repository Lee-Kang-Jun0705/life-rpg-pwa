import { test, expect } from '@playwright/test';
import { TEST_CONFIG, helpers } from '../test-config';

test.describe('대시보드 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
    await helpers.waitForPageLoad(page);
  });

  test('대시보드 기본 요소들이 표시되어야 함', async ({ page }) => {
    // 헤더 확인
    const header = page.locator('h1').filter({ hasText: 'Life RPG' });
    await expect(header).toBeVisible();
    await expect(header).toContainText('🎮');
    await expect(header).toContainText('⚔️');
    
    // 플레이어 정보 확인
    const playerInfo = page.locator('text=/Lv\\.\\s*\\d+/');
    await expect(playerInfo).toBeVisible();
    
    // 스탯 섹션 확인
    await expect(page.getByText('스탯 올리기')).toBeVisible();
    
    // 네비게이션 바 확인
    const navBar = page.locator(TEST_CONFIG.selectors.navigationBar);
    await expect(navBar).toBeVisible();
  });

  test('스탯 카드가 올바르게 표시되고 상호작용 가능해야 함', async ({ page }) => {
    // 스탯 카드 컨테이너 확인
    const statsGrid = page.locator('.grid').filter({ has: page.locator(TEST_CONFIG.selectors.statCard) });
    await expect(statsGrid).toBeVisible();
    
    // 각 스탯 확인
    const expectedStats = ['건강', '학습', '관계', '성취'];
    
    for (const statName of expectedStats) {
      await test.step(`${statName} 스탯 카드 확인`, async () => {
        const statCard = page.locator('button').filter({ hasText: statName });
        await expect(statCard).toBeVisible();
        
        // 레벨 정보 확인
        const levelInfo = statCard.locator('text=/Lv\\.\\s*\\d+/');
        await expect(levelInfo).toBeVisible();
        
        // 경험치 바 확인
        const expBar = statCard.locator('[role="progressbar"], .progress, [class*="progress"]');
        await expect(expBar).toBeVisible();
      });
    }
  });

  test('스탯 카드 클릭 시 액션 모달이 열려야 함', async ({ page }) => {
    // 첫 번째 스탯 카드 클릭
    const firstStatCard = page.locator('button').filter({ hasText: '건강' }).first();
    await firstStatCard.click();
    
    // 모달 열림 확인
    await helpers.waitForModal(page);
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    await expect(modal).toBeVisible();
    
    // 모달 내용 확인
    await expect(modal).toContainText('건강');
    await expect(modal).toContainText('경험치');
    
    // 활동 버튼들 확인
    const activityButtons = modal.locator('button').filter({ hasText: /운동|산책|요가/ });
    const buttonCount = await activityButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // 모달 닫기
    const closeButton = modal.locator('button').filter({ hasText: /닫기|취소|×/ }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // ESC 키로 닫기
      await page.keyboard.press('Escape');
    }
    
    await expect(modal).toBeHidden();
  });

  test('활동 수행 시 경험치가 증가해야 함', async ({ page }) => {
    // 건강 스탯 카드에서 초기 경험치 확인
    const healthCard = page.locator('button').filter({ hasText: '건강' }).first();
    const initialExpText = await healthCard.locator('text=/\\d+\\s*\\/\\s*\\d+/').textContent();
    const initialExp = initialExpText ? parseInt(initialExpText.split('/')[0]) : 0;
    
    // 스탯 카드 클릭
    await healthCard.click();
    await helpers.waitForModal(page);
    
    // 활동 수행
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    const activityButton = modal.locator('button').filter({ hasText: /운동|산책/ }).first();
    await activityButton.click();
    
    // 모달이 닫힐 때까지 대기
    await expect(modal).toBeHidden({ timeout: TEST_CONFIG.timeouts.action });
    
    // 경험치 증가 확인
    await page.waitForTimeout(500); // 애니메이션 대기
    const updatedExpText = await healthCard.locator('text=/\\d+\\s*\\/\\s*\\d+/').textContent();
    const updatedExp = updatedExpText ? parseInt(updatedExpText.split('/')[0]) : 0;
    
    expect(updatedExp).toBeGreaterThan(initialExp);
  });

  test('모바일 반응형 레이아웃 확인', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await helpers.waitForPageLoad(page);
    
    // 모바일에서 요소들이 올바르게 표시되는지 확인
    const header = page.locator('h1').filter({ hasText: 'Life RPG' });
    await expect(header).toBeVisible();
    
    // 스탯 카드가 2열로 표시되는지 확인
    const statsGrid = page.locator('.grid-cols-2');
    await expect(statsGrid).toBeVisible();
    
    // 네비게이션 바가 하단에 고정되어 있는지 확인
    const navBar = page.locator(TEST_CONFIG.selectors.navigationBar);
    await expect(navBar).toBeVisible();
    await expect(navBar).toHaveCSS('position', 'fixed');
  });

  test('페이지 새로고침 후에도 데이터가 유지되어야 함', async ({ page }) => {
    // 활동 수행
    const healthCard = page.locator('button').filter({ hasText: '건강' }).first();
    await healthCard.click();
    await helpers.waitForModal(page);
    
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    const activityButton = modal.locator('button').filter({ hasText: /운동|산책/ }).first();
    await activityButton.click();
    await expect(modal).toBeHidden();
    
    // 현재 경험치 저장
    await page.waitForTimeout(500);
    const expText = await healthCard.locator('text=/\\d+\\s*\\/\\s*\\d+/').textContent();
    
    // 페이지 새로고침
    await page.reload();
    await helpers.waitForPageLoad(page);
    
    // 경험치가 유지되는지 확인
    const reloadedHealthCard = page.locator('button').filter({ hasText: '건강' }).first();
    const reloadedExpText = await reloadedHealthCard.locator('text=/\\d+\\s*\\/\\s*\\d+/').textContent();
    
    expect(reloadedExpText).toBe(expText);
  });
});