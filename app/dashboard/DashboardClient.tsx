'use client'

import React, { useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { DashboardProvider, useDashboardContext } from '@/contexts/DashboardContext'
import { LoadingState } from '@/components/dashboard/LoadingState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { useLevelUpDetection } from '@/hooks/useLevelUpDetection'

// 동적 임포트 - 간단한 wrapper 사용
const EnhancedVoiceInput = dynamic(
  () => import('@/components/voice/EnhancedVoiceInputWrapper'),
  {
    loading: () => (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className="w-14 h-14 bg-primary/10 rounded-full animate-pulse" />
      </div>
    ),
    ssr: false
  }
)

// 개선된 음성 입력 컴포넌트
const ImprovedVoiceInput = dynamic(
  () => import('@/components/voice/ImprovedVoiceInput').then(mod => ({ default: mod.ImprovedVoiceInput })),
  {
    loading: () => (
      <div className="fixed bottom-24 right-6">
        <div className="w-14 h-14 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse" />
      </div>
    ),
    ssr: false
  }
)

const DashboardClientInner: React.FC = () => {
  const {
    stats,
    loading,
    error,
    isProcessing,
    loadUserData,
    handleStatAction,
    handleVoiceInput,
    calculatedStats
  } = useDashboardContext()

  // 레벨업 감지 훅
  const { levelUpData, detectLevelUp, clearLevelUpAnimation } = useLevelUpDetection(stats)

  // 에러 로깅
  React.useEffect(() => {
    if (error) {
      console.error('[Dashboard] Error:', error)
    }
  }, [error])

  // 스탯 액션 핸들러 (레벨업 감지 포함)
  const handleStatActionWithLevelUp = useCallback(
    async(type: string, action: string) => {
      const levelUpHandler = detectLevelUp(type, async() => handleStatAction(type, action))
      await levelUpHandler()
    },
    [detectLevelUp, handleStatAction]
  )

  // 음성 입력 에러 핸들러
  const handleVoiceError = useCallback((error: Error) => {
    console.error('[Voice Input] Error:', error)
  }, [])
  
  // 디버깅을 위한 전역 함수 설정
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { testVoiceInput: (text: string, statType?: string) => void }).testVoiceInput = (text: string, statType?: string) => {
        console.log('🧪 테스트 음성 입력 시작:', { text, statType })
        handleVoiceInput(text, statType || null)
      }
      console.log('💡 음성 입력 테스트: window.testVoiceInput("오늘 30분 운동했어요", "health")')
    }
  }, [handleVoiceInput])

  // 메모이제이션된 content props
  const contentProps = useMemo(() => ({
    stats,
    calculatedStats,
    isProcessing,
    onStatAction: handleStatActionWithLevelUp
  }), [stats, calculatedStats, isProcessing, handleStatActionWithLevelUp])

  // 조기 반환 - 로딩 상태
  if (loading) {
    return <LoadingState />
  }

  // 조기 반환 - 에러 상태
  if (error) {
    return <ErrorState error={error} onRetry={loadUserData} />
  }

  return (
    <DashboardLayout
      _levelUpData={levelUpData}
      onLevelUpComplete={clearLevelUpAnimation}
    >
      <DashboardContent {...contentProps} />

      {/* 음성 입력 버튼 */}
      <EnhancedVoiceInput
        onTranscript={handleVoiceInput}
        onError={handleVoiceError}
      />
    </DashboardLayout>
  )
}

const DashboardClient: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardClientInner />
    </DashboardProvider>
  )
}

export default React.memo(DashboardClient)
