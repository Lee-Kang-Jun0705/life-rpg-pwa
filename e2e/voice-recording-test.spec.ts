import { test, expect } from '@playwright/test'

test.describe('음성 기록 기능 TDD 검증', () => {
  test.beforeEach(async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('/dashboard')
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 콘솔 로그 수집
    page.on('console', msg => {
      console.log(`브라우저 콘솔 [${msg.type()}]:`, msg.text())
    })
  })

  test('1. 음성 입력 버튼이 렌더링되어야 함', async ({ page }) => {
    // 음성 입력 버튼 찾기
    const voiceButton = page.locator('button[aria-label*="음성"]')
    
    // 버튼 존재 확인
    await expect(voiceButton).toBeVisible({ timeout: 10000 })
    
    // 버튼 위치 확인 (고정 위치)
    const boundingBox = await voiceButton.boundingBox()
    expect(boundingBox).toBeTruthy()
    console.log('음성 버튼 위치:', boundingBox)
  })

  test('2. 음성 입력 버튼 클릭 시 스탯 선택 모달이 열려야 함', async ({ page }) => {
    // 음성 입력 버튼 찾기 및 클릭
    const voiceButton = page.locator('button[aria-label*="음성"]')
    await voiceButton.click()
    
    // 스탯 선택 모달 확인
    const modal = page.locator('text=어떤 활동을 기록하시나요?')
    await expect(modal).toBeVisible({ timeout: 5000 })
    
    // 4개 스탯 옵션 확인
    await expect(page.locator('text=건강')).toBeVisible()
    await expect(page.locator('text=학습')).toBeVisible()
    await expect(page.locator('text=관계')).toBeVisible()
    await expect(page.locator('text=성취')).toBeVisible()
  })

  test('3. 프로그래밍 방식으로 음성 입력 테스트', async ({ page }) => {
    // testVoiceInput 함수가 전역에 설정될 때까지 대기
    await page.waitForFunction(() => {
      return typeof (window as any).testVoiceInput === 'function'
    }, { timeout: 10000 })
    
    // 초기 활동 개수 확인
    const initialActivities = await page.locator('.bg-white').filter({ hasText: '오늘의 활동' }).locator('text=/\\d+개 완료/').textContent()
    const initialCount = parseInt(initialActivities?.match(/(\d+)개/)?.[1] || '0')
    console.log('초기 활동 개수:', initialCount)
    
    // 음성 입력 시뮬레이션
    const testText = '플레이라이트 테스트로 30분 운동했습니다'
    const result = await page.evaluate(async (text) => {
      // 콘솔 로그 캡처를 위한 배열
      const logs: string[] = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        logs.push(args.join(' '))
        originalWarn(...args)
      }
      
      // 음성 입력 함수 호출
      await (window as any).testVoiceInput(text, 'health')
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 로그 복원
      console.warn = originalWarn
      
      return logs
    }, testText)
    
    console.log('캡처된 로그:', result)
    
    // 로그 검증
    expect(result.some(log => log.includes('🎤🎤🎤 음성 입력 감지!'))).toBeTruthy()
    expect(result.some(log => log.includes('📊📊📊 updateStat 호출됨'))).toBeTruthy()
    expect(result.some(log => log.includes('💾💾💾 DB에 저장할 activityData'))).toBeTruthy()
    
    // UI 업데이트 대기
    await page.waitForTimeout(3000)
    
    // 활동 개수 증가 확인
    const updatedActivities = await page.locator('.bg-white').filter({ hasText: '오늘의 활동' }).locator('text=/\\d+개 완료/').textContent()
    const updatedCount = parseInt(updatedActivities?.match(/(\d+)개/)?.[1] || '0')
    console.log('업데이트된 활동 개수:', updatedCount)
    
    expect(updatedCount).toBe(initialCount + 1)
  })

  test('4. 실제 음성 텍스트가 UI에 표시되는지 확인', async ({ page }) => {
    // 테스트용 음성 텍스트
    const voiceTexts = [
      { text: '아침에 조깅 30분 했어요', stat: 'health' },
      { text: '알고리즘 문제 3개 풀었습니다', stat: 'learning' },
      { text: '친구와 저녁 식사했어요', stat: 'relationship' },
      { text: '프로젝트 마일스톤 달성!', stat: 'achievement' }
    ]

    // 각 텍스트 입력
    for (const { text, stat } of voiceTexts) {
      await page.evaluate(async ({ t, s }) => {
        await (window as any).testVoiceInput(t, s)
      }, { t: text, s: stat })
      
      await page.waitForTimeout(1000)
    }

    // UI 업데이트 대기
    await page.waitForTimeout(3000)

    // 최근 활동 섹션 확인
    const recentActivitiesSection = page.locator('text=최근 활동').locator('..')
    
    // 각 음성 텍스트가 표시되는지 확인
    for (const { text } of voiceTexts) {
      const activityElement = recentActivitiesSection.locator(`text="${text}"`)
      const isVisible = await activityElement.isVisible().catch(() => false)
      
      if (!isVisible) {
        // 스크린샷 캡처
        await page.screenshot({ 
          path: `voice-test-failure-${Date.now()}.png`,
          fullPage: true 
        })
        
        // 실제로 표시된 활동들 확인
        const displayedActivities = await recentActivitiesSection.locator('.font-bold.text-gray-800').allTextContents()
        console.error('표시된 활동들:', displayedActivities)
        console.error('찾을 수 없는 텍스트:', text)
      }
      
      expect(isVisible).toBeTruthy()
    }
  })

  test('5. 음성 입력 후 데이터베이스 확인', async ({ page }) => {
    const testText = 'DB 테스트용 음성 입력입니다'
    
    // 음성 입력 실행
    await page.evaluate(async (text) => {
      await (window as any).testVoiceInput(text, 'learning')
    }, testText)
    
    await page.waitForTimeout(2000)
    
    // IndexedDB에서 직접 확인
    const dbData = await page.evaluate(async () => {
      // DB 열기
      const dbName = 'LifeRPGDatabase'
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      // activities 테이블에서 최근 항목 가져오기
      const transaction = db.transaction(['activities'], 'readonly')
      const store = transaction.objectStore('activities')
      const activities = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      // 최근 5개 활동 반환
      return activities.slice(-5).map(a => ({
        activityName: a.activityName,
        statType: a.statType,
        experience: a.experience,
        timestamp: a.timestamp
      }))
    })
    
    console.log('DB의 최근 활동들:', dbData)
    
    // 테스트 텍스트가 DB에 저장되었는지 확인
    const hasTestActivity = dbData.some(activity => 
      activity.activityName === testText
    )
    
    if (!hasTestActivity) {
      console.error('DB에 저장된 활동들:', dbData.map(a => a.activityName))
    }
    
    expect(hasTestActivity).toBeTruthy()
  })

  test('6. EnhancedVoiceInput 컴포넌트 렌더링 확인', async ({ page }) => {
    // 컴포넌트가 실제로 렌더링되었는지 확인
    const componentExists = await page.evaluate(() => {
      // React DevTools가 있다면 사용
      const reactRoot = document.querySelector('#__next')
      if (!reactRoot) return false
      
      // DOM에서 음성 입력 관련 요소 찾기
      const voiceElements = document.querySelectorAll('[aria-label*="음성"]')
      return voiceElements.length > 0
    })
    
    expect(componentExists).toBeTruthy()
    
    // EnhancedVoiceInputWrapper가 null을 반환하는지 확인
    const wrapperContent = await page.evaluate(async () => {
      // 동적으로 로드된 컴포넌트 확인
      const wrapper = document.querySelector('[data-testid="voice-input-wrapper"]')
      return wrapper ? wrapper.innerHTML : 'wrapper not found'
    })
    
    console.log('Wrapper 내용:', wrapperContent)
  })
})

// 디버깅용 추가 테스트
test.describe('음성 기록 디버깅', () => {
  test('콘솔 로그 전체 수집', async ({ page }) => {
    const logs: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
        logs.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 음성 입력 테스트
    await page.evaluate(async () => {
      console.log('=== 음성 입력 테스트 시작 ===')
      await (window as any).testVoiceInput('디버깅 테스트', 'health')
      console.log('=== 음성 입력 테스트 완료 ===')
    })
    
    await page.waitForTimeout(3000)
    
    // 수집된 로그 출력
    console.log('\n수집된 모든 로그:')
    logs.forEach(log => console.log(log))
    
    // 핵심 로그 존재 확인
    const hasVoiceDetection = logs.some(log => log.includes('음성 입력 감지'))
    const hasUpdateStat = logs.some(log => log.includes('updateStat 호출됨'))
    const hasDBSave = logs.some(log => log.includes('DB에 저장할'))
    
    console.log('\n로그 체크:')
    console.log('- 음성 입력 감지:', hasVoiceDetection)
    console.log('- updateStat 호출:', hasUpdateStat)
    console.log('- DB 저장 시도:', hasDBSave)
    
    expect(hasVoiceDetection || hasUpdateStat || hasDBSave).toBeTruthy()
  })
})