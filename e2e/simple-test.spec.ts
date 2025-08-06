import { test, expect } from '@playwright/test'

test.describe('Life RPG 기본 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 모니터링
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[CONSOLE ERROR] ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`)
    })
  })

  test('대시보드 페이지 로드 확인', async ({ page }) => {
    await page.goto('http://localhost:3005')
    await page.waitForTimeout(3000) // 페이지 로드 대기
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'e2e/screenshots/dashboard-load.png', 
      fullPage: true 
    })
    
    // URL 확인
    const url = page.url()
    console.log('현재 URL:', url)
    expect(url).toContain('dashboard')
  })

  test('모험 페이지로 이동', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard')
    await page.waitForTimeout(2000)
    
    // 네비게이션 바 찾기
    const adventureLink = await page.locator('a[href="/adventure"], button:has-text("모험")').first()
    
    if (await adventureLink.isVisible()) {
      await adventureLink.click()
      await page.waitForTimeout(2000)
      
      // URL 확인
      expect(page.url()).toContain('/adventure')
      
      // 스크린샷
      await page.screenshot({ 
        path: 'e2e/screenshots/adventure-page.png', 
        fullPage: true 
      })
    } else {
      console.error('모험 링크를 찾을 수 없음')
    }
  })

  test('던전 탭 확인', async ({ page }) => {
    await page.goto('http://localhost:3005/adventure?tab=dungeon')
    await page.waitForTimeout(3000)
    
    // 던전 목록 확인
    const dungeonList = await page.locator('.bg-gray-800').first()
    
    await page.screenshot({ 
      path: 'e2e/screenshots/dungeon-tab.png', 
      fullPage: true 
    })
    
    if (await dungeonList.isVisible()) {
      console.log('던전 목록 표시됨')
      
      // 첫 번째 던전 클릭
      await dungeonList.click()
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: 'e2e/screenshots/dungeon-selected.png', 
        fullPage: true 
      })
    }
  })

  test('자동전투 테스트', async ({ page }) => {
    await page.goto('http://localhost:3005/adventure?tab=dungeon')
    await page.waitForTimeout(3000)
    
    // 던전 선택
    const firstDungeon = await page.locator('.bg-gray-800').first()
    if (await firstDungeon.isVisible()) {
      await firstDungeon.click()
      await page.waitForTimeout(2000)
      
      // 전투 시작 버튼
      const battleButton = await page.locator('button:has-text("전투 시작")').first()
      if (await battleButton.isVisible()) {
        await battleButton.click()
        await page.waitForTimeout(5000)
        
        // 전투 화면 스크린샷
        await page.screenshot({ 
          path: 'e2e/screenshots/battle-screen.png', 
          fullPage: true 
        })
        
        // 자동전투 확인
        const battleLog = await page.locator('.battle-log, .text-xs').first()
        if (await battleLog.isVisible()) {
          console.log('전투 로그 표시됨')
          const logText = await battleLog.textContent()
          console.log('전투 로그:', logText)
        }
      }
    }
  })
})