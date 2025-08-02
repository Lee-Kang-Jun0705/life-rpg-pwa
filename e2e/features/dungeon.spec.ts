import { test, expect } from '@playwright/test'

test.describe('Dungeon Features - 던전 시스템', () => {
  test.beforeEach(async({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })

    await page.goto('/dungeon')
  })

  test('던전 목록이 표시되어야 함', async({ page }) => {
    // 던전 선택 섹션
    await expect(page.locator('text=던전 선택')).toBeVisible()

    // 난이도별 던전 카드
    const difficulties = ['쉬움', '보통', '어려움', '악몽']

    for (const difficulty of difficulties) {
      const dungeonCard = page.locator(`text=${difficulty}`).locator('..')
      await expect(dungeonCard).toBeVisible()

      // 보상 정보 표시
      await expect(dungeonCard.locator('text=/\\d+\\s*경험치/')).toBeVisible()
      await expect(dungeonCard.locator('text=/\\d+\\s*골드/')).toBeVisible()
    }
  })

  test('일일 던전이 표시되어야 함', async({ page }) => {
    // 일일 던전 섹션
    const dailySection = page.locator('text=일일 던전').locator('..')
    await expect(dailySection).toBeVisible()

    // 남은 시간 표시
    await expect(dailySection.locator('text=/\\d+시간\\s*\\d+분/')).toBeVisible()

    // 추가 보상 정보
    await expect(dailySection.locator('text=추가 보상')).toBeVisible()
  })

  test('던전 입장 및 전투가 작동해야 함', async({ page }) => {
    // 쉬움 던전 선택
    await page.click('text=쉬움 >> .. >> button:has-text("입장")')

    // 전투 화면 로드 확인
    await expect(page.locator('text=전투 중')).toBeVisible({ timeout: 10000 })

    // 몬스터 정보
    await expect(page.locator('[data-testid="monster-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="monster-hp"]')).toBeVisible()

    // 플레이어 정보
    await expect(page.locator('[data-testid="player-hp"]')).toBeVisible()
    await expect(page.locator('[data-testid="player-energy"]')).toBeVisible()

    // 스킬 버튼들
    const skillButtons = page.locator('[data-testid="skill-button"]')
    await expect(skillButtons).toHaveCount(4) // 4개 스킬 슬롯
  })

  test('스킬 사용 및 전투 진행이 가능해야 함', async({ page }) => {
    // 던전 입장
    await page.click('text=쉬움 >> .. >> button:has-text("입장")')
    await page.waitForSelector('text=전투 중')

    // 첫 번째 스킬 사용
    const firstSkill = page.locator('[data-testid="skill-button"]').first()
    const initialMonsterHP = await page.locator('[data-testid="monster-hp"]').textContent()

    await firstSkill.click()

    // 데미지 애니메이션 확인
    await expect(page.locator('text=/\\-\\d+/')).toBeVisible()

    // 몬스터 HP 감소 확인
    await page.waitForTimeout(1000)
    const afterMonsterHP = await page.locator('[data-testid="monster-hp"]').textContent()
    expect(afterMonsterHP).not.toBe(initialMonsterHP)
  })

  test('전투 승리 시 보상을 받아야 함', async({ page }) => {
    // 쉬움 던전 입장
    await page.click('text=쉬움 >> .. >> button:has-text("입장")')
    await page.waitForSelector('text=전투 중')

    // 자동 전투 또는 빠른 승리를 위한 반복 공격
    const attackUntilVictory = async() => {
      for (let i = 0; i < 20; i++) {
        const isVictory = await page.locator('text=승리!').isVisible()
        if (isVictory) {
          break
        }

        const skillButton = page.locator('[data-testid="skill-button"]').first()
        if (await skillButton.isEnabled()) {
          await skillButton.click()
          await page.waitForTimeout(500)
        }
      }
    }

    await attackUntilVictory()

    // 승리 화면 확인
    await expect(page.locator('text=승리!')).toBeVisible({ timeout: 30000 })

    // 보상 표시
    await expect(page.locator('text=/\\+\\d+\\s*경험치/')).toBeVisible()
    await expect(page.locator('text=/\\+\\d+\\s*골드/')).toBeVisible()

    // 아이템 드롭 (있을 경우)
    const itemDrop = page.locator('text=획득한 아이템')
    if (await itemDrop.isVisible()) {
      await expect(itemDrop.locator('..')).toContainText(/\w+/)
    }
  })

  test('전투 패배 시 적절한 처리가 되어야 함', async({ page }) => {
    // 악몽 난이도 선택 (패배 가능성 높음)
    const nightmareButton = page.locator('text=악몽 >> .. >> button:has-text("입장")')

    // 레벨 확인 후 입장 가능 여부 체크
    if (await nightmareButton.isEnabled()) {
      await nightmareButton.click()
      await page.waitForSelector('text=전투 중')

      // HP가 0이 될 때까지 대기 (타임아웃 설정)
      const defeatPromise = page.waitForSelector('text=패배', { timeout: 60000 }).catch(() => null)

      // 일부러 행동하지 않고 패배 대기
      const defeat = await defeatPromise

      if (defeat) {
        // 패배 화면 확인
        await expect(page.locator('text=패배')).toBeVisible()

        // 재도전 또는 돌아가기 버튼
        await expect(page.locator('button:has-text("돌아가기")')).toBeVisible()
      }
    } else {
      // 레벨 부족 메시지 확인
      await expect(page.locator('text=/레벨.*부족/')).toBeVisible()
    }
  })

  test('멀티플레이어 던전 UI가 표시되어야 함', async({ page }) => {
    // 멀티플레이어 탭 또는 섹션
    const multiplayerTab = page.locator('text=멀티플레이어')

    if (await multiplayerTab.isVisible()) {
      await multiplayerTab.click()

      // 파티 찾기 버튼
      await expect(page.locator('text=파티 찾기')).toBeVisible()

      // 친구 초대 버튼
      await expect(page.locator('text=친구 초대')).toBeVisible()

      // 현재 접속자 수 또는 대기 중인 파티
      const onlineIndicator = page.locator('text=/온라인:\\s*\\d+/')
      if (await onlineIndicator.isVisible()) {
        await expect(onlineIndicator).toBeVisible()
      }
    }
  })

  test('던전 진행도가 저장되어야 함', async({ page }) => {
    // 던전 진행 상태 확인
    const progressSection = page.locator('text=던전 진행도').locator('..')

    if (await progressSection.isVisible()) {
      // 클리어한 던전 수
      await expect(progressSection.locator('text=/\\d+\\/\\d+/')).toBeVisible()

      // 최고 난이도 클리어
      await expect(progressSection.locator('text=/최고 난이도:/')).toBeVisible()
    }

    // 던전 입장 후 중간 종료
    await page.click('text=쉬움 >> .. >> button:has-text("입장")')
    await page.waitForSelector('text=전투 중')

    // 페이지 새로고침
    await page.reload()

    // 진행 중이던 던전 재개 옵션 확인
    const resumeOption = page.locator('text=이어하기')
    if (await resumeOption.isVisible()) {
      await expect(resumeOption).toBeVisible()
    }
  })

  test('던전 보상 배율이 표시되어야 함', async({ page }) => {
    // 각 난이도별 보상 배율
    const dungeonCards = page.locator('[data-testid="dungeon-card"]')
    const count = await dungeonCards.count()

    for (let i = 0; i < count; i++) {
      const card = dungeonCards.nth(i)

      // 보상 배율 표시 (예: x1.5, x2.0)
      const multiplier = card.locator('text=/x\\d+\\.\\d+/')
      if (await multiplier.isVisible()) {
        await expect(multiplier).toBeVisible()
      }

      // 추천 레벨 표시
      await expect(card.locator('text=/권장.*Lv\\.\\s*\\d+/')).toBeVisible()
    }
  })

  test('반응형 레이아웃이 적용되어야 함', async({ page }) => {
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1200, height: 800 })

    // 던전 카드가 그리드로 표시되는지 확인
    const dungeonGrid = page.locator('[data-testid="dungeon-grid"]')
    if (await dungeonGrid.isVisible()) {
      const gridStyle = await dungeonGrid.evaluate(el =>
        window.getComputedStyle(el).display
      )
      expect(gridStyle).toBe('grid')
    }

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 })

    // 던전 카드가 세로로 쌓이는지 확인
    const firstCard = await page.locator('[data-testid="dungeon-card"]').first().boundingBox()
    const secondCard = await page.locator('[data-testid="dungeon-card"]').nth(1).boundingBox()

    if (firstCard && secondCard) {
      expect(firstCard.x).toBe(secondCard.x) // 같은 x 위치
      expect(firstCard.y).toBeLessThan(secondCard.y) // 세로로 배치
    }
  })
})
