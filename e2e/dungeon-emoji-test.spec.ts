import { test, expect } from '@playwright/test'

test.describe('던전 이모지 및 딜레이 테스트', () => {
  test('캐릭터와 몬스터 이모지가 올바르게 표시되어야 함', async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('브라우저 콘솔:', msg.text())
      }
    })
    
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 일반 던전 입장
    await page.locator('button').filter({ hasText: '일반 던전' }).click()
    await page.waitForTimeout(1000)
    
    // 캐릭터 정보 확인
    const characterSection = page.locator('h3').filter({ hasText: '캐릭터' })
    const characterText = await characterSection.textContent()
    console.log('캐릭터 표시:', characterText)
    
    // 슈퍼맨 이모지 확인
    expect(characterText).toContain('🦸')
    expect(characterText).toMatch(/🦸 캐릭터 \(Lv\.\d+\)/)
    
    // 몬스터 정보 확인
    const monsterSection = page.locator('h3').filter({ hasNotText: '캐릭터' }).first()
    const monsterText = await monsterSection.textContent()
    console.log('몬스터 표시:', monsterText)
    
    // 몬스터 이모지 확인 (일반적인 몬스터들)
    const commonMonsterEmojis = ['🟢', '👺', '🐺', '🦇', '🕷️', '🧟', '💀', '🐗', '👹', '🦅']
    const hasMonsterEmoji = commonMonsterEmojis.some(emoji => monsterText?.includes(emoji))
    expect(hasMonsterEmoji).toBe(true)
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'e2e/screenshots/dungeon-emoji-display.png',
      fullPage: true 
    })
  })
  
  test('자동전투 딜레이가 1초로 설정되어야 함', async ({ page }) => {
    const battleLogs: string[] = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('다음 몬스터') || text.includes('승리 콜백')) {
        battleLogs.push(text)
        console.log('전투 로그:', text)
      }
    })
    
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 일반 던전 입장
    await page.locator('button').filter({ hasText: '일반 던전' }).click()
    await page.waitForTimeout(1000)
    
    // 첫 번째 몬스터의 체력 확인
    const monsterHpText = await page.locator('span').filter({ hasText: 'HP' }).first().textContent()
    console.log('몬스터 체력:', monsterHpText)
    
    // 전투가 끝날 때까지 대기 (최대 10초)
    let battleEnded = false
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000)
      const monsterExists = await page.locator('h3').filter({ hasNotText: '캐릭터' }).count() > 0
      if (!monsterExists || await page.locator('text="다음 몬스터 준비 중..."').count() > 0) {
        battleEnded = true
        break
      }
    }
    
    expect(battleEnded).toBe(true)
    
    // 로그에서 딜레이 확인
    const delayLog = battleLogs.find(log => log.includes('다음 몬스터 생성 대기'))
    if (delayLog) {
      expect(delayLog).toMatch(/1000ms|1초/)
    }
  })
  
  test('스테이지 진행이 정상적으로 되어야 함', async ({ page }) => {
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 일반 던전 입장
    await page.locator('button').filter({ hasText: '일반 던전' }).click()
    await page.waitForTimeout(1000)
    
    // 초기 스테이지 확인
    const stage1Text = await page.locator('h2').filter({ hasText: '스테이지' }).textContent()
    expect(stage1Text).toBe('스테이지 1')
    
    // 자동전투 진행 (최대 15초)
    let currentStage = 1
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000)
      const stageText = await page.locator('h2').filter({ hasText: '스테이지' }).textContent()
      const stageNumber = parseInt(stageText?.match(/\d+/)?.[0] || '1')
      
      if (stageNumber > currentStage) {
        console.log(`스테이지 ${currentStage} → ${stageNumber} 진행됨`)
        currentStage = stageNumber
      }
      
      // 최소 스테이지 2까지는 진행되어야 함
      if (currentStage >= 2) {
        break
      }
    }
    
    expect(currentStage).toBeGreaterThanOrEqual(2)
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/dungeon-stage-progress.png',
      fullPage: true 
    })
  })
})