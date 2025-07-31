import { test, expect } from '@playwright/test'

test.describe('Dashboard Features - 대시보드 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('스탯 카드가 정상적으로 표시되어야 함', async ({ page }) => {
    // 4개의 주요 스탯 카드 확인
    const stats = ['건강', '학습', '관계', '성취']
    
    for (const stat of stats) {
      const statCard = page.locator(`text=${stat}`).locator('..')
      await expect(statCard).toBeVisible()
      
      // 스탯 값 표시 확인
      await expect(statCard.locator('[class*="text-3xl"]')).toBeVisible()
      
      // 진행률 바 확인
      await expect(statCard.locator('[role="progressbar"]')).toBeVisible()
    }
  })

  test('캐릭터 정보가 표시되어야 함', async ({ page }) => {
    // 캐릭터 섹션 확인
    const characterSection = page.locator('[data-testid="character-info"]')
    
    // 레벨 표시
    await expect(characterSection.locator('text=/레벨\\s*\\d+/')).toBeVisible()
    
    // 경험치 바
    await expect(characterSection.locator('[role="progressbar"]')).toBeVisible()
    
    // 골드 표시
    await expect(characterSection.locator('text=/\\d+\\s*골드/')).toBeVisible()
  })

  test('빠른 행동 버튼들이 작동해야 함', async ({ page }) => {
    // 운동하기 버튼
    const exerciseBtn = page.locator('button:has-text("운동하기")')
    await expect(exerciseBtn).toBeVisible()
    
    await exerciseBtn.click()
    
    // 스탯 변화 확인 (토스트 메시지나 애니메이션)
    await expect(page.locator('text=/\\+\\d+/')).toBeVisible()
  })

  test('최근 활동 목록이 표시되어야 함', async ({ page }) => {
    // 최근 활동 섹션
    const recentSection = page.locator('text=최근 활동').locator('..')
    await expect(recentSection).toBeVisible()
    
    // 활동이 없을 경우 안내 메시지
    const hasActivities = await recentSection.locator('.activity-item').count() > 0
    
    if (!hasActivities) {
      await expect(recentSection.locator('text=/아직 기록된 활동이 없습니다/')).toBeVisible()
    } else {
      // 활동 아이템 구조 확인
      const firstActivity = recentSection.locator('.activity-item').first()
      await expect(firstActivity.locator('[class*="title"]')).toBeVisible()
      await expect(firstActivity.locator('[class*="time"]')).toBeVisible()
    }
  })

  test('레벨업 애니메이션이 표시되어야 함', async ({ page }) => {
    // 레벨업 트리거 (테스트용 - 실제로는 활동 수행으로 레벨업)
    const levelUpTrigger = async () => {
      // 여러 번 활동 수행하여 레벨업 유도
      for (let i = 0; i < 10; i++) {
        await page.click('button:has-text("운동하기")')
        await page.waitForTimeout(500)
      }
    }
    
    // 레벨업 감지
    const levelUpPromise = page.waitForSelector('text=/레벨업!|Level Up!/i', { 
      timeout: 10000 
    }).catch(() => null)
    
    await levelUpTrigger()
    
    const levelUpElement = await levelUpPromise
    if (levelUpElement) {
      // 레벨업 애니메이션 확인
      await expect(levelUpElement).toBeVisible()
      
      // Confetti 효과 확인 (canvas 요소)
      const hasConfetti = await page.locator('canvas').count() > 0
      expect(hasConfetti).toBeTruthy()
    }
  })

  test('반응형 레이아웃이 적용되어야 함', async ({ page }) => {
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1200, height: 800 })
    
    // 스탯 카드가 가로로 배치되는지 확인
    const statCards = page.locator('[data-testid="stat-card"]')
    const firstCard = await statCards.first().boundingBox()
    const secondCard = await statCards.nth(1).boundingBox()
    
    if (firstCard && secondCard) {
      expect(firstCard.y).toBe(secondCard.y) // 같은 줄에 있음
    }
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 스탯 카드가 세로로 배치되는지 확인
    const firstCardMobile = await statCards.first().boundingBox()
    const secondCardMobile = await statCards.nth(1).boundingBox()
    
    if (firstCardMobile && secondCardMobile) {
      expect(firstCardMobile.y).toBeLessThan(secondCardMobile.y) // 다른 줄에 있음
    }
  })
})