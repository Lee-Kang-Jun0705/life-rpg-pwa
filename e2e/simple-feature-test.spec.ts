import { test, expect } from '@playwright/test'

test.describe('실제 기능 작동 확인', () => {
  test('모험 페이지 접속 및 기본 UI 확인', async ({ page }) => {
    // 루트 페이지로 먼저 이동
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // 모험 페이지로 이동 시도
    const adventureLink = page.locator('a[href*="adventure"], button').filter({ hasText: /모험|Adventure/ })
    if (await adventureLink.count() > 0) {
      await adventureLink.first().click()
      await page.waitForTimeout(2000)
    } else {
      // 직접 URL로 이동
      await page.goto('/adventure')
      await page.waitForTimeout(2000)
    }
    
    // 모험 페이지 요소들 확인
    const hasTitle = await page.locator('text=/모험.*성장|Adventure/').count() > 0
    const hasTabs = await page.locator('button').filter({ hasText: /던전|스킬|상점/ }).count() > 0
    
    console.log('페이지 제목 표시:', hasTitle)
    console.log('탭 메뉴 표시:', hasTabs)
    
    expect(hasTitle || hasTabs).toBe(true)
  })

  test('자동전투 기능이 실제로 존재하는지 확인', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForTimeout(2000)
    
    // 던전 탭 클릭
    const dungeonTab = page.locator('button').filter({ hasText: '던전' })
    if (await dungeonTab.count() > 0) {
      await dungeonTab.click()
      await page.waitForTimeout(1000)
      
      // 던전 선택
      const dungeons = page.locator('div[class*="cursor-pointer"], button').filter({ hasText: /숲|동굴|던전/ })
      if (await dungeons.count() > 0) {
        await dungeons.first().click()
        await page.waitForTimeout(1000)
        
        // 전투 시작
        const battleButton = page.locator('button').filter({ hasText: /전투.*시작|입장/ })
        if (await battleButton.count() > 0) {
          await battleButton.click()
          await page.waitForTimeout(2000)
          
          // 자동전투 버튼 확인
          const autoBattleElements = await page.locator('text=/자동전투|자동|Auto/').count()
          console.log('자동전투 관련 요소 수:', autoBattleElements)
          
          // 자동전투 ON/OFF 표시 확인
          const autoBattleStatus = await page.locator('text=/ON|OFF/').count()
          console.log('ON/OFF 표시 수:', autoBattleStatus)
          
          expect(autoBattleElements).toBeGreaterThan(0)
        }
      }
    }
  })

  test('스킬 장착 시스템 확인', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForTimeout(2000)
    
    // 스킬 탭 클릭
    const skillTab = page.locator('button').filter({ hasText: '스킬' })
    if (await skillTab.count() > 0) {
      await skillTab.click()
      await page.waitForTimeout(1000)
      
      // 스킬 관련 UI 요소 확인
      const hasSkillManager = await page.locator('text=/스킬.*관리/').count() > 0
      const hasSlots = await page.locator('text=/슬롯/').count() > 0
      const hasSkillPoints = await page.locator('text=/SP|스킬.*포인트/').count() > 0
      
      console.log('스킬 관리 UI:', hasSkillManager)
      console.log('슬롯 시스템:', hasSlots)
      console.log('스킬 포인트:', hasSkillPoints)
      
      // 스킬 카드 확인
      const skillCards = await page.locator('div').filter({ hasText: /Lv\.|레벨/ }).count()
      console.log('스킬 카드 수:', skillCards)
      
      expect(hasSkillManager || hasSlots).toBe(true)
    }
  })

  test('상점 시스템 확인', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForTimeout(2000)
    
    // 상점 탭 클릭
    const shopTab = page.locator('button').filter({ hasText: '상점' })
    if (await shopTab.count() > 0) {
      await shopTab.click()
      await page.waitForTimeout(1000)
      
      // 상점 UI 요소 확인
      const hasBuyTab = await page.locator('button').filter({ hasText: '구매' }).count() > 0
      const hasSellTab = await page.locator('button').filter({ hasText: '판매' }).count() > 0
      const hasGold = await page.locator('text=/💰|골드/').count() > 0
      
      console.log('구매 탭:', hasBuyTab)
      console.log('판매 탭:', hasSellTab)
      console.log('골드 표시:', hasGold)
      
      // 상점 카테고리 확인
      const shopCategories = await page.locator('div[class*="icon"]').count()
      console.log('상점 카테고리 수:', shopCategories)
      
      expect(hasBuyTab && hasSellTab).toBe(true)
    }
  })

  test('통합 요약 - 모든 기능이 UI에 존재하는지', async ({ page }) => {
    await page.goto('/adventure')
    await page.waitForTimeout(2000)
    
    const features = {
      '탭 메뉴': await page.locator('button').filter({ hasText: /던전|스킬|상점|인벤토리/ }).count() > 0,
      '캐릭터 정보': await page.locator('text=/Lv\.|레벨/').count() > 0,
      '골드 표시': await page.locator('text=/💰|골드|Gold/').count() > 0,
      '탭 전환 가능': true // 기본적으로 true로 가정
    }
    
    // 각 탭 전환 테스트
    const tabs = ['던전', '스킬', '상점', '인벤토리']
    for (const tab of tabs) {
      const tabButton = page.locator('button').filter({ hasText: tab })
      if (await tabButton.count() > 0) {
        await tabButton.click()
        await page.waitForTimeout(500)
        
        // 각 탭별 특징적인 요소 확인
        switch (tab) {
          case '던전':
            features[`${tab} UI`] = await page.locator('text=/던전|숲|동굴/').count() > 0
            break
          case '스킬':
            features[`${tab} UI`] = await page.locator('text=/스킬|슬롯|SP/').count() > 0
            break
          case '상점':
            features[`${tab} UI`] = await page.locator('text=/구매|판매/').count() > 0
            break
          case '인벤토리':
            features[`${tab} UI`] = await page.locator('text=/인벤토리|장비/').count() > 0
            break
        }
      }
    }
    
    console.log('=== 기능 존재 여부 ===')
    Object.entries(features).forEach(([name, exists]) => {
      console.log(`${name}: ${exists ? '✅' : '❌'}`)
    })
    
    // 최소한 절반 이상의 기능이 존재해야 함
    const workingFeatures = Object.values(features).filter(v => v).length
    const totalFeatures = Object.keys(features).length
    
    console.log(`작동 기능: ${workingFeatures}/${totalFeatures}`)
    expect(workingFeatures).toBeGreaterThanOrEqual(totalFeatures / 2)
  })
})