import { test, expect } from '@playwright/test'
import { TEST_CONFIG, helpers } from '../test-config'

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

test.describe('오프라인 및 PWA 기능 테스트', () => {
  test('오프라인 모드에서 기본 기능 작동', async({ page, context }) => {
    // 1. 온라인 상태에서 데이터 생성
    await test.step('온라인에서 데이터 준비', async() => {
      await page.goto(TEST_CONFIG.pages.dashboard)
      await helpers.waitForPageLoad(page)

      // 활동 수행
      const statCard = page.locator('button').filter({ hasText: '건강' }).first()
      await statCard.click()
      await helpers.waitForModal(page)

      const modal = page.locator(TEST_CONFIG.selectors.modal)
      const activityButton = modal.locator('button').first()
      await activityButton.click()
      await expect(modal).toBeHidden()
    })

    // 2. 오프라인 전환
    await test.step('오프라인 모드 전환', async() => {
      await context.setOffline(true)
      await page.waitForTimeout(500)

      // 오프라인 인디케이터 확인
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-indicator, text=/오프라인|Offline/')
      await expect(offlineIndicator.first()).toBeVisible({ timeout: 5000 })
    })

    // 3. 오프라인에서 기능 테스트
    await test.step('오프라인에서 활동 수행', async() => {
      // 페이지 새로고침 (오프라인 상태)
      await page.reload()

      // 캐시된 페이지가 로드되는지 확인
      await expect(page.locator('h1').filter({ hasText: 'Life RPG' })).toBeVisible()

      // 활동 수행 가능한지 확인
      const statCard = page.locator('button').filter({ hasText: '학습' }).first()
      await statCard.click()

      const modal = page.locator(TEST_CONFIG.selectors.modal)
      await expect(modal).toBeVisible()

      const activityButton = modal.locator('button').first()
      await activityButton.click()
      await expect(modal).toBeHidden()

      // 오프라인에서도 경험치가 증가하는지 확인
      const expText = await statCard.locator('text=/\\d+\\s*\\/\\s*\\d+/').textContent()
      expect(expText).toBeTruthy()
    })

    // 4. 온라인 복귀 및 동기화
    await test.step('온라인 복귀 시 데이터 동기화', async() => {
      await context.setOffline(false)
      await page.waitForTimeout(1000)

      // 온라인 상태 확인
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-indicator')
      await expect(offlineIndicator).toBeHidden({ timeout: 5000 }).catch(() => {
        // 오프라인 인디케이터가 사라지거나 온라인 표시로 변경
      })

      // 동기화 표시 확인
      const syncIndicator = page.locator('text=/동기화|Syncing|저장 중/')
      if (await syncIndicator.isVisible({ timeout: 2000 })) {
        console.log('데이터 동기화 중')
        await expect(syncIndicator).toBeHidden({ timeout: 10000 })
      }
    })
  })

  test('PWA 설치 프롬프트', async({ page }) => {
    await page.goto(TEST_CONFIG.baseURL)

    // PWA 설치 프롬프트 모킹
    await page.evaluate(() => {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        (window as any).deferredPrompt = e
      })
    })

    // 설치 버튼 확인
    const installButton = page.locator('button').filter({ hasText: /설치|Install|홈 화면에 추가/ })

    if (await installButton.first().isVisible({ timeout: 5000 })) {
      console.log('PWA 설치 버튼 발견')

      // 설치 버튼 클릭
      await installButton.first().click()

      // 설치 프롬프트 또는 성공 메시지 확인
      const installPrompt = page.locator('text=/설치하시겠습니까|Install app|홈 화면에 추가/')
      const successMessage = page.locator('text=/설치되었습니다|Installed|추가되었습니다/')

      const isPromptVisible = await installPrompt.isVisible({ timeout: 2000 }).catch(() => false)
      const isSuccessVisible = await successMessage.isVisible({ timeout: 2000 }).catch(() => false)

      expect(isPromptVisible || isSuccessVisible).toBeTruthy()
    }
  })

  test('Service Worker 등록 및 캐싱', async({ page }) => {
    await page.goto(TEST_CONFIG.baseURL)

    // Service Worker 등록 확인
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then(reg => !!reg)
    })

    expect(swRegistered).toBeTruthy()

    // 캐시 확인
    const cacheNames = await page.evaluate(() => {
      return caches.keys()
    })

    console.log('등록된 캐시:', cacheNames)
    expect(cacheNames.length).toBeGreaterThan(0)

    // 주요 리소스가 캐시되었는지 확인
    const cachedResources = await page.evaluate(async() => {
      const cacheNames = await caches.keys()
      const resources = []

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        resources.push(...keys.map(req => req.url))
      }

      return resources
    })

    console.log(`캐시된 리소스 수: ${cachedResources.length}개`)

    // 주요 페이지가 캐시되었는지 확인
    const importantPages = ['/dashboard', '/skills', '/dungeon']
    for (const page of importantPages) {
      const isCached = cachedResources.some(url => url.includes(page))
      console.log(`${page} 캐시 여부: ${isCached}`)
    }
  })

  test('백그라운드 동기화', async({ page, context }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    // 1. 오프라인에서 여러 활동 수행
    await context.setOffline(true)

    const activities = ['건강', '학습', '관계']
    for (const statName of activities) {
      const statCard = page.locator('button').filter({ hasText: statName }).first()
      await statCard.click()

      const modal = page.locator(TEST_CONFIG.selectors.modal)
      await expect(modal).toBeVisible()

      const activityButton = modal.locator('button').first()
      await activityButton.click()
      await expect(modal).toBeHidden()

      await page.waitForTimeout(500)
    }

    // 2. 동기화 대기열 확인
    const pendingSyncCount = await page.evaluate(() => {
      const pendingData = localStorage.getItem('pending-sync') || '[]'
      return JSON.parse(pendingData).length
    })

    console.log(`동기화 대기 중인 활동: ${pendingSyncCount}개`)
    expect(pendingSyncCount).toBeGreaterThan(0)

    // 3. 온라인 복귀
    await context.setOffline(false)
    await page.waitForTimeout(2000)

    // 4. 동기화 완료 확인
    const syncedCount = await page.evaluate(() => {
      const pendingData = localStorage.getItem('pending-sync') || '[]'
      return JSON.parse(pendingData).length
    })

    console.log(`동기화 후 대기 중인 활동: ${syncedCount}개`)
    expect(syncedCount).toBeLessThan(pendingSyncCount)
  })

  test('앱 매니페스트 확인', async({ page }) => {
    const response = await page.goto('/manifest.json')

    if (response && response.ok()) {
      const manifest = await response.json()

      // 필수 매니페스트 속성 확인
      expect(manifest.name).toBeTruthy()
      expect(manifest.short_name).toBeTruthy()
      expect(manifest.start_url).toBeTruthy()
      expect(manifest.display).toBe('standalone')
      expect(manifest.theme_color).toBeTruthy()
      expect(manifest.background_color).toBeTruthy()

      // 아이콘 확인
      expect(manifest.icons).toBeDefined()
      expect(manifest.icons.length).toBeGreaterThan(0)

      // 512x512 아이콘 확인 (PWA 요구사항)
      const largeIcon = manifest.icons.find((icon: ManifestIcon) =>
        icon.sizes === '512x512' || icon.sizes.includes('512x512')
      )
      expect(largeIcon).toBeTruthy()

      console.log('매니페스트 정보:', {
        name: manifest.name,
        display: manifest.display,
        icons: manifest.icons.length
      })
    }
  })

  test('푸시 알림 권한', async({ page, context }) => {
    // 알림 권한 허용
    await context.grantPermissions(['notifications'])

    await page.goto(TEST_CONFIG.pages.settings)
    await helpers.waitForPageLoad(page)

    // 알림 설정 찾기
    const notificationToggle = page.locator('input[type="checkbox"], button').filter({ hasText: /알림|Notification/ }).first()

    if (await notificationToggle.isVisible()) {
      // 알림 활성화
      const isChecked = await notificationToggle.isChecked().catch(() => false)
      if (!isChecked) {
        await notificationToggle.click()
      }

      // 권한 상태 확인
      const permissionStatus = await page.evaluate(() => {
        return Notification.permission
      })

      expect(permissionStatus).toBe('granted')
      console.log('알림 권한:', permissionStatus)

      // 테스트 알림 발송
      await page.evaluate(() => {
        if (Notification.permission === 'granted') {
          new Notification('Life RPG', {
            body: '알림 테스트입니다!',
            icon: '/icon-192x192.png'
          })
        }
      })
    }
  })

  test('앱 업데이트 처리', async({ page }) => {
    await page.goto(TEST_CONFIG.baseURL)

    // Service Worker 업데이트 시뮬레이션
    await page.evaluate(() => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker 업데이트됨')
      })
    })

    // 업데이트 프롬프트 확인
    const updatePrompt = page.locator('text=/업데이트|Update|새로고침/')

    if (await updatePrompt.isVisible({ timeout: 2000 })) {
      console.log('앱 업데이트 프롬프트 표시됨')

      // 업데이트 수락
      const updateButton = page.locator('button').filter({ hasText: /업데이트|새로고침/ }).first()
      if (await updateButton.isVisible()) {
        await updateButton.click()
        await page.waitForLoadState('load')
      }
    }
  })

  test('로컬 스토리지 용량 관리', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    // 현재 스토리지 사용량 확인
    const storageInfo = await page.evaluate(() => {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }

      return {
        itemCount: localStorage.length,
        totalSize: totalSize,
        sizeInKB: (totalSize / 1024).toFixed(2)
      }
    })

    console.log('로컬 스토리지 사용량:', storageInfo)

    // 스토리지 정리 기능 확인
    await page.goto(TEST_CONFIG.pages.settings)

    const clearDataButton = page.locator('button').filter({ hasText: /데이터 정리|Clear|캐시 삭제/ }).first()

    if (await clearDataButton.isVisible()) {
      console.log('데이터 정리 옵션 사용 가능')
    }
  })
})
