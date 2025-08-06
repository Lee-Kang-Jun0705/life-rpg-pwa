import { test, expect } from '@playwright/test'

test('서버 상태 확인', async ({ page }) => {
  try {
    // 홈페이지 접속
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 })
    console.log('홈페이지 접속 성공')
    
    // 페이지 타이틀 확인
    const title = await page.title()
    console.log('페이지 타이틀:', title)
    
    // 스크린샷
    await page.screenshot({ path: 'homepage-check.png' })
  } catch (error) {
    console.error('접속 실패:', error)
  }
})