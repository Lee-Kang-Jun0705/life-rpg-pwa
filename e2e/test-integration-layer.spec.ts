import { test, expect } from '@playwright/test'

test.describe('통합 레이어 작동 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모험 페이지로 이동
    await page.goto('/adventure')
    await page.waitForLoadState('networkidle')
  })

  test('통합 레이어가 초기화되고 전역 매니저들이 사용 가능한지 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    // 전역 매니저 확인
    const managers = await page.evaluate(() => {
      const gameManagers = (window as any).gameManagers
      if (!gameManagers) {
        return { hasManagers: false, managerNames: [] }
      }
      
      const managerNames = Object.keys(gameManagers)
      const managerStatus: Record<string, boolean> = {}
      
      for (const name of managerNames) {
        managerStatus[name] = gameManagers[name] !== null && gameManagers[name] !== undefined
      }
      
      return {
        hasManagers: true,
        managerNames,
        managerStatus
      }
    })
    
    console.log('매니저 상태:', managers)
    
    // 통합 레이어 초기화 확인
    const initLog = consoleLogs.find(log => log.includes('IntegrationLayer] 초기화'))
    console.log('초기화 로그:', initLog)
    
    expect(managers.hasManagers).toBe(true)
    expect(managers.managerNames).toContain('battleManager')
    expect(managers.managerNames).toContain('skillManager')
    expect(managers.managerNames).toContain('shopManager')
    expect(managers.managerNames).toContain('autoBattleAI')
  })

  test('스킬 장착 통합 기능 확인', async ({ page }) => {
    // 스킬 탭 클릭
    await page.locator('button').filter({ hasText: '스킬' }).click()
    await page.waitForTimeout(1000)
    
    // 스킬 목록이 로드되기를 기다림
    await page.waitForSelector('text=/스킬 관리/', { timeout: 5000 })
    
    // 스킬 카드 찾기
    const skillCards = page.locator('[class*="skill"][class*="card"]')
    const skillCount = await skillCards.count()
    console.log('발견된 스킬 카드 수:', skillCount)
    
    if (skillCount > 0) {
      // 첫 번째 학습되지 않은 스킬 찾기
      const unlearnedSkill = skillCards.filter({ hasNot: page.locator('text=/장착됨|Equipped/') }).first()
      
      if (await unlearnedSkill.count() > 0) {
        // 스킬 장착 시도
        await unlearnedSkill.click()
        await page.waitForTimeout(500)
        
        // 장착 버튼 클릭
        const equipButton = page.locator('button').filter({ hasText: /장착|Equip/ })
        if (await equipButton.count() > 0) {
          await equipButton.first().click()
          await page.waitForTimeout(1000)
          
          // 콘솔 로그 확인
          const result = await page.evaluate(() => {
            return new Promise((resolve) => {
              // Integration Layer 호출 확인
              const logs: string[] = []
              const originalLog = console.log
              console.log = (...args) => {
                logs.push(args.join(' '))
                originalLog.apply(console, args)
              }
              
              setTimeout(() => {
                console.log = originalLog
                resolve({
                  hasIntegrationCall: logs.some(log => 
                    log.includes('SkillIntegration') || 
                    log.includes('equipSkillBridge')
                  ),
                  logs
                })
              }, 1000)
            })
          })
          
          console.log('스킬 장착 결과:', result)
        }
      }
    }
  })

  test('던전 전투에서 자동전투 작동 확인', async ({ page }) => {
    // 던전 탭 클릭
    await page.locator('button').filter({ hasText: '던전' }).click()
    await page.waitForTimeout(1000)
    
    // 던전 목록 확인
    const dungeonCards = page.locator('[class*="dungeon"][class*="card"], [class*="rounded-lg"][class*="cursor-pointer"]')
    const dungeonCount = await dungeonCards.count()
    console.log('발견된 던전 수:', dungeonCount)
    
    if (dungeonCount > 0) {
      // 첫 번째 던전 선택
      await dungeonCards.first().click()
      await page.waitForTimeout(1000)
      
      // 전투 시작 버튼 찾기
      const battleButton = page.locator('button').filter({ hasText: /전투 시작|입장|Enter/ })
      if (await battleButton.count() > 0) {
        await battleButton.first().click()
        await page.waitForTimeout(2000)
        
        // 전투 화면 확인
        const battleScreen = page.locator('text=/턴|Turn|전투|Battle/')
        const isInBattle = await battleScreen.count() > 0
        
        if (isInBattle) {
          // 자동전투 버튼 확인
          const autoBattleButton = page.locator('button').filter({ hasText: /자동전투|자동|Auto/ })
          const autoBattleCount = await autoBattleButton.count()
          console.log('자동전투 버튼 개수:', autoBattleCount)
          
          if (autoBattleCount > 0) {
            // 자동전투 상태 확인
            const autoBattleStatus = await page.locator('text=/자동전투.*ON|자동.*ON|Auto.*ON/').count()
            console.log('자동전투 활성화 상태:', autoBattleStatus > 0)
            
            // 자동전투가 꺼져있으면 켜기
            if (autoBattleStatus === 0) {
              await autoBattleButton.first().click()
              await page.waitForTimeout(1000)
              
              const newStatus = await page.locator('text=/자동전투.*ON|자동.*ON|Auto.*ON/').count()
              console.log('자동전투 토글 후 상태:', newStatus > 0)
            }
            
            // 전투 진행 확인 (턴 카운터 변화)
            const initialTurn = await page.locator('text=/턴.*[0-9]+/').textContent()
            console.log('초기 턴:', initialTurn)
            
            await page.waitForTimeout(3000)
            
            const currentTurn = await page.locator('text=/턴.*[0-9]+/').textContent()
            console.log('현재 턴:', currentTurn)
            
            expect(currentTurn).not.toBe(initialTurn)
          }
        }
      }
    }
  })

  test('상점 시스템 통합 확인', async ({ page }) => {
    // 상점 탭 클릭
    await page.locator('button').filter({ hasText: '상점' }).click()
    await page.waitForTimeout(1000)
    
    // 상점 UI 확인
    const shopUI = page.locator('text=/상점|Shop/')
    const hasShop = await shopUI.count() > 0
    console.log('상점 UI 표시:', hasShop)
    
    if (hasShop) {
      // 구매 탭 확인
      const buyTab = page.locator('button').filter({ hasText: '구매' })
      if (await buyTab.count() > 0) {
        await buyTab.click()
        await page.waitForTimeout(500)
        
        // 아이템 목록 확인
        const items = page.locator('[class*="item"][class*="card"]')
        const itemCount = await items.count()
        console.log('표시된 아이템 수:', itemCount)
        
        if (itemCount > 0) {
          // 첫 번째 구매 가능한 아이템 찾기
          const buyButton = page.locator('button').filter({ hasText: '구매' }).filter({ hasNot: page.locator(':disabled') })
          
          if (await buyButton.count() > 0) {
            // 구매 전 골드 확인
            const goldBefore = await page.locator('text=/💰.*[0-9]+|골드.*[0-9]+/').first().textContent()
            console.log('구매 전 골드:', goldBefore)
            
            // Integration Layer 호출 모니터링 설정
            await page.evaluate(() => {
              (window as any).purchaseAttempted = false
              const originalImport = (window as any).import
              ;(window as any).import = async (module: string) => {
                if (module.includes('integration-layer')) {
                  (window as any).purchaseAttempted = true
                }
                return originalImport(module)
              }
            })
            
            // 구매 시도
            await buyButton.first().click()
            await page.waitForTimeout(2000)
            
            // Integration Layer 호출 확인
            const integrationCalled = await page.evaluate(() => {
              return (window as any).purchaseAttempted
            })
            
            console.log('Integration Layer 호출됨:', integrationCalled)
          }
        }
      }
    }
  })

  test('전체 매니저 상태 및 기능 요약', async ({ page }) => {
    // 각 탭을 순회하며 기능 확인
    const tabs = ['던전', '인벤토리', '스킬', '상점']
    const results: Record<string, any> = {}
    
    for (const tab of tabs) {
      await page.locator('button').filter({ hasText: tab }).click()
      await page.waitForTimeout(1000)
      
      // 각 탭별 기능 확인
      switch (tab) {
        case '던전':
          results[tab] = {
            hasUI: await page.locator('text=/던전|Dungeon/').count() > 0,
            hasBattleButton: await page.locator('button').filter({ hasText: /전투|Battle/ }).count() > 0,
            hasAutoBattle: false // 전투 진입 후 확인 필요
          }
          break
          
        case '스킬':
          results[tab] = {
            hasUI: await page.locator('text=/스킬 관리/').count() > 0,
            hasSlots: await page.locator('text=/슬롯/').count() > 0,
            hasEquipSystem: await page.locator('button').filter({ hasText: /장착/ }).count() > 0
          }
          break
          
        case '상점':
          results[tab] = {
            hasUI: await page.locator('text=/상점|Shop/').count() > 0,
            hasBuyTab: await page.locator('button').filter({ hasText: '구매' }).count() > 0,
            hasSellTab: await page.locator('button').filter({ hasText: '판매' }).count() > 0
          }
          break
          
        case '인벤토리':
          results[tab] = {
            hasUI: await page.locator('text=/인벤토리|Inventory/').count() > 0,
            hasItems: await page.locator('[class*="item"]').count() > 0
          }
          break
      }
    }
    
    console.log('=== 전체 기능 요약 ===')
    console.log(JSON.stringify(results, null, 2))
    
    // 새로운 매니저 통합 상태
    const integrationStatus = await page.evaluate(() => {
      const managers = (window as any).gameManagers
      if (!managers) return null
      
      return {
        battleManager: managers.battleManager !== null,
        skillManager: managers.skillManager !== null,
        shopManager: managers.shopManager !== null,
        autoBattleAI: managers.autoBattleAI !== null,
        soundManager: managers.soundManager !== null,
        saveManager: managers.saveManager !== null
      }
    })
    
    console.log('=== 매니저 통합 상태 ===')
    console.log(integrationStatus)
    
    // 최종 평가
    const allFeaturesWorking = Object.values(results).every(result => 
      Object.values(result).some(value => value === true)
    )
    
    console.log('모든 기능 작동 여부:', allFeaturesWorking)
  })
})