import { chromium } from '@playwright/test'

async function globalTeardown() {
  console.log('🧹 E2E 테스트 정리 중...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3000')

    // 테스트 데이터 정리
    await page.evaluate(() => {
      // 테스트 모드 플래그 제거
      localStorage.removeItem('test-mode')

      // 테스트 관련 데이터 정리
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('test-') || key.includes('pending-sync'))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))

      // 캐시 정리
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('test-')) {
              caches.delete(name)
            }
          })
        })
      }
    })

    console.log('✅ 테스트 데이터 정리 완료')

  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error)
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ 모든 정리 작업 완료')
}

export default globalTeardown
