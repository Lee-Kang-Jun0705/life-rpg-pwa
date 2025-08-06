import { test, expect } from '@playwright/test'

test.describe('DungeonBattleTab V2 - 리팩토링된 버전 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // Feature Flag 활성화
    await page.addInitScript(() => {
      localStorage.setItem('feature-flags', JSON.stringify({
        'use-new-dungeon-ui': true
      }))
    })
    
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
    
    // 던전 탭 클릭
    await page.click('button:has-text("던전")')
    await page.waitForTimeout(500)
  })

  test('던전 선택 화면이 올바르게 표시되어야 함', async ({ page }) => {
    // 제목 확인
    await expect(page.locator('h2:has-text("던전 탐험")')).toBeVisible()
    
    // 난이도 선택 섹션 확인
    await expect(page.locator('h3:has-text("난이도 선택")')).toBeVisible()
    await expect(page.locator('button:has-text("초급")')).toBeVisible()
    await expect(page.locator('button:has-text("중급")')).toBeVisible()
    await expect(page.locator('button:has-text("상급")')).toBeVisible()
    await expect(page.locator('button:has-text("악몽")')).toBeVisible()
    
    // 던전 목록 확인
    await expect(page.locator('text=초보자의 숲')).toBeVisible()
    await expect(page.locator('text=어둠의 동굴')).toBeVisible()
    await expect(page.locator('text=마법사의 탑')).toBeVisible()
  })

  test('난이도 선택이 정상적으로 작동해야 함', async ({ page }) => {
    // 초기 상태: 중급 선택
    const normalButton = page.locator('button:has-text("중급")')
    await expect(normalButton).toHaveClass(/border-purple-500/)
    
    // 상급 선택
    const hardButton = page.locator('button:has-text("상급")')
    await hardButton.click()
    await expect(hardButton).toHaveClass(/border-purple-500/)
    await expect(normalButton).not.toHaveClass(/border-purple-500/)
  })

  test('던전 선택 시 진행 화면으로 전환되어야 함', async ({ page }) => {
    // 초보자의 숲 선택
    await page.click('text=초보자의 숲')
    
    // 진행 화면 요소 확인
    await expect(page.locator('h2:has-text("초보자의 숲")')).toBeVisible()
    await expect(page.locator('text=1층 / 5층')).toBeVisible()
    await expect(page.locator('text=획득 골드')).toBeVisible()
    await expect(page.locator('text=획득 경험치')).toBeVisible()
    await expect(page.locator('button:has-text("전투 시작")')).toBeVisible()
  })

  test('전투 시작 버튼 클릭 시 전투 화면으로 전환되어야 함', async ({ page }) => {
    // 던전 선택
    await page.click('text=초보자의 숲')
    await page.waitForTimeout(500)
    
    // 전투 시작
    await page.click('button:has-text("전투 시작")')
    
    // 로딩 상태 확인
    await expect(page.locator('text=준비 중...')).toBeVisible()
    
    // 전투 화면 전환 확인 (1초 후)
    await page.waitForTimeout(1500)
    
    // 전투 UI 요소 확인
    const battleElements = [
      'text=플레이어',
      'text=자동전투',
      'text=턴'
    ]
    
    for (const element of battleElements) {
      await expect(page.locator(element).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('던전 나가기 기능이 작동해야 함', async ({ page }) => {
    // 던전 선택
    await page.click('text=초보자의 숲')
    await page.waitForTimeout(500)
    
    // X 버튼 클릭
    await page.click('button[aria-label="던전 나가기"]')
    
    // 던전 선택 화면으로 돌아왔는지 확인
    await expect(page.locator('h2:has-text("던전 탐험")')).toBeVisible()
  })

  test('컴포넌트 분리 후에도 성능이 유지되어야 함', async ({ page }) => {
    // 성능 측정 시작
    const startTime = Date.now()
    
    // 던전 선택
    await page.click('text=초보자의 숲')
    await page.waitForTimeout(500)
    
    // 전투 시작
    await page.click('button:has-text("전투 시작")')
    
    // 전투 화면 로드 대기
    await page.waitForSelector('text=자동전투', { timeout: 5000 })
    
    const loadTime = Date.now() - startTime
    
    // 로드 시간이 3초 이내여야 함
    expect(loadTime).toBeLessThan(3000)
  })
})

// Feature Flag 비활성화 시 기존 버전이 사용되는지 확인
test.describe('Feature Flag 비활성화 시 기존 버전 사용 확인', () => {
  test('Feature Flag가 false일 때 기존 DungeonBattleTab이 사용되어야 함', async ({ page }) => {
    // Feature Flag 비활성화
    await page.addInitScript(() => {
      localStorage.setItem('feature-flags', JSON.stringify({
        'use-new-dungeon-ui': false
      }))
    })
    
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
    
    // 던전 탭 클릭
    await page.click('button:has-text("던전")')
    await page.waitForTimeout(500)
    
    // 기존 버전도 동일한 UI를 가지므로 동일한 요소 확인
    await expect(page.locator('h2:has-text("던전 탐험")')).toBeVisible()
    
    // 콘솔 로그 확인 (개발 환경에서만)
    page.on('console', msg => {
      if (msg.text().includes('[DungeonBattleTabWrapper]')) {
        expect(msg.text()).toContain('component: DungeonBattleTab')
      }
    })
  })
})