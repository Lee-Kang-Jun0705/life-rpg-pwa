'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Mic, MicOff, X, AlertCircle } from 'lucide-react'

interface ImprovedVoiceInputProps {
  onTranscript: (transcript: string, activityType: string) => void
  className?: string
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

// 활동 타입 감지 키워드
const ACTIVITY_KEYWORDS = {
  health: ['운동', '헬스', '달리기', '걷기', '요가', '수영', '축구', '농구', '자전거', '산책', '조깅'],
  learning: ['공부', '독서', '강의', '학습', '연습', '복습', '예습', '코딩', '프로그래밍', '읽기', '쓰기'],
  relationship: ['만남', '대화', '식사', '커피', '데이트', '모임', '파티', '통화', '친구', '가족'],
  achievement: ['완료', '달성', '성공', '합격', '우승', '완성', '마무리', '끝', '해냈', '성취']
}

// 활동 타입 자동 감지
function detectActivityType(transcript: string): string {
  const lowerText = transcript.toLowerCase()
  
  for (const [type, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return type
    }
  }
  
  // 기본값은 건강
  return 'health'
}

export const ImprovedVoiceInput = React.memo(function ImprovedVoiceInput({
  onTranscript,
  className
}: ImprovedVoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [detectedType, setDetectedType] = useState<string>('health')
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'ko-KR'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('🎤 음성 인식 시작')
          setError(null)
        }
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }
          
          const currentTranscript = finalTranscript || interimTranscript
          if (currentTranscript) {
            console.log('📝 인식된 텍스트:', currentTranscript)
            setTranscript(currentTranscript)
            
            // 활동 타입 자동 감지
            const type = detectActivityType(currentTranscript)
            setDetectedType(type)
            
            // 최종 결과가 있으면 자동으로 확인 화면 표시
            if (finalTranscript) {
              // 타임아웃 클리어
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              
              // 1초 후 자동으로 확인 화면 표시
              timeoutRef.current = setTimeout(() => {
                recognition.stop()
                setShowConfirm(true)
              }, 1000)
            }
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('❌ 음성 인식 에러:', event.error)
          setError(getErrorMessage(event.error))
          setIsListening(false)
        }
        
        recognition.onend = () => {
          console.log('🛑 음성 인식 종료')
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 에러 메시지 변환
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'network':
        return '네트워크 연결을 확인해주세요'
      case 'not-allowed':
        return '마이크 권한을 허용해주세요'
      case 'no-speech':
        return '음성이 감지되지 않았습니다'
      default:
        return '음성 인식에 실패했습니다'
    }
  }

  // 음성 인식 시작/중지
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('음성 인식을 지원하지 않는 브라우저입니다')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        // 마이크 권한 요청
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        setTranscript('')
        setError(null)
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('마이크 권한 오류:', err)
        setError('마이크 권한을 허용해주세요')
      }
    }
  }, [isListening])

  // 활동 저장
  const handleSave = useCallback(() => {
    if (transcript.trim()) {
      console.log('💾 활동 저장:', { transcript, type: detectedType })
      onTranscript(transcript, detectedType)
      
      // 상태 초기화
      setTranscript('')
      setShowConfirm(false)
      setDetectedType('health')
    }
  }, [transcript, detectedType, onTranscript])

  // 취소
  const handleCancel = useCallback(() => {
    setTranscript('')
    setShowConfirm(false)
    setDetectedType('health')
  }, [])

  // 활동 타입 변경
  const handleTypeChange = useCallback((type: string) => {
    setDetectedType(type)
  }, [])

  return (
    <>
      {/* 메인 버튼 */}
      <motion.button
        onClick={toggleListening}
        className={cn(
          'fixed bottom-24 right-6 p-4',
          'bg-gradient-to-r from-purple-500 to-pink-500',
          'text-white rounded-full shadow-lg',
          'hover:shadow-xl transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-purple-300',
          isListening && 'animate-pulse',
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </motion.button>

      {/* 녹음 중 상태 */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-44 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[200px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">녹음 중...</span>
            </div>
            {transcript && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {transcript}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-44 right-6 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-xl p-4"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 확인 화면 */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCancel}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">활동 기록 확인</h3>
              
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {transcript}
                </p>
              </div>

              {/* 활동 타입 선택 */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  활동 타입:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'health', name: '건강', emoji: '💪' },
                    { type: 'learning', name: '학습', emoji: '📚' },
                    { type: 'relationship', name: '관계', emoji: '👥' },
                    { type: 'achievement', name: '성취', emoji: '🏆' }
                  ].map(({ type, name, emoji }) => (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={cn(
                        'p-2 rounded-lg border-2 transition-all',
                        detectedType === type
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="ml-1 text-sm">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})