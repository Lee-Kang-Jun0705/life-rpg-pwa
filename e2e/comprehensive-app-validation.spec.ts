import { test, expect, Page } from '@playwright/test';
import path from 'path';

// 테스트 설정
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'comprehensive-validation');

// 헬퍼 함수들
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true
  });
}

// 메인 테스트 스위트
test.describe('Life RPG PWA - 포괄적 앱 검증', () => {
  test.beforeAll(async () => {
    // 스크린샷 디렉토리 생성
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('전체 앱 기능 및 연동 테스트', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 콘솔 에러 모니터링 시작
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${new Date().toISOString()}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`[${new Date().toISOString()}] PAGE ERROR: ${error.message}`);
    });

    // 1. 홈페이지 접속
    console.log('1. 홈페이지 접속 테스트');
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    await takeScreenshot(page, '01-homepage');
    
    // 네비게이션 확인
    const navMenu = page.locator('[role="navigation"]');
    await expect(navMenu).toBeVisible();
    
    // 2. 대시보드 페이지 테스트
    console.log('2. 대시보드 페이지 테스트');
    await page.click('a[href="/dashboard"]');
    await waitForPageLoad(page);
    await takeScreenshot(page, '02-dashboard');
    
    // 스탯 레벨 확인 및 저장
    const stats = await page.evaluate(() => {
      const statElements = document.querySelectorAll('[data-stat-level]');
      const statsData: Record<string, number> = {};
      
      statElements.forEach((el) => {
        const statName = el.getAttribute('data-stat-name') || '';
        const level = parseInt(el.getAttribute('data-stat-level') || '0');
        if (statName) {
          statsData[statName] = level;
        }
      });
      
      // 대안: 텍스트에서 레벨 추출
      if (Object.keys(statsData).length === 0) {
        const healthLevel = document.querySelector('.text-red-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
        const learningLevel = document.querySelector('.text-blue-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
        const relationshipLevel = document.querySelector('.text-green-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
        const achievementLevel = document.querySelector('.text-yellow-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
        
        return {
          health: parseInt(healthLevel || '1'),
          learning: parseInt(learningLevel || '1'),
          relationship: parseInt(relationshipLevel || '1'),
          achievement: parseInt(achievementLevel || '1')
        };
      }
      
      return statsData;
    });
    
    console.log('대시보드 스탯 레벨:', stats);
    const totalDashboardLevel = Object.values(stats).reduce((sum: number, level: any) => sum + level, 0);
    console.log('대시보드 총 레벨:', totalDashboardLevel);
    
    // 3. 모험 페이지 테스트 및 레벨 연동 확인
    console.log('3. 모험 페이지 레벨 연동 테스트');
    await page.click('a[href="/adventure"]');
    await waitForPageLoad(page);
    await takeScreenshot(page, '03-adventure-main');
    
    // 캐릭터 레벨 확인
    const characterLevelText = await page.locator('span:has-text("Lv.")').textContent();
    const characterLevel = parseInt(characterLevelText?.match(/Lv\.(\d+)/)?.[1] || '0');
    console.log('모험 페이지 캐릭터 레벨:', characterLevel);
    
    // 레벨 연동 검증
    expect(characterLevel).toBe(totalDashboardLevel);
    console.log('✅ 대시보드-모험 페이지 레벨 연동 확인 완료');
    
    // 4. 모험 페이지 각 탭 테스트
    const tabs = [
      { id: 'quest', name: '퀘스트' },
      { id: 'dungeon', name: '던전' },
      { id: 'inventory', name: '인벤토리' },
      { id: 'skill', name: '스킬' },
      { id: 'shop', name: '상점' },
      { id: 'achievement', name: '도전과제' }
    ];
    
    for (const tab of tabs) {
      console.log(`4-${tabs.indexOf(tab) + 1}. ${tab.name} 탭 테스트`);
      
      // 탭 클릭
      await page.click(`button[aria-label="${tab.name} 탭"]`);
      await waitForPageLoad(page);
      await takeScreenshot(page, `04-adventure-${tab.id}`);
      
      // 탭 컨텐츠 로드 확인
      const tabPanel = page.locator(`[role="tabpanel"][aria-labelledby="${tab.id}-tab"]`);
      await expect(tabPanel).toBeVisible({ timeout: 10000 });
      
      // 탭별 특수 기능 테스트
      if (tab.id === 'dungeon') {
        // 던전 목록 확인
        const dungeonList = page.locator('.bg-gray-800.rounded-lg.p-6');
        const dungeonCount = await dungeonList.count();
        expect(dungeonCount).toBeGreaterThan(0);
        
        // 첫 번째 던전 클릭
        await dungeonList.first().click();
        await waitForPageLoad(page);
        await takeScreenshot(page, '04-adventure-dungeon-selected');
        
        // 전투 시작 버튼 확인
        const battleButton = page.locator('button:has-text("전투 시작")');
        await expect(battleButton).toBeVisible();
        
        // 나가기 버튼으로 돌아가기
        await page.click('button[aria-label="나가기"]');
        await waitForPageLoad(page);
      }
      
      if (tab.id === 'skill') {
        // 스킬 목록 확인
        const skillCards = page.locator('.skill-card');
        const skillCount = await skillCards.count();
        console.log(`  - 스킬 개수: ${skillCount}`);
      }
      
      if (tab.id === 'inventory') {
        // 장비 슬롯 확인
        const equipmentSlots = page.locator('[data-equipment-slot]');
        const slotCount = await equipmentSlots.count();
        console.log(`  - 장비 슬롯 개수: ${slotCount}`);
      }
      
      if (tab.id === 'shop') {
        // 상점 아이템 확인
        const shopItems = page.locator('.shop-item');
        const itemCount = await shopItems.count();
        console.log(`  - 상점 아이템 개수: ${itemCount}`);
      }
    }
    
    // 5. 페이지 간 네비게이션 테스트
    console.log('5. 페이지 간 네비게이션 테스트');
    const pages = [
      { path: '/record', name: '기록' },
      { path: '/social', name: '소셜' },
      { path: '/settings', name: '설정' }
    ];
    
    for (const pageInfo of pages) {
      await page.click(`a[href="${pageInfo.path}"]`);
      await waitForPageLoad(page);
      await takeScreenshot(page, `05-${pageInfo.name}`);
      
      // 페이지 로드 확인
      await expect(page).toHaveURL(new RegExp(pageInfo.path));
    }
    
    // 6. 다시 대시보드로 돌아가서 데이터 지속성 확인
    console.log('6. 데이터 지속성 테스트');
    await page.click('a[href="/dashboard"]');
    await waitForPageLoad(page);
    
    // 이전과 동일한 스탯 레벨인지 확인
    const newStats = await page.evaluate(() => {
      const healthLevel = document.querySelector('.text-red-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
      const learningLevel = document.querySelector('.text-blue-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
      const relationshipLevel = document.querySelector('.text-green-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
      const achievementLevel = document.querySelector('.text-yellow-400')?.textContent?.match(/Lv\.(\d+)/)?.[1];
      
      return {
        health: parseInt(healthLevel || '1'),
        learning: parseInt(learningLevel || '1'),
        relationship: parseInt(relationshipLevel || '1'),
        achievement: parseInt(achievementLevel || '1')
      };
    });
    
    expect(newStats).toEqual(stats);
    console.log('✅ 데이터 지속성 확인 완료');
    
    // 7. 콘솔 에러 확인
    console.log('7. 콘솔 에러 검사');
    console.log(`총 콘솔 에러 수: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('발견된 콘솔 에러:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 에러가 없어야 함
    expect(consoleErrors.length).toBe(0);
    
    // 8. 최종 요약
    console.log('\n=== 테스트 완료 요약 ===');
    console.log('✅ 대시보드-모험 페이지 레벨 연동: 정상');
    console.log('✅ 모든 모험 페이지 탭 기능: 정상');
    console.log('✅ 페이지 간 네비게이션: 정상');
    console.log('✅ 데이터 지속성: 정상');
    console.log(`${consoleErrors.length === 0 ? '✅' : '❌'} 콘솔 에러: ${consoleErrors.length}개`);
  });

  // 개별 기능 상세 테스트
  test('전투 시스템 상세 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure?tab=dungeon`);
    await waitForPageLoad(page);
    
    // 던전 선택
    const firstDungeon = page.locator('.bg-gray-800.rounded-lg.p-6').first();
    await firstDungeon.click();
    await waitForPageLoad(page);
    
    // 전투 시작
    await page.click('button:has-text("전투 시작")');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'battle-started');
    
    // 전투 UI 요소 확인
    const battleUI = page.locator('.battle-ui');
    await expect(battleUI).toBeVisible({ timeout: 10000 });
    
    // 액션 버튼들 확인
    const actionButtons = ['공격', '스킬', '아이템', '방어'];
    for (const action of actionButtons) {
      const button = page.locator(`button:has-text("${action}")`);
      await expect(button).toBeVisible();
    }
    
    // 기본 공격 실행
    await page.click('button:has-text("공격")');
    await page.waitForTimeout(2000); // 애니메이션 대기
    await takeScreenshot(page, 'battle-after-attack');
  });

  test('스킬 시스템 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure?tab=skill`);
    await waitForPageLoad(page);
    
    // 스킬 카드 확인
    const skillCards = page.locator('.skill-card');
    const skillCount = await skillCards.count();
    
    if (skillCount > 0) {
      // 첫 번째 스킬 상세 정보 확인
      await skillCards.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'skill-detail');
    }
  });

  test('인벤토리 및 장비 시스템 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure?tab=inventory`);
    await waitForPageLoad(page);
    
    // 장비 슬롯 확인
    const slots = ['weapon', 'armor', 'accessory1', 'accessory2'];
    for (const slot of slots) {
      const slotElement = page.locator(`[data-equipment-slot="${slot}"]`);
      await expect(slotElement).toBeVisible();
    }
    
    await takeScreenshot(page, 'inventory-equipment');
  });

  test('상점 시스템 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure?tab=shop`);
    await waitForPageLoad(page);
    
    // 상점 탭 확인
    const shopTabs = ['all', 'weapon', 'armor', 'consumable'];
    for (const tab of shopTabs) {
      const tabButton = page.locator(`button[data-shop-tab="${tab}"]`);
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    await takeScreenshot(page, 'shop-items');
  });
});

// 성능 테스트
test.describe('성능 및 최적화 검증', () => {
  test('페이지 로드 성능', async ({ page }) => {
    const metrics: Record<string, number> = {};
    
    // 각 주요 페이지의 로드 시간 측정
    const pages = [
      { path: '/', name: 'home' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/adventure', name: 'adventure' },
      { path: '/record', name: 'record' },
      { path: '/social', name: 'social' }
    ];
    
    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      metrics[pageInfo.name] = loadTime;
      console.log(`${pageInfo.name} 페이지 로드 시간: ${loadTime}ms`);
      
      // 3초 이내 로드 확인
      expect(loadTime).toBeLessThan(3000);
    }
  });

  test('메모리 누수 검사', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure`);
    
    // 초기 메모리 사용량
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 탭 전환 반복
    for (let i = 0; i < 10; i++) {
      await page.click('button[aria-label="퀘스트 탭"]');
      await page.waitForTimeout(500);
      await page.click('button[aria-label="던전 탭"]');
      await page.waitForTimeout(500);
    }
    
    // 최종 메모리 사용량
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 메모리 증가율 확인 (50% 이상 증가하지 않아야 함)
    const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
    console.log(`메모리 증가율: ${(memoryIncrease * 100).toFixed(2)}%`);
    expect(memoryIncrease).toBeLessThan(0.5);
  });
});