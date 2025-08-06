import { test, expect, ConsoleMessage } from '@playwright/test'

interface ConsoleError {
  page: string
  message: string
  type: string
  timestamp: Date
}

test.describe('Life RPG 전체 앱 테스트 - 콘솔 에러 검증', () => {
  const consoleErrors: ConsoleError[] = []
  
  test.beforeEach(async ({ page }) => {
    // 콘솔 메시지 모니터링
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({
          page: page.url(),
          message: msg.text(),
          type: msg.type(),
          timestamp: new Date()
        })
        console.log(`[${msg.type().toUpperCase()}] ${page.url()}: ${msg.text()}`)
      }
    })
    
    // 페이지 에러 모니터링
    page.on('pageerror', (error) => {
      consoleErrors.push({
        page: page.url(),
        message: error.message,
        type: 'pageerror',
        timestamp: new Date()
      })
      console.error(`[PAGE ERROR] ${page.url()}: ${error.message}`)
    })
    
    await page.goto('http://localhost:3005')
    await page.waitForLoadState('networkidle')
  })
  
  test.afterEach(async ({ page }) => {
    // 각 테스트 후 스크린샷 저장
    const testName = test.info().title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    await page.screenshot({ 
      path: `e2e/screenshots/${testName}-final.png`, 
      fullPage: true 
    })
  })

  test('1. 홈페이지 (대시보드) 기능 테스트', async ({ page }) => {
    console.log('=== 대시보드 테스트 시작 ===')
    
    // 대시보드 요소 확인
    await expect(page.locator('text=/대시보드|Dashboard/i')).toBeVisible()
    await expect(page.locator('text=/빠른 기록|Quick Record/i')).toBeVisible()
    await expect(page.locator('text=/일지 작성|Write Journal/i')).toBeVisible()
    
    // 캐릭터 정보 확인
    const characterLevel = await page.locator('text=/Lv\\./').textContent()
    console.log('캐릭터 레벨:', characterLevel)
    
    // 스탯 정보 확인
    const stats = ['건강', '학습', '관계', '성취']
    for (const stat of stats) {
      const statElement = await page.locator(`text=/${stat}/`).first()
      await expect(statElement).toBeVisible()
    }
    
    // 빠른 기록 버튼 클릭
    await page.click('text=/빠른 기록|Quick Record/i')
    await page.waitForTimeout(1000)
    
    // 모달이 열렸는지 확인
    const modal = await page.locator('.modal, [role="dialog"]').first()
    if (await modal.isVisible()) {
      console.log('빠른 기록 모달 열림')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
    
    await page.screenshot({ path: 'e2e/screenshots/dashboard-test.png', fullPage: true })
  })

  test('2. 모험 페이지 이동 및 기능 테스트', async ({ page }) => {
    console.log('=== 모험 페이지 테스트 시작 ===')
    
    // 모험 페이지로 이동
    await page.click('text=/모험|Adventure/i')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // URL 확인
    expect(page.url()).toContain('/adventure')
    
    // 탭 확인
    const tabs = ['던전', '상점', '인벤토리', '스킬']
    for (const tab of tabs) {
      const tabElement = await page.locator(`text=/${tab}/`).first()
      await expect(tabElement).toBeVisible()
      console.log(`${tab} 탭 확인됨`)
    }
    
    // 던전 탭 테스트
    await page.click('text=/던전/')
    await page.waitForTimeout(1000)
    
    // 던전 목록 확인
    const dungeonList = await page.locator('[data-dungeon-id], .dungeon-item').first()
    if (await dungeonList.isVisible()) {
      console.log('던전 목록 표시됨')
      
      // 첫 번째 던전 클릭
      await dungeonList.click()
      await page.waitForTimeout(1000)
      
      // 던전 입장 버튼 확인
      const enterButton = await page.locator('text=/입장|Enter/i').first()
      if (await enterButton.isVisible()) {
        console.log('던전 입장 버튼 확인됨')
      }
    }
    
    await page.screenshot({ path: 'e2e/screenshots/adventure-test.png', fullPage: true })
  })

  test('3. 프로필 페이지 이동 및 기능 테스트', async ({ page }) => {
    console.log('=== 프로필 페이지 테스트 시작 ===')
    
    // 프로필 페이지로 이동
    await page.click('text=/프로필|Profile/i')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // URL 확인
    expect(page.url()).toContain('/profile')
    
    // 프로필 요소 확인
    await expect(page.locator('text=/사용자 정보|User Info/i')).toBeVisible()
    
    // 통계 정보 확인
    const statsSection = await page.locator('text=/통계|Statistics/i').first()
    if (await statsSection.isVisible()) {
      console.log('통계 섹션 표시됨')
    }
    
    await page.screenshot({ path: 'e2e/screenshots/profile-test.png', fullPage: true })
  })

  test('4. 설정 페이지 이동 및 기능 테스트', async ({ page }) => {
    console.log('=== 설정 페이지 테스트 시작 ===')
    
    // 설정 페이지로 이동
    await page.click('text=/설정|Settings/i')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // URL 확인
    expect(page.url()).toContain('/settings')
    
    // 설정 항목 확인
    const settingItems = ['알림', '사운드', '언어', '테마']
    for (const item of settingItems) {
      const element = await page.locator(`text=/${item}/`).first()
      if (await element.isVisible()) {
        console.log(`${item} 설정 확인됨`)
      }
    }
    
    await page.screenshot({ path: 'e2e/screenshots/settings-test.png', fullPage: true })
  })

  test('5. 네비게이션 일관성 테스트', async ({ page }) => {
    console.log('=== 네비게이션 테스트 시작 ===')
    
    const pages = [
      { name: '대시보드', url: '/', selector: 'text=/대시보드|Dashboard/i' },
      { name: '모험', url: '/adventure', selector: 'text=/모험|Adventure/i' },
      { name: '프로필', url: '/profile', selector: 'text=/프로필|Profile/i' },
      { name: '설정', url: '/settings', selector: 'text=/설정|Settings/i' }
    ]
    
    for (const pageInfo of pages) {
      console.log(`${pageInfo.name} 페이지로 이동 중...`)
      
      await page.click(pageInfo.selector)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // URL 확인
      expect(page.url()).toContain(pageInfo.url)
      console.log(`✓ ${pageInfo.name} 페이지 URL 확인`)
      
      // 네비게이션 바가 항상 표시되는지 확인
      const nav = await page.locator('nav, [role="navigation"]').first()
      await expect(nav).toBeVisible()
      console.log(`✓ ${pageInfo.name} 페이지 네비게이션 표시`)
    }
  })

  test('6. 자동전투 시스템 테스트', async ({ page }) => {
    console.log('=== 자동전투 테스트 시작 ===')
    
    // 모험 페이지로 이동
    await page.goto('http://localhost:3005/adventure?tab=dungeon')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // 던전 목록 대기
    await page.waitForSelector('[data-dungeon-id], .dungeon-item', { timeout: 10000 })
    
    // 첫 번째 던전 클릭
    await page.click('[data-dungeon-id]:first-child, .dungeon-item:first-child')
    await page.waitForTimeout(1000)
    
    // 던전 입장
    await page.click('text=/입장|Enter/i')
    await page.waitForTimeout(2000)
    
    // 전투 화면 확인
    const battleUI = await page.locator('.battle-ui, [data-battle-ui]').first()
    if (await battleUI.isVisible()) {
      console.log('전투 화면 표시됨')
      
      // 자동전투 버튼 클릭
      const autoButton = await page.locator('text=/자동|Auto/i').first()
      if (await autoButton.isVisible()) {
        await autoButton.click()
        console.log('자동전투 시작')
        
        // 5초간 자동전투 진행 관찰
        await page.waitForTimeout(5000)
        
        // HP 변화 확인
        const hpText = await page.locator('text=/HP/').first().textContent()
        console.log('HP 상태:', hpText)
      }
    }
    
    await page.screenshot({ path: 'e2e/screenshots/auto-battle-test.png', fullPage: true })
  })

  test('7. 콘솔 에러 최종 검증', async ({ page }) => {
    console.log('=== 콘솔 에러 분석 ===')
    console.log(`총 ${consoleErrors.length}개의 에러/경고 발견`)
    
    // 에러 타입별 분류
    const errorsByType = consoleErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('에러 타입별 통계:', errorsByType)
    
    // 페이지별 에러 분류
    const errorsByPage = consoleErrors.reduce((acc, error) => {
      const pageName = error.page.split('/').pop() || 'home'
      acc[pageName] = (acc[pageName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('페이지별 에러 통계:', errorsByPage)
    
    // 주요 에러 패턴 분석
    const criticalErrors = consoleErrors.filter(error => 
      error.message.includes('Cannot read') ||
      error.message.includes('undefined') ||
      error.message.includes('null') ||
      error.message.includes('NaN') ||
      error.message.includes('TypeError')
    )
    
    if (criticalErrors.length > 0) {
      console.error('치명적인 에러 발견:')
      criticalErrors.forEach(error => {
        console.error(`- [${error.type}] ${error.page}: ${error.message}`)
      })
    }
    
    // 에러 리포트 생성
    const errorReport = {
      totalErrors: consoleErrors.length,
      criticalErrors: criticalErrors.length,
      errorsByType,
      errorsByPage,
      errors: consoleErrors
    }
    
    // 에러 리포트 저장
    await page.evaluate((report) => {
      console.log('=== 에러 리포트 ===')
      console.log(JSON.stringify(report, null, 2))
    }, errorReport)
    
    // 치명적인 에러가 없어야 함
    expect(criticalErrors.length).toBe(0)
  })
})