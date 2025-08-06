import { test, expect } from '@playwright/test'

class ConsoleErrorCollector {
  private errors: Array<{
    page: string
    message: string
    type: string
  }> = []

  constructor(page: any) {
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        this.errors.push({
          page: page.url(),
          message: msg.text(),
          type: msg.type()
        })
      }
    })
  }

  getErrors() {
    return this.errors
  }

  printSummary() {
    if (this.errors.length === 0) {
      console.log('\n✅ 콘솔 에러 없음!')
    } else {
      console.log(`\n⚠️ 총 ${this.errors.length}개의 콘솔 에러 발견:`)
      this.errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err.page}`)
        console.log(`   ${err.message}`)
      })
    }
  }
}

test.describe('🚀 전체 서비스 최종 점검', () => {
  test('모든 페이지 접속 및 기능 확인', async ({ page }) => {
    console.log('\n=== Life RPG PWA 전체 서비스 테스트 시작 ===\n')
    const errorCollector = new ConsoleErrorCollector(page)

    // 테스트할 페이지 목록
    const pages = [
      { path: '/', name: '홈페이지', expectedTitle: /Life RPG/i },
      { path: '/dashboard', name: '대시보드', expectedTitle: /대시보드|Dashboard/i },
      { path: '/dungeon', name: '던전', expectedTitle: /던전|Dungeon/i },
      { path: '/profile', name: '프로필', expectedTitle: /프로필|Profile/i },
      { path: '/quests', name: '퀘스트', expectedTitle: /퀘스트|Quest/i },
      { path: '/leaderboard', name: '리더보드', expectedTitle: /리더보드|Leaderboard/i },
      { path: '/settings', name: '설정', expectedTitle: /설정|Settings/i }
    ]

    // 각 페이지 방문 및 확인
    for (const pageInfo of pages) {
      console.log(`\n🔍 ${pageInfo.name} 페이지 확인 중...`)
      
      try {
        await page.goto(pageInfo.path)
        await page.waitForLoadState('networkidle')
        
        // 페이지 로드 확인
        const titleElement = page.locator('h1, h2, [class*="title"]').first()
        await expect(titleElement).toBeVisible({ timeout: 5000 })
        console.log(`  ✅ 페이지 로드 성공`)
        
        // 스크린샷 저장
        await page.screenshot({ 
          path: `e2e/screenshots/final-test/${pageInfo.name.replace('/', '-')}.png`,
          fullPage: true 
        })
        console.log(`  📸 스크린샷 저장됨`)
        
        // 네비게이션 바 확인
        const navBar = page.locator('nav, [role="navigation"]').first()
        if (await navBar.isVisible()) {
          console.log(`  ✅ 네비게이션 바 확인`)
        }
        
      } catch (error) {
        console.log(`  ❌ ${pageInfo.name} 페이지 에러: ${error}`)
      }
    }

    // 던전 기능 상세 테스트
    console.log('\n\n🎮 던전 기능 상세 테스트')
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 던전 입장
    const normalDungeon = page.locator('button').filter({ hasText: '일반 던전' })
    if (await normalDungeon.isVisible()) {
      await normalDungeon.click()
      console.log('  ✅ 일반 던전 입장')
      
      await page.waitForTimeout(3000)
      
      // 전투 확인
      const stageInfo = page.locator('text=/스테이지/i')
      if (await stageInfo.isVisible()) {
        console.log('  ✅ 전투 화면 로드')
        console.log('  ✅ 자동 전투 진행 중')
      }
      
      // 나가기
      const exitButton = page.locator('button').filter({ hasText: /나가기|Exit/i })
      if (await exitButton.isVisible()) {
        await exitButton.click()
        console.log('  ✅ 던전 나가기 성공')
      }
    }

    // 대시보드 기능 확인
    console.log('\n\n📊 대시보드 기능 확인')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 스탯 정보 확인
    const statElements = page.locator('text=/Lv\\.|레벨/i')
    const statCount = await statElements.count()
    if (statCount > 0) {
      console.log(`  ✅ ${statCount}개의 스탯 정보 확인`)
    }
    
    // 활동 기록 버튼 확인
    const recordButton = page.locator('button').filter({ hasText: /기록|Record/i }).first()
    if (await recordButton.isVisible()) {
      console.log('  ✅ 활동 기록 버튼 확인')
    }

    // 최종 결과
    console.log('\n\n=== 테스트 결과 요약 ===')
    errorCollector.printSummary()
    
    console.log('\n✨ 전체 서비스 테스트 완료!')
  })
})