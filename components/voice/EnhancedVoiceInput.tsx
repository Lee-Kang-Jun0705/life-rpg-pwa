'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useActivitySpeechRecognition } from '@/lib/speech/use-speech-recognition'
import { cn } from '@/lib/utils'
import { VoiceInputIcon } from './VoiceInputIcon'
import { VoiceInputFallback } from './VoiceInputFallback'
import { StatSelectionModal } from './StatSelectionModal'
import { StatType } from '@/lib/types/dashboard'
import { motion, AnimatePresence } from 'framer-motion'

interface EnhancedVoiceInputProps {
  onTranscript?: (transcript: string, activityType?: string | null) => void
  onError?: (error: Error) => void
  className?: string
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

const MAX_RECORDING_TIME = 60 // 최대 녹음 시간 (초)

export const EnhancedVoiceInput = React.memo(function EnhancedVoiceInput({
  onTranscript,
  onError,
  className,
  position = 'bottom-center'
}: EnhancedVoiceInputProps) {
  const [showStatSelection, setShowStatSelection] = useState(false)
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [pulseAnimation, setPulseAnimation] = useState(false)

  const {
    isSupported,
    isListening,
    status,
    transcript,
    error,
    start,
    stop,
    reset
  } = useActivitySpeechRecognition()

  // 위치 스타일
  const positionStyles = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-24 left-6'
  }

  // 녹음 시간 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isListening) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stop()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else {
      setRecordingTime(0)
    }

    return () => clearInterval(interval)
  }, [isListening, stop])

  // 음성 입력 시작
  const handleVoiceButtonClick = useCallback(() => {
    if (!isSupported) {
      setShowFallback(true)
      return
    }

    if (isListening) {
      stop()
      setSelectedStat(null)
    } else {
      setShowStatSelection(true)
    }
  }, [isSupported, isListening, stop])

  // 스탯 선택 후 녹음 시작
  const handleStatSelect = useCallback(async(statType: StatType) => {
    setSelectedStat(statType)
    setShowStatSelection(false)

    try {
      await start()
      setPulseAnimation(true)
    } catch (err) {
      console.error('음성 인식 시작 실패:', err)
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [start, onError])

  // 녹음 완료 후 처리
  useEffect(() => {
    if (!isListening && transcript && selectedStat && onTranscript) {
      console.log('🎤 EnhancedVoiceInput - Sending transcript:', {
        transcript,
        statType: selectedStat.type,
        statName: selectedStat.name
      })
      onTranscript(transcript, selectedStat.type)
      setSelectedStat(null)

      // 3초 후 초기화
      const timer = setTimeout(() => {
        reset()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isListening, transcript, selectedStat, onTranscript, reset])

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* 메인 버튼 */}
      <button
        onClick={handleVoiceButtonClick}
        disabled={false}
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
        aria-label={isListening ? '음성 녹음 중지' : '음성으로 활동 기록'}
      >
        <VoiceInputIcon
          isSupported={isSupported}
          error={error}
          isListening={isListening}
          status={status}
          pulseAnimation={pulseAnimation}
        />
      </button>

      {/* 녹음 중 상태 표시 */}
      <AnimatePresence>
        {isListening && selectedStat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed z-30 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4',
              positionStyles[position],
              'transform -translate-y-20'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{selectedStat.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedStat.name} 녹음 중...
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                </div>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(recordingTime / MAX_RECORDING_TIME) * 126} 126`}
                    className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스탯 선택 모달 */}
      <StatSelectionModal
        isOpen={showStatSelection}
        onClose={() => setShowStatSelection(false)}
        onSelectStat={handleStatSelect}
      />

      {/* 직접 입력 UI */}
      <VoiceInputFallback
        show={showFallback}
        position={position}
        onSubmit={handleManualSubmit}
        onClose={() => setShowFallback(false)}
      />
    </>
  )
})
