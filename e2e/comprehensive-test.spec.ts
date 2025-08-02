import { test, expect } from '@playwright/test'

interface ConsoleError {
  page: string
  error: string
  type: string
}

test.describe('Life RPG 전체 서비스 통합 테스트', () => {
  const consoleErrors: ConsoleError[] = []

  // 테스트할 모든 페이지 목록
  const pages = [
    { path: '/', name: '홈' },
    { path: '/dashboard', name: '대시보드' },
    { path: '/dungeon', name: '모험' },
    { path: '/ai-coach', name: 'AI 코치' },
    { path: '/profile', name: '프로필' },
    { path: '/daily', name: '일일 미션' },
    { path: '/collection', name: '컬렉션' },
    { path: '/equipment', name: '장비' },
    { path: '/shop', name: '상점' },
    { path: '/settings', name: '설정' }
  ]

  test.beforeEach(async({ page, context }) => {
    // 콘솔 에러 모니터링
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // 무시할 에러 패턴
        const ignoredPatterns = [
          'Failed to load resource',
          'NetworkOnly',
          'workbox',
          'service-worker',
          'favicon.ico'
        ]

        if (!ignoredPatterns.some(pattern => text.includes(pattern))) {
          consoleErrors.push({
            page: page.url(),
            error: text,
            type: msg.type()
          })
        }
      }
    })

    // 페이지 에러 모니터링
    page.on('pageerror', error => {
      consoleErrors.push({
        page: page.url(),
        error: error.message,
        type: 'pageerror'
      })
    })
  })

  test('1. 모든 페이지 접근성 및 콘솔 에러 체크', async({ page }) => {
    for (const pageInfo of pages) {
      console.log(`\n테스트 중: ${pageInfo.name} (${pageInfo.path})`)

      try {
        const response = await page.goto(`http://localhost:3000${pageInfo.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        })

        // 페이지 로드 성공 확인
        expect(response?.status()).toBeLessThan(400)

        // 페이지 로드 대기
        await page.waitForTimeout(2000)

        // 기본 요소 확인
        await expect(page.locator('body')).toBeVisible()

        // 페이지별 특정 요소 확인
        switch (pageInfo.path) {
          case '/':
            await expect(page.locator('text=Life RPG').first()).toBeVisible()
            break
          case '/dashboard':
            await expect(page.locator('text=스탯 올리기').first()).toBeVisible()
            break
          case '/ai-coach':
            await expect(page.locator('h1:has-text("AI 코치")')).toBeVisible()
            break
          case '/dungeon':
            await expect(page.locator('text=모험 & 성장')).toBeVisible()
            break
        }

        console.log(`✅ ${pageInfo.name} 페이지 로드 성공`)
      } catch (error) {
        console.error(`❌ ${pageInfo.name} 페이지 에러:`, error)
        throw error
      }
    }

    // 콘솔 에러 리포트
    if (consoleErrors.length > 0) {
      console.log('\n🚨 발견된 콘솔 에러:')
      consoleErrors.forEach(err => {
        console.log(`- [${err.type}] ${err.page}: ${err.error}`)
      })

      // 에러가 있으면 테스트 실패
      expect(consoleErrors.length).toBe(0)
    }
  })

  test('2. 네비게이션 기능 테스트', async({ page }) => {
    // 대시보드로 바로 이동하여 네비게이션 테스트
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000)

    // URL 확인
    await expect(page).toHaveURL(/\/dashboard/)
    console.log('✅ 대시보드 페이지로 이동 성공')

    // 모험 페이지로 이동
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/dungeon/)
    console.log('✅ 모험 페이지로 이동 성공')

    // AI 코치 페이지로 이동
    await page.goto('http://localhost:3000/ai-coach')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/ai-coach/)
    console.log('✅ AI 코치 페이지로 이동 성공')

  })

  test('3. AI 코치 대화 기능 테스트', async({ page }) => {
    await page.goto('http://localhost:3000/ai-coach')
    await page.waitForTimeout(3000)

    // API 키 설정 확인
    const lockIcon = await page.locator('text=AI 대화 기능 잠김').isVisible()
    if (lockIcon) {
      console.log('⚠️ AI 코치 API 키 설정 필요')
      return
    }

    // AI 대화하기 탭 클릭 - 데스크탑 버전 선택
    const chatTabButton = page.locator('[data-testid="ai-coach-tab-chat"]').first()
    if (await chatTabButton.isVisible()) {
      await chatTabButton.click()
      await page.waitForTimeout(1000)
    }

    // ConversationalAI 컴포넌트의 입력 필드 찾기
    const textareas = await page.locator('textarea').all()
    const inputs = await page.locator('input[type="text"]').all()

    console.log(`찾은 textarea 수: ${textareas.length}`)
    console.log(`찾은 input 수: ${inputs.length}`)

    // 고급 채팅 모드 열기
    const advancedMode = page.locator('summary:has-text("고급 채팅 모드")')
    if (await advancedMode.isVisible()) {
      await advancedMode.click()
      await page.waitForTimeout(1000)

      // 고급 모드의 입력 필드
      const advancedInput = page.locator('input[placeholder*="메시지를 입력하세요"]')
      if (await advancedInput.isVisible()) {
        await advancedInput.fill('안녕하세요, 테스트 메시지입니다.')
        await advancedInput.press('Enter')
        console.log('✅ AI 코치 고급 모드에서 메시지 전송')
      }
    } else {
      console.log('⚠️ AI 코치 입력 필드를 찾을 수 없음')
    }
  })

  test('4. 대시보드 스탯 기능 테스트', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(3000)

    // 스탯 카드 확인
    const statCards = ['건강', '학습', '관계', '성취']

    for (const stat of statCards) {
      const statCard = page.locator(`text=${stat}`).first()
      const isVisible = await statCard.isVisible()
      console.log(`${stat} 스탯 카드: ${isVisible ? '✅' : '❌'}`)

      if (isVisible) {
        // + 버튼 찾기
        const plusButton = statCard.locator('..').locator('button').filter({ hasText: '+' }).first()
        if (await plusButton.isVisible()) {
          await plusButton.click()
          await page.waitForTimeout(1000)
          console.log(`${stat} 스탯 증가 버튼 클릭`)
        }
      }
    }
  })

  test('5. 던전/모험 전투 시스템 테스트', async({ page }) => {
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForTimeout(3000)

    // 탐험 탭 클릭
    const exploreTab = page.locator('button').filter({ hasText: '탐험' }).first()
    if (await exploreTab.isVisible()) {
      await exploreTab.click()
      await page.waitForTimeout(2000)

      // 던전 카드 클릭
      const dungeonCard = page.locator('[class*="cursor-pointer"]').first()
      if (await dungeonCard.count() > 0) {
        await dungeonCard.click()
        await page.waitForTimeout(1000)

        // 입장 버튼
        const enterButton = page.locator('button').filter({ hasText: '입장' })
        if (await enterButton.isVisible()) {
          await enterButton.click()
          await page.waitForTimeout(3000)

          // 전투 버튼 확인
          const battleButtons = ['공격', '스킬', '방어', '아이템']
          for (const button of battleButtons) {
            const btn = page.locator('button').filter({ hasText: button })
            const isVisible = await btn.isVisible()
            console.log(`${button} 버튼: ${isVisible ? '✅' : '❌'}`)
          }
        }
      }
    }
  })

  test('6. 프로필 페이지 기능 테스트', async({ page }) => {
    await page.goto('http://localhost:3000/profile')
    await page.waitForTimeout(3000)

    // 프로필 정보 확인
    const profileElements = ['레벨', '경험치', '스탯', '활동']

    for (const element of profileElements) {
      const el = page.locator(`text=${element}`).first()
      const isVisible = await el.isVisible()
      console.log(`프로필 ${element}: ${isVisible ? '✅' : '❌'}`)
    }
  })

  test('7. 설정 페이지 테스트', async({ page }) => {
    await page.goto('http://localhost:3000/settings')
    await page.waitForTimeout(3000)

    // 설정 항목 확인
    const settingItems = ['알림', '테마', '언어', '계정']

    for (const item of settingItems) {
      const el = page.locator(`text=${item}`).first()
      const count = await el.count()
      console.log(`설정 ${item}: ${count > 0 ? '✅' : '❌'}`)
    }
  })

  test.afterAll(async() => {
    console.log('\n=== 최종 리포트 ===')
    console.log(`총 콘솔 에러 수: ${consoleErrors.length}`)

    if (consoleErrors.length > 0) {
      console.log('\n에러 상세:')
      const errorsByPage = consoleErrors.reduce((acc, err) => {
        const page = err.page.split('3000')[1] || '/'
        if (!acc[page]) {
          acc[page] = []
        }
        acc[page].push(err)
        return acc
      }, {} as Record<string, ConsoleError[]>)

      Object.entries(errorsByPage).forEach(([page, errors]) => {
        console.log(`\n${page}:`)
        errors.forEach(err => {
          console.log(`  - ${err.error}`)
        })
      })
    }
  })
})
