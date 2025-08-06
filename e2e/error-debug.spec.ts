import { test, expect } from '@playwright/test'

test.describe('에러 디버깅', () => {
  test('에러 원인 파악', async ({ page }) => {
    // 모든 에러 캐치
    page.on('pageerror', error => {
      console.error('페이지 에러:', error.message)
      console.error('스택:', error.stack)
    })
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('콘솔 에러:', msg.text())
      }
    })
    
    // 루트 페이지로 이동
    console.log('=== 루트 페이지 접속 시도 ===')
    const response = await page.goto('http://localhost:3005/', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    })
    
    console.log('응답 상태:', response?.status())
    console.log('응답 URL:', response?.url())
    
    // 페이지 타이틀 확인
    const title = await page.title()
    console.log('페이지 타이틀:', title)
    
    // body 내용 확인
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('Body 내용 (처음 100자):', bodyText.substring(0, 100))
    
    // 에러 메시지가 있는지 확인
    const errorMessage = await page.locator('text=/문제가 발생했습니다/').count()
    console.log('에러 메시지 존재:', errorMessage > 0)
    
    if (errorMessage > 0) {
      // 개발 환경이므로 상세 에러 정보 확인
      const details = await page.locator('details').first()
      if (await details.isVisible()) {
        await details.click()
        await page.waitForTimeout(500)
        
        const errorDetails = await page.locator('pre').first().textContent()
        console.log('\n=== 상세 에러 정보 ===')
        console.log(errorDetails)
      }
    }
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/error-debug.png', 
      fullPage: true 
    })
    
    // 네트워크 에러 확인
    console.log('\n=== 네트워크 요청 확인 ===')
    page.on('request', request => {
      if (request.failure()) {
        console.log('실패한 요청:', request.url(), request.failure())
      }
    })
    
    // 대시보드로 직접 이동 시도
    console.log('\n=== 대시보드 직접 접속 ===')
    await page.goto('http://localhost:3005/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    })
    
    await page.waitForTimeout(2000)
    
    const dashboardError = await page.locator('text=/문제가 발생했습니다/').count()
    console.log('대시보드 에러:', dashboardError > 0)
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/dashboard-error-debug.png', 
      fullPage: true 
    })
  })
})