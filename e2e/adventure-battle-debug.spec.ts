import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('모험 페이지 전투 디버깅', () => {
  test('모험 페이지 전투 시스템 상세 테스트', async ({ page }) => {
    // 콘솔 메시지 수집
    const consoleMessages: { type: string; text: string; location?: string }[] = []
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url
      })
    })

    // 페이지 에러 수집
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    // 스크린샷 디렉토리
    const screenshotDir = path.join('test-results', 'adventure-debug')

    // 1. 홈페이지 로드
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // 2. 모험 페이지로 이동
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 초기 상태 스크린샷
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-adventure-initial.png'),
      fullPage: true 
    })

    // 3. 탐험 탭 확인 및 클릭
    const exploreTab = page.locator('text=탐험')
    if (await exploreTab.isVisible()) {
      console.log('탐험 탭 발견, 클릭합니다')
      await exploreTab.click()
      await page.waitForTimeout(1000)
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-explore-tab-clicked.png'),
        fullPage: true 
      })
    }

    // 4. 던전 목록 확인
    const dungeonButtons = page.locator('button').filter({ hasText: /초원|숲|광산|호수|둥지|늪지대|사막|화산/ })
    const dungeonCount = await dungeonButtons.count()
    console.log(`발견된 던전 수: ${dungeonCount}`)

    if (dungeonCount > 0) {
      // 첫 번째 던전 클릭
      const firstDungeon = dungeonButtons.first()
      const dungeonName = await firstDungeon.textContent()
      console.log(`선택한 던전: ${dungeonName}`)
      
      await firstDungeon.click()
      await page.waitForTimeout(1000)

      // 던전 선택 모달 스크린샷
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-dungeon-modal.png'),
        fullPage: true 
      })

      // 5. 입장 버튼 찾기
      const enterButton = page.locator('button').filter({ hasText: /입장|시작|도전/ })
      if (await enterButton.isVisible()) {
        console.log('입장 버튼 발견')
        await enterButton.click()
        await page.waitForTimeout(2000)

        // 전투 화면 스크린샷
        await page.screenshot({ 
          path: path.join(screenshotDir, '04-battle-screen.png'),
          fullPage: true 
        })

        // 6. 전투 화면 요소 확인
        const battleElements = {
          battleScreen: await page.locator('.fixed.inset-0.bg-gradient-to-b').isVisible(),
          enemyDisplay: await page.locator('text=/슬라임|고블린|버섯|스켈레톤/').isVisible(),
          playerHp: await page.locator('text=/HP/').isVisible(),
          battleLog: await page.locator('text=/전투 시작|공격/').isVisible()
        }

        console.log('전투 화면 요소 확인:', battleElements)

        // 7. 전투 진행 관찰 (10초)
        for (let i = 0; i < 5; i++) {
          await page.waitForTimeout(2000)
          await page.screenshot({ 
            path: path.join(screenshotDir, `05-battle-progress-${i}.png`),
            fullPage: true 
          })
        }

        // 8. 배속 버튼 확인
        const speedButton = page.locator('button').filter({ hasText: /x|배속/ })
        if (await speedButton.isVisible()) {
          console.log('배속 버튼 발견')
          await speedButton.click()
          await page.waitForTimeout(500)
          
          await page.screenshot({ 
            path: path.join(screenshotDir, '06-speed-changed.png'),
            fullPage: true 
          })
        }
      }
    }

    // 9. 개발자 도구에서 요소 확인
    const battleContainer = await page.locator('.fixed.inset-0').first()
    if (await battleContainer.isVisible()) {
      const battleHtml = await battleContainer.innerHTML()
      console.log('전투 컨테이너 HTML (처음 100자):', battleHtml.substring(0, 100))
    }

    // 10. 콘솔 메시지 출력
    console.log('\n=== 콘솔 메시지 ===')
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`)
    })

    // 11. 에러 확인
    console.log('\n=== 페이지 에러 ===')
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    } else {
      console.log('페이지 에러 없음')
    }

    // 최종 스크린샷
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-final-state.png'),
      fullPage: true 
    })

    // 어서션
    expect(pageErrors).toHaveLength(0)
  })
})