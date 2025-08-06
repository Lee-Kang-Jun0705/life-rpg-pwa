import { chromium, Browser, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 리팩토링 전 기준 스크린샷 캡처 스크립트
 * 주요 화면과 기능의 현재 상태를 기록
 */

const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'refactoring-safety', 'baseline-screenshots')
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// 스크린샷 디렉토리 생성
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

interface ScreenshotTask {
  name: string
  path: string
  actions?: (page: Page) => Promise<void>
  waitFor?: string | number
  viewports?: Array<{ width: number; height: number; name: string }>
}

const screenshotTasks: ScreenshotTask[] = [
  // 대시보드
  {
    name: 'dashboard-main',
    path: '/dashboard',
    waitFor: '[data-testid="stat-card"]'
  },
  {
    name: 'dashboard-stat-modal',
    path: '/dashboard',
    actions: async (page) => {
      await page.click('[data-testid="stat-card"]:has-text("건강")')
    },
    waitFor: '[role="dialog"]'
  },
  {
    name: 'dashboard-quick-record',
    path: '/dashboard',
    actions: async (page) => {
      await page.click('[data-testid="stat-card"]:has-text("건강")')
      await page.click('button:has-text("3초 기록")')
    },
    waitFor: 'input[placeholder*="활동"]'
  },
  
  // 던전
  {
    name: 'dungeon-list',
    path: '/dungeon',
    actions: async (page) => {
      await page.click('button[role="tab"]:has-text("던전")')
    },
    waitFor: 'h2:has-text("던전 탐험")'
  },
  {
    name: 'dungeon-difficulty',
    path: '/dungeon',
    actions: async (page) => {
      await page.click('button[role="tab"]:has-text("던전")')
      await page.click('button:has-text("상급")')
    },
    waitFor: 1000
  },
  {
    name: 'dungeon-progress',
    path: '/dungeon',
    actions: async (page) => {
      await page.click('button[role="tab"]:has-text("던전")')
      await page.click('div:has-text("초보자의 숲")')
    },
    waitFor: 'button:has-text("전투 시작")'
  },
  
  // 상점
  {
    name: 'shop-weapons',
    path: '/shop',
    waitFor: '[data-testid="shop-item"]'
  },
  {
    name: 'shop-armor',
    path: '/shop',
    actions: async (page) => {
      await page.click('button[role="tab"]:has-text("방어구")')
    },
    waitFor: 500
  },
  {
    name: 'shop-consumables',
    path: '/shop',
    actions: async (page) => {
      await page.click('button[role="tab"]:has-text("소비")')
    },
    waitFor: 500
  },
  
  // 스킬
  {
    name: 'skills-main',
    path: '/skills',
    waitFor: '[data-testid="skill-card"], [class*="skill-card"]'
  },
  
  // 프로필
  {
    name: 'profile-main',
    path: '/profile',
    waitFor: 1000
  },
  
  // 반응형 디자인 - 대시보드
  {
    name: 'dashboard-responsive',
    path: '/dashboard',
    waitFor: '[data-testid="stat-card"]',
    viewports: [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ]
  }
]

async function captureScreenshots() {
  const browser: Browser = await chromium.launch({
    headless: true
  })

  try {
    console.log(`📸 Capturing baseline screenshots...`)
    console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`)
    console.log(`🌐 Base URL: ${BASE_URL}`)
    console.log('')

    for (const task of screenshotTasks) {
      console.log(`📷 Capturing: ${task.name}`)

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      })
      const page = await context.newPage()

      try {
        // 페이지 이동
        await page.goto(BASE_URL + task.path)
        await page.waitForLoadState('networkidle')

        // 추가 작업 실행
        if (task.actions) {
          await task.actions(page)
        }

        // 대기
        if (typeof task.waitFor === 'string') {
          await page.waitForSelector(task.waitFor, { timeout: 10000 })
        } else if (typeof task.waitFor === 'number') {
          await page.waitForTimeout(task.waitFor)
        }

        // 여러 뷰포트에서 캡처
        if (task.viewports) {
          for (const viewport of task.viewports) {
            await page.setViewportSize(viewport)
            await page.waitForTimeout(500) // 레이아웃 안정화 대기
            
            const filename = `${task.name}-${viewport.name}.png`
            await page.screenshot({
              path: path.join(SCREENSHOT_DIR, filename),
              fullPage: true
            })
            console.log(`  ✅ ${filename}`)
          }
        } else {
          // 단일 스크린샷
          const filename = `${task.name}.png`
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, filename),
            fullPage: true
          })
          console.log(`  ✅ ${filename}`)
        }

      } catch (error) {
        console.error(`  ❌ Failed to capture ${task.name}:`, error)
      } finally {
        await context.close()
      }
    }

    console.log('\n✨ Baseline screenshots captured successfully!')
    
    // 메타데이터 저장
    const metadata = {
      capturedAt: new Date().toISOString(),
      totalScreenshots: screenshotTasks.reduce((sum, task) => 
        sum + (task.viewports ? task.viewports.length : 1), 0
      ),
      tasks: screenshotTasks.map(t => ({
        name: t.name,
        path: t.path,
        viewports: t.viewports?.map(v => v.name) || ['default']
      }))
    }
    
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    console.log('📝 Metadata saved to metadata.json')

  } finally {
    await browser.close()
  }
}

// 성능 메트릭 캡처
async function capturePerformanceMetrics() {
  const browser = await chromium.launch({ headless: true })
  const metricsFile = path.join(SCREENSHOT_DIR, 'performance-baseline.json')
  const metrics: any = {}

  try {
    console.log('\n📊 Capturing performance metrics...')

    const context = await browser.newContext()
    const page = await context.newPage()

    // 주요 페이지 성능 측정
    const pages = ['/dashboard', '/dungeon', '/shop', '/skills']
    
    for (const pagePath of pages) {
      console.log(`⏱️  Measuring: ${pagePath}`)
      
      const startTime = Date.now()
      await page.goto(BASE_URL + pagePath)
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      // Performance API 메트릭 수집
      const perfMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        }
      })

      metrics[pagePath] = {
        loadTime,
        ...perfMetrics,
        timestamp: new Date().toISOString()
      }

      console.log(`  ✅ Load time: ${loadTime}ms`)
    }

    // 메트릭 저장
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2))
    console.log(`\n📝 Performance metrics saved to performance-baseline.json`)

  } finally {
    await browser.close()
  }
}

// 실행
async function main() {
  console.log('🚀 Starting baseline capture process...\n')
  
  await captureScreenshots()
  await capturePerformanceMetrics()
  
  console.log('\n✅ All baseline captures completed!')
  console.log(`📁 Results saved in: ${SCREENSHOT_DIR}`)
}

main().catch(console.error)