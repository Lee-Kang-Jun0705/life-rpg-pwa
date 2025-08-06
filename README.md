# Life RPG PWA - 오프라인 개인용 자기계발 앱

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLee-Kang-Jun0705%2Flife-rpg-pwa&project-name=life-rpg-pwa&repository-name=life-rpg-pwa)

> 🚀 최신 버전 배포됨!

> ⚠️ **프로젝트 성격**: 이 앱은 **완전한 오프라인 개인용 서비스**입니다. 
> - 모든 데이터는 사용자의 기기에만 저장됩니다
> - 서버나 클라우드를 사용하지 않습니다
> - AI 코칭 기능 사용 시에만 인터넷 연결이 필요합니다

오프라인 환경에서도 작동하는 개인용 성장 기록 PWA (Progressive Web App)

## 주요 기능

### ✅ 완료된 기능

- 🌐 **오프라인 지원**: Service Worker를 통한 완전한 오프라인 작동
- 📱 **모바일 최적화**: 반응형 UI와 터치 친화적 인터페이스
- 🎙️ **음성 입력**: Web Speech API를 활용한 한국어 음성 인식
- 💾 **로컬 데이터 저장**: IndexedDB를 통한 안전한 데이터 보관
- 🔐 **데이터 암호화**: AES-GCM 암호화로 민감한 정보 보호
- 💼 **백업/복원**: JSON 형식의 데이터 백업 및 복원
- 🎨 **다크/라이트 모드**: 시스템 설정 연동 테마 전환
- 🚀 **PWA 설치**: 홈 화면 추가 및 독립 실행 지원

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **스타일링**: Tailwind CSS 4
- **상태 관리**: React Hooks
- **데이터베이스**: Dexie.js (IndexedDB wrapper)
- **PWA**: @ducanh2912/next-pwa
- **음성 인식**: Web Speech API
- **암호화**: Web Crypto API

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### 테스트 실행

```bash
npm test
```

## 주요 모듈

### 음성 인식 (`/lib/speech`)
- Web Speech API 기반 STT
- 오프라인 폴백 지원
- 활동 타입 자동 분류
- 15개 언어 지원

### 오프라인 데이터 (`/lib/offline`)
- IndexedDB 스키마 관리
- Repository 패턴 CRUD
- AES-GCM 암호화
- 백업/복원 기능
- 데이터 무결성 검증

### UI 컴포넌트 (`/components`)
- 모바일 최적화 디자인 시스템
- 접근성 준수 (ARIA)
- 이모지 기반 글로벌 UI
- 하단 플로팅 네비게이션

## 프로젝트 구조

```
life-rpg-pwa/
├── app/                  # Next.js App Router 페이지
│   ├── dashboard/       # 메인 대시보드
│   └── demo/           # 데모 페이지
├── components/          # React 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── NavigationBar   # 하단 네비게이션
│   └── VoiceInputButton # 음성 입력 버튼
├── lib/                # 유틸리티 및 라이브러리
│   ├── offline/        # IndexedDB 관련
│   └── speech/         # 음성 인식 관련
└── public/             # 정적 파일
    └── manifest.json   # PWA 매니페스트
```

## 브라우저 지원

- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Safari 14.5+ (iOS)
- Firefox 90+ (음성 인식 제외)

## 라이선스

ISC