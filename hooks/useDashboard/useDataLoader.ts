import { useCallback, useRef } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { Stat } from '@/lib/types/dashboard'
import type { UserProfile } from '@/lib/database/types'

export function useDataLoader(
  setStats: (stats: Stat[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setProfile?: (profile: UserProfile | null) => void
) {
  const loadingRef = useRef(false)

  const loadUserData = useCallback(async () => {
    // 서버사이드에서는 실행하지 않음
    if (typeof window === 'undefined') return
    
    // 이미 로딩 중이면 무시
    if (loadingRef.current) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      // 프로필 확인
      let profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
      
      if (!profile) {
        await dbHelpers.initializeUserData(
          GAME_CONFIG.DEFAULT_USER_ID,
          GAME_CONFIG.DEFAULT_USER_EMAIL,
          GAME_CONFIG.DEFAULT_USER_NAME
        )
        profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
      }
      
      // 프로필 설정
      if (setProfile && profile) {
        setProfile(profile)
      }
      
      // 스탯 로드
      let userStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
      
      // 중복 제거
      if (userStats && userStats.length > 0) {
        const uniqueTypes = new Set(userStats.map(s => s.type)).size
        if (userStats.length > uniqueTypes) {
          await dbHelpers.removeDuplicateStats(GAME_CONFIG.DEFAULT_USER_ID)
          userStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        }
      }
      
      // 기본 스탯 생성
      if (!userStats || userStats.length === 0) {
        await dbHelpers.initializeUserData(
          GAME_CONFIG.DEFAULT_USER_ID,
          GAME_CONFIG.DEFAULT_USER_EMAIL,
          GAME_CONFIG.DEFAULT_USER_NAME
        )
        userStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
      }
      
      setStats(userStats || [])
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : '데이터를 불러오는데 실패했습니다.'
      
      setError(errorMessage)
      setStats([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [setStats, setLoading, setError, setProfile])

  return { loadUserData }
}