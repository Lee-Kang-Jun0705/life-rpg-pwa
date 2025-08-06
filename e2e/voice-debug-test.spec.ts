import { test, expect } from '@playwright/test'

test.describe('음성 입력 디버그 테스트', () => {
  test('음성 인식 전체 플로우 디버그', async ({ page }) => {
    // 모든 콘솔 로그 수집
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(`[${msg.type()}] ${text}`)
      // 음성 관련 로그만 출력
      if (text.includes('Speech Recognition') || 
          text.includes('EnhancedVoiceInput') || 
          text.includes('useSpeechRecognition') ||
          text.includes('🎤') || 
          text.includes('🎙️') || 
          text.includes('📝')) {
        console.log(`[${new Date().toISOString()}] ${text}`)
      }
    })

    // 페이지 이동
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('\n=== Web Speech API 지원 확인 ===')
    const apiSupport = await page.evaluate(() => {
      const hasWebkit = 'webkitSpeechRecognition' in window
      const hasStandard = 'SpeechRecognition' in window
      
      // 실제 인스턴스 생성 테스트
      let canCreate = false
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          canCreate = true
        }
      } catch (e) {
        console.error('SpeechRecognition 인스턴스 생성 실패:', e)
      }

      return {
        hasWebkit,
        hasStandard,
        canCreate,
        userAgent: navigator.userAgent
      }
    })
    console.log('API 지원 상태:', apiSupport)

    console.log('\n=== 음성 버튼 클릭 ===')
    const voiceButton = page.locator('button[aria-label*="음성"]')
    await expect(voiceButton).toBeVisible()
    await voiceButton.click()

    // 마이크 권한 요청 처리
    page.on('dialog', async dialog => {
      console.log('Dialog 타입:', dialog.type())
      console.log('Dialog 메시지:', dialog.message())
      await dialog.accept()
    })

    // 권한 요청 대기
    await page.waitForTimeout(1000)

    console.log('\n=== 스탯 선택 ===')
    // 건강 스탯 선택
    const healthOption = page.locator('button').filter({ 
      has: page.locator('text=💪') 
    }).filter({ 
      has: page.locator('text=건강') 
    })
    
    if (await healthOption.isVisible()) {
      await healthOption.click()
      console.log('건강 스탯 선택됨')
    } else {
      console.log('스탯 선택 모달이 표시되지 않음')
    }

    // 음성 인식 시작 대기
    await page.waitForTimeout(3000)

    console.log('\n=== 프로그래밍 방식 음성 입력 테스트 ===')
    const testResult = await page.evaluate(async () => {
      // 직접 음성 인식 테스트
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (!SpeechRecognition) {
        return { error: 'SpeechRecognition API 없음' }
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'ko-KR'
      recognition.continuous = false
      recognition.interimResults = true

      const results: any[] = []
      
      return new Promise((resolve) => {
        recognition.onstart = () => {
          console.log('🎤 테스트: 음성 인식 시작')
          results.push({ event: 'start', time: Date.now() })
        }

        recognition.onresult = (event: any) => {
          console.log('🎙️ 테스트: 결과 받음', event.results)
          const result = {
            event: 'result',
            time: Date.now(),
            results: Array.from(event.results).map((r: any) => ({
              isFinal: r.isFinal,
              transcript: r[0]?.transcript
            }))
          }
          results.push(result)
        }

        recognition.onerror = (event: any) => {
          console.error('❌ 테스트: 에러', event.error)
          results.push({ 
            event: 'error', 
            error: event.error,
            message: event.message,
            time: Date.now() 
          })
          resolve({ results })
        }

        recognition.onend = () => {
          console.log('🛑 테스트: 음성 인식 종료')
          results.push({ event: 'end', time: Date.now() })
          resolve({ results })
        }

        try {
          recognition.start()
          // 5초 후 자동 종료
          setTimeout(() => {
            try {
              recognition.stop()
            } catch (e) {
              console.log('이미 종료됨')
            }
          }, 5000)
        } catch (e) {
          resolve({ error: '시작 실패', details: e })
        }
      })
    })

    console.log('\n=== 음성 인식 테스트 결과 ===')
    console.log(JSON.stringify(testResult, null, 2))

    // 로그 분석
    console.log('\n=== 수집된 중요 로그 ===')
    const importantLogs = logs.filter(log => 
      log.includes('Speech Recognition') || 
      log.includes('transcript') ||
      log.includes('error') ||
      log.includes('마이크')
    )
    importantLogs.forEach(log => console.log(log))

    // 스크린샷
    await page.screenshot({ 
      path: 'voice-debug-result.png', 
      fullPage: true 
    })

    // 최종 상태 확인
    const finalState = await page.evaluate(() => {
      return {
        hasTestVoiceInput: typeof (window as any).testVoiceInput === 'function',
        localStorage: { ...localStorage },
        indexedDBDatabases: Array.from(indexedDB.databases ? indexedDB.databases() : [])
      }
    })

    console.log('\n=== 최종 상태 ===')
    console.log('testVoiceInput 존재:', finalState.hasTestVoiceInput)
  })

  test('마이크 권한 명시적 테스트', async ({ page, context }) => {
    // 권한 설정
    await context.grantPermissions(['microphone'])

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const permissionStatus = await page.evaluate(async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        return result.state
      } catch (e) {
        return 'error: ' + e
      }
    })

    console.log('마이크 권한 상태:', permissionStatus)

    // MediaDevices API 테스트
    const mediaTest = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const tracks = stream.getTracks()
        const info = tracks.map(track => ({
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        }))
        tracks.forEach(track => track.stop())
        return { success: true, tracks: info }
      } catch (e: any) {
        return { success: false, error: e.name, message: e.message }
      }
    })

    console.log('MediaDevices 테스트:', mediaTest)
  })
})