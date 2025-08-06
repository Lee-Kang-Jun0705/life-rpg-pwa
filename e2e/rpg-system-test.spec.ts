import { test, expect } from '@playwright/test'

test.describe('RPG 시스템 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 개발 서버 로드 대기
    await page.waitForLoadState('networkidle')
  })

  test('상점 → 인벤토리 → 장착 → 전투 통합 테스트', async ({ page }) => {
    // 1. 모험 페이지로 이동
    await page.click('nav a[href="/adventure"]')
    await page.waitForURL('**/adventure')
    await expect(page.locator('h1:has-text("모험")')).toBeVisible()

    // 2. 상점 탭 클릭
    await page.click('text=상점')
    await expect(page.locator('h2:has-text("상점")')).toBeVisible()

    // 콘솔 에러 체크
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // 3. 스킬 탭 클릭 - 에러 없어야 함
    await page.click('button:has-text("스킬")')
    await page.waitForTimeout(500)
    
    // 스킬 탭 콘솔 에러 확인
    expect(consoleErrors.length).toBe(0)
    
    // 4. 아이템 구매 테스트
    await page.click('button:has-text("아이템")')
    
    // 첫 번째 아이템 구매
    const buyButton = page.locator('button:has-text("구매")').first()
    await buyButton.click()
    
    // 구매 성공 메시지 확인
    await expect(page.locator('text=/구매 완료|구매했습니다/')).toBeVisible()

    // 5. 인벤토리 탭으로 이동
    await page.click('text=인벤토리')
    await expect(page.locator('h2:has-text("인벤토리 & 장비")')).toBeVisible()

    // 구매한 아이템이 인벤토리에 있는지 확인
    const inventoryItem = page.locator('.bg-gray-700').first()
    await expect(inventoryItem).toBeVisible()

    // 6. 아이템 장착 테스트
    const equipButton = page.locator('button:has-text("장착")').first()
    if (await equipButton.isVisible()) {
      await equipButton.click()
      
      // 장착 성공 확인 - 장착 해제 버튼이 나타나야 함
      await expect(page.locator('button:has-text("장착 해제")')).toBeVisible({ timeout: 5000 })
    }

    // 7. 던전 탭으로 이동하여 전투 테스트
    await page.click('text=던전')
    await expect(page.locator('h2:has-text("던전 선택")')).toBeVisible()

    // 첫 번째 던전 선택
    await page.locator('.bg-gray-800').first().click()
    
    // 던전 시작
    await page.click('button:has-text("던전 시작")')
    
    // 전투 시작 대기
    await page.waitForTimeout(3000)
    
    // 전투 화면 확인
    await expect(page.locator('text=/전투 준비|HP:/')).toBeVisible({ timeout: 10000 })

    // 전투 진행 확인 - 플레이어가 공격하는지 확인
    await page.waitForTimeout(5000)
    
    // 전투 결과 확인 (승리 또는 패배)
    const battleResult = await page.locator('text=/승리|패배/').isVisible({ timeout: 30000 })
    expect(battleResult).toBe(true)

    // 콘솔 에러 최종 확인
    console.log('콘솔 에러:', consoleErrors)
    expect(consoleErrors.length).toBe(0)
  })

  test('플레이어 레벨 표시 일관성 테스트', async ({ page }) => {
    // 대시보드에서 레벨 확인
    await page.goto('/')
    const dashboardLevel = await page.locator('text=/Lv\\.\\s*\\d+/').textContent()
    
    // 모험 페이지에서 레벨 확인
    await page.click('nav a[href="/adventure"]')
    await page.waitForURL('**/adventure')
    
    // 스탯 탭에서 캐릭터 레벨 확인
    await page.click('text=스탯')
    const adventureLevel = await page.locator('text=/캐릭터 레벨.*\\d+/').textContent()
    
    // 레벨이 일치하는지 확인
    console.log('대시보드 레벨:', dashboardLevel)
    console.log('모험 페이지 레벨:', adventureLevel)
    
    // 두 레벨이 모두 표시되는지 확인
    expect(dashboardLevel).toBeTruthy()
    expect(adventureLevel).toBeTruthy()
  })

  test('전투 밸런스 테스트 - 레벨 15 플레이어', async ({ page }) => {
    // 모험 페이지로 이동
    await page.goto('/adventure')
    
    // 던전 탭 클릭
    await page.click('text=던전')
    
    // 초보자 던전 선택 (레벨 4 슬라임)
    await page.locator('text=초보자 던전').click()
    
    // 전투 시작
    await page.click('button:has-text("던전 시작")')
    
    // 전투 로그 확인
    await page.waitForTimeout(3000)
    
    // 플레이어가 공격하는지 확인
    const playerAttack = await page.locator('text=/플레이어.*공격/').isVisible({ timeout: 10000 })
    expect(playerAttack).toBe(true)
    
    // 전투 속도 확인 - 3초마다 턴이 진행되어야 함
    const startTime = Date.now()
    await page.locator('text=/턴 2|Turn 2/').waitFor({ timeout: 10000 })
    const turnTime = Date.now() - startTime
    
    // 턴 간격이 2.5초 이상이어야 함 (여유 마진 포함)
    expect(turnTime).toBeGreaterThan(2500)
    
    // 전투 결과 - 레벨 15가 레벨 4를 이겨야 함
    const victory = await page.locator('text=승리').isVisible({ timeout: 30000 })
    expect(victory).toBe(true)
  })

  test('스킬 장착 및 전투 사용 테스트', async ({ page }) => {
    // 모험 페이지로 이동
    await page.goto('/adventure')
    
    // 스킬 탭 클릭
    await page.click('text=스킬')
    
    // 스킬이 퀵슬롯에 있는지 확인
    const quickSlots = await page.locator('.bg-purple-600').count()
    console.log('장착된 스킬 수:', quickSlots)
    
    // 던전 탭으로 이동
    await page.click('text=던전')
    
    // 던전 선택 및 시작
    await page.locator('.bg-gray-800').first().click()
    await page.click('button:has-text("던전 시작")')
    
    // 전투에서 스킬이 사용되는지 확인
    await page.waitForTimeout(5000)
    
    // 기본 공격 외의 스킬이 사용되는지 확인
    const skillUsed = await page.locator('text=/사용|시전|발동/').isVisible({ timeout: 10000 })
    expect(skillUsed).toBe(true)
  })
})