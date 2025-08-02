import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG, STAT_TYPES } from '@/lib/types/dashboard'
import { Stat } from '@/lib/types/dashboard'
import { AICoachService } from './ai-coach-service'
import type {
  GrowthAnalysis,
  ActivityPattern,
  PersonalizedAdvice,
  ChartDataPoint
} from './types'

// 초기 상태 정의
const INITIAL_STATE = {
  userStats: [] as Stat[],
  growthData: [] as ChartDataPoint[],
  growthAnalyses: [] as GrowthAnalysis[],
  activityPattern: null as ActivityPattern | null,
  personalizedAdvice: [] as PersonalizedAdvice[],
  isLoading: true,
  error: null as string | null
}

export function useAICoach() {
  const [state, setState] = useState(INITIAL_STATE)
  const isMountedRef = useRef(true)
  const isInitializedRef = useRef(false)
  const aiCoachService = useMemo(() => new AICoachService(), [])

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<typeof INITIAL_STATE>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  // 기본 스탯 생성
  const createDefaultStats = useCallback((): Stat[] => {
    return STAT_TYPES.map(statType => ({
      userId: GAME_CONFIG.DEFAULT_USER_ID,
      type: statType.type,
      level: 1,
      experience: 0,
      totalActivities: 0,
      updatedAt: new Date()
    }))
  }, [])

  // 초기 데이터 로드 (프로필 및 스탯)
  const initializeUserData = useCallback(async() => {
    try {
      // 프로필 확인
      const profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)

      if (!profile) {
        console.log('🆕 Initializing new user data...')
        await dbHelpers.initializeUserData(
          GAME_CONFIG.DEFAULT_USER_ID,
          GAME_CONFIG.DEFAULT_USER_EMAIL,
          GAME_CONFIG.DEFAULT_USER_NAME
        )
      }

      // 스탯 로드
      let stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)

      if (!stats || stats.length === 0) {
        console.log('📊 Creating default stats...')
        const defaultStats = createDefaultStats()

        await Promise.all(
          defaultStats.map(stat => dbHelpers.saveStat(stat))
        )

        stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
      }

      return stats
    } catch (error) {
      console.error('Failed to initialize user data:', error)
      throw error
    }
  }, [createDefaultStats])

  // 분석 데이터 로드 (병렬 처리)
  const loadAnalysisData = useCallback(async(stats: Stat[]) => {
    try {
      // 병렬로 데이터 로드
      const [chartData, analyses, pattern] = await Promise.all([
        aiCoachService.getGrowthChartData(GAME_CONFIG.DEFAULT_USER_ID),
        aiCoachService.analyzeGrowth(GAME_CONFIG.DEFAULT_USER_ID, stats),
        aiCoachService.analyzeActivityPatterns(GAME_CONFIG.DEFAULT_USER_ID)
      ])

      // 맞춤형 조언은 다른 분석이 완료된 후 생성
      const advice = await aiCoachService.generatePersonalizedAdvice(
        GAME_CONFIG.DEFAULT_USER_ID,
        stats,
        analyses,
        pattern
      )

      return { chartData, analyses, pattern, advice }
    } catch (error) {
      console.error('Failed to load analysis data:', error)
      throw error
    }
  }, [aiCoachService])

  // 메인 데이터 로드 함수
  const loadData = useCallback(async() => {
    // 이미 초기화 중이거나 완료된 경우 skip
    if (!isMountedRef.current || isInitializedRef.current) {
      return
    }

    try {
      updateState({ isLoading: true, error: null })

      // 1단계: 사용자 데이터 초기화
      const stats = await initializeUserData()

      if (!isMountedRef.current) {
        return
      }

      // 상태 업데이트 (스탯만 먼저)
      updateState({ userStats: stats })

      // 2단계: 분석 데이터 로드 (병렬)
      const { chartData, analyses, pattern, advice } = await loadAnalysisData(stats)

      if (!isMountedRef.current) {
        return
      }

      // 최종 상태 업데이트
      updateState({
        growthData: chartData,
        growthAnalyses: analyses,
        activityPattern: pattern,
        personalizedAdvice: advice,
        isLoading: false
      })

      isInitializedRef.current = true
    } catch (err) {
      console.error('Failed to load AI coach data:', err)
      updateState({
        error: '데이터를 불러오는데 실패했습니다. 다시 시도해주세요.',
        isLoading: false
      })
    }
  }, [initializeUserData, loadAnalysisData, updateState])

  // 데이터 새로고침
  const refreshData = useCallback(async() => {
    if (!isMountedRef.current) {
      return
    }

    try {
      updateState({ isLoading: true, error: null })

      const stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
      if (!stats || stats.length === 0) {
        throw new Error('No stats found')
      }

      const { chartData, analyses, pattern, advice } = await loadAnalysisData(stats)

      updateState({
        userStats: stats,
        growthData: chartData,
        growthAnalyses: analyses,
        activityPattern: pattern,
        personalizedAdvice: advice,
        isLoading: false
      })
    } catch (err) {
      console.error('Failed to refresh data:', err)
      updateState({
        error: '데이터 새로고침에 실패했습니다.',
        isLoading: false
      })
    }
  }, [loadAnalysisData, updateState])

  // 초기 로드
  useEffect(() => {
    isMountedRef.current = true
    isInitializedRef.current = false

    // 약간의 지연 후 로드 (DB 초기화 대기)
    const timer = setTimeout(() => {
      loadData()
    }, 100)

    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
    }
  }, []) // loadData를 의존성에서 제외하여 무한 루프 방지

  return {
    userStats: state.userStats,
    growthData: state.growthData,
    growthAnalyses: state.growthAnalyses,
    activityPattern: state.activityPattern,
    personalizedAdvice: state.personalizedAdvice,
    isLoading: state.isLoading,
    error: state.error,
    refreshData
  }
}
