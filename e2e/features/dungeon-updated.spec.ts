import { test, expect } from '@playwright/test'

test.describe('던전/모험 시스템 테스트', () => {
  test.beforeEach(async({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })
  })

  test('네비게이션에서 "모험" 메뉴가 표시되어야 함', async({ page }) => {
    await page.goto('/')

    // 네비게이션 바 확인
    const navBar = page.locator('[data-testid="navigation-bar"]')
    const hamburgerMenu = page.locator('button[aria-label="메뉴 열기"]')

    // 네비게이션이 숨겨진 경우 햄버거 메뉴 클릭
    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click()
      await expect(navBar).toBeVisible()
    }

    // "모험" 메뉴 확인 (던전이 아닌 모험)
    const adventureLink = page.locator('a[href="/dungeon"]')
    await expect(adventureLink).toContainText('모험')
    await expect(adventureLink).not.toContainText('던전')
  })

  test('모험 페이지 로드 및 탭 구조 확인', async({ page }) => {
    await page.goto('/dungeon')

    // 페이지 제목 확인
    await expect(page.locator('h1').filter({ hasText: '모험 & 성장' })).toBeVisible()

    // HeroSection 탭 확인
    const tabs = ['일일', '퀘스트', '탐험', '상점', '장비', '스킬', '도감', '업적', '기록']

    for (const tab of tabs) {
      await expect(page.locator(`button:has-text("${tab}")`).first()).toBeVisible()
    }

    // "던전" 탭이 "탐험"으로 변경되었는지 확인
    await expect(page.locator('button:has-text("던전")')).not.toBeVisible()
    await expect(page.locator('button:has-text("탐험")')).toBeVisible()
  })

  test('탐험 탭 클릭 시 던전 목록 표시', async({ page }) => {
    await page.goto('/dungeon')

    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')

    // 던전 목록 로드 대기
    await page.waitForTimeout(1000)

    // 던전 목록 헤더 확인
    const dungeonHeader = page.locator('h1:has-text("던전")').or(page.locator('text=던전').first())
    await expect(dungeonHeader).toBeVisible()

    // 카테고리 필터 확인
    const categories = ['전체', '스토리', '일일', '레이드', '특별', '도전']
    for (const category of categories) {
      await expect(page.locator(`button:has-text("${category}")`).first()).toBeVisible()
    }
  })

  test('플레이어 레벨에 따른 던전 잠금 상태', async({ page }) => {
    await page.goto('/dungeon')

    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')

    // 던전 카드 확인
    const dungeonCards = page.locator('[class*="bg-gray-800"]')
    const firstDungeon = dungeonCards.first()

    // 첫 번째 던전은 잠금 해제되어 있어야 함 (레벨 1)
    await expect(firstDungeon).toBeVisible()

    // 잠긴 던전도 있는지 확인 (높은 레벨 요구)
    const lockedDungeon = page.locator('text=잠금').first()
    if (await lockedDungeon.count() > 0) {
      await expect(lockedDungeon).toBeVisible()
    }
  })

  test('전투 시스템 - 스킬과 아이템 버튼 확인', async({ page }) => {
    await page.goto('/dungeon')

    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')

    // 첫 번째 던전 클릭 시도
    const dungeonCard = page.locator('[class*="cursor-pointer"]').first()
    if (await dungeonCard.count() > 0) {
      await dungeonCard.click()

      // 던전 입장 모달 확인
      const enterButton = page.locator('button:has-text("입장")')
      if (await enterButton.isVisible()) {
        await enterButton.click()

        // 전투 화면 로드 대기
        await page.waitForTimeout(2000)

        // 전투 UI 요소 확인
        const battleUI = page.locator('[class*="bg-gradient-to-b"]')
        if (await battleUI.count() > 0) {
          // 스킬 버튼 확인
          await expect(page.locator('button:has-text("스킬")')).toBeVisible()

          // 아이템 버튼 확인 (활성화됨)
          const itemButton = page.locator('button:has-text("아이템")')
          await expect(itemButton).toBeVisible()
          await expect(itemButton).not.toHaveClass(/bg-gray-600/)
          await expect(itemButton).toHaveClass(/bg-green-600/)
        }
      }
    }
  })

  test('콘솔 에러 없음 확인', async({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().includes('Failed to load resource') &&
          !msg.text().includes('NetworkOnly') &&
          !msg.text().includes('workbox')) {
        errors.push(msg.text())
      }
    })

    await page.goto('/dungeon')
    await page.waitForTimeout(2000)

    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(1000)

    // 에러가 없어야 함
    expect(errors).toHaveLength(0)
  })
})
