# Life RPG PWA - E2E 테스트 (개선된 구조)

## 📁 테스트 구조

```
e2e-new/
├── core/                    # 핵심 기능 테스트
│   ├── navigation.spec.ts   # 네비게이션 및 라우팅
│   └── dashboard.spec.ts    # 대시보드 통합 테스트
├── features/                # 기능별 테스트
│   ├── dungeon.spec.ts      # 던전 시스템
│   ├── shop-inventory.spec.ts # 상점 & 인벤토리
│   └── skills.spec.ts       # 스킬 시스템
├── quality/                 # 품질 테스트
│   ├── performance.spec.ts  # 성능 테스트
│   ├── accessibility.spec.ts # 접근성 테스트
│   └── security.spec.ts     # 보안 테스트
├── integration/             # 통합 테스트
│   ├── user-journey.spec.ts # 사용자 여정
│   └── offline-pwa.spec.ts  # 오프라인 & PWA
└── test-config.ts          # 공통 설정
```

## 🚀 실행 방법

```bash
# 모든 테스트 실행
npx playwright test e2e-new/

# 카테고리별 실행
npx playwright test e2e-new/core/
npx playwright test e2e-new/features/
npx playwright test e2e-new/quality/
npx playwright test e2e-new/integration/

# 특정 테스트 실행
npx playwright test e2e-new/core/dashboard.spec.ts

# UI 모드로 실행
npx playwright test e2e-new/ --ui

# 디버그 모드
npx playwright test e2e-new/ --debug
```

## 📊 테스트 커버리지

### Core (핵심 기능)
- ✅ 모든 페이지 접근성
- ✅ 네비게이션 바 동작
- ✅ 대시보드 스탯 시스템
- ✅ 활동 수행 및 경험치
- ✅ 데이터 영속성

### Features (주요 기능)
- ✅ 던전 입장 및 전투
- ✅ 상점 구매 프로세스
- ✅ 인벤토리 관리
- ✅ 스킬 학습 시스템
- ✅ 장비 장착/해제

### Quality (품질)
- ✅ 페이지 로딩 성능 (< 2초)
- ✅ 대량 데이터 처리
- ✅ 메모리 누수 검사
- ✅ WCAG 2.1 AA 준수
- ✅ XSS/CSRF 방어

### Integration (통합)
- ✅ 신규 사용자 온보딩
- ✅ 일일 플레이 루틴
- ✅ 오프라인 모드
- ✅ PWA 설치
- ✅ 백그라운드 동기화

## 🔧 설정

### 타임아웃 설정
- 페이지 로드: 30초
- 액션: 10초
- 네비게이션: 20초
- API 응답: 15초

### 테스트 환경
- 브라우저: Chromium, Firefox, WebKit
- 뷰포트: Desktop (1280x720), Mobile (390x844)
- 네트워크: Online, Offline, 3G

## 📝 주요 개선사항

1. **중복 제거**: 130개 이상의 테스트를 12개의 포괄적인 테스트로 통합
2. **구조화**: 목적별로 명확히 분류된 폴더 구조
3. **재사용성**: 공통 설정과 헬퍼 함수 분리
4. **유지보수성**: 각 테스트가 독립적으로 실행 가능
5. **가독성**: 명확한 테스트 설명과 단계별 구조

## 🐛 디버깅

### 스크린샷
실패한 테스트는 자동으로 스크린샷 저장:
```
test-results/[test-name]/screenshot.png
```

### 비디오 녹화
playwright.config.ts에서 video 옵션 활성화:
```typescript
use: {
  video: 'on-first-retry'
}
```

### 콘솔 로그
테스트 중 콘솔 에러 자동 수집 및 리포트

## 🤝 기여 가이드

1. 새 테스트는 적절한 카테고리에 추가
2. test-config.ts의 공통 설정 활용
3. 각 테스트는 독립적으로 실행 가능해야 함
4. 명확한 assertion과 에러 메시지 작성
5. 모바일/데스크톱 모두 고려

## 📈 성능 기준

- **Critical Path**: 100% 통과 필수
- **주요 기능**: 95% 이상 통과
- **품질 테스트**: 90% 이상 통과

## 🔄 마이그레이션 가이드

기존 e2e 폴더에서 마이그레이션:

1. `e2e-new` 폴더의 테스트가 모두 통과하는지 확인
2. CI/CD 파이프라인 업데이트
3. 기존 `e2e` 폴더 백업
4. `e2e-new`를 `e2e`로 이름 변경
5. 불필요한 파일 정리

## 🎯 다음 단계

1. CI/CD 통합
2. 테스트 리포트 자동화
3. 성능 메트릭 대시보드
4. 크로스 브라우저 테스트 확대