# 필수 E2E 테스트 목록

다음 테스트들만 유지합니다:

## 핵심 기능 테스트
- navigation.spec.ts - 기본 네비게이션 테스트
- dashboard.spec.ts - 대시보드 기능 테스트  
- user-journey.spec.ts - 전체 사용자 여정 테스트
- accessibility-test.spec.ts - 접근성 테스트
- pwa-install.spec.ts - PWA 설치 테스트
- offline.spec.ts - 오프라인 기능 테스트

## 성능 및 보안
- performance-and-stress-test.spec.ts - 성능 테스트
- security-vulnerability-test.spec.ts - 보안 테스트

나머지는 모두 중복이므로 제거합니다.