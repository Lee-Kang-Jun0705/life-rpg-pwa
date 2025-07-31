const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 천천히 진행하여 문제 확인
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 개발 서버 접속
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 던전 탭으로 이동
    await page.click('button:has-text("던전")');
    await page.waitForTimeout(1000);

    // 초보자의 숲 선택 (3층 던전)
    await page.click('text=초보자의 숲');
    await page.waitForTimeout(500);

    // 입장하기
    await page.click('button:has-text("입장하기")');
    await page.waitForTimeout(1000);

    console.log('🎮 던전 전투 시작...');

    // 배속 3x로 설정
    const speedButton = await page.$('button:has-text("⚡")');
    if (speedButton) {
      await speedButton.click();
      await page.waitForTimeout(300);
      await speedButton.click();
      console.log('⚡ 배속 3x 설정 완료');
    }

    // 층별 전투 진행
    for (let floor = 1; floor <= 3; floor++) {
      console.log(`\n📍 ${floor}층 전투 시작`);
      
      // 현재 층 정보 확인
      const floorInfo = await page.textContent('.absolute.top-3.left-3');
      console.log(`층 정보: ${floorInfo}`);
      
      // 현재 몬스터 확인
      const monsterNames = await page.$$eval('.bg-white\\/90.rounded-lg h3', 
        elements => elements.map(el => el.textContent)
      );
      console.log(`현재 몬스터: ${monsterNames.join(', ')}`);
      
      // 전투 로그 모니터링
      let battleComplete = false;
      let errorDetected = false;
      
      while (!battleComplete) {
        // 전투 로그 확인
        const logs = await page.$$eval('.bg-gray-900\\/95 .font-medium', 
          elements => elements.map(el => el.textContent).slice(-5)
        );
        
        // 승리 또는 패배 메시지 확인
        if (logs.some(log => log.includes('승리!') || log.includes('패배...'))) {
          battleComplete = true;
          console.log('전투 종료 감지');
        }
        
        // 몬스터 HP 확인
        const monsterHPs = await page.$$eval('.bg-white\\/90.rounded-lg p.text-xs', 
          elements => elements.map(el => el.textContent)
        );
        
        // 죽은 몬스터가 있는지 확인
        const deadMonsters = monsterHPs.filter(hp => hp.startsWith('0/'));
        if (deadMonsters.length > 0) {
          console.log(`죽은 몬스터 감지: ${deadMonsters.join(', ')}`);
          
          // 죽은 몬스터를 다시 공격하는지 확인
          const recentLogs = logs.slice(-2);
          if (recentLogs.some(log => log.includes('처치했습니다!'))) {
            const attackAfterDeath = recentLogs.some(log => 
              log.includes('공격!') && !log.includes('처치했습니다!')
            );
            if (attackAfterDeath) {
              console.error('❌ 오류: 죽은 몬스터를 다시 공격!');
              errorDetected = true;
            }
          }
        }
        
        await page.waitForTimeout(500);
      }
      
      // 층 클리어 화면 대기
      if (floor < 3) {
        console.log(`${floor}층 클리어, 다음 층 대기 중...`);
        
        // 층 클리어 메시지 확인
        const clearMessage = await page.$('text=층 클리어!');
        if (clearMessage) {
          console.log('층 클리어 메시지 확인');
          
          // 다음 층 정보 확인
          const nextFloorInfo = await page.textContent('.text-purple-400.font-bold');
          console.log(`다음 층 정보: ${nextFloorInfo}`);
        }
        
        // 층 전환 대기
        await page.waitForTimeout(3000);
        
        // 새로운 몬스터 확인
        const newMonsterNames = await page.$$eval('.bg-white\\/90.rounded-lg h3', 
          elements => elements.map(el => el.textContent)
        );
        console.log(`새로운 몬스터: ${newMonsterNames.join(', ')}`);
        
        // 몬스터가 제대로 변경되었는지 확인
        if (JSON.stringify(monsterNames) === JSON.stringify(newMonsterNames)) {
          console.error('❌ 오류: 층이 바뀌었는데 몬스터가 동일함!');
          errorDetected = true;
        }
        
        // 새 몬스터의 HP가 0이 아닌지 확인
        const newMonsterHPs = await page.$$eval('.bg-white\\/90.rounded-lg p.text-xs', 
          elements => elements.map(el => el.textContent)
        );
        const deadNewMonsters = newMonsterHPs.filter(hp => hp.startsWith('0/'));
        if (deadNewMonsters.length > 0) {
          console.error('❌ 오류: 새 층의 몬스터가 이미 죽어있음!');
          console.error(`죽은 몬스터 HP: ${deadNewMonsters.join(', ')}`);
          errorDetected = true;
        }
      }
    }
    
    // 던전 완료 확인
    const dungeonComplete = await page.$('text=던전 완료!');
    if (dungeonComplete) {
      console.log('\n✅ 던전 완료!');
    }
    
    if (errorDetected) {
      console.log('\n❌ 테스트 중 오류 발견됨');
    } else {
      console.log('\n✅ 모든 층 전환이 정상적으로 작동');
    }
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  } finally {
    // 브라우저 열어두기
    console.log('\n테스트 완료. 브라우저를 닫으려면 Ctrl+C를 누르세요.');
    await new Promise(() => {}); // 무한 대기
  }
})();