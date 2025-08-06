import { test, expect } from '@playwright/test'

test('Integration Layer 테스트 페이지 확인', async ({ page }) => {
  // 테스트 페이지로 이동
  await page.goto('/test-integration')
  await page.waitForTimeout(3000)
  
  // 페이지 스크린샷
  await page.screenshot({ path: 'test-results/integration-test-page.png', fullPage: true })
  
  // 상태 확인
  const statusText = await page.locator('pre').first().textContent()
  console.log('Integration Layer 상태:', statusText)
  
  // 콘솔 로그 확인
  const logs = await page.locator('.bg-gray-800').last().textContent()
  console.log('콘솔 로그:', logs)
  
  // 매니저 디버그 버튼 클릭
  await page.locator('button:has-text("매니저 디버그")').click()
  await page.waitForTimeout(1000)
  
  // 브라우저 콘솔 로그 수집
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
  })
  
  // gameManagers 확인
  const hasManagers = await page.evaluate(() => {
    return !!(window as any).gameManagers
  })
  
  console.log('gameManagers 존재 여부:', hasManagers)
  
  expect(hasManagers).toBe(true)
})