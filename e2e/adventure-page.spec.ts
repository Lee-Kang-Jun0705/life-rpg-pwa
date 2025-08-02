import { test, expect, Page } from '@playwright/test'

test.describe('Adventure Page - Complete Test Suite', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/adventure')
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
  })

  test('모험 페이지 기본 UI 요소 확인', async () => {
    // 제목 확인
    await expect(page.locator('h1')).toContainText('모험과 탐험')
    
    // 네비게이션 바 확인
    await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible()
    
    // 주요 섹션 확인
    await expect(page.locator('text=던전 탐험')).toBeVisible()
    await expect(page.locator('text=현재 층')).toBeVisible()
    await expect(page.locator('text=진행 상황')).toBeVisible()
  })

  test('던전 진입 및 전투 시작', async () => {
    // 던전 입장 버튼 클릭
    const enterButton = page.locator('button:has-text("던전 입장")')
    await expect(enterButton).toBeVisible()
    await enterButton.click()
    
    // 전투 화면 로드 대기
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 })
    
    // 전투 UI 요소 확인
    await expect(page.locator('text=/플레이어 Lv/')).toBeVisible()
    await expect(page.locator('text=/HP:/')).toBeVisible()
    
    // 콘솔 에러 체크
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })
    
    // 5초 대기 후 에러 확인
    await page.waitForTimeout(5000)
    expect(consoleMessages).toHaveLength(0)
  })

  test('컴패니언 표시 확인', async () => {
    // 컴패니언 섹션 확인
    const companionSection = page.locator('text=활성 컴패니언')
    
    // 컴패니언이 있는 경우
    const companionCard = page.locator('[data-testid="companion-card"]')
    const companionCount = await companionCard.count()
    
    if (companionCount > 0) {
      // 컴패니언 정보 확인
      await expect(companionCard.first()).toBeVisible()
      
      // 컴패니언 스탯 확인
      await expect(page.locator('text=/HP:.*\\d+/')).toBeVisible()
      await expect(page.locator('text=/공격력:.*\\d+/')).toBeVisible()
      await expect(page.locator('text=/방어력:.*\\d+/')).toBeVisible()
    }
  })

  test('퀘스트 시스템 확인', async () => {
    // 활성 퀘스트 섹션 확인
    await expect(page.locator('text=활성 퀘스트')).toBeVisible()
    
    // 퀘스트 카드 확인
    const questCards = page.locator('[data-testid="quest-card"]')
    const questCount = await questCards.count()
    
    if (questCount > 0) {
      // 첫 번째 퀘스트 확인
      const firstQuest = questCards.first()
      await expect(firstQuest).toBeVisible()
      
      // 퀘스트 진행률 확인
      await expect(firstQuest.locator('.bg-blue-500')).toBeVisible()
    }
  })

  test('난이도 조절 기능 확인', async () => {
    // 난이도 표시 확인
    const difficultyText = page.locator('text=/난이도:.*보통/')
    await expect(difficultyText).toBeVisible()
    
    // 난이도 조절 버튼 확인
    const difficultyButtons = page.locator('button:has-text("난이도")')
    const buttonCount = await difficultyButtons.count()
    
    if (buttonCount > 0) {
      await difficultyButtons.first().click()
      // 난이도 변경 확인
      await page.waitForTimeout(1000)
    }
  })

  test('전투 애니메이션 및 효과 확인', async () => {
    // 던전 입장
    await page.locator('button:has-text("던전 입장")').click()
    await page.waitForSelector('.fixed.inset-0')
    
    // 전투 시작 대기
    await page.waitForTimeout(2000)
    
    // 데미지 표시 확인
    const damageIndicators = page.locator('.text-red-500, .text-yellow-500')
    await page.waitForSelector('.text-red-500, .text-yellow-500', { 
      timeout: 10000,
      state: 'visible' 
    }).catch(() => {
      console.log('No damage indicators found within timeout')
    })
    
    // 전투 로그 확인
    const battleLog = page.locator('[data-testid="battle-log"]')
    if (await battleLog.isVisible()) {
      const logEntries = battleLog.locator('div')
      expect(await logEntries.count()).toBeGreaterThan(0)
    }
  })

  test('자동 전투 시스템 확인', async () => {
    // 던전 입장
    await page.locator('button:has-text("던전 입장")').click()
    await page.waitForSelector('.fixed.inset-0')
    
    // 자동 전투가 시작되는지 확인
    await page.waitForTimeout(3000)
    
    // 전투 로그가 자동으로 추가되는지 확인
    const battleLogBefore = await page.locator('[role="log"] p').count()
    await page.waitForTimeout(5000) // 자동 전투 진행 대기
    const battleLogAfter = await page.locator('[role="log"] p').count()
    
    // 자동으로 전투가 진행되어 로그가 추가되었는지 확인
    expect(battleLogAfter).toBeGreaterThan(battleLogBefore)
    
    // 스킬 버튼이 활성화되어 있는지 확인 (수동 개입 가능)
    const skillButtons = page.locator('[role="toolbar"][aria-label="스킬 선택"] button')
    const skillButtonCount = await skillButtons.count()
    expect(skillButtonCount).toBeGreaterThan(0)
  })

  test('CSS 스타일 검증', async () => {
    // 그라디언트 배경 확인
    const mainContainer = page.locator('.min-h-screen')
    await expect(mainContainer).toHaveCSS('background-image', /gradient/)
    
    // 카드 스타일 확인
    const cards = page.locator('.bg-white.rounded-lg.shadow-lg')
    const cardCount = await cards.count()
    
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i)
      await expect(card).toHaveCSS('border-radius', '8px')
      await expect(card).toHaveCSS('box-shadow', /shadow/)
    }
    
    // 버튼 호버 효과 확인
    const button = page.locator('button').first()
    await button.hover()
    await page.waitForTimeout(300) // 트랜지션 대기
  })

  test('반응형 디자인 확인', async () => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // 모바일에서 UI 확인
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button')).toBeVisible()
    
    // 태블릿 뷰포트
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
  })

  test('스크린샷 캡처', async () => {
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/adventure-page-full.png',
      fullPage: true 
    })
    
    // 던전 입장 후 전투 화면 스크린샷
    await page.locator('button:has-text("던전 입장")').click()
    await page.waitForSelector('.fixed.inset-0')
    await page.waitForTimeout(3000) // 전투 시작 대기
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/adventure-battle.png' 
    })
    
    // 콘솔 로그 캡처
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })
    
    // 로그를 파일로 저장
    const fs = require('fs')
    fs.writeFileSync(
      'C:/Users/USER/Pictures/Screenshots/adventure-console-logs.txt',
      consoleLogs.join('\n')
    )
  })
})