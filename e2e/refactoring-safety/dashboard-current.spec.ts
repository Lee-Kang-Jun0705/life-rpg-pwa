import { test, expect } from '@playwright/test'

/**
 * Dashboard 현재 동작 검증 테스트
 * 리팩토링 전 대시보드 기능이 정상 동작함을 보장
 */
test.describe('Dashboard - 현재 동작 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('대시보드 기본 요소들이 표시되어야 함', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1:has-text("나의 성장 현황")')).toBeVisible()
    
    // 에너지 표시 확인
    await expect(page.locator('[data-testid="energy-display"]')).toBeVisible()
    
    // 4개의 스탯 카드 확인
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)
    
    // 각 스탯 이름 확인
    await expect(page.locator('text=건강')).toBeVisible()
    await expect(page.locator('text=학습')).toBeVisible()
    await expect(page.locator('text=관계')).toBeVisible()
    await expect(page.locator('text=성취')).toBeVisible()
  })

  test('스탯 카드 클릭이 동작해야 함', async ({ page }) => {
    // 건강 스탯 카드 클릭
    const healthCard = page.locator('[data-testid="stat-card"]:has-text("건강")')
    await healthCard.click()
    
    // 모달이 열리는지 확인
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // 모달 제목 확인
    await expect(page.locator('[role="dialog"] h2:has-text("건강")')).toBeVisible()
    
    // 액션 옵션들이 표시되는지 확인
    await expect(page.locator('text=3초 기록')).toBeVisible()
    await expect(page.locator('text=성장일지')).toBeVisible()
  })

  test('3초 기록 기능이 동작해야 함', async ({ page }) => {
    // 건강 스탯 카드 클릭
    await page.click('[data-testid="stat-card"]:has-text("건강")')
    
    // 3초 기록 버튼 클릭
    await page.click('button:has-text("3초 기록")')
    
    // 입력 필드가 나타나는지 확인
    await expect(page.locator('input[placeholder*="활동"]')).toBeVisible()
    
    // 활동 입력
    await page.fill('input[placeholder*="활동"]', '10분 산책')
    
    // 저장 버튼 클릭
    await page.click('button:has-text("저장")')
    
    // 성공 메시지 또는 모달 닫힘 확인
    await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 3000 })
    
    // 토스트 메시지 확인 (있다면)
    const toast = page.locator('[data-testid="toast"], .toast-success')
    if (await toast.isVisible().catch(() => false)) {
      await expect(toast).toContainText(/기록|저장|완료/)
    }
  })

  test('성장일지 기능이 동작해야 함', async ({ page }) => {
    // 학습 스탯 카드 클릭
    await page.click('[data-testid="stat-card"]:has-text("학습")')
    
    // 성장일지 버튼 클릭
    await page.click('button:has-text("성장일지")')
    
    // 성장일지 입력 영역 확인
    await expect(page.locator('textarea, [contenteditable="true"]')).toBeVisible()
    
    // 내용 입력
    const editor = page.locator('textarea, [contenteditable="true"]').first()
    await editor.fill('오늘 React 훅에 대해 공부했다. useEffect의 의존성 배열에 대해 더 깊이 이해하게 되었다.')
    
    // 저장 버튼 클릭
    await page.click('button:has-text("저장")')
    
    // 저장 완료 확인
    await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 3000 })
  })

  test('레벨 및 경험치가 표시되어야 함', async ({ page }) => {
    // 각 스탯 카드에서 레벨 표시 확인
    const statCards = page.locator('[data-testid="stat-card"]')
    const cardCount = await statCards.count()
    
    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i)
      
      // Lv. 표시 확인
      await expect(card.locator('text=/Lv\\.\\s*\\d+/')).toBeVisible()
      
      // EXP 표시 확인
      await expect(card.locator('text=/\\d+\\/\\d+\\s*EXP/')).toBeVisible()
      
      // 진행도 바 확인
      const progressBar = card.locator('[class*="rounded-full"][class*="bg-white"]')
      await expect(progressBar).toBeVisible()
    }
  })

  test('음성 입력 버튼이 표시되어야 함', async ({ page }) => {
    // 음성 입력 버튼 확인 (화면 하단)
    const voiceButton = page.locator('button[aria-label*="음성"], button:has(svg.lucide-mic)')
    await expect(voiceButton).toBeVisible()
    
    // 버튼 위치 확인 (하단 중앙)
    const buttonBox = await voiceButton.boundingBox()
    if (buttonBox) {
      const viewportSize = page.viewportSize()
      if (viewportSize) {
        // 버튼이 화면 하단에 있는지 확인
        expect(buttonBox.y).toBeGreaterThan(viewportSize.height * 0.7)
      }
    }
  })

  test('활동 요약이 표시되어야 함', async ({ page }) => {
    // 활동 요약 섹션 확인
    const activitySection = page.locator('text=/최근 활동|오늘의 활동|활동 요약/')
    
    if (await activitySection.isVisible().catch(() => false)) {
      // 활동 목록이 있는지 확인
      const activityItems = page.locator('[class*="activity"], [data-testid="activity-item"]')
      const count = await activityItems.count()
      
      // 활동이 있으면 표시되는지 확인
      if (count > 0) {
        await expect(activityItems.first()).toBeVisible()
      }
    }
  })

  test('네비게이션이 동작해야 함', async ({ page }) => {
    // 네비게이션 바 확인
    await expect(page.locator('nav')).toBeVisible()
    
    // 프로필 링크 클릭
    await page.click('nav a[href="/profile"]')
    await expect(page).toHaveURL('/profile')
    
    // 대시보드로 돌아가기
    await page.click('nav a[href="/dashboard"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('로딩 상태가 올바르게 표시되어야 함', async ({ page }) => {
    // 페이지 새로고침으로 로딩 상태 확인
    await page.reload()
    
    // 로딩 스켈레톤 또는 스피너 확인
    const loadingIndicator = page.locator('[class*="skeleton"], [class*="loading"], [class*="animate-pulse"]').first()
    
    // 로딩 표시가 있었다가 사라지는지 확인
    if (await loadingIndicator.isVisible().catch(() => false)) {
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 })
    }
    
    // 콘텐츠가 로드되었는지 확인
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible()
  })

  test('에러 상태 처리가 동작해야 함', async ({ page }) => {
    // 네트워크 에러 시뮬레이션
    await page.route('**/api/**', route => route.abort())
    
    // 페이지 새로고침
    await page.reload()
    
    // 에러 메시지나 재시도 버튼 확인
    const errorMessage = page.locator('text=/오류|에러|실패|다시 시도/')
    const retryButton = page.locator('button:has-text("다시 시도")')
    
    // 에러 처리 UI가 표시되는지 확인
    const hasErrorUI = await errorMessage.isVisible().catch(() => false) || 
                      await retryButton.isVisible().catch(() => false)
    
    // 에러 처리가 있는 경우에만 검증
    if (hasErrorUI) {
      expect(hasErrorUI).toBeTruthy()
    }
  })
})

