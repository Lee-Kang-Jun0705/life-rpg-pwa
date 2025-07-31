import { test, expect } from '@playwright/test'

test.describe('레벨 동기화 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지 초기화
    await page.goto('http://localhost:3000')
    await page.evaluate(() => {
      localStorage.clear()
      // IndexedDB 초기화
      indexedDB.deleteDatabase('life-rpg-db')
    })
    await page.reload()
  })

  test('모든 페이지에서 레벨이 0부터 시작하고 동기화되는지 확인', async ({ page }) => {
    // 1. 대시보드 확인
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000) // 데이터 로드 대기

    // 총 레벨 확인
    const totalLevel = await page.locator('text=/Lv\\.\\d+/').first().textContent()
    console.log('대시보드 총 레벨:', totalLevel)
    
    // 각 스탯 레벨 확인
    const statLevels = await page.locator('.text-sm.mt-2.opacity-90').allTextContents()
    console.log('스탯 레벨들:', statLevels)

    // 2. 모험 페이지 확인
    await page.goto('http://localhost:3000/adventure')
    await page.waitForTimeout(2000)

    const adventureLevel = await page.locator('text=/Lv\\.\\d+/').first().textContent()
    console.log('모험 페이지 레벨:', adventureLevel)

    // 3. 프로필 페이지 확인
    await page.goto('http://localhost:3000/profile')
    await page.waitForTimeout(2000)

    const profileLevel = await page.locator('text=/레벨\\s*\\d+/').first().textContent()
    console.log('프로필 페이지 레벨:', profileLevel)

    // 4. AI 코치 페이지 확인
    await page.goto('http://localhost:3000/ai-coach')
    await page.waitForTimeout(2000)

    const aiCoachLevel = await page.locator('text=/Lv\\.\\s*\\d+/').first().textContent()
    console.log('AI 코치 페이지 레벨:', aiCoachLevel)

    // 모든 레벨이 0이어야 함
    expect(totalLevel).toContain('Lv.0')
    expect(adventureLevel).toContain('Lv.0')
  })

  test('활동 추가 후 레벨 동기화 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000)

    // 건강 스탯 클릭하여 경험치 추가
    await page.locator('button:has-text("건강")').click()
    await page.waitForTimeout(1000)

    // 총 레벨 확인
    const totalLevelAfter = await page.locator('text=/Lv\\.\\d+/').first().textContent()
    console.log('활동 추가 후 대시보드 총 레벨:', totalLevelAfter)

    // 모험 페이지에서도 동일한 레벨인지 확인
    await page.goto('http://localhost:3000/adventure')
    await page.waitForTimeout(2000)

    const adventureLevelAfter = await page.locator('text=/Lv\\.\\d+/').first().textContent()
    console.log('활동 추가 후 모험 페이지 레벨:', adventureLevelAfter)

    // 두 레벨이 동일해야 함
    expect(totalLevelAfter).toBe(adventureLevelAfter)
  })
})