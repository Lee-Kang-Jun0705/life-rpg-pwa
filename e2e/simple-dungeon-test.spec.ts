import { test, expect } from '@playwright/test'

test('던전 페이지 기본 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('/dungeon')
  
  // 스크린샷 캡처
  await page.screenshot({ path: 'dungeon-page.png' })
  
  // 기본 요소 확인
  const title = await page.locator('h1').first()
  console.log('Title text:', await title.textContent())
  
  // 던전 버튼들 확인
  const dungeonButtons = await page.locator('button').all()
  console.log('Button count:', dungeonButtons.length)
  
  for (const button of dungeonButtons) {
    const text = await button.textContent()
    console.log('Button:', text)
  }
  
  // 콘솔 에러 확인
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text())
    }
  })
  
  // 페이지 에러 확인
  page.on('pageerror', error => {
    console.error('Page error:', error.message)
  })
  
  // 5초 대기하여 에러 수집
  await page.waitForTimeout(5000)
})