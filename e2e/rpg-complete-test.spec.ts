import { test, expect } from '@playwright/test'

test.describe('Complete RPG System Test', () => {
  test('1. 포켓몬 스타일 자동전투 시스템', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 탐험 탭 선택
    await page.click('button:has-text("탐험")')
    await page.waitForTimeout(1000)
    
    // 현재 화면 확인
    const pageContent = await page.textContent('body')
    console.log('=== 탐험 탭 내용 ===')
    
    // 던전 목록 확인
    const dungeonElements = await page.locator('h3:has-text("동굴"), h3:has-text("숲"), h3:has-text("성")').all()
    console.log(`발견된 던전 수: ${dungeonElements.length}`)
    
    for (const el of dungeonElements) {
      const text = await el.textContent()
      console.log(`- ${text}`)
    }
    
    // 고블린 동굴 찾기
    const goblinCave = page.locator('h3:has-text("고블린 동굴")').locator('..')
    if (await goblinCave.count() > 0) {
      console.log('고블린 동굴을 찾았습니다!')
      
      // 부모 버튼 클릭
      const dungeonButton = goblinCave.locator('..').first()
      await dungeonButton.click()
      await page.waitForTimeout(2000)
      
      // 던전 시작 버튼 확인
      const startButton = page.locator('button:has-text("던전 시작"), button:has-text("다음 층")')
      if (await startButton.count() > 0) {
        console.log('던전 시작 버튼 발견!')
        await startButton.first().click()
        
        // 전투 시작 대기
        await page.waitForTimeout(5000)
        
        // 전투 화면 요소 확인
        const battleElements = {
          player: await page.locator('text=플레이어').count(),
          enemy: await page.locator('text=Lv.').count(),
          hp: await page.locator('text=HP').count(),
          mp: await page.locator('text=MP').count(),
          battleText: await page.locator('text=BATTLE').count(),
          vs: await page.locator('text=VS').count()
        }
        
        console.log('=== 전투 화면 요소 ===')
        console.log(JSON.stringify(battleElements, null, 2))
        
        // 전투 로그 확인
        await page.waitForTimeout(3000)
        const battleLog = await page.locator('.backdrop-blur, [class*="bg-black"]').allTextContents()
        console.log('전투 로그:', battleLog.filter(log => log.trim()))
        
        await page.screenshot({ 
          path: 'C:/Users/USER/Pictures/Screenshots/battle-pokemon-style.png',
          fullPage: true 
        })
      }
    } else {
      console.log('고블린 동굴을 찾을 수 없습니다.')
      
      // 디버깅을 위한 전체 HTML 출력
      const dungeonSection = await page.locator('[role="tabpanel"]').innerHTML()
      console.log('던전 탭 HTML 길이:', dungeonSection.length)
      
      await page.screenshot({ 
        path: 'C:/Users/USER/Pictures/Screenshots/dungeon-tab-debug.png',
        fullPage: true 
      })
    }
  })
  
  test('2. 아이템 장착/해제 및 판매 시스템', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 상점에서 아이템 구매
    await page.click('button:has-text("상점")')
    await page.waitForTimeout(1000)
    
    const buyButton = page.locator('button:has-text("구매")').first()
    if (await buyButton.count() > 0) {
      const initialGold = await page.locator('text=골드').locator('..').textContent()
      console.log('초기 골드:', initialGold)
      
      await buyButton.click()
      await page.waitForTimeout(1000)
    }
    
    // 인벤토리로 이동
    await page.click('button:has-text("인벤토리")')
    await page.waitForTimeout(1000)
    
    // 인벤토리 아이템 확인
    const inventorySlots = await page.locator('[class*="aspect-square"]').count()
    console.log(`인벤토리 슬롯 수: ${inventorySlots}`)
    
    // 첫 번째 아이템 클릭
    const firstItem = page.locator('[class*="aspect-square"]').first()
    if (await firstItem.count() > 0) {
      await firstItem.click()
      await page.waitForTimeout(500)
      
      // 장착 버튼 확인
      const equipButton = page.locator('button:has-text("장착")')
      if (await equipButton.count() > 0) {
        await equipButton.click()
        console.log('아이템 장착 완료')
        await page.waitForTimeout(1000)
      }
      
      // 판매 버튼 확인
      const sellButton = page.locator('button:has-text("판매")')
      if (await sellButton.count() > 0) {
        // 판매 테스트는 다이얼로그 처리 필요
        page.on('dialog', dialog => dialog.accept())
        await sellButton.click()
        console.log('아이템 판매 시도')
        await page.waitForTimeout(1000)
      }
    }
    
    // 총 스탯 확인
    const totalStats = await page.locator('text=총 스탯').locator('..').textContent()
    console.log('총 스탯:', totalStats)
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/inventory-equipment.png',
      fullPage: true 
    })
  })
  
  test('3. 스킬 시스템 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    await page.click('button:has-text("스킬")')
    await page.waitForTimeout(1000)
    
    // 스킬 카드 확인
    const skillCards = await page.locator('h3').all()
    console.log('=== 발견된 스킬 ===')
    for (const card of skillCards) {
      const skillName = await card.textContent()
      console.log(`- ${skillName}`)
    }
    
    // 스킬 레벨업 버튼 확인
    const upgradeButtons = await page.locator('button:has-text("레벨업")').count()
    console.log(`레벨업 가능한 스킬: ${upgradeButtons}개`)
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/skills-system.png',
      fullPage: true 
    })
  })
  
  test('4. 퀘스트 시스템 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    await page.click('button:has-text("퀘스트")')
    await page.waitForTimeout(1000)
    
    // 퀘스트 확인
    const questTitles = await page.locator('h3').all()
    console.log('=== 활성 퀘스트 ===')
    for (const title of questTitles) {
      const questName = await title.textContent()
      console.log(`- ${questName}`)
    }
    
    // 메인 버튼 확인
    const mainButtons = await page.locator('button:has-text("메인")').count()
    console.log(`메인 퀘스트 버튼: ${mainButtons}개`)
    
    await page.screenshot({ 
      path: 'C:/Users/USER/Pictures/Screenshots/quest-system.png',
      fullPage: true 
    })
  })
  
  test('5. 콘솔 에러 체크', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('http://localhost:3000/adventure')
    await page.waitForLoadState('networkidle')
    
    // 모든 탭 순회
    const tabs = ['탐험', '인벤토리', '상점', '스킬', '퀘스트']
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`)
      await page.waitForTimeout(500)
    }
    
    console.log('=== 콘솔 에러 ===')
    if (errors.length === 0) {
      console.log('에러 없음 ✓')
    } else {
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`)
      })
    }
  })
})