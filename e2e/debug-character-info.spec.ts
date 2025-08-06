import { test, expect } from '@playwright/test'

test('CharacterInfo 컴포넌트 디버깅', async ({ page }) => {
  // 콘솔 로그 수집
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.text().includes('[Adventure]')) {
      logs.push(`${msg.type()}: ${msg.text()}`)
    }
  })

  // 1. 테스트 데이터 초기화
  await page.goto('http://localhost:3000/init-test-data')
  await page.waitForTimeout(5000)

  // 2. 모험 페이지로 이동
  await page.goto('http://localhost:3000/adventure')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 3. CharacterInfo 영역 찾기
  const characterInfoArea = await page.locator('.bg-gray-800\\/50.rounded-xl.p-4.mb-6').first()
  const isVisible = await characterInfoArea.isVisible()
  console.log('CharacterInfo 영역 표시:', isVisible)

  if (isVisible) {
    // 전체 HTML 확인
    const innerHTML = await characterInfoArea.innerHTML()
    console.log('CharacterInfo HTML:', innerHTML)

    // 텍스트 콘텐츠 확인
    const textContent = await characterInfoArea.textContent()
    console.log('CharacterInfo 텍스트:', textContent)

    // Lv. 텍스트 찾기
    const levelSpan = await characterInfoArea.locator('span:has-text("Lv.")').first()
    if (await levelSpan.isVisible()) {
      const levelText = await levelSpan.textContent()
      console.log('레벨 표시:', levelText)
    } else {
      console.log('레벨 span을 찾을 수 없음')
    }

    // 전투력 텍스트 찾기
    const combatPowerSpan = await characterInfoArea.locator('span:has-text("전투력")').first()
    if (await combatPowerSpan.isVisible()) {
      const powerText = await combatPowerSpan.textContent()
      console.log('전투력 표시:', powerText)
    }
  }

  // 콘솔 로그 출력
  console.log('\n=== Adventure 콘솔 로그 ===')
  logs.forEach(log => console.log(log))

  // 스크린샷
  await page.screenshot({ 
    path: 'C:/Users/USER/Pictures/Screenshots/character-info-debug.png',
    fullPage: true 
  })
})