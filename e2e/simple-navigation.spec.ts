import { test, expect } from '@playwright/test'

test.describe('간단한 네비게이션 테스트', () => {
  test('각 페이지 직접 접속', async ({ page }) => {
    // 에러 추적
    page.on('pageerror', error => {
      console.error('페이지 에러:', error.message)
    })
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('콘솔 에러:', msg.text())
      }
    })
    
    // 1. 루트 페이지
    console.log('=== 루트 페이지 테스트 ===')
    await page.goto('http://localhost:3005/')
    await page.waitForTimeout(1000)
    const rootTitle = await page.title()
    console.log('루트 타이틀:', rootTitle)
    
    // 2. 대시보드
    console.log('\n=== 대시보드 테스트 ===')
    await page.goto('http://localhost:3005/dashboard')
    await page.waitForTimeout(1000)
    const dashboardTitle = await page.title()
    console.log('대시보드 타이틀:', dashboardTitle)
    
    const dashboardError = await page.locator('text=/문제가 발생했습니다/').count()
    console.log('대시보드 에러:', dashboardError > 0 ? '있음' : '없음')
    
    // 3. 모험 페이지 (기본)
    console.log('\n=== 모험 페이지 테스트 ===')
    await page.goto('http://localhost:3005/adventure')
    await page.waitForTimeout(1000)
    
    const adventureError = await page.locator('text=/문제가 발생했습니다/').count()
    console.log('모험 페이지 에러:', adventureError > 0 ? '있음' : '없음')
    
    if (adventureError === 0) {
      // 탭 확인
      const tabs = await page.locator('button[role="tab"]').all()
      console.log('탭 개수:', tabs.length)
      
      for (const tab of tabs) {
        const text = await tab.textContent()
        console.log('탭:', text)
      }
    }
    
    // 4. 던전 탭 직접 접속
    console.log('\n=== 던전 탭 직접 접속 ===')
    await page.goto('http://localhost:3005/adventure?tab=dungeon')
    await page.waitForTimeout(2000)
    
    const dungeonError = await page.locator('text=/문제가 발생했습니다/').count()
    console.log('던전 탭 에러:', dungeonError > 0 ? '있음' : '없음')
    
    if (dungeonError === 0) {
      // 던전 카드 확인
      const cards = await page.locator('.bg-gray-800').all()
      console.log('던전 카드 개수:', cards.length)
      
      // 초보자의 숲 찾기
      const beginnerForest = await page.locator('text=/초보자의 숲/').count()
      console.log('초보자의 숲:', beginnerForest > 0 ? '있음' : '없음')
    }
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/simple-nav-final.png', 
      fullPage: true 
    })
  })
})