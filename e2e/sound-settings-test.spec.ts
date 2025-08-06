import { test, expect } from '@playwright/test'

test.describe('사운드 설정 슬라이더 테스트', () => {
  test('사운드 설정 볼륨 슬라이더가 시각적으로 업데이트되는지 확인', async ({ page }) => {
    // 모험 페이지로 이동
    await page.goto('http://localhost:3005/adventure')
    await page.waitForLoadState('networkidle')
    
    // 사운드 설정 버튼 클릭
    const soundButton = page.locator('button').filter({ has: page.locator('[class*="Volume"]') }).first()
    await soundButton.click()
    await page.waitForTimeout(500)
    
    // 전체 볼륨 슬라이더 테스트
    const masterVolumeSlider = page.locator('input[type="range"]').first()
    const masterVolumeBar = page.locator('[class*="bg-purple-500"]').first()
    
    // 초기 값 확인
    const initialValue = await masterVolumeSlider.evaluate(el => (el as HTMLInputElement).value)
    console.log('초기 볼륨 값:', initialValue)
    
    // 볼륨을 30%로 설정
    await masterVolumeSlider.fill('30')
    await page.waitForTimeout(500)
    
    // 시각적 바가 업데이트되었는지 확인
    const barWidth30 = await masterVolumeBar.evaluate(el => el.style.width)
    expect(barWidth30).toBe('30%')
    
    // 볼륨을 70%로 설정
    await masterVolumeSlider.fill('70')
    await page.waitForTimeout(500)
    
    // 시각적 바가 업데이트되었는지 확인
    const barWidth70 = await masterVolumeBar.evaluate(el => el.style.width)
    expect(barWidth70).toBe('70%')
    
    // 페이지 새로고침 후에도 설정이 유지되는지 확인
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // 사운드 설정 다시 열기
    const soundButtonAfterReload = page.locator('button').filter({ has: page.locator('[class*="Volume"]') }).first()
    await soundButtonAfterReload.click()
    await page.waitForTimeout(500)
    
    // 저장된 값 확인
    const savedValue = await page.locator('input[type="range"]').first().evaluate(el => (el as HTMLInputElement).value)
    expect(savedValue).toBe('70')
    
    // 시각적 바도 저장된 값을 반영하는지 확인
    const savedBarWidth = await page.locator('[class*="bg-purple-500"]').first().evaluate(el => el.style.width)
    expect(savedBarWidth).toBe('70%')
    
    // 스크린샷 저장
    await page.screenshot({ path: 'sound-settings-updated.png', fullPage: true })
  })
  
  test('모든 볼륨 슬라이더가 독립적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3005/adventure')
    await page.waitForLoadState('networkidle')
    
    // 사운드 설정 열기
    const soundButton = page.locator('button').filter({ has: page.locator('[class*="Volume"]') }).first()
    await soundButton.click()
    await page.waitForTimeout(500)
    
    // 모든 슬라이더와 바 선택
    const sliders = page.locator('input[type="range"]')
    const bars = page.locator('[class*="bg-purple-500"]')
    
    // 각 슬라이더를 다른 값으로 설정
    await sliders.nth(0).fill('100') // 전체 볼륨
    await sliders.nth(1).fill('50')  // BGM
    await sliders.nth(2).fill('70')  // 효과음
    
    await page.waitForTimeout(500)
    
    // 각 바가 올바른 값을 표시하는지 확인
    const bar1Width = await bars.nth(0).evaluate(el => el.style.width)
    const bar2Width = await bars.nth(1).evaluate(el => el.style.width)
    const bar3Width = await bars.nth(2).evaluate(el => el.style.width)
    
    expect(bar1Width).toBe('100%')
    expect(bar2Width).toBe('50%')
    expect(bar3Width).toBe('70%')
    
    // 퍼센트 표시 텍스트도 확인
    await expect(page.locator('text=100%').first()).toBeVisible()
    await expect(page.locator('text=50%').first()).toBeVisible()
    await expect(page.locator('text=70%').first()).toBeVisible()
  })
})