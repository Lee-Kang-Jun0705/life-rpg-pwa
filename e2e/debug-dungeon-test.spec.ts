import { test, expect } from '@playwright/test'

test.describe('🔍 던전 페이지 디버그', () => {
  test('던전 페이지 상세 분석', async ({ page }) => {
    // 콘솔 로그 모니터링
    const logs: { type: string; text: string }[] = []
    
    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() })
      console.log(`[${msg.type()}] ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      console.log('❌ 페이지 에러:', error.message)
    })
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()} - ${response.url()}`)
      }
    })
    
    console.log('\n📄 던전 페이지 접속 시도...')
    await page.goto('/dungeon', { waitUntil: 'networkidle' })
    
    // 페이지 정보
    console.log('\n📄 페이지 정보:')
    console.log('- URL:', page.url())
    console.log('- 타이틀:', await page.title())
    
    // HTML 내용 확인
    const bodyText = await page.locator('body').innerText()
    console.log('\n📄 페이지 내용:')
    console.log(bodyText.substring(0, 500) + '...')
    
    // 모든 h1 태그 찾기
    const h1Elements = await page.locator('h1').all()
    console.log(`\n📄 h1 태그 수: ${h1Elements.length}`)
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].innerText()
      console.log(`  - h1[${i}]: "${text}"`)
    }
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/debug/dungeon-debug.png',
      fullPage: true 
    })
    
    // 로듩 상태 확인
    const loading = page.locator('.animate-spin, [class*="loading"], [class*="Loading"]')
    const loadingCount = await loading.count()
    console.log(`\n📄 로듩 요소: ${loadingCount}개`)
    
    // 에러 메시지 확인
    const errorElements = page.locator('[class*="error"], [class*="Error"]')
    const errorCount = await errorElements.count()
    console.log(`\n📄 에러 요소: ${errorCount}개`)
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const text = await errorElements.nth(i).innerText()
        console.log(`  - 에러[${i}]: "${text}"`)
      }
    }
    
    // 모든 버튼 찾기
    const buttons = await page.locator('button').all()
    console.log(`\n📄 버튼 수: ${buttons.length}`)
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const text = await buttons[i].innerText()
      console.log(`  - 버튼[${i}]: "${text}"`)
    }
    
    // 콘솔 로그 요약
    console.log(`\n📄 콘솔 로그 요약:`)
    console.log(`- 총 로그: ${logs.length}개`)
    const errorLogs = logs.filter(log => log.type === 'error')
    console.log(`- 에러 로그: ${errorLogs.length}개`)
    if (errorLogs.length > 0) {
      errorLogs.slice(0, 5).forEach((log, i) => {
        console.log(`  ${i + 1}. ${log.text}`)
      })
    }
  })
})