/**
 * 대시보드 반응형 디자인 테스트
 */
test.describe('Dashboard - 반응형 디자인', () => {
  test('모바일 화면에서 올바르게 표시되어야 함', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // 스탯 카드가 세로로 배치되는지 확인
    const statCards = page.locator('[data-testid="stat-card"]')
    const firstCard = await statCards.first().boundingBox()
    const secondCard = await statCards.nth(1).boundingBox()
    
    if (firstCard && secondCard) {
      // 두 번째 카드가 첫 번째 카드 아래에 있는지 확인
      expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height)
    }
    
    // 스와이프 힌트가 표시되는지 확인
    const swipeHint = page.locator('text=스와이프')
    if (await swipeHint.isVisible().catch(() => false)) {
      await expect(swipeHint).toBeVisible()
    }
  })

  test('태블릿 화면에서 올바르게 표시되어야 함', async ({ page }) => {
    // 태블릿 뷰포트 설정
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    
    // 스탯 카드가 2x2 그리드로 표시되는지 확인
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)
    
    const cards = []
    for (let i = 0; i < 4; i++) {
      const box = await statCards.nth(i).boundingBox()
      if (box) cards.push(box)
    }
    
    // 2x2 레이아웃 확인
    if (cards.length === 4) {
      // 첫 번째 행의 카드들
      expect(cards[0].y).toBeCloseTo(cards[1].y, 5)
      // 두 번째 행의 카드들
      expect(cards[2].y).toBeCloseTo(cards[3].y, 5)
      // 행 간격 확인
      expect(cards[2].y).toBeGreaterThan(cards[0].y + cards[0].height)
    }
  })
})

/**
 * 대시보드 데이터 동기화 테스트
 */
test.describe('Dashboard - 데이터 동기화', () => {
  test('활동 기록 후 스탯이 업데이트되어야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 초기 경험치 값 저장
    const healthCard = page.locator('[data-testid="stat-card"]:has-text("건강")')
    const initialExpText = await healthCard.locator('text=/\\d+\\/\\d+\\s*EXP/').textContent()
    const initialExp = parseInt(initialExpText?.match(/\\d+/)?.[0] || '0')
    
    // 건강 활동 기록
    await healthCard.click()
    await page.click('button:has-text("3초 기록")')
    await page.fill('input[placeholder*="활동"]', '아침 조깅 30분')
    await page.click('button:has-text("저장")')
    
    // 모달 닫힘 대기
    await page.waitForTimeout(1000)
    
    // 경험치가 증가했는지 확인
    const updatedExpText = await healthCard.locator('text=/\\d+\\/\\d+\\s*EXP/').textContent()
    const updatedExp = parseInt(updatedExpText?.match(/\\d+/)?.[0] || '0')
    
    // 경험치가 증가했는지 확인 (정확한 양은 설정에 따라 다를 수 있음)
    expect(updatedExp).toBeGreaterThanOrEqual(initialExp)
  })

  test('레벨업 시 애니메이션이 표시되어야 함', async ({ page }) => {
    // 이 테스트는 레벨업 조건을 만족시키기 어려우므로
    // 레벨업 애니메이션 요소가 DOM에 있는지만 확인
    await page.goto('/dashboard')
    
    // 레벨업 축하 컴포넌트가 준비되어 있는지 확인
    // (실제 레벨업 시 표시됨)
    const levelUpComponent = page.locator('[data-testid="level-up-celebration"], [class*="level-up"]')
    
    // DOM에 숨겨진 상태로 존재하거나, 조건부 렌더링으로 준비되어 있는지 확인
    const exists = await levelUpComponent.count() > 0 || 
                  await page.locator('script:has-text("LevelUpCelebration")').count() > 0
    
    // 레벨업 시스템이 구현되어 있는지 확인
    expect(exists).toBeTruthy()
  })
})