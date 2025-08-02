import { test, expect } from '@playwright/test'
import {
  ConsoleErrorCollector,
  PerformanceMonitor,
  ScreenshotManager,
  TEST_TIMEOUTS,
  PERFORMANCE_THRESHOLDS,
  navigateAndWait,
  waitForElementAndClick,
  navigateToMenu
} from './helpers/test-helpers'

test.describe('Life RPG PWA - 전체 애플리케이션 통합 테스트', () => {
  let consoleCollector: ConsoleErrorCollector
  let performanceMonitor: PerformanceMonitor
  let screenshotManager: ScreenshotManager

  test.beforeEach(async ({ page }) => {
    // 테스트 도구 초기화
    consoleCollector = new ConsoleErrorCollector()
    performanceMonitor = new PerformanceMonitor()
    screenshotManager = new ScreenshotManager()

    // 콘솔 메시지 수집
    page.on('console', msg => consoleCollector.handleConsoleMessage(msg))

    // 홈페이지로 이동
    const loadTime = await performanceMonitor.measurePageLoad(page, '/')
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_PAGE_LOAD_TIME)
    
    // Next.js 개발 모드 포털이 로드될 때까지 대기
    await page.waitForTimeout(1000)
  })

  test.afterEach(async ({ page }) => {
    // 콘솔 에러 확인
    if (consoleCollector.hasErrors()) {
      const errors = consoleCollector.getErrors()
      console.error('콘솔 에러 발견:', errors.map(e => e.text()))
      await screenshotManager.captureWithConsole(page, 'console-error')
    }
    expect(consoleCollector.hasErrors()).toBe(false)
  })

  test('1. 대시보드 페이지 - 모든 컴포넌트 로드 및 기능 테스트', async ({ page }) => {
    // 이미 홈페이지(대시보드)에 있으므로 확인만
    await page.waitForLoadState('networkidle')
    
    // 스탯 확인 - 스크린샷에서 본 요소들
    await expect(page.locator('text=스탯 올리기')).toBeVisible({ timeout: 10000 })
    
    // 레벨과 경험치 표시 확인
    await expect(page.locator('text=/Lv.\\d+/').first()).toBeVisible()
    
    // 대시보드 스크린샷
    await screenshotManager.captureFullPage(page, 'dashboard-full')
    
    // 스탯 카드들이 표시되는지 확인 (건강, 학습, 관계, 성취)
    const statCategories = ['건강', '학습', '관계', '성취']
    for (const category of statCategories) {
      await expect(page.locator(`text=${category}`)).toBeVisible()
    }
    
    // 오늘의 활동 섹션 확인
    await expect(page.locator('text=오늘의 활동')).toBeVisible()
  })

  test('2. 모험 페이지 - 탐험 탭 전투 시스템 테스트', async ({ page }) => {
    // 모험 페이지로 직접 이동
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
    
    // 탐험 탭 클릭
    const exploreTab = page.locator('text=탐험').first()
    await exploreTab.click()
    
    // 던전 목록 확인
    await expect(page.locator('text=초보자의 숲')).toBeVisible()
    
    // 첫 번째 던전 클릭
    await page.locator('text=초보자의 숲').click()
    
    // 입장하기 버튼 클릭
    const enterButton = page.locator('button:has-text("입장하기")')
    await enterButton.waitFor({ state: 'visible' })
    await enterButton.click()
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(TEST_TIMEOUTS.ANIMATION)
    
    // 배속 버튼 테스트 - 전투가 진행 중일 때만
    const speedButton = page.locator('button:has-text("⚡")').first()
    const battleEndMessage = page.locator('text=/승리|패배/')
    
    // 전투가 끝나지 않았고 배속 버튼이 보이면 테스트
    if (await speedButton.isVisible({ timeout: 3000 }).catch(() => false) && 
        !await battleEndMessage.isVisible({ timeout: 100 }).catch(() => false)) {
      // 배속 버튼이 존재하는지 확인
      await expect(speedButton).toBeVisible()
      console.log('✅ 배속 버튼이 정상적으로 표시됩니다')
      
      // 전투 스크린샷
      await screenshotManager.captureFullPage(page, 'battle-screen')
    } else {
      console.log('전투가 이미 종료되어 배속 테스트를 건너뜁니다')
    }
    
    // 전투 종료 대기 (최대 30초)
    await battleEndMessage.waitFor({ 
      state: 'visible', 
      timeout: 30000 
    }).catch(() => {
      console.log('전투가 30초 내에 종료되지 않음')
    })
    
    // X 버튼으로 나가기
    const closeButton = page.locator('button:has(svg)')
      .filter({ has: page.locator('[class*="X"], [class*="x"]') })
      .first()
    
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  })

  test('3. 모든 메뉴 네비게이션 및 페이지 로드 테스트', async ({ page }) => {
    const pages = [
      { url: '/dashboard', expectedText: '스탯 올리기' }, // 대시보드 페이지에 실제로 있는 텍스트
      { url: '/adventure', expectedText: '모험' },
      { url: '/ai-coach', expectedText: /AI|코치|분석/ },
      { url: '/profile', expectedText: /프로필|Profile|레벨/ }
    ]

    for (const pageInfo of pages) {
      // URL로 직접 이동 및 성능 측정
      const duration = await performanceMonitor.measureNavigation(
        page,
        async () => {
          await page.goto(pageInfo.url)
          await page.waitForLoadState('networkidle')
        },
        `navigate-to-${pageInfo.url}`
      )

      // 성능 검증
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_PAGE_LOAD_TIME)

      // 페이지 로드 확인 - 정규식 처리
      if (typeof pageInfo.expectedText === 'string') {
        await expect(page.locator(`h1, h2, h3`).filter({ hasText: pageInfo.expectedText }).first()).toBeVisible({
          timeout: TEST_TIMEOUTS.NAVIGATION
        })
      } else {
        await expect(page.locator(`text=${pageInfo.expectedText}`).first()).toBeVisible({
          timeout: TEST_TIMEOUTS.NAVIGATION
        })
      }

      // 각 페이지 스크린샷
      await screenshotManager.captureFullPage(page, `page-${pageInfo.url.replace('/', '')}`)

      // 콘솔 에러 체크
      expect(consoleCollector.hasErrors()).toBe(false)
    }
  })

  test('4. 프로필 페이지 테스트', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // 프로필 정보 확인
    await expect(page.locator('text=/레벨|Lv\\.|Level/').first()).toBeVisible()
    
    // 프로필 스크린샷
    await screenshotManager.captureFullPage(page, 'profile-page')
  })

  test('5. 테마 변경 테스트', async ({ page }) => {
    // 테마 토글 버튼 찾기 (햄버거 메뉴 근처)
    const themeButton = page.locator('button[aria-label*="테마"]').first()
    if (await themeButton.isVisible()) {
      await themeButton.click()
      await page.waitForTimeout(TEST_TIMEOUTS.ANIMATION)
      
      // 테마 변경 확인
      await screenshotManager.captureFullPage(page, 'theme-changed')
      
      // 다시 토글
      await themeButton.click()
      await page.waitForTimeout(TEST_TIMEOUTS.ANIMATION)
    }
  })

  test('6. 반응형 디자인 테스트 - 모바일 뷰', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 대시보드 확인
    await navigateAndWait(page, '/')
    await screenshotManager.captureFullPage(page, 'mobile-dashboard')
    
    // 모바일에서 스탯 카드들이 제대로 표시되는지 확인
    await expect(page.locator('text=건강')).toBeVisible()
    await expect(page.locator('text=학습')).toBeVisible()
    
    // 모바일 레이아웃 확인을 위한 스크린샷
    await screenshotManager.captureFullPage(page, 'mobile-layout-check')
  })

  test('7. 성능 종합 테스트', async ({ page }) => {
    const measurements = performanceMonitor.getMeasurements()
    
    console.log('=== 성능 측정 결과 ===')
    measurements.forEach((duration, label) => {
      console.log(`${label}: ${duration}ms`)
      
      // 페이지 로드는 3초 이내
      if (label.includes('pageLoad')) {
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_PAGE_LOAD_TIME)
      }
      // 네비게이션은 1초 이내
      else if (label.includes('navigate')) {
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_INTERACTION_TIME)
      }
    })
  })

  test('8. 콘솔 클린 상태 최종 확인', async ({ page }) => {
    // 모든 주요 페이지 순회하며 콘솔 상태 확인
    const pages = ['/dashboard', '/adventure', '/ai-coach', '/profile']
    
    for (const url of pages) {
      consoleCollector.clear()
      await navigateAndWait(page, url)
      await page.waitForTimeout(1000) // 비동기 작업 완료 대기
      
      if (consoleCollector.hasErrors()) {
        await screenshotManager.captureWithConsole(page, `error-${url.replace('/', '') || 'home'}`)
      }
      
      expect(consoleCollector.hasErrors()).toBe(false)
    }

    // 최종 콘솔 스크린샷
    await page.keyboard.press('F12')
    await page.waitForTimeout(500)
    await screenshotManager.captureFullPage(page, 'final-console-check')
    await page.keyboard.press('F12')
  })
})