import { test, expect } from '@playwright/test'

test('사운드 설정 볼륨 슬라이더 간단 테스트', async ({ page }) => {
  // 모험 페이지로 이동
  await page.goto('http://localhost:3005/adventure')
  await page.waitForTimeout(2000)
  
  // 스크린샷 저장 - 초기 상태
  await page.screenshot({ path: 'before-sound-settings.png', fullPage: true })
  
  // 사운드 설정 버튼 찾기 (Volume 아이콘이 있는 버튼)
  const soundButton = await page.locator('button').filter({ has: page.locator('svg') }).first()
  console.log('사운드 버튼 찾음')
  
  // 사운드 설정 열기
  await soundButton.click()
  await page.waitForTimeout(1000)
  
  // 슬라이더 찾기
  const sliders = page.locator('input[type="range"]')
  const sliderCount = await sliders.count()
  console.log('슬라이더 개수:', sliderCount)
  
  if (sliderCount > 0) {
    // 첫 번째 슬라이더 값 변경
    const firstSlider = sliders.first()
    await firstSlider.fill('30')
    await page.waitForTimeout(500)
    
    // 보라색 바 확인
    const purpleBar = page.locator('[class*="bg-purple-500"]').first()
    const width = await purpleBar.evaluate(el => el.style.width)
    console.log('보라색 바 너비:', width)
    
    // 스크린샷 저장 - 변경 후
    await page.screenshot({ path: 'after-sound-settings.png', fullPage: true })
  }
})