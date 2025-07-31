import { test, expect } from '@playwright/test';

test.describe('전투 기능 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버 접속
    await page.goto('http://localhost:3000');
    
    // 모험 페이지로 이동
    await page.click('text=모험');
    await page.waitForURL('**/adventure');
  });

  test('전투 로그가 화면 하단에 고정되어 있는지 확인', async ({ page }) => {
    // 던전 탭 클릭
    await page.click('text=던전');
    
    // 던전 목록에서 첫 번째 던전 선택
    const dungeonCard = page.locator('.dungeon-card').first();
    await dungeonCard.click();
    
    // 입장 버튼 클릭
    await page.click('text=입장');
    
    // 난이도 선택 (있다면)
    const difficultyButton = page.locator('button:has-text("보통")');
    if (await difficultyButton.isVisible()) {
      await difficultyButton.click();
    }
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(2000);
    
    // 전투 로그 영역 확인
    const battleLogArea = page.locator('.bg-gray-800.border-t.border-gray-700.max-h-32.overflow-y-auto.p-2');
    
    // 전투 로그가 존재하는지 확인
    await expect(battleLogArea).toBeVisible();
    
    // 전투 로그가 화면 하단에 고정되어 있는지 확인
    const boundingBox = await battleLogArea.boundingBox();
    if (boundingBox) {
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        // 로그 영역이 화면 하단 근처에 있는지 확인
        expect(boundingBox.y + boundingBox.height).toBeGreaterThan(viewportSize.height - 200);
      }
    }
    
    // 전투 로그 제목 확인
    await expect(page.locator('text=전투 로그')).toBeVisible();
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/battle-log.png', fullPage: true });
  });

  test('던전별 몬스터 난이도 스케일링 확인', async ({ page }) => {
    // 콘솔 메시지 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[generateStageMonsters]')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // 던전 탭 클릭
    await page.click('text=던전');
    
    // 일일 던전 선택
    const dailyDungeon = page.locator('text=건강의 시련').first();
    if (await dailyDungeon.isVisible()) {
      await dailyDungeon.click();
      await page.click('text=입장');
      
      // 난이도 선택
      const hardButton = page.locator('button:has-text("어려움")');
      if (await hardButton.isVisible()) {
        await hardButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      // 콘솔 로그 확인
      const monsterLog = consoleLogs.find(log => log.includes('finalMultiplier'));
      if (monsterLog) {
        console.log('몬스터 난이도 로그:', monsterLog);
        
        // finalMultiplier가 1.0이 아닌지 확인 (난이도가 적용되었는지)
        expect(monsterLog).toContain('finalMultiplier');
        expect(monsterLog).not.toContain('finalMultiplier": 1,');
      }
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/dungeon-difficulty.png', fullPage: true });
  });

  test('실제 전투에서 기능 동작 확인', async ({ page }) => {
    // 던전 탭 클릭
    await page.click('text=던전');
    
    // 던전 선택
    const dungeonCard = page.locator('.cursor-pointer').first();
    await dungeonCard.click();
    
    // 입장
    await page.click('text=입장');
    
    // 난이도 선택
    const normalButton = page.locator('button:has-text("보통")');
    if (await normalButton.isVisible()) {
      await normalButton.click();
    }
    
    // 전투 화면 대기
    await page.waitForTimeout(3000);
    
    // 공격 버튼 클릭
    const attackButton = page.locator('button:has-text("공격")');
    if (await attackButton.isVisible()) {
      // 몬스터 선택
      const monster = page.locator('.cursor-pointer').first();
      await monster.click();
      
      // 공격
      await attackButton.click();
      
      // 전투 로그에 메시지가 추가되는지 확인
      await page.waitForTimeout(1000);
      
      // 전투 로그 메시지 확인
      const logMessages = page.locator('.text-red-400, .text-green-400, .text-yellow-400, .text-gray-300');
      const count = await logMessages.count();
      expect(count).toBeGreaterThan(0);
      
      // 타임스탬프가 있는지 확인
      const timestamp = page.locator('.text-gray-500').first();
      await expect(timestamp).toBeVisible();
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/battle-in-action.png', fullPage: true });
  });
});