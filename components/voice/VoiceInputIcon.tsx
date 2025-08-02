'use client'

import { cn } from '@/lib/utils'

interface VoiceInputIconProps {
  isSupported: boolean
  error: Error | null
  isListening: boolean
  status: string
  pulseAnimation: boolean
}

export function VoiceInputIcon({
  isSupported,
  error,
  isListening,
  status,
  pulseAnimation
}: VoiceInputIconProps) {
  const getIcon = () => {
    if (!isSupported) {
      return '🚫'
    }
    if (error) {
      return '❌'
    }
    if (isListening) {
      if (status === 'processing') {
        return '🎤'
      }
      if (status === 'analyzing') {
        return '🤔'
      }
      return '👂'
    }
    return '🎙️'
  }

  const getStatusText = () => {
    if (!isSupported) {
      return '음성 인식 지원 안됨'
    }
    if (error) {
      return '오류 발생'
    }
    if (isListening) {
      if (status === 'processing') {
        return '처리 중...'
      }
      if (status === 'analyzing') {
        return '분석 중...'
      }
      return '듣고 있어요...'
    }
    return '음성으로 활동 기록'
  }

  return (
    <>
      <span className={cn(
        'text-2xl transition-transform',
        isListening && 'animate-pulse'
      )}>
        {getIcon()}
      </span>

      {/* 펄스 애니메이션 */}
      {pulseAnimation && isListening && (
        <div className="absolute inset-0 rounded-full animate-ping
                      bg-indigo-400 dark:bg-indigo-600 opacity-75" />
      )}

      <span className="sr-only">{getStatusText()}</span>
    </>
  )
}
