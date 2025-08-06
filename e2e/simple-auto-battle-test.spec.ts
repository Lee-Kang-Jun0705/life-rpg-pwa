import { test, expect } from '@playwright/test'

test.describe('간단한 자동전투 테스트', () => {
  test('자동전투 진행 확인', async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('브라우저 콘솔:', msg.text())
      }
    })
    
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 일반 던전 클릭
    await page.locator('button').filter({ hasText: '일반 던전' }).click()
    console.log('던전 입장')
    
    // 10초 동안 전투 진행 관찰
    await page.waitForTimeout(10000)
    
    // 현재 스테이지 확인
    const stageText = await page.locator('h2').textContent()
    console.log('최종 스테이지:', stageText)
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/auto-battle-debug.png',
      fullPage: true 
    })
  })
})