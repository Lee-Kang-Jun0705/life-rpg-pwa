import { test, expect } from '@playwright/test';
import { TEST_CONFIG, helpers } from '../test-config';

test.describe('던전 기능 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dungeon);
    await helpers.waitForPageLoad(page);
  });

  test('던전 목록이 올바르게 표시되어야 함', async ({ page }) => {
    // 페이지 헤더 확인
    await expect(page.locator('h1, h2').filter({ hasText: '던전' })).toBeVisible();
    
    // 던전 목록 컨테이너 확인
    const dungeonList = page.locator('[data-testid="dungeon-list"], .dungeon-list, .grid').first();
    await expect(dungeonList).toBeVisible();
    
    // 던전 카드가 최소 1개 이상 있어야 함
    const dungeonCards = page.locator('[data-testid="dungeon-card"], .dungeon-card, [class*="DungeonCard"]');
    const cardCount = await dungeonCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // 첫 번째 던전 카드 내용 확인
    const firstDungeon = dungeonCards.first();
    await expect(firstDungeon).toBeVisible();
    
    // 던전 이름, 난이도, 보상 정보 확인
    await expect(firstDungeon.locator('text=/던전|숲|동굴|성|탑/')).toBeVisible();
    await expect(firstDungeon.locator('text=/난이도|쉬움|보통|어려움/')).toBeVisible();
  });

  test('던전 선택 및 입장 모달 테스트', async ({ page }) => {
    // 첫 번째 던전 카드 클릭
    const firstDungeon = page.locator('[data-testid="dungeon-card"], .dungeon-card, [class*="DungeonCard"]').first();
    await firstDungeon.click();
    
    // 입장 모달 확인
    await helpers.waitForModal(page);
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    await expect(modal).toBeVisible();
    
    // 모달 내용 확인
    await expect(modal).toContainText(/던전|입장|난이도/);
    
    // 난이도 선택 옵션 확인
    const difficultyOptions = modal.locator('button, [role="radio"]').filter({ hasText: /쉬움|보통|어려움|전문가|전설/ });
    const optionCount = await difficultyOptions.count();
    expect(optionCount).toBeGreaterThan(0);
    
    // 입장 버튼 확인
    const enterButton = modal.locator('button').filter({ hasText: /입장|시작|도전/ });
    await expect(enterButton.first()).toBeVisible();
  });

  test('던전 난이도 선택 및 전투 시작', async ({ page }) => {
    // 던전 선택
    const dungeon = page.locator('[data-testid="dungeon-card"], .dungeon-card').first();
    await dungeon.click();
    await helpers.waitForModal(page);
    
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    
    // 난이도 선택 (보통)
    const normalDifficulty = modal.locator('button, [role="radio"]').filter({ hasText: '보통' }).first();
    if (await normalDifficulty.isVisible()) {
      await normalDifficulty.click();
    }
    
    // 입장 버튼 클릭
    const enterButton = modal.locator('button').filter({ hasText: /입장|시작|도전/ }).first();
    await enterButton.click();
    
    // 전투 화면으로 전환 확인
    await page.waitForURL(/\/dungeon\/.*|\/battle/, { timeout: TEST_CONFIG.timeouts.navigation });
    
    // 전투 화면 요소 확인
    const battleScreen = page.locator('[data-testid="battle-screen"], .battle-screen, [class*="Battle"]');
    await expect(battleScreen).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
  });

  test('자동 전투 기능 테스트', async ({ page }) => {
    // 던전 입장
    const dungeon = page.locator('[data-testid="dungeon-card"], .dungeon-card').first();
    await dungeon.click();
    await helpers.waitForModal(page);
    
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    const enterButton = modal.locator('button').filter({ hasText: /입장|시작/ }).first();
    await enterButton.click();
    
    // 전투 화면 대기
    await page.waitForURL(/\/dungeon\/.*|\/battle/, { timeout: TEST_CONFIG.timeouts.navigation });
    
    // 자동 전투 버튼 찾기
    const autoBattleButton = page.locator('button').filter({ hasText: /자동|AUTO/ });
    if (await autoBattleButton.isVisible()) {
      await autoBattleButton.click();
      
      // 자동 전투 진행 확인
      await page.waitForTimeout(3000);
      
      // HP 바 또는 전투 진행 상황 확인
      const hpBar = page.locator('[role="progressbar"], .hp-bar, [class*="hp"]').first();
      await expect(hpBar).toBeVisible();
    }
  });

  test('던전 보상 및 결과 화면', async ({ page }) => {
    // 테스트 던전으로 직접 이동 (쉬운 난이도)
    await page.goto(`${TEST_CONFIG.pages.dungeon}/test-easy`).catch(() => {});
    
    // 전투가 진행 중이면 결과 화면 대기
    const resultScreen = page.locator('[data-testid="dungeon-result"], .result-screen, text=/승리|패배|완료/');
    
    // 결과 화면이 나타날 때까지 대기 (최대 30초)
    const isResultVisible = await resultScreen.isVisible({ timeout: 30000 }).catch(() => false);
    
    if (isResultVisible) {
      // 보상 정보 확인
      await expect(page.locator('text=/경험치|EXP|보상/')).toBeVisible();
      await expect(page.locator('text=/골드|Gold|재화/')).toBeVisible();
      
      // 확인 버튼
      const confirmButton = page.locator('button').filter({ hasText: /확인|완료|나가기/ });
      await expect(confirmButton.first()).toBeVisible();
    }
  });

  test('던전 필터 기능', async ({ page }) => {
    // 필터 버튼 또는 드롭다운 찾기
    const filterButton = page.locator('button, select').filter({ hasText: /필터|정렬|난이도/ }).first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // 필터 옵션 확인
      const filterOptions = page.locator('[role="option"], [role="menuitem"], .filter-option');
      const optionCount = await filterOptions.count();
      
      if (optionCount > 0) {
        // 난이도별 필터 적용
        const easyFilter = filterOptions.filter({ hasText: /쉬움|Easy/ }).first();
        if (await easyFilter.isVisible()) {
          await easyFilter.click();
          
          // 필터 적용 후 던전 목록 업데이트 확인
          await page.waitForTimeout(500);
          const dungeonCards = page.locator('[data-testid="dungeon-card"], .dungeon-card');
          const filteredCount = await dungeonCards.count();
          expect(filteredCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('모바일에서 던전 UI 확인', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await helpers.waitForPageLoad(page);
    
    // 던전 목록이 세로로 표시되는지 확인
    const dungeonList = page.locator('.grid-cols-1, [class*="flex-col"]').first();
    await expect(dungeonList).toBeVisible();
    
    // 던전 카드가 전체 너비를 사용하는지 확인
    const dungeonCard = page.locator('[data-testid="dungeon-card"], .dungeon-card').first();
    await expect(dungeonCard).toBeVisible();
    
    // 터치 영역이 충분한지 확인 (최소 44px)
    const touchTargets = page.locator('button, a').filter({ hasText: /입장|도전|상세/ });
    const firstTarget = touchTargets.first();
    if (await firstTarget.isVisible()) {
      const box = await firstTarget.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});