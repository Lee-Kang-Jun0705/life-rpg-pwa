import { test, expect } from '@playwright/test'

test.describe('RPG 시스템 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모험 페이지로 이동
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
  })

  test('모험 페이지 기본 UI 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1').filter({ hasText: '모험 & 성장' })).toBeVisible()
    
    // 캐릭터 정보 표시 확인
    const characterInfo = page.locator('div').filter({ hasText: /Lv\.\d+/ }).first()
    await expect(characterInfo).toBeVisible()
    
    // 탭 메뉴 확인
    const tabs = ['던전', '인벤토리', '스킬', '상점']
    for (const tab of tabs) {
      await expect(page.locator('button').filter({ hasText: tab })).toBeVisible()
    }
  })

  test('던전 탭 - 전투 시스템 확인', async ({ page }) => {
    // 던전 탭 클릭
    await page.locator('button').filter({ hasText: '던전' }).click()
    await page.waitForTimeout(1000)
    
    // 던전 목록이 표시되는지 확인
    const dungeonList = page.locator('text=/던전|Dungeon/i')
    
    // 던전 입장 버튼이 있는지 확인
    const enterButton = page.locator('button').filter({ hasText: /입장|도전|Enter/i })
    
    if (await enterButton.count() > 0) {
      // 첫 번째 던전 입장 시도
      await enterButton.first().click()
      await page.waitForTimeout(2000)
      
      // 전투 화면이 나타나는지 확인
      const battleScreen = page.locator('text=/전투|Battle|턴|Turn/i')
      const isInBattle = await battleScreen.count() > 0
      
      if (isInBattle) {
        console.log('전투 화면 진입 성공')
        
        // 자동전투 버튼 확인
        const autoBattleButton = page.locator('button').filter({ hasText: /자동전투|Auto/i })
        if (await autoBattleButton.count() > 0) {
          console.log('자동전투 버튼 발견')
          await autoBattleButton.click()
          await page.waitForTimeout(2000)
          
          // 자동전투가 활성화되었는지 확인
          const autoBattleStatus = await page.locator('text=/자동전투.*ON|Auto.*ON/i').count() > 0
          console.log('자동전투 상태:', autoBattleStatus ? '활성화됨' : '비활성화됨')
        } else {
          console.log('자동전투 버튼을 찾을 수 없음')
        }
        
        // 전투 액션 버튼들 확인
        const actionButtons = ['공격', '스킬', '아이템', '도망']
        for (const action of actionButtons) {
          const button = page.locator('button').filter({ hasText: action })
          console.log(`${action} 버튼 존재:`, await button.count() > 0)
        }
      } else {
        console.log('전투 화면으로 진입하지 못함')
      }
    } else {
      console.log('던전 입장 버튼을 찾을 수 없음')
    }
  })

  test('스킬 탭 - 스킬 장착 시스템 확인', async ({ page }) => {
    // 스킬 탭 클릭
    await page.locator('button').filter({ hasText: '스킬' }).click()
    await page.waitForTimeout(1000)
    
    // 스킬 목록이 표시되는지 확인
    const skillList = page.locator('text=/스킬|Skill/i')
    const hasSkills = await skillList.count() > 0
    console.log('스킬 목록 표시:', hasSkills)
    
    // 장착 버튼 확인
    const equipButton = page.locator('button').filter({ hasText: /장착|Equip|설정/i })
    if (await equipButton.count() > 0) {
      console.log('스킬 장착 버튼 발견')
      
      // 첫 번째 스킬 장착 시도
      await equipButton.first().click()
      await page.waitForTimeout(1000)
      
      // 장착 완료 메시지나 상태 변화 확인
      const equipped = await page.locator('text=/장착됨|Equipped|사용 중/i').count() > 0
      console.log('스킬 장착 상태:', equipped ? '장착됨' : '장착 안됨')
    } else {
      console.log('스킬 장착 버튼을 찾을 수 없음')
    }
    
    // 스킬 슬롯 확인
    const skillSlots = page.locator('[class*="slot"]').filter({ hasText: /슬롯|Slot/i })
    const slotCount = await skillSlots.count()
    console.log('스킬 슬롯 개수:', slotCount)
  })

  test('상점 탭 - 구매/판매 시스템 확인', async ({ page }) => {
    // 상점 탭 클릭
    await page.locator('button').filter({ hasText: '상점' }).click()
    await page.waitForTimeout(1000)
    
    // 상점 UI가 표시되는지 확인
    const shopUI = page.locator('text=/상점|Shop|구매|판매/i')
    const hasShop = await shopUI.count() > 0
    console.log('상점 UI 표시:', hasShop)
    
    // 아이템 목록 확인
    const items = page.locator('[class*="item"]').filter({ hasText: /골드|Gold|G/i })
    const itemCount = await items.count()
    console.log('표시된 아이템 개수:', itemCount)
    
    // 구매 버튼 확인
    const buyButton = page.locator('button').filter({ hasText: /구매|Buy/i })
    if (await buyButton.count() > 0) {
      console.log('구매 버튼 발견')
      
      // 플레이어 골드 확인
      const goldText = await page.locator('text=/💰|골드|Gold/i').first().textContent()
      console.log('플레이어 골드:', goldText)
    } else {
      console.log('구매 버튼을 찾을 수 없음')
    }
  })

  test('인벤토리 탭 - 아이템 관리 확인', async ({ page }) => {
    // 인벤토리 탭 클릭
    await page.locator('button').filter({ hasText: '인벤토리' }).click()
    await page.waitForTimeout(1000)
    
    // 인벤토리 UI 확인
    const inventoryUI = page.locator('text=/인벤토리|Inventory|장비|Equipment/i')
    const hasInventory = await inventoryUI.count() > 0
    console.log('인벤토리 UI 표시:', hasInventory)
    
    // 장비 슬롯 확인
    const equipmentSlots = ['무기', '방어구', '액세서리', 'Weapon', 'Armor', 'Accessory']
    for (const slot of equipmentSlots) {
      const slotElement = page.locator('text=/' + slot + '/i')
      if (await slotElement.count() > 0) {
        console.log(`${slot} 슬롯 발견`)
      }
    }
    
    // 아이템 장착/해제 버튼 확인
    const equipButtons = page.locator('button').filter({ hasText: /장착|해제|Equip|Unequip/i })
    const equipButtonCount = await equipButtons.count()
    console.log('장착/해제 버튼 개수:', equipButtonCount)
  })

  test('새로운 매니저 통합 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`)
      }
    })
    
    // 개발자 도구 열기
    await page.evaluate(() => {
      // BattleManager 확인
      if ((window as any).battleManager) {
        console.log('BattleManager가 전역에 존재함')
      } else {
        console.log('BattleManager가 전역에 없음')
      }
      
      // ShopManager 확인
      if ((window as any).shopManager) {
        console.log('ShopManager가 전역에 존재함')
      } else {
        console.log('ShopManager가 전역에 없음')
      }
      
      // SkillManager 확인
      if ((window as any).skillManager) {
        console.log('SkillManager가 전역에 존재함')
      } else {
        console.log('SkillManager가 전역에 없음')
      }
      
      // 실제 사용 중인 컴포넌트 확인
      const components = document.querySelectorAll('[class*="Manager"], [class*="manager"]')
      console.log('발견된 매니저 컴포넌트 수:', components.length)
    })
    
    await page.waitForTimeout(1000)
    
    // 로그 출력
    console.log('\n=== 콘솔 로그 ===')
    consoleLogs.forEach(log => console.log(log))
  })
})

