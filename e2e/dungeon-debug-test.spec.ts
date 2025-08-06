import { test, expect } from '@playwright/test'

test('던전 페이지 디버그', async ({ page }) => {
  // 콘솔 메시지 수집
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text())
  })
  
  // 페이지 에러 수집
  page.on('pageerror', error => {
    console.error('Page error:', error.message)
  })
  
  // 던전 페이지로 이동
  console.log('던전 페이지 로드 시작...')
  await page.goto('/dungeon')
  await page.waitForLoadState('networkidle')
  
  // 로딩 상태 확인
  const loadingText = await page.locator('text=던전 입장 준비 중').count()
  console.log('로딩 텍스트 개수:', loadingText)
  
  // 더 오래 기다려보기
  await page.waitForTimeout(5000)
  
  // 현재 페이지 스크린샷
  await page.screenshot({ path: 'dungeon-page-debug.png' })
  
  // 페이지 제목 확인
  const title = await page.title()
  console.log('페이지 제목:', title)
  
  // h1 태그들 확인
  const h1Elements = await page.locator('h1').allTextContents()
  console.log('h1 요소들:', h1Elements)
  
  // 버튼들 확인
  const buttons = await page.locator('button').allTextContents()
  console.log('버튼들:', buttons)
  
  // 일반 던전 버튼 클릭
  if (buttons.includes('일반 던전')) {
    console.log('일반 던전 버튼 클릭...')
    await page.click('button:has-text("일반 던전")')
    await page.waitForTimeout(3000)
    
    // 클릭 후 스크린샷
    await page.screenshot({ path: 'after-dungeon-click-debug.png' })
    
    // 현재 화면에 표시된 텍스트 확인
    const vsText = await page.locator('text=VS').count()
    console.log('VS 텍스트 개수:', vsText)
    
    // 전투 로그 메시지 확인
    const battleLogs = await page.locator('.animate-fadeIn').allTextContents()
    console.log('전투 로그:', battleLogs)
    
    // currentMonster 상태 확인
    const monsterText = await page.locator('text=다음 몬스터 준비 중').count()
    console.log('다음 몬스터 준비 중 텍스트 개수:', monsterText)
  }
  
  await page.waitForTimeout(5000)
})