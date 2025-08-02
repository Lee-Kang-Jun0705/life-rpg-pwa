import { test } from '@playwright/test'

test('Debug menu structure', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // 음성 녹음 버튼 근처의 네비게이션 아이콘 찾기
  console.log('=== 하단 네비게이션 아이콘 확인 ===')
  const voiceButton = page.locator('text=음성으로 활동 기록')
  const voiceButtonBox = await voiceButton.boundingBox()
  console.log('음성 버튼 위치:', voiceButtonBox)
  
  // 하단 네비게이션 바 찾기
  console.log('=== 하단 네비게이션 확인 ===')
  const bottomNav = await page.locator('nav, [role="navigation"], footer').all()
  console.log(`네비게이션 요소 수: ${bottomNav.length}`)
  
  // 하단의 아이콘들 확인
  const bottomIcons = await page.locator('svg').all()
  console.log(`\nSVG 아이콘 수: ${bottomIcons.length}`)
  
  // 이미지나 아이콘 버튼들 확인
  const iconButtons = await page.locator('button:has(svg), a:has(svg)').all()
  console.log(`아이콘 버튼 수: ${iconButtons.length}`)
  
  for (const btn of iconButtons) {
    const ariaLabel = await btn.getAttribute('aria-label')
    const title = await btn.getAttribute('title')
    const href = await btn.getAttribute('href')
    console.log(`- aria-label: ${ariaLabel}, title: ${title}, href: ${href}`)
  }
  
  // 왼쪽 하단 N 버튼 클릭
  const nButton = page.locator('button').filter({ hasText: 'N' }).first()
  if (await nButton.isVisible()) {
    console.log('\nN 버튼 클릭')
    await nButton.click({ force: true })
    await page.waitForTimeout(1000)
    
    // 클릭 후 스크린샷
    await page.screenshot({ path: 'screenshots/debug-after-n-click.png', fullPage: true })
    
    // 메뉴가 열렸는지 확인
    const menuTexts = ['대시보드', '일일임무', '모험', '인벤토리', '상점', '스킬', 'AI코치', '설정']
    for (const text of menuTexts) {
      const isVisible = await page.locator(`text="${text}"`).isVisible().catch(() => false)
      console.log(`${text}: ${isVisible ? '표시됨' : '표시안됨'}`)
    }
  }
  
  // 페이지 전체 HTML 구조 확인
  const bodyHtml = await page.locator('body').innerHTML()
  if (bodyHtml.includes('대시보드') || bodyHtml.includes('Dashboard')) {
    console.log('\n페이지에 "대시보드" 텍스트가 포함되어 있음')
  }
})