'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  const [selectedStat, setSelectedStat] = useState<{ type: string; name: string; emoji: string } | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const processingRef = useRef(false)
  const processedTranscriptsRef = useRef<Set<string>>(new Set())
  
  // ⚠️ 음성 입력 완료 데이터를 별도로 관리 (2회 시도 버그 방지)
  const [completedVoiceData, setCompletedVoiceData] = useState<{
    transcript: string
    statType: string
    timestamp: number
  } | null>(null)

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

  // transcript 변화 추적
  useEffect(() => {
    console.log('📝 EnhancedVoiceInput: transcript 변화 감지', {
      transcript,
      length: transcript.length,
      isListening,
      status,
      timestamp: new Date().toISOString()
    })
  }, [transcript, isListening, status])

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
  const handleVoiceButtonClick = useCallback(async () => {
    if (!isSupported) {
      console.log('⚠️ EnhancedVoiceInput: Web Speech API 미지원')
      setShowFallback(true)
      return
    }

    // 마이크 권한 확인
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ EnhancedVoiceInput: 마이크 권한 승인됨')
      stream.getTracks().forEach(track => track.stop()) // 스트림 정리
    } catch (err) {
      console.error('❌ EnhancedVoiceInput: 마이크 권한 거부됨:', err)
      if (onError) {
        onError(new Error('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'))
      }
      setShowFallback(true)
      return
    }

    if (isListening) {
      stop()
    } else {
      // 항상 스탯 선택 모달 표시
      setShowStatSelection(true)
    }
  }, [isSupported, isListening, stop])

  // 스탯 선택 후 녹음 시작
  const handleStatSelect = useCallback(async(statType: { type: string; name: string; emoji: string }) => {
    console.log('🎯 EnhancedVoiceInput: 스탯 선택됨', statType)
    setSelectedStat(statType)
    setShowStatSelection(false)

    try {
      console.log('🎤 EnhancedVoiceInput: 음성 인식 시작 시도...')
      await start()
      setPulseAnimation(true)
      console.log('✅ EnhancedVoiceInput: 음성 인식 시작 성공')
    } catch (err) {
      console.error('❌ EnhancedVoiceInput: 음성 인식 시작 실패:', err)
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [start, onError])

  // 녹음 완료 후 처리 - 완료 데이터 저장만 수행
  useEffect(() => {
    console.log('🎤 EnhancedVoiceInput effect triggered:', {
      isListening,
      transcript,
      selectedStat,
      hasOnTranscript: !!onTranscript
    })
    
    if (!isListening && transcript && selectedStat && !processingRef.current) {
      // 이미 처리된 transcript인지 확인
      const transcriptKey = `${transcript}-${selectedStat.type}-${Date.now()}`
      if (processedTranscriptsRef.current.has(transcript)) {
        console.log('⚠️ EnhancedVoiceInput - 이미 처리된 transcript, 무시:', transcript)
        return
      }
      
      console.log('🎤 EnhancedVoiceInput - Saving completed data:', {
        transcript,
        statType: selectedStat.type,
        statName: selectedStat.name,
        timestamp: new Date().toISOString()
      })
      
      // 처리 중 플래그 설정
      processingRef.current = true
      processedTranscriptsRef.current.add(transcript)
      
      // 완료 데이터 저장 (실제 처리는 별도 effect에서)
      setCompletedVoiceData({
        transcript: transcript,
        statType: selectedStat.type,
        timestamp: Date.now()
      })
      
      // 1초 후 다시 처리 가능하도록
      setTimeout(() => {
        processingRef.current = false
      }, 1000)
      
      // 5초 후 처리된 transcript 목록에서 제거 (재시도 가능하도록)
      setTimeout(() => {
        processedTranscriptsRef.current.delete(transcript)
      }, 5000)
    }
  }, [isListening, transcript, selectedStat])
  
  // ⚠️ 완료된 음성 데이터 처리 (별도 effect로 분리하여 race condition 방지)
  useEffect(() => {
    if (completedVoiceData && onTranscript) {
      console.log('🎤 EnhancedVoiceInput - Processing completed voice data:', {
        ...completedVoiceData,
        timestamp: new Date().toISOString()
      })
      
      // 비동기 처리를 위한 async 함수
      const processVoiceData = async () => {
        try {
          // onTranscript 호출 (Promise일 수도 있으므로 await)
          await onTranscript(completedVoiceData.transcript, completedVoiceData.statType)
          
          console.log('✅ EnhancedVoiceInput - Voice data processed successfully')
          
          // 처리 완료 후에만 상태 초기화
          reset()
          setSelectedStat(null)
          setCompletedVoiceData(null)
        } catch (error) {
          console.error('❌ EnhancedVoiceInput - Error processing voice data:', error)
          if (onError) {
            onError(error instanceof Error ? error : new Error('음성 처리 중 오류 발생'))
          }
        }
      }
      
      processVoiceData()
    }
  }, [completedVoiceData]) // ⚠️ 의존성 배열 수정: 함수들은 제외하고 데이터만 포함

  // 에러 발생 시 폴백 UI 표시
  useEffect(() => {
    if (error) {
      console.error('🚨 EnhancedVoiceInput: 음성 인식 에러 발생', error)
      setShowFallback(true)
      setSelectedStat(null)
    }
  }, [error])

  // 음성 인식 타임아웃 감지 (10초 동안 transcript 없으면 폴백)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (isListening && selectedStat) {
      timeoutId = setTimeout(() => {
        console.log('⏱️ EnhancedVoiceInput: 음성 인식 타임아웃 - 텍스트 입력으로 전환')
        stop()
        setShowFallback(true)
        setSelectedStat(null)
      }, 10000) // 10초 타임아웃
    }

    return () => clearTimeout(timeoutId)
  }, [isListening, selectedStat, stop])

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
      <div className={cn('fixed z-40', positionStyles[position])}>
        <button
          onClick={handleVoiceButtonClick}
          disabled={false}
          className={cn(
            'p-4 bg-indigo-600 dark:bg-indigo-500',
            'text-white rounded-full shadow-lg',
            'hover:bg-indigo-700 dark:hover:bg-indigo-600',
            'disabled:bg-gray-400 dark:disabled:bg-gray-600',
            'transition-all duration-300 transform',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-4 focus:ring-indigo-300',
            'dark:focus:ring-indigo-700',
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
        
      </div>

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
