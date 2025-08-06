import { test, expect, Page } from '@playwright/test';
import path from 'path';

// 테스트 설정
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'comprehensive-validation-v2');

// 헬퍼 함수들
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // 애니메이션 완료 대기
}

async function openNavigation(page: Page) {
  // 메뉴 버튼 클릭
  const menuButton = page.locator('button[aria-label="메뉴 열기"]');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.waitForTimeout(500); // 애니메이션 대기
  }
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true
  });
}

// 메인 테스트 스위트
test.describe('Life RPG PWA - 포괄적 앱 검증 V2', () => {
  test.beforeAll(async () => {
    // 스크린샷 디렉토리 생성
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('대시보드와 모험 페이지 레벨 연동 확인', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 콘솔 에러 모니터링
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Next.js 개발 모드 에러는 무시
        if (!text.includes('Warning:') && !text.includes('Download the React DevTools')) {
          consoleErrors.push(`[${new Date().toISOString()}] ${text}`);
        }
      }
    });

    // 1. 홈페이지 접속
    console.log('1. 홈페이지 접속');
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    await takeScreenshot(page, '01-homepage');

    // 2. 대시보드로 이동
    console.log('2. 대시보드 페이지로 이동');
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForPageLoad(page);
    await takeScreenshot(page, '02-dashboard');

    // 스탯 레벨 추출
    const statsData = await page.evaluate(() => {
      const stats: Record<string, number> = {};
      
      // 각 스탯 카드에서 레벨 추출
      const statCards = document.querySelectorAll('.bg-gray-800\\/50.rounded-xl.p-6');
      statCards.forEach(card => {
        const levelText = card.querySelector('.text-2xl')?.textContent;
        const levelMatch = levelText?.match(/Lv\.(\d+)/);
        if (levelMatch) {
          const statType = card.querySelector('.text-red-400, .text-blue-400, .text-green-400, .text-yellow-400')?.textContent;
          if (statType?.includes('건강')) stats.health = parseInt(levelMatch[1]);
          else if (statType?.includes('학습')) stats.learning = parseInt(levelMatch[1]);
          else if (statType?.includes('관계')) stats.relationship = parseInt(levelMatch[1]);
          else if (statType?.includes('성취')) stats.achievement = parseInt(levelMatch[1]);
        }
      });
      
      return stats;
    });

    console.log('대시보드 스탯:', statsData);
    const totalDashboardLevel = Object.values(statsData).reduce((sum, level) => sum + level, 0);
    console.log('대시보드 총 레벨:', totalDashboardLevel);

    // 3. 모험 페이지로 이동
    console.log('3. 모험 페이지로 이동');
    await page.goto(`${BASE_URL}/adventure`);
    await waitForPageLoad(page);
    await takeScreenshot(page, '03-adventure');

    // 캐릭터 레벨 확인
    const characterLevelElement = await page.locator('span:has-text("Lv.")').first();
    const characterLevelText = await characterLevelElement.textContent();
    const characterLevel = parseInt(characterLevelText?.match(/Lv\.(\d+)/)?.[1] || '0');
    console.log('모험 페이지 캐릭터 레벨:', characterLevel);

    // 레벨 연동 검증
    if (characterLevel === totalDashboardLevel) {
      console.log('✅ 레벨 연동 성공: 대시보드 레벨과 모험 페이지 레벨이 일치합니다.');
    } else {
      console.log('❌ 레벨 연동 실패: 대시보드 레벨(' + totalDashboardLevel + ')과 모험 페이지 레벨(' + characterLevel + ')이 일치하지 않습니다.');
    }
    expect(characterLevel).toBe(totalDashboardLevel);

    // 콘솔 에러 확인
    console.log(`\n콘솔 에러: ${consoleErrors.length}개`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => console.log(error));
    }
  });

  test('모험 페이지 모든 탭 기능 테스트', async ({ page }) => {
    await page.goto(`${BASE_URL}/adventure`);
    await waitForPageLoad(page);

    const tabs = [
      { id: 'quest', label: '퀘스트' },
      { id: 'dungeon', label: '탐험' },
      { id: 'inventory', label: '인벤토리' },
      { id: 'skill', label: '스킬' },
      { id: 'shop', label: '상점' },
      { id: 'achievement', label: '도전과제' }
    ];

    for (const tab of tabs) {
      console.log(`\n${tab.label} 탭 테스트`);
      
      // 탭 버튼 클릭
      const tabButton = page.locator(`button:has-text("${tab.label}")`).first();
      await tabButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `tab-${tab.id}`);

      // 탭 컨텐츠 확인
      const tabContent = page.locator(`[role="tabpanel"]`).first();
      await expect(tabContent).toBeVisible();

      // 탭별 특수 테스트
      if (tab.id === 'dungeon') {
        console.log('  - 던전 목록 확인');
        const dungeonCards = page.locator('.bg-gray-800.rounded-lg.p-6');
        const dungeonCount = await dungeonCards.count();
        console.log(`  - 던전 개수: ${dungeonCount}`);
        
        if (dungeonCount > 0) {
          // 첫 번째 던전 클릭
          await dungeonCards.first().click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, 'dungeon-selected');
          
          // 전투 시작 버튼 확인
          const battleButton = page.locator('button:has-text("전투 시작")');
          const isVisible = await battleButton.isVisible();
          console.log(`  - 전투 시작 버튼: ${isVisible ? '표시됨' : '표시 안됨'}`);
          
          // 나가기
          const exitButton = page.locator('button[aria-label="나가기"], button:has(svg.w-6.h-6)').first();
          if (await exitButton.isVisible()) {
            await exitButton.click();
            await page.waitForTimeout(500);
          }
        }
      }

      if (tab.id === 'inventory') {
        console.log('  - 인벤토리 장비 슬롯 확인');
        const equipmentSlots = page.locator('.equipment-slot, [data-equipment-slot]');
        const slotCount = await equipmentSlots.count();
        console.log(`  - 장비 슬롯 수: ${slotCount}`);
      }

      if (tab.id === 'skill') {
        console.log('  - 스킬 목록 확인');
        const skillElements = page.locator('.skill-card, .bg-gray-800.rounded-lg.p-4');
        const skillCount = await skillElements.count();
        console.log(`  - 스킬 수: ${skillCount}`);
      }

      if (tab.id === 'shop') {
        console.log('  - 상점 아이템 확인');
        const shopItems = page.locator('.shop-item, .bg-gray-800.rounded-lg');
        const itemCount = await shopItems.count();
        console.log(`  - 상점 아이템 수: ${itemCount}`);
      }
    }
  });

  test('페이지 간 네비게이션 테스트', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 메뉴 열기
    await openNavigation(page);

    const navItems = [
      { href: '/dashboard', label: '대시보드' },
      { href: '/adventure', label: '모험' },
      { href: '/record', label: '기록' },
      { href: '/social', label: '소셜' },
      { href: '/settings', label: '설정' }
    ];

    for (const item of navItems) {
      console.log(`\n${item.label} 페이지로 이동`);
      
      // 네비게이션이 닫혀있으면 다시 열기
      const nav = page.locator('[aria-label="메인 네비게이션"]');
      if (!await nav.isVisible()) {
        await openNavigation(page);
      }

      // 링크 클릭
      const link = page.locator(`a[href="${item.href}"]`).first();
      await link.click();
      await waitForPageLoad(page);
      
      // URL 확인
      await expect(page).toHaveURL(new RegExp(item.href));
      console.log(`  - URL 확인: ${page.url()}`);
      
      await takeScreenshot(page, `nav-${item.label}`);
    }
  });

  test('전투 시스템 기능 테스트', async ({ page }) => {
    // 던전 탭으로 직접 이동
    await page.goto(`${BASE_URL}/adventure?tab=dungeon`);
    await waitForPageLoad(page);

    console.log('던전 전투 시스템 테스트');
    
    // 난이도 선택 확인
    const difficultyButtons = page.locator('button:has-text("초급"), button:has-text("중급"), button:has-text("상급"), button:has-text("악몽")');
    const difficultyCount = await difficultyButtons.count();
    console.log(`난이도 옵션 수: ${difficultyCount}`);

    // 첫 번째 던전 선택
    const dungeonCard = page.locator('.bg-gray-800.rounded-lg.p-6.cursor-pointer').first();
    if (await dungeonCard.isVisible()) {
      await dungeonCard.click();
      await page.waitForTimeout(1000);
      
      // 전투 시작
      const battleButton = page.locator('button:has-text("전투 시작")');
      if (await battleButton.isVisible()) {
        console.log('전투 시작 버튼 클릭');
        await battleButton.click();
        await page.waitForTimeout(2000);
        
        // 전투 UI 확인
        const battleActions = ['공격', '스킬', '아이템', '방어'];
        for (const action of battleActions) {
          const actionButton = page.locator(`button:has-text("${action}")`);
          const isVisible = await actionButton.isVisible();
          console.log(`  - ${action} 버튼: ${isVisible ? '표시됨' : '표시 안됨'}`);
        }
        
        await takeScreenshot(page, 'battle-ui');
      }
    }
  });

  test('콘솔 에러 및 성능 모니터링', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const performanceMetrics: Record<string, number> = {};

    // 콘솔 모니터링
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('Warning:')) {
        errors.push(text);
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      }
    });

    // 페이지 에러 모니터링
    page.on('pageerror', (error) => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });

    // 주요 페이지 순회
    const pages = [
      '/dashboard',
      '/adventure',
      '/record',
      '/social',
      '/settings'
    ];

    for (const path of pages) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${path}`);
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      performanceMetrics[path] = loadTime;
      console.log(`${path} 로드 시간: ${loadTime}ms`);
    }

    // 결과 출력
    console.log('\n=== 최종 검사 결과 ===');
    console.log(`에러: ${errors.length}개`);
    console.log(`경고: ${warnings.length}개`);
    
    if (errors.length > 0) {
      console.log('\n발견된 에러:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    // 성능 기준 확인 (3초 이내)
    const slowPages = Object.entries(performanceMetrics).filter(([_, time]) => time > 3000);
    if (slowPages.length > 0) {
      console.log('\n느린 페이지:');
      slowPages.forEach(([page, time]) => console.log(`  - ${page}: ${time}ms`));
    }

    // 에러가 없어야 함
    expect(errors.length).toBe(0);
  });
});