import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Life RPG PWA - 종합 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 추적
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // 페이지 에러 추적
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`)
    })
    
    // 초기 페이지 로드
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('1. 홈페이지 - 초기 로드 및 네비게이션', async ({ page }) => {
    // 스크린샷 저장 경로
    const screenshotDir = path.join('test-results', 'screenshots')
    
    // 홈페이지 스크린샷
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-homepage.png'),
      fullPage: true 
    })
    
    // 로고 확인
    await expect(page.locator('text=Life RPG').first()).toBeVisible()
    
    // 시작하기 버튼 클릭
    const startButton = page.locator('text=시작하기').first()
    await expect(startButton).toBeVisible()
    await startButton.click()
    
    // 대시보드로 이동 확인
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('2. 대시보드 - 음성인식 기능 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 대시보드 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '02-dashboard.png'),
      fullPage: true 
    })
    
    // 4개 스탯 카드 확인
    const statNames = ['건강', '학습', '관계', '성취']
    for (const stat of statNames) {
      await expect(page.locator(`text=${stat}`).first()).toBeVisible()
    }
    
    // 음성인식 버튼 확인
    const voiceButton = page.locator('button[aria-label*="음성"]')
    await expect(voiceButton).toBeVisible()
    
    // 음성인식 버튼 클릭
    await voiceButton.click()
    
    // 음성인식 UI 표시 확인 (권한 요청이나 상태 표시)
    await page.waitForTimeout(1000)
    
    // 음성인식 활성화 상태 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '03-voice-recognition.png'),
      fullPage: true 
    })
    
    // 직접 입력 폴백 UI 테스트
    const fallbackButton = page.locator('text=직접 입력')
    if (await fallbackButton.isVisible({ timeout: 5000 })) {
      await fallbackButton.click()
      
      // 텍스트 입력
      const textInput = page.locator('input[placeholder*="활동"], textarea[placeholder*="활동"]')
      await textInput.fill('아침 운동 30분')
      
      // 스탯 선택
      const healthButton = page.locator('button:has-text("건강")')
      await healthButton.click()
      
      // 제출
      const submitButton = page.locator('button:has-text("기록")')
      await submitButton.click()
      
      // 활동 기록 확인
      await page.waitForTimeout(2000)
      await page.screenshot({ 
        path: path.join('test-results', 'screenshots', '04-voice-input-result.png'),
        fullPage: true 
      })
    }
  })

  test('3. 활동 페이지 - 활동 추가 및 완료', async ({ page }) => {
    await page.goto('http://localhost:3000/activities')
    await page.waitForLoadState('networkidle')
    
    // 활동 페이지 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '05-activities.png'),
      fullPage: true 
    })
    
    // 활동 추가 버튼 클릭
    const addButton = page.locator('button:has-text("활동 추가"), button:has-text("추가")')
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // 활동 입력
      const activityInput = page.locator('input[placeholder*="활동"]')
      await activityInput.fill('플레이라이트 테스트 활동')
      
      // 카테고리 선택
      const categorySelect = page.locator('select, [role="combobox"]').first()
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 })
      }
      
      // 저장
      const saveButton = page.locator('button:has-text("저장"), button:has-text("추가")')
      await saveButton.click()
      
      await page.waitForTimeout(1000)
    }
    
    // 활동 완료 체크
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.check()
      await page.waitForTimeout(500)
    }
    
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '06-activity-completed.png'),
      fullPage: true 
    })
  })

  test('4. 모험 페이지 - 전투 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 모험 페이지 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '07-adventure.png'),
      fullPage: true 
    })
    
    // 탐험 탭 클릭
    const exploreTab = page.locator('text=탐험')
    if (await exploreTab.isVisible()) {
      await exploreTab.click()
      await page.waitForTimeout(1000)
      
      // 던전 선택
      const dungeonButton = page.locator('button').filter({ hasText: /초급|중급|상급/ }).first()
      if (await dungeonButton.isVisible()) {
        await dungeonButton.click()
        
        // 전투 화면 대기
        await page.waitForTimeout(2000)
        
        // 배속 버튼 확인
        const speedButton = page.locator('button').filter({ hasText: /x|배속/ })
        if (await speedButton.isVisible()) {
          await speedButton.click()
          await page.waitForTimeout(500)
        }
        
        // 전투 스크린샷
        await page.screenshot({ 
          path: path.join('test-results', 'screenshots', '08-battle.png'),
          fullPage: true 
        })
      }
    }
  })

  test('5. 던전 페이지 - 던전 진행', async ({ page }) => {
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 던전 페이지 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '09-dungeon.png'),
      fullPage: true 
    })
    
    // 던전 입장 버튼
    const enterButton = page.locator('button').filter({ hasText: /입장|진입|시작/ }).first()
    if (await enterButton.isVisible()) {
      await enterButton.click()
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: path.join('test-results', 'screenshots', '10-dungeon-battle.png'),
        fullPage: true 
      })
    }
  })

  test('6. 프로필 페이지', async ({ page }) => {
    await page.goto('http://localhost:3000/profile')
    await page.waitForLoadState('networkidle')
    
    // 프로필 페이지 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '11-profile.png'),
      fullPage: true 
    })
    
    // 프로필 정보 확인
    await expect(page.locator('text=/레벨|Lv\\./').first()).toBeVisible()
  })

  test('7. 네비게이션 메뉴 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // 모바일 뷰에서 햄버거 메뉴 확인
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 768) {
      const hamburger = page.locator('button[aria-label*="메뉴"]')
      if (await hamburger.isVisible()) {
        await hamburger.click()
        await page.waitForTimeout(500)
        
        await page.screenshot({ 
          path: path.join('test-results', 'screenshots', '12-mobile-menu.png'),
          fullPage: true 
        })
      }
    }
    
    // 각 메뉴 항목 클릭 테스트
    const menuItems = [
      { text: '대시보드', url: '/dashboard' },
      { text: '활동', url: '/activities' },
      { text: '모험', url: '/adventure' },
      { text: '던전', url: '/dungeon' }
    ]
    
    for (const item of menuItems) {
      const menuLink = page.locator(`a:has-text("${item.text}")`)
      if (await menuLink.isVisible()) {
        await menuLink.click()
        await page.waitForURL(`**${item.url}`)
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('8. 콘솔 에러 체크', async ({ page }) => {
    const pages = [
      { name: '홈', url: '/' },
      { name: '대시보드', url: '/dashboard' },
      { name: '활동', url: '/activities' },
      { name: '모험', url: '/adventure' },
      { name: '던전', url: '/dungeon' },
      { name: '프로필', url: '/profile' }
    ]
    
    const errors: { page: string; error: string }[] = []
    
    for (const pageInfo of pages) {
      const pageErrors: string[] = []
      
      // 에러 리스너 설정
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          pageErrors.push(msg.text())
        }
      })
      
      page.on('pageerror', (error) => {
        pageErrors.push(`Page error: ${error.message}`)
      })
      
      // 페이지 방문
      await page.goto(`http://localhost:3000${pageInfo.url}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // 에러 수집
      if (pageErrors.length > 0) {
        pageErrors.forEach(error => {
          errors.push({ page: pageInfo.name, error })
        })
      }
    }
    
    // 최종 콘솔 스크린샷
    await page.screenshot({ 
      path: path.join('test-results', 'screenshots', '13-final-console-check.png'),
      fullPage: true 
    })
    
    // 에러 리포트
    if (errors.length > 0) {
      console.log('발견된 에러:')
      errors.forEach(({ page, error }) => {
        console.log(`- ${page}: ${error}`)
      })
    }
    
    expect(errors).toHaveLength(0)
  })
})