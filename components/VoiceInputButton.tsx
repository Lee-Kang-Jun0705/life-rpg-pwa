'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useActivitySpeechRecognition } from '@/lib/speech/use-speech-recognition'
import { cn } from '@/lib/utils'
import { VoiceInputIcon } from './voice/VoiceInputIcon'
import { VoiceInputStatus } from './voice/VoiceInputStatus'
import { VoiceInputResult } from './voice/VoiceInputResult'
import { VoiceInputError } from './voice/VoiceInputError'
import { VoiceInputFallback } from './voice/VoiceInputFallback'

interface VoiceInputButtonProps {
  onTranscript?: (transcript: string, activityType?: string | null) => void
  onError?: (error: Error) => void
  className?: string
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

const VoiceInputButton = React.memo(function VoiceInputButton({
  onTranscript,
  onError,
  className,
  position = 'bottom-center'
}: VoiceInputButtonProps) {
  const [showFallback, setShowFallback] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(false)

  const {
    isSupported,
    isListening,
    status,
    transcript,
    confidence,
    error,
    activity,
    start,
    stop,
    reset,
    resetActivity
  } = useActivitySpeechRecognition()

  // 위치 스타일 (네비게이션 바 위에 표시되도록 bottom-24 사용)
  const positionStyles = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-24 left-6'
  }

  // 음성 인식 시작/중지
  const handleVoiceInput = useCallback(async() => {
    if (!isSupported) {
      setShowFallback(true)
      return
    }

    if (isListening) {
      stop()
    } else {
      try {
        resetActivity()
        await start()
        setPulseAnimation(true)
      } catch (err) {
        console.error('음성 인식 시작 실패:', err)
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  }, [isSupported, isListening, start, stop, resetActivity, onError])

  // 활동이 인식되면 콜백 호출
  const [lastProcessedActivity, setLastProcessedActivity] = useState<string>('')

  useEffect(() => {
    if (activity.description && onTranscript && activity.description !== lastProcessedActivity) {
      console.log('🎤 Processing voice activity:', activity.description)
      setLastProcessedActivity(activity.description)
      onTranscript(activity.description, activity.type)
      // 3초 후 결과 초기화
      const timer = setTimeout(() => {
        resetActivity()
        setLastProcessedActivity('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [activity.description, activity.type, onTranscript, resetActivity, lastProcessedActivity])

  // 펄스 애니메이션 타이머
  useEffect(() => {
    if (pulseAnimation && !isListening) {
      const timer = setTimeout(() => {
        setPulseAnimation(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pulseAnimation, isListening])

  // 직접 입력 처리
  const handleManualSubmit = useCallback((input: string) => {
    if (onTranscript) {
      onTranscript(input, null)
    }
    setShowFallback(false)
  }, [onTranscript])

  const handleReset = useCallback(() => {
    reset()
    setPulseAnimation(false)
  }, [reset])

  const handleShowFallback = useCallback(() => {
    setShowFallback(true)
  }, [])

  const handleCloseFallback = useCallback(() => {
    setShowFallback(false)
    reset()
  }, [reset])

  return (
    <>
      {/* 메인 버튼 */}
      <button
        onClick={handleVoiceInput}
        disabled={!isSupported && !showFallback}
        className={cn(
          'fixed z-40 p-4 bg-indigo-600 dark:bg-indigo-500',
          'text-white rounded-full shadow-lg',
          'hover:bg-indigo-700 dark:hover:bg-indigo-600',
          'disabled:bg-gray-400 dark:disabled:bg-gray-600',
          'transition-all duration-300 transform',
          'hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-indigo-300',
          'dark:focus:ring-indigo-700',
          positionStyles[position],
          className
        )}
        aria-label={isListening ? '음성 인식 중지' : '음성으로 활동 기록'}
      >
        <VoiceInputIcon
          isSupported={isSupported}
          error={error}
          isListening={isListening}
          status={status}
          pulseAnimation={pulseAnimation}
        />
      </button>

      {/* 상태 표시 */}
      <VoiceInputStatus
        isListening={isListening}
        status={status}
        transcript={transcript}
        confidence={confidence}
        position={position}
      />

      {/* 최종 결과 표시 */}
      <VoiceInputResult
        isListening={isListening}
        activity={activity}
        position={position}
      />

      {/* 에러 표시 */}
      <VoiceInputError
        error={error}
        showFallback={showFallback}
        position={position}
        onReset={handleReset}
        onShowFallback={handleShowFallback}
      />

      {/* 직접 입력 UI */}
      <VoiceInputFallback
        show={showFallback}
        position={position}
        onSubmit={handleManualSubmit}
        onClose={handleCloseFallback}
      />
    </>
  )
})

export { VoiceInputButton }
