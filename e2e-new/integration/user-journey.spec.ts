import { test, expect } from '@playwright/test';
import { TEST_CONFIG, helpers } from '../test-config';

test.describe('사용자 여정 통합 테스트', () => {
  test('신규 사용자 온보딩부터 첫 던전 클리어까지', async ({ page }) => {
    // 1. 홈페이지 방문
    await test.step('홈페이지 방문', async () => {
      await page.goto(TEST_CONFIG.baseURL);
      await helpers.waitForPageLoad(page);
      
      const title = await page.title();
      expect(title).toContain('Life RPG');
    });

    // 2. 대시보드로 이동
    await test.step('대시보드 진입', async () => {
      await page.goto(TEST_CONFIG.pages.dashboard);
      await helpers.waitForPageLoad(page);
      
      // 초기 레벨 확인
      const levelText = page.locator('text=/Lv\\.\\s*1/').first();
      await expect(levelText).toBeVisible();
    });

    // 3. 첫 활동 수행
    await test.step('첫 활동으로 경험치 획득', async () => {
      const healthCard = page.locator('button').filter({ hasText: '건강' }).first();
      await healthCard.click();
      await helpers.waitForModal(page);
      
      const modal = page.locator(TEST_CONFIG.selectors.modal);
      const activityButton = modal.locator('button').filter({ hasText: /운동|산책/ }).first();
      await activityButton.click();
      
      await expect(modal).toBeHidden();
      
      // 토스트 메시지 확인
      const toast = page.locator(TEST_CONFIG.selectors.toast);
      const isToastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false);
      if (isToastVisible) {
        await expect(toast).toContainText(/경험치|EXP/);
      }
    });

    // 4. 스킬 페이지 탐색
    await test.step('스킬 시스템 확인', async () => {
      await page.goto(TEST_CONFIG.pages.skills);
      await helpers.waitForPageLoad(page);
      
      // 스킬 포인트 확인
      const skillPoints = page.locator('text=/스킬 포인트|SP:/').first();
      await expect(skillPoints).toBeVisible();
      
      // 스킬 카테고리 확인
      const skillTabs = page.locator('[role="tab"], .tab').first();
      await expect(skillTabs).toBeVisible();
    });

    // 5. 상점 방문
    await test.step('상점에서 아이템 확인', async () => {
      await page.goto(TEST_CONFIG.pages.shop);
      await helpers.waitForPageLoad(page);
      
      // 골드 표시 확인
      const goldDisplay = page.locator('text=/골드|Gold|G:/').first();
      await expect(goldDisplay).toBeVisible();
      
      // 상품 목록 확인
      const shopItems = page.locator('[data-testid="shop-item"], .shop-item').first();
      await expect(shopItems).toBeVisible();
    });

    // 6. 던전 도전
    await test.step('첫 던전 도전', async () => {
      await page.goto(TEST_CONFIG.pages.dungeon);
      await helpers.waitForPageLoad(page);
      
      // 첫 번째 던전 선택
      const dungeonCard = page.locator('[data-testid="dungeon-card"], .dungeon-card').first();
      await dungeonCard.click();
      
      await helpers.waitForModal(page);
      const modal = page.locator(TEST_CONFIG.selectors.modal);
      
      // 쉬움 난이도 선택
      const easyDifficulty = modal.locator('button, [role="radio"]').filter({ hasText: /쉬움|Easy/ }).first();
      if (await easyDifficulty.isVisible()) {
        await easyDifficulty.click();
      }
      
      // 입장
      const enterButton = modal.locator('button').filter({ hasText: /입장|시작|도전/ }).first();
      await enterButton.click();
      
      // 전투 화면 확인
      await page.waitForURL(/\/dungeon\/.*|\/battle/, { timeout: TEST_CONFIG.timeouts.navigation });
    });

    // 7. 인벤토리 확인
    await test.step('획득한 아이템 확인', async () => {
      await page.goto(TEST_CONFIG.pages.inventory);
      await helpers.waitForPageLoad(page);
      
      // 인벤토리 그리드 확인
      const inventoryGrid = page.locator('.grid, [data-testid="inventory-grid"]').first();
      await expect(inventoryGrid).toBeVisible();
    });

    // 8. 프로필 확인
    await test.step('프로필 페이지에서 진행 상황 확인', async () => {
      await page.goto(TEST_CONFIG.pages.profile);
      await helpers.waitForPageLoad(page);
      
      // 플레이어 정보 확인
      await expect(page.locator('text=/레벨|Lv\\./').first()).toBeVisible();
      await expect(page.locator('text=/경험치|EXP/').first()).toBeVisible();
    });
  });

  test('일일 플레이 루틴', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
    await helpers.waitForPageLoad(page);

    // 1. 일일 미션 확인
    await test.step('일일 미션 확인', async () => {
      await page.goto(TEST_CONFIG.pages.daily);
      await helpers.waitForPageLoad(page);
      
      // 일일 미션 목록 확인
      const missionList = page.locator('[data-testid="daily-mission"], .daily-mission').first();
      await expect(missionList).toBeVisible();
      
      // 로그인 보상 확인
      const loginReward = page.locator('text=/로그인 보상|출석/').first();
      if (await loginReward.isVisible()) {
        console.log('로그인 보상 확인됨');
      }
    });

    // 2. 활동 기록
    await test.step('다양한 스탯 활동 수행', async () => {
      await page.goto(TEST_CONFIG.pages.dashboard);
      
      const stats = ['건강', '학습', '관계', '성취'];
      
      for (const statName of stats) {
        const statCard = page.locator('button').filter({ hasText: statName }).first();
        
        if (await statCard.isVisible()) {
          await statCard.click();
          await helpers.waitForModal(page);
          
          const modal = page.locator(TEST_CONFIG.selectors.modal);
          const activityButton = modal.locator('button').nth(1); // 두 번째 활동 선택
          
          if (await activityButton.isVisible()) {
            await activityButton.click();
            await expect(modal).toBeHidden();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    // 3. 던전 3회 도전
    await test.step('던전 반복 플레이', async () => {
      for (let i = 0; i < 3; i++) {
        await page.goto(TEST_CONFIG.pages.dungeon);
        await helpers.waitForPageLoad(page);
        
        const dungeonCard = page.locator('[data-testid="dungeon-card"], .dungeon-card').nth(i % 3);
        if (await dungeonCard.isVisible()) {
          await dungeonCard.click();
          await helpers.waitForModal(page);
          
          const modal = page.locator(TEST_CONFIG.selectors.modal);
          const enterButton = modal.locator('button').filter({ hasText: /입장|시작/ }).first();
          await enterButton.click();
          
          // 전투 화면 대기
          await page.waitForTimeout(2000);
          
          // 던전 목록으로 돌아가기
          await page.goBack();
        }
      }
    });

    // 4. 업적 확인
    await test.step('업적 달성 확인', async () => {
      await page.goto(TEST_CONFIG.pages.achievements);
      await helpers.waitForPageLoad(page);
      
      // 달성한 업적 확인
      const achievements = page.locator('[data-testid="achievement"], .achievement').filter({ hasText: /달성|완료|100%/ });
      const achievementCount = await achievements.count();
      
      console.log(`달성한 업적: ${achievementCount}개`);
    });
  });

  test('소셜 기능 활용 플레이', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);

    // 1. 리더보드 확인
    await test.step('리더보드에서 순위 확인', async () => {
      await page.goto(TEST_CONFIG.pages.leaderboard);
      await helpers.waitForPageLoad(page);
      
      // 순위 목록 확인
      const leaderboardEntries = page.locator('[data-testid="leaderboard-entry"], .leaderboard-entry');
      const entryCount = await leaderboardEntries.count();
      expect(entryCount).toBeGreaterThan(0);
      
      // 내 순위 확인
      const myRank = page.locator('text=/내 순위|나의 순위|My Rank/').first();
      if (await myRank.isVisible()) {
        console.log('내 순위 표시됨');
      }
    });

    // 2. 컬렉션 수집
    await test.step('몬스터 컬렉션 확인', async () => {
      await page.goto(TEST_CONFIG.pages.collection);
      await helpers.waitForPageLoad(page);
      
      // 수집한 몬스터 확인
      const collectedMonsters = page.locator('[data-testid="monster-card"], .monster-card').filter({ has: page.locator('.collected, .owned') });
      const collectedCount = await collectedMonsters.count();
      
      console.log(`수집한 몬스터: ${collectedCount}개`);
      
      // 컬렉션 보상 확인
      const rewardButton = page.locator('button').filter({ hasText: /보상 받기|Claim/ }).first();
      if (await rewardButton.isVisible()) {
        await rewardButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // 3. AI 코치 상담
    await test.step('AI 코치와 상담', async () => {
      await page.goto(TEST_CONFIG.pages.aiCoach);
      await helpers.waitForPageLoad(page);
      
      // AI 코치 인터페이스 확인
      const chatInterface = page.locator('[data-testid="ai-chat"], .ai-chat, .chat-interface').first();
      
      if (await chatInterface.isVisible()) {
        // 메시지 입력
        const inputField = page.locator('input[type="text"], textarea').filter({ hasNotText: /API/ }).first();
        
        if (await inputField.isVisible()) {
          await inputField.fill('오늘 운동을 하지 못했어요. 어떻게 해야 할까요?');
          
          const sendButton = page.locator('button').filter({ hasText: /전송|Send/ }).first();
          await sendButton.click();
          
          // 응답 대기
          await page.waitForTimeout(2000);
        }
      }
    });
  });

  test('장기 진행 시뮬레이션', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);

    // 1. 레벨업 시뮬레이션
    await test.step('레벨업 과정', async () => {
      // 많은 활동으로 레벨업 유도
      for (let i = 0; i < 20; i++) {
        const statCard = page.locator('button').filter({ hasText: '건강' }).first();
        await statCard.click();
        await helpers.waitForModal(page);
        
        const modal = page.locator(TEST_CONFIG.selectors.modal);
        const activityButton = modal.locator('button').first();
        await activityButton.click();
        await expect(modal).toBeHidden();
        
        // 레벨업 확인
        const levelUpNotification = page.locator('text=/레벨 업|Level Up|Lv\\.\\s*\\d+.*→/');
        if (await levelUpNotification.isVisible({ timeout: 500 })) {
          console.log('레벨업!');
          break;
        }
      }
    });

    // 2. 장비 강화
    await test.step('장비 강화 시스템', async () => {
      await page.goto(TEST_CONFIG.pages.equipment);
      await helpers.waitForPageLoad(page);
      
      // 장착된 장비 확인
      const equippedItem = page.locator('[data-testid="equipped-item"], .equipped-item').first();
      
      if (await equippedItem.isVisible()) {
        await equippedItem.click();
        
        // 강화 버튼 찾기
        const enhanceButton = page.locator('button').filter({ hasText: /강화|Enhance|업그레이드/ }).first();
        
        if (await enhanceButton.isVisible()) {
          await enhanceButton.click();
          await page.waitForTimeout(1000);
          
          // 강화 결과 확인
          const result = page.locator('text=/성공|실패|Success|Failed/').first();
          if (await result.isVisible()) {
            const resultText = await result.textContent();
            console.log(`강화 결과: ${resultText}`);
          }
        }
      }
    });

    // 3. 고급 던전 도전
    await test.step('고급 던전 도전', async () => {
      await page.goto(TEST_CONFIG.pages.dungeon);
      
      // 스크롤하여 고급 던전 찾기
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // 어려운 던전 선택
      const hardDungeon = page.locator('[data-testid="dungeon-card"], .dungeon-card').filter({ hasText: /어려움|Hard|전문가|Expert/ }).first();
      
      if (await hardDungeon.isVisible()) {
        await hardDungeon.click();
        await helpers.waitForModal(page);
        
        const modal = page.locator(TEST_CONFIG.selectors.modal);
        const enterButton = modal.locator('button').filter({ hasText: /입장|도전/ }).first();
        await enterButton.click();
        
        console.log('고급 던전 도전 시작');
      }
    });
  });
});