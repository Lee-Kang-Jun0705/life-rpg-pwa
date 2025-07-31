# Life RPG PWA - E2E 테스트

## 🚀 빠른 시작

```bash
# 1. 테스트 의존성 설치
chmod +x install-test-deps.sh
./install-test-deps.sh

# 2. 개발 서버 실행 (다른 터미널에서)
npm run dev

# 3. 모든 테스트 실행
npm run test:e2e:all
```

## 📁 테스트 파일 구조

```
e2e/
├── comprehensive-user-experience-test.spec.ts  # 사용자 경험 테스트
├── performance-and-stress-test.spec.ts        # 성능 테스트
├── security-vulnerability-test.spec.ts        # 보안 테스트
├── accessibility-test.spec.ts                 # 접근성 테스트
├── edge-cases-and-special-scenarios.spec.ts  # 엣지 케이스
└── README.md                                  # 이 파일
```

## 🧪 주요 테스트 시나리오

### 사용자 경험 (150+ 테스트)
- ✅ 온보딩 플로우
- ✅ 회원가입/로그인
- ✅ 대시보드 활동 기록
- ✅ 스와이프 기능
- ✅ 음성 입력
- ✅ 레벨업 시스템
- ✅ 던전 시스템
- ✅ 소셜 피드
- ✅ AI 코치
- ✅ 상점
- ✅ 오프라인 모드
- ✅ PWA 기능
- ✅ 30일 장기 사용

### 성능 (10+ 테스트)
- ✅ 초기 로딩 < 2초
- ✅ 1000개 데이터 처리
- ✅ 메모리 누수 검사
- ✅ 20명 동시 접속
- ✅ 3G 네트워크
- ✅ 애니메이션 30FPS+

### 보안 (14+ 테스트)
- ✅ XSS 방어
- ✅ SQL Injection 방어
- ✅ CSRF 보호
- ✅ 인증/권한
- ✅ 세션 관리
- ✅ 파일 업로드

### 접근성 (14+ 테스트)
- ✅ 키보드 네비게이션
- ✅ 스크린 리더
- ✅ WCAG 2.1 AA
- ✅ 색상 대비
- ✅ 터치 타겟 44px+

### 엣지 케이스 (15+ 테스트)
- ✅ 동시 로그인
- ✅ 극단적 입력
- ✅ 시간대 변경
- ✅ 네트워크 장애
- ✅ 1년치 데이터

## 🎯 테스트 명령어

```bash
# 개별 카테고리 실행
npm run test:e2e:user      # 사용자 경험
npm run test:e2e:perf      # 성능
npm run test:e2e:security  # 보안
npm run test:e2e:a11y      # 접근성
npm run test:e2e:edge      # 엣지 케이스

# UI 모드 (시각적 확인)
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 특정 테스트만
npx playwright test -g "회원가입"
```

## 📊 결과 확인

테스트 실행 후:
- `test-results/` - 스크린샷, JSON 결과
- `playwright-report/` - HTML 리포트
- 터미널에 요약 표시

## ⚡ 성능 기준

- **Critical 테스트**: 100% 통과 필수
- **High 테스트**: 95%+ 통과
- **Medium 테스트**: 90%+ 통과

## 🔧 트러블슈팅

### 테스트 실패 시
1. 개발 서버 실행 확인 (`http://localhost:3000`)
2. 브라우저 설치: `npx playwright install`
3. 의존성 재설치: `npm ci`

### 타임아웃 에러
`playwright.config.ts`에서 timeout 값 증가

### Windows에서 실행
```powershell
# PowerShell에서
node install-test-deps.js
npm run test:e2e:all
```

## 📝 새 테스트 추가

1. 적절한 카테고리 파일 선택
2. 테스트 작성:
```typescript
test('설명적인 테스트 이름', async ({ page }) => {
  // Given - 준비
  await page.goto('/login')
  
  // When - 실행
  await page.fill('input[name="email"]', 'test@example.com')
  
  // Then - 검증
  await expect(page).toHaveURL('/dashboard')
})
```

## 🤝 기여하기

1. 테스트는 독립적으로 실행 가능해야 함
2. 명확한 assertion 사용
3. 적절한 대기 시간 설정
4. 스크린샷/비디오 활용

상세 가이드: [E2E-TEST-GUIDE.md](../E2E-TEST-GUIDE.md)