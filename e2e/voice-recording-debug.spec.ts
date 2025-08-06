import { test, expect } from '@playwright/test'

test.describe('음성 기록 기능 상세 디버깅', () => {
  test('음성 입력 전체 플로우 검증', async ({ page }) => {
    // 콘솔 로그 수집
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(`[${msg.type()}] ${text}`)
      console.log(`브라우저 콘솔 [${msg.type()}]:`, text)
    })

    // 대시보드 이동
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 1. 음성 버튼 확인
    console.log('\n=== 1. 음성 버튼 확인 ===')
    const voiceButton = page.locator('button[aria-label*="음성"]')
    const isVoiceButtonVisible = await voiceButton.isVisible()
    console.log('음성 버튼 표시 여부:', isVoiceButtonVisible)
    
    if (!isVoiceButtonVisible) {
      // 대체 선택자로 시도
      const alternativeButton = page.locator('button').filter({ has: page.locator('svg') })
      const buttonCount = await alternativeButton.count()
      console.log('SVG를 포함한 버튼 개수:', buttonCount)
      
      // 스크린샷
      await page.screenshot({ path: 'voice-debug-no-button.png', fullPage: true })
    }
    
    // 2. 음성 버튼 클릭
    console.log('\n=== 2. 음성 버튼 클릭 ===')
    await voiceButton.click()
    await page.waitForTimeout(1000)
    
    // 3. 스탯 선택 모달 확인
    console.log('\n=== 3. 스탯 선택 모달 확인 ===')
    const modal = page.locator('text=어떤 활동을 기록하시나요?')
    const isModalVisible = await modal.isVisible()
    console.log('모달 표시 여부:', isModalVisible)
    
    if (isModalVisible) {
      // 건강 스탯 선택
      console.log('건강 스탯 선택...')
      await page.locator('text=건강').click()
      await page.waitForTimeout(1000)
      
      // 녹음 UI 확인
      const recordingUI = page.locator('text=/.*녹음.*/')
      const isRecording = await recordingUI.isVisible().catch(() => false)
      console.log('녹음 UI 표시 여부:', isRecording)
      
      if (!isRecording) {
        await page.screenshot({ path: 'voice-debug-no-recording-ui.png', fullPage: true })
      }
    }
    
    // 4. 컴포넌트 렌더링 상태 확인
    console.log('\n=== 4. 컴포넌트 상태 확인 ===')
    const componentState = await page.evaluate(() => {
      const results: any = {}
      
      // React 컴포넌트 확인
      const reactRoot = document.querySelector('#__next')
      results.hasReactRoot = !!reactRoot
      
      // 음성 관련 요소
      results.voiceElements = document.querySelectorAll('[aria-label*="음성"]').length
      
      // EnhancedVoiceInput 관련
      results.hasVoiceWrapper = !!document.querySelector('[data-testid="voice-input-wrapper"]')
      
      // window 함수 확인
      results.hasTestVoiceInput = typeof (window as any).testVoiceInput === 'function'
      
      // DashboardClient 마운트 확인
      results.dashboardElements = document.querySelectorAll('[class*="dashboard"]').length
      
      return results
    })
    
    console.log('컴포넌트 상태:', componentState)
    
    // 5. 수동으로 음성 입력 시뮬레이션
    console.log('\n=== 5. 수동 음성 입력 시뮬레이션 ===')
    
    // DashboardContext에서 handleVoiceInput 직접 호출
    const manualTestResult = await page.evaluate(async () => {
      try {
        // React DevTools 또는 Context API 접근 시도
        const testText = '수동 테스트 음성 입력'
        
        // 전역 함수가 있는지 먼저 확인
        if (typeof (window as any).testVoiceInput === 'function') {
          await (window as any).testVoiceInput(testText, 'health')
          return { success: true, method: 'testVoiceInput' }
        }
        
        // 없다면 직접 이벤트 디스패치
        const event = new CustomEvent('voice-input', {
          detail: { transcript: testText, activityType: 'health' }
        })
        window.dispatchEvent(event)
        
        return { success: true, method: 'customEvent' }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    })
    
    console.log('수동 테스트 결과:', manualTestResult)
    
    // 6. 활동 목록 확인
    await page.waitForTimeout(3000)
    
    const activities = await page.locator('text=최근 활동').locator('..').locator('.font-bold').allTextContents()
    console.log('\n=== 6. 최근 활동 목록 ===')
    console.log('활동 개수:', activities.length)
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity}`)
    })
    
    // 7. 로그 분석
    console.log('\n=== 7. 수집된 로그 분석 ===')
    const voiceLogs = logs.filter(log => 
      log.includes('음성') || 
      log.includes('Voice') || 
      log.includes('🎤') ||
      log.includes('testVoiceInput')
    )
    
    console.log('음성 관련 로그:', voiceLogs.length, '개')
    voiceLogs.forEach(log => console.log(log))
    
    // 최종 스크린샷
    await page.screenshot({ path: 'voice-debug-final.png', fullPage: true })
  })

  test('음성 입력 컴포넌트 직접 테스트', async ({ page }) => {
    // 테스트용 페이지 생성
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voice Input Test</title>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // 간단한 테스트 설정
            window.voiceTestResults = []
            
            // 음성 입력 시뮬레이션 함수
            window.simulateVoiceInput = function(text, type) {
              window.voiceTestResults.push({
                text: text,
                type: type,
                timestamp: new Date().toISOString()
              })
              console.log('음성 입력 시뮬레이션:', text, type)
            }
          </script>
        </body>
      </html>
    `)
    
    // 대시보드로 이동
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 음성 입력 함수 주입
    await page.evaluate(() => {
      // 전역 함수 재정의
      (window as any).testVoiceInput = async (text: string, type: string) => {
        console.log('🎯 주입된 testVoiceInput 호출:', { text, type })
        
        // 직접 DOM 업데이트 시도
        const activitySection = document.querySelector('text=최근 활동')?.parentElement
        if (activitySection) {
          const newActivity = document.createElement('div')
          newActivity.className = 'font-bold text-gray-800'
          newActivity.textContent = text
          activitySection.appendChild(newActivity)
        }
        
        return { success: true, text, type }
      }
    })
    
    // 테스트 실행
    const result = await page.evaluate(async () => {
      return await (window as any).testVoiceInput('주입된 함수 테스트', 'health')
    })
    
    console.log('주입 함수 실행 결과:', result)
    
    // 결과 확인
    await page.waitForTimeout(1000)
    const hasTestText = await page.locator('text=주입된 함수 테스트').isVisible().catch(() => false)
    console.log('테스트 텍스트 표시 여부:', hasTestText)
  })
})