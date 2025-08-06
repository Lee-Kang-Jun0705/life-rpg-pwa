import { test, expect } from '@playwright/test'

test.describe('🏠 홈페이지 접속 테스트', () => {
  test('홈페이지 접속 및 네비게이션 확인', async ({ page }) => {
    // 콘솔 에러 모니터링
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('❌ 콘솔 에러:', msg.text())
      }
    })
    
    page.on('pageerror', error => {
      console.log('❌ 페이지 에러:', error.message)
    })

    // 홈페이지 접속
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/simple-test/01-home.png',
      fullPage: true 
    })
    
    // 네비게이션 메뉴 열기
    const navToggle = page.locator('button[aria-label="메뉴 열기"]')
    if (await navToggle.isVisible()) {
      await navToggle.click()
      await page.waitForTimeout(500)
      
      // 네비게이션 바 스크린샷
      await page.screenshot({ 
        path: 'e2e/screenshots/simple-test/02-nav-open.png'
      })
      
      // 각 페이지 방문
      const pages = [
        { href: '/dashboard', name: '대시보드' },
        { href: '/dungeon', name: '던전' },
        { href: '/ai-coach', name: 'AI코치' },
        { href: '/profile', name: '프로필' }
      ]
      
      for (const pageInfo of pages) {
        console.log(`\n📄 ${pageInfo.name} 페이지 테스트...`)
        
        const link = page.locator(`a[href="${pageInfo.href}"]`).first()
        if (await link.isVisible()) {
          await link.click()
          await page.waitForLoadState('networkidle')
          
          console.log(`✅ ${pageInfo.name} 페이지 접속 성공`)
          console.log(`   URL: ${page.url()}`)
          
          // 페이지별 스크린샷
          await page.screenshot({ 
            path: `e2e/screenshots/simple-test/page-${pageInfo.name}.png`,
            fullPage: true 
          })
          
          // 콘솔창 스크린샷 (F12)
          await page.keyboard.press('F12')
          await page.waitForTimeout(1000)
          await page.screenshot({ 
            path: `e2e/screenshots/simple-test/console-${pageInfo.name}.png`,
            fullPage: true 
          })
          await page.keyboard.press('F12')
          
          // 다음 페이지를 위해 네비게이션 다시 열기
          const navToggleAgain = page.locator('button[aria-label="메뉴 열기"]')
          if (await navToggleAgain.isVisible()) {
            await navToggleAgain.click()
            await page.waitForTimeout(300)
          }
        }
      }
    }
    
    // 최종 결과
    console.log(`\n\n📊 테스트 결과 요약:\n`)
    console.log(`- 총 콘솔 에러: ${consoleErrors.length}개`)
    if (consoleErrors.length > 0) {
      console.log('\n에러 목록:')
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
  })
})