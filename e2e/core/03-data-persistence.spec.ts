import { test, expect } from '@playwright/test'

test.describe('Data Persistence Tests - 데이터 저장/로드', () => {
  test('활동 데이터가 새로고침 후에도 유지되어야 함', async ({ page }) => {
    await page.goto('/activities')
    
    // 새 활동 추가
    await page.click('text=활동 추가')
    await page.fill('input[name="title"]', '테스트 활동')
    await page.selectOption('select[name="category"]', 'health')
    await page.fill('textarea[name="description"]', '테스트 설명')
    await page.click('text=저장')
    
    // 활동이 추가되었는지 확인
    await expect(page.locator('text=테스트 활동')).toBeVisible()
    
    // 페이지 새로고침
    await page.reload()
    
    // 활동이 여전히 있는지 확인
    await expect(page.locator('text=테스트 활동')).toBeVisible()
  })

  test('프로필 설정이 저장되어야 함', async ({ page }) => {
    await page.goto('/profile')
    
    // 프로필 정보 입력
    const nicknameInput = page.locator('input[name="nickname"]')
    await nicknameInput.clear()
    await nicknameInput.fill('테스트유저')
    
    const bioTextarea = page.locator('textarea[name="bio"]')
    await bioTextarea.clear()
    await bioTextarea.fill('테스트 자기소개')
    
    await page.click('text=저장')
    
    // 저장 성공 메시지 확인
    await expect(page.locator('text=저장되었습니다')).toBeVisible()
    
    // 다른 페이지로 이동 후 돌아오기
    await page.goto('/dashboard')
    await page.goto('/profile')
    
    // 값이 유지되는지 확인
    await expect(nicknameInput).toHaveValue('테스트유저')
    await expect(bioTextarea).toHaveValue('테스트 자기소개')
  })

  test('IndexedDB에 데이터가 정상 저장되어야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    // IndexedDB 확인
    const dbExists = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('LifeRPGDatabase')
        request.onsuccess = () => {
          const db = request.result
          const hasStores = db.objectStoreNames.length > 0
          db.close()
          resolve(hasStores)
        }
        request.onerror = () => resolve(false)
      })
    })
    
    expect(dbExists).toBeTruthy()
  })

  test('로컬 스토리지 설정이 유지되어야 함', async ({ page }) => {
    await page.goto('/settings')
    
    // 설정 변경
    await page.click('text=소리 효과')
    await page.click('text=진동 피드백')
    
    // 로컬 스토리지 확인
    const settings = await page.evaluate(() => {
      return localStorage.getItem('user-settings')
    })
    
    expect(settings).toBeTruthy()
    
    // 새로고침 후 설정 유지 확인
    await page.reload()
    
    const soundToggle = page.locator('text=소리 효과').locator('..')
    const vibrationToggle = page.locator('text=진동 피드백').locator('..')
    
    // 토글 상태 확인 (체크박스나 스위치의 상태)
    await expect(soundToggle.locator('input[type="checkbox"]')).toBeChecked()
    await expect(vibrationToggle.locator('input[type="checkbox"]')).toBeChecked()
  })

  test('오프라인 상태에서도 데이터 접근 가능해야 함', async ({ page, context }) => {
    // 먼저 온라인 상태에서 데이터 로드
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 오프라인 모드로 전환
    await context.setOffline(true)
    
    // 페이지 새로고침
    await page.reload()
    
    // 기본 UI가 여전히 표시되는지 확인
    await expect(page.locator('text=Life RPG')).toBeVisible()
    
    // 저장된 데이터가 표시되는지 확인
    const hasContent = await page.evaluate(() => {
      return document.body.textContent?.includes('건강') || 
             document.body.textContent?.includes('학습')
    })
    
    expect(hasContent).toBeTruthy()
    
    // 오프라인 모드 해제
    await context.setOffline(false)
  })
})