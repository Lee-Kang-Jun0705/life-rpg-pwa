import { test, expect } from '@playwright/test'

test('레벨 동기화 상세 확인', async({ page }) => {
  // 로컬 스토리지 초기화
  await page.goto('http://localhost:3000')
  await page.evaluate(() => {
    localStorage.clear()
    indexedDB.deleteDatabase('life-rpg-db')
  })
  await page.reload()
  await page.waitForTimeout(3000)

  // 1. 대시보드 확인
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForTimeout(3000)

  // 콘솔 로그 캡처 활성화
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('브라우저 콘솔:', msg.text())
    }
  })

  // 총 레벨 텍스트 가져오기
  const totalLevelElement = await page.locator('.text-3xl').first()
  const totalLevelText = await totalLevelElement.textContent()
  console.log('대시보드 총 레벨 텍스트:', totalLevelText)

  // 각 스탯 카드의 레벨 확인
  const statCards = await page.locator('[data-testid="stat-card"]').all()
  console.log('스탯 카드 개수:', statCards.length)

  for (let i = 0; i < statCards.length; i++) {
    const levelText = await statCards[i].locator('.text-sm.mt-2.opacity-90').textContent()
    console.log(`스탯 카드 ${i + 1} 레벨:`, levelText)
  }

  // 콘솔에서 실제 데이터 확인
  const dbData = await page.evaluate(async() => {
    const getDb = async() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('life-rpg-db')
        request.onsuccess = () => resolve(request.result)
      })
    }

    const db = await getDb()
    const transaction = db.transaction(['stats'], 'readonly')
    const store = transaction.objectStore('stats')

    return new Promise((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
    })
  })

  console.log('데이터베이스 스탯 데이터:', JSON.stringify(dbData, null, 2))

  // 2. 모험 페이지 확인
  await page.goto('http://localhost:3000/adventure')
  await page.waitForTimeout(3000)

  const adventureLevelElement = await page.locator('.text-sm.text-gray-400 span').first()
  const adventureLevelText = await adventureLevelElement.textContent()
  console.log('모험 페이지 레벨 텍스트:', adventureLevelText)

  // 스크린샷 저장
  await page.screenshot({ path: 'dashboard-level.png', fullPage: true })
  await page.goto('http://localhost:3000/adventure')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'adventure-level.png', fullPage: true })
})
