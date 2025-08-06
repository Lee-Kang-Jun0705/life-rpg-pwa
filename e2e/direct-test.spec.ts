import { test, expect } from '@playwright/test'

test.describe('자동전투 직접 테스트', () => {
  test('대시보드에서 시작', async ({ page }) => {
    console.log('=== 테스트 시작 ===')
    
    // 대시보드로 직접 이동
    await page.goto('http://localhost:3005/dashboard')
    await page.waitForTimeout(2000)
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/direct-dashboard.png', 
      fullPage: true 
    })
    
    // 모험 링크 찾기
    const adventureLinks = await page.locator('a, button').all()
    for (const link of adventureLinks) {
      const text = await link.textContent()
      if (text && text.includes('모험')) {
        console.log('모험 링크 발견:', text)
        await link.click()
        break
      }
    }
    
    await page.waitForTimeout(2000)
    
    // URL 확인
    const url = page.url()
    console.log('현재 URL:', url)
    
    if (url.includes('adventure')) {
      console.log('모험 페이지 도착')
      
      // 던전 탭 클릭
      const dungeonTab = await page.locator('text=/던전/').first()
      if (await dungeonTab.isVisible()) {
        await dungeonTab.click()
        await page.waitForTimeout(1000)
      }
      
      // 초보자의 숲 찾기
      const dungeonCards = await page.locator('.bg-gray-800, .cursor-pointer').all()
      console.log('던전 카드 수:', dungeonCards.length)
      
      for (const card of dungeonCards) {
        const text = await card.textContent()
        if (text && text.includes('초보자의 숲')) {
          console.log('초보자의 숲 발견')
          await card.click()
          await page.waitForTimeout(1000)
          
          // 전투 시작 버튼
          const battleButton = await page.locator('button:has-text("전투 시작")').first()
          if (await battleButton.isVisible()) {
            console.log('전투 시작 버튼 클릭')
            await battleButton.click()
            await page.waitForTimeout(3000)
            
            // 최종 스크린샷
            await page.screenshot({ 
              path: 'e2e/screenshots/direct-battle.png', 
              fullPage: true 
            })
            
            // 전투 상태 확인
            const battleLog = await page.locator('.text-xs').all()
            if (battleLog.length > 0) {
              const lastLog = await battleLog[battleLog.length - 1].textContent()
              console.log('마지막 전투 로그:', lastLog)
            }
          }
          break
        }
      }
    }
  })
})