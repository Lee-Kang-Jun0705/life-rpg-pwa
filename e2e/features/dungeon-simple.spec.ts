import { test, expect } from '@playwright/test'

test.describe('던전/모험 시스템 간단 테스트', () => {
  test('모험 페이지 직접 접근 및 확인', async({ page }) => {
    // 던전 페이지로 직접 이동
    await page.goto('http://localhost:3000/dungeon')

    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')

    // 페이지 제목 확인
    const pageTitle = await page.textContent('h1')
    console.log('페이지 제목:', pageTitle)

    // "모험 & 성장" 텍스트가 있는지 확인
    const adventureTitle = await page.locator('text=모험 & 성장').isVisible()
    console.log('모험 & 성장 표시:', adventureTitle)

    // 탭 버튼들 확인
    const tabs = ['일일', '퀘스트', '탐험', '상점', '장비', '스킬', '도감', '업적', '기록']
    console.log('탭 확인:')

    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`).first()
      const isVisible = await tabButton.isVisible()
      console.log(`- ${tab}: ${isVisible ? '✓' : '✗'}`)

      if (tab === '탐험') {
        expect(isVisible).toBeTruthy()
      }
    }

    // "던전" 탭이 없는지 확인
    const dungeonTab = await page.locator('button:has-text("던전")').count()
    console.log('던전 탭 개수:', dungeonTab)
    expect(dungeonTab).toBe(0)
  })

  test('탐험 탭 클릭 및 던전 목록 확인', async({ page }) => {
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForLoadState('networkidle')

    // 탐험 탭 클릭
    const exploreTab = page.locator('button:has-text("탐험")').first()
    await exploreTab.click()

    // 던전 목록 로드 대기
    await page.waitForTimeout(2000)

    // 던전 헤더 확인
    const dungeonHeader = await page.locator('h1:has-text("던전")').isVisible()
    console.log('던전 헤더 표시:', dungeonHeader)

    // 카테고리 필터 확인
    const categories = ['전체', '스토리', '일일']
    for (const category of categories) {
      const categoryButton = await page.locator(`button:has-text("${category}")`).first().isVisible()
      console.log(`카테고리 ${category}:`, categoryButton)
    }

    // 던전 카드 개수 확인
    const dungeonCards = await page.locator('[class*="cursor-pointer"]').count()
    console.log('던전 카드 개수:', dungeonCards)

    // 스크린샷 저장
    await page.screenshot({ path: 'dungeon-list-screenshot.png', fullPage: true })
  })

  test('전투 화면 아이템 버튼 확인', async({ page }) => {
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForLoadState('networkidle')

    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(1000)

    // 첫 번째 던전 카드 클릭
    const firstDungeon = page.locator('[class*="cursor-pointer"]').first()
    const dungeonExists = await firstDungeon.count() > 0

    if (dungeonExists) {
      await firstDungeon.click()
      await page.waitForTimeout(1000)

      // 입장 버튼 찾기
      const enterButton = page.locator('button:has-text("입장")')
      const enterExists = await enterButton.count() > 0

      if (enterExists) {
        console.log('입장 버튼 발견, 클릭 시도')
        await enterButton.click()
        await page.waitForTimeout(3000)

        // 전투 화면 확인
        const attackButton = await page.locator('button:has-text("공격")').isVisible()
        const skillButton = await page.locator('button:has-text("스킬")').isVisible()
        const defendButton = await page.locator('button:has-text("방어")').isVisible()
        const itemButton = await page.locator('button:has-text("아이템")').isVisible()

        console.log('전투 버튼 상태:')
        console.log('- 공격:', attackButton)
        console.log('- 스킬:', skillButton)
        console.log('- 방어:', defendButton)
        console.log('- 아이템:', itemButton)

        // 아이템 버튼 색상 확인
        if (itemButton) {
          const itemButtonElement = page.locator('button:has-text("아이템")')
          const classNames = await itemButtonElement.getAttribute('class')
          console.log('아이템 버튼 클래스:', classNames)

          const hasGreenBg = classNames?.includes('bg-green-600')
          expect(hasGreenBg).toBeTruthy()
        }
      }
    } else {
      console.log('던전 카드를 찾을 수 없음')
    }
  })
})
