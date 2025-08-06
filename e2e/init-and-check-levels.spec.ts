import { test, expect } from '@playwright/test'

test('초기 데이터 생성 및 레벨 연동 확인', async ({ page }) => {
  console.log('1. 초기 데이터 생성 API 호출')
  const response = await page.request.get('http://localhost:3000/api/debug/init-data')
  const data = await response.json()
  console.log('API 응답:', data)

  console.log('2. 대시보드 확인')
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 대시보드 레벨 확인
  const dashboardLevel = await page.locator('text=/총 레벨/').locator('..').locator('div').first().textContent()
  console.log('대시보드 총 레벨:', dashboardLevel)

  // 대시보드 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/dashboard-with-data.png',
    fullPage: true 
  })

  console.log('3. 모험 페이지 확인')
  await page.goto('http://localhost:3000/adventure')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 캐릭터 정보 영역 찾기
  const characterInfoSelectors = [
    '.bg-gray-800\\/50.rounded-xl.p-4.mb-6',
    '[class*="bg-gray-800"][class*="rounded-xl"]',
    'div:has(> div > div > h2)'
  ]

  let characterText = ''
  for (const selector of characterInfoSelectors) {
    try {
      const element = await page.locator(selector).first()
      if (await element.isVisible()) {
        characterText = await element.textContent() || ''
        console.log(`캐릭터 정보 (${selector}):`, characterText)
        break
      }
    } catch (e) {
      // 다음 selector 시도
    }
  }

  // 레벨 텍스트 직접 찾기
  const levelElements = await page.locator('text=/Lv\\.\\s*\\d+/').all()
  console.log('찾은 레벨 표시 개수:', levelElements.length)
  
  for (let i = 0; i < levelElements.length; i++) {
    const text = await levelElements[i].textContent()
    console.log(`레벨 표시 ${i + 1}:`, text)
  }

  // 모험 페이지 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/adventure-with-data.png',
    fullPage: true 
  })

  // 레벨 연동 확인
  expect(dashboardLevel).toContain('8') // 각 스탯 레벨 2 * 4 = 8
  expect(levelElements.length).toBeGreaterThan(0) // 적어도 하나의 레벨 표시가 있어야 함
})