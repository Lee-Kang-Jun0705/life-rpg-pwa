// 앱 기능 테스트 스크립트
const puppeteer = require('puppeteer');

async function testApp() {
  console.log('🚀 Life RPG PWA 기능 테스트 시작...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 콘솔 메시지 수집
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(`❌ Console Error: ${msg.text()}`);
    }
  });

  try {
    // 1. 홈페이지 로딩 테스트
    console.log('📍 홈페이지 로딩 테스트...');
    const startTime = Date.now();
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    console.log(`✅ 홈페이지 로딩 완료 (${loadTime}ms)\n`);

    // 2. 대시보드 페이지 테스트
    console.log('📍 대시보드 페이지 테스트...');
    const dashboardStart = Date.now();
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
    const dashboardLoadTime = Date.now() - dashboardStart;
    console.log(`✅ 대시보드 로딩 완료 (${dashboardLoadTime}ms)`);
    
    // 대시보드 요소 확인
    const hasStats = await page.evaluate(() => {
      const statElements = document.querySelectorAll('[class*="stat"]');
      return statElements.length > 0;
    });
    console.log(`${hasStats ? '✅' : '❌'} 스탯 표시 확인\n`);

    // 3. 던전 페이지 테스트
    console.log('📍 던전 시스템 테스트...');
    const dungeonStart = Date.now();
    await page.goto('http://localhost:3001/dungeon', { waitUntil: 'networkidle2' });
    const dungeonLoadTime = Date.now() - dungeonStart;
    console.log(`✅ 던전 페이지 로딩 완료 (${dungeonLoadTime}ms)`);
    
    // 던전 목록 확인
    await page.waitForTimeout(1000);
    const dungeonCount = await page.evaluate(() => {
      const dungeonElements = document.querySelectorAll('[class*="dungeon-item"], [class*="dungeon-card"]');
      return dungeonElements.length;
    });
    console.log(`${dungeonCount > 0 ? '✅' : '❌'} 던전 목록 표시: ${dungeonCount}개 던전\n`);

    // 4. 상점 페이지 테스트
    console.log('📍 상점 페이지 테스트...');
    const shopStart = Date.now();
    await page.goto('http://localhost:3001/shop', { waitUntil: 'networkidle2' });
    const shopLoadTime = Date.now() - shopStart;
    console.log(`✅ 상점 페이지 로딩 완료 (${shopLoadTime}ms)`);
    
    // 상점 아이템 확인
    const shopItems = await page.evaluate(() => {
      const itemElements = document.querySelectorAll('[class*="shop-item"], [class*="item-card"]');
      return itemElements.length;
    });
    console.log(`${shopItems > 0 ? '✅' : '❌'} 상점 아이템 표시: ${shopItems}개 아이템\n`);

    // 5. 장비 페이지 테스트
    console.log('📍 장비 페이지 테스트...');
    const equipmentStart = Date.now();
    await page.goto('http://localhost:3001/equipment', { waitUntil: 'networkidle2' });
    const equipmentLoadTime = Date.now() - equipmentStart;
    console.log(`✅ 장비 페이지 로딩 완료 (${equipmentLoadTime}ms)\n`);

    // 6. 컬렉션 페이지 테스트
    console.log('📍 컬렉션 페이지 테스트...');
    const collectionStart = Date.now();
    await page.goto('http://localhost:3001/collection', { waitUntil: 'networkidle2' });
    const collectionLoadTime = Date.now() - collectionStart;
    console.log(`✅ 컬렉션 페이지 로딩 완료 (${collectionLoadTime}ms)\n`);

    // 테스트 결과 요약
    console.log('📊 테스트 결과 요약:');
    console.log('─────────────────────────────');
    console.log(`평균 페이지 로딩 시간: ${Math.round((loadTime + dashboardLoadTime + dungeonLoadTime + shopLoadTime + equipmentLoadTime + collectionLoadTime) / 6)}ms`);
    console.log(`콘솔 에러: ${consoleMessages.length}개`);
    
    if (consoleMessages.length > 0) {
      console.log('\n콘솔 에러 목록:');
      consoleMessages.forEach(msg => console.log(msg));
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
}

// Puppeteer 설치 확인
try {
  require.resolve('puppeteer');
  testApp();
} catch (e) {
  console.log('Puppeteer를 설치하고 있습니다...');
  const { execSync } = require('child_process');
  execSync('npm install puppeteer', { stdio: 'inherit', cwd: __dirname });
  testApp();
}