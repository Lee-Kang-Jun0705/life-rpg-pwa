import { test, expect } from '@playwright/test'
import { TEST_CONFIG, helpers } from '../test-config'

test.describe('핵심 네비게이션 테스트', () => {
  test.beforeEach(async({ page }) => {
    await page.goto(TEST_CONFIG.baseURL)
    await helpers.waitForPageLoad(page)
  })

  test('모든 주요 페이지에 접근 가능해야 함', async({ page }) => {
    const pagesToTest = [
      { path: TEST_CONFIG.pages.dashboard, title: 'Life RPG', headerText: 'Life RPG' },
      { path: TEST_CONFIG.pages.skills, title: '스킬', headerText: '스킬' },
      { path: TEST_CONFIG.pages.dungeon, title: '던전', headerText: '던전' },
      { path: TEST_CONFIG.pages.shop, title: '상점', headerText: '상점' },
      { path: TEST_CONFIG.pages.inventory, title: '인벤토리', headerText: '인벤토리' },
      { path: TEST_CONFIG.pages.equipment, title: '장비', headerText: '장비' },
      { path: TEST_CONFIG.pages.achievements, title: '업적', headerText: '업적' },
      { path: TEST_CONFIG.pages.daily, title: '일일 미션', headerText: '일일' },
      { path: TEST_CONFIG.pages.profile, title: '프로필', headerText: '프로필' }
    ]

    for (const pageInfo of pagesToTest) {
      await test.step(`${pageInfo.title} 페이지 접근`, async() => {
        await page.goto(pageInfo.path)
        await helpers.waitForPageLoad(page)

        // 페이지 타이틀 확인
        await expect(page).toHaveTitle(new RegExp(pageInfo.title))

        // 헤더 텍스트 확인
        const header = page.locator('h1, h2').filter({ hasText: pageInfo.headerText }).first()
        await expect(header).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })

        // 에러 없음 확인
        await helpers.checkNoErrors(page)
      })
    }
  })

  test('네비게이션 바가 모든 페이지에서 작동해야 함', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    const navBar = page.locator(TEST_CONFIG.selectors.navigationBar)
    await expect(navBar).toBeVisible()

    // 네비게이션 링크 테스트
    const navLinks = [
      { text: '홈', href: '/' },
      { text: '스킬', href: '/skills' },
      { text: '던전', href: '/dungeon' },
      { text: '상점', href: '/shop' },
      { text: '인벤토리', href: '/inventory' }
    ]

    for (const link of navLinks) {
      const navLink = navBar.locator(`a:has-text("${link.text}")`)
      await expect(navLink).toBeVisible()
      await expect(navLink).toHaveAttribute('href', link.href)
    }
  })

  test('뒤로가기/앞으로가기가 정상 작동해야 함', async({ page }) => {
    // 대시보드 -> 스킬 -> 던전 순으로 이동
    await page.goto(TEST_CONFIG.pages.dashboard)
    await page.goto(TEST_CONFIG.pages.skills)
    await page.goto(TEST_CONFIG.pages.dungeon)

    // 뒤로가기
    await page.goBack()
    await expect(page).toHaveURL(TEST_CONFIG.pages.skills)

    await page.goBack()
    await expect(page).toHaveURL(TEST_CONFIG.pages.dashboard)

    // 앞으로가기
    await page.goForward()
    await expect(page).toHaveURL(TEST_CONFIG.pages.skills)
  })

  test('404 페이지 처리', async({ page }) => {
    await page.goto('/non-existent-page')

    // 404 페이지 또는 리다이렉트 확인
    const notFoundText = page.locator('text=/404|페이지를 찾을 수 없습니다|Not Found/i')
    const isNotFound = await notFoundText.isVisible().catch(() => false)

    if (!isNotFound) {
      // 홈으로 리다이렉트되었는지 확인
      await expect(page).toHaveURL(/\/(dashboard)?$/)
    }
  })

  test('페이지 로딩 상태가 올바르게 표시되어야 함', async({ page }) => {
    // 느린 네트워크 시뮬레이션
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100)
    })

    const responsePromise = page.waitForResponse(resp => resp.status() === 200)
    await page.goto(TEST_CONFIG.pages.dungeon)

    // 로딩 인디케이터 확인
    const loadingIndicator = page.locator(TEST_CONFIG.selectors.loading).first()
    const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false)

    // 로딩이 표시되었다면 사라질 때까지 대기
    if (isLoadingVisible) {
      await expect(loadingIndicator).toBeHidden({ timeout: TEST_CONFIG.timeouts.page })
    }

    await responsePromise
  })
})
