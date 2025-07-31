import { test, expect } from '@playwright/test'

test.describe('던전 시스템 디버그 테스트', () => {
  test('기본 페이지 로드 확인', async ({ page }) => {
    // 콘솔 메시지 모니터링
    const messages: string[] = []
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`)
    })

    // 페이지 응답 확인
    const response = await page.goto('http://localhost:3000/dungeon', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    
    console.log('Response status:', response?.status())
    console.log('Response URL:', response?.url())
    
    // 페이지 타이틀 확인
    const title = await page.title()
    console.log('Page title:', title)
    
    // body 내용 확인
    const bodyText = await page.locator('body').textContent()
    console.log('Body text length:', bodyText?.length)
    console.log('Body preview:', bodyText?.substring(0, 200))
    
    // 콘솔 메시지 출력
    console.log('Console messages:', messages)
    
    // 스크린샷 저장
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true })
    
    // 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible()
  })

  test('모험 페이지 상세 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/dungeon', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000)
    
    // 모든 h1 태그 찾기
    const h1Elements = await page.locator('h1').all()
    console.log('H1 elements count:', h1Elements.length)
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent()
      console.log(`H1[${i}]:`, text)
    }
    
    // 모든 버튼 찾기
    const buttons = await page.locator('button').all()
    console.log('Button count:', buttons.length)
    
    // 처음 10개 버튼 텍스트 출력
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent()
      console.log(`Button[${i}]:`, text)
    }
    
    // 탐험 버튼 찾기
    const exploreButton = page.locator('button:has-text("탐험")').first()
    const exploreVisible = await exploreButton.isVisible()
    console.log('탐험 버튼 visible:', exploreVisible)
    
    if (exploreVisible) {
      await exploreButton.click()
      await page.waitForTimeout(2000)
      
      // 클릭 후 상태 확인
      const afterClickText = await page.locator('body').textContent()
      console.log('After click text preview:', afterClickText?.substring(0, 300))
    }
  })

  test('네비게이션 확인', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(2000)
    
    // 햄버거 메뉴 찾기
    const hamburger = page.locator('button[aria-label="메뉴 열기"]')
    if (await hamburger.isVisible()) {
      console.log('햄버거 메뉴 발견')
      await hamburger.click()
      await page.waitForTimeout(1000)
    }
    
    // 네비게이션 링크 확인
    const navLinks = await page.locator('a[href="/dungeon"]').all()
    console.log('던전 링크 수:', navLinks.length)
    
    for (let i = 0; i < navLinks.length; i++) {
      const text = await navLinks[i].textContent()
      console.log(`Nav link[${i}]:`, text)
    }
    
    // 모험 텍스트가 있는지 확인
    const adventureText = await page.locator('text=모험').count()
    console.log('모험 텍스트 수:', adventureText)
    
    // 던전 텍스트가 있는지 확인
    const dungeonText = await page.locator('text=던전').count()
    console.log('던전 텍스트 수:', dungeonText)
  })
})