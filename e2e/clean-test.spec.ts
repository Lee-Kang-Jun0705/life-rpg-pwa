import { test, expect } from '@playwright/test'

test('데이터베이스 초기화 후 레벨 동기화 확인', async ({ page }) => {
  // 1. 앱 접속 및 데이터 완전 초기화
  await page.goto('http://localhost:3000')
  
  // IndexedDB 완전 삭제
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const deleteReq = indexedDB.deleteDatabase('life-rpg-db')
      deleteReq.onsuccess = () => resolve('deleted')
      deleteReq.onerror = () => resolve('error')
      deleteReq.onblocked = () => resolve('blocked')
    })
  })
  
  // localStorage도 초기화
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  // 새로고침
  await page.reload()
  await page.waitForTimeout(3000)
  
  // 2. 대시보드로 이동
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForTimeout(3000)
  
  // 스크린샷 저장
  await page.screenshot({ path: 'test-dashboard-init.png', fullPage: true })
  
  // 총 레벨 확인
  const totalLevelText = await page.locator('[data-testid="user-level"]').textContent()
  console.log('초기화 후 대시보드 총 레벨:', totalLevelText)
  
  // 데이터베이스 직접 확인
  const dbStats = await page.evaluate(async () => {
    // DB 열기
    const openDB = () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('life-rpg-db')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
    
    try {
      const db = await openDB()
      const transaction = db.transaction(['stats'], 'readonly')
      const store = transaction.objectStore('stats')
      
      return new Promise((resolve) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
      })
    } catch (error) {
      return []
    }
  })
  
  console.log('데이터베이스 스탯:', JSON.stringify(dbStats, null, 2))
  
  // 3. 모험 페이지 확인
  await page.goto('http://localhost:3000/adventure')
  await page.waitForTimeout(3000)
  
  const adventureLevelText = await page.locator('.text-sm.text-gray-400 >> text=/Lv\\.\\d+/').textContent()
  console.log('모험 페이지 레벨:', adventureLevelText)
  
  // 4. 프로필 페이지 확인
  await page.goto('http://localhost:3000/profile')
  await page.waitForTimeout(3000)
  
  const profileLevelText = await page.locator('text=/레벨\\s*\\d+/').textContent()
  console.log('프로필 페이지 레벨:', profileLevelText)
  
  // 검증
  expect(totalLevelText).toContain('Lv.0')
  expect(adventureLevelText).toContain('Lv.0')
  expect(profileLevelText).toContain('레벨 0')
  
  // 5. 활동 추가하고 동기화 확인
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForTimeout(2000)
  
  // 건강 스탯 클릭
  await page.locator('button:has-text("건강")').click()
  await page.waitForTimeout(2000)
  
  // 레벨 재확인
  const afterActivityLevel = await page.locator('[data-testid="user-level"]').textContent()
  console.log('활동 추가 후 총 레벨:', afterActivityLevel)
  
  // 스크린샷
  await page.screenshot({ path: 'test-dashboard-after-activity.png', fullPage: true })
})