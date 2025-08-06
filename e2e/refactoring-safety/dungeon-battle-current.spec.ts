import { test, expect } from '@playwright/test'

/**
 * DungeonBattleTab 현재 동작 검증 테스트
 * 리팩토링 전 기능이 정상 동작함을 보장
 */
test.describe('DungeonBattleTab - 현재 동작 검증', () => {
  test.beforeEach(async ({ page }) => {
    // 대시보드로 이동 후 모험 페이지로 이동
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 모험 버튼 클릭
    await page.click('nav a[href="/dungeon"]')
    await page.waitForSelector('[role="tablist"]')
    
    // 던전 탭 클릭
    await page.click('button[role="tab"]:has-text("던전")')
    await page.waitForTimeout(500) // 탭 전환 애니메이션 대기
  })

  test('던전 목록이 표시되어야 함', async ({ page }) => {
    // 던전 목록 확인
    await expect(page.locator('h2:has-text("던전 탐험")')).toBeVisible()
    
    // 난이도 선택 섹션 확인
    await expect(page.locator('h3:has-text("난이도 선택")')).toBeVisible()
    
    // 던전 카드들 확인
    const dungeonCards = page.locator('div[class*="grid"] > div[class*="bg-gray-800"]')
    await expect(dungeonCards).toHaveCount(3) // 초보자의 숲, 어둠의 동굴, 마법사의 탑
    
    // 각 던전 정보 확인
    await expect(page.locator('text=초보자의 숲')).toBeVisible()
    await expect(page.locator('text=어둠의 동굴')).toBeVisible()
    await expect(page.locator('text=마법사의 탑')).toBeVisible()
  })

  test('난이도 선택이 동작해야 함', async ({ page }) => {
    // 초기 상태는 중급(NORMAL)
    const normalButton = page.locator('button:has-text("중급")')
    await expect(normalButton).toHaveClass(/border-purple-500/)
    
    // 상급 난이도 선택
    await page.click('button:has-text("상급")')
    const hardButton = page.locator('button:has-text("상급")')
    await expect(hardButton).toHaveClass(/border-purple-500/)
    
    // 보상 배율 확인
    await expect(page.locator('text=보상: 150%')).toBeVisible()
  })

  test('던전 선택 및 진입이 동작해야 함', async ({ page }) => {
    // 초보자의 숲 클릭
    await page.click('div:has-text("초보자의 숲")')
    
    // 던전 진행 화면으로 전환 확인
    await expect(page.locator('h2:has-text("초보자의 숲")')).toBeVisible()
    await expect(page.locator('text=1층 / 5층')).toBeVisible()
    
    // 진행 상황 표시 확인
    await expect(page.locator('text=획득 골드')).toBeVisible()
    await expect(page.locator('text=획득 경험치')).toBeVisible()
    
    // 전투 시작 버튼 확인
    await expect(page.locator('button:has-text("전투 시작")')).toBeVisible()
  })

  test('전투 시작이 동작해야 함', async ({ page }) => {
    // 던전 선택
    await page.click('div:has-text("초보자의 숲")')
    await page.waitForSelector('button:has-text("전투 시작")')
    
    // 전투 시작
    await page.click('button:has-text("전투 시작")')
    
    // 로딩 상태 확인
    await expect(page.locator('text=준비 중...')).toBeVisible()
    
    // 전투 화면 전환 확인 (최대 5초 대기)
    await expect(page.locator('[data-testid="battle-screen"], .battle-screen')).toBeVisible({ timeout: 5000 })
    
    // 자동전투 UI 요소 확인
    const battleUI = page.locator('[data-testid="battle-screen"], .battle-screen').first()
    await expect(battleUI).toBeVisible()
  })

  test('던전 나가기가 동작해야 함', async ({ page }) => {
    // 던전 선택
    await page.click('div:has-text("초보자의 숲")')
    
    // X 버튼 클릭
    await page.click('button:has(svg.lucide-x)')
    
    // 던전 목록으로 돌아갔는지 확인
    await expect(page.locator('h2:has-text("던전 탐험")')).toBeVisible()
    await expect(page.locator('text=초보자의 숲')).toBeVisible()
  })

  test('캐릭터 레벨에 따른 던전 추천이 표시되어야 함', async ({ page }) => {
    // 각 던전의 권장 레벨 색상 확인
    const beginnerLevel = page.locator('div:has-text("초보자의 숲") span:has-text("Lv.1")')
    const caveLevel = page.locator('div:has-text("어둠의 동굴") span:has-text("Lv.5")')
    const towerLevel = page.locator('div:has-text("마법사의 탑") span:has-text("Lv.10")')
    
    // 레벨이 표시되는지 확인
    await expect(beginnerLevel).toBeVisible()
    await expect(caveLevel).toBeVisible()
    await expect(towerLevel).toBeVisible()
  })

  test('전투 중 자동전투가 동작해야 함', async ({ page }) => {
    // 던전 선택 및 전투 시작
    await page.click('div:has-text("초보자의 숲")')
    await page.click('button:has-text("전투 시작")')
    
    // 전투 화면 대기
    await page.waitForSelector('[data-testid="battle-screen"], .battle-screen', { timeout: 5000 })
    
    // 자동전투가 진행되는지 확인 (HP 변화 관찰)
    const initialHP = await page.locator('.enemy-hp, [data-testid="enemy-hp"]').first().textContent()
    
    // 3초 대기 후 HP 변화 확인
    await page.waitForTimeout(3000)
    
    const currentHP = await page.locator('.enemy-hp, [data-testid="enemy-hp"]').first().textContent()
    
    // HP가 변했거나 전투가 종료되었는지 확인
    const battleEnded = await page.locator('text=/승리|패배/').isVisible().catch(() => false)
    
    expect(initialHP !== currentHP || battleEnded).toBeTruthy()
  })

  test('전투 승리 시 보상이 표시되어야 함', async ({ page }) => {
    // 던전 선택 및 전투 시작
    await page.click('div:has-text("초보자의 숲")')
    await page.click('button:has-text("전투 시작")')
    
    // 전투 종료 대기 (최대 30초)
    await page.waitForSelector('text=/승리|패배/', { timeout: 30000 })
    
    // 승리한 경우 보상 확인
    const victoryText = await page.locator('text=승리').isVisible()
    if (victoryText) {
      // 골드/경험치 획득 확인
      const goldReward = page.locator('text=/\+\d+ 골드/').first()
      const expReward = page.locator('text=/\+\d+ 경험치/').first()
      
      // 보상이 표시되는지 확인 (하나라도 표시되면 성공)
      const hasReward = await goldReward.isVisible().catch(() => false) || 
                       await expReward.isVisible().catch(() => false)
      
      expect(hasReward).toBeTruthy()
    }
  })

  test('던전 진행도가 업데이트되어야 함', async ({ page }) => {
    // 던전 선택
    await page.click('div:has-text("초보자의 숲")')
    
    // 초기 진행도 확인
    await expect(page.locator('text=1층 / 5층')).toBeVisible()
    
    // 전투 시작
    await page.click('button:has-text("전투 시작")')
    
    // 전투 종료 대기
    await page.waitForSelector('text=/승리|패배/', { timeout: 30000 })
    
    // 승리한 경우
    const victoryText = await page.locator('text=승리').isVisible()
    if (victoryText) {
      // 다음 층으로 진행 또는 던전 클리어 메시지 확인
      await page.waitForTimeout(2000) // 전투 종료 애니메이션 대기
      
      const nextFloor = await page.locator('text=/2층 \/ 5층|던전 클리어/').isVisible()
      expect(nextFloor).toBeTruthy()
    }
  })
})

