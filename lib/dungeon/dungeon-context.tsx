'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DungeonService } from './dungeon-service'
import { Dungeon, DungeonProgress, DungeonStats, DungeonReward } from './types'

interface DungeonContextType {
  dungeons: Dungeon[]
  currentProgress: DungeonProgress | null
  dungeonStats: DungeonStats | null
  isLoading: boolean
  error: string | null
  refreshDungeons: () => Promise<void>
  enterDungeon: (dungeonId: string) => Promise<boolean>
  completeChallenge: (dungeonId: string, challengeId: string) => Promise<{ success: boolean; completed?: boolean; rewards?: DungeonReward }>
  updateChallengeProgress: (dungeonId: string, challengeId: string, value: number) => Promise<boolean>
  exitDungeon: () => void
}

const DungeonContext = createContext<DungeonContextType | undefined>(undefined)

export function DungeonProvider({ children }: { children: React.ReactNode }) {
  const [dungeons, setDungeons] = useState<Dungeon[]>([])
  const [currentProgress, setCurrentProgress] = useState<DungeonProgress | null>(null)
  const [dungeonStats, setDungeonStats] = useState<DungeonStats | null>(null)
  const [isLoading, setIsLoading] = useState(false) // 초기값을 false로 변경하여 빠른 렌더링
  const [error, setError] = useState<string | null>(null)
  
  // 임시로 하드코딩된 사용자 정보 사용
  const userId = 'local-user'
  const userLevel = 10 // 임시 레벨
  const dungeonService = DungeonService.getInstance()

  const refreshDungeons = useCallback(async (forceReload = false) => {
    // 이미 로딩 중인 경우 중복 호출 방지
    if (isLoading && !forceReload) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // 던전 리셋 체크
      await dungeonService.resetDungeons()
      
      // 사용 가능한 던전 목록 가져오기
      const availableDungeons = await dungeonService.getAvailableDungeons(
        userId,
        userLevel
      )
      setDungeons(availableDungeons)
      
      // 던전 통계 가져오기
      const stats = await dungeonService.getDungeonStats(userId)
      setDungeonStats(stats)
    } catch (err) {
      console.error('Failed to refresh dungeons:', err)
      setError(err instanceof Error ? err.message : '던전을 불러오는데 실패했습니다')
      // 에러 시에도 기본 던전 제공
      setDungeons([])
      setDungeonStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userLevel, dungeonService])

  const enterDungeon = useCallback(async (dungeonId: string): Promise<boolean> => {
    try {
      const progress = await dungeonService.enterDungeon(dungeonId, userId)
      if (progress) {
        setCurrentProgress(progress)
        // 던전 입장 후 던전 목록 새로고침 (에너지 소비 반영)
        setTimeout(() => refreshDungeons(true), 100)
        return true
      }
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '던전 입장에 실패했습니다'
      setError(errorMessage)
      
      // 에너지 부족 오류는 즉시 던전 목록 새로고침
      if (errorMessage.includes('에너지')) {
        refreshDungeons(true)
      }
      
      return false
    }
  }, [userId, dungeonService, refreshDungeons])

  const completeChallenge = useCallback(async (
    dungeonId: string, 
    challengeId: string
  ): Promise<{ success: boolean; completed?: boolean; rewards?: DungeonReward }> => {
    try {
      const result = await dungeonService.completeChallenge(
        dungeonId,
        challengeId,
        userId
      )
      
      if (result.success) {
        // 던전 목록 새로고침 (강제 리로드) - 완료 후에만
        setTimeout(() => refreshDungeons(true), 100)
        
        // 현재 진행 상황 업데이트
        if (currentProgress?.dungeonId === dungeonId) {
          const updatedProgress = { ...currentProgress }
          updatedProgress.completedChallenges.push(challengeId)
          updatedProgress.totalProgress = 
            (updatedProgress.completedChallenges.length / 
            (dungeons.find(d => d.id === dungeonId)?.challenges.length || 1)) * 100
          
          if (updatedProgress.totalProgress >= 100) {
            updatedProgress.status = 'completed'
            setCurrentProgress(null) // 던전 완료 시 진행 상황 초기화
          } else {
            setCurrentProgress(updatedProgress)
          }
        }
      }
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : '도전 과제 완료에 실패했습니다')
      return { success: false }
    }
  }, [userId, dungeonService, currentProgress, dungeons, refreshDungeons])

  const updateChallengeProgress = useCallback(async (
    dungeonId: string,
    challengeId: string,
    value: number
  ): Promise<boolean> => {
    try {
      const success = await dungeonService.updateChallengeProgress(
        dungeonId,
        challengeId,
        userId,
        value
      )
      
      if (success) {
        // 던전 목록 새로고침 - 지연 실행으로 무한 루프 방지
        setTimeout(() => refreshDungeons(), 100)
      }
      
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '진행 상황 업데이트에 실패했습니다')
      return false
    }
  }, [userId, dungeonService, refreshDungeons])

  const exitDungeon = useCallback(() => {
    setCurrentProgress(null)
  }, [])

  // 초기 로드 (한 번만)
  useEffect(() => {
    let mounted = true
    
    const loadInitialData = async () => {
      if (mounted) {
        await refreshDungeons()
      }
    }
    
    loadInitialData()
    
    return () => {
      mounted = false
    }
  }, []) // 의존성 배열 비움으로 한 번만 실행

  // 일일 리셋을 위한 타이머 (한 번만 설정)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const checkReset = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const timeUntilReset = tomorrow.getTime() - now.getTime()
      
      timeoutId = setTimeout(() => {
        refreshDungeons(true) // 강제 리로드
        checkReset() // 다음 리셋 예약
      }, timeUntilReset)
    }
    
    checkReset()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, []) // 의존성 배열 비움으로 한 번만 실행

  const value: DungeonContextType = {
    dungeons,
    currentProgress,
    dungeonStats,
    isLoading,
    error,
    refreshDungeons,
    enterDungeon,
    completeChallenge,
    updateChallengeProgress,
    exitDungeon
  }

  return (
    <DungeonContext.Provider value={value}>
      {children}
    </DungeonContext.Provider>
  )
}

export function useDungeon() {
  const context = useContext(DungeonContext)
  if (context === undefined) {
    throw new Error('useDungeon must be used within a DungeonProvider')
  }
  return context
}