# AI API 설정 가이드

## 1. 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다:

```bash
# Windows (명령 프롬프트)
copy .env.example .env.local

# Windows (PowerShell)
cp .env.example .env.local
```

## 2. API 키 설정

`.env.local` 파일을 열어서 원하는 AI 제공자의 API 키를 입력합니다:

### OpenAI (ChatGPT) 사용하기
```
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_AI_API_KEY=sk-1234567890abcdef...
NEXT_PUBLIC_AI_MODEL=gpt-3.5-turbo
```

### Google Gemini 사용하기 (무료)
```
NEXT_PUBLIC_AI_PROVIDER=google
NEXT_PUBLIC_AI_API_KEY=AIzaSy...
NEXT_PUBLIC_AI_MODEL=gemini-pro
```

### Anthropic Claude 사용하기
```
NEXT_PUBLIC_AI_PROVIDER=anthropic
NEXT_PUBLIC_AI_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_AI_MODEL=claude-3-sonnet-20240229
```

### Groq 사용하기 (무료)
```
NEXT_PUBLIC_AI_PROVIDER=groq
NEXT_PUBLIC_AI_API_KEY=gsk_...
NEXT_PUBLIC_AI_MODEL=mixtral-8x7b-32768
```

## 3. API 키 발급 방법

### OpenAI
1. https://platform.openai.com/api-keys 접속
2. 로그인 후 "Create new secret key" 클릭
3. 생성된 키 복사 (sk-로 시작)

### Google Gemini (무료)
1. https://makersuite.google.com/app/apikey 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 키 복사 (AIzaSy로 시작)

### Anthropic Claude
1. https://console.anthropic.com/ 접속
2. 계정 생성 및 로그인
3. API Keys 메뉴에서 키 생성
4. 생성된 키 복사 (sk-ant-로 시작)

### Groq (무료)
1. https://console.groq.com/keys 접속
2. 계정 생성 및 로그인
3. "Create API Key" 클릭
4. 생성된 키 복사 (gsk_로 시작)

## 4. 서버 재시작

환경 변수를 설정한 후 개발 서버를 재시작해야 합니다:

```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

## 5. 주의사항

- `.env.local` 파일은 절대 GitHub에 업로드하지 마세요
- API 키는 안전하게 보관하세요
- 각 제공자마다 무료 사용량 제한이 있습니다:
  - OpenAI: 신규 계정 $18 크레딧
  - Google Gemini: 분당 60회 무료
  - Groq: 분당 30회 무료
  - Anthropic: 월 $5 크레딧

## 6. 문제 해결

### API 키가 작동하지 않는 경우
1. 키가 올바르게 복사되었는지 확인
2. 환경 변수 이름이 정확한지 확인
3. 서버를 재시작했는지 확인
4. 브라우저 개발자 도구 콘솔에서 에러 메시지 확인

### "No API key configured" 에러가 나는 경우
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일명이 정확히 `.env.local`인지 확인 (`.env`가 아님)
3. 환경 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인