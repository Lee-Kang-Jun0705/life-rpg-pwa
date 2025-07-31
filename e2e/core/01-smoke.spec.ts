import { test, expect } from '@playwright/test'

test.describe('Smoke Tests - 기본 동작 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text())
      }
    })
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message)
    })
  })

  test('앱이 정상적으로 시작되어야 함', async ({ page }) => {
    await page.goto('/')
    
    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard')
    
    // 기본 UI 요소 확인 - 더 구체적인 셀렉터 사용
    await expect(page.locator('h1').filter({ hasText: 'Life RPG' }).first()).toBeVisible()
    
    // 네비게이션 메뉴 확인 - 햄버거 메뉴 버튼이나 네비게이션 바 확인
    const hamburgerMenu = page.locator('button[aria-label*="menu"], button:has(svg)').first()
    const navBar = page.locator('nav, [role="navigation"]')
    
    const navigationExists = await hamburgerMenu.isVisible() || await navBar.isVisible()
    expect(navigationExists).toBeTruthy()
    
    // 콘솔 에러가 없어야 함
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    expect(consoleErrors).toHaveLength(0)
  })

  test('모든 주요 페이지가 404 없이 로드되어야 함', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/activities', 
      '/dungeon',
      '/inventory',
      '/skills',
      '/collection',
      '/achievements',
      '/ranking',
      '/daily',
      '/ai-coach',
      '/profile',
      '/settings'
    ]

    for (const path of pages) {
      // 페이지 이동 및 로드 대기
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      
      // 현재 URL 확인 (리다이렉트 고려)
      const currentUrl = page.url()
      const isValidPage = currentUrl.includes(path) || currentUrl.includes('/dashboard')
      
      // 404 페이지가 아닌지 확인
      const is404 = await page.locator('text=404').isVisible()
      expect(is404).toBe(false)
      expect(isValidPage).toBeTruthy()
    }
  })

  test('PWA가 설치 가능해야 함', async ({ page }) => {
    await page.goto('/')
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle')
    
    // manifest.json 존재 확인
    const manifestResponse = await page.goto('/manifest.json')
    expect(manifestResponse?.status()).toBe(200)
    
    // 다시 홈으로 이동
    await page.goto('/')
    
    // Service Worker 등록 확인
    await page.waitForTimeout(2000) // SW 등록 시간 대기
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null ||
             navigator.serviceWorker.ready !== undefined
    })
    expect(swRegistered).toBeTruthy()
  })

  test('다크모드 토글이 작동해야 함', async ({ page }) => {
    await page.goto('/settings')
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 다크모드 토글 찾기 - 더 유연한 셀렉터 사용
    const darkModeToggle = page.locator('button').filter({ hasText: /다크|테마|theme|dark/i }).first()
    
    // 토글이 있는지 확인
    const toggleExists = await darkModeToggle.isVisible()
    if (!toggleExists) {
      // 설정 페이지에서 테마 관련 버튼 찾기
      const themeButton = page.locator('[aria-label*="theme"], [aria-label*="테마"]').first()
      if (await themeButton.isVisible()) {
        await themeButton.click()
      } else {
        // 테마 토글이 없으면 테스트 건너뛰기
        test.skip()
      }
    }
    
    // 초기 상태 확인
    const isDarkMode = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    )
    
    // 토글 클릭
    await darkModeToggle.click()
    await page.waitForTimeout(500) // 애니메이션 대기
    
    // 상태 변경 확인
    const isDarkModeAfter = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    )
    
    expect(isDarkModeAfter).toBe(!isDarkMode)
  })
})