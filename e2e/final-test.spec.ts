import { test, expect } from '@playwright/test'

test.describe('Life RPG PWA - 최종 테스트', () => {
  test('모든 페이지 콘솔 에러 없음 확인', async ({ page }) => {
    const errorLogs: string[] = []
    
    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // React의 일반적인 경고 무시
        if (!text.includes('Extra attributes from the server') && 
            !text.includes('Warning:') &&
            !text.includes('DevTools')) {
          errorLogs.push(`[${msg.location().url}] ${text}`)
        }
      }
    })
    
    page.on('pageerror', (error) => {
      errorLogs.push(`[Page Error] ${error.message}`)
    })
    
    const testPages = [
      { name: '대시보드', url: '/dashboard', waitFor: 'text=/레벨|Lv\\.|건강/' },
      { name: '활동', url: '/activities', waitFor: 'text=/활동|기록/' },
      { name: '던전', url: '/dungeon', waitFor: 'text=/던전/' },
      { name: '배틀', url: '/battle', waitFor: 'text=/배틀|전투/' },
      { name: '스킬', url: '/skills', waitFor: 'text=/스킬/' },
      { name: '인벤토리', url: '/inventory', waitFor: 'text=/인벤토리|가방/' },
      { name: '장비', url: '/equipment', waitFor: 'text=/장비|장착/' },
      { name: '상점', url: '/shop', waitFor: 'text=/상점|구매/' },
      { name: '업적', url: '/achievements', waitFor: 'text=/업적|달성/' },
      { name: '일일미션', url: '/daily', waitFor: 'text=/일일|미션|데일리/' },
      { name: '컬렉션', url: '/collection', waitFor: 'text=/컬렉션|수집/' },
      { name: '랭킹', url: '/ranking', waitFor: 'text=/랭킹|순위/' },
      { name: '리더보드', url: '/leaderboard', waitFor: 'text=/리더보드|순위표/' },
      { name: '프로필', url: '/profile', waitFor: 'text=/프로필|내 정보/' },
      { name: '설정', url: '/settings', waitFor: 'text=/설정|환경/' }
    ]
    
    console.log('🚀 테스트 시작...\n')
    
    for (const pageInfo of testPages) {
      const startTime = Date.now()
      
      try {
        await page.goto(pageInfo.url, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        })
        
        // 페이지 콘텐츠가 로드될 때까지 대기
        await page.waitForSelector(pageInfo.waitFor, { 
          timeout: 5000,
          state: 'visible' 
        })
        
        const loadTime = Date.now() - startTime
        
        // 성공
        console.log(`✅ ${pageInfo.name} - ${loadTime}ms`)
        
        // 성능 체크 (2초 이내)
        expect(loadTime).toBeLessThan(2000)
        
        // 페이지 간 이동 시 잠시 대기
        await page.waitForTimeout(300)
        
      } catch (error) {
        console.error(`❌ ${pageInfo.name} - 로드 실패: ${error.message}`)
        throw error
      }
    }
    
    // 최종 콘솔 에러 체크
    console.log('\n📊 콘솔 에러 체크...')
    if (errorLogs.length > 0) {
      console.error('\n발견된 콘솔 에러:')
      errorLogs.forEach(err => console.error(err))
    } else {
      console.log('✅ 콘솔 에러 없음!')
    }
    
    expect(errorLogs).toHaveLength(0)
  })
  
  test('대시보드 주요 기능 테스트', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 레벨 표시 확인
    const levelText = await page.locator('text=/Lv\\.|레벨/').first().isVisible()
    expect(levelText).toBeTruthy()
    
    // 4개 스탯 카드 확인
    const statNames = ['건강', '학습', '관계', '성취']
    for (const stat of statNames) {
      const statVisible = await page.locator(`text=${stat}`).first().isVisible()
      expect(statVisible).toBeTruthy()
    }
    
    console.log('✅ 대시보드 UI 요소 정상 표시')
  })
  
  test('페이지 로딩 성능 테스트', async ({ page }) => {
    const performanceResults = []
    
    const criticalPages = [
      { name: '대시보드', url: '/dashboard' },
      { name: '활동', url: '/activities' },
      { name: '던전', url: '/dungeon' },
      { name: '상점', url: '/shop' }
    ]
    
    for (const pageInfo of criticalPages) {
      const metrics = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'))
      })
      
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      const navTiming = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          domInteractive: nav.domInteractive - nav.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
        }
      })
      
      performanceResults.push({
        page: pageInfo.name,
        ...navTiming
      })
    }
    
    console.log('\n📊 성능 측정 결과:')
    console.table(performanceResults)
    
    // 모든 페이지가 2초 이내에 인터랙티브 상태가 되어야 함
    performanceResults.forEach(result => {
      expect(result.domInteractive).toBeLessThan(2000)
    })
  })
  
  test('반응형 디자인 테스트', async ({ page }) => {
    const viewports = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // 각 뷰포트에서 주요 요소가 표시되는지 확인
      const isResponsive = await page.locator('[class*="container"], [class*="wrapper"], main').first().isVisible()
      expect(isResponsive).toBeTruthy()
      
      console.log(`✅ ${viewport.name} 뷰포트 테스트 통과`)
    }
  })
})