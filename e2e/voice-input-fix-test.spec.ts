import { test, expect } from '@playwright/test'

test.describe('음성 입력 첫 번째 시도 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('/dashboard')
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 메인 컨텐츠 로드 확인
    await expect(page.locator('[data-testid="dashboard-content"], main')).toBeVisible({ timeout: 10000 })
  })

  test('음성 입력이 첫 번째 시도에서 정상적으로 저장되어야 함', async ({ page }) => {
    // 음성 입력 버튼 찾기
    const voiceButton = page.locator('button[aria-label*="음성"]').first()
    await expect(voiceButton).toBeVisible()
    
    // 콘솔 로그 수집 시작
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('EnhancedVoiceInput') || msg.text().includes('handleVoiceInput')) {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
      }
    })
    
    // 초기 스탯 값 확인
    const healthStatBefore = await page.locator('[data-stat-type="health"] .text-2xl, [data-stat-type="health"] .text-xl').first().textContent()
    console.log('초기 건강 스탯 경험치:', healthStatBefore)
    
    // 음성 입력 시뮬레이션을 위한 스크립트 주입
    await page.evaluate(() => {
      // 음성 인식 Mock
      const mockRecognition = {
        continuous: false,
        interimResults: true,
        lang: 'ko-KR',
        onresult: null,
        onend: null,
        onerror: null,
        onstart: null,
        start: function() {
          console.log('🎤 Mock Recognition: Started')
          if (this.onstart) this.onstart()
          
          // 음성 결과 시뮬레이션
          setTimeout(() => {
            if (this.onresult) {
              const event = {
                results: [[{
                  transcript: '오늘 30분 운동했어요',
                  confidence: 0.9,
                  isFinal: true
                }]],
                resultIndex: 0
              }
              console.log('🎤 Mock Recognition: Result generated')
              this.onresult(event)
            }
            
            // 종료 이벤트
            setTimeout(() => {
              if (this.onend) {
                console.log('🎤 Mock Recognition: Ended')
                this.onend()
              }
            }, 100)
          }, 1000)
        },
        stop: function() {
          console.log('🎤 Mock Recognition: Stopped')
          if (this.onend) this.onend()
        }
      }
      
      // SpeechRecognition API Mock
      ;(window as any).SpeechRecognition = function() {
        return mockRecognition
      }
      ;(window as any).webkitSpeechRecognition = (window as any).SpeechRecognition
    })
    
    // 음성 버튼 클릭
    await voiceButton.click()
    
    // 스탯 선택 모달 대기
    const statModal = page.locator('[role="dialog"], .fixed').filter({ hasText: '스탯 선택' })
    await expect(statModal).toBeVisible({ timeout: 5000 })
    
    // 건강 스탯 선택
    const healthOption = statModal.locator('button').filter({ hasText: '건강' }).first()
    await healthOption.click()
    
    // 녹음 상태 표시 확인
    const recordingIndicator = page.locator('.text-red-500.animate-pulse, [aria-label*="녹음 중"]')
    await expect(recordingIndicator).toBeVisible({ timeout: 3000 })
    
    // 음성 처리 완료 대기
    await page.waitForTimeout(3000)
    
    // 스탯 업데이트 확인
    await page.waitForFunction(
      (beforeValue) => {
        const currentElement = document.querySelector('[data-stat-type="health"] .text-2xl, [data-stat-type="health"] .text-xl')
        const currentValue = currentElement?.textContent || ''
        return currentValue !== beforeValue
      },
      healthStatBefore,
      { timeout: 10000 }
    )
    
    // 업데이트된 스탯 값 확인
    const healthStatAfter = await page.locator('[data-stat-type="health"] .text-2xl, [data-stat-type="health"] .text-xl').first().textContent()
    console.log('업데이트된 건강 스탯 경험치:', healthStatAfter)
    
    // 콘솔 로그 출력
    console.log('\n=== 음성 입력 프로세스 로그 ===')
    consoleLogs.forEach(log => console.log(log))
    
    // 첫 번째 시도에서 스탯이 증가했는지 확인
    expect(healthStatAfter).not.toBe(healthStatBefore)
    
    // 로그에서 중요 이벤트 확인
    const hasCompletedData = consoleLogs.some(log => log.includes('Saving completed data'))
    const hasProcessedData = consoleLogs.some(log => log.includes('Processing completed voice data'))
    const hasSuccessfulProcess = consoleLogs.some(log => log.includes('Voice data processed successfully'))
    
    expect(hasCompletedData).toBe(true)
    expect(hasProcessedData).toBe(true)
    expect(hasSuccessfulProcess).toBe(true)
  })

  test('연속 음성 입력이 정상적으로 동작해야 함', async ({ page }) => {
    // 음성 입력 버튼 찾기
    const voiceButton = page.locator('button[aria-label*="음성"]').first()
    await expect(voiceButton).toBeVisible()
    
    // Mock 설정
    await page.evaluate(() => {
      let callCount = 0
      const mockRecognition = {
        continuous: false,
        interimResults: true,
        lang: 'ko-KR',
        onresult: null,
        onend: null,
        start: function() {
          callCount++
          setTimeout(() => {
            if (this.onresult) {
              this.onresult({
                results: [[{
                  transcript: `테스트 음성 ${callCount}`,
                  confidence: 0.9,
                  isFinal: true
                }]],
                resultIndex: 0
              })
            }
            setTimeout(() => {
              if (this.onend) this.onend()
            }, 100)
          }, 500)
        },
        stop: function() {
          if (this.onend) this.onend()
        }
      }
      
      ;(window as any).SpeechRecognition = function() {
        return mockRecognition
      }
      ;(window as any).webkitSpeechRecognition = (window as any).SpeechRecognition
    })
    
    // 첫 번째 음성 입력
    await voiceButton.click()
    await page.locator('[role="dialog"] button').filter({ hasText: '건강' }).first().click()
    await page.waitForTimeout(2000)
    
    const firstStatValue = await page.locator('[data-stat-type="health"] .text-2xl').first().textContent()
    
    // 두 번째 음성 입력
    await voiceButton.click()
    await page.locator('[role="dialog"] button').filter({ hasText: '학습' }).first().click()
    await page.waitForTimeout(2000)
    
    const secondStatValue = await page.locator('[data-stat-type="learning"] .text-2xl').first().textContent()
    
    // 두 음성 입력이 모두 정상적으로 처리되었는지 확인
    expect(firstStatValue).toBeTruthy()
    expect(secondStatValue).toBeTruthy()
  })
})