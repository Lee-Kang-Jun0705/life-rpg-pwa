'use client'

import React, { useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useDashboard } from '@/hooks/useDashboard'
import { LoadingState } from '@/components/dashboard/LoadingState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { useLevelUpDetection } from '@/hooks/useLevelUpDetection'

// 동적 임포트 - 테스트 환경을 위해 fallback 추가
const EnhancedVoiceInput = dynamic(
  () => import('@/components/voice/EnhancedVoiceInput').then(mod => ({ default: mod.EnhancedVoiceInput })).catch(() => {
    // 로드 실패 시 빈 컴포넌트 반환
    console.warn('EnhancedVoiceInput failed to load')
    return { default: () => null }
  }),
  {
    loading: () => (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className="w-14 h-14 bg-primary/10 rounded-full animate-pulse" />
      </div>
    ),
    ssr: false
  }
)

const DashboardClient: React.FC = () => {
  const {
    stats,
    loading,
    error,
    isProcessing,
    loadUserData,
    handleStatAction,
    handleVoiceInput,
    calculatedStats
  } = useDashboard()

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
      levelUpData={levelUpData}
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

export default React.memo(DashboardClient)
