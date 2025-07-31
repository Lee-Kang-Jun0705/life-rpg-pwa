/**
 * Web Speech API 음성 인식 서비스
 * 오프라인 환경에서도 작동하는 STT 모듈
 */

export interface SpeechRecognitionConfig {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  grammars?: string[]
}

export interface CustomSpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: Array<{
    transcript: string
    confidence: number
  }>
}

export type SpeechRecognitionStatus = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'unsupported'

export interface SpeechRecognitionError {
  name: string
  code: string
  message: string
  details?: unknown
}

// SpeechRecognition API 타입 정의
interface SpeechRecognitionResultItem {
  confidence: number
  transcript: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionResultItem
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported'
  message: string
}

interface SpeechGrammarList {
  length: number
  item(index: number): SpeechGrammar
  addFromString(string: string, weight?: number): void
  addFromURI(src: string, weight?: number): void
}

interface SpeechGrammar {
  src: string
  weight: number
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: SpeechGrammarList
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

// Window 인터페이스 확장 (TypeScript 지원)
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
    SpeechGrammarList: new() => SpeechGrammarList
    webkitSpeechGrammarList: new() => SpeechGrammarList
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private config: SpeechRecognitionConfig
  private onResultCallback?: (result: CustomSpeechRecognitionResult) => void
  private onErrorCallback?: (error: SpeechRecognitionError) => void
  private onStatusChangeCallback?: (status: SpeechRecognitionStatus) => void

  constructor(config: SpeechRecognitionConfig = {}) {
    this.config = {
      lang: config.lang || 'ko-KR', // 기본 한국어
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives || 3,
      grammars: config.grammars || []
    }

    this.initializeRecognition()
  }

  /**
   * Web Speech API 지원 여부 확인
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    return !!(
      window.SpeechRecognition || 
      window.webkitSpeechRecognition
    )
  }

  /**
   * 음성 인식 초기화
   */
  private initializeRecognition(): void {
    if (!SpeechRecognitionService.isSupported()) {
      this.updateStatus('unsupported')
      return
    }

    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechGrammarList = 
      window.SpeechGrammarList || window.webkitSpeechGrammarList

    this.recognition = new SpeechRecognition()

    // 기본 설정
    if (this.config.lang) {
      this.recognition.lang = this.config.lang
    }
    this.recognition.continuous = this.config.continuous ?? true
    this.recognition.interimResults = this.config.interimResults ?? true
    this.recognition.maxAlternatives = this.config.maxAlternatives ?? 1

    // 문법 설정 (지원하는 경우)
    if (SpeechGrammarList && this.config.grammars?.length) {
      const speechRecognitionList = new SpeechGrammarList()
      this.config.grammars.forEach(grammar => {
        speechRecognitionList.addFromString(grammar, 1)
      })
      this.recognition.grammars = speechRecognitionList
    }

    // 이벤트 핸들러 설정
    this.setupEventHandlers()
  }

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return

    // 음성 인식 시작
    this.recognition.onstart = () => {
      this.isListening = true
      this.updateStatus('listening')
    }

    // 음성 인식 종료
    this.recognition.onend = () => {
      this.isListening = false
      this.updateStatus('idle')
    }

    // 음성 감지 시작 - SpeechRecognition 타입에 없으므로 주석 처리
    // this.recognition.onspeechstart = () => {
    //   this.updateStatus('processing')
    // }

    // 결과 처리
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      const resultIndex = event.resultIndex

