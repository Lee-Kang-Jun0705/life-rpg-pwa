import { test } from '@playwright/test'

test('디버그 - 페이지 로드 확인', async ({ page }) => {
  // 네트워크 요청 로깅
  page.on('request', request => {
    console.log('요청:', request.url())
  })
  
  page.on('response', response => {
    console.log('응답:', response.url(), response.status())
  })
  
  // 콘솔 로그 수집
  page.on('console', msg => {
    console.log('콘솔:', msg.type(), msg.text())
  })
  
  // 페이지 에러 수집
  page.on('pageerror', error => {
    console.log('페이지 에러:', error.message)
  })
  
  console.log('대시보드 페이지로 이동 시작...')
  const response = await page.goto('/dashboard', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  })
  
  console.log('응답 상태:', response?.status())
  
  // 페이지 타이틀 확인
  const title = await page.title()
  console.log('페이지 타이틀:', title)
  
  // 페이지 URL 확인
  console.log('현재 URL:', page.url())
  
  // body 내용 확인
  const bodyText = await page.locator('body').textContent()
  console.log('Body 텍스트 (처음 200자):', bodyText?.substring(0, 200))
  
  // 스크린샷 저장
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true })
  
  // 대기
  await page.waitForTimeout(5000)
})