const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 콘솔 에러와 경고를 수집
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    // 대시보드 페이지 방문
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('=== 콘솔 에러 체크 결과 ===');
    console.log(`총 에러: ${errors.length}개`);
    console.log(`총 경고: ${warnings.length}개`);
    
    if (errors.length > 0) {
      console.log('\n[에러 목록]');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n[경고 목록]');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    // 주요 페이지들도 체크
    const pages = ['/skills', '/dungeon', '/shop', '/inventory', '/equipment'];
    
    for (const pageUrl of pages) {
      console.log(`\n=== ${pageUrl} 페이지 체크 ===`);
      const pageErrors = [];
      const pageWarnings = [];
      
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          pageWarnings.push(msg.text());
        }
      });
      
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      await page.goto(`http://localhost:3000${pageUrl}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      console.log(`에러: ${pageErrors.length}개, 경고: ${pageWarnings.length}개`);
      
      if (pageErrors.length > 0) {
        pageErrors.forEach((error, index) => {
          console.log(`  에러 ${index + 1}: ${error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  } finally {
    await browser.close();
  }
})();