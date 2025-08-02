const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function captureScreenshots() {
  // 스크린샷 저장 디렉토리 생성
  const screenshotDir = path.join(__dirname, 'patent-screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir)
  }

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2 // 고해상도 스크린샷
  })
  const page = await context.newPage()

  try {
    console.log('프로젝트 페이지 로딩...')

    // 1. 메인 대시보드
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(3000) // 페이지 완전 로딩 대기
    await page.screenshot({
      path: path.join(screenshotDir, '01-main-dashboard.png'),
      fullPage: true
    })
    console.log('✓ 메인 대시보드 캡처 완료')

    // 2. 온보딩 화면 (프로젝트 소개)
    await page.goto('http://localhost:3000/onboarding')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '02-onboarding.png'),
      fullPage: true
    })
    console.log('✓ 온보딩 화면 캡처 완료')

    // 3. 활동 기록 화면
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000)

    // 활동 추가 버튼 클릭 시도
    const addButton = await page.$('button:has-text("활동 추가")')
    if (addButton) {
      await addButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: path.join(screenshotDir, '03-activity-recording.png'),
        fullPage: true
      })
      console.log('✓ 활동 기록 화면 캡처 완료')
    }

    // 4. 던전 시스템
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '04-dungeon-system.png'),
      fullPage: true
    })
    console.log('✓ 던전 시스템 캡처 완료')

    // 5. AI 코치 화면
    await page.goto('http://localhost:3000/ai-coach')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '05-ai-coach.png'),
      fullPage: true
    })
    console.log('✓ AI 코치 화면 캡처 완료')

    // 6. 인벤토리/장비 시스템
    await page.goto('http://localhost:3000/inventory')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '06-inventory-system.png'),
      fullPage: true
    })
    console.log('✓ 인벤토리 시스템 캡처 완료')

    // 7. 프로필/포트폴리오 화면
    await page.goto('http://localhost:3000/profile')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '07-profile-portfolio.png'),
      fullPage: true
    })
    console.log('✓ 프로필/포트폴리오 캡처 완료')

    // 8. 설정 화면 (다양한 기능 확인)
    await page.goto('http://localhost:3000/settings')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(screenshotDir, '08-settings.png'),
      fullPage: true
    })
    console.log('✓ 설정 화면 캡처 완료')

    console.log('\n모든 스크린샷 캡처 완료!')
    console.log(`저장 위치: ${screenshotDir}`)

  } catch (error) {
    console.error('스크린샷 캡처 중 오류 발생:', error)
  } finally {
    await browser.close()
  }
}

// 스크립트 실행
captureScreenshots().catch(console.error)
