import { useCallback, useRef } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { Stat, GAME_CONFIG, calculateLevel } from '@/lib/types/dashboard'
import { calculateCharacterLevel, getUniqueStats, debugStats } from '@/lib/utils/level-calculator'

export function useStatUpdater(
  stats: Stat[],
  setStats: (stats: Stat[]) => void,
  processingStats: Set<string>,
  setProcessingStats: (stats: Set<string>) => void
) {
  // 최근 처리된 활동을 추적하여 중복 방지
  const recentActivitiesRef = useRef<Map<string, number>>(new Map())
  
  const updateStat = useCallback(async(
    statType: string,
    experience: number,
    activityName = '활동 기록'
  ) => {
    console.warn('📊📊📊 updateStat 호출됨:', {
      statType,
      experience,
      activityName,
      isDefaultName: activityName === '활동 기록'
    })
    
    // 중복 처리 방지 - 동일한 활동이 1초 이내에 다시 처리되는 것을 방지
    const activityKey = `${statType}-${activityName}-${experience}`
    const lastProcessed = recentActivitiesRef.current.get(activityKey)
    const now = Date.now()
    
    if (lastProcessed && now - lastProcessed < 1000) {
      console.warn('📊📊📊 중복 활동 감지, 무시:', activityKey)
      return
    }
    
    // 이미 처리 중인 스탯은 무시
    if (processingStats.has(statType)) {
      console.warn('📊📊📊 이미 처리 중인 스탯:', statType)
      return
    }
    
    // 최근 활동 기록
    recentActivitiesRef.current.set(activityKey, now)
    
    // 10초 후 기록 제거 (재시도 가능하도록)
    setTimeout(() => {
      recentActivitiesRef.current.delete(activityKey)
    }, 10000)

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

          const newTotalActivities = (stat.totalActivities || 0) + 1
          console.log(`📊 Updating stat ${statType}: totalActivities ${stat.totalActivities} -> ${newTotalActivities}`)

          return {
            ...stat,
            experience: newExperience,
            level: newLevel,
            totalActivities: newTotalActivities
          }
        }
        return stat
      })

      console.log('📊 Updated stats:', updatedStats)
      setStats(updatedStats)

      // DB에 저장
      console.log('💾 Saving activity to DB:', {
        statType,
        activityName,
        experience
      })

      const activityData = {
        userId: GAME_CONFIG.DEFAULT_USER_ID,
        statType: statType as Stat['type'],
        activityName,
        experience,
        timestamp: new Date(),
        synced: false
      }
      
      console.warn('💾💾💾 DB에 저장할 activityData:', {
        ...activityData,
        activityNameLength: activityName.length,
        activityNamePreview: activityName.substring(0, 50)
      })
      
      const savedActivity = await dbHelpers.addActivity(activityData)

      console.log('✅ Activity saved:', savedActivity)
      
      // 스탯을 데이터베이스에 저장
      console.log('💾 Saving stats to DB')
      for (const stat of updatedStats) {
        await dbHelpers.saveStat(stat)
      }
      console.log('✅ Stats saved to DB')
      
      // 활동 추가 이벤트 발생 (UI 업데이트 트리거)
      console.log('📢 Dispatching activity-added event')
      window.dispatchEvent(new Event('activity-added'))

      // 프로필 경험치도 업데이트
      const profile = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
      if (profile) {
        const newProfileExp = (profile.experience || 0) + experience

        // 모든 스탯을 다시 불러와서 정확한 캐릭터 레벨 계산
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
        
        // 스탯 업데이트 이벤트도 발생 (모험 페이지 업데이트용)
        window.dispatchEvent(new Event('stats-updated'))
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
