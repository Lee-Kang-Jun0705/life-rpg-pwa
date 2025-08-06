import { test, expect } from '@playwright/test'

test('던전 페이지 구조 확인', async ({ page }) => {
  await page.goto('/dungeon')
  await page.waitForLoadState('networkidle')
  
  // 모든 h1, h2, h3 태그들 찾기
  const headings = await page.locator('h1, h2, h3').all()
  console.log('제목 개수:', headings.length)
  
  for (const heading of headings) {
    const text = await heading.textContent()
    console.log('제목:', text)
  }
  
  // 버튼들 찾기
  const buttons = await page.locator('button').all()
  console.log('버튼 개수:', buttons.length)
  
  for (let i = 0; i < Math.min(10, buttons.length); i++) {
    const text = await buttons[i].textContent()
    console.log(`버튼 ${i}:`, text)
  }
  
  // 던전 카드 찾기
  const cards = await page.locator('.bg-black\\/50').all()
  console.log('카드 개수:', cards.length)
  
  // 스크린샷 저장
  await page.screenshot({ path: 'dungeon-debug.png', fullPage: true })
})