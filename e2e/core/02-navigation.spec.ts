import { test, expect } from '@playwright/test'

test.describe('Navigation Tests - 페이지 이동', () => {
  test.beforeEach(async({ page }) => {
    await page.goto('/')
  })

  test('사이드바 네비게이션이 정상 작동해야 함', async({ page }) => {
    // 모바일 뷰에서 메뉴 버튼 확인
    const isMobile = await page.evaluate(() => window.innerWidth < 768)

    if (isMobile) {
      // 모바일 메뉴 토글
      await page.click('[aria-label="메뉴 토글"]')
      await expect(page.locator('aside')).toBeVisible()
    }

    // 각 메뉴 항목 클릭 및 확인
    const menuItems = [
      { text: '활동', url: '/activities' },
      { text: '던전', url: '/dungeon' },
      { text: '인벤토리', url: '/inventory' },
      { text: '스킬', url: '/skills' },
      { text: '컬렉션', url: '/collection' },
      { text: '업적', url: '/achievements' },
      { text: '랭킹', url: '/ranking' },
      { text: '일일', url: '/daily' },
      { text: 'AI 코치', url: '/ai-coach' },
      { text: '프로필', url: '/profile' },
      { text: '설정', url: '/settings' }
    ]

    for (const item of menuItems) {
      await page.click(`nav >> text="${item.text}"`)
      await expect(page).toHaveURL(item.url)

      // 활성 상태 확인
      const activeLink = page.locator(`nav >> text="${item.text}"`).locator('..')
      await expect(activeLink).toHaveClass(/bg-primary/)
    }
  })

  test('브라우저 뒤로/앞으로 버튼이 작동해야 함', async({ page }) => {
    // 여러 페이지 방문
    await page.goto('/dashboard')
    await page.goto('/activities')
    await page.goto('/dungeon')

    // 뒤로 가기
    await page.goBack()
    await expect(page).toHaveURL('/activities')

    await page.goBack()
    await expect(page).toHaveURL('/dashboard')

    // 앞으로 가기
    await page.goForward()
    await expect(page).toHaveURL('/activities')
  })

  test('404 페이지에서 홈으로 돌아갈 수 있어야 함', async({ page }) => {
    // 존재하지 않는 페이지 방문
    await page.goto('/nonexistent-page')

    // 404 메시지 확인
    await expect(page.locator('text=404')).toBeVisible()

    // 홈으로 돌아가기 버튼 확인
    const homeButton = page.locator('text=홈으로 돌아가기')
    await expect(homeButton).toBeVisible()

    await homeButton.click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('딥링크가 정상 작동해야 함', async({ page }) => {
    // 직접 URL 접근
    const deepLinks = [
      '/dungeon#daily',
      '/settings#notifications',
      '/skills?category=active'
    ]

    for (const link of deepLinks) {
      await page.goto(link)

      // 페이지 로드 확인
      await expect(page.locator('text=404')).not.toBeVisible()

      // URL 유지 확인
      expect(page.url()).toContain(link.split('#')[0].split('?')[0])
    }
  })
})
