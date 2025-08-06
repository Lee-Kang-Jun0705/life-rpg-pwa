import { test, expect } from '@playwright/test'

test.describe('음성 입력 간단 테스트', () => {
  test('window.testVoiceInput 함수 실행 및 DB 저장 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(text)
      if (text.includes('🎤') || text.includes('📊') || text.includes('💾')) {
        console.log('중요 로그:', text)
      }
    })

    // 대시보드 이동
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // 모든 컴포넌트 로드 대기

    // 1. testVoiceInput 함수 존재 확인
    const hasFunction = await page.evaluate(() => {
      return typeof (window as any).testVoiceInput === 'function'
    })
    console.log('testVoiceInput 함수 존재:', hasFunction)
    expect(hasFunction).toBeTruthy()

    // 2. 초기 활동 개수 확인
    const initialCount = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('LifeRPGDatabase')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      const transaction = db.transaction(['activities'], 'readonly')
      const store = transaction.objectStore('activities')
      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      db.close()
      return count
    })
    console.log('초기 활동 개수:', initialCount)

    // 3. 음성 입력 실행
    console.log('\n=== 음성 입력 실행 ===')
    const testText = '플레이라이트 음성 테스트 ' + new Date().getTime()
    
    await page.evaluate(async ({ text }) => {
      console.log('테스트 시작:', text)
      await (window as any).testVoiceInput(text, 'health')
    }, { text: testText })

    // 4. 로그 대기
    await page.waitForTimeout(3000)

    // 5. 관련 로그 확인
    const voiceLogs = logs.filter(log => 
      log.includes('🎤') || 
      log.includes('📊') || 
      log.includes('💾') ||
      log.includes('음성 입력')
    )
    
    console.log('\n=== 음성 관련 로그 ===')
    voiceLogs.forEach(log => console.log(log))

    // 6. DB에서 활동 확인
    const dbResult = await page.evaluate(async ({ searchText }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('LifeRPGDatabase')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      const transaction = db.transaction(['activities'], 'readonly')
      const store = transaction.objectStore('activities')
      const activities = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      db.close()
      
      // 테스트 텍스트 찾기
      const foundActivity = activities.find(a => a.activityName === searchText)
      
      return {
        totalCount: activities.length,
        found: !!foundActivity,
        lastActivity: activities[activities.length - 1],
        foundActivity
      }
    }, { searchText: testText })

    console.log('\n=== DB 결과 ===')
    console.log('전체 활동 개수:', dbResult.totalCount)
    console.log('테스트 텍스트 찾음:', dbResult.found)
    console.log('마지막 활동:', dbResult.lastActivity)
    
    if (dbResult.found) {
      console.log('✅ 음성 텍스트가 DB에 저장됨!')
      console.log('저장된 활동:', dbResult.foundActivity)
    } else {
      console.log('❌ 음성 텍스트가 DB에 저장되지 않음')
      console.log('마지막 활동의 activityName:', dbResult.lastActivity?.activityName)
    }

    // 7. UI 확인
    await page.waitForTimeout(2000)
    
    // 스크린샷
    await page.screenshot({ path: 'voice-simple-test-result.png', fullPage: true })

    // 검증
    expect(dbResult.found).toBeTruthy()
  })

  test('음성 버튼 클릭 후 실제 플로우 테스트', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 1. 음성 버튼 클릭
    const voiceButton = page.locator('button[aria-label*="음성"]')
    await voiceButton.click()
    
    // 2. 건강 스탯 선택 (더 구체적인 선택자 사용)
    const healthOption = page.locator('button').filter({ has: page.locator('text=💪') }).filter({ has: page.locator('text=건강') })
    await healthOption.click()
    
    // 3. 녹음 UI 확인
    await page.waitForTimeout(1000)
    const recordingUI = await page.locator('text=/녹음/').isVisible().catch(() => false)
    console.log('녹음 UI 표시:', recordingUI)
    
    // 스크린샷
    await page.screenshot({ path: 'voice-recording-ui.png', fullPage: true })
    
    // 4. Web Speech API 지원 확인
    const speechSupport = await page.evaluate(() => {
      return {
        speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        speechSynthesis: 'speechSynthesis' in window
      }
    })
    
    console.log('Web Speech API 지원:', speechSupport)
  })
})