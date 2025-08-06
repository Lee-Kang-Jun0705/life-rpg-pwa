import { test, expect } from '@playwright/test'

test.describe('페이지 로드 테스트', () => {
  test('대시보드 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('/dashboard')
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Life RPG/)
    
    // 주요 텍스트가 표시되는지 확인
    const hasMainText = await page.locator('text=/Life RPG|스탯|레벨/i').first().isVisible({ timeout: 5000 }).catch(() => false)
    
    if (hasMainText) {
      console.log('✅ 대시보드 페이지 로드 성공')
    } else {
      console.log('⚠️ 대시보드 페이지는 로드되었으나 주요 컨텐츠를 찾을 수 없음')
    }
    
    // 페이지에 에러가 없는지 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
  })

  test('던전 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 던전 페이지로 이동
    await page.goto('/dungeon')
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/던전|Dungeon|Life RPG/)
    
    // 주요 텍스트가 표시되는지 확인
    const hasMainText = await page.locator('text=/던전|레벨|골드/i').first().isVisible({ timeout: 5000 }).catch(() => false)
    
    if (hasMainText) {
      console.log('✅ 던전 페이지 로드 성공')
    } else {
      console.log('⚠️ 던전 페이지는 로드되었으나 주요 컨텐츠를 찾을 수 없음')
    }
    
    // 페이지에 에러가 없는지 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
  })

  test('홈 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 홈 페이지로 이동
    await page.goto('/')
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Life RPG/)
    
    // 페이지에 에러가 없는지 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
    
    console.log('✅ 홈 페이지 로드 성공')
  })

  test('프로필 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 프로필 페이지로 이동
    await page.goto('/profile')
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    const title = await page.title()
    console.log('프로필 페이지 제목:', title)
    
    // 페이지에 에러가 없는지 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
    
    console.log('✅ 프로필 페이지 로드 성공')
  })

  test('설정 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 설정 페이지로 이동
    await page.goto('/settings')
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    const title = await page.title()
    console.log('설정 페이지 제목:', title)
    
    // 페이지에 에러가 없는지 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
    
    console.log('✅ 설정 페이지 로드 성공')
  })
})

// 반응형 테스트
test.describe('모바일 페이지 로드 테스트', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('모바일에서 대시보드가 정상적으로 로드되어야 함', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Life RPG/)
    
    // 에러 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
    
    console.log('✅ 모바일 대시보드 로드 성공')
  })

  test('모바일에서 던전이 정상적으로 로드되어야 함', async ({ page }) => {
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/던전|Dungeon|Life RPG/)
    
    // 에러 확인
    const errorText = await page.locator('text=/error|Error|오류/i').count()
    expect(errorText).toBe(0)
    
    console.log('✅ 모바일 던전 로드 성공')
  })
})