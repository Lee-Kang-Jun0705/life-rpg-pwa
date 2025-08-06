import { test, expect, type Page } from '@playwright/test'

// 콘솔 에러를 수집하는 헬퍼 함수
async function setupConsoleErrorTracking(page: Page) {
  const consoleErrors: string[] = []
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })
  
  return consoleErrors
}

// 페이지 로딩 시간을 측정하는 헬퍼 함수
async function measurePageLoadTime(page: Page, url: string) {
  const startTime = Date.now()
  await page.goto(url, { waitUntil: 'networkidle' })
  const loadTime = Date.now() - startTime
  return loadTime
}

// 탭 전환 시간을 측정하는 헬퍼 함수
async function measureTabSwitchTime(page: Page, selector: string) {
  const startTime = Date.now()
  await page.click(selector)
  await page.waitForTimeout(100) // 애니메이션 대기
  const switchTime = Date.now() - startTime
  return switchTime
}

// FPS를 측정하는 헬퍼 함수
async function measureFPS(page: Page, duration: number = 1000): Promise<number> {
  return await page.evaluate((duration) => {
    return new Promise<number>((resolve) => {
      let frames = 0
      const startTime = performance.now()

      function countFrames() {
        frames++
        const currentTime = performance.now()
        
        if (currentTime - startTime >= duration) {
          const fps = (frames * 1000) / (currentTime - startTime)
          resolve(Math.round(fps))
        } else {
          requestAnimationFrame(countFrames)
        }
      }

      requestAnimationFrame(countFrames)
    })
  }, duration)
}

