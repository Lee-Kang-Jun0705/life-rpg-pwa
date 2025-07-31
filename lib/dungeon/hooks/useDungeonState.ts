import { useState, useCallback, useEffect } from 'react'
import { Dungeon, DungeonProgress, DungeonStatus, DungeonItem } from '../types'
import { DungeonService } from '../dungeon-service'
import { DungeonRepository } from '../dungeon-repository'

interface DungeonRewards {
  exp: number
  gold: number
  items: DungeonItem[]
}

interface UseDungeonStateReturn {
  dungeons: Dungeon[]
  activeProgress: DungeonProgress[]
  selectedDungeon: Dungeon | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadDungeons: () => Promise<void>
  selectDungeon: (dungeonId: string) => void
  enterDungeon: (dungeonId: string) => Promise<boolean>
  exitDungeon: (dungeonId: string) => Promise<void>
  updateProgress: (dungeonId: string, updates: Partial<DungeonProgress>) => Promise<void>
  completeDungeon: (dungeonId: string, rewards: DungeonRewards) => Promise<void>
}

export function useDungeonState(userId: string): UseDungeonStateReturn {
  const [dungeons, setDungeons] = useState<Dungeon[]>([])
  const [activeProgress, setActiveProgress] = useState<DungeonProgress[]>([])
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 던전 목록 로드
  const loadDungeons = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 던전 목록 가져오기
      const dungeonService = DungeonService.getInstance()
      const dungeonList = await dungeonService.getAvailableDungeons(userId)
      setDungeons(dungeonList)

      // 진행 중인 던전 가져오기
      const progress = await DungeonRepository.getActiveProgress(userId)
      setActiveProgress(progress)
    } catch (err) {
      console.error('[useDungeonState] loadDungeons error:', err)
      setError('던전 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 던전 선택
  const selectDungeon = useCallback((dungeonId: string) => {
    const dungeon = dungeons.find(d => d.id === dungeonId)
    setSelectedDungeon(dungeon || null)
  }, [dungeons])

  // 던전 입장
  const enterDungeon = useCallback(async (dungeonId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const dungeonService = DungeonService.getInstance()
      const success = await dungeonService.enterDungeon(dungeonId, userId)
      if (success) {
        await loadDungeons() // 상태 새로고침
      }
      
      return success
    } catch (err) {
      console.error('[useDungeonState] enterDungeon error:', err)
      setError('던전 입장에 실패했습니다')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, loadDungeons])

  // 던전 퇴장
  const exitDungeon = useCallback(async (dungeonId: string) => {
    try {
      setIsLoading(true)
      
      await DungeonRepository.updateProgress(dungeonId, userId, {
        status: 'abandoned' as DungeonStatus
      })
      
      await loadDungeons()
    } catch (err) {
      console.error('[useDungeonState] exitDungeon error:', err)
      setError('던전 퇴장에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [userId, loadDungeons])

  // 진행 상황 업데이트
  const updateProgress = useCallback(async (
    dungeonId: string, 
    updates: Partial<DungeonProgress>
  ) => {
    try {
      await DungeonRepository.updateProgress(dungeonId, userId, updates)
      
      // 로컬 상태 업데이트
      setActiveProgress(prev => 
        prev.map(p => 
          p.dungeonId === dungeonId 
            ? { ...p, ...updates } 
            : p
        )
      )
    } catch (err) {
      console.error('[useDungeonState] updateProgress error:', err)
    }
  }, [userId])

  // 던전 완료
  const completeDungeon = useCallback(async (dungeonId: string, rewards: DungeonRewards) => {
    try {
      setIsLoading(true)
      
      const dungeonService = DungeonService.getInstance()
      await dungeonService.completeDungeon(dungeonId, userId, rewards)
      await loadDungeons()
      
      setSelectedDungeon(null)
    } catch (err) {
      console.error('[useDungeonState] completeDungeon error:', err)
      setError('던전 완료 처리에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [userId, loadDungeons])

  // 초기 로드
  useEffect(() => {
    loadDungeons()
  }, [loadDungeons])

  return {
    dungeons,
    activeProgress,
    selectedDungeon,
    isLoading,
    error,
    loadDungeons,
    selectDungeon,
    enterDungeon,
    exitDungeon,
    updateProgress,
    completeDungeon
  }
}