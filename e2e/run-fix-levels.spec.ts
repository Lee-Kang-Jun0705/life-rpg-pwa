import { test, expect } from '@playwright/test'

test('레벨 데이터 수정 및 확인', async ({ page }) => {
  console.log('1. fix-levels 페이지 실행')
  await page.goto('http://localhost:3000/fix-levels')
  await page.waitForTimeout(5000) // 수정 완료 대기

  console.log('2. 대시보드 확인')
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 대시보드 레벨 확인
  const dashboardLevel = await page.locator('text=/총 레벨/').locator('..').locator('div').first().textContent()
  console.log('대시보드 총 레벨:', dashboardLevel)

  // 초기 데이터 생성을 위해 활동 추가
  console.log('3. 테스트 활동 추가')
  const statButtons = ['건강', '학습', '관계', '성취']
  for (const stat of statButtons) {
    const button = page.locator(`button:has-text("${stat}")`)
    if (await button.isVisible()) {
      await button.click()
      await page.waitForTimeout(1000)
    }
  }

  // 다시 대시보드 확인
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  const updatedLevel = await page.locator('text=/총 레벨/').locator('..').locator('div').first().textContent()
  console.log('업데이트된 대시보드 레벨:', updatedLevel)

  console.log('4. 모험 페이지 확인')
  await page.goto('http://localhost:3000/adventure')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 캐릭터 정보 확인
  const characterInfo = await page.locator('.bg-gray-800\\/50').first()
  const characterText = await characterInfo.textContent()
  console.log('모험 페이지 캐릭터 정보:', characterText)

  // 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/after-fix-levels.png',
    fullPage: true 
  })
})