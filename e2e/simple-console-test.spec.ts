import { test, expect } from '@playwright/test'

test.describe('콘솔 에러 및 성능 테스트', () => {
  test('홈페이지 로딩 및 콘솔 에러 체크', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    // 콘솔 메시지 수집
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
        console.error('❌ Console Error:', text)
      } else if (msg.type() === 'warning' && !text.includes('Extra attributes from the server')) {
        consoleWarnings.push(text)
      }
    })
    
    // 페이지 에러 수집
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message)
      console.error('❌ Page Error:', error.message)
    })
    
    // 홈페이지 방문
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime
    
    console.log(`✅ 홈페이지 로딩 시간: ${loadTime}ms`)
    
    // 페이지가 제대로 로드되었는지 확인
    await expect(page.locator('text=Life RPG').first()).toBeVisible({ timeout: 10000 })
    
    // 네비게이션이 표시되는지 확인
    await expect(page.locator('nav').first()).toBeVisible()
    
    // 콘솔 에러 체크
    expect(consoleErrors).toHaveLength(0)
    
    // 로딩 시간 체크 (3초 이내)
    expect(loadTime).toBeLessThan(3000)
  })
  
  test('주요 페이지 순차 테스트', async ({ page }) => {
    const results = []
    const globalErrors: string[] = []
    
    // 전역 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        globalErrors.push(`${msg.location().url}: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', (error) => {
      globalErrors.push(`Page Error: ${error.message}`)
    })
    
    const pages = [
      { name: '대시보드', url: '/dashboard', selector: 'text=/Lv\\.|레벨/' },
      { name: '활동', url: '/activities', selector: 'text=/활동|기록/' },
      { name: '던전', url: '/dungeon', selector: 'text=/던전|탐험/' },
      { name: '상점', url: '/shop', selector: 'text=/상점|아이템/' },
      { name: '설정', url: '/settings', selector: 'text=/설정|환경/' }
    ]
    
    for (const pageInfo of pages) {
      const pageErrors: string[] = []
      const startTime = Date.now()
      
      try {
        await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 15000 })
        const loadTime = Date.now() - startTime
        
        // 페이지 콘텐츠 확인
        await page.waitForSelector(pageInfo.selector, { timeout: 5000 })
        
        results.push({
          page: pageInfo.name,
          url: pageInfo.url,
          loadTime: loadTime,
          status: 'SUCCESS',
          errors: pageErrors.length
        })
        
        console.log(`✅ ${pageInfo.name}: ${loadTime}ms`)
        
      } catch (error) {
        results.push({
          page: pageInfo.name,
          url: pageInfo.url,
          loadTime: Date.now() - startTime,
          status: 'FAILED',
          error: error.message
        })
        console.error(`❌ ${pageInfo.name}: ${error.message}`)
      }
      
      // 페이지 간 이동 시 약간의 대기
      await page.waitForTimeout(500)
    }
    
    // 결과 출력
    console.table(results)
    
    // 전역 에러가 없어야 함
    if (globalErrors.length > 0) {
      console.error('\n전체 콘솔 에러:')
      globalErrors.forEach(err => console.error(err))
    }
    
    expect(globalErrors).toHaveLength(0)
  })
  
  test('대시보드 기능 동작 테스트', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/dashboard')
    
    // 스탯 카드가 4개 표시되는지 확인
    const statCards = page.locator('[class*="stat"], [class*="card"]').filter({ 
      hasText: /건강|학습|관계|성취/ 
    })
    
    const cardCount = await statCards.count()
    console.log(`스탯 카드 개수: ${cardCount}`)
    
    // 최소 4개의 스탯이 표시되어야 함
    expect(cardCount).toBeGreaterThanOrEqual(4)
    
    // 활동 추가 버튼 찾기
    const addButtons = page.locator('button').filter({ hasText: /추가|새|활동/ })
    const buttonCount = await addButtons.count()
    
    if (buttonCount > 0) {
      // 첫 번째 버튼 클릭
      await addButtons.first().click()
      
      // 모달이나 입력 필드가 나타나는지 확인
      const inputAppeared = await page.locator('input[type="text"], textarea').first().isVisible({ timeout: 3000 }).catch(() => false)
      
      if (inputAppeared) {
        console.log('✅ 활동 추가 UI가 정상적으로 표시됨')
        
        // 닫기 버튼 찾아서 클릭
        const closeButton = page.locator('button').filter({ hasText: /취소|닫기|×|X/ }).first()
        if (await closeButton.count() > 0) {
          await closeButton.click()
        } else {
          // ESC 키로 닫기 시도
          await page.keyboard.press('Escape')
        }
      }
    }
    
    expect(consoleErrors).toHaveLength(0)
  })
  
  test('반응형 디자인 테스트', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')
      
      // 각 뷰포트에서 스크린샷
      await page.screenshot({ 
        path: `e2e/screenshots/responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      })
      
      console.log(`✅ ${viewport.name} 뷰포트 테스트 완료`)
    }
  })
})