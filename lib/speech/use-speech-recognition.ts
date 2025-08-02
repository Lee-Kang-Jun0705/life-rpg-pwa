import { useState, useEffect, useCallback, useRef } from 'react'
import {
  SpeechRecognitionService,
  CustomSpeechRecognitionResult,
  SpeechRecognitionError,
  SpeechRecognitionStatus,
  SpeechRecognitionConfig,
  SpeechRecognitionUtils,
  KOREAN_COMMAND_GRAMMARS
} from './speech-recognition'

export interface UseSpeechRecognitionOptions extends SpeechRecognitionConfig {
  onResult?: (result: CustomSpeechRecognitionResult) => void
  onError?: (error: SpeechRecognitionError) => void
  onStatusChange?: (status: SpeechRecognitionStatus) => void
  autoStop?: boolean // 자동 종료 여부
  timeout?: number // 타임아웃 (ms)
  customDictionary?: Map<string, string> // 커스텀 단어 사전
}

export interface UseSpeechRecognitionReturn {
  // 상태
  isSupported: boolean
  isListening: boolean
  status: SpeechRecognitionStatus
  transcript: string
  confidence: number
  error: SpeechRecognitionError | null

  // 제어 함수
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void

  // 설정 함수
  setLanguage: (lang: string) => void
  setContinuous: (continuous: boolean) => void
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const serviceRef = useRef<SpeechRecognitionService | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isSupported] = useState(() => SpeechRecognitionService.isSupported())
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<SpeechRecognitionError | null>(null)

  // 음성 인식 서비스 초기화
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported')
      return
    }

    const config: SpeechRecognitionConfig = {
      lang: options.lang || 'ko-KR',
      continuous: options.continuous ?? false,
      interimResults: options.interimResults ?? true,
      maxAlternatives: options.maxAlternatives || 3,
      grammars: options.grammars || KOREAN_COMMAND_GRAMMARS
    }

    const service = new SpeechRecognitionService(config)
    serviceRef.current = service

    // 결과 처리
    service.onResult((result) => {
      let processedTranscript = result.transcript

      // 커스텀 사전 적용
      if (options.customDictionary) {
        processedTranscript = SpeechRecognitionUtils.applyCustomDictionary(
          processedTranscript,
          options.customDictionary
        )
      }

      // 텍스트 정규화
      processedTranscript = SpeechRecognitionUtils.normalizeTranscript(processedTranscript)

      setTranscript(processedTranscript)
      setConfidence(result.confidence)
      setError(null)

      options.onResult?.(result)

      // 자동 종료 (최종 결과일 때)
      if (options.autoStop && result.isFinal) {
        serviceRef.current?.stop()
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    })

    // 에러 처리
    service.onError((err) => {
      setError(err)
      setIsListening(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      options.onError?.(err)
    })

    // 상태 변경 처리
    service.onStatusChange((newStatus) => {
      setStatus(newStatus)
      setIsListening(newStatus === 'listening' || newStatus === 'processing')
      options.onStatusChange?.(newStatus)
    })

    return () => {
      service.destroy()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isSupported, options])

  // 타임아웃 정리
  const clearListeningTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // 음성 인식 중지
  const stop = useCallback(() => {
    if (!serviceRef.current) {
      return
    }

    serviceRef.current.stop()
    clearListeningTimeout()
  }, [clearListeningTimeout])

  // 음성 인식 시작
  const start = useCallback(() => {
    if (!serviceRef.current || isListening || !isSupported) {
      return
    }

    setError(null)
    serviceRef.current.start()

    // 타임아웃 설정
    if (options.timeout) {
      timeoutRef.current = setTimeout(() => {
        stop()
        setError({
          name: 'SpeechRecognitionError',
          code: 'TIMEOUT',
          message: '음성 인식 시간이 초과되었습니다.'
        })
      }, options.timeout)
    }
  }, [isListening, isSupported, options.timeout, stop])

  // 토글
  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  // 리셋
  const reset = useCallback(() => {
    stop()
    setTranscript('')
    setConfidence(0)
    setError(null)
    setStatus('idle')
  }, [stop])

  // 언어 설정
  const setLanguage = useCallback((lang: string) => {
    serviceRef.current?.setLanguage(lang)
  }, [])

  // 연속 모드 설정
  const setContinuous = useCallback((continuous: boolean) => {
    serviceRef.current?.setContinuous(continuous)
  }, [])

  return {
    // 상태
    isSupported,
    isListening,
    status,
    transcript,
    confidence,
    error,

    // 제어 함수
    start,
    stop,
    toggle,
    reset,

    // 설정 함수
    setLanguage,
    setContinuous
  }
}

/**
 * 활동 기록용 음성 인식 훅
 */
export function useActivitySpeechRecognition() {
  const [activity, setActivity] = useState<{
    type: string | null
    description: string
  }>({ type: null, description: '' })

  const customDictionary = new Map([
    // 운동 관련
    ['런닝', '달리기'],
    ['조깅', '달리기'],
    ['워킹', '걷기'],
    ['산책', '걷기'],
    ['짐', '헬스'],
    ['웨이트', '헬스'],

    // 학습 관련
    ['스터디', '공부'],
    ['리딩', '독서'],
    ['북', '독서'],

    // 관계 관련
    ['미팅', '만남'],
    ['친구랑', '친구와'],

    // 성취 관련
    ['끝냈', '완료했'],
    ['성공했', '달성했']
  ])

  const speech = useSpeechRecognition({
    lang: 'ko-KR',
    continuous: false,
    interimResults: true,
    autoStop: true,
    timeout: 30000, // 30초
    customDictionary,
    onResult: (result) => {
      if (result.isFinal) {
        const type = SpeechRecognitionUtils.extractActivityType(result.transcript)
        setActivity({
          type,
          description: result.transcript
        })
      }
    }
  })

  const resetActivity = useCallback(() => {
    setActivity({ type: null, description: '' })
    speech.reset()
  }, [speech])

  return {
    ...speech,
    activity,
    resetActivity
  }
}
