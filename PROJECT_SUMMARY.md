# Life RPG PWA 프로젝트 요약

## 🎮 프로젝트 개요
Life RPG는 일상을 게임화하여 개인 성장을 돕는 Progressive Web App입니다.

## 🚀 주요 기능

### 1. 대시보드 (`/dashboard`)
- 일일 퀘스트 관리
- 스탯 시각화 (건강, 학습, 관계, 성취)
- 레벨 및 경험치 시스템

### 2. 던전 시스템 (`/dungeon`)
- 4가지 난이도: 일반, 엘리트, 보스, 무한
- 자동 전투 시스템
- 아이템 및 골드 획득
- 캐릭터 레벨 기반 진입 제한

### 3. 기타 페이지
- 프로필 (`/profile`)
- 설정 (`/settings`)
- AI 코치 (`/ai-coach`)
- 업적 (`/achievements`)
- 상점 (`/shop`)
- 인벤토리 (`/inventory`)

## 🛠️ 기술 스택

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

### 상태 관리
- Zustand
- React Query (TanStack Query)

### 데이터베이스
- Dexie.js (IndexedDB)
- 로컬 스토리지

### PWA
- Service Worker
- 오프라인 지원
- 설치 가능

## 📁 프로젝트 구조

```
life-rpg-pwa_2-new/
├── app/              # Next.js App Router 페이지
├── components/       # React 컴포넌트
├── lib/             # 유틸리티 및 비즈니스 로직
├── store/           # Zustand 스토어
├── hooks/           # 커스텀 React Hooks
├── public/          # 정적 파일
├── e2e/             # E2E 테스트
└── docs/            # 문서
```

## 🔧 리팩토링 인프라

### 구축된 시스템
1. **Feature Flag 시스템**: 점진적 기능 배포
2. **에러 추적 시스템**: 실시간 에러 모니터링
3. **Safe Guard 패턴**: 자동 폴백 메커니즘
4. **E2E 테스트**: Playwright 기반

### 사용 방법
```typescript
// Feature Flag
const { isEnabled } = useFeatureFlag()
if (isEnabled('new-feature')) {
  // 새 기능 사용
}

// 에러 추적
window.trackError(error, { component: 'ComponentName' })

// Safe Guard
const SafeComponent = createComponentSafeGuard(
  NewComponent,
  OldComponent,
  'feature-flag-key'
)
```

## 📝 개발 가이드

### 코드 생성 규칙
1. 임시방편 금지
2. any 타입 금지
3. 하드코딩 금지
4. 코드 통일성 유지
5. 국제표준 준수
6. 기존 기능 보호

### 디버그 규칙
1. 입체적 분석
2. 단계별 접근
3. 정확한 위치 파악
4. 버그 수 확인
5. 연관성 분석

## 🚀 시작하기

```bash
# 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build

# 테스트
npm run test
npm run test:e2e
```

## 📊 현재 상태
- ✅ 기본 기능 구현 완료
- ✅ PWA 설정 완료
- ✅ 리팩토링 인프라 구축
- 🚧 지속적인 개선 진행 중