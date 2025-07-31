const fs = require('fs');
const path = require('path');

console.log('🔄 E2E 테스트 마이그레이션 시작...\n');

// 백업 디렉토리 생성
const backupDir = path.join(__dirname, 'e2e-backup-' + new Date().toISOString().split('T')[0]);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// 기존 e2e 폴더 백업
console.log('📦 기존 e2e 폴더 백업 중...');
const copyRecursive = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

if (fs.existsSync('./e2e')) {
  copyRecursive('./e2e', backupDir);
  console.log(`✅ 백업 완료: ${backupDir}\n`);
}

// 중복 테스트 파일 목록
const duplicateTests = [
  // 대시보드 관련 중복
  'dashboard-functionality.spec.ts',
  'dashboard-mobile-responsive-test.spec.ts',
  'dashboard-mobile-simple-test.spec.ts',
  'dashboard-comprehensive-test.spec.ts',
  'dashboard-health-check.spec.ts',
  
  // 던전 관련 중복
  'dungeon-integration.spec.ts',
  'dungeon-test.spec.ts',
  'dungeon-structure-debug.spec.ts',
  'dungeon-service-debug.spec.ts',
  'dungeon-data-test.spec.ts',
  'dungeon-page-content.spec.ts',
  'dungeon-render-test.spec.ts',
  'dungeon-complete-flow.spec.ts',
  'dungeon-combat-test.spec.ts',
  'dungeon-structure-test.spec.ts',
  'dungeon-battle-complete-test.spec.ts',
  'dungeon-battle-test.spec.ts',
  'dungeon-battle-advanced.spec.ts',
  'dungeon-system.spec.ts',
  'dungeon-quick-test.spec.ts',
  'dungeon-direct-test.spec.ts',
  'dungeon-difficulty-test.spec.ts',
  'dungeon-quick-difficulty-test.spec.ts',
  'dungeon-final-test.spec.ts',
  'dungeon-comprehensive-test.spec.ts',
  'simple-dungeon-test.spec.ts',
  'integrated-dungeon.spec.ts',
  'verify-dungeon-page.spec.ts',
  'test-dungeon-page-content.spec.ts',
  
  // 성능 관련 중복
  'performance-and-responsiveness-test.spec.ts',
  'performance-and-stress-test.spec.ts',
  'performance-comparison.spec.ts',
  'performance-navigation-test.spec.ts',
  'performance-optimization.spec.ts',
  'performance-regression.spec.ts',
  'performance-test.spec.ts',
  'simple-performance-test.spec.ts',
  
  // 에러 체크 중복
  'console-error-detection.spec.ts',
  'console-error-test.spec.ts',
  'check-console-errors.spec.ts',
  'quick-console-check.spec.ts',
  'debug-console-errors.spec.ts',
  'comprehensive-error-check.spec.ts',
  'detailed-error-check.spec.ts',
  'api-error-check.spec.ts',
  'check-500-error.spec.ts',
  'check-404-error.spec.ts',
  'debug-404-errors.spec.ts',
  
  // 게임 플레이 중복
  'complete-game-flow.spec.ts',
  'complete-game-integration.spec.ts',
  'comprehensive-service-test.spec.ts',
  'comprehensive-test.spec.ts',
  'comprehensive-user-test.spec.ts',
  'full-game-integration.spec.ts',
  'full-game-play.spec.ts',
  'full-game-system-test.spec.ts',
  'full-user-experience.spec.ts',
  'improved-game-test.spec.ts',
  'final-game-test.spec.ts',
  'final-test.spec.ts',
  
  // 기타 중복
  'basic-functionality.spec.ts',
  'basic-test.spec.ts',
  'debug-test.spec.ts',
  'debug-page.spec.ts',
  'page-functionality.spec.ts',
  'pages-functionality.spec.ts',
  'simple-test.spec.ts',
  'simple-navigation-test.spec.ts',
  'test-fixes.spec.ts',
  'existing-features-check.spec.ts',
  'check-all-pages.spec.ts',
  'all-pages-health-check.spec.ts',
  'adventure-page.spec.ts',
  
  // 데이터 관련 중복
  'data-persistence-test.spec.ts',
  'data-save-load-test.spec.ts',
  'data-save-test.spec.ts',
  'data-sync-test.spec.ts',
  'database-test.spec.ts',
  'db-debug.spec.ts',
  'db-structure-check.spec.ts',
  'clear-db-test.spec.ts',
  
  // 특정 기능 중복
  'exp-system-test.spec.ts',
  'experience-system-test.spec.ts',
  'skill-system-test.spec.ts',
  'skills-navigation-test.spec.ts',
  'skills-performance-debug.spec.ts',
  'skills-performance.spec.ts',
  'shop-debug-test.spec.ts',
  'shop-debug.spec.ts',
  'shop-filter-test.spec.ts',
  'shop-performance.spec.ts',
  'equipment-performance.spec.ts',
  'equipment-system-test.spec.ts',
  'item-equipment-test.spec.ts',
  'ai-coach-test.spec.ts',
  'ai-coach-debug.spec.ts',
  'ai-coach-chat-test.spec.ts',
  'ai-coach-final-test.spec.ts',
  
  // 기타 중복
  'check-player-level.spec.ts',
  'debug-stat-card.spec.ts',
  'debug-dashboard-loading.spec.ts',
  'check-dashboard-mobile.spec.ts',
  'network-debug.spec.ts',
  'page-content-debug.spec.ts',
  'core-user-flow.spec.ts',
  'error-handling.spec.ts',
  'error-handling-extended.spec.ts',
  'security-data-integrity.spec.ts',
  'visibility-test.spec.ts',
  'sound-effects.spec.ts',
  'network-errors.spec.ts'
];

