import { test, expect } from '@playwright/test'

test.describe('AI Coach Features - AI 코치', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })
    
    await page.goto('/ai-coach')
  })

  test('AI 코치 인터페이스가 표시되어야 함', async ({ page }) => {
    // 페이지 제목
    await expect(page.locator('h1:has-text("AI 코치")')).toBeVisible()
    
    // 채팅 영역
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible()
    
    // 입력 필드
    await expect(page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')).toBeVisible()
    
    // 전송 버튼
    await expect(page.locator('button[aria-label="전송"], button:has-text("전송")')).toBeVisible()
  })

  test('환영 메시지가 표시되어야 함', async ({ page }) => {
    // 초기 환영 메시지 확인
    const welcomeMessage = page.locator('[data-testid="chat-message"]').first()
    await expect(welcomeMessage).toBeVisible()
    
    // AI 코치의 메시지인지 확인
    await expect(welcomeMessage).toHaveAttribute('data-sender', 'ai')
    
    // 환영 메시지 내용 확인
    const messageText = await welcomeMessage.textContent()
    expect(messageText).toMatch(/안녕하세요|환영합니다|도와드리겠습니다/i)
  })

  test('메시지를 전송할 수 있어야 함', async ({ page }) => {
    // 메시지 입력
    const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
    await messageInput.fill('운동 계획을 세우고 싶어요')
    
    // 전송 버튼 클릭
    await page.click('button[aria-label="전송"], button:has-text("전송")')
    
    // 사용자 메시지 표시 확인
    const userMessage = page.locator('[data-testid="chat-message"][data-sender="user"]').last()
    await expect(userMessage).toBeVisible()
    await expect(userMessage).toContainText('운동 계획을 세우고 싶어요')
    
    // AI 응답 대기 (로딩 표시)
    const loadingIndicator = page.locator('[data-testid="loading-indicator"], .typing-indicator')
    await expect(loadingIndicator).toBeVisible()
    
    // AI 응답 수신 (타임아웃 설정)
    const aiResponse = page.locator('[data-testid="chat-message"][data-sender="ai"]').last()
    await expect(aiResponse).toBeVisible({ timeout: 30000 })
    
    // 응답 내용 확인
    const responseText = await aiResponse.textContent()
    expect(responseText?.length).toBeGreaterThan(10)
  })

  test('빠른 질문 버튼들이 작동해야 함', async ({ page }) => {
    // 빠른 질문 섹션 확인
    const quickQuestions = page.locator('[data-testid="quick-questions"]')
    
    if (await quickQuestions.isVisible()) {
      // 빠른 질문 버튼들
      const questions = [
        '목표 설정 도움',
        '동기부여가 필요해요',
        '습관 만들기',
        '스트레스 관리'
      ]
      
      // 첫 번째 빠른 질문 클릭
      const firstQuestion = quickQuestions.locator('button').first()
      const questionText = await firstQuestion.textContent()
      
      await firstQuestion.click()
      
      // 질문이 입력되거나 전송되는지 확인
      const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
      const inputValue = await messageInput.inputValue()
      
      if (inputValue) {
        expect(inputValue).toBe(questionText)
      } else {
        // 바로 전송된 경우
        const sentMessage = page.locator('[data-testid="chat-message"][data-sender="user"]').last()
        await expect(sentMessage).toContainText(questionText || '')
      }
    }
  })

  test('대화 내역이 유지되어야 함', async ({ page }) => {
    // 첫 번째 메시지 전송
    const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
    await messageInput.fill('첫 번째 질문입니다')
    await page.click('button[aria-label="전송"], button:has-text("전송")')
    
    // AI 응답 대기
    await page.waitForSelector('[data-testid="chat-message"][data-sender="ai"]:last-child', {
      timeout: 30000
    })
    
    // 두 번째 메시지 전송
    await messageInput.fill('두 번째 질문입니다')
    await page.click('button[aria-label="전송"], button:has-text("전송")')
    
    // 모든 메시지가 표시되는지 확인
    const allMessages = page.locator('[data-testid="chat-message"]')
    const messageCount = await allMessages.count()
    
    expect(messageCount).toBeGreaterThanOrEqual(4) // 환영 메시지 + 2개 질문 + 최소 1개 응답
  })

  test('대화 내용을 지울 수 있어야 함', async ({ page }) => {
    // 대화 지우기 버튼 찾기
    const clearButton = page.locator('button:has-text("대화 지우기"), button[aria-label="대화 지우기"]')
    
    if (await clearButton.isVisible()) {
      // 메시지 추가
      const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
      await messageInput.fill('테스트 메시지')
      await page.click('button[aria-label="전송"], button:has-text("전송")')
      
      // 대화 지우기
      await clearButton.click()
      
      // 확인 다이얼로그가 있을 경우
      const confirmButton = page.locator('button:has-text("확인"), button:has-text("지우기")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // 대화가 초기화되었는지 확인
      const messages = page.locator('[data-testid="chat-message"]')
      const count = await messages.count()
      
      // 환영 메시지만 남아있거나 완전히 비어있어야 함
      expect(count).toBeLessThanOrEqual(1)
    }
  })

  test('AI 코치 설정을 변경할 수 있어야 함', async ({ page }) => {
    // 설정 버튼 찾기
    const settingsButton = page.locator('button[aria-label="설정"], button:has-text("설정")')
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      
      // 설정 모달 또는 섹션 표시
      await expect(page.locator('text=AI 코치 설정')).toBeVisible()
      
      // 응답 스타일 설정
      const styleSelect = page.locator('select[name="responseStyle"]')
      if (await styleSelect.isVisible()) {
        await styleSelect.selectOption('motivational')
      }
      
      // 응답 길이 설정
      const lengthSelect = page.locator('select[name="responseLength"]')
      if (await lengthSelect.isVisible()) {
        await lengthSelect.selectOption('detailed')
      }
      
      // 저장
      await page.click('button:has-text("저장")')
      
      // 설정이 적용되었는지 확인 (토스트 메시지 등)
      await expect(page.locator('text=설정이 저장되었습니다')).toBeVisible()
    }
  })

  test('추천 활동이 표시되어야 함', async ({ page }) => {
    // AI가 활동을 추천하는 메시지 전송
    const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
    await messageInput.fill('오늘 어떤 활동을 하면 좋을까요?')
    await page.click('button[aria-label="전송"], button:has-text("전송")')
    
    // AI 응답 대기
    await page.waitForSelector('[data-testid="chat-message"][data-sender="ai"]:last-child', {
      timeout: 30000
    })
    
    // 추천 활동 카드나 버튼이 표시되는지 확인
    const recommendationCards = page.locator('[data-testid="activity-recommendation"]')
    if (await recommendationCards.first().isVisible()) {
      const count = await recommendationCards.count()
      expect(count).toBeGreaterThan(0)
      
      // 추천 활동 클릭 가능한지 확인
      const firstRecommendation = recommendationCards.first()
      await expect(firstRecommendation.locator('button')).toBeVisible()
    }
  })

  test('대화 내용을 내보낼 수 있어야 함', async ({ page }) => {
    // 내보내기 버튼 찾기
    const exportButton = page.locator('button:has-text("내보내기"), button[aria-label="대화 내보내기"]')
    
    if (await exportButton.isVisible()) {
      // 테스트 대화 추가
      const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]')
      await messageInput.fill('내보내기 테스트')
      await page.click('button[aria-label="전송"], button:has-text("전송")')
      
      // AI 응답 대기
      await page.waitForSelector('[data-testid="chat-message"][data-sender="ai"]:last-child', {
        timeout: 30000
      })
      
      // 다운로드 이벤트 리스너 설정
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
      ])
      
      // 파일명 확인
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/chat.*\.(txt|json|pdf)/i)
    }
  })

  test('반응형 레이아웃이 적용되어야 함', async ({ page }) => {
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1200, height: 800 })
    
    // 사이드바나 추가 패널이 표시되는지 확인
    const sidebar = page.locator('[data-testid="coach-sidebar"]')
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox()
      expect(sidebarBox?.width).toBeGreaterThan(200)
    }
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 모바일에서는 사이드바가 숨겨지거나 토글되어야 함
    if (await sidebar.isVisible()) {
      const mobileSidebarBox = await sidebar.boundingBox()
      expect(mobileSidebarBox?.width).toBe(0) // 숨겨짐
    }
    
    // 입력 영역이 하단에 고정되어 있는지 확인
    const inputArea = page.locator('[data-testid="chat-input-area"]')
    const inputBox = await inputArea.boundingBox()
    const viewportSize = page.viewportSize()
    
    if (inputBox && viewportSize) {
      expect(inputBox.y + inputBox.height).toBeCloseTo(viewportSize.height, 50)
    }
  })
})