# AI 코치 배포 가이드

## 1. 환경 변수 설정

### Vercel 배포 시

1. Vercel 대시보드에서 프로젝트로 이동
2. Settings → Environment Variables로 이동
3. 다음 환경 변수 추가:

```
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_AI_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_AI_MODEL=gpt-3.5-turbo
```

### 로컬 개발 시

1. `.env.local` 파일 생성 (`.env.example` 복사)
2. API 키 입력

```bash
cp .env.example .env.local
```

## 2. 지원되는 AI 제공자

### OpenAI
- API 키 발급: https://platform.openai.com/api-keys
- 모델: `gpt-3.5-turbo`, `gpt-4`

### Anthropic (Claude)
- API 키 발급: https://console.anthropic.com/
- 모델: `claude-3-sonnet-20240229`, `claude-3-opus-20240229`

### Google (Gemini)
- API 키 발급: https://makersuite.google.com/app/apikey
- 모델: `gemini-pro`

### Groq
- API 키 발급: https://console.groq.com/
- 모델: `mixtral-8x7b-32768`, `llama2-70b-4096`

## 3. 오류 해결

### "Timer 'loadSkills' does not exist" 오류
- 이미 수정됨. 페이지 새로고침 시 해결됩니다.

### AI 코치 개인화 설정 오류
- useEffect 순서 문제 수정됨
- 브라우저 캐시 클리어 후 재시도

## 4. 보안 주의사항

⚠️ **중요**: 
- API 키를 절대 GitHub에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있습니다
- 프로덕션 환경에서는 반드시 환경 변수로 관리하세요

## 5. 테스트

1. 환경 변수 설정 후 서버 재시작
2. 설정 → AI 코치 개인화로 이동
3. 라이트/프로 모드 선택 및 저장
4. AI 코치 페이지에서 기능 테스트

## 6. 비용 관리

각 제공자별 무료 사용량:
- OpenAI: 신규 계정 $18 크레딧
- Anthropic: 월 $5 크레딧
- Google Gemini: 무료 (분당 60회 제한)
- Groq: 무료 (분당 제한 있음)

권장사항: 개발/테스트는 무료 제공자(Gemini, Groq) 사용