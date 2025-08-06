import { test, expect } from '@playwright/test'

test.describe('모험 페이지 모든 탭 상세 확인', () => {
  test('각 탭 구현 상태 및 오류 확인', async ({ page }) => {
    // 에러 수집
    const errors: { tab: string; error: string }[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ tab: 'console', error: msg.text() })
      }
    })

    page.on('pageerror', error => {
      errors.push({ tab: 'page', error: error.message })
    })

    // 모험 페이지로 이동
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const tabs = [
      { name: '퀘스트', id: 'quest', expectedContent: ['퀘스트 목록', '보상'] },
      { name: '탐험', id: 'dungeon', expectedContent: ['던전', '입장'] },
      { name: '인벤토리', id: 'inventory', expectedContent: ['장비', '아이템'] },
      { name: '스킬', id: 'skill', expectedContent: ['스킬', '레벨'] },
      { name: '상점', id: 'shop', expectedContent: ['구매', '판매'] },
      { name: '도전과제', id: 'achievement', expectedContent: ['달성', '보상'] }
    ]

    const results = []

    for (const tab of tabs) {
      console.log(`\n=== ${tab.name} 탭 확인 ===`)
      
      // 탭 클릭
      const tabButton = page.locator(`button:has-text("${tab.name}")`)
      await tabButton.click()
      await page.waitForTimeout(1500)

      // 스크린샷
      await page.screenshot({ 
        path: `C:/Users/USER/Pictures/Screenshots/tab-${tab.id}-detail.png`,
        fullPage: true 
      })

      // 콘텐츠 확인
      const tabPanel = page.locator('[role="tabpanel"]').first()
      const content = await tabPanel.textContent() || ''
      const isVisible = await tabPanel.isVisible()

      // 구현 상태 확인
      let status = '❌ 미구현'
      let details = ''

      if (!isVisible) {
        status = '❌ 표시 안됨'
        details = '탭 패널이 보이지 않음'
      } else if (content.length < 50) {
        status = '❌ 콘텐츠 없음'
        details = `텍스트 길이: ${content.length}`
      } else if (content.includes('준비 중') || content.includes('Coming Soon')) {
        status = '🚧 준비 중'
        details = '명시적으로 준비 중 표시'
      } else {
        // 예상 콘텐츠 확인
        const hasExpectedContent = tab.expectedContent.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        )
        
        if (hasExpectedContent) {
          status = '✅ 구현됨'
          details = '기본 기능 확인'
        } else {
          status = '⚠️ 부분 구현'
          details = '일부 기능 누락 가능성'
        }
      }

      // 에러 확인
      const tabErrors = errors.filter(e => e.tab === tab.name)
      if (tabErrors.length > 0) {
        status += ' (에러 발생)'
        details += ` - ${tabErrors.length}개 에러`
      }

      results.push({
        tab: tab.name,
        status,
        details,
        contentLength: content.length,
        errors: tabErrors
      })

      console.log(`상태: ${status}`)
      console.log(`상세: ${details}`)
      if (tabErrors.length > 0) {
        console.log('에러:', tabErrors)
      }
    }

    // 결과 요약
    console.log('\n=== 전체 결과 요약 ===')
    results.forEach(r => {
      console.log(`${r.tab}: ${r.status} - ${r.details}`)
    })

    // 전체 에러 출력
    if (errors.length > 0) {
      console.log('\n=== 발견된 모든 에러 ===')
      errors.forEach(e => console.log(`[${e.tab}] ${e.error}`))
    }

    // 테스트 통과 조건: 최소한 퀘스트 탭은 구현되어 있어야 함
    const questTab = results.find(r => r.tab === '퀘스트')
    expect(questTab?.status).toContain('구현')
  })
})