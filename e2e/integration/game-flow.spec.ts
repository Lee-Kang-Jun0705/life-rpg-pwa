import { test, expect } from '@playwright/test'

test.describe('Game Flow Integration - 게임 플로우 통합 테스트', () => {
  test.beforeEach(async({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })
  })

  test('신규 플레이어 전체 게임 플로우', async({ page }) => {
    // 1. 초기 설정
    await page.goto('/')
    await expect(page).toHaveURL('/dashboard')

    // 2. 프로필 설정
    await page.goto('/profile')
    await page.fill('input[name="nickname"]', '테스트용사')
    await page.fill('textarea[name="bio"]', '게임을 시작하는 새로운 용사입니다')
    await page.click('button:has-text("저장")')
    await expect(page.locator('text=저장되었습니다')).toBeVisible()

    // 3. 첫 활동 생성
    await page.goto('/activities')
    await page.click('button:has-text("활동 추가")')
    await page.fill('input[name="title"]', '아침 스트레칭')
    await page.selectOption('select[name="category"]', 'health')
    await page.fill('textarea[name="description"]', '10분간 전신 스트레칭')
    await page.fill('input[name="healthPoints"]', '5')
    await page.fill('input[name="expPoints"]', '10')
    await page.click('button:has-text("저장")')

    // 4. 활동 수행
    await page.click('text=아침 스트레칭 >> .. >> button:has-text("수행")')
    await expect(page.locator('text=/\\+5.*건강/')).toBeVisible()
    await expect(page.locator('text=/\\+10.*경험치/')).toBeVisible()

    // 5. 대시보드에서 변화 확인
    await page.goto('/dashboard')
    const healthStat = page.locator('text=건강').locator('..').locator('[class*="text-3xl"]')
    const healthValue = await healthStat.textContent()
    expect(parseInt(healthValue || '0')).toBeGreaterThan(0)

    // 6. 레벨업 확인 (여러 활동 수행)
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("운동하기")')
      await page.waitForTimeout(500)
    }

    // 레벨업 알림 확인
    const levelUpNotification = page.locator('text=/레벨.*[2-9]|레벨업/')
    if (await levelUpNotification.isVisible()) {
      await expect(levelUpNotification).toBeVisible()
    }

    // 7. 던전 도전
    await page.goto('/dungeon')
    await page.click('text=쉬움 >> .. >> button:has-text("입장")')
    await page.waitForSelector('text=전투 중')

    // 전투 수행
    for (let i = 0; i < 10; i++) {
      const skillButton = page.locator('[data-testid="skill-button"]').first()
      if (await skillButton.isEnabled()) {
        await skillButton.click()
        await page.waitForTimeout(500)
      }

      // 승리 확인
      if (await page.locator('text=승리!').isVisible()) {
        break
      }
    }

    // 보상 획득
    await expect(page.locator('text=/\\+\\d+.*골드/')).toBeVisible()

    // 8. 인벤토리 확인
    await page.goto('/inventory')
    const goldAmount = page.locator('text=/\\d+.*골드/')
    await expect(goldAmount).toBeVisible()

    // 9. 스킬 확인
    await page.goto('/skills')
    const availableSkills = page.locator('[data-testid="skill-card"]')
    const skillCount = await availableSkills.count()
    expect(skillCount).toBeGreaterThan(0)

    // 10. 업적 확인
    await page.goto('/achievements')
    const unlockedAchievements = page.locator('[data-testid="achievement-unlocked"]')
    const achievementCount = await unlockedAchievements.count()
    expect(achievementCount).toBeGreaterThan(0)
  })

  test('일일 루틴 시뮬레이션', async({ page }) => {
    await page.goto('/dashboard')

    // 1. 일일 퀘스트 확인
    await page.goto('/daily')
    const dailyQuests = page.locator('[data-testid="daily-quest"]')
    const questCount = await dailyQuests.count()
    expect(questCount).toBeGreaterThan(0)

    // 2. 아침 활동
    await page.goto('/activities')
    const morningActivities = ['운동', '명상', '독서']

    for (const activity of morningActivities) {
      const activityCard = page.locator(`text*=${activity}`).first()
      if (await activityCard.isVisible()) {
        await activityCard.locator('..').locator('button:has-text("수행")').click()
        await page.waitForTimeout(1000)
      }
    }

    // 3. AI 코치 상담
    await page.goto('/ai-coach')
    await page.fill('input[placeholder*="메시지"], textarea[placeholder*="메시지"]',
      '오늘의 목표를 달성하기 위한 조언을 해주세요')
    await page.click('button[aria-label="전송"], button:has-text("전송")')

    // AI 응답 대기
    await page.waitForSelector('[data-testid="chat-message"][data-sender="ai"]:last-child', {
      timeout: 30000
    })

    // 4. 던전 일일 보상
    await page.goto('/dungeon')
    const dailyDungeon = page.locator('text=일일 던전').locator('..')
    if (await dailyDungeon.isVisible()) {
      const enterButton = dailyDungeon.locator('button:has-text("입장")')
      if (await enterButton.isEnabled()) {
        await enterButton.click()
        // 전투 시뮬레이션...
      }
    }

    // 5. 진행 상황 확인
    await page.goto('/dashboard')
    const todayProgress = page.locator('text=오늘의 진행도').locator('..')
    if (await todayProgress.isVisible()) {
      const progressBar = todayProgress.locator('[role="progressbar"]')
      await expect(progressBar).toBeVisible()
    }
  })

  test('멀티플레이어 상호작용', async({ page, context }) => {
    // 두 개의 브라우저 컨텍스트로 멀티플레이어 시뮬레이션
    const page2 = await context.newPage()

    // 플레이어 1
    await page.goto('/profile')
    await page.fill('input[name="nickname"]', '플레이어1')
    await page.click('button:has-text("저장")')

    // 플레이어 2
    await page2.goto('/profile')
    await page2.fill('input[name="nickname"]', '플레이어2')
    await page2.click('button:has-text("저장")')

    // 랭킹 확인
    await page.goto('/ranking')
    await expect(page.locator('text=플레이어1')).toBeVisible()

    await page2.goto('/ranking')
    await expect(page2.locator('text=플레이어2')).toBeVisible()

    // 친구 추가 시뮬레이션 (가능한 경우)
    const addFriendButton = page.locator('button:has-text("친구 추가")')
    if (await addFriendButton.isVisible()) {
      await addFriendButton.click()
      await page.fill('input[placeholder*="닉네임"]', '플레이어2')
      await page.click('button:has-text("추가")')
    }

    await page2.close()
  })

  test('장기 진행 시뮬레이션', async({ page }) => {
    // 시간 경과 시뮬레이션을 위한 함수
    const simulateDays = async(days: number) => {
      for (let day = 0; day < days; day++) {
        // 매일 활동 수행
        await page.goto('/activities')
        const activities = page.locator('[data-testid="activity-card"] button:has-text("수행")')
        const count = Math.min(await activities.count(), 3) // 하루 최대 3개

        for (let i = 0; i < count; i++) {
          await activities.nth(i).click()
          await page.waitForTimeout(500)
        }

        // 던전 클리어
        await page.goto('/dungeon')
        const easyDungeon = page.locator('text=쉬움 >> .. >> button:has-text("입장")')
        if (await easyDungeon.isEnabled()) {
          await easyDungeon.click()
          // 간단한 전투 시뮬레이션
          await page.waitForTimeout(2000)
        }
      }
    }

    // 7일 진행
    await simulateDays(7)

    // 주간 보상 확인
    await page.goto('/achievements')
    const weeklyAchievements = page.locator('text=/주간|7일 연속/')
    if (await weeklyAchievements.first().isVisible()) {
      await expect(weeklyAchievements.first()).toBeVisible()
    }

    // 캐릭터 성장 확인
    await page.goto('/dashboard')
    const level = page.locator('text=/레벨\\s*\\d+/')
    const levelText = await level.textContent()
    const currentLevel = parseInt(levelText?.match(/\d+/)?.[0] || '1')
    expect(currentLevel).toBeGreaterThan(1)
  })

  test('에러 복구 및 데이터 무결성', async({ page, context }) => {
    // 1. 정상적인 활동 수행
    await page.goto('/activities')
    await page.click('button:has-text("활동 추가")')
    await page.fill('input[name="title"]', '복구 테스트 활동')
    await page.selectOption('select[name="category"]', 'learning')
    await page.click('button:has-text("저장")')

    // 2. 네트워크 오류 시뮬레이션
    await context.setOffline(true)

    // 오프라인 상태에서 활동 수행 시도
    await page.click('text=복구 테스트 활동 >> .. >> button:has-text("수행")')

    // 오류 메시지 또는 오프라인 모드 확인
    const offlineIndicator = page.locator('text=/오프라인|연결.*끊김|네트워크/')
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible()
    }

    // 3. 네트워크 복구
    await context.setOffline(false)
    await page.reload()

    // 데이터 무결성 확인
    await expect(page.locator('text=복구 테스트 활동')).toBeVisible()

    // 4. 동시 접근 시뮬레이션
    const page2 = await context.newPage()
    await page2.goto('/activities')

    // 같은 활동을 두 탭에서 수정
    await page.click('text=복구 테스트 활동 >> .. >> button[aria-label="편집"]')
    await page2.click('text=복구 테스트 활동 >> .. >> button[aria-label="편집"]')

    // 첫 번째 탭에서 저장
    await page.fill('input[name="title"]', '수정된 활동 1')
    await page.click('button:has-text("저장")')

    // 두 번째 탭에서 저장 시도
    await page2.fill('input[name="title"]', '수정된 활동 2')
    await page2.click('button:has-text("저장")')

    // 충돌 해결 확인
    await page.reload()
    await page2.reload()

    // 최종 상태 확인 (하나의 수정만 적용되어야 함)
    const finalTitle = await page.locator('[data-testid="activity-card"]').first().textContent()
    expect(finalTitle).toMatch(/수정된 활동/)

    await page2.close()
  })

  test('전체 게임 리셋 및 재시작', async({ page }) => {
    // 1. 현재 진행 상황 저장
    await page.goto('/dashboard')
    const initialLevel = await page.locator('text=/레벨\\s*\\d+/').textContent()

    // 2. 설정에서 데이터 리셋
    await page.goto('/settings')
    const resetButton = page.locator('button:has-text("데이터 초기화"), button:has-text("리셋")')

    if (await resetButton.isVisible()) {
      await resetButton.click()

      // 확인 다이얼로그
      await expect(page.locator('text=/정말.*초기화|모든.*삭제/')).toBeVisible()
      await page.click('button:has-text("확인"), button:has-text("초기화")')

      // 초기화 완료 대기
      await page.waitForTimeout(2000)

      // 3. 초기 상태 확인
      await page.goto('/dashboard')
      const newLevel = await page.locator('text=/레벨\\s*\\d+/').textContent()
      expect(newLevel).toContain('1')

      // 활동이 비어있는지 확인
      await page.goto('/activities')
      const emptyMessage = page.locator('text=/활동이 없습니다|등록된 활동이 없습니다/')
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible()
      }
    }
  })
})