      if (results[resultIndex]) {
        const result = results[resultIndex]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0

        // 대체 결과들
        const alternatives: Array<{ transcript: string; confidence: number }> = []
        for (let i = 1; i < result.length && i < this.config.maxAlternatives!; i++) {
          alternatives.push({
            transcript: result[i].transcript,
            confidence: result[i].confidence || 0
          })
        }

        const speechResult: CustomSpeechRecognitionResult = {
          transcript,
          confidence,
          isFinal: result.isFinal,
          alternatives: alternatives.length > 0 ? alternatives : undefined
        }

        this.onResultCallback?.(speechResult)
      }
    }

    // 에러 처리
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let error: SpeechRecognitionError

      switch (event.error) {
        case 'no-speech':
          error = {
            name: 'SpeechRecognitionError',
            code: 'NO_SPEECH',
            message: '음성이 감지되지 않았습니다. 다시 시도해주세요.'
          }
          break
        case 'audio-capture':
          error = {
            name: 'SpeechRecognitionError',
            code: 'AUDIO_CAPTURE',
            message: '마이크에 접근할 수 없습니다. 권한을 확인해주세요.'
          }
          break
        case 'not-allowed':
          error = {
            name: 'SpeechRecognitionError',
            code: 'NOT_ALLOWED',
            message: '마이크 사용 권한이 거부되었습니다.'
          }
          break
        case 'network':
          error = {
            name: 'SpeechRecognitionError',
            code: 'NETWORK',
            message: '네트워크 오류가 발생했습니다. 오프라인 모드로 전환합니다.'
          }
          break
        case 'service-not-allowed':
          error = {
            name: 'SpeechRecognitionError',
            code: 'SERVICE_NOT_ALLOWED',
            message: '음성 인식 서비스를 사용할 수 없습니다.'
          }
          break
        default:
          error = {
            name: 'SpeechRecognitionError',
            code: 'UNKNOWN',
            message: '알 수 없는 오류가 발생했습니다.',
            details: event.error
          }
      }

      this.updateStatus('error')
      this.onErrorCallback?.(error)
      this.isListening = false
    }

    // 음성 감지 없음 - SpeechRecognition 타입에 없으므로 주석 처리
    // this.recognition.onnomatch = () => {
    //   const error: SpeechRecognitionError = {
    //     name: 'SpeechRecognitionError',
    //     code: 'NO_MATCH',
    //     message: '인식할 수 없는 음성입니다. 다시 시도해주세요.'
    //   }
    //   this.onErrorCallback?.(error)
    // }
  }

  /**
   * 음성 인식 시작
   */
  start(): void {
    if (!this.recognition) {
      this.onErrorCallback?.({
        name: 'SpeechRecognitionError',
        code: 'NOT_SUPPORTED',
        message: '이 브라우저는 음성 인식을 지원하지 않습니다.'
      })
      return
    }

    if (this.isListening) {
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      this.onErrorCallback?.({
        name: 'SpeechRecognitionError',
        code: 'START_ERROR',
        message: '음성 인식을 시작할 수 없습니다.',
        details: error
      })
    }
  }

  /**
   * 음성 인식 중지
   */
  stop(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }

  /**
   * 음성 인식 중단 (즉시 종료)
   */
  abort(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.abort()
    } catch (error) {
      console.error('Error aborting recognition:', error)
    }
  }

  /**
   * 언어 설정 변경
   */
  setLanguage(lang: string): void {
    this.config.lang = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  /**
   * 연속 인식 모드 설정
   */
  setContinuous(continuous: boolean): void {
    this.config.continuous = continuous
    if (this.recognition) {
      this.recognition.continuous = continuous
    }
  }

  /**
   * 중간 결과 표시 설정
   */
  setInterimResults(interimResults: boolean): void {
    this.config.interimResults = interimResults
    if (this.recognition) {
      this.recognition.interimResults = interimResults
    }
  }

  /**
   * 상태 업데이트
   */
  private updateStatus(status: SpeechRecognitionStatus): void {
    this.onStatusChangeCallback?.(status)
  }

  /**
   * 콜백 등록
   */
  onResult(callback: (result: CustomSpeechRecognitionResult) => void): void {
    this.onResultCallback = callback
  }

  onError(callback: (error: SpeechRecognitionError) => void): void {
    this.onErrorCallback = callback
  }

  onStatusChange(callback: (status: SpeechRecognitionStatus) => void): void {
    this.onStatusChangeCallback = callback
  }

  /**
   * 현재 듣고 있는지 확인
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * 지원 언어 목록
   */
  static getSupportedLanguages(): string[] {
    return [
      'ko-KR', // 한국어
      'en-US', // 영어 (미국)
      'en-GB', // 영어 (영국)
      'ja-JP', // 일본어
      'zh-CN', // 중국어 (간체)
      'zh-TW', // 중국어 (번체)
      'es-ES', // 스페인어
      'fr-FR', // 프랑스어
      'de-DE', // 독일어
      'it-IT', // 이탈리아어
      'pt-BR', // 포르투갈어 (브라질)
      'ru-RU', // 러시아어
      'ar-SA', // 아랍어
      'hi-IN', // 힌디어
      'th-TH'  // 태국어
    ]
  }

  /**
   * 인스턴스 정리
   */
  destroy(): void {
    this.abort()
    this.recognition = null
    this.onResultCallback = undefined
    this.onErrorCallback = undefined
    this.onStatusChangeCallback = undefined
  }
}

/**
 * 자주 사용되는 한국어 명령어 문법
 */
export const KOREAN_COMMAND_GRAMMARS = [
  '#JSGF V1.0; grammar commands; public <command> = 운동 | 공부 | 식사 | 휴식 | 완료 | 시작 | 종료;',
  '#JSGF V1.0; grammar activities; public <activity> = 달리기 | 걷기 | 요가 | 헬스 | 수영 | 독서 | 코딩 | 영어공부 | 수학공부;'
]

/**
 * 음성 인식 품질 개선을 위한 유틸리티
 */
export class SpeechRecognitionUtils {
  /**
   * 인식률 계산 (신뢰도 기반)
   */
  static calculateAccuracy(results: CustomSpeechRecognitionResult[]): number {
    if (results.length === 0) return 0
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0)
    return (totalConfidence / results.length) * 100
  }

  /**
   * 텍스트 정규화 (공백, 특수문자 제거)
   */
  static normalizeTranscript(transcript: string): string {
    return transcript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '')
  }

  /**
   * 커스텀 단어 사전 적용
   */
  static applyCustomDictionary(
    transcript: string, 
    dictionary: Map<string, string>
  ): string {
    let result = transcript
    
    dictionary.forEach((replacement, pattern) => {
      const regex = new RegExp(pattern, 'gi')
      result = result.replace(regex, replacement)
    })
    
    return result
  }

  /**
   * 활동 타입 추출 (한국어)
   */
  static extractActivityType(transcript: string): string | null {
    const activityKeywords = {
      health: ['운동', '헬스', '달리기', '걷기', '요가', '수영', '축구', '농구', '자전거'],
      learning: ['공부', '독서', '강의', '학습', '연습', '복습', '예습', '코딩', '프로그래밍'],
      relationship: ['만남', '대화', '식사', '커피', '데이트', '모임', '파티', '통화'],
      achievement: ['완료', '달성', '성공', '합격', '우승', '완성', '마무리', '끝']
    }

    const normalizedTranscript = transcript.toLowerCase()

    for (const [type, keywords] of Object.entries(activityKeywords)) {
      if (keywords.some(keyword => normalizedTranscript.includes(keyword))) {
        return type
      }
    }

    return null
  }
}