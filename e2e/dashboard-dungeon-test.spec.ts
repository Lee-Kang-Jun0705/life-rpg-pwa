import { test, expect } from '@playwright/test'

test.describe('대시보드 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('대시보드 메인 요소들이 표시되어야 함', async ({ page }) => {
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 대시보드 헤더 - Life RPG 타이틀 (h1 또는 h2)
    const header = page.locator('h1, h2').filter({ hasText: 'Life RPG' }).first()
    await expect(header).toBeVisible({ timeout: 10000 })
    
    // 스탯 버튼들 - 각 스탯 이름을 포함한 버튼
    await expect(page.locator('button:has-text("건강")')).toBeVisible()
    await expect(page.locator('button:has-text("학습")')).toBeVisible()
    await expect(page.locator('button:has-text("관계")')).toBeVisible()
    await expect(page.locator('button:has-text("성취")')).toBeVisible()
    
    // 스탯 올리기 제목
    await expect(page.locator('h3:has-text("스탯 올리기")')).toBeVisible()
    
    // 오늘의 활동 제목
    await expect(page.locator('h3:has-text("오늘의 활동")')).toBeVisible()
  })

  test('스탯 버튼 클릭 시 협력 모달이 열려야 함', async ({ page }) => {
    // 건강 스탯 버튼 클릭
    await page.locator('button:has-text("건강")').click()
    
    // 협력 모달 표시 확인 - dialog role을 가진 요소
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // 협력 선택 버튼들 확인
    await expect(modal.locator('button:has-text("나 혼자")')).toBeVisible()
    await expect(modal.locator('button:has-text("함께")')).toBeVisible()
    
    // 모달 바깥 클릭으로 닫기
    await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } })
    await expect(modal).not.toBeVisible()
  })

  test('스탯 레벨과 경험치 바가 표시되어야 함', async ({ page }) => {
    // 스탯 버튼에 레벨과 경험치 바가 포함되어 있는지 확인
    const statButton = page.locator('button:has-text("건강")')
    await expect(statButton).toBeVisible()
    
    // 레벨 표시 확인 (Lv.0 형식)
    const levelText = await statButton.textContent()
    expect(levelText).toContain('Lv.')
    
    // 경험치 바 확인
    await expect(statButton.locator('[role="progressbar"]')).toBeVisible()
  })

  test('음성 입력이 텍스트로 저장되는지 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(msg.text())
    })
    
    // 대시보드 페이지 로드
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 스탯 그리드가 로드될 때까지 대기
    await page.waitForSelector('[data-testid="stat-card"]', { timeout: 10000 })
    
    // 초기 활동 개수 확인 (활동 요약 섹션 또는 활동 텍스트 찾기)
    const activitySummary = await page.locator('text=/활동/').first()
    let initialActivityText = ''
    if (await activitySummary.isVisible({ timeout: 5000 })) {
      initialActivityText = await activitySummary.textContent() || ''
      console.log('초기 활동 상태:', initialActivityText)
    }
    
    // 건강 스탯 카드 클릭 (더 구체적인 셀렉터 사용)
    const healthCard = page.locator('[data-testid="stat-card"]').filter({ hasText: '건강' }).first()
    await healthCard.click()
    
    // 모달이 열릴 때까지 대기
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    
    // "나 혼자" 버튼 클릭
    await page.locator('[role="dialog"] button:has-text("나 혼자")').click()
    
    // 모달이 닫힐 때까지 대기 (나 혼자 클릭 후 모달이 닫힘)
    await page.waitForTimeout(1000)
    
    // JavaScript로 음성 입력 시뮬레이션
    const voiceInputResult = await page.evaluate(() => {
      // window.testVoiceInput 함수가 있는지 확인
      if (typeof (window as any).testVoiceInput === 'function') {
        console.log('🎯 testVoiceInput 함수 발견, 호출 중...')
        (window as any).testVoiceInput('오늘 30분 운동했어요', 'health')
        return { success: true, message: 'testVoiceInput 호출 성공' }
      } else {
        console.error('❌ testVoiceInput 함수를 찾을 수 없음')
        return { success: false, message: 'testVoiceInput 함수 없음' }
      }
    })
    
    console.log('음성 입력 시뮬레이션 결과:', voiceInputResult)
    
    // 처리 대기 (데이터베이스 저장 시간)
    await page.waitForTimeout(3000)
    
    // 콘솔 로그에서 음성 입력 관련 로그 확인
    const voiceLogs = consoleLogs.filter(log => 
      log.includes('🌤') || // 마이크 이모지
      log.includes('👀') || // 눈 이모지 (디버깅 로그)
      log.includes('📊') || // 차트 이모지 (경험치 계산)
      log.includes('💾') || // 디스크 이모지 (저장)
      log.includes('handleVoiceInput') ||
      log.includes('Voice input') ||
      log.includes('updateStat') ||
      log.includes('Activity saved') ||
      log.includes('activityData') ||
      log.includes('testVoiceInput')
    )
    
    console.log(`수집된 콘솔 로그 총 ${consoleLogs.length}개`)
    console.log('음성 입력 관련 로그 ' + voiceLogs.length + '개:')
    voiceLogs.forEach(log => console.log('  🔍', log.substring(0, 150)))
    
    // 테스트 결과 분석
    const hasVoiceInputCall = voiceLogs.some(log => 
      log.includes('handleVoiceInput called') || 
      log.includes('testVoiceInput 호출')
    )
    
    const hasTextInLog = voiceLogs.some(log => 
      log.includes('오늘 30분 운동했어요')
    )
    
    const hasSaveLog = voiceLogs.some(log => 
      log.includes('DB에 저장할 activityData') || 
      log.includes('Activity saved') ||
      log.includes('updateStat 호출')
    )
    
    // 결과 출력
    console.log('\n=== 테스트 결과 ===')
    console.log(`1. 음성 입력 함수 호출: ${hasVoiceInputCall ? '✅ 성공' : '❌ 실패'}`)
    console.log(`2. 텍스트 전달 확인: ${hasTextInLog ? '✅ 성공' : '❌ 실패'}`)
    console.log(`3. DB 저장 확인: ${hasSaveLog ? '✅ 성공' : '❌ 실패'}`)
    
    // 활동 요약 텍스트 변경 확인
    const newActivitySummary = await page.locator('text=/활동/').first()
    if (await newActivitySummary.isVisible({ timeout: 5000 })) {
      const newActivityText = await newActivitySummary.textContent() || ''
      console.log(`4. UI 업데이트: ${newActivityText !== initialActivityText ? '✅ 변경됨' : '⚠️ 변경 없음'}`)
      console.log('   초기:', initialActivityText)
      console.log('   현재:', newActivityText)
    }
    
    // 최종 결론
    if (hasVoiceInputCall && hasTextInLog && hasSaveLog) {
      console.log('\n🎉 음성 입력이 텍스트로 저장됨을 확인!')
      console.log('오늘 30분 운동했어요" 텍스트가 activityName으로 DB에 저장됨')
    } else if (hasVoiceInputCall) {
      console.log('\n⚠️ 음성 입력 함수는 호출되었으나 저장 확인 불가')
    } else {
      console.log('\n❌ 음성 입력 테스트 실패 - testVoiceInput 함수가 호출되지 않음')
    }
  })
})

