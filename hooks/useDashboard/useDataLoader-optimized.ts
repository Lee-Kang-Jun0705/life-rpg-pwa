import { useCallback, useRef } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { Stat } from '@/lib/types/dashboard'
import type { UserProfile } from '@/lib/database/types'

const DUPLICATE_CHECK_KEY = 'dashboard_duplicate_check_done'
const DUPLICATE_CHECK_EXPIRY = 24 * 60 * 60 * 1000 // 24시간

export function useDataLoader(
  setStats: (stats: Stat[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setProfile?: (profile: UserProfile | null) => void
) {
  const loadingRef = useRef(false)

  const loadUserData = useCallback(async() => {
    // 서버사이드에서는 실행하지 않음
    if (typeof window === 'undefined') {
      return
    }

    // 이미 로딩 중이면 무시
    if (loadingRef.current) {
      return
    }

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // 병렬로 프로필과 스탯 로드
      const [profile, userStats] = await Promise.all([
        dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID),
        dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
      ])

      // 프로필이 없으면 초기화
      if (!profile) {
        await dbHelpers.initializeUserData(
          GAME_CONFIG.DEFAULT_USER_ID,
          GAME_CONFIG.DEFAULT_USER_EMAIL,
          GAME_CONFIG.DEFAULT_USER_NAME
        )
        
        // 초기화 후 다시 병렬 로드
        const [newProfile, newStats] = await Promise.all([
          dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID),
          dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        ])
        
        if (setProfile && newProfile) {
          setProfile(newProfile)
        }
        setStats(newStats || [])
      } else {
        // 프로필 설정
        if (setProfile) {
          setProfile(profile)
        }

        // 중복 체크는 24시간에 한 번만
        const duplicateCheckDone = localStorage.getItem(DUPLICATE_CHECK_KEY)
        const checkTimestamp = duplicateCheckDone ? parseInt(duplicateCheckDone) : 0
        const now = Date.now()

        if (userStats && userStats.length > 0) {
          // 중복 체크가 필요한 경우에만 수행
          if (!duplicateCheckDone || now - checkTimestamp > DUPLICATE_CHECK_EXPIRY) {
            const uniqueTypes = new Set(userStats.map(s => s.type)).size
            if (userStats.length > uniqueTypes) {
              // 백그라운드에서 중복 제거 수행
              dbHelpers.removeDuplicateStats(GAME_CONFIG.DEFAULT_USER_ID).then(() => {
                // 중복 제거 완료 후 플래그 설정
                localStorage.setItem(DUPLICATE_CHECK_KEY, now.toString())
              }).catch(console.error)
            } else {
              // 중복이 없으면 플래그만 설정
              localStorage.setItem(DUPLICATE_CHECK_KEY, now.toString())
            }
          }
        }

        // 스탯이 없으면 초기화
        if (!userStats || userStats.length === 0) {
          await dbHelpers.initializeUserData(
            GAME_CONFIG.DEFAULT_USER_ID,
            GAME_CONFIG.DEFAULT_USER_EMAIL,
            GAME_CONFIG.DEFAULT_USER_NAME
          )
          const newStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
          setStats(newStats || [])
        } else {
          setStats(userStats)
        }
      }

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