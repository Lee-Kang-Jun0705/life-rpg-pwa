import { test, expect } from '@playwright/test'

test.describe('🎯 던전 빠른 검증', () => {
  test('던전 페이지 기본 동작', async ({ page }) => {
    // 콘솔 에러 모니터링
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // 던전 페이지 접속
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/quick-test/dungeon-main.png',
      fullPage: true 
    })
    
    // 기본 UI 체크
    await expect(page.locator('h1').filter({ hasText: '던전' })).toBeVisible()
    
    // 던전 카드 체크
    const dungeonCards = await page.locator('[role="button"]').filter({ hasText: '입장' }).count()
    console.log(`던전 카드 수: ${dungeonCards}`)
    expect(dungeonCards).toBeGreaterThan(0)
    
    // 콘솔 에러 요약
    if (consoleErrors.length > 0) {
      console.log('❌ 콘솔 에러:', consoleErrors)
    } else {
      console.log('✅ 콘솔 에러 없음')
    }
  })
  
  test('던전 전투 시작', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 첫 번째 던전 입장
    const firstDungeon = page.locator('[role="button"]').filter({ hasText: '입장' }).first()
    await firstDungeon.click()
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(2000)
    
    // 전투 화면 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/quick-test/dungeon-battle.png',
      fullPage: true 
    })
    
    // 전투 UI 체크
    const exitButton = page.locator('button').filter({ hasText: /나가기|Exit/i })
    await expect(exitButton).toBeVisible({ timeout: 10000 })
    
    // 3초 대기 (자동전투 확인)
    await page.waitForTimeout(3000)
    
    // 나가기
    await exitButton.click()
    await expect(page).toHaveURL('/dungeon')
    
    // 콘솔 에러 결과
    console.log(`
📝 던전 전투 테스트 결과:
- 콘솔 에러: ${consoleErrors.length}개
- 전투 시작: 성공
- 나가기: 성공
`)
    
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
  })
})