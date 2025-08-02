import { test, expect } from '@playwright/test'

test.describe('모든 페이지 스크린샷 및 콘솔 에러 체크', () => {
  test('모든 페이지 방문 및 스크린샷', async ({ page }) => {
    const errors: { page: string, errors: string[] }[] = []
    let currentPage = ''
    
    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // React 경고 제외
        if (!text.includes('Warning:') && !text.includes('Extra attributes')) {
          const pageErrors = errors.find(e => e.page === currentPage)
          if (pageErrors) {
            pageErrors.errors.push(text)
          } else {
            errors.push({ page: currentPage, errors: [text] })
          }
          console.error(`❌ [${currentPage}] Console Error:`, text)
        }
      }
    })
    
    page.on('pageerror', (error) => {
      const pageErrors = errors.find(e => e.page === currentPage)
      if (pageErrors) {
        pageErrors.errors.push(error.message)
      } else {
        errors.push({ page: currentPage, errors: [error.message] })
      }
      console.error(`❌ [${currentPage}] Page Error:`, error.message)
    })
    
    // 모든 페이지 목록
    const pages = [
      { name: '홈', path: '/' },
      { name: '대시보드', path: '/dashboard' },
      { name: '활동', path: '/activities' },
      { name: '던전', path: '/dungeon' },
      { name: '배틀', path: '/battle' },
      { name: '스킬', path: '/skills' },
      { name: '인벤토리', path: '/inventory' },
      { name: '장비', path: '/equipment' },
      { name: '상점', path: '/shop' },
      { name: '업적', path: '/achievements' },
      { name: '일일미션', path: '/daily' },
      { name: '컬렉션', path: '/collection' },
      { name: '랭킹', path: '/ranking' },
      { name: '리더보드', path: '/leaderboard' },
      { name: '프로필', path: '/profile' },
      { name: '설정', path: '/settings' },
      { name: '설정-알림', path: '/settings/notifications' },
      { name: '설정-개인화', path: '/settings/personalization' },
      { name: 'AI코치', path: '/ai-coach' },
      { name: '모험', path: '/adventure' }
    ]
    
    console.log('🚀 모든 페이지 테스트 시작...\n')
    
    for (const pageInfo of pages) {
      currentPage = pageInfo.name
      console.log(`\n📸 ${pageInfo.name} 페이지 테스트 중...`)
      
      try {
        // 페이지 방문
        const response = await page.goto(pageInfo.path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        })
        
        // HTTP 상태 확인
        const status = response?.status() || 0
        console.log(`  - HTTP 상태: ${status}`)
        
        // 페이지 로드 대기
        await page.waitForTimeout(2000)
        
        // 스크린샷 저장
        const screenshotPath = `e2e/screenshots/page-${pageInfo.name.replace(/\//g, '-')}.png`
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        })
        console.log(`  ✅ 스크린샷 저장: ${screenshotPath}`)
        
        // 페이지 제목 확인
        const title = await page.title()
        console.log(`  - 페이지 제목: ${title}`)
        
        // 주요 요소 확인
        const bodyText = await page.locator('body').innerText()
        console.log(`  - 페이지 텍스트 길이: ${bodyText.length}자`)
        
        // 페이지별 특정 요소 체크
        if (pageInfo.path === '/dashboard') {
          const hasStats = await page.locator('text=/건강|학습|관계|성취/').count()
          console.log(`  - 스탯 요소 개수: ${hasStats}`)
        }
        
      } catch (error) {
        console.error(`  ❌ 오류 발생: ${error.message}`)
        // 오류 시에도 스크린샷 저장
        await page.screenshot({ 
          path: `e2e/screenshots/error-${pageInfo.name.replace(/\//g, '-')}.png`,
          fullPage: true 
        })
      }
    }
    
    // 최종 에러 리포트
    console.log('\n\n📊 === 최종 콘솔 에러 리포트 ===')
    if (errors.length === 0) {
      console.log('✅ 콘솔 에러 없음!')
    } else {
      errors.forEach(({ page, errors: pageErrors }) => {
        console.error(`\n❌ ${page} 페이지 (${pageErrors.length}개 에러):`)
        pageErrors.forEach(err => console.error(`   - ${err}`))
      })
    }
    
    // 에러가 있으면 테스트 실패
    const totalErrors = errors.reduce((sum, p) => sum + p.errors.length, 0)
    expect(totalErrors).toBe(0)
  })
  
  test('페이지 간 네비게이션 테스트', async ({ page }) => {
    console.log('\n🔄 페이지 간 이동 테스트 시작...\n')
    
    // 대시보드에서 시작
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // 네비게이션 메뉴 확인
    const navExists = await page.locator('nav, [class*="nav"], [class*="menu"]').count()
    console.log(`네비게이션 요소 개수: ${navExists}`)
    
    if (navExists > 0) {
      // 네비게이션 스크린샷
      await page.screenshot({ path: 'e2e/screenshots/navigation.png' })
      
      // 메뉴 항목 찾기
      const menuItems = await page.locator('a[href], button').all()
      console.log(`링크/버튼 개수: ${menuItems.length}`)
      
      // 주요 링크 테스트
      const testLinks = [
        { text: '활동', expectedUrl: '/activities' },
        { text: '던전', expectedUrl: '/dungeon' },
        { text: '상점', expectedUrl: '/shop' }
      ]
      
      for (const link of testLinks) {
        try {
          const linkElement = page.locator(`text=${link.text}`).first()
          if (await linkElement.count() > 0) {
            await linkElement.click()
            await page.waitForTimeout(1000)
            
            const currentUrl = page.url()
            console.log(`✅ ${link.text} 클릭 -> ${currentUrl}`)
            
            await page.screenshot({ 
              path: `e2e/screenshots/nav-to-${link.text}.png` 
            })
          }
        } catch (e) {
          console.error(`❌ ${link.text} 링크 클릭 실패`)
        }
      }
    }
  })
  
  test('대시보드 상세 기능 테스트', async ({ page }) => {
    console.log('\n🎯 대시보드 기능 상세 테스트...\n')
    
    await page.goto('/dashboard')
    await page.waitForTimeout(3000)
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/dashboard-full.png',
      fullPage: true 
    })
    
    // 모든 버튼 찾기
    const buttons = await page.locator('button').all()
    console.log(`버튼 개수: ${buttons.length}`)
    
    // 각 버튼 정보 출력
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const buttonText = await buttons[i].innerText()
      console.log(`  버튼 ${i + 1}: ${buttonText}`)
    }
    
    // 입력 필드 찾기
    const inputs = await page.locator('input, textarea').count()
    console.log(`입력 필드 개수: ${inputs}`)
    
    // 활동 추가 버튼 클릭 시도
    const addButton = page.locator('button').filter({ hasText: /추가|새|활동|플러스|\+/ }).first()
    if (await addButton.count() > 0) {
      console.log('활동 추가 버튼 발견!')
      await addButton.click()
      await page.waitForTimeout(1000)
      
      // 모달/폼 스크린샷
      await page.screenshot({ 
        path: 'e2e/screenshots/dashboard-add-activity.png' 
      })
      
      // ESC로 닫기
      await page.keyboard.press('Escape')
    }
  })
})