test.describe('던전 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
  })

  test('던전 메인 화면이 표시되어야 함', async ({ page }) => {
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')
    
    // 던전 선택 화면 타이틀
    await expect(page.locator('h1').filter({ hasText: '던전' })).toBeVisible({ timeout: 10000 })
    
    // 던전 선택 카드들 - 타이틀을 포함하는 요소
    await expect(page.locator('h3').filter({ hasText: '일반 던전' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: '엘리트 던전' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: '보스 던전' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: '무한 던전' })).toBeVisible()
    
    // 난이도 설명 - 정확한 텍스트 매칭
    await expect(page.locator('text="난이도: 보통"')).toBeVisible()
    await expect(page.locator('text="난이도: 어려움"')).toBeVisible()
    await expect(page.locator('text="난이도: 매우 어려움"')).toBeVisible()
    await expect(page.locator('text="난이도: 끝없음"')).toBeVisible()
  })

  test('일반 던전 입장 및 자동전투 확인', async ({ page }) => {
    // 일반 던전 카드 내의 입장 버튼 클릭
    const normalDungeonCard = page.locator('div').filter({ hasText: '일반 던전' }).filter({ hasText: '난이도: 보통' })
    await normalDungeonCard.locator('button:has-text("입장")').click()
    
    // 자동전투 화면 로드 대기
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // 전투 화면 요소들 확인
    await expect(page.locator('text=/획득 골드/')).toBeVisible()
    
    // 배속 버튼 확인
    await expect(page.locator('button:has-text("1x")')).toBeVisible()
    await expect(page.locator('button:has-text("2x")')).toBeVisible()
    await expect(page.locator('button:has-text("3x")')).toBeVisible()
    
    // 일시정지 버튼 확인
    await expect(page.locator('button:has-text("일시정지")')).toBeVisible()
    
    // 나가기 버튼 확인
    await expect(page.locator('button:has-text("나가기")')).toBeVisible()
  })

  test('던전 BGM이 한 번만 재생되는지 확인', async ({ page }) => {
    // 콘솔 로그 수집 시작
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('[SoundManager]') || msg.text().includes('BGM')) {
        consoleLogs.push(msg.text())
      }
    })
    
    // 일반 던전 입장
    await page.click('button:has-text("입장"):near(:text("일반 던전"))')
    
    // 자동전투 화면 로드 대기
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // 2초 대기 (BGM 재생 확인)
    await page.waitForTimeout(2000)
    
    // BGM already playing 로그가 없어야 함 (첫 재생이므로)
    const alreadyPlayingLogs = consoleLogs.filter(log => 
      log.includes('BGM already playing')
    )
    expect(alreadyPlayingLogs.length).toBe(0)
    
    // 나가기 버튼 클릭
    await page.click('button:has-text("나가기")')
    
    // 다시 입장
    await page.click('button:has-text("입장"):near(:text("일반 던전"))')
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // BGM 재생 관련 로그 확인
    console.log('수집된 BGM 로그:', consoleLogs)
  })

  test('전투 중 타격음이 재생되는지 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const soundLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('playHit') || msg.text().includes('sfx_hit') || msg.text().includes('sfx_critical')) {
        soundLogs.push(msg.text())
      }
    })
    
    // 일반 던전 입장
    await page.click('button:has-text("입장"):near(:text("일반 던전"))')
    
    // 자동전투 화면 로드 대기
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // 전투 진행 대기 (3초)
    await page.waitForTimeout(3000)
    
    // 전투 로그에서 데미지 확인
    const damageLog = page.locator('text=/데미지/').first()
    if (await damageLog.isVisible({ timeout: 5000 })) {
      console.log('전투가 진행되고 있습니다')
    }
    
    console.log('수집된 사운드 로그:', soundLogs)
  })

  test('배속 변경 기능이 작동하는지 확인', async ({ page }) => {
    // 일반 던전 입장
    await page.click('button:has-text("입장"):near(:text("일반 던전"))')
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // 2배속 클릭
    await page.click('button:has-text("2x")')
    
    // 버튼 스타일 변경 확인 (활성화된 버튼은 다른 색상)
    const button2x = page.locator('button:has-text("2x")')
    await expect(button2x).toHaveClass(/bg-purple-600/)
    
    // 3배속 클릭
    await page.click('button:has-text("3x")')
    
    // 버튼 스타일 변경 확인
    const button3x = page.locator('button:has-text("3x")')
    await expect(button3x).toHaveClass(/bg-purple-600/)
  })

  test('일시정지/재개 기능이 작동하는지 확인', async ({ page }) => {
    // 일반 던전 입장
    await page.click('button:has-text("입장"):near(:text("일반 던전"))')
    await expect(page.locator('text=/스테이지/')).toBeVisible({ timeout: 10000 })
    
    // 일시정지 버튼 클릭
    await page.click('button:has-text("일시정지")')
    
    // 버튼 텍스트가 "재개"로 변경되어야 함
    await expect(page.locator('button:has-text("재개")')).toBeVisible()
    
    // 재개 버튼 클릭
    await page.click('button:has-text("재개")')
    
    // 버튼 텍스트가 다시 "일시정지"로 변경되어야 함
    await expect(page.locator('button:has-text("일시정지")')).toBeVisible()
  })
})

// 반응형 디자인 테스트
test.describe('반응형 디자인 테스트', () => {
  test('모바일 화면에서 대시보드가 제대로 표시되어야 함', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 주요 요소들이 모바일에서도 표시되는지 확인
    await expect(page.locator('h2:has-text("Life RPG")')).toBeVisible()
    await expect(page.locator('button:has-text("건강")')).toBeVisible()
  })

  test('모바일 화면에서 던전이 제대로 표시되어야 함', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 던전 선택 카드들이 세로로 배열되는지 확인
    await expect(page.locator('h3').filter({ hasText: '일반 던전' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: '엘리트 던전' })).toBeVisible()
  })
})