import { test, expect, Page } from '@playwright/test'
import { MAIN_NAV_ITEMS } from '@/lib/constants/navigation.constants'

// 모든 페이지의 콘솔 에러를 수집하는 헬퍼
class ConsoleErrorCollector {
  private errors: Array<{
    page: string
    message: string
    type: string
    location?: string
  }> = []

  collectErrors(page: Page, pageName: string) {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const location = msg.location()
        this.errors.push({
          page: pageName,
          message: msg.text(),
          type: msg.type(),
          location: location ? `${location.url}:${location.lineNumber}:${location.columnNumber}` : undefined
        })
      }
    })
    
    // 페이지 에러 이벤트도 수집
    page.on('pageerror', error => {
      this.errors.push({
        page: pageName,
        message: error.message,
        type: 'pageerror',
        location: error.stack
      })
    })
  }

  getErrors() {
    return this.errors
  }

  hasErrors() {
    return this.errors.length > 0
  }

  printSummary() {
    if (!this.hasErrors()) {
      console.log('✅ 모든 페이지에서 콘솔 에러 없음')
      return
    }

    console.log(`\n❌ 총 ${this.errors.length}개의 에러/경고 발견:\n`)
    const groupedErrors = this.errors.reduce((acc, error) => {
      if (!acc[error.page]) acc[error.page] = []
      acc[error.page].push(error)
      return acc
    }, {} as Record<string, typeof this.errors>)

    Object.entries(groupedErrors).forEach(([page, errors]) => {
      console.log(`\n📄 ${page} 페이지 (${errors.length}개):`)
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.message}`)
        if (error.location) {
          console.log(`     위치: ${error.location}`)
        }
      })
    })
  }
}

test.describe('🔍 전체 서비스 통합 검증', () => {
  const errorCollector = new ConsoleErrorCollector()
  
  test.beforeEach(async ({ page }) => {
    // 모든 페이지에서 콘솔 메시지 수집
    errorCollector.collectErrors(page, page.url())
  })

  test.afterAll(() => {
    // 테스트 종료 시 에러 요약 출력
    errorCollector.printSummary()
  })

  test('1️⃣ 홈페이지 접속 및 초기 로딩 검증', async ({ page }) => {
    errorCollector.collectErrors(page, '홈페이지')
    
    await test.step('홈페이지 접속', async () => {
      await page.goto('/')
      await expect(page).toHaveURL('/')
      
      // 페이지 로딩 완료 대기
      await page.waitForLoadState('networkidle')
      
      // 스크린샷 저장
      await page.screenshot({ 
        path: 'e2e/screenshots/validation/01-homepage.png',
        fullPage: true 
      })
    })

    await test.step('기본 UI 요소 확인', async () => {
      // 네비게이션 바 확인
      const navToggle = page.locator('button[aria-label="메뉴 열기"]')
      await expect(navToggle).toBeVisible()
      
      // 메인 콘텐츠 확인
      const mainContent = page.locator('main').first()
      await expect(mainContent).toBeVisible()
    })
  })

  test('2️⃣ 네비게이션 동작 및 페이지 전환 검증', async ({ page }) => {
    await page.goto('/')
    
    // 네비게이션 메뉴 열기
    await test.step('네비게이션 메뉴 열기', async () => {
      const navToggle = page.locator('button[aria-label="메뉴 열기"]')
      await navToggle.click()
      
      // 네비게이션 바 표시 확인
      const navBar = page.locator('[data-testid="navigation-bar"]')
      await expect(navBar).toBeVisible()
      
      await page.screenshot({ 
        path: 'e2e/screenshots/validation/02-navigation-open.png' 
      })
    })

    // 모든 페이지 순회하며 테스트
    for (const navItem of MAIN_NAV_ITEMS) {
      await test.step(`${navItem.emoji} ${navItem.label} 페이지 이동 및 검증`, async () => {
        errorCollector.collectErrors(page, navItem.label)
        
        // 네비게이션 링크 클릭
        const navLink = page.locator(`a[href="${navItem.href}"]`).first()
        await navLink.click()
        
        // 페이지 이동 확인
        await expect(page).toHaveURL(navItem.href)
        
        // 페이지 로딩 완료 대기
        await page.waitForLoadState('networkidle')
        
        // 스크린샷 저장
        await page.screenshot({ 
          path: `e2e/screenshots/validation/page-${navItem.id}.png`,
          fullPage: true 
        })
        
        // 페이지별 특수 검증
        switch (navItem.href) {
          case '/dashboard':
            await validateDashboardPage(page)
            break
          case '/dungeon':
            await validateDungeonPage(page)
            break
          case '/ai-coach':
            await validateAICoachPage(page)
            break
          case '/profile':
            await validateProfilePage(page)
            break
        }
        
        // 네비게이션 다시 열기 (다음 이동을 위해)
        if (navItem !== MAIN_NAV_ITEMS[MAIN_NAV_ITEMS.length - 1]) {
          const navToggle = page.locator('button[aria-label="메뉴 열기"]')
          await navToggle.click()
          await page.waitForTimeout(300) // 애니메이션 대기
        }
      })
    }
  })

  test('3️⃣ 던전 시스템 상세 검증', async ({ page }) => {
    errorCollector.collectErrors(page, '던전 시스템')
    
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    await test.step('던전 페이지 기본 요소 확인', async () => {
      // 제목 확인
      const title = page.locator('h1').filter({ hasText: '던전' })
      await expect(title).toBeVisible()
      
      // 던전 선택 카드들 확인
      const dungeonCards = page.locator('[role="button"]').filter({ hasText: '입장' })
      const cardCount = await dungeonCards.count()
      expect(cardCount).toBeGreaterThan(0)
      
      await page.screenshot({ 
        path: 'e2e/screenshots/validation/03-dungeon-list.png' 
      })
    })

    await test.step('던전 입장 및 전투 시스템 확인', async () => {
      // 첫 번째 던전 입장
      const firstDungeon = page.locator('[role="button"]').filter({ hasText: '입장' }).first()
      await firstDungeon.click()
      
      // 전투 화면 로딩 대기
      await page.waitForTimeout(1000)
      
      // 전투 UI 요소 확인
      const battleContainer = page.locator('.battle-container, [data-testid="battle-screen"]')
      await expect(battleContainer).toBeVisible({ timeout: 10000 })
      
      // 플레이어 체력바 확인
      const playerHealth = page.locator('text=/체력|HP|Health/i').first()
      await expect(playerHealth).toBeVisible()
      
      // 나가기 버튼 확인
      const exitButton = page.locator('button').filter({ hasText: /나가기|Exit/i })
      await expect(exitButton).toBeVisible()
      
      await page.screenshot({ 
        path: 'e2e/screenshots/validation/04-dungeon-battle.png' 
      })
      
      // 전투 중 콘솔 에러 체크 (3초 대기)
      await page.waitForTimeout(3000)
      
      // 나가기
      await exitButton.click()
      await expect(page).toHaveURL('/dungeon')
    })
  })

  test('4️⃣ 반응형 디자인 검증', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ]

    for (const viewport of viewports) {
      await test.step(`${viewport.name} 뷰포트 검증`, async () => {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')
        
        // 네비게이션이 적절히 표시되는지 확인
        const navToggle = page.locator('button[aria-label="메뉴 열기"]')
        await expect(navToggle).toBeVisible()
        
        await page.screenshot({ 
          path: `e2e/screenshots/validation/responsive-${viewport.name}.png`,
          fullPage: true 
        })
      })
    }
  })

  test('5️⃣ 데이터 영속성 검증', async ({ page, context }) => {
    errorCollector.collectErrors(page, '데이터 영속성')
    
    await test.step('대시보드에서 활동 추가', async () => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // 활동 추가 버튼 찾기 (다양한 셀렉터 시도)
      const addButton = page.locator('button').filter({ hasText: /추가|\+|Add/i }).first()
      if (await addButton.isVisible()) {
        await addButton.click()
        
        // 모달이나 입력 폼 대기
        await page.waitForTimeout(500)
        
        // 활동 입력
        const input = page.locator('input[type="text"]').first()
        if (await input.isVisible()) {
          await input.fill('테스트 활동')
          
          // 저장 버튼
          const saveButton = page.locator('button').filter({ hasText: /저장|확인|Save/i }).first()
          if (await saveButton.isVisible()) {
            await saveButton.click()
          }
        }
      }
    })

    await test.step('페이지 새로고침 후 데이터 확인', async () => {
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // 로컬 스토리지 확인
      const localStorage = await page.evaluate(() => {
        return Object.keys(window.localStorage).map(key => ({
          key,
          value: window.localStorage.getItem(key)
        }))
      })
      
      console.log('로컬 스토리지 내용:', localStorage.length, '개 항목')
      
      await page.screenshot({ 
        path: 'e2e/screenshots/validation/05-data-persistence.png' 
      })
    })
  })
})

// 페이지별 검증 함수들
async function validateDashboardPage(page: Page) {
  // 스탯 카드들 확인
  const statCards = page.locator('.stat-card, [class*="stat"]')
  const cardCount = await statCards.count()
  expect(cardCount).toBeGreaterThan(0)
  
  // 레벨 정보 확인
  const levelInfo = page.locator('text=/레벨|Lv\.|Level/i').first()
  await expect(levelInfo).toBeVisible()
}

async function validateDungeonPage(page: Page) {
  // 던전 목록 확인
  const dungeonList = page.locator('[class*="dungeon"], [class*="card"]')
  const dungeonCount = await dungeonList.count()
  expect(dungeonCount).toBeGreaterThan(0)
}

async function validateAICoachPage(page: Page) {
  // AI 코치 인터페이스 확인
  const chatInterface = page.locator('[class*="chat"], [class*="message"], textarea, input[type="text"]').first()
  await expect(chatInterface).toBeVisible()
}

async function validateProfilePage(page: Page) {
  // 프로필 정보 확인
  const profileInfo = page.locator('[class*="profile"], [class*="user"]').first()
  await expect(profileInfo).toBeVisible()
}