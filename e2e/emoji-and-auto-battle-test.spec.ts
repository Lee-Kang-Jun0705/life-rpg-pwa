import { test, expect } from '@playwright/test'

test.describe('🎮 이모지 및 자동전투 개선 테스트', () => {
  test('캐릭터/몬스터 이모지 표시 및 자동전투 확인', async ({ page }) => {
    console.log('\n🎯 이모지 및 자동전투 테스트 시작\n')
    
    // 던전 페이지 접속
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 던전 페이지 로드 확인
    await expect(page.locator('h1').filter({ hasText: '던전' })).toBeVisible({ timeout: 5000 })
    console.log('✅ 던전 페이지 로드')
    
    // 일반 던전 클릭
    const normalDungeon = page.locator('button').filter({ hasText: '일반 던전' })
    await expect(normalDungeon).toBeVisible()
    await normalDungeon.click()
    console.log('✅ 일반 던전 입장')
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(1000)
    
    // 캐릭터 이모지 확인 (🦸)
    const characterSection = page.locator('text=/🦸 캐릭터/i')
    await expect(characterSection).toBeVisible()
    console.log('✅ 캐릭터 슈퍼맨 이모지(🦸) 확인')
    
    // 첫 번째 몬스터 확인 (캐릭터가 아닌 몬스터만 선택)
    const firstMonster = await page.locator('h3').filter({ hasText: /Lv\.\d+/ }).filter({ hasNotText: '캐릭터' }).textContent()
    console.log(`✅ 첫 번째 몬스터: ${firstMonster}`)
    
    // 몬스터 이모지 확인 (이름에 이모지 포함)
    const hasEmoji = firstMonster && /[\u{1F300}-\u{1F9FF}]/u.test(firstMonster)
    expect(hasEmoji).toBeTruthy()
    console.log('✅ 몬스터 이모지 확인')
    
    // 자동전투 진행 확인 (5개 스테이지)
    let previousStage = 1
    let monsterTypes = new Set<string>()
    
    for (let i = 0; i < 5; i++) {
      // 현재 스테이지 확인
      const stageText = await page.locator('text=/스테이지 \\d+/i').textContent()
      const currentStage = parseInt(stageText?.match(/\d+/)?.[0] || '1')
      console.log(`\n📍 스테이지 ${currentStage}`)
      
      // 몬스터 정보 수집
      const monsterInfo = await page.locator('h3').filter({ hasText: /Lv\.\d+/ }).filter({ hasNotText: '캐릭터' }).textContent()
      if (monsterInfo) {
        const monsterName = monsterInfo.split('(')[0].trim()
        monsterTypes.add(monsterName)
        console.log(`   몬스터: ${monsterName}`)
      }
      
      // 전투 진행 대기 (몬스터 처치까지)
      await page.waitForTimeout(3000)
      
      // 다음 스테이지로 자동 진행 확인
      if (i < 4) { // 마지막 반복이 아닌 경우
        await page.waitForFunction(
          (prevStage) => {
            const stageEl = document.querySelector('h2')
            const stageMatch = stageEl?.textContent?.match(/스테이지 (\d+)/)
            const currentStage = parseInt(stageMatch?.[1] || '1')
            return currentStage > prevStage
          },
          previousStage,
          { timeout: 5000 }
        )
        
        const newStageText = await page.locator('text=/스테이지 \\d+/i').textContent()
        const newStage = parseInt(newStageText?.match(/\d+/)?.[0] || '1')
        expect(newStage).toBeGreaterThan(previousStage)
        console.log(`   ✅ 스테이지 ${previousStage} → ${newStage} 자동 진행`)
        previousStage = newStage
        
        // 다음 몬스터 생성 대기 (1초)
        await page.waitForTimeout(1500)
      }
    }
    
    // 다양한 몬스터 이모지 확인
    console.log('\n📊 등장한 몬스터 종류:')
    monsterTypes.forEach(monster => console.log(`   - ${monster}`))
    expect(monsterTypes.size).toBeGreaterThan(1)
    console.log(`✅ ${monsterTypes.size}종류의 다양한 몬스터 확인`)
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/emoji-test/auto-battle.png',
      fullPage: true 
    })
    
    console.log('\n🎉 이모지 및 자동전투 테스트 완료!')
  })
})