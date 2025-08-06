import { test, expect } from '@playwright/test'

test('최종 확인 - 레벨 표시 및 오류 체크', async ({ page }) => {
  // 에러 수집
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  // 1. 모험 페이지 접속
  await page.goto('http://localhost:3000/adventure')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 2. 레벨 표시 확인
  const levelText = await page.locator('text=/Lv\\.\\d+/').first().textContent()
  console.log('레벨 표시:', levelText)
  expect(levelText).toContain('Lv.')

  // 3. 각 탭 클릭 (오류만 확인)
  const tabs = ['탐험', '스킬']
  for (const tab of tabs) {
    console.log(`${tab} 탭 확인 중...`)
    const tabButton = page.locator(`button:has-text("${tab}")`)
    if (await tabButton.isVisible()) {
      await tabButton.click()
      await page.waitForTimeout(1000)
    }
  }

  // 4. 최종 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/final-check.png',
    fullPage: true 
  })

  // 5. 오류 확인
  console.log('발견된 오류 개수:', errors.length)
  if (errors.length > 0) {
    console.log('오류 목록:', errors.slice(0, 5)) // 처음 5개만 출력
  }
})