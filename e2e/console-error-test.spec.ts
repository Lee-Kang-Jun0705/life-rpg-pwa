import { test, expect, type Page } from '@playwright/test'

// 모든 페이지를 테스트할 목록
const PAGES_TO_TEST = [
  { name: '홈', url: '/' },
  { name: '대시보드', url: '/dashboard' },
  { name: '활동', url: '/activities' },
  { name: '던전', url: '/dungeon' },
  { name: '배틀', url: '/battle' },
  { name: '스킬', url: '/skills' },
  { name: '인벤토리', url: '/inventory' },
  { name: '장비', url: '/equipment' },
  { name: '상점', url: '/shop' },
  { name: '업적', url: '/achievements' },
  { name: '일일미션', url: '/daily' },
  { name: '컬렉션', url: '/collection' },
  { name: '랭킹', url: '/ranking' },
  { name: '리더보드', url: '/leaderboard' },
  { name: '프로필', url: '/profile' },
  { name: '설정', url: '/settings' }
]

test.describe('콘솔 에러 체크', () => {
  test.describe.configure({ mode: 'serial' })

  PAGES_TO_TEST.forEach(({ name, url }) => {
    test(`${name} 페이지 - 콘솔 에러 확인`, async ({ page }) => {
      const consoleErrors: string[] = []
      const consoleWarnings: string[] = []
      
      // 콘솔 메시지 수집
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(`[Console Error] ${msg.text()}`)
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(`[Console Warning] ${msg.text()}`)
        }
      })
      
      // 페이지 에러 수집
      page.on('pageerror', (error) => {
        consoleErrors.push(`[Page Error] ${error.message}`)
      })
      
      // 페이지 방문
      console.log(`Testing ${name} page at ${url}...`)
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        })
        
        // 페이지가 완전히 로드될 때까지 대기
        await page.waitForTimeout(2000)
        
        // 페이지 제목이나 주요 요소가 있는지 확인
        const title = await page.title()
        expect(title).toBeTruthy()
        
        // 에러 리포트
        if (consoleErrors.length > 0) {
          console.error(`\n❌ ${name} 페이지 에러:`)
          consoleErrors.forEach(err => console.error(err))
        }
        
        if (consoleWarnings.length > 0) {
          console.warn(`\n⚠️ ${name} 페이지 경고:`)
          consoleWarnings.forEach(warn => console.warn(warn))
        }
        
        // 콘솔 에러가 없어야 함
        expect(consoleErrors).toHaveLength(0)
        
      } catch (error) {
        console.error(`\n❌ ${name} 페이지 로드 실패:`, error)
        throw error
      }
    })
  })
})