# Life RPG PWA - 배포 가이드

## 🚀 Vercel 배포 방법

### 방법 1: Vercel 웹사이트에서 직접 Import (권장)

1. **Vercel 접속**: https://vercel.com 으로 이동
2. **GitHub로 로그인**
3. **"Add New..." → "Project" 클릭**
4. **"Import Git Repository" 선택**
5. **GitHub 저장소 검색**: `life-rpg-pwa` 검색
6. **"Import" 버튼 클릭**
7. **프로젝트 설정**:
   - Framework Preset: `Next.js` (자동 감지됨)
   - Root Directory: `.` (그대로 둠)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)
8. **"Deploy" 클릭**

### 방법 2: Vercel CLI 사용

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 폴더로 이동
cd life-rpg-pwa_3_250806

# 3. Vercel 로그인
vercel login

# 4. 배포
vercel --prod
```

프롬프트에서 다음과 같이 선택:
- Set up and deploy? `Y`
- Which scope? 본인 계정 선택
- Link to existing project? `N`
- Project name? `life-rpg-pwa`
- In which directory is your code located? `./`
- Want to modify settings? `N`

## 📝 프로젝트 정보

### GitHub 저장소
- **URL**: https://github.com/Lee-Kang-Jun0705/life-rpg-pwa
- **브랜치**: main

### 기술 스택
- **Framework**: Next.js 15.4.3
- **언어**: TypeScript
- **PWA**: @ducanh2912/next-pwa
- **스타일링**: Tailwind CSS
- **데이터베이스**: Dexie.js (IndexedDB)

### 빌드 설정
- **Node.js 버전**: 20.x
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `.next`
- **TypeScript 에러**: 무시 설정됨 (next.config.js)

### 환경 변수 (선택사항)
필요한 경우 Vercel 대시보드에서 설정:
- `NEXT_PUBLIC_API_URL`: API 엔드포인트 (필요시)
- `NEXT_PUBLIC_APP_URL`: 앱 URL (자동 설정됨)

## 🎯 배포 후 확인사항

1. **PWA 설치**: 브라우저에서 PWA 설치 프롬프트 확인
2. **오프라인 모드**: 네트워크 끊고 앱 동작 확인
3. **음성 입력**: 대시보드에서 음성 입력 기능 테스트
4. **던전 전투**: 던전 탭에서 전투 시스템 테스트
5. **반응형 디자인**: 모바일 뷰 확인

## 🔗 예상 배포 URL
- **기본**: https://life-rpg-pwa.vercel.app
- **대체**: https://life-rpg-pwa-[username].vercel.app

## ⚠️ 주의사항
- TypeScript 타입 에러는 빌드 시 무시되도록 설정되어 있음
- 첫 배포는 약 2-5분 소요
- 이후 업데이트는 자동으로 GitHub 푸시 시 배포됨

## 📞 문제 발생 시
1. Vercel 대시보드에서 빌드 로그 확인
2. `vercel.json` 설정 확인
3. `next.config.js` 설정 확인