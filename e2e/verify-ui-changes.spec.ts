import { test, expect } from '@playwright/test'

test.describe('UI 변경사항 확인', () => {
  test('대시보드 페이지 기본 동작 확인', async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('http://localhost:3000')
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 대시보드 기본 요소들 확인
    await expect(page.locator('text=Life RPG')).toBeVisible()
    
    // 스탯 카드들이 표시되는지 확인
    const statCards = page.locator('.bg-gradient-to-br')
    const statCount = await statCards.count()
    console.log(`대시보드에 ${statCount}개의 스탯 카드 발견`)
    
    // 네비게이션 바 확인
    await expect(page.locator('nav')).toBeVisible()
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true })
  })

  test('모험 페이지 스킬 탭 UI 확인', async ({ page }) => {
    // 모험 페이지 스킬 탭으로 이동
    await page.goto('http://localhost:3000/adventure?tab=skill')
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // 추가 대기
    
    // 스킬 관리 제목 확인
    await expect(page.locator('h2:has-text("스킬 관리")')).toBeVisible()
    
    // 스킬 포인트 표시 확인
    await expect(page.locator('text=스킬 포인트')).toBeVisible()
    
    // 장착 슬롯 확인
    const skillSlots = page.locator('[role="button"]').filter({ hasText: /슬롯 \d/ })
    const slotCount = await skillSlots.count()
    console.log(`${slotCount}개의 스킬 슬롯 발견`)
    
    // 스킬 카드 확인
    const skillCards = page.locator('.bg-gray-800.rounded-lg').filter({ has: page.locator('text=/Lv\\.\d+/') })
    const cardCount = await skillCards.count()
    console.log(`${cardCount}개의 스킬 카드 발견`)
    
    // 학습된 스킬 중 장착하기 버튼 찾기
    const equipButtons = page.locator('button:has-text("장착하기")')
    const equipButtonCount = await equipButtons.count()
    console.log(`${equipButtonCount}개의 장착하기 버튼 발견`)
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'skill-tab-screenshot.png', fullPage: true })
    
    // 첫 번째 빈 슬롯 클릭 테스트
    if (slotCount > 0) {
      const firstSlot = skillSlots.first()
      await firstSlot.click()
      await page.waitForTimeout(500)
      
      // 슬롯 선택 메시지 확인
      const slotMessage = page.locator('text=/슬롯 \d+에 장착할 스킬을 선택하세요/')
      if (await slotMessage.isVisible()) {
        console.log('슬롯 선택 메시지 표시됨')
      }
    }
    
    // 장착하기 버튼이 있으면 클릭 시도
    if (equipButtonCount > 0) {
      console.log('장착하기 버튼 클릭 시도')
      await equipButtons.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('모험 페이지 던전 탭 전투 UI 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    // 던전 탭으로 이동
    await page.goto('http://localhost:3000/adventure?tab=dungeon')
    await page.waitForLoadState('networkidle')
    
    // 던전 선택
    const firstDungeon = page.locator('.bg-gray-800').first()
    await firstDungeon.click()
    
    // 난이도 선택
    await page.click('button:has-text("보통")')
    
    // 던전 입장
    await page.click('button:has-text("던전 입장")')
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(3000)
    
    // 전투 UI 요소 확인
    const battleContainer = page.locator('.bg-gradient-to-b.from-blue-400.to-green-400')
    await expect(battleContainer).toBeVisible()
    
    // 플레이어 HP 확인
    const playerHP = page.locator('text=/HP.*\\//')
    await expect(playerHP).toBeVisible()
    
    // 몬스터 정보 확인
    const enemyLabel = page.locator('text=ENEMY')
    const isEnemyVisible = await enemyLabel.isVisible()
    console.log(`적 라벨 표시 여부: ${isEnemyVisible}`)
    
    // 몬스터 HP 수치 표시 확인
    const enemyHPText = page.locator('.bg-gradient-to-br.from-gray-50.to-gray-100').locator('text=/')
    const isEnemyHPVisible = await enemyHPText.isVisible()
    console.log(`몬스터 HP 수치 표시 여부: ${isEnemyHPVisible}`)
    
    // HP 수치 텍스트 가져오기
    if (isEnemyHPVisible) {
      const hpText = await enemyHPText.textContent()
      console.log(`몬스터 HP: ${hpText}`)
    }
    
    // z-index 확인을 위한 요소 위치 확인
    const playerInfo = page.locator('.bg-gradient-to-br.from-green-50.to-green-100')
    const enemyInfo = page.locator('.bg-gradient-to-br.from-gray-50.to-gray-100')
    
    const playerInfoVisible = await playerInfo.isVisible()
    const enemyInfoVisible = await enemyInfo.isVisible()
    
    console.log(`플레이어 정보 UI 표시: ${playerInfoVisible}`)
    console.log(`몬스터 정보 UI 표시: ${enemyInfoVisible}`)
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'battle-ui-screenshot.png', fullPage: true })
    
    // 콘솔 로그 출력
    console.log('\n=== 콘솔 로그 ===')
    consoleLogs.forEach(log => console.log(log))
  })
})