test.describe('Life RPG PWA - 전체 앱 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지 초기화
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('홈페이지 로딩 및 콘솔 에러 체크', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    
    const loadTime = await measurePageLoadTime(page, '/')
    
    // 로딩 시간 체크 (3초 이내)
    expect(loadTime).toBeLessThan(3000)
    
    // 홈페이지 요소들이 표시되는지 확인
    await expect(page.locator('text=Life RPG')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
    
    // 콘솔 에러가 없는지 확인
    expect(consoleErrors).toHaveLength(0)
  })

  test('모든 페이지 네비게이션 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/')
    
    const pages = [
      { name: '대시보드', url: '/dashboard', selector: 'text=나의 스탯' },
      { name: '활동', url: '/activities', selector: 'text=활동 기록' },
      { name: '던전', url: '/dungeon', selector: 'text=던전 탐험' },
      { name: '배틀', url: '/battle', selector: 'text=배틀' },
      { name: '스킬', url: '/skills', selector: 'text=스킬' },
      { name: '인벤토리', url: '/inventory', selector: 'text=인벤토리' },
      { name: '장비', url: '/equipment', selector: 'text=장비' },
      { name: '상점', url: '/shop', selector: 'text=상점' },
      { name: '업적', url: '/achievements', selector: 'text=업적' },
      { name: '일일미션', url: '/daily', selector: 'text=일일 미션' },
      { name: '컬렉션', url: '/collection', selector: 'text=컬렉션' },
      { name: '랭킹', url: '/ranking', selector: 'text=랭킹' },
      { name: '리더보드', url: '/leaderboard', selector: 'text=리더보드' },
      { name: '프로필', url: '/profile', selector: 'text=프로필' },
      { name: '설정', url: '/settings', selector: 'text=설정' }
    ]
    
    for (const pageInfo of pages) {
      console.log(`Testing navigation to ${pageInfo.name}...`)
      
      // 페이지 로딩 시간 측정
      const startTime = Date.now()
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' })
      const loadTime = Date.now() - startTime
      
      // 로딩 시간 체크 (2초 이내)
      expect(loadTime).toBeLessThan(2000)
      
      // 페이지 콘텐츠가 로드되었는지 확인
      await expect(page.locator(pageInfo.selector).first()).toBeVisible({ timeout: 5000 })
      
      // 스크린샷 저장
      await page.screenshot({ path: `e2e/screenshots/page-${pageInfo.name}.png` })
    }
    
    // 전체 네비게이션 후 콘솔 에러 체크
    expect(consoleErrors).toHaveLength(0)
  })

  test('대시보드 기능 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/dashboard')
    
    // 스탯 카드들이 표시되는지 확인
    await expect(page.locator('text=건강').first()).toBeVisible()
    await expect(page.locator('text=학습').first()).toBeVisible()
    await expect(page.locator('text=관계').first()).toBeVisible()
    await expect(page.locator('text=성취').first()).toBeVisible()
    
    // 활동 추가 버튼 클릭 테스트
    const addButtons = page.locator('button:has-text("활동 추가")')
    const buttonCount = await addButtons.count()
    
    if (buttonCount > 0) {
      await addButtons.first().click()
      
      // 모달이나 폼이 나타나는지 확인
      await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 3000 })
      
      // 취소 또는 닫기
      const closeButton = page.locator('button:has-text("취소"), button:has-text("닫기"), button[aria-label="Close"]')
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
      }
    }
    
    // 콘솔 에러 체크
    expect(consoleErrors).toHaveLength(0)
  })

  test('활동 기록 페이지 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/activities')
    
    // 필터 버튼들이 작동하는지 테스트
    const filterButtons = ['오늘', '이번 주', '이번 달', '전체']
    
    for (const filter of filterButtons) {
      const button = page.locator(`button:has-text("${filter}")`)
      if (await button.count() > 0) {
        await button.click()
        await page.waitForTimeout(500) // 필터 적용 대기
      }
    }
    
    // 스탯 필터 테스트
    const statFilters = ['전체', '건강', '학습', '관계', '성취']
    for (const stat of statFilters) {
      const button = page.locator(`button:has-text("${stat}")`)
      if (await button.count() > 0) {
        await button.click()
        await page.waitForTimeout(500)
      }
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('던전 페이지 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/dungeon')
    
    // 던전 목록이 로드되는지 확인
    await expect(page.locator('text=던전').first()).toBeVisible()
    
    // 던전 입장 버튼이 있다면 클릭 테스트
    const enterButton = page.locator('button:has-text("입장"), button:has-text("탐험 시작")')
    if (await enterButton.count() > 0) {
      await enterButton.first().click()
      
      // 던전 진입 후 UI 확인
      await page.waitForTimeout(1000)
      
      // 뒤로가기 버튼이 있다면 클릭
      const backButton = page.locator('button:has-text("나가기"), button:has-text("뒤로")')
      if (await backButton.count() > 0) {
        await backButton.first().click()
      }
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('상점 페이지 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/shop')
    
    // 상점 카테고리 탭 테스트
    const categories = ['전체', '무기', '방어구', '소모품', '특별']
    
    for (const category of categories) {
      const tab = page.locator(`button:has-text("${category}"), [role="tab"]:has-text("${category}")`)
      if (await tab.count() > 0) {
        await tab.click()
        await page.waitForTimeout(500)
      }
    }
    
    // 아이템이 표시되는지 확인
    await expect(page.locator('[class*="card"], [class*="item"]').first()).toBeVisible({ timeout: 5000 })
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('설정 페이지 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    await page.goto('/settings')
    
    // 설정 섹션들이 표시되는지 확인
    await expect(page.locator('text=설정').first()).toBeVisible()
    
    // 알림 설정 페이지로 이동
    const notificationLink = page.locator('a[href="/settings/notifications"], button:has-text("알림")')
    if (await notificationLink.count() > 0) {
      await notificationLink.click()
      await expect(page).toHaveURL(/\/settings\/notifications/)
      await page.goBack()
    }
    
    // 개인화 설정 페이지로 이동
    const personalizationLink = page.locator('a[href="/settings/personalization"], button:has-text("개인화")')
    if (await personalizationLink.count() > 0) {
      await personalizationLink.click()
      await expect(page).toHaveURL(/\/settings\/personalization/)
      await page.goBack()
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('성능 테스트 - 페이지 로딩 시간', async ({ page }) => {
    const performanceResults = []
    
    const pagesToTest = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Activities', url: '/activities' },
      { name: 'Dungeon', url: '/dungeon' },
      { name: 'Shop', url: '/shop' },
      { name: 'Skills', url: '/skills' },
      { name: 'Inventory', url: '/inventory' }
    ]
    
    for (const pageInfo of pagesToTest) {
      const startTime = Date.now()
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' })
      const loadTime = Date.now() - startTime
      
      performanceResults.push({
        page: pageInfo.name,
        loadTime: loadTime,
        status: loadTime < 2000 ? 'PASS' : 'FAIL'
      })
    }
    
    console.table(performanceResults)
    
    // 모든 페이지가 2초 이내에 로드되어야 함
    performanceResults.forEach(result => {
      expect(result.loadTime).toBeLessThan(2000)
    })
  })

  test('반응형 디자인 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    
    // 모바일 뷰포트 테스트
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // 모바일에서 네비게이션이 작동하는지 확인
    const mobileMenuButton = page.locator('[aria-label*="menu"], button:has-text("☰"), button.menu-toggle')
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click()
      await page.waitForTimeout(500)
    }
    
    // 태블릿 뷰포트 테스트
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // 데스크톱 뷰포트 테스트
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('데이터 저장 및 로드 테스트', async ({ page }) => {
    const consoleErrors = await setupConsoleErrorTracking(page)
    
    // 대시보드에서 데이터 생성
    await page.goto('/dashboard')
    
    // 현재 레벨 확인
    const levelElement = page.locator('text=/Lv\\.\\s*\\d+/')
    const initialLevel = await levelElement.textContent()
    
    // 페이지 새로고침
    await page.reload()
    
    // 레벨이 유지되는지 확인
    const levelAfterReload = await levelElement.textContent()
    expect(levelAfterReload).toBe(initialLevel)
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('모험 페이지 탭 전환 성능 측정', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')

    const tabs = [
      { name: '퀘스트', selector: 'button[aria-label="퀘스트 탭"]' },
      { name: '탐험', selector: 'button[aria-label="탐험 탭"]' },
      { name: '인벤토리', selector: 'button[aria-label="인벤토리 탭"]' },
      { name: '장비', selector: 'button[aria-label="장비 탭"]' },
      { name: '스킬', selector: 'button[aria-label="스킬 탭"]' },
      { name: '상점', selector: 'button[aria-label="상점 탭"]' }
    ]

    const results: { tab: string; time: number; status: string }[] = []

    for (const tab of tabs) {
      const switchTime = await measureTabSwitchTime(page, tab.selector)
      results.push({
        tab: tab.name,
        time: switchTime,
        status: switchTime < 500 ? 'PASS' : 'FAIL'
      })
    }

    console.log('=== 탭 전환 성능 결과 ===')
    console.table(results)

    // 모든 탭이 500ms 이내에 전환되어야 함
    results.forEach(result => {
      expect(result.time).toBeLessThan(500)
    })
  })

  test('터치/클릭 반응 속도 측정', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')

    // 탐험 탭으로 이동
    await page.click('button[aria-label="탐험 탭"]')
    await page.waitForTimeout(500)

    const clickTargets = [
      { name: '던전 선택', selector: 'text=초보자의 숲' },
      { name: '전투 시작', selector: 'button:has-text("전투 시작")' }
    ]

    const results: { action: string; responseTime: number; status: string }[] = []

    for (const target of clickTargets) {
      const element = page.locator(target.selector).first()
      if (await element.isVisible()) {
        const startTime = Date.now()
        await element.click()
        await page.waitForTimeout(50) // 반응 대기
        const responseTime = Date.now() - startTime

        results.push({
          action: target.name,
          responseTime,
          status: responseTime < 200 ? 'PASS' : 'FAIL'
        })
      }
    }

    console.log('=== 클릭 반응 속도 결과 ===')
    console.table(results)
  })

  test('모바일 성능 테스트', async ({ browser }) => {
    // 모바일 컨텍스트 생성
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    })
    const page = await context.newPage()

    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')

    // 모바일에서 탭 전환 성능 측정
    const tabs = ['퀘스트', '탐험', '인벤토리']
    const results: { tab: string; time: number }[] = []

    for (const tab of tabs) {
      const selector = `button[aria-label="${tab} 탭"]`
      const switchTime = await measureTabSwitchTime(page, selector)
      results.push({ tab, time: switchTime })
    }

    console.log('=== 모바일 탭 전환 성능 ===')
    console.table(results)

    // 스크롤 성능 테스트
    const scrollStartTime = Date.now()
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' })
    })
    await page.waitForTimeout(500)
    const scrollTime = Date.now() - scrollStartTime

    console.log(`모바일 스크롤 시간: ${scrollTime}ms`)
    expect(scrollTime).toBeLessThan(600)

    await context.close()
  })

  test('애니메이션 FPS 측정', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')

    // 탭 전환 중 FPS 측정
    const fpsDuringAnimation = await page.evaluate(async () => {
      const results: number[] = []

      for (let i = 0; i < 3; i++) {
        // 탭 클릭
        const tabs = document.querySelectorAll('button[role="tab"]')
        if (tabs.length > i) {
          let frames = 0
          const startTime = performance.now()
          
          // 애니메이션 시작
          (tabs[i] as HTMLElement).click()
          
          // 500ms 동안 프레임 카운트
          await new Promise<void>((resolve) => {
            function countFrames() {
              frames++
              const currentTime = performance.now()
              
              if (currentTime - startTime >= 500) {
                const fps = (frames * 1000) / (currentTime - startTime)
                results.push(Math.round(fps))
                resolve()
              } else {
                requestAnimationFrame(countFrames)
              }
            }
            requestAnimationFrame(countFrames)
          })
          
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      return results
    })

    console.log('=== 애니메이션 중 FPS ===')
    fpsDuringAnimation.forEach((fps, index) => {
      console.log(`탭 전환 ${index + 1}: ${fps} FPS`)
      expect(fps).toBeGreaterThanOrEqual(30)
    })
  })

  test('메모리 사용량 모니터링', async ({ page }) => {
    const memoryUsage: { page: string; heapSize: number }[] = []

    // 여러 페이지 방문하며 메모리 측정
    const pages = [
      { name: '홈', url: '/' },
      { name: '모험', url: '/adventure' },
      { name: '일지', url: '/journal' },
      { name: '소셜', url: '/social' }
    ]

    for (let i = 0; i < 3; i++) { // 3번 반복
      for (const pageInfo of pages) {
        await page.goto(pageInfo.url)
        await page.waitForLoadState('networkidle')

        const memory = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize
          }
          return 0
        })

        if (memory > 0) {
          memoryUsage.push({
            page: `${pageInfo.name} (${i + 1}회차)`,
            heapSize: memory
          })
        }
      }
    }

    console.log('=== 메모리 사용량 (MB) ===')
    memoryUsage.forEach(({ page, heapSize }) => {
      console.log(`${page}: ${(heapSize / 1024 / 1024).toFixed(2)}MB`)
    })

    // 메모리 누수 체크 - 첫 번째와 마지막 측정값 비교
    if (memoryUsage.length >= 8) {
      const firstUsage = memoryUsage[0].heapSize
      const lastUsage = memoryUsage[memoryUsage.length - 1].heapSize
      const increase = ((lastUsage - firstUsage) / firstUsage) * 100

      console.log(`메모리 증가율: ${increase.toFixed(2)}%`)
      expect(increase).toBeLessThan(50) // 50% 이상 증가하지 않아야 함
    }
  })

  test('리소스 로딩 성능 분석', async ({ page }) => {
    const resourceTimings: {
      type: string
      url: string
      duration: number
    }[] = []

    page.on('response', async (response) => {
      const timing = response.timing()
      if (timing) {
        const url = response.url()
        const duration = timing.responseEnd - timing.requestStart
        let type = 'other'

        if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) type = 'image'
        else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) type = 'font'
        else if (url.match(/\.js$/i)) type = 'script'
        else if (url.match(/\.css$/i)) type = 'stylesheet'

        resourceTimings.push({ type, url, duration })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 리소스 타입별 통계
    const stats = resourceTimings.reduce((acc, { type, duration }) => {
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0, max: 0 }
      }
      acc[type].count++
      acc[type].total += duration
      acc[type].max = Math.max(acc[type].max, duration)
      return acc
    }, {} as Record<string, { count: number; total: number; max: number }>)

    console.log('=== 리소스 로딩 통계 ===')
    Object.entries(stats).forEach(([type, data]) => {
      const avg = data.total / data.count
      console.log(`${type}: 평균 ${avg.toFixed(2)}ms, 최대 ${data.max.toFixed(2)}ms (${data.count}개)`)
      expect(data.max).toBeLessThan(2000) // 최대 2초 이내
    })
  })

  test('종합 성능 보고서', async ({ page }) => {
    console.log('\n=== Life RPG PWA 종합 성능 보고서 ===\n')

    // 1. 초기 로딩 성능
    const homeLoadTime = await measurePageLoadTime(page, '/')
    console.log(`✓ 홈페이지 초기 로딩: ${homeLoadTime}ms`)

    // 2. 주요 페이지 로딩
    const mainPages = ['/adventure', '/journal', '/social']
    let totalLoadTime = homeLoadTime

    for (const url of mainPages) {
      const loadTime = await measurePageLoadTime(page, url)
      totalLoadTime += loadTime
      console.log(`✓ ${url} 로딩: ${loadTime}ms`)
    }

    const avgLoadTime = totalLoadTime / (mainPages.length + 1)
    console.log(`\n평균 페이지 로딩 시간: ${avgLoadTime.toFixed(2)}ms`)

    // 3. 인터랙션 성능
    await page.goto('/adventure')
    const fps = await measureFPS(page)
    console.log(`\n기본 FPS: ${fps}`)

    // 4. 성능 등급 부여
    let grade = 'A'
    if (avgLoadTime > 3000 || fps < 30) grade = 'F'
    else if (avgLoadTime > 2000 || fps < 45) grade = 'C'
    else if (avgLoadTime > 1500 || fps < 55) grade = 'B'

    console.log(`\n종합 성능 등급: ${grade}`)
    console.log('================================\n')
  })
})