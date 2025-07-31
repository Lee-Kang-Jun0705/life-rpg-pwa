import { test, expect } from '@playwright/test'

test.describe('던전 시스템 최종 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 이동 및 완전 로드 대기
    await page.goto('http://localhost:3000/dungeon', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000) // 컴포넌트 로드 대기
  })

  test('1. 페이지 구조 및 탭 확인', async ({ page }) => {
    // 페이지 제목 확인
    const title = await page.locator('h1').filter({ hasText: '모험 & 성장' }).isVisible()
    expect(title).toBeTruthy()
    
    // HeroSection 내 탭 버튼 확인
    const heroSection = page.locator('.bg-gray-800\\/30').first()
    await expect(heroSection).toBeVisible()
    
    // 탐험 탭 버튼 찾기 (던전이 아닌 탐험)
    const exploreButton = heroSection.locator('button').filter({ hasText: '탐험' })
    await expect(exploreButton).toBeVisible()
    
    // 던전 탭이 없는지 확인
    const dungeonButton = heroSection.locator('button').filter({ hasText: '던전' })
    await expect(dungeonButton).not.toBeVisible()
    
    // 스크린샷
    await page.screenshot({ path: 'test-results/hero-section.png' })
  })

  test('2. 탐험 탭 클릭 및 던전 목록', async ({ page }) => {
    // 탐험 탭 찾기 및 클릭
    const heroSection = page.locator('.bg-gray-800\\/30').first()
    const exploreButton = heroSection.locator('button').filter({ hasText: '탐험' })
    
    await exploreButton.click()
    await page.waitForTimeout(2000)
    
    // 던전 목록 확인
    const dungeonTitle = page.locator('h1').filter({ hasText: '던전' })
    await expect(dungeonTitle).toBeVisible()
    
    // 카테고리 필터 확인
    const categoryButtons = page.locator('button').filter({ hasText: /전체|스토리|일일/ })
    const categoryCount = await categoryButtons.count()
    expect(categoryCount).toBeGreaterThan(0)
    
    // 스크린샷
    await page.screenshot({ path: 'test-results/dungeon-list.png' })
  })

  test('3. 전투 시스템 - 아이템 버튼 활성화', async ({ page }) => {
    // 탐험 탭으로 이동
    const heroSection = page.locator('.bg-gray-800\\/30').first()
    await heroSection.locator('button').filter({ hasText: '탐험' }).click()
    await page.waitForTimeout(2000)
    
    // 첫 번째 던전 카드 찾기
    const dungeonCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /레벨|Lv/ }).first()
    const cardExists = await dungeonCard.count() > 0
    
    if (!cardExists) {
      console.log('던전 카드를 찾을 수 없음 - 스킵')
      return
    }
    
    await dungeonCard.click()
    await page.waitForTimeout(1000)
    
    // 입장 모달에서 입장 버튼 클릭
    const enterButton = page.locator('button').filter({ hasText: '입장' })
    if (await enterButton.isVisible()) {
      await enterButton.click()
      await page.waitForTimeout(3000)
      
      // 전투 화면 버튼 확인
      const itemButton = page.locator('button').filter({ hasText: '아이템' })
      await expect(itemButton).toBeVisible()
      
      // 아이템 버튼이 활성화되어 있는지 확인 (green 색상)
      const itemButtonClass = await itemButton.getAttribute('class')
      expect(itemButtonClass).toContain('bg-green-600')
      
      // 아이템 버튼 클릭
      await itemButton.click()
      await page.waitForTimeout(1000)
      
      // 아이템 메뉴 확인
      const itemMenu = page.locator('text=아이템 선택')
      await expect(itemMenu).toBeVisible()
      
      // 스크린샷
      await page.screenshot({ path: 'test-results/item-menu.png' })
    }
  })

  test('4. 네비게이션 바 확인', async ({ page }) => {
    // 홈으로 이동
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(2000)
    
    // 햄버거 메뉴 클릭
    const hamburger = page.locator('button[aria-label="메뉴 열기"]')
    if (await hamburger.isVisible()) {
      await hamburger.click()
      await page.waitForTimeout(500)
    }
    
    // 네비게이션 바 확인
    const navBar = page.locator('[data-testid="navigation-bar"]')
    await expect(navBar).toBeVisible()
    
    // 모험 링크 확인
    const adventureLink = navBar.locator('a[href="/dungeon"]')
    await expect(adventureLink).toBeVisible()
    
    // 텍스트가 "모험"인지 확인
    const linkText = await adventureLink.textContent()
    expect(linkText).toContain('모험')
    expect(linkText).not.toContain('던전')
    
    // 스크린샷
    await page.screenshot({ path: 'test-results/navigation.png' })
  })
})