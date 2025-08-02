import { test, expect } from '@playwright/test'

test('개발 서버 동작 확인', async ({ page }) => {
  // 서버가 동작하는지 확인
  const response = await page.goto('http://localhost:3000', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  })
  
  expect(response?.status()).toBe(200)
  
  // HTML이 로드되는지 확인
  const htmlContent = await page.content()
  console.log('HTML Length:', htmlContent.length)
  
  // React 앱이 마운트되었는지 확인
  await page.waitForSelector('#__next', { timeout: 5000 })
  
  // 스크린샷 저장
  await page.screenshot({ path: 'e2e/screenshots/dev-server-check.png' })
})