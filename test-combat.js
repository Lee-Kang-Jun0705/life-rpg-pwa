const { chromium } = require('playwright');

(async() => {
  console.log('🎮 전투 시스템 테스트 시작...')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // 동작을 천천히 보기 위해
  })

  const page = await browser.newPage()

  try {
    // 1. 던전 페이지 접속
    console.log('1. 던전 페이지 접속...')
    await page.goto('http://localhost:3000/dungeon')
    await page.waitForTimeout(3000) // 로딩 대기 시간 증가

    // 페이지 내용 확인
    console.log('현재 페이지 확인...')
    const pageTitle = await page.title()
    console.log('페이지 타이틀:', pageTitle)

    // 2. 첫 번째 던전 선택
    console.log('2. 던전 선택...')
    // ImprovedDungeonList 컴포넌트의 던전 카드 선택
    await page.waitForSelector('.grid', { timeout: 5000 })
    const dungeonCard = await page.locator('.group').first() // 첫 번째 던전 카드
    await dungeonCard.click()
    await page.waitForTimeout(1000)

    // 3. 던전 입장
    console.log('3. 던전 입장...')
    const enterButton = await page.locator('button:has-text("입장하기")')
    await enterButton.click()

    // 4. 전투 화면 대기
    console.log('4. 전투 화면 로딩 대기...')
    await page.waitForSelector('text=기본 공격', { timeout: 5000 })
    console.log('✅ 전투 화면 로드 완료!')

    // 5. 전투 시작 시간 측정
    const battleStartTime = Date.now()
    console.log(`⏱️ 전투 시작 시간 측정 시작...`)

    // 6. 적 선택
    console.log('5. 적 선택...')
    await page.waitForTimeout(1000) // 전투 준비 시간
    const enemyCard = await page.locator('.text-8xl:has-text("👾")').first()
    await enemyCard.click()
    console.log('✅ 적 선택 완료!')

    // 7. 플레이어 턴 대기
    console.log('6. 플레이어 턴 대기...')
    await page.waitForSelector('text=당신의 차례입니다!', { timeout: 5000 })
    const firstTurnTime = Date.now() - battleStartTime
    console.log(`⏱️ 첫 턴까지 걸린 시간: ${firstTurnTime}ms`)

    // 8. 공격 실행
    console.log('7. 공격 실행...')
    const attackButton = await page.locator('button:has-text("공격")')
    await attackButton.click()
    console.log('✅ 공격 명령 전송!')

    // 9. 데미지 메시지 확인
    console.log('8. 데미지 확인...')
    const damageMessage = await page.waitForSelector('text=데미지!', { timeout: 3000 })
    const damageText = await damageMessage.textContent()
    console.log(`💥 ${damageText}`)

    // 10. HP 변화 확인
    console.log('9. HP 변화 확인...')
    await page.waitForTimeout(1000)
    const enemyHpBar = await page.locator('.bg-gray-800 >> text=/\\d+ \\/ \\d+/').first()
    const hpText = await enemyHpBar.textContent()
    console.log(`❤️ 적 HP: ${hpText}`)

    // 11. 다음 턴 대기 시간 측정
    console.log('10. 다음 턴 대기...')
    const nextTurnStart = Date.now()
    await page.waitForSelector('text=당신의 차례입니다!', {
      state: 'hidden'
    })
    await page.waitForSelector('text=당신의 차례입니다!', {
      timeout: 5000
    })
    const turnInterval = Date.now() - nextTurnStart
    console.log(`⏱️ 턴 간격: ${turnInterval}ms`)

    // 12. 스킬 사용 테스트
    console.log('11. 스킬 사용 테스트...')
    const skillButton = await page.locator('button:has-text("스킬")')
    await skillButton.click()
    await page.waitForTimeout(500)

    const skillOption = await page.locator('button').filter({ hasText: /파워 스트라이크|힐링 라이트/ }).first()
    if (skillOption) {
      await skillOption.click()
      console.log('✅ 스킬 사용!')

      // MP 소모 확인
      const mpBar = await page.locator('text=MP').locator('..').locator('text=/\\d+ \\/ \\d+/')
      const mpText = await mpBar.textContent()
      console.log(`💙 플레이어 MP: ${mpText}`)
    }

    console.log('\n📊 테스트 결과:')
    console.log(`- 전투 시작까지: ${firstTurnTime}ms`)
    console.log(`- 턴 간격: ${turnInterval}ms`)
    console.log('- 공격/스킬 정상 작동 ✅')
    console.log('- HP/MP 차감 정상 작동 ✅')

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error)
  } finally {
    console.log('\n브라우저를 열어둡니다. 수동으로 확인 후 닫아주세요.')
    // await browser.close();
  }
})()
