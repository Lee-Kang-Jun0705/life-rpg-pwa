import { test, expect } from '@playwright/test'

test.describe('자동전투 디버깅', () => {
  test('콘솔 로그 상세 분석', async ({ page }) => {
    // 모든 콘솔 메시지 수집
    const consoleLogs: { type: string, text: string }[] = []
    
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text()
      }
      consoleLogs.push(logEntry)
      
      // 자동전투 관련 로그만 출력
      if (msg.text().includes('AutoBattle') || 
          msg.text().includes('BattleManager') ||
          msg.text().includes('전투') ||
          msg.text().includes('턴')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`)
      }
    })
    
    // 던전 페이지로 이동
    await page.goto('http://localhost:3005/adventure?tab=dungeon')
    await page.waitForTimeout(2000)
    
    // 초보자의 숲 선택
    await page.locator('text=/초보자의 숲/').first().click()
    await page.waitForTimeout(1000)
    
    // 전투 시작
    console.log('\n=== 전투 시작 버튼 클릭 ===')
    await page.locator('button:has-text("전투 시작")').first().click()
    await page.waitForTimeout(3000)
    
    // 전투 화면 요소 확인
    const battleUI = await page.locator('.battle-ui, [data-battle-ui], .bg-blue-100').first()
    const isVisible = await battleUI.isVisible()
    console.log(`전투 UI 표시: ${isVisible}`)
    
    // 자동전투 버튼 상태 확인
    const autoButton = await page.locator('text=/자동전투/').first()
    const autoButtonVisible = await autoButton.isVisible()
    console.log(`자동전투 버튼 표시: ${autoButtonVisible}`)
    
    // HP/MP 정보 확인
    const playerHP = await page.locator('text=/HP.*120/').first()
    if (await playerHP.isVisible()) {
      const hpText = await playerHP.textContent()
      console.log(`플레이어 HP: ${hpText}`)
    }
    
    // 10초 동안 전투 관찰
    console.log('\n=== 10초 동안 전투 관찰 ===')
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000)
      
      // 전투 로그 확인
      const logs = await page.locator('.text-xs').all()
      const lastLog = logs[logs.length - 1]
      if (lastLog) {
        const logText = await lastLog.textContent()
        if (logText && !logText.includes('전투 시작')) {
          console.log(`${i+1}초: ${logText}`)
        }
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/debug-final.png', 
      fullPage: true 
    })
    
    // 수집된 로그 분석
    console.log('\n=== 수집된 로그 분석 ===')
    console.log(`총 로그 수: ${consoleLogs.length}`)
    
    // 에러 로그만 출력
    const errors = consoleLogs.filter(log => log.type === 'error')
    if (errors.length > 0) {
      console.log('\n에러 로그:')
      errors.forEach(error => {
        console.log(`- ${error.text}`)
      })
    }
    
    // AutoBattleManager 관련 로그
    const autoBattleLogs = consoleLogs.filter(log => 
      log.text.includes('AutoBattleManager')
    )
    if (autoBattleLogs.length > 0) {
      console.log('\nAutoBattleManager 로그:')
      autoBattleLogs.forEach(log => {
        console.log(`- [${log.type}] ${log.text}`)
      })
    }
  })
})