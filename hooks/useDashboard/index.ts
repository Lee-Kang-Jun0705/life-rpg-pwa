import { useState, useEffect, useCallback } from 'react'
import { useDataLoader } from './useDataLoader'
import { useStatUpdater } from './useStatUpdater'
import { useCalculatedStats } from './useCalculatedStats'
import { generateRandomExperience } from '@/lib/types/dashboard'
import { Stat } from '@/lib/types/dashboard'
import type { UseDashboardReturn } from './types'
import type { UserProfile } from '@/lib/database/types'

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<Stat[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStats, setProcessingStats] = useState<Set<string>>(new Set())
  
  // 분리된 훅들 사용
  const { loadUserData } = useDataLoader(setStats, setLoading, setError, setProfile)
  const { updateStat } = useStatUpdater(stats, setStats, processingStats, setProcessingStats)
  const calculatedStats = useCalculatedStats(stats)
  
  // 초기 로드
  useEffect(() => {
    loadUserData()
  }, []) // 의도적으로 의존성 배열 비움
  
  // 스탯 클릭 핸들러
  const handleStatClick = useCallback(async (statType: string) => {
    const experience = generateRandomExperience()
    await updateStat(statType, experience, '직접 활동')
  }, [updateStat])
  
  // 음성 입력 핸들러
  const handleVoiceInput = useCallback(async (transcript: string, activityType?: string | null) => {
    // activityType이 직접 전달된 경우 (스탯 선택 후 녹음)
    if (activityType) {
      const experience = generateRandomExperience()
      console.log('🎤 Voice input with selected stat:', { activityType, transcript, experience })
      await updateStat(activityType, experience, transcript)
      return
    }
    
    // activityType이 없는 경우 키워드 매칭 (레거시 지원)
    const lowerTranscript = transcript.toLowerCase()
    const statTypeMap: Record<string, string> = {
      '건강': 'health',
      '학습': 'learning',
      '관계': 'relationship',
      '성취': 'achievement'
    }
    
    // 매칭되는 스탯 찾기
    for (const [korean, english] of Object.entries(statTypeMap)) {
      if (lowerTranscript.includes(korean)) {
        const experience = generateRandomExperience()
        console.log('🎤 Voice input with keyword match:', { statType: english, transcript, experience })
        await updateStat(english, experience, transcript)
        return
      }
    }
    
    console.log('No matching stat type found in:', transcript)
  }, [updateStat])
  
  // 스탯 액션 핸들러
  const handleStatAction = useCallback(async (statType: string, action: string) => {
    const experience = generateRandomExperience()
    await updateStat(statType, experience, action)
  }, [updateStat])
  
  return {
    // State
    stats,
    profile,
    loading,
    error,
    isProcessing: processingStats,
    
    // Actions
    loadUserData,
    handleStatClick,
    handleVoiceInput,
    handleStatAction,
    retry: loadUserData,
    updateStat,
    
    // Computed
    calculatedStats
  }
}