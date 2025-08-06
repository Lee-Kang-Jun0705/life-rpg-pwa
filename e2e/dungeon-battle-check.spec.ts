import { test, expect } from '@playwright/test'

test('던전 전투 화면 확인', async ({ page }) => {
  // 콘솔 메시지 수집
  const consoleMessages: string[] = []
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text())
    consoleMessages.push(msg.text())
  })
  
  // 페이지 에러 수집
  page.on('pageerror', error => {
    console.error('Page error:', error.message)
  })
  
  // 던전 페이지 로드
  await page.goto('/dungeon')
  await page.waitForLoadState('networkidle')
  
  // 일반 던전 클릭
  console.log('일반 던전 클릭 시도...')
  await page.click('button:has-text("일반 던전")')
  
  // 잠시 대기
  await page.waitForTimeout(2000)
  
  // 현재 URL 확인
  console.log('Current URL:', page.url())
  
  // 화면 스크린샷
  await page.screenshot({ path: 'after-dungeon-click.png', fullPage: true })
  
  // VS 텍스트가 있는지 확인
  const vsText = await page.locator('text=VS').count()
  console.log('VS text count:', vsText)
  
  // 전투 관련 요소 확인
  const battleElements = await page.locator('.relative.h-48').count()
  console.log('Battle area count:', battleElements)
  
  // 캐릭터 이모지 확인
  const characterEmoji = await page.locator('text=🦸‍♂️').count()
  console.log('Character emoji count:', characterEmoji)
  
  // 애니메이션 관련 클래스 확인
  const animationClasses = [
    '.animate-shake',
    '.animate-damage-float', 
    '.animate-hit-effect',
    '.animate-fadeIn'
  ]
  
  for (const className of animationClasses) {
    const count = await page.locator(className).count()
    console.log(`${className} count:`, count)
  }
  
  // DOM 구조 확인
  const battleAreaHTML = await page.locator('.relative.h-48').first().innerHTML().catch(() => 'Not found')
  console.log('Battle area HTML:', battleAreaHTML.substring(0, 200) + '...')
  
  // BGM 관련 로그 확인
  const bgmLog = consoleMessages.find(msg => msg.includes('BGM'))
  console.log('BGM related log:', bgmLog)
  
  // 10초 대기하여 애니메이션 발생 확인
  console.log('Waiting for animations...')
  await page.waitForTimeout(10000)
  
  // 최종 스크린샷
  await page.screenshot({ path: 'final-battle-state.png', fullPage: true })
})