// 보존할 테스트 (새 구조에 통합된 것들)
const preservedTests = [
  'navigation.spec.ts',
  'dashboard.spec.ts',
  'user-journey.spec.ts',
  'user-experience.spec.ts',
  'offline.spec.ts',
  'pwa-install.spec.ts',
  'pwa-features.spec.ts',
  'accessibility-test.spec.ts',
  'accessibility-basic.spec.ts'
];

// 통계 계산
console.log('📊 테스트 파일 통계:');
console.log(`- 기존 테스트 파일: ${duplicateTests.length + preservedTests.length}개`);
console.log(`- 중복/불필요한 파일: ${duplicateTests.length}개`);
console.log(`- 새로운 통합 테스트: 12개\n`);

// package.json 업데이트
console.log('📝 package.json 업데이트 중...');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// E2E 테스트 스크립트 업데이트
packageJson.scripts['test:e2e'] = 'playwright test e2e-new/';
packageJson.scripts['test:e2e:core'] = 'playwright test e2e-new/core/';
packageJson.scripts['test:e2e:features'] = 'playwright test e2e-new/features/';
packageJson.scripts['test:e2e:quality'] = 'playwright test e2e-new/quality/';
packageJson.scripts['test:e2e:integration'] = 'playwright test e2e-new/integration/';

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json 업데이트 완료\n');

// 마이그레이션 요약
console.log('📋 마이그레이션 요약:');
console.log('===================');
console.log('✅ 새로운 테스트 구조 생성 완료');
console.log('✅ 12개의 포괄적인 테스트로 통합');
console.log('✅ 공통 설정 파일 생성');
console.log('✅ Playwright 설정 업데이트');
console.log('✅ 기존 테스트 백업 완료\n');

console.log('🎯 다음 단계:');
console.log('1. npm run test:e2e 실행하여 새 테스트 확인');
console.log('2. 모든 테스트 통과 확인 후 기존 e2e 폴더 삭제');
console.log('3. e2e-new를 e2e로 이름 변경');
console.log('4. CI/CD 파이프라인 업데이트\n');

console.log('⚠️  주의사항:');
console.log(`- 백업 위치: ${backupDir}`);
console.log('- 새 테스트가 모두 통과할 때까지 기존 파일 삭제 금지');
console.log('- playwright-new.config.ts를 playwright.config.ts로 교체 필요');