// 간단한 페이지 로딩 테스트
const http = require('http');

const pages = [
  { name: '홈페이지', path: '/' },
  { name: '대시보드', path: '/dashboard' },
  { name: '던전', path: '/dungeon' },
  { name: '상점', path: '/shop' },
  { name: '장비', path: '/equipment' },
  { name: '컬렉션', path: '/collection' },
  { name: '전투', path: '/battle' },
  { name: '활동', path: '/activities' }
];

console.log('🚀 Life RPG PWA 페이지 응답 테스트\n');

async function testPage(name, path) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      const loadTime = Date.now() - startTime;
      const status = res.statusCode === 200 ? '✅' : '❌';
      console.log(`${status} ${name}: ${res.statusCode} (${loadTime}ms)`);
      resolve();
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: 연결 실패 - ${error.message}`);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  for (const page of pages) {
    await testPage(page.name, page.path);
  }
  console.log('\n✅ 테스트 완료');
}

runTests();