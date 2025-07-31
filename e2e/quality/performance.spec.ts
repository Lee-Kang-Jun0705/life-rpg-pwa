import { test, expect } from '@playwright/test'

test.describe('Performance Tests - 성능 측정', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 감지
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.error('Console error:', msg.text())
      }
    })
  })

  test('초기 로딩 시간이 2초 이내여야 함', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    const loadTime = Date.now() - startTime
    console.log(`Initial load time: ${loadTime}ms`)
    
    // 2초(2000ms) 이내 로딩
    expect(loadTime).toBeLessThan(2000)
    
    // First Contentful Paint 확인
    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByType('paint').find(
        e => e.name === 'first-contentful-paint'
      )
      return entry ? entry.startTime : null
    })
    
    if (fcp) {
      console.log(`First Contentful Paint: ${fcp}ms`)
      expect(fcp).toBeLessThan(1500)
    }
  })

  test('페이지 간 네비게이션이 빨라야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    const routes = [
      '/activities',
      '/dungeon', 
      '/inventory',
      '/skills',
      '/profile'
    ]
    
    for (const route of routes) {
      const startTime = Date.now()
      
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      const navigationTime = Date.now() - startTime
      console.log(`Navigation to ${route}: ${navigationTime}ms`)
      
      // 각 페이지 전환은 500ms 이내
      expect(navigationTime).toBeLessThan(500)
    }
  })

  test('이미지 최적화가 적용되어야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 모든 이미지 찾기
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      
      // loading="lazy" 속성 확인
      const loading = await img.getAttribute('loading')
      expect(loading).toBe('lazy')
      
      // WebP 또는 최적화된 형식 사용 확인
      const src = await img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        expect(src).toMatch(/\.(webp|svg|avif)|_next\/image/i)
      }
      
      // 적절한 크기 지정 확인
      const width = await img.getAttribute('width')
      const height = await img.getAttribute('height')
      expect(width).toBeTruthy()
      expect(height).toBeTruthy()
    }
  })

  test('JavaScript 번들 크기가 적절해야 함', async ({ page }) => {
    const resources: { url: string; size: number }[] = []
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('.js') && !url.includes('hot-update')) {
        resources.push({
          url,
          size: parseInt(response.headers()['content-length'] || '0')
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 전체 JS 크기 계산
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0)
    const totalSizeKB = totalSize / 1024
    
    console.log(`Total JS bundle size: ${totalSizeKB.toFixed(2)}KB`)
    
    // 초기 JS 번들은 500KB 이하
    expect(totalSizeKB).toBeLessThan(500)
    
    // 개별 청크 크기 확인
    resources.forEach(resource => {
      const sizeKB = resource.size / 1024
      console.log(`${resource.url.split('/').pop()}: ${sizeKB.toFixed(2)}KB`)
      
      // 개별 청크는 200KB 이하
      expect(sizeKB).toBeLessThan(200)
    })
  })

  test('메모리 사용량이 적절해야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 초기 메모리 사용량
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })
    
    if (initialMemory) {
      const initialMemoryMB = initialMemory / (1024 * 1024)
      console.log(`Initial memory usage: ${initialMemoryMB.toFixed(2)}MB`)
      
      // 여러 페이지 방문
      const routes = ['/activities', '/dungeon', '/inventory', '/skills']
      for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
      }
      
      // 최종 메모리 사용량
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return null
      })
      
      if (finalMemory) {
        const finalMemoryMB = finalMemory / (1024 * 1024)
        const memoryIncrease = finalMemoryMB - initialMemoryMB
        
        console.log(`Final memory usage: ${finalMemoryMB.toFixed(2)}MB`)
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`)
        
        // 메모리 증가량이 50MB 이하
        expect(memoryIncrease).toBeLessThan(50)
      }
    }
  })

  test('애니메이션이 60fps를 유지해야 함', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 애니메이션 성능 측정
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0
        let lastTime = performance.now()
        const duration = 1000 // 1초간 측정
        
        function countFrames(currentTime: number) {
          frames++
          
          if (currentTime - lastTime >= duration) {
            resolve(frames)
          } else {
            requestAnimationFrame(countFrames)
          }
        }
        
        requestAnimationFrame(countFrames)
      })
    })
    
    console.log(`Animation FPS: ${fps}`)
    
    // 최소 50fps 이상
    expect(fps).toBeGreaterThan(50)
  })

  test('캐싱이 적절히 작동해야 함', async ({ page }) => {
    // 첫 번째 방문
    await page.goto('/dashboard')
    
    // 캐시된 리소스 확인을 위한 두 번째 방문
    const cachedResources: string[] = []
    
    page.on('response', response => {
      if (response.status() === 304 || response.headers()['x-cache'] === 'HIT') {
        cachedResources.push(response.url())
      }
    })
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    console.log(`Cached resources: ${cachedResources.length}`)
    
    // 최소 일부 리소스는 캐시되어야 함
    expect(cachedResources.length).toBeGreaterThan(0)
  })

  test('Service Worker가 정상 작동해야 함', async ({ page }) => {
    await page.goto('/')
    
    // Service Worker 등록 확인
    const swState = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return {
          registered: !!registration,
          state: registration?.active?.state
        }
      }
      return { registered: false, state: null }
    })
    
    expect(swState.registered).toBeTruthy()
    expect(swState.state).toBe('activated')
    
    // 오프라인 모드에서도 기본 기능 작동
    await page.context().setOffline(true)
    
    // 페이지 새로고침
    await page.reload()
    
    // 오프라인에서도 기본 UI 표시
    await expect(page.locator('text=Life RPG')).toBeVisible()
    
    await page.context().setOffline(false)
  })

  test('Lighthouse 점수가 기준을 충족해야 함', async ({ page }) => {
    // 이 테스트는 실제 Lighthouse를 실행하지 않고
    // 주요 Web Vitals 메트릭을 직접 측정
    
    await page.goto('/')
    
    // Web Vitals 측정
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0
        let fid = 0
        let cls = 0
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
        }).observe({ entryTypes: ['layout-shift'] })
        
        // 2초 후 측정값 반환
        setTimeout(() => {
          resolve({ lcp, cls })
        }, 2000)
      })
    }) as { lcp: number; cls: number }
    
    console.log('Web Vitals:')
    console.log(`LCP: ${metrics.lcp}ms`)
    console.log(`CLS: ${metrics.cls}`)
    
    // 좋음 기준
    expect(metrics.lcp).toBeLessThan(2500) // LCP < 2.5s
    expect(metrics.cls).toBeLessThan(0.1)  // CLS < 0.1
  })

  test('대용량 데이터 처리 성능', async ({ page }) => {
    await page.goto('/activities')
    
    // 많은 활동 추가 (성능 테스트)
    const addManyActivities = async (count: number) => {
      const startTime = Date.now()
      
      for (let i = 0; i < count; i++) {
        await page.evaluate((index) => {
          // 직접 IndexedDB에 추가 (UI 우회)
          const activity = {
            id: `test-${index}`,
            title: `Test Activity ${index}`,
            category: 'health',
            createdAt: new Date().toISOString()
          }
          
          // localStorage나 IndexedDB에 직접 추가하는 로직
          const activities = JSON.parse(localStorage.getItem('activities') || '[]')
          activities.push(activity)
          localStorage.setItem('activities', JSON.stringify(activities))
        }, i)
      }
      
      const endTime = Date.now()
      return endTime - startTime
    }
    
    // 100개 활동 추가
    const time100 = await addManyActivities(100)
    console.log(`Adding 100 activities: ${time100}ms`)
    
    // 페이지 새로고침 후 렌더링 시간 측정
    const renderStart = Date.now()
    await page.reload()
    await page.waitForSelector('[data-testid="activity-card"]')
    const renderTime = Date.now() - renderStart
    
    console.log(`Rendering 100 activities: ${renderTime}ms`)
    
    // 렌더링 시간이 1초 이내
    expect(renderTime).toBeLessThan(1000)
  })
})