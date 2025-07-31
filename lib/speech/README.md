# Speech Recognition Module

오프라인 환경에서도 작동하는 Web Speech API 기반 음성 인식 모듈입니다.

## 주요 기능

- ✅ Web Speech API 지원 여부 자동 감지
- 🎙️ 한국어 음성 인식 최적화
- 🔌 오프라인 폴백 (수동 텍스트 입력)
- 🎯 활동 타입 자동 분류
- 📱 모바일 최적화 UI
- 🌐 15개 언어 지원

## 사용법

### 기본 사용

```typescript
import { VoiceInputButton } from '@/components/VoiceInputButton'

function MyComponent() {
  const handleVoiceInput = (transcript: string, activityType?: string | null) => {
    console.log('인식된 텍스트:', transcript)
    console.log('활동 유형:', activityType)
  }

  return (
    <VoiceInputButton 
      onTranscript={handleVoiceInput}
      onError={(error) => console.error(error)}
    />
  )
}
```

### React Hook 사용

```typescript
import { useActivitySpeechRecognition } from '@/lib/speech/use-speech-recognition'

function MyComponent() {
  const {
    isSupported,
    isListening,
    transcript,
    activity,
    start,
    stop,
    reset
  } = useActivitySpeechRecognition()

  return (
    <div>
      {isSupported ? (
        <button onClick={isListening ? stop : start}>
          {isListening ? '중지' : '시작'}
        </button>
      ) : (
        <p>음성 인식이 지원되지 않습니다</p>
      )}
      
      {transcript && <p>인식된 텍스트: {transcript}</p>}
      {activity.type && <p>활동 유형: {activity.type}</p>}
    </div>
  )
}
```

### 저수준 API 사용

```typescript
import { SpeechRecognitionService } from '@/lib/speech/speech-recognition'

const service = new SpeechRecognitionService({
  lang: 'ko-KR',
  continuous: false,
  interimResults: true
})

service.onResult((result) => {
  console.log('결과:', result.transcript)
  console.log('신뢰도:', result.confidence)
})

service.onError((error) => {
  console.error('오류:', error.message)
})

service.start()
```

## 활동 타입 분류

자동으로 인식되는 활동 타입과 키워드:

### 🏃 건강 (health)
- 운동, 헬스, 달리기, 걷기, 요가, 수영, 축구, 농구, 자전거

### 📚 학습 (learning)
- 공부, 독서, 강의, 학습, 연습, 복습, 예습, 코딩, 프로그래밍

### 🤝 관계 (relationship)
- 만남, 대화, 식사, 커피, 데이트, 모임, 파티, 통화

### 🏆 성취 (achievement)
- 완료, 달성, 성공, 합격, 우승, 완성, 마무리, 끝

## 커스텀 단어 사전

자주 사용하는 단어를 자동으로 변환:

```typescript
const customDictionary = new Map([
  ['런닝', '달리기'],
  ['워킹', '걷기'],
  ['짐', '헬스'],
  ['스터디', '공부']
])

const speech = useSpeechRecognition({
  customDictionary
})
```

## 브라우저 지원

- ✅ Chrome (Desktop & Mobile)
- ✅ Edge
- ✅ Safari (iOS 14.5+)
- ❌ Firefox (Web Speech API 미지원)

## 오프라인 동작

네트워크 오류 또는 미지원 브라우저에서는 자동으로 수동 입력 모드로 전환됩니다.

## 성능 목표

- 인식률: 95% 이상 (조용한 환경)
- 응답 시간: 300ms 이내
- 메모리 사용량: 10MB 이하

## 문제 해결

### 마이크 권한 오류
```
브라우저 설정에서 마이크 권한을 허용해주세요.
설정 > 개인정보 및 보안 > 사이트 설정 > 마이크
```

### 인식률이 낮을 때
1. 조용한 환경에서 시도
2. 마이크와의 거리 조절 (15-30cm)
3. 명확한 발음으로 천천히 말하기
4. 커스텀 사전에 자주 사용하는 단어 추가

### 오프라인에서 작동하지 않을 때
Web Speech API는 일부 음성 처리를 서버에서 수행합니다.
완전한 오프라인 환경에서는 수동 입력 모드를 사용하세요.