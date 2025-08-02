import { test, expect } from '@playwright/test'

test.describe('404 에러 디버깅', () => {
  test('네트워크 요청 로깅', async ({ page }) => {
    const failedRequests: string[] = []
    
    // 네트워크 요청 모니터링
    page.on('requestfailed', request => {
      console.error(`❌ Request failed: ${request.url()} - ${request.failure()?.errorText}`)
      failedRequests.push(request.url())
    })
    
    page.on('response', response => {
      if (response.status() === 404) {
        console.error(`❌ 404 Error: ${response.url()}`)
        failedRequests.push(response.url())
      }
    })
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`)
      }
    })
    
    // 홈페이지 로드
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    
    // 각 페이지로 이동해보기
    const testUrls = ['/dashboard', '/adventure', '/ai-coach', '/profile']
    for (const url of testUrls) {
      console.log(`\n=== ${url} 페이지 이동 중 ===`)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
    }
    
    // 실패한 요청 출력
    if (failedRequests.length > 0) {
      console.log('\n=== 404 에러 및 실패한 요청 ===')
      failedRequests.forEach(url => console.log(url))
      
      // 스크린샷 저장
      await page.screenshot({ path: 'screenshots/404-error-debug.png', fullPage: true })
    }
    
    // 페이지 소스 확인
    const pageContent = await page.content()
    console.log('\n=== 페이지 타이틀 ===')
    console.log(await page.title())
    
    // 현재 URL 확인
    console.log('\n=== 현재 URL ===')
    console.log(page.url())
    
    // 404 에러가 없어야 함
    expect(failedRequests.length).toBe(0)
  })
})