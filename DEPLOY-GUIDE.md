# 🚀 Life RPG PWA - 5분 안에 배포하기!

## 방법 1: Vercel 웹사이트로 즉시 배포 (가장 쉬움!)

1. **Vercel 가입/로그인**
   - https://vercel.com 접속
   - GitHub/GitLab/Bitbucket 또는 이메일로 가입

2. **새 프로젝트 만들기**
   - Dashboard에서 "Add New..." → "Project" 클릭

3. **Git 저장소 가져오기**
   - "Import Git Repository" 선택
   - 이 프로젝트의 GitHub URL 입력

4. **자동 배포**
   - Vercel이 자동으로 Next.js 프로젝트 감지
   - "Deploy" 클릭
   - 2-3분 후 배포 완료!

## 방법 2: GitHub로 먼저 업로드 후 배포

### 1단계: GitHub에 코드 올리기

```bash
# 1. GitHub.com에서 새 저장소 만들기
# 2. 다음 명령어 실행:

git remote add origin https://github.com/YOUR_USERNAME/life-rpg-pwa.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel에서 가져오기

1. https://vercel.com/new 접속
2. "Import Git Repository" 클릭
3. GitHub 저장소 선택
4. "Deploy" 클릭

## ✨ 배포 완료 후

- 제공된 URL로 접속 (예: https://your-app.vercel.app)
- 모바일에서 "홈 화면에 추가"로 PWA 설치
- 오프라인에서도 작동!

## 🎮 주요 기능

- 15개 던전, 다층 구조
- 1:2, 1:3 다중 몬스터 전투
- 층 간 부드러운 전환
- 배속 설정 (1x, 2x, 3x)
- 완전한 오프라인 지원

## 🔧 환경 변수 (선택사항)

AI 코치 기능을 사용하려면 Vercel 프로젝트 설정에서 추가:

- `NEXT_PUBLIC_AI_PROVIDER` (openai/anthropic/google/groq)
- `NEXT_PUBLIC_AI_API_KEY` (API 키)
- `NEXT_PUBLIC_AI_MODEL` (모델명)

## 📱 PWA 설치

1. 배포된 사이트를 모바일 브라우저로 열기
2. 브라우저 메뉴 → "홈 화면에 추가"
3. 앱처럼 사용!

---

💡 **팁**: Vercel은 GitHub 저장소와 연동되면 이후 푸시할 때마다 자동으로 재배포됩니다!