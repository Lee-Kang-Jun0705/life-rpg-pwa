import { test, expect } from '@playwright/test'

test.describe('AI 코치 페이지 중복 키 에러 테스트', () => {
  test('AI 코치 페이지에서 중복 키 에러가 없어야 함', async ({ page }) => {
    const consoleErrors: string[] = []
    
    // 콘솔 에러 수집
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        consoleErrors.push(text)
        console.log('Console Error:', text)
      }
    })
    
    // AI 코치 페이지로 이동
    await page.goto('/ai-coach')
    await page.waitForLoadState('networkidle')
    
    // 잠시 대기하여 React가 완전히 렌더링되도록 함
    await page.waitForTimeout(2000)
    
    // 각 탭 클릭하여 모든 컴포넌트 렌더링
    const tabs = ['상세 분석', '활동 분석', '성장 추이', '맞춤 조언']
    
    for (const tabName of tabs) {
      // 탭 버튼 찾기 및 클릭
      const tabButton = page.locator('button').filter({ hasText: tabName })
      if (await tabButton.count() > 0) {
        await tabButton.first().click()
        await page.waitForTimeout(1000) // 탭 전환 대기
        console.log(`${tabName} 탭 클릭 완료`)
      }
    }
    
    // 중복 키 에러 검사
    const keyErrors = consoleErrors.filter(error => 
      error.includes('Encountered two children with the same key') ||
      error.includes('Warning: Each child in a list should have a unique "key" prop')
    )
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'e2e/screenshots/ai-coach-after-fix.png',
      fullPage: true 
    })
    
    // 에러 개수 출력
    console.log(`발견된 중복 키 에러 개수: ${keyErrors.length}`)
    
    // 에러가 없어야 함
    expect(keyErrors.length).toBe(0)
  })
  
  test('SimpleStatDisplay 컴포넌트 테스트', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // AI 코치 페이지로 이동
    await page.goto('/ai-coach')
    await page.waitForLoadState('networkidle')
    
    // 상세 분석 탭 클릭
    await page.locator('button').filter({ hasText: '상세 분석' }).first().click()
    await page.waitForTimeout(1000)
    
    // 보기 모드 전환 테스트
    const donutButton = page.locator('button').filter({ hasText: '도넛 차트' })
    if (await donutButton.count() > 0) {
      await donutButton.click()
      await page.waitForTimeout(1000)
    }
    
    const barButton = page.locator('button').filter({ hasText: '바 차트' })
    if (await barButton.count() > 0) {
      await barButton.click()
      await page.waitForTimeout(1000)
    }
    
    // 중복 키 에러 검사
    const keyErrors = consoleErrors.filter(error => 
      error.includes('key') && (
        error.includes('same') || 
        error.includes('unique') || 
        error.includes('duplicate')
      )
    )
    
    expect(keyErrors.length).toBe(0)
  })
})