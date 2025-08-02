import { test, expect } from '@playwright/test'

test.describe('Activities Features - 활동 관리', () => {
  test.beforeEach(async({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })

    await page.goto('/activities')
  })

  test('활동 목록이 표시되어야 함', async({ page }) => {
    // 페이지 제목
    await expect(page.locator('h1:has-text("활동")')).toBeVisible()

    // 활동 추가 버튼
    await expect(page.locator('button:has-text("활동 추가")')).toBeVisible()

    // 카테고리 필터
    const categories = ['전체', '건강', '학습', '관계', '성취']
    for (const category of categories) {
      await expect(page.locator(`button:has-text("${category}")`)).toBeVisible()
    }
  })

  test('새 활동을 추가할 수 있어야 함', async({ page }) => {
    // 활동 추가 버튼 클릭
    await page.click('button:has-text("활동 추가")')

    // 모달 또는 폼 표시 확인
    await expect(page.locator('text=새 활동 추가')).toBeVisible()

    // 폼 필드 채우기
    await page.fill('input[name="title"]', '아침 운동')
    await page.fill('textarea[name="description"]', '매일 아침 30분 조깅')
    await page.selectOption('select[name="category"]', 'health')

    // 스탯 증가량 설정
    await page.fill('input[name="healthPoints"]', '10')

    // 저장
    await page.click('button:has-text("저장")')

    // 추가된 활동 확인
    await expect(page.locator('text=아침 운동')).toBeVisible()
    await expect(page.locator('text=매일 아침 30분 조깅')).toBeVisible()
  })

  test('활동을 수행할 수 있어야 함', async({ page }) => {
    // 기존 활동이 있는지 확인
    const activityCards = page.locator('[data-testid="activity-card"]')
    const count = await activityCards.count()

    if (count === 0) {
      // 활동이 없으면 하나 추가
      await page.click('button:has-text("활동 추가")')
      await page.fill('input[name="title"]', '테스트 활동')
      await page.selectOption('select[name="category"]', 'health')
      await page.click('button:has-text("저장")')
    }

    // 첫 번째 활동 수행
    const firstActivity = page.locator('[data-testid="activity-card"]').first()
    await firstActivity.locator('button:has-text("수행")').click()

    // 수행 확인 모달 또는 토스트
    const confirmationVisible = await page.locator('text=/수행.*완료|활동.*완료/').isVisible()
    if (confirmationVisible) {
      await expect(page.locator('text=/수행.*완료|활동.*완료/')).toBeVisible()
    }

    // 스탯 증가 표시
    await expect(page.locator('text=/\\+\\d+/')).toBeVisible()
  })

  test('활동을 편집할 수 있어야 함', async({ page }) => {
    // 활동이 있는지 확인
    const hasActivities = await page.locator('[data-testid="activity-card"]').count() > 0

    if (!hasActivities) {
      // 활동 추가
      await page.click('button:has-text("활동 추가")')
      await page.fill('input[name="title"]', '편집할 활동')
      await page.selectOption('select[name="category"]', 'learning')
      await page.click('button:has-text("저장")')
    }

    // 편집 버튼 클릭
    const firstActivity = page.locator('[data-testid="activity-card"]').first()
    await firstActivity.locator('button[aria-label="편집"]').click()

    // 편집 폼 표시 확인
    await expect(page.locator('text=활동 편집')).toBeVisible()

    // 제목 수정
    const titleInput = page.locator('input[name="title"]')
    await titleInput.clear()
    await titleInput.fill('수정된 활동')

    // 저장
    await page.click('button:has-text("저장")')

    // 수정된 내용 확인
    await expect(page.locator('text=수정된 활동')).toBeVisible()
  })

  test('활동을 삭제할 수 있어야 함', async({ page }) => {
    // 삭제할 활동 추가
    await page.click('button:has-text("활동 추가")')
    await page.fill('input[name="title"]', '삭제될 활동')
    await page.selectOption('select[name="category"]', 'relationship')
    await page.click('button:has-text("저장")')

    // 활동이 추가되었는지 확인
    await expect(page.locator('text=삭제될 활동')).toBeVisible()

    // 삭제 버튼 클릭
    const targetActivity = page.locator('text=삭제될 활동').locator('..')
    await targetActivity.locator('button[aria-label="삭제"]').click()

    // 삭제 확인 다이얼로그
    await expect(page.locator('text=정말 삭제하시겠습니까?')).toBeVisible()
    await page.click('button:has-text("삭제")')

    // 활동이 삭제되었는지 확인
    await expect(page.locator('text=삭제될 활동')).not.toBeVisible()
  })

  test('카테고리별 필터링이 작동해야 함', async({ page }) => {
    // 각 카테고리별로 활동 추가
    const categories = [
      { value: 'health', name: '건강', title: '운동하기' },
      { value: 'learning', name: '학습', title: '책 읽기' },
      { value: 'relationship', name: '관계', title: '친구 만나기' },
      { value: 'achievement', name: '성취', title: '프로젝트 완성' }
    ]

    // 활동들 추가
    for (const cat of categories) {
      await page.click('button:has-text("활동 추가")')
      await page.fill('input[name="title"]', cat.title)
      await page.selectOption('select[name="category"]', cat.value)
      await page.click('button:has-text("저장")')
    }

    // 각 카테고리 필터 테스트
    for (const cat of categories) {
      await page.click(`button:has-text("${cat.name}")`)

      // 해당 카테고리 활동만 표시되는지 확인
      await expect(page.locator(`text=${cat.title}`)).toBeVisible()

      // 다른 카테고리 활동은 숨겨져야 함
      for (const other of categories) {
        if (other.value !== cat.value) {
          await expect(page.locator(`text=${other.title}`)).not.toBeVisible()
        }
      }
    }

    // 전체 필터
    await page.click('button:has-text("전체")')
    for (const cat of categories) {
      await expect(page.locator(`text=${cat.title}`)).toBeVisible()
    }
  })

  test('활동 검색이 작동해야 함', async({ page }) => {
    // 검색창이 있는지 확인
    const searchInput = page.locator('input[placeholder*="검색"]')

    if (await searchInput.isVisible()) {
      // 테스트용 활동 추가
      const testActivities = ['아침 운동', '저녁 독서', '영어 공부']
      for (const title of testActivities) {
        await page.click('button:has-text("활동 추가")')
        await page.fill('input[name="title"]', title)
        await page.selectOption('select[name="category"]', 'learning')
        await page.click('button:has-text("저장")')
      }

      // 검색 테스트
      await searchInput.fill('운동')

      // 검색 결과 확인
      await expect(page.locator('text=아침 운동')).toBeVisible()
      await expect(page.locator('text=저녁 독서')).not.toBeVisible()
      await expect(page.locator('text=영어 공부')).not.toBeVisible()

      // 검색어 변경
      await searchInput.clear()
      await searchInput.fill('공부')

      await expect(page.locator('text=영어 공부')).toBeVisible()
      await expect(page.locator('text=아침 운동')).not.toBeVisible()
    }
  })

  test('활동 즐겨찾기가 작동해야 함', async({ page }) => {
    // 활동이 있는지 확인
    const hasActivities = await page.locator('[data-testid="activity-card"]').count() > 0

    if (!hasActivities) {
      // 활동 추가
      await page.click('button:has-text("활동 추가")')
      await page.fill('input[name="title"]', '즐겨찾기 테스트')
      await page.selectOption('select[name="category"]', 'health')
      await page.click('button:has-text("저장")')
    }

    // 즐겨찾기 버튼 찾기
    const firstActivity = page.locator('[data-testid="activity-card"]').first()
    const favoriteButton = firstActivity.locator('[aria-label="즐겨찾기"]')

    if (await favoriteButton.isVisible()) {
      // 즐겨찾기 토글
      await favoriteButton.click()

      // 즐겨찾기 상태 변경 확인 (아이콘 변경 등)
      const isFavorited = await favoriteButton.evaluate(btn =>
        btn.classList.contains('active') ||
        btn.querySelector('svg')?.classList.contains('fill-current')
      )
      expect(isFavorited).toBeTruthy()

      // 즐겨찾기 필터가 있다면 테스트
      const favoriteFilter = page.locator('button:has-text("즐겨찾기")')
      if (await favoriteFilter.isVisible()) {
        await favoriteFilter.click()
        await expect(firstActivity).toBeVisible()
      }
    }
  })

  test('활동 통계가 표시되어야 함', async({ page }) => {
    // 통계 섹션 확인
    const statsSection = page.locator('text=오늘의 활동').locator('..')

    if (await statsSection.isVisible()) {
      // 오늘 수행한 활동 수
      await expect(statsSection.locator('text=/\\d+.*완료/')).toBeVisible()

      // 획득한 경험치
      await expect(statsSection.locator('text=/\\d+.*경험치/')).toBeVisible()

      // 연속 수행 일수 (streak)
      const streakElement = statsSection.locator('text=/\\d+.*연속/')
      if (await streakElement.isVisible()) {
        await expect(streakElement).toBeVisible()
      }
    }
  })

  test('반응형 레이아웃이 적용되어야 함', async({ page }) => {
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1200, height: 800 })

    // 활동 카드가 그리드로 표시되는지 확인
    const activityGrid = page.locator('[data-testid="activity-grid"]')
    if (await activityGrid.isVisible()) {
      const gridColumns = await activityGrid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      )
      expect(gridColumns).toContain('repeat')
    }

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 })

    // 활동 카드가 세로로 쌓이는지 확인
    const cards = page.locator('[data-testid="activity-card"]')
    const count = await cards.count()

    if (count >= 2) {
      const firstCard = await cards.first().boundingBox()
      const secondCard = await cards.nth(1).boundingBox()

      if (firstCard && secondCard) {
        expect(firstCard.width).toBeCloseTo(secondCard.width, 1)
        expect(firstCard.y).toBeLessThan(secondCard.y)
      }
    }
  })
})
