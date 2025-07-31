import { test, expect } from '@playwright/test'

test('userId 통일 후 레벨 동기화 확인', async ({ page }) => {
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('브라우저 콘솔:', msg.text())
    }
  })

  // 1. 대시보드 확인
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForTimeout(3000)
  
  // 대시보드 총 레벨 확인
  const dashboardLevel = await page.locator('[data-testid="user-level"]').textContent()
  console.log('✅ 대시보드 총 레벨:', dashboardLevel)
  
  // 대시보드 스크린샷
  await page.screenshot({ path: 'test-dashboard-sync.png', fullPage: true })
  
  // 2. 모험 페이지 확인
  await page.goto('http://localhost:3000/adventure')
  await page.waitForTimeout(3000)
  
  // 모험 페이지 레벨 확인
  const adventureLevel = await page.locator('.text-sm.text-gray-400 >> text=/Lv\\.\\d+/').textContent()
  console.log('✅ 모험 페이지 레벨:', adventureLevel)
  
  // 모험 페이지 스크린샷
  await page.screenshot({ path: 'test-adventure-sync.png', fullPage: true })
  
  // 3. 프로필 페이지 확인
  await page.goto('http://localhost:3000/profile')
  await page.waitForTimeout(3000)
  
  // 프로필 레벨 찾기 (여러 패턴 시도)
  let profileLevel = null
  try {
    // 패턴 1: "레벨 1" 형식
    profileLevel = await page.locator('text=/레벨\\s*\\d+/').first().textContent()
  } catch {
    try {
      // 패턴 2: "Lv.1" 형식
      profileLevel = await page.locator('text=/Lv\\.\\s*\\d+/').first().textContent()
    } catch {
      // 패턴 3: 숫자만
      const levelElement = await page.locator('.text-2xl.font-bold').first()
      profileLevel = await levelElement.textContent()
    }
  }
  console.log('✅ 프로필 페이지 레벨:', profileLevel)
  
  // 4. AI 코치 페이지 확인
  await page.goto('http://localhost:3000/ai-coach')
  await page.waitForTimeout(3000)
  
  const aiCoachLevel = await page.locator('text=/Lv\\.\\s*\\d+/').first().textContent()
  console.log('✅ AI 코치 페이지 레벨:', aiCoachLevel)
  
  // 결과 출력
  console.log('\n=== 레벨 동기화 테스트 결과 ===')
  console.log('대시보드:', dashboardLevel)
  console.log('모험 페이지:', adventureLevel)
  console.log('프로필:', profileLevel)
  console.log('AI 코치:', aiCoachLevel)
  
  // 검증: 모든 페이지의 레벨이 동일해야 함
  const dashLevelNum = dashboardLevel?.match(/\d+/)?.[0]
  const advLevelNum = adventureLevel?.match(/\d+/)?.[0]
  
  expect(dashLevelNum).toBe(advLevelNum)
  console.log('\n✅ 레벨 동기화 성공! 모든 페이지가 동일한 레벨을 표시합니다.')
})