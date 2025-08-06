import { test, expect } from '@playwright/test'

test('대시보드 페이지 구조 확인', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  
  // 페이지 전체 HTML 출력
  const html = await page.content()
  console.log('페이지 HTML:', html.substring(0, 1000))
  
  // 모든 버튼 찾기
  const buttons = await page.locator('button').all()
  console.log('버튼 개수:', buttons.length)
  
  for (let i = 0; i < Math.min(5, buttons.length); i++) {
    const text = await buttons[i].textContent()
    console.log(`버튼 ${i}:`, text)
  }
  
  // h1, h2, h3 태그들 찾기
  const headings = await page.locator('h1, h2, h3').all()
  console.log('제목 개수:', headings.length)
  
  for (const heading of headings) {
    const text = await heading.textContent()
    console.log('제목:', text)
  }
  
  // 이모지를 포함한 텍스트 찾기
  const emojiTexts = await page.locator('text=/[💪🧠⚡❤️]/')
  const emojiCount = await emojiTexts.count()
  console.log('이모지 텍스트 개수:', emojiCount)
  
  // 스크린샷 저장
  await page.screenshot({ path: 'dashboard-debug.png', fullPage: true })
})