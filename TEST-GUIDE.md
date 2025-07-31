# Life RPG PWA - 테스트 실행 가이드

## 🧪 테스트 개요

Life RPG PWA는 **오프라인 우선** 애플리케이션으로, 모든 핵심 기능이 인터넷 연결 없이도 작동합니다.
AI 코칭 기능을 제외한 모든 기능은 로컬에서 처리되며, IndexedDB를 통해 데이터가 저장됩니다.

## 📋 테스트 종류

### 1. 단위 테스트 (Unit Tests)
- **도구**: Jest + React Testing Library
- **대상**: 컴포넌트, 유틸리티 함수, 데이터베이스 헬퍼
- **위치**: `__tests__/` 디렉토리

### 2. E2E 테스트 (End-to-End Tests)
- **도구**: Playwright
- **대상**: 사용자 시나리오, 오프라인 기능, PWA 기능
- **위치**: `e2e/` 디렉토리

## 🚀 테스트 실행 방법

### 사전 준비
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (E2E 테스트용)
npm run dev
```

### 단위 테스트 실행

```bash
# 모든 단위 테스트 실행
npm test

# 감시 모드로 실행 (파일 변경 시 자동 재실행)
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage

# 특정 테스트 파일만 실행
npm test -- db.test.ts

# 특정 테스트 스위트만 실행
npm test -- --testNamePattern="오프라인 데이터베이스"
```

### E2E 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행 (시각적 디버깅)
npm run test:e2e:ui

# 특정 테스트 파일만 실행
npx playwright test offline-functionality.spec.ts

# 특정 브라우저에서만 실행
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# 디버그 모드로 실행
npm run test:e2e:debug
```

## 🔍 주요 테스트 시나리오

### 오프라인 데이터베이스 테스트
```bash
# 오프라인 데이터 저장/조회 테스트
npm test -- __tests__/lib/offline/db.test.ts
```

**테스트 항목:**
- ✅ 사용자 초기 데이터 생성
- ✅ 오프라인 활동 기록 및 저장
- ✅ 경험치 누적 및 레벨업 계산
- ✅ 동기화 대기열 관리
- ✅ 캐릭터 커스터마이징 데이터 저장
- ✅ 데이터 영속성 (DB 재시작 후에도 유지)

### 컴포넌트 테스트
```bash
# 음성 입력 컴포넌트 테스트
npm test -- __tests__/components/VoiceInputButton.test.tsx

# 스탯 카드 컴포넌트 테스트
npm test -- components/dashboard/StatCard.test.tsx
```

**테스트 항목:**
- ✅ 오프라인 상태 UI 표시
- ✅ 음성 인식 폴백 처리
- ✅ 스와이프 제스처 인식
- ✅ 활동 타입 자동 분류

### E2E 오프라인 기능 테스트
```bash
# 오프라인 기능 통합 테스트
npx playwright test offline-functionality.spec.ts
```

**테스트 시나리오:**
- ✅ 오프라인에서 활동 기록
- ✅ 온라인 전환 시 데이터 동기화
- ✅ 오프라인 캐릭터 커스터마이징
- ✅ 오프라인 레벨업 시스템
- ✅ 스와이프 제스처 활동 기록
- ✅ PWA 오프라인 실행
- ✅ 데이터 백업/복원
- ✅ 음성 입력 폴백

### PWA 및 Service Worker 테스트
```bash
# PWA 기능 테스트
npx playwright test pwa-service-worker.spec.ts
```

**테스트 항목:**
- ✅ Service Worker 등록
- ✅ 오프라인 캐시 전략
- ✅ PWA 설치 가능성
- ✅ 네트워크 상태 감지
- ✅ 백그라운드 동기화
- ✅ 앱 업데이트 처리

## 📊 테스트 커버리지 목표

- **단위 테스트**: 90% 이상
- **통합 테스트**: 80% 이상
- **E2E 테스트**: 핵심 사용자 경로 100%

### 커버리지 확인
```bash
# 커버리지 리포트 생성
npm run test:coverage

# HTML 리포트 열기
open coverage/lcov-report/index.html
```

## 🐛 디버깅 팁

### Jest 테스트 디버깅
```javascript
// 테스트에 디버거 추가
it('should work', () => {
  debugger; // 여기서 중단점
  expect(true).toBe(true);
});

// VS Code에서 디버깅
// 1. 디버그 패널 열기 (Ctrl+Shift+D)
// 2. "Jest Current File" 설정 선택
// 3. F5로 디버깅 시작
```

### Playwright 테스트 디버깅
```bash
# 디버그 모드 실행
npx playwright test --debug

# 특정 테스트만 디버그
npx playwright test offline-functionality.spec.ts:15 --debug

# 브라우저 개발자 도구 사용
await page.pause(); // 테스트 코드에 추가
```

## ⚠️ 주의사항

1. **오프라인 테스트 환경**
   - E2E 테스트 시 실제 네트워크 연결을 차단하지 않음
   - Playwright의 `context.setOffline()` 메서드 사용
   - Service Worker가 개발 모드에서는 비활성화될 수 있음

2. **IndexedDB 초기화**
   - 각 테스트 전후로 데이터베이스 정리 필수
   - `beforeEach`와 `afterEach` 훅 활용

3. **비동기 작업 대기**
   - IndexedDB 작업은 모두 비동기
   - `await` 키워드 사용 필수
   - Playwright에서는 `waitFor` 활용

4. **크로스 브라우저 호환성**
   - Safari는 일부 PWA 기능 제한
   - 음성 인식 API는 브라우저별 차이 존재
   - 테스트 시 `test.skip()` 활용

## 🔄 CI/CD 통합

GitHub Actions 설정 예시:
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📚 추가 리소스

- [Jest 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 문서](https://playwright.dev/docs/intro)
- [IndexedDB 테스팅 가이드](https://github.com/dumbmatter/fakeIndexedDB)

---

테스트는 오프라인 우선 앱의 신뢰성을 보장하는 핵심입니다. 
모든 기능이 인터넷 연결 없이도 완벽하게 작동하는지 확인하세요! 🚀