test.describe('실제 구현 확인', () => {
  test('현재 사용 중인 컴포넌트 분석', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
    
    // 각 탭의 실제 컴포넌트 확인
    const tabs = [
      { name: '던전', selector: 'dungeon' },
      { name: '인벤토리', selector: 'inventory' },
      { name: '스킬', selector: 'skill' },
      { name: '상점', selector: 'shop' }
    ]
    
    for (const tab of tabs) {
      console.log(`\n=== ${tab.name} 탭 분석 ===`)
      
      await page.locator('button').filter({ hasText: tab.name }).click()
      await page.waitForTimeout(1000)
      
      // 컴포넌트 이름 추출
      const componentInfo = await page.evaluate((tabName) => {
        const elements = document.querySelectorAll('[data-component], [class*="Tab"], [class*="Manager"]')
        const components: string[] = []
        
        elements.forEach(el => {
          const dataComponent = el.getAttribute('data-component')
          const className = el.className
          
          if (dataComponent) {
            components.push(`data-component: ${dataComponent}`)
          }
          if (className && typeof className === 'string') {
            const matches = className.match(/\b\w*(Tab|Manager)\w*/g)
            if (matches) {
              matches.forEach(match => components.push(`class: ${match}`))
            }
          }
        })
        
        // React DevTools에서 컴포넌트 이름 추출 시도
        const reactComponents = Array.from(document.querySelectorAll('*')).filter(el => {
          const keys = Object.keys(el)
          return keys.some(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'))
        })
        
        return {
          components: [...new Set(components)],
          reactComponentCount: reactComponents.length,
          currentTab: tabName
        }
      }, tab.name)
      
      console.log('발견된 컴포넌트:', componentInfo.components)
      console.log('React 컴포넌트 수:', componentInfo.reactComponentCount)
      
      // 특정 텍스트나 기능 확인
      const features = {
        '자동전투': await page.locator('text=/자동전투|Auto/i').count(),
        '스킬 장착': await page.locator('text=/장착|Equip/i').count(),
        '구매/판매': await page.locator('text=/구매|판매|Buy|Sell/i').count(),
        'BattleManager': await page.locator('text=/BattleManager/').count(),
        'ShopManager': await page.locator('text=/ShopManager/').count(),
        'SkillManager': await page.locator('text=/SkillManager/').count()
      }
      
      console.log('기능 존재 여부:', features)
    }
  })
  
  test('네트워크 요청 분석', async ({ page }) => {
    const requests: string[] = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/api/') || url.includes('.json')) {
        requests.push(`${request.method()} ${url}`)
      }
    })
    
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
    
    // 각 탭 클릭하며 API 호출 확인
    const tabs = ['던전', '인벤토리', '스킬', '상점']
    
    for (const tab of tabs) {
      requests.length = 0 // 초기화
      await page.locator('button').filter({ hasText: tab }).click()
      await page.waitForTimeout(2000)
      
      console.log(`\n${tab} 탭 네트워크 요청:`)
      requests.forEach(req => console.log(req))
    }
  })
})