import { test, expect } from '@playwright/test'

test.describe('UI 변경사항 확인 (포트 3001)', () => {
  test('대시보드 페이지 접속 확인', async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('http://localhost:3001/dashboard')
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000)
    
    // 페이지 제목이나 기본 요소 확인
    const pageTitle = await page.title()
    console.log(`페이지 제목: ${pageTitle}`)
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'dashboard-3001.png', fullPage: true })
  })

  test('모험 페이지 던전 탭 전투 UI 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    // 던전 탭으로 직접 이동
    await page.goto('http://localhost:3001/adventure?tab=dungeon')
    await page.waitForTimeout(3000)
    
    // 페이지 내용 확인
    const pageContent = await page.content()
    const hasDungeonContent = pageContent.includes('던전') || pageContent.includes('Dungeon')
    console.log(`던전 콘텐츠 존재: ${hasDungeonContent}`)
    
    // 던전 선택 시도
    try {
      const dungeonCards = page.locator('.bg-gray-800')
      const dungeonCount = await dungeonCards.count()
      console.log(`던전 카드 수: ${dungeonCount}`)
      
      if (dungeonCount > 0) {
        // 첫 번째 던전 클릭
        await dungeonCards.first().click()
        await page.waitForTimeout(1000)
        
        // 난이도 선택
        const normalButton = page.locator('button:has-text("보통")')
        if (await normalButton.isVisible()) {
          await normalButton.click()
          console.log('보통 난이도 선택됨')
        }
        
        // 던전 입장 버튼 찾기
        const enterButton = page.locator('button:has-text("던전 입장")')
        if (await enterButton.isVisible()) {
          await enterButton.click()
          console.log('던전 입장 버튼 클릭')
          await page.waitForTimeout(3000)
          
          // 전투 화면 확인
          const battleScreen = page.locator('.bg-gradient-to-b.from-blue-400')
          if (await battleScreen.isVisible()) {
            console.log('전투 화면 표시됨')
            
            // 몬스터 HP 표시 확인
            const enemyHP = await page.locator('text=/\\d+\\/\\d+/').allTextContents()
            console.log('HP 표시:', enemyHP)
            
            // 적 정보 UI 확인
            const enemyInfo = page.locator('.bg-gradient-to-br.from-gray-50.to-gray-100')
            if (await enemyInfo.isVisible()) {
              console.log('적 정보 UI 표시됨')
              const enemyText = await enemyInfo.textContent()
              console.log('적 정보:', enemyText)
            }
          }
        }
      }
    } catch (error) {
      console.error('던전 테스트 중 에러:', error)
    }
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'dungeon-battle-3001.png', fullPage: true })
    
    // 콘솔 로그 출력
    console.log('\n=== 콘솔 로그 ===')
    consoleLogs.forEach(log => console.log(log))
  })

  test('모험 페이지 스킬 탭 확인', async ({ page }) => {
    // 스킬 탭으로 이동
    await page.goto('http://localhost:3001/adventure?tab=skill')
    await page.waitForTimeout(3000)
    
    // 스킬 관리 제목 확인
    const skillTitle = page.locator('h2:has-text("스킬 관리")')
    const hasSkillTitle = await skillTitle.isVisible()
    console.log(`스킬 관리 제목 표시: ${hasSkillTitle}`)
    
    // 장착하기 버튼 확인
    const equipButtons = page.locator('button:has-text("장착하기")')
    const equipCount = await equipButtons.count()
    console.log(`장착하기 버튼 수: ${equipCount}`)
    
    // 스킬 슬롯 확인
    const skillSlots = page.locator('button').filter({ hasText: /슬롯 \d/ })
    const slotCount = await skillSlots.count()
    console.log(`스킬 슬롯 수: ${slotCount}`)
    
    // 첫 번째 슬롯 클릭 테스트
    if (slotCount > 0) {
      await skillSlots.first().click()
      await page.waitForTimeout(500)
      
      const slotMessage = page.locator('text=/슬롯 \d+에 장착할 스킬을 선택하세요/')
      if (await slotMessage.isVisible()) {
        console.log('슬롯 선택 메시지 표시됨')
        
        // 장착하기 버튼이 있으면 클릭
        if (equipCount > 0) {
          await equipButtons.first().click()
          console.log('장착하기 버튼 클릭됨')
          await page.waitForTimeout(1000)
        }
      }
    }
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'skill-tab-3001.png', fullPage: true })
  })
})