import { useCallback } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { Stat, GAME_CONFIG, calculateLevel } from '@/lib/types/dashboard'
import { calculateCharacterLevel, getUniqueStats, debugStats } from '@/lib/utils/level-calculator'

export function useStatUpdater(
  stats: Stat[],
  setStats: (stats: Stat[]) => void,
  processingStats: Set<string>,
  setProcessingStats: (stats: Set<string>) => void
) {
  const updateStat = useCallback(async(
    statType: string,
    experience: number,
    activityName = '활동 기록'
  ) => {
    // 이미 처리 중인 스탯은 무시
    if (processingStats.has(statType)) {
      return
    }

    // 처리 시작
    setProcessingStats(new Set(processingStats).add(statType))
    const originalStats = [...stats]

    try {
      // 낙관적 업데이트
      let hasLevelUp = false
      const updatedStats = stats.map(stat => {
        if (stat.type === statType) {
          const newExperience = (stat.experience || 0) + experience
          const { level: newLevel } = calculateLevel(newExperience)

          if (newLevel > (stat.level || 1)) {
            hasLevelUp = true
          }

          return {
            ...stat,
            experience: newExperience,
            level: newLevel,
            totalActivities: (stat.totalActivities || 0) + 1
          }
        }
        return stat
      })

      setStats(updatedStats)

      // DB에 저장
      console.log('💾 Saving activity to DB:', {
        statType,
        activityName,
        experience
      })

      const savedActivity = await dbHelpers.addActivity({
        userId: GAME_CONFIG.DEFAULT_USER_ID,
        statType: statType as Stat['type'],
        activityName,
        experience,
        timestamp: new Date(),
        synced: false
      })

      console.log('✅ Activity saved:', savedActivity)

      // 프로필 경험치도 업데이트
      const profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
      if (profile) {
        const newProfileExp = (profile.experience || 0) + experience

        // 중앙화된 레벨 계산 함수 사용
        const allStats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        const characterLevel = calculateCharacterLevel(allStats)

        // 디버깅 정보 출력
        debugStats(allStats, 'useStatUpdater')

        await dbHelpers.updateProfile(GAME_CONFIG.DEFAULT_USER_ID, {
          experience: newProfileExp,
          totalExperience: newProfileExp,
          level: characterLevel
        })

        // 프로필 업데이트 이벤트 발생
        window.dispatchEvent(new Event('profile-updated'))
      }

      return hasLevelUp

    } catch (error) {
      // 롤백
      setStats(originalStats)
      throw error
    } finally {
      // 처리 완료
      const newProcessing = new Set(processingStats)
      newProcessing.delete(statType)
      setProcessingStats(newProcessing)
    }
  }, [stats, setStats, processingStats, setProcessingStats])

  return { updateStat }
}
