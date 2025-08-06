import { test, expect } from '@playwright/test'

test.describe('📝 마인 페이지 테스트', () => {
  test('각 주요 페이지 접속 및 에러 확인', async ({ page }) => {
    const errors: { page: string; error: string; type: string }[] = []
    
    // 콘솔 에러 리스너
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          page: page.url(),
          error: msg.text(),
          type: 'console'
        })
      }
    })
    
    page.on('pageerror', error => {
      errors.push({
        page: page.url(),
        error: error.message,
        type: 'pageerror'
      })
    })
    
    // 테스트할 페이지들
    const pages = [
      { path: '/', name: '홈' },
      { path: '/dashboard', name: '대시보드' },
      { path: '/dungeon', name: '던전' },
      { path: '/ai-coach', name: 'AI코치' },
      { path: '/profile', name: '프로필' }
    ]
    
    for (const pageInfo of pages) {
      await test.step(`${pageInfo.name} 페이지 테스트`, async () => {
        console.log(`\n📄 ${pageInfo.name} 페이지 테스트 시작...`)
        
        await page.goto(pageInfo.path)
        await page.waitForLoadState('networkidle')
        
        // 페이지 타이틀 확인
        const title = await page.title()
        console.log(`  타이틀: ${title}`)
        console.log(`  URL: ${page.url()}`)
        
        // 스크린샷
        await page.screenshot({ 
          path: `e2e/screenshots/main-test/${pageInfo.name}.png`,
          fullPage: true 
        })
        
        // 페이지별 기본 요소 확인
        switch (pageInfo.path) {
          case '/dashboard':
            // 스탯 카드 확인
            const statCards = page.locator('[class*="stat"]').first()
            await expect(statCards).toBeVisible({ timeout: 10000 })
            console.log('  ✅ 스탯 카드 확인')
            break
            
          case '/dungeon':
            // 던전 제목 확인
            const dungeonTitle = page.locator('h1').filter({ hasText: /던전/i }).first()
            await expect(dungeonTitle).toBeVisible({ timeout: 10000 })
            console.log('  ✅ 던전 타이틀 확인')
            break
            
          case '/ai-coach':
            // AI 코치 인터페이스 확인
            const aiInterface = page.locator('[class*="chat"], [class*="ai"], input, textarea').first()
            await expect(aiInterface).toBeVisible({ timeout: 10000 })
            console.log('  ✅ AI 코치 인터페이스 확인')
            break
            
          case '/profile':
            // 프로필 정보 확인
            const profileInfo = page.locator('[class*="profile"], h1').first()
            await expect(profileInfo).toBeVisible({ timeout: 10000 })
            console.log('  ✅ 프로필 정보 확인')
            break
        }
        
        // 2초 대기 (콘솔 에러 수집)
        await page.waitForTimeout(2000)
      })
    }
    
    // 결과 요약
    console.log('\n\n📊 테스트 결과 요약:')
    console.log(`- 테스트한 페이지: ${pages.length}개`)
    console.log(`- 발견된 에러: ${errors.length}개`)
    
    if (errors.length > 0) {
      console.log('\n❌ 에러 상세:')
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. [${err.type}] ${err.page}`)
        console.log(`   ${err.error}`)
      })
    } else {
      console.log('\n✅ 모든 페이지 정상 동작!')
    }
    
    // 에러가 있으면 테스트 실패
    expect(errors.length).toBe(0)
  })
})