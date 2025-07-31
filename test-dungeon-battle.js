// 던전 전투 기능 상세 테스트
const puppeteer = require('puppeteer');

async function testDungeonBattle() {
  console.log('🎮 Life RPG PWA 던전 전투 기능 테스트\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 에러 수집
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // 1. 던전 페이지 접속
    console.log('📍 던전 페이지 접속 중...');
    await page.goto('http://localhost:3001/dungeon', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    console.log('✅ 던전 페이지 로드 완료\n');

    // 2. 던전 목록 확인
    console.log('📍 던전 목록 확인...');
    await page.waitForTimeout(2000); // 데이터 로딩 대기
    
    const dungeonList = await page.evaluate(() => {
      const dungeonElements = document.querySelectorAll('[class*="dungeon"], [class*="Dungeon"]');
      const dungeons = [];
      
      dungeonElements.forEach(el => {
        const nameEl = el.querySelector('[class*="name"], [class*="title"], h3, h4');
        const levelEl = el.querySelector('[class*="level"], [class*="Level"]');
        const buttonEl = el.querySelector('button');
        
        if (nameEl) {
          dungeons.push({
            name: nameEl.textContent.trim(),
            level: levelEl ? levelEl.textContent.trim() : 'Unknown',
            hasButton: !!buttonEl,
            buttonText: buttonEl ? buttonEl.textContent.trim() : null
          });
        }
      });
      
      return dungeons;
    });
    
    console.log(`✅ ${dungeonList.length}개의 던전 발견:`);
    dungeonList.forEach((dungeon, index) => {
      console.log(`   ${index + 1}. ${dungeon.name} (${dungeon.level})`);
      if (dungeon.hasButton) {
        console.log(`      - 버튼: "${dungeon.buttonText}"`);
      }
    });
    console.log('');

    // 3. 첫 번째 던전 진입 시도
    if (dungeonList.length > 0) {
      console.log('📍 첫 번째 던전 진입 시도...');
      
      // 던전 입장 버튼 클릭
      const enterButtonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const enterButton = buttons.find(btn => 
          btn.textContent.includes('입장') || 
          btn.textContent.includes('도전') ||
          btn.textContent.includes('Enter') ||
          btn.textContent.includes('Battle')
        );
        
        if (enterButton) {
          enterButton.click();
          return true;
        }
        return false;
      });
      
      if (enterButtonClicked) {
        console.log('✅ 던전 입장 버튼 클릭 완료');
        await page.waitForTimeout(3000); // 전투 화면 로딩 대기
        
        // 4. 전투 화면 확인
        console.log('\n📍 전투 화면 확인...');
        const battleState = await page.evaluate(() => {
          // 현재 URL 확인
          const currentUrl = window.location.pathname;
          
          // 전투 관련 요소들 찾기
          const battleElements = {
            url: currentUrl,
            hasBattleScreen: currentUrl.includes('/battle'),
            playerHP: document.querySelector('[class*="player"][class*="hp"], [class*="health"], [class*="HP"]')?.textContent,
            enemyHP: document.querySelector('[class*="enemy"][class*="hp"], [class*="monster"][class*="hp"]')?.textContent,
            attackButton: !!document.querySelector('button:has-text("공격"), button:has-text("Attack"), button:has-text("전투"), button:has-text("Battle")'),
            battleLog: document.querySelector('[class*="log"], [class*="message"], [class*="battle-log"]')?.textContent
          };
          
          return battleElements;
        });
        
        console.log('전투 화면 상태:');
        console.log(`   - URL: ${battleState.url}`);
        console.log(`   - 전투 화면 여부: ${battleState.hasBattleScreen ? '✅' : '❌'}`);
        console.log(`   - 플레이어 HP: ${battleState.playerHP || '확인 불가'}`);
        console.log(`   - 적 HP: ${battleState.enemyHP || '확인 불가'}`);
        console.log(`   - 공격 버튼: ${battleState.attackButton ? '✅' : '❌'}`);
        console.log(`   - 전투 로그: ${battleState.battleLog ? '있음' : '없음'}`);
        
        // 5. 전투 액션 테스트
        if (battleState.hasBattleScreen || battleState.attackButton) {
          console.log('\n📍 전투 액션 테스트...');
          
          const attackResult = await page.evaluate(() => {
            const attackButton = document.querySelector('button:has-text("공격"), button:has-text("Attack")');
            if (attackButton) {
              attackButton.click();
              return true;
            }
            return false;
          });
          
          if (attackResult) {
            console.log('✅ 공격 버튼 클릭 성공');
            await page.waitForTimeout(2000);
            
            // 전투 결과 확인
            const afterAttack = await page.evaluate(() => {
              return {
                playerHP: document.querySelector('[class*="player"][class*="hp"]')?.textContent,
                enemyHP: document.querySelector('[class*="enemy"][class*="hp"]')?.textContent,
                hasReward: !!document.querySelector('[class*="reward"], [class*="victory"], [class*="defeat"]')
              };
            });
            
            console.log('전투 후 상태:');
            console.log(`   - 플레이어 HP: ${afterAttack.playerHP || '확인 불가'}`);
            console.log(`   - 적 HP: ${afterAttack.enemyHP || '확인 불가'}`);
            console.log(`   - 보상 화면: ${afterAttack.hasReward ? '✅' : '❌'}`);
          }
        }
      } else {
        console.log('⚠️ 던전 입장 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('⚠️ 표시된 던전이 없습니다.');
    }

    // 6. 에러 체크
    console.log('\n📊 에러 체크:');
    if (errors.length > 0) {
      console.log(`❌ ${errors.length}개의 에러 발견:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 에러 없음');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 던전 전투 테스트 완료');
  }
}

// Puppeteer 설치 확인 및 실행
try {
  require.resolve('puppeteer');
  testDungeonBattle();
} catch (e) {
  console.log('Puppeteer를 설치하고 있습니다...');
  const { execSync } = require('child_process');
  execSync('npm install puppeteer', { stdio: 'inherit', cwd: __dirname });
  testDungeonBattle();
}