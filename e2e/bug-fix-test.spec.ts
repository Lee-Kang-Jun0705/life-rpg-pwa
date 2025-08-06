import { test, expect } from '@playwright/test'

test.describe('RPG 시스템 버그 수정 테스트', () => {
  test('1. 아이템 장착 버그 확인', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 먼저 상점에서 장비 구매
    await page.click('button:has-text("상점")')
    await page.waitForTimeout(1000)
    
    // 장비 탭 클릭
    await page.click('button:has-text("장비")')
    await page.waitForTimeout(1000)
    
    // 첫 번째 장비 구매
    const firstEquipment = page.locator('.bg-gray-800').filter({ hasText: '기본' }).first()
    const equipmentName = await firstEquipment.locator('h3').textContent()
    console.log('구매할 장비:', equipmentName)
    
    // 구매 전 골드 확인
    const goldBefore = await page.locator('text=골드').locator('..').textContent()
    console.log('구매 전 골드:', goldBefore)
    
    // 구매 버튼 클릭
    await firstEquipment.locator('button:has-text("구매")').click()
    await page.waitForTimeout(1000)
    
    // 인벤토리로 이동
    await page.click('button:has-text("인벤토리")')
    await page.waitForTimeout(1000)
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-1-inventory-after-purchase.png',
      fullPage: true 
    })
    
    // 인벤토리 아이템 확인
    const inventoryItems = await page.locator('[class*="aspect-square"]').filter({ has: page.locator('span') }).count()
    console.log('인벤토리 아이템 수:', inventoryItems)
    
    if (inventoryItems > 0) {
      // 첫 번째 아이템 클릭
      await page.locator('[class*="aspect-square"]').filter({ has: page.locator('span') }).first().click()
      await page.waitForTimeout(500)
      
      // 장착 버튼 확인
      const equipButton = page.locator('button:has-text("장착")')
      const equipButtonExists = await equipButton.count() > 0
      console.log('장착 버튼 존재:', equipButtonExists)
      
      if (equipButtonExists) {
        await equipButton.click()
        await page.waitForTimeout(1000)
        
        // 장착 후 확인
        const equippedItems = await page.locator('[class*="w-16 h-16"]').filter({ has: page.locator('span') }).count()
        console.log('장착된 아이템 수:', equippedItems)
        
        // 총 스탯 변화 확인
        const totalStats = await page.locator('text=총 스탯').locator('..').textContent()
        console.log('장착 후 총 스탯:', totalStats)
      }
    }
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-1-after-equip.png',
      fullPage: true 
    })
    
    console.log('=== 콘솔 에러 ===')
    errors.forEach(e => console.log(e))
  })

  test('2. 상점 스킬 판매창 에러 확인', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 상점으로 이동
    await page.click('button:has-text("상점")')
    await page.waitForTimeout(1000)
    
    // 스킬 탭 클릭
    console.log('스킬 탭 클릭 시도...')
    await page.click('button:has-text("스킬")')
    await page.waitForTimeout(1000)
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-2-shop-skills-error.png',
      fullPage: true 
    })
    
    // 화면 내용 확인
    const pageContent = await page.locator('body').textContent()
    if (pageContent?.includes('Error') || pageContent?.includes('error')) {
      console.log('에러 메시지 발견!')
    }
    
    console.log('=== 스킬 탭 콘솔 에러 ===')
    errors.forEach(e => console.log(e))
  })

  test('3. 전투 시스템 문제 확인', async ({ page }) => {
    const battleLogs: string[] = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('Battle') || text.includes('전투') || text.includes('공격')) {
        battleLogs.push(text)
      }
    })

    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 플레이어 레벨 확인
    const playerLevel = await page.locator('text=Lv.').first().textContent()
    console.log('플레이어 레벨:', playerLevel)
    
    // 탐험 탭으로 이동
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(1000)
    
    // 고블린 동굴 선택
    await page.locator('h3:has-text("고블린 동굴")').locator('../..').click()
    await page.waitForTimeout(1000)
    
    // 던전 시작
    await page.click('button:has-text("던전 시작")')
    await page.waitForTimeout(3000)
    
    // 전투 화면 캡처
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-3-battle-start.png',
      fullPage: true 
    })
    
    // 전투 정보 수집
    const playerHP = await page.locator('text=플레이어').locator('../..').locator('text=HP').locator('..').textContent()
    const enemyInfo = await page.locator('h3').filter({ hasText: '슬라임' }).first().locator('..').textContent()
    
    console.log('플레이어 HP:', playerHP)
    console.log('적 정보:', enemyInfo)
    
    // 10초 동안 전투 관찰
    console.log('\n=== 전투 로그 (10초) ===')
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000)
      
      // 전투 로그 읽기
      const battleLogElement = page.locator('.bg-black\\/70')
      if (await battleLogElement.count() > 0) {
        const log = await battleLogElement.textContent()
        if (log && log !== battleLogs[battleLogs.length - 1]) {
          battleLogs.push(log)
          console.log(`${i+1}초:`, log)
        }
      }
      
      // 플레이어 공격 확인
      const playerAttacks = battleLogs.filter(log => log.includes('플레이어'))
      if (i === 5) {
        console.log(`\n5초 경과 - 플레이어 공격 횟수: ${playerAttacks.length}`)
      }
    }
    
    // 전투 속도 분석
    const totalActions = battleLogs.length
    console.log(`\n전투 속도: 10초 동안 ${totalActions}번의 행동`)
    console.log('평균 행동 간격:', totalActions > 0 ? (10000 / totalActions).toFixed(0) + 'ms' : 'N/A')
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-3-battle-progress.png',
      fullPage: true 
    })
    
    // 전투 결과 확인
    const victory = await page.locator('text=승리').count()
    const defeat = await page.locator('text=패배').count()
    
    if (victory > 0) {
      console.log('\n전투 결과: 승리')
    } else if (defeat > 0) {
      console.log('\n전투 결과: 패배')
    } else {
      console.log('\n전투 진행 중...')
    }
  })

  test('4. 전체 시스템 종합 점검', async ({ page }) => {
    const allErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(`[${new Date().toLocaleTimeString()}] ${msg.text()}`)
      }
    })
    
    page.on('pageerror', err => {
      allErrors.push(`[PAGE ERROR] ${err.message}`)
    })

    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 모든 탭 순회하며 에러 체크
    const tabs = ['탐험', '인벤토리', '상점', '스킬', '퀘스트']
    
    for (const tab of tabs) {
      console.log(`\n=== ${tab} 탭 체크 ===`)
      await page.click(`button:has-text("${tab}")`)
      await page.waitForTimeout(1000)
      
      // 상점의 경우 하위 탭도 체크
      if (tab === '상점') {
        const shopTabs = ['아이템', '장비', '스킬']
        for (const shopTab of shopTabs) {
          console.log(`  - ${shopTab} 탭 체크`)
          await page.click(`button:has-text("${shopTab}")`)
          await page.waitForTimeout(500)
        }
      }
    }
    
    console.log('\n=== 전체 콘솔 에러 리포트 ===')
    if (allErrors.length === 0) {
      console.log('에러 없음 ✓')
    } else {
      allErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/bug-4-final-check.png',
      fullPage: true 
    })
  })
})