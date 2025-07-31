# AI 코치 설정 가이드

Life RPG의 AI 코치 기능을 사용하려면 AI API를 설정할 수 있습니다. 
설정하지 않아도 기본 규칙 기반 응답을 사용할 수 있습니다.

## 지원하는 AI 제공자

### 1. OpenAI
- **모델**: GPT-3.5 Turbo, GPT-4
- **가격**: $0.002/1K 토큰 (GPT-3.5), $0.03/1K 토큰 (GPT-4)
- **API 키 발급**: https://platform.openai.com/api-keys

### 2. Anthropic (Claude)
- **모델**: Claude 3 Sonnet, Claude 3 Opus
- **가격**: $0.003/1K 토큰 (Sonnet), $0.015/1K 토큰 (Opus)
- **API 키 발급**: https://console.anthropic.com/

### 3. Google (Gemini)
- **모델**: Gemini Pro
- **가격**: 무료 (일일 한도 있음)
- **API 키 발급**: https://makersuite.google.com/app/apikey

### 4. Groq
- **모델**: Mixtral 8x7B, Llama 2 70B
- **가격**: 베타 기간 무료
- **API 키 발급**: https://console.groq.com/keys

## 설정 방법

### 방법 1: 설정 페이지에서 설정 (권장)
1. 설정 > AI 코치로 이동
2. AI 제공자 선택
3. API 키 입력
4. 모델 선택
5. 연결 테스트
6. 저장

### 방법 2: 환경 변수 파일 직접 설정
1. `.env.local.example` 파일을 `.env.local`로 복사
2. 원하는 제공자의 주석을 해제하고 API 키 입력
3. 앱 재시작

## 보안 주의사항

- API 키는 로컬 브라우저에만 저장되며 서버로 전송되지 않습니다
- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- API 키를 타인과 공유하지 마세요

## 문제 해결

### API 연결 실패
- API 키가 올바른지 확인
- 선택한 모델이 계정에서 사용 가능한지 확인
- API 사용 한도를 초과하지 않았는지 확인

### 응답이 느림
- 더 빠른 모델 선택 (GPT-3.5 > GPT-4)
- Groq 제공자 사용 (가장 빠름)

### 비용 절약 팁
- GPT-3.5 Turbo 사용 (GPT-4보다 15배 저렴)
- Google Gemini Pro 사용 (무료)
- 필요할 때만 AI 기능 활성화

## 예상 비용

일반적인 사용 패턴 (하루 20회 대화) 기준:
- GPT-3.5: 월 $0.5~1
- GPT-4: 월 $5~10
- Claude Sonnet: 월 $1~2
- Gemini Pro: 무료
- Groq: 베타 기간 무료