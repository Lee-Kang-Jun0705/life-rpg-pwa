# Life RPG PWA - 배포 가이드

## 🚀 Vercel 배포 방법

### 1. GitHub에 프로젝트 업로드

```bash
# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/life-rpg-pwa.git
git push -u origin master
```

### 2. Vercel 배포

1. [Vercel](https://vercel.com) 계정 생성/로그인
2. "New Project" 클릭
3. GitHub 저장소 Import
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 3. 환경 변수 설정 (선택사항)

AI 코치 기능을 사용하려면 다음 환경 변수를 설정하세요:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| NEXT_PUBLIC_AI_PROVIDER | AI 제공자 | openai, anthropic, google, groq |
| NEXT_PUBLIC_AI_API_KEY | API 키 | sk-... |
| NEXT_PUBLIC_AI_MODEL | 모델명 | gpt-3.5-turbo |

### 4. 배포 완료 후

- 제공된 URL로 접속
- PWA 설치: 브라우저 메뉴 → "홈 화면에 추가"
- 오프라인에서도 정상 작동 확인

## 📱 주요 기능

- **던전 시스템**: 15개 던전, 층별 구조, 다중 몬스터 전투
- **전투 개선사항**:
  - 1:2, 1:3 동시 전투 지원
  - 층 간 원활한 전환
  - 플레이어 HP 유지
  - 배속 설정 유지
- **오프라인 지원**: 완전한 PWA 기능
- **데이터 저장**: IndexedDB 로컬 저장

## ⚠️ 주의사항

- 모든 데이터는 사용자 기기에만 저장됩니다
- 서버나 클라우드 저장소를 사용하지 않습니다
- AI 기능만 인터넷 연결이 필요합니다

## 🛠️ 문제 해결

### 빌드 실패 시
```bash
# 캐시 삭제
rm -rf .next node_modules
npm install
npm run build
```

### PWA 설치 안 될 때
- HTTPS로 접속했는지 확인
- 브라우저가 PWA를 지원하는지 확인
- Service Worker가 정상 등록되었는지 확인

## 📧 지원

문제가 있으면 GitHub Issues에 등록해주세요.