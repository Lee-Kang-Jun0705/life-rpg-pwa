import { test, expect } from '@playwright/test'

test.describe('네비게이션 디버그', () => {
  test('하단 네비게이션 요소 찾기', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard')
    await page.waitForTimeout(2000)
    
    // 모든 nav 요소 찾기
    const navs = await page.locator('nav').all()
    console.log(`nav 요소 수: ${navs.length}`)
    
    // 하단에 고정된 nav 찾기
    const fixedNavs = await page.locator('nav.fixed').all()
    console.log(`고정된 nav 요소 수: ${fixedNavs.length}`)
    
    // 아이콘을 포함한 요소 찾기
    const icons = await page.locator('[class*="lucide"]').all()
    console.log(`아이콘 수: ${icons.length}`)
    
    // 직접 경로로 이동
    console.log('=== 직접 경로로 모험 페이지 이동 ===')
    await page.goto('http://localhost:3005/adventure')
    await page.waitForTimeout(2000)
    
    // 모험 페이지 확인
    const url = page.url()
    console.log(`현재 URL: ${url}`)
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/nav-debug-adventure.png', 
      fullPage: true 
    })
  })
})