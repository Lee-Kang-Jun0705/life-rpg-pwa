// 전체 기능 종합 테스트
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
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          loadTime: loadTime,
          body: data,
          contentLength: data.length
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testAllFeatures() {
  console.log('🚀 Life RPG PWA 전체 기능 테스트\n');
  console.log('='.repeat(50));

  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  const pages = [
    {
      name: '대시보드',
      path: '/dashboard',
      requiredElements: ['스탯', 'level', 'experience', 'stat'],
      features: ['사용자 레벨', '경험치 표시', '4가지 스탯']
    },
    {
      name: '던전',
      path: '/dungeon',
      requiredElements: ['던전', 'Dungeon', '입장', 'Enter'],
      features: ['던전 목록', '레벨별 던전', '입장 버튼']
    },
    {
      name: '전투',
      path: '/battle',
      requiredElements: ['HP', '공격', 'Attack', '전투'],
      features: ['HP 표시', '전투 액션', '전투 로그']
    },
    {
      name: '상점',
      path: '/shop',
      requiredElements: ['아이템', 'Item', '구매', 'Buy', '가격'],
      features: ['아이템 목록', '가격 표시', '구매 버튼']
    },
    {
      name: '장비',
      path: '/equipment',
      requiredElements: ['장비', 'Equipment', '착용', 'Equip'],
      features: ['장비 슬롯', '장착 시스템', '스탯 효과']
    },
    {
      name: '컬렉션',
      path: '/collection',
      requiredElements: ['컬렉션', 'Collection', '달성', 'Achievement'],
      features: ['수집 목록', '달성률', '보상 정보']
    },
    {
      name: '활동',
      path: '/activities',
      requiredElements: ['활동', 'Activity', '기록', 'Record'],
      features: ['활동 기록', '경험치 획득', '히스토리']
    }
  ];

  // 1. 페이지별 기능 테스트
  for (const page of pages) {
    console.log(`\n📍 ${page.name} 페이지 테스트`);
    console.log('-'.repeat(30));
    
    try {
      const response = await fetchPage(page.path);
      
      // 로딩 시간 체크
      if (response.loadTime < 1000) {
        console.log(`✅ 로딩 속도: ${response.loadTime}ms (빠름)`);
        testResults.passed++;
      } else if (response.loadTime < 3000) {
        console.log(`⚠️ 로딩 속도: ${response.loadTime}ms (보통)`);
        testResults.warnings++;
      } else {
        console.log(`❌ 로딩 속도: ${response.loadTime}ms (느림)`);
        testResults.failed++;
      }

      // 페이지 상태
      if (response.status === 200) {
        console.log(`✅ 페이지 상태: ${response.status}`);
        testResults.passed++;
      } else {
        console.log(`❌ 페이지 상태: ${response.status}`);
        testResults.failed++;
      }

      // 필수 요소 체크
      let foundElements = 0;
      for (const element of page.requiredElements) {
        if (response.body.toLowerCase().includes(element.toLowerCase())) {
          foundElements++;
        }
      }
      
      const elementRatio = foundElements / page.requiredElements.length;
      if (elementRatio >= 0.5) {
        console.log(`✅ 필수 요소: ${foundElements}/${page.requiredElements.length}개 발견`);
        testResults.passed++;
      } else {
        console.log(`❌ 필수 요소: ${foundElements}/${page.requiredElements.length}개 발견`);
        testResults.failed++;
      }

      // 기능 요약
      console.log(`📋 지원 기능: ${page.features.join(', ')}`);
      
    } catch (error) {
      console.log(`❌ 페이지 로드 실패: ${error.message}`);
      testResults.failed++;
    }
  }

  // 2. 오프라인 기능 테스트
  console.log('\n📍 오프라인 기능 테스트');
  console.log('-'.repeat(30));
  
  // manifest.json 확인
  try {
    const manifest = await fetchPage('/manifest.json');
    if (manifest.status === 200) {
      console.log('✅ PWA Manifest 파일 존재');
      testResults.passed++;
      
      const manifestData = JSON.parse(manifest.body);
      console.log(`   - 앱 이름: ${manifestData.name || '미설정'}`);
      console.log(`   - 시작 URL: ${manifestData.start_url || '미설정'}`);
      console.log(`   - 표시 모드: ${manifestData.display || '미설정'}`);
    }
  } catch (error) {
    console.log('❌ PWA Manifest 파일 로드 실패');
    testResults.failed++;
  }

  // Service Worker 체크 (HTML 내용에서)
  try {
    const homePage = await fetchPage('/');
    const hasServiceWorker = homePage.body.includes('serviceWorker') || 
                           homePage.body.includes('sw.js');
    if (hasServiceWorker) {
      console.log('✅ Service Worker 등록 코드 발견');
      testResults.passed++;
    } else {
      console.log('⚠️ Service Worker 등록 코드 미발견');
      testResults.warnings++;
    }
  } catch (error) {
    console.log('❌ Service Worker 체크 실패');
    testResults.failed++;
  }

  // 3. 성능 분석
  console.log('\n📍 성능 분석');
  console.log('-'.repeat(30));
  
  const loadTimes = [];
  for (const page of pages) {
    try {
      const response = await fetchPage(page.path);
      loadTimes.push(response.loadTime);
    } catch (error) {
      // 에러는 무시
    }
  }
  
  if (loadTimes.length > 0) {
    const avgLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
    const maxLoadTime = Math.max(...loadTimes);
    const minLoadTime = Math.min(...loadTimes);
    
    console.log(`평균 로딩 시간: ${avgLoadTime}ms`);
    console.log(`최대 로딩 시간: ${maxLoadTime}ms`);
    console.log(`최소 로딩 시간: ${minLoadTime}ms`);
    
    if (avgLoadTime < 1000) {
      console.log('✅ 전반적으로 빠른 로딩 속도');
      testResults.passed++;
    } else if (avgLoadTime < 2000) {
      console.log('⚠️ 일부 페이지 최적화 필요');
      testResults.warnings++;
    } else {
      console.log('❌ 전반적인 성능 개선 필요');
      testResults.failed++;
    }
  }

  // 4. 최종 결과
  console.log('\n' + '='.repeat(50));
  console.log('📊 최종 테스트 결과');
  console.log('='.repeat(50));
  console.log(`✅ 통과: ${testResults.passed}개`);
  console.log(`⚠️ 경고: ${testResults.warnings}개`);
  console.log(`❌ 실패: ${testResults.failed}개`);
  
  const totalTests = testResults.passed + testResults.warnings + testResults.failed;
  const successRate = Math.round((testResults.passed / totalTests) * 100);
  console.log(`\n전체 성공률: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log('✅ 전체적으로 양호한 상태입니다.');
  } else if (successRate >= 60) {
    console.log('⚠️ 일부 개선이 필요한 상태입니다.');
  } else {
    console.log('❌ 상당한 개선이 필요한 상태입니다.');
  }
  
  console.log('\n✅ 전체 기능 테스트 완료');
}

// 테스트 실행
testAllFeatures();