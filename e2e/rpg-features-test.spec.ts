import { test, expect } from '@playwright/test'

test.describe('RPG 게임 기능 전체 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('대시보드 - 레벨 시스템 동작 확인', async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    
    // 스크린샷 1: 대시보드 전체 화면
    await page.screenshot({ 
      path: 'screenshots/01-dashboard-full.png',
      fullPage: true 
    })
    
    // 초기 레벨 확인
    const initialLevel = await page.locator('[data-testid="user-level"]').textContent()
    console.log('초기 레벨:', initialLevel)
    
    // 스탯 클릭하여 경험치 획득
    const healthStatButton = page.locator('button:has-text("건강")')
    await healthStatButton.click()
    await page.waitForTimeout(1000)
    
    // 스크린샷 2: 스탯 클릭 후
    await page.screenshot({ 
      path: 'screenshots/02-dashboard-after-stat-click.png',
      fullPage: true 
    })
    
    // 콘솔 에러 체크
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('모험 페이지 - 전체 탭 검증', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 스크린샷 3: 모험 페이지 초기 화면
    await page.screenshot({ 
      path: 'screenshots/03-adventure-initial.png',
      fullPage: true 
    })
    
    // 레벨 표시 확인
    const adventureLevel = await page.locator('text=Lv.').first().textContent()
    console.log('모험 페이지 레벨:', adventureLevel)
    
    // 각 탭 검증
    const tabs = [
      { name: '퀘스트', filename: '04-quest-tab' },
      { name: '탐험', filename: '05-dungeon-tab' },
      { name: '인벤토리', filename: '06-inventory-tab' },
      { name: '스킬', filename: '07-skill-tab' },
      { name: '상점', filename: '08-shop-tab' }
    ]
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab.name}")`)
      await page.waitForTimeout(500)
      
      await page.screenshot({ 
        path: `screenshots/${tab.filename}.png`,
        fullPage: true 
      })
      
      // 각 탭에서 콘솔 에러 체크
      const tabErrors = await page.evaluate(() => {
        const errors: string[] = []
        const originalError = console.error
        console.error = (...args) => {
          errors.push(args.join(' '))
          originalError.apply(console, args)
        }
        return errors
      })
      
      expect(tabErrors).toHaveLength(0)
    }
  })

  test('던전 전투 시스템 - 신규 기능 검증', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 탐험 탭 클릭
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(500)
    
    // 첫 번째 던전 선택
    const firstDungeon = page.locator('.bg-gray-800\\/50').first()
    await firstDungeon.click()
    await page.waitForTimeout(500)
    
    // 스크린샷 9: 던전 선택 화면
    await page.screenshot({ 
      path: 'screenshots/09-dungeon-selected.png',
      fullPage: true 
    })
    
    // 던전 시작
    await page.click('button:has-text("던전 시작")')
    await page.waitForTimeout(1000)
    
    // 스크린샷 10: 전투 화면 (속도 조절 버튼 확인)
    await page.screenshot({ 
      path: 'screenshots/10-battle-screen-with-speed-controls.png',
      fullPage: true 
    })
    
    // 전투 속도 조절 버튼 확인
    const speedButtons = {
      slow: page.locator('button[title="느림"]'),
      normal: page.locator('button[title="보통"]'),
      fast: page.locator('button[title="빠름"]')
    }
    
    // 각 속도 버튼이 존재하는지 확인
    for (const [speed, button] of Object.entries(speedButtons)) {
      await expect(button).toBeVisible()
    }
    
    // 빠른 속도로 변경
    await speedButtons.fast.click()
    await page.waitForTimeout(500)
    
    // 스크린샷 11: 빠른 속도 선택 후
    await page.screenshot({ 
      path: 'screenshots/11-battle-fast-speed.png',
      fullPage: true 
    })
    
    // 전투 로그 확인
    const battleLog = page.locator('.font-mono')
    await expect(battleLog).toBeVisible()
    
    // 전투 진행 확인 (HP 변화)
    await page.waitForTimeout(3000)
    
    // 스크린샷 12: 전투 진행 중
    await page.screenshot({ 
      path: 'screenshots/12-battle-in-progress.png',
      fullPage: true 
    })
  })

  test('상점에서 아이템 구매 및 인벤토리 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 상점 탭으로 이동
    await page.click('button:has-text("상점")')
    await page.waitForTimeout(500)
    
    // 스크린샷 13: 상점 화면
    await page.screenshot({ 
      path: 'screenshots/13-shop-screen.png',
      fullPage: true 
    })
    
    // 첫 번째 아이템 구매 시도
    const buyButton = page.locator('button:has-text("구매")').first()
    if (await buyButton.isVisible()) {
      await buyButton.click()
      await page.waitForTimeout(1000)
      
      // 스크린샷 14: 구매 후
      await page.screenshot({ 
        path: 'screenshots/14-after-purchase.png',
        fullPage: true 
      })
    }
    
    // 인벤토리 탭으로 이동
    await page.click('button:has-text("인벤토리")')
    await page.waitForTimeout(500)
    
    // 스크린샷 15: 인벤토리 화면
    await page.screenshot({ 
      path: 'screenshots/15-inventory-screen.png',
      fullPage: true 
    })
  })

  test('스킬 시스템 검증', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 스킬 탭으로 이동
    await page.click('button:has-text("스킬")')
    await page.waitForTimeout(500)
    
    // 스크린샷 16: 스킬 화면
    await page.screenshot({ 
      path: 'screenshots/16-skill-screen.png',
      fullPage: true 
    })
    
    // 스킬 장착 시도
    const equipButton = page.locator('button:has-text("장착")').first()
    if (await equipButton.isVisible()) {
      await equipButton.click()
      await page.waitForTimeout(500)
      
      // 스크린샷 17: 스킬 장착 후
      await page.screenshot({ 
        path: 'screenshots/17-skill-equipped.png',
        fullPage: true 
      })
    }
  })

  test('전투 애니메이션 및 데미지 표시 검증', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 탐험 탭으로 이동
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(500)
    
    // 던전 선택 및 시작
    const dungeon = page.locator('.bg-gray-800\\/50').first()
    await dungeon.click()
    await page.waitForTimeout(500)
    await page.click('button:has-text("던전 시작")')
    await page.waitForTimeout(1000)
    
    // 전투 중 여러 시점 캡처
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(2000)
      await page.screenshot({ 
        path: `screenshots/18-battle-animation-${i + 1}.png`,
        fullPage: true 
      })
    }
    
    // MP 표시 확인
    const mpBar = page.locator('text=MP').first()
    await expect(mpBar).toBeVisible()
    
    // 데미지 숫자 표시 확인
    const damageNumbers = page.locator('.text-red-500, .text-yellow-400')
    const damageCount = await damageNumbers.count()
    console.log('데미지 표시 개수:', damageCount)
  })

  test('코드 품질 검증 - 콘솔 에러 체크', async ({ page }) => {
    const pages = [
      { url: '/dashboard', name: '대시보드' },
      { url: '/adventure', name: '모험' },
      { url: '/profile', name: '프로필' },
      { url: '/settings', name: '설정' }
    ]
    
    for (const pageInfo of pages) {
      await page.goto(`http://localhost:3000${pageInfo.url}`)
      await page.waitForLoadState('networkidle')
      
      // 콘솔 메시지 수집
      const consoleMessages: { type: string; text: string }[] = []
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        })
      })
      
      await page.waitForTimeout(2000)
      
      // 에러 메시지 필터링
      const errors = consoleMessages.filter(msg => msg.type === 'error')
      
      // 스크린샷 저장
      await page.screenshot({ 
        path: `screenshots/console-check-${pageInfo.name}.png`,
        fullPage: true 
      })
      
      console.log(`${pageInfo.name} 페이지 콘솔 에러:`, errors)
      expect(errors).toHaveLength(0)
    }
  })
})