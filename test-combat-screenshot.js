const { chromium } = require('playwright');

(async() => {
  console.log('🎮 전투 시스템 스크린샷 테스트...')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  })

  const page = await browser.newPage()

  try {
    // 1. 던전 페이지 접속
    console.log('1. 던전 페이지 접속...')
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForTimeout(3000)

    // 스크린샷 촬영
    await page.screenshot({ path: 'dungeon-page.png', fullPage: true })
    console.log('✅ 던전 페이지 스크린샷 저장: dungeon-page.png')

    // 페이지 구조 분석
    console.log('\n📋 페이지 구조 분석:')

    // 던전 관련 요소 찾기
    const dungeonElements = await page.locator('[class*="던전"], [class*="dungeon"], button, .cursor-pointer').all()
    console.log(`발견된 클릭 가능한 요소: ${dungeonElements.length}개`)

    // 텍스트 기반으로 던전 찾기
    const dungeonTexts = ['초보자', '던전', '입장', 'Lv']
    for (const text of dungeonTexts) {
      const elements = await page.locator(`text=${text}`).all()
      console.log(`"${text}" 텍스트를 포함한 요소: ${elements.length}개`)
    }

    // 직접 수동 테스트
    console.log('\n🎯 수동 전투 테스트 진행...')
    console.log('브라우저에서 다음을 수행해주세요:')
    console.log('1. 던전 선택')
    console.log('2. 입장하기 클릭')
    console.log('3. 전투 화면에서 적 선택 후 공격')
    console.log('\n전투 속도와 딜레이를 확인해주세요.')

  } catch (error) {
    console.error('❌ 오류:', error)
  }

  console.log('\n브라우저를 열어둡니다. 테스트 후 수동으로 닫아주세요.')
})()
