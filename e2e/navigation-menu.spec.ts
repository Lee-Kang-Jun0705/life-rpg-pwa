import { test, expect } from '@playwright/test'

test.describe('네비게이션 메뉴 동작 테스트', () => {
  test('메뉴 열기/닫기 및 네비게이션', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 메뉴 버튼 찾기
    const menuButton = page.locator('button[aria-label="메뉴 열기"]')
    await expect(menuButton).toBeVisible()
    
    // 메뉴 열기
    await menuButton.click({ force: true })
    await page.waitForTimeout(500) // 애니메이션 대기
    
    // 네비게이션 바가 표시되는지 확인
    const navBar = page.locator('[data-testid="navigation-bar"]')
    await expect(navBar).toBeVisible()
    
    // 메뉴 항목들 확인
    const menuItems = [
      { emoji: '🏠', label: '대시보드', href: '/dashboard' },
      { emoji: '⚔️', label: '모험', href: '/adventure' },
      { emoji: '🤖', label: 'AI코치', href: '/ai-coach' },
      { emoji: '👤', label: '프로필', href: '/profile' }
    ]
    
    for (const item of menuItems) {
      const menuLink = page.locator(`a[href="${item.href}"]`)
      await expect(menuLink).toBeVisible()
      await expect(menuLink).toContainText(item.emoji)
      await expect(menuLink).toContainText(item.label)
    }
    
    // 모험 페이지로 이동
    await page.locator('a[href="/adventure"]').click()
    await page.waitForLoadState('networkidle')
    
    // 모험 페이지에 도착했는지 확인
    await expect(page).toHaveURL(/.*\/adventure/)
    await expect(page.locator('text=모험')).toBeVisible()
    
    // 메뉴가 자동으로 닫혔는지 확인
    await expect(navBar).not.toBeVisible()
  })
  
  test('ESC 키로 메뉴 닫기', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 메뉴 열기
    const menuButton = page.locator('button[aria-label="메뉴 열기"]')
    await menuButton.click({ force: true })
    await page.waitForTimeout(500)
    
    // 네비게이션 바가 표시되는지 확인
    const navBar = page.locator('[data-testid="navigation-bar"]')
    await expect(navBar).toBeVisible()
    
    // ESC 키 누르기
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    
    // 메뉴가 닫혔는지 확인
    await expect(navBar).not.toBeVisible()
  })
})