/**
 * 성능 벤치마크 테스트
 * 리팩토링 전후 성능 비교를 위한 기준값 측정
 */
test.describe('DungeonBattleTab - 성능 벤치마크', () => {
  test('던전 목록 로딩 시간 측정', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.click('nav a[href="/dungeon"]')
    await page.click('button[role="tab"]:has-text("던전")')
    
    // 던전 목록이 완전히 로드될 때까지 대기
    await page.waitForSelector('h2:has-text("던전 탐험")')
    await page.waitForSelector('div:has-text("초보자의 숲")')
    
    const loadTime = Date.now() - startTime
    
    // 로딩 시간 기록 (리팩토링 후 비교용)
    console.log(`Dungeon list load time: ${loadTime}ms`)
    
    // 3초 이내 로드되어야 함
    expect(loadTime).toBeLessThan(3000)
  })

  test('전투 시작 응답 시간 측정', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('nav a[href="/dungeon"]')
    await page.click('button[role="tab"]:has-text("던전")')
    await page.click('div:has-text("초보자의 숲")')
    
    const startTime = Date.now()
    await page.click('button:has-text("전투 시작")')
    
    // 전투 화면 로드 대기
    await page.waitForSelector('[data-testid="battle-screen"], .battle-screen', { timeout: 5000 })
    
    const battleStartTime = Date.now() - startTime
    
    console.log(`Battle start time: ${battleStartTime}ms`)
    
    // 2초 이내 시작되어야 함
    expect(battleStartTime).toBeLessThan(2000)
  })

  test('메모리 사용량 체크', async ({ page }) => {
    // Chrome DevTools Protocol을 통한 메모리 측정
    const client = await page.context().newCDPSession(page)
    await client.send('Performance.enable')
    
    // 던전 탭으로 이동
    await page.goto('/dashboard')
    await page.click('nav a[href="/dungeon"]')
    await page.click('button[role="tab"]:has-text("던전")')
    
    // 초기 메모리 측정
    const initialMetrics = await client.send('Performance.getMetrics')
    const initialMemory = initialMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0
    
    // 던전 진입 및 전투 시작
    await page.click('div:has-text("초보자의 숲")')
    await page.click('button:has-text("전투 시작")')
    await page.waitForTimeout(5000) // 전투 진행
    
    // 전투 후 메모리 측정
    const afterMetrics = await client.send('Performance.getMetrics')
    const afterMemory = afterMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0
    
    const memoryIncrease = (afterMemory - initialMemory) / 1024 / 1024 // MB로 변환
    
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`)
    
    // 메모리 증가량이 50MB 이하여야 함
    expect(memoryIncrease).toBeLessThan(50)
  })
})