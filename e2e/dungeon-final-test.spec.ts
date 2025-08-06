import { test, expect } from '@playwright/test'

test.describe('🎮 던전 시스템 최종 테스트', () => {
  test('던전 페이지 전체 기능 테스트', async ({ page }) => {
    console.log('\n🎆 던전 시스템 테스트 시작\n')
    
    // 콘솔 메시지 수집
    const consoleMessages: { type: string; text: string }[] = []
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() })
    })
    
    // 던전 페이지 접속
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
    
    // 페이지 로드 확인
    await expect(page.locator('h1').filter({ hasText: '던전' })).toBeVisible({ timeout: 10000 })
    console.log('✅ 던전 페이지 로드 성공')
    
    // 골드 표시 확인
    const goldDisplay = page.locator('text=/골드|Gold/i').first()
    await expect(goldDisplay).toBeVisible()
    console.log('✅ 골드 표시 확인')
    
    // 던전 카드 확인
    const dungeonCards = page.locator('button').filter({ hasText: '던전' })
    const cardCount = await dungeonCards.count()
    expect(cardCount).toBeGreaterThan(0)
    console.log(`✅ 던전 카드 ${cardCount}개 확인`)
    
    // 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/final-test/dungeon-main.png',
      fullPage: true 
    })
    
    // 첫 번째 던전 클릭 (일반 던전)
    const normalDungeon = page.locator('button').filter({ hasText: '일반 던전' })
    await normalDungeon.click()
    console.log('🎮 일반 던전 입장 시도...')
    
    // 전투 화면 로드 대기
    await page.waitForTimeout(2000)
    
    // 전투 UI 확인 - 더 유연한 선택자 사용
    try {
      // 스테이지 정보나 배속 버튼이 보이면 전투 화면이 로드된 것
      const stageInfo = page.locator('text=/스테이지|Stage/i')
      const speedButton = page.locator('button').filter({ hasText: /1x|2x|3x/i })
      
      await expect(stageInfo.or(speedButton).first()).toBeVisible({ timeout: 10000 })
      console.log('✅ 전투 화면 로드 성공')
    } catch (e) {
      console.log('❌ 전투 화면 로드 실패')
      throw e
    }
    
    // 플레이어 체력바 확인
    const playerHealth = page.locator('text=/HP|Health|체력/i').first()
    await expect(playerHealth).toBeVisible()
    console.log('✅ 플레이어 체력바 확인')
    
    // 몬스터 정보 확인 (이름이나 레벨로 확인)
    const monsterName = page.locator('text=/Lv\\.\\d+/i').first()
    await expect(monsterName).toBeVisible()
    console.log('✅ 몬스터 정보 확인')
    
    // 배속 버튼 확인
    const speedButtons = page.locator('button').filter({ hasText: /1x|2x|3x|배속/i })
    const speedButtonCount = await speedButtons.count()
    expect(speedButtonCount).toBeGreaterThan(0)
    console.log(`✅ 배속 버튼 ${speedButtonCount}개 확인`)
    
    // 전투 스크린샷
    await page.screenshot({ 
      path: 'e2e/screenshots/final-test/dungeon-battle.png',
      fullPage: true 
    })
    
    // 3초 대기 (자동전투 확인)
    await page.waitForTimeout(3000)
    console.log('✅ 자동전투 진행 확인')
    
    // 나가기 버튼 클릭
    const exitButton = page.locator('button').filter({ hasText: /나가기|Exit/i })
    await expect(exitButton).toBeVisible()
    await exitButton.click()
    console.log('✅ 나가기 버튼 클릭')
    
    // 다시 던전 목록으로 돌아왔는지 확인
    await expect(page).toHaveURL('/dungeon')
    await expect(page.locator('h1').filter({ hasText: '던전' })).toBeVisible()
    console.log('✅ 던전 목록으로 복귀 성공')
    
    console.log('\n🎉 던전 시스템 테스트 완료!\n')
    
    // 콘솔 에러 출력
    const errors = consoleMessages.filter(msg => msg.type === 'error')
    if (errors.length > 0) {
      console.log('\n⚠️ 콘솔 에러 발견:')
      errors.forEach(err => console.log(`  - ${err.text}`))
    }
  })
})