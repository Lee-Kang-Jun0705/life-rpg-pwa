import { test, expect } from '@playwright/test'

test('테스트 데이터 생성 후 레벨 확인', async ({ page }) => {
  // 1. 초기화 페이지로 이동
  console.log('1. 테스트 데이터 초기화')
  await page.goto('http://localhost:3000/init-test-data')
  await page.waitForTimeout(5000) // 초기화 완료 대기

  // 2. 대시보드 확인
  console.log('2. 대시보드 레벨 확인')
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // 대시보드 레벨 요소 찾기
  const dashboardLevelElement = await page.locator('[data-testid="user-level"]').first()
  const dashboardLevel = await dashboardLevelElement.textContent()
  console.log('대시보드 레벨:', dashboardLevel)

  // 3. 모험 페이지 확인
  console.log('3. 모험 페이지로 이동')
  await page.goto('http://localhost:3000/adventure')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 모험 페이지 전체 HTML 확인
  const adventureContent = await page.content()
  
  // 레벨 표시 찾기
  const levelMatches = adventureContent.match(/Lv\.\s*\d+/g)
  console.log('모험 페이지에서 찾은 레벨 표시:', levelMatches)

  // 캐릭터 정보 영역 디버깅
  const characterInfoArea = await page.locator('.flex.items-center.gap-4').first()
  if (await characterInfoArea.isVisible()) {
    const areaContent = await characterInfoArea.textContent()
    console.log('캐릭터 정보 영역 내용:', areaContent)
  }

  // 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/adventure-level-debug-final.png',
    fullPage: true 
  })

  // 검증
  expect(dashboardLevel).toContain('8') // 레벨 2 * 4 = 8
  expect(levelMatches).toBeTruthy()
  expect(levelMatches?.length).toBeGreaterThan(0)
})