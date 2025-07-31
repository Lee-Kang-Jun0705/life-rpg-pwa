# Life RPG PWA - E2E 테스트 가이드

## 📋 개요

이 문서는 Life RPG PWA의 포괄적인 E2E(End-to-End) 테스트 가이드입니다. 실제 사용자가 경험할 수 있는 모든 시나리오를 테스트합니다.

## 🧪 테스트 카테고리

### 1. **사용자 경험 테스트** (`comprehensive-user-experience-test.spec.ts`)
- 첫 방문자 온보딩
- 회원가입/로그인 플로우
- 대시보드 활동 기록
- 레벨업 시스템
- 던전 시스템
- 소셜 기능
- AI 코치
- 상점 시스템
- 오프라인 모드
- PWA 기능
- 장기 사용 시나리오 (30일)

### 2. **성능 테스트** (`performance-and-stress-test.spec.ts`)
- 초기 로딩 성능
- 대량 데이터 처리
- 메모리 누수 검사
- 동시 사용자 시뮬레이션
- 네트워크 조건별 성능
- 애니메이션 성능
- 캐싱 전략
- 극한 스트레스 테스트

### 3. **보안 테스트** (`security-vulnerability-test.spec.ts`)
- XSS 공격 방어
- SQL Injection 방어
- CSRF 보호
- 인증/권한 검증
- 민감정보 노출 방지
- 세션 관리
- 파일 업로드 보안
- API Rate Limiting

### 4. **접근성 테스트** (`accessibility-test.spec.ts`)
- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비
- 시맨틱 HTML
- 폼 접근성
- ARIA 속성
- 터치 타겟 크기
- Axe 자동 검사

### 5. **엣지 케이스 테스트** (`edge-cases-and-special-scenarios.spec.ts`)
- 동시 로그인 제한
- 데이터 경쟁 조건
- 극단적 입력값
- 시간대 변경
- 브라우저 히스토리
- 저장소 할당량 초과
- 서버 응답 불일치

## 🚀 테스트 실행 방법

### 필수 설치
```bash
# 접근성 테스트를 위한 axe-playwright 설치
npm install --save-dev axe-playwright
```

### 개별 테스트 실행
```bash
# 사용자 경험 테스트
npm run test:e2e:user

# 성능 테스트
npm run test:e2e:perf

# 보안 테스트
npm run test:e2e:security

# 접근성 테스트
npm run test:e2e:a11y

# 엣지 케이스 테스트
npm run test:e2e:edge
```

### 전체 테스트 실행
```bash
# 순차 실행 (권장)
npm run test:e2e:all

# 병렬 실행 (빠르지만 리소스 많이 사용)
npm run test:e2e:all:parallel
```

### UI 모드로 실행
```bash
# Playwright UI로 시각적으로 테스트 확인
npm run test:e2e:ui
```

### 디버그 모드
```bash
# 브레이크포인트와 함께 디버깅
npm run test:e2e:debug
```

## 📊 테스트 결과 확인

### 1. HTML 리포트
테스트 실행 후 `test-results/` 폴더에 HTML 리포트가 생성됩니다.

```bash
# 리포트 열기
open test-results/test-report-*.html
```

### 2. JSON 결과
상세한 테스트 결과는 JSON 형식으로도 저장됩니다.

```bash
# JSON 결과 확인
cat test-results/test-results-*.json
```

### 3. Playwright 리포트
```bash
# Playwright 기본 리포트 열기
npx playwright show-report
```

## 🎯 테스트 우선순위

### Critical (즉시 수정 필요)
- 사용자 경험 테스트
- 보안 취약점 테스트

### High (중요)
- 성능 테스트
- 접근성 테스트

### Medium (권장)
- 엣지 케이스 테스트

## 🔧 테스트 환경 설정

### 환경 변수
```bash
# .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
TEST_API_URL=http://localhost:3000/api
```

### 테스트 데이터 초기화
```bash
# 테스트 전 데이터베이스 초기화
npm run db:reset:test
```

## 🐛 디버깅 팁

### 1. 스크린샷 확인
실패한 테스트의 스크린샷은 `test-results/` 폴더에 저장됩니다.

### 2. 트레이스 파일
```bash
# 트레이스 뷰어 열기
npx playwright show-trace test-results/trace.zip
```

### 3. 특정 테스트만 실행
```typescript
// test.only를 사용하여 특정 테스트만 실행
test.only('특정 테스트 이름', async ({ page }) => {
  // ...
});
```

### 4. 느린 모드로 실행
```bash
# 각 동작을 천천히 실행하여 확인
PWDEBUG=1 npm run test:e2e
```

## 📈 성능 기준

### 로딩 시간
- 초기 로딩: < 2초
- 페이지 전환: < 500ms
- API 응답: < 200ms

### 성공률
- Critical 테스트: 100%
- High 테스트: > 95%
- Medium 테스트: > 90%

## 🔄 CI/CD 통합

### GitHub Actions 예시
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e:all
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 🤝 기여 가이드

### 새로운 테스트 추가
1. 적절한 카테고리 파일에 테스트 추가
2. 명확한 테스트 이름 사용
3. 각 단계에 주석 추가
4. 에러 처리 포함

### 테스트 작성 규칙
- 독립적으로 실행 가능해야 함
- 테스트 간 의존성 없어야 함
- 명확한 assertion 사용
- 적절한 타임아웃 설정

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP 보안 테스트 가이드](https://owasp.org/www-project-web-security-testing-guide/)

## 🆘 문제 해결

### 테스트가 실패하는 경우
1. 개발 서버가 실행 중인지 확인
2. 테스트 데이터베이스 초기화
3. 브라우저 캐시 삭제
4. 의존성 재설치 (`npm ci`)

### 타임아웃 에러
- 느린 네트워크 환경에서는 타임아웃 증가 필요
- `playwright.config.ts`에서 전역 타임아웃 조정

### 병렬 실행 시 충돌
- 각 테스트가 독립적인 사용자 계정 사용
- 테스트 간 데이터 격리 확인