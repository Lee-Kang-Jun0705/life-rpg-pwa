import { test, expect } from '@playwright/test'

test.describe('4개 주요 페이지 렌더링 테스트', () => {
  const BASE_URL = 'http://localhost:3003'

  test('대시보드 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 타이틀 확인
    await expect(page).toHaveTitle(/Dashboard|대시보드/i)
    
    // 주요 요소 확인
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/dashboard-page.png', fullPage: true })
    
    console.log('✅ 대시보드 페이지 정상 렌더링')
  })

  test('던전 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
    await page.goto(`${BASE_URL}/dungeon`)
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 타이틀 확인
    await expect(page).toHaveTitle(/Dungeon|던전/i)
    
    // 주요 요소 확인
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/dungeon-page.png', fullPage: true })
    
    console.log('✅ 던전 페이지 정상 렌더링')
  })

  test('AI코치 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`)
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 타이틀 확인
    await expect(page).toHaveTitle(/AI|Coach|코치/i)
    
    // 주요 요소 확인
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/ai-coach-page.png', fullPage: true })
    
    console.log('✅ AI코치 페이지 정상 렌더링')
  })

  test('프로필 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`)
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 타이틀 확인
    await expect(page).toHaveTitle(/Profile|프로필/i)
    
    // 주요 요소 확인 - 첫 번째 main 태그만 확인
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/profile-page.png', fullPage: true })
    
    console.log('✅ 프로필 페이지 정상 렌더링')
  })

  test('모든 페이지에서 에러가 없어야 함', async ({ page }) => {
    const errors: string[] = []
    
    // 콘솔 에러 리스너 설정
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // 각 페이지 방문
    const pages = ['/dashboard', '/dungeon', '/ai-coach', '/profile']
    
    for (const pageUrl of pages) {
      await page.goto(`${BASE_URL}${pageUrl}`)
      await page.waitForLoadState('networkidle')
    }
    
    // 에러가 없어야 함
    expect(errors).toHaveLength(0)
    
    if (errors.length === 0) {
      console.log('✅ 모든 페이지에서 에러 없음')
    }
  })
})