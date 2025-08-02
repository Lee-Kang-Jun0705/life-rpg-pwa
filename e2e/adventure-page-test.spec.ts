import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('모험 페이지 분석', () => {
  test('퀘스트 및 탐험 탭 기능 확인', async ({ page }) => {
    // 콘솔 메시지 수집
    const consoleMessages: { type: string; text: string }[] = []
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    // 페이지 에러 수집
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    // 스크린샷 디렉토리
    const screenshotDir = path.join('test-results', 'adventure-analysis')

    // 1. 모험 페이지로 이동
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 초기 화면 스크린샷
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-adventure-page.png'),
      fullPage: true 
    })

    // 2. 퀘스트 탭 확인 (기본 탭)
    console.log('=== 퀘스트 탭 분석 ===')
    
    // 퀘스트 요약 정보 확인
    const questSummary = await page.locator('.bg-gradient-to-br.from-purple-900\\/30').isVisible()
    console.log('퀘스트 요약 표시:', questSummary)
    
    // 진행 중인 퀘스트 수
    const activeQuestCount = await page.locator('text=진행 중인 퀘스트').locator('..').locator('p.text-lg').textContent()
    console.log('진행 중인 퀘스트:', activeQuestCount)
    
    // 퀘스트 통계
    const mainCompleted = await page.locator('.bg-gray-800\\/50').nth(0).locator('p.text-sm').textContent()
    const dailyCompleted = await page.locator('.bg-gray-800\\/50').nth(1).locator('p.text-sm').textContent()
    console.log('메인 완료:', mainCompleted, '일일 완료:', dailyCompleted)

    // 섹션 버튼들 확인
    const sections = ['진행 중', '메인', '일일', '사이드', '이벤트']
    for (const section of sections) {
      const button = page.locator(`button:has-text("${section}")`)
      const isVisible = await button.isVisible()
      console.log(`${section} 섹션 버튼:`, isVisible)
      
      if (isVisible) {
        await button.click()
        await page.waitForTimeout(500)
        
        // 각 섹션의 퀘스트 목록 확인
        const questItems = await page.locator('.space-y-2').locator('> div').count()
        console.log(`${section} 퀘스트 수:`, questItems)
        
        await page.screenshot({ 
          path: path.join(screenshotDir, `02-quest-${section}.png`),
          fullPage: true 
        })
      }
    }

    // 3. 메인 퀘스트 상세 확인
    await page.locator('button:has-text("메인")').click()
    await page.waitForTimeout(500)
    
    const mainQuestItem = page.locator('text=모험의 시작').first()
    if (await mainQuestItem.isVisible()) {
      console.log('메인 퀘스트 "모험의 시작" 발견')
      
      // 퀘스트 수락 버튼 확인
      const acceptButton = page.locator('button:has-text("수락")')
      if (await acceptButton.isVisible()) {
        console.log('수락 버튼 발견')
        await acceptButton.click()
        await page.waitForTimeout(1000)
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '03-quest-accepted.png'),
          fullPage: true 
        })
      }
    }

    // 4. 탐험 탭으로 이동
    console.log('\n=== 탐험 탭 분석 ===')
    await page.locator('button:has-text("탐험")').click()
    await page.waitForTimeout(1000)
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-exploration-tab.png'),
      fullPage: true 
    })

    // 던전 목록 확인
    const dungeons = await page.locator('.grid.grid-cols-2').locator('button').all()
    console.log('던전 수:', dungeons.length)
    
    for (let i = 0; i < Math.min(3, dungeons.length); i++) {
      const dungeon = dungeons[i]
      const dungeonName = await dungeon.locator('h3').textContent()
      const difficulty = await dungeon.locator('text=/초급|중급|상급|악몽/').textContent()
      console.log(`던전 ${i+1}: ${dungeonName} (${difficulty})`)
    }

    // 5. 던전 선택 및 전투 시작
    if (dungeons.length > 0) {
      await dungeons[0].click()
      await page.waitForTimeout(1000)
      
      // 던전 정보 모달 확인
      const modal = page.locator('.fixed.inset-0.z-50')
      if (await modal.isVisible()) {
        console.log('던전 정보 모달 표시됨')
        
        const enterButton = page.locator('button:has-text("입장")')
        if (await enterButton.isVisible()) {
          console.log('입장 버튼 발견')
          
          await page.screenshot({ 
            path: path.join(screenshotDir, '05-dungeon-modal.png'),
            fullPage: true 
          })
        }
      }
    }

    // 6. 콘솔 및 에러 분석
    console.log('\n=== 콘솔 메시지 ===')
    consoleMessages.forEach((msg, index) => {
      if (msg.type === 'error' || msg.type === 'warning') {
        console.log(`${index + 1}. [${msg.type}] ${msg.text}`)
      }
    })

    console.log('\n=== 페이지 에러 ===')
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    } else {
      console.log('페이지 에러 없음')
    }

    // 7. 데이터 연결 상태 확인
    console.log('\n=== 데이터 연결 상태 ===')
    
    // localStorage 확인
    const questProgress = await page.evaluate(() => localStorage.getItem('questProgress'))
    const activeQuests = await page.evaluate(() => localStorage.getItem('activeQuests'))
    
    console.log('questProgress 저장됨:', !!questProgress)
    console.log('activeQuests 저장됨:', !!activeQuests)
    
    if (questProgress) {
      const progress = JSON.parse(questProgress)
      console.log('저장된 퀘스트 진행도:', Object.keys(progress).length, '개')
    }

    // 최종 스크린샷
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-final-state.png'),
      fullPage: true 
    })

    // 어서션
    expect(pageErrors).toHaveLength(0)
  })
})