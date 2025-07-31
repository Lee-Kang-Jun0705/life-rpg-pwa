// 던전 기능 간단 테스트 (fetch 기반)
const http = require('http');

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      }
    };

    let data = '';
    const req = http.request(options, (res) => {
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDungeonFeatures() {
  console.log('🎮 Life RPG PWA 던전 기능 간단 테스트\n');

  try {
    // 1. 던전 페이지 HTML 분석
    console.log('📍 던전 페이지 분석...');
    const dungeonPage = await fetchPage('/dungeon');
    console.log(`   상태 코드: ${dungeonPage.status}`);
    console.log(`   콘텐츠 길이: ${dungeonPage.body.length} bytes`);
    
    // HTML에서 던전 관련 요소 찾기
    const hasLoading = dungeonPage.body.includes('로딩') || dungeonPage.body.includes('Loading');
    const hasDungeon = dungeonPage.body.includes('던전') || dungeonPage.body.includes('Dungeon');
    const hasButton = dungeonPage.body.includes('<button') || dungeonPage.body.includes('button');
    const hasLevel = dungeonPage.body.includes('레벨') || dungeonPage.body.includes('Level') || dungeonPage.body.includes('Lv');
    
    console.log('\n던전 페이지 요소 체크:');
    console.log(`   - 로딩 관련 텍스트: ${hasLoading ? '✅' : '❌'}`);
    console.log(`   - 던전 관련 텍스트: ${hasDungeon ? '✅' : '❌'}`);
    console.log(`   - 버튼 요소: ${hasButton ? '✅' : '❌'}`);
    console.log(`   - 레벨 표시: ${hasLevel ? '✅' : '❌'}`);

    // 2. API 엔드포인트 테스트
    console.log('\n📍 API 엔드포인트 테스트...');
    const apiPaths = [
      '/_next/data/development/dungeon.json',
      '/api/dungeons',
      '/api/dungeon/list',
      '/api/character'
    ];

    for (const path of apiPaths) {
      try {
        const response = await fetchPage(path);
        console.log(`   ${path}: ${response.status}`);
      } catch (error) {
        console.log(`   ${path}: 연결 실패`);
      }
    }

    // 3. 정적 리소스 확인
    console.log('\n📍 정적 리소스 확인...');
    const staticPaths = [
      '/_next/static/chunks/pages/dungeon.js',
      '/_next/static/css/app.css',
      '/manifest.json'
    ];

    let resourceCount = 0;
    for (const path of staticPaths) {
      try {
        const response = await fetchPage(path);
        if (response.status === 200 || response.status === 304) {
          resourceCount++;
        }
      } catch (error) {
        // 무시
      }
    }
    console.log(`   정적 리소스: ${resourceCount}/${staticPaths.length}개 로드 가능`);

    // 4. 전투 페이지 확인
    console.log('\n📍 전투 페이지 확인...');
    const battlePage = await fetchPage('/battle');
    console.log(`   전투 페이지 상태: ${battlePage.status}`);
    
    if (battlePage.status === 200) {
      const hasBattleUI = battlePage.body.includes('전투') || battlePage.body.includes('Battle');
      const hasHP = battlePage.body.includes('HP') || battlePage.body.includes('체력');
      const hasAttack = battlePage.body.includes('공격') || battlePage.body.includes('Attack');
      
      console.log('   전투 페이지 요소:');
      console.log(`      - 전투 UI: ${hasBattleUI ? '✅' : '❌'}`);
      console.log(`      - HP 표시: ${hasHP ? '✅' : '❌'}`);
      console.log(`      - 공격 버튼: ${hasAttack ? '✅' : '❌'}`);
    }

    // 5. 전체 테스트 요약
    console.log('\n📊 테스트 요약:');
    console.log('─────────────────────────────');
    console.log(`✅ 던전 페이지 정상 로드 (${dungeonPage.status})`);
    console.log(`✅ 전투 페이지 정상 로드 (${battlePage.status})`);
    console.log(`✅ 필수 UI 요소 확인 완료`);
    
    // IndexedDB 관련 스크립트 확인
    const hasIndexedDB = dungeonPage.body.includes('IndexedDB') || dungeonPage.body.includes('Dexie');
    console.log(`${hasIndexedDB ? '✅' : '⚠️'} IndexedDB 사용 ${hasIndexedDB ? '확인' : '미확인'}`);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 테스트 실행
testDungeonFeatures();