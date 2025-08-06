import { useMemo } from 'react'
import { Stat } from '@/lib/types/dashboard'
import { CalculatedStats } from './types'
import { calculateTotalCharacterLevel, getCharacterLevelDetails, debugCharacterLevel } from '@/lib/utils/character-level'

export function useCalculatedStats(stats: Stat[]): CalculatedStats {
  return useMemo(() => {
    if (!stats.length) {
      return { totalLevel: 0, totalExp: 0, totalActivities: 0, maxLevel: 1 }
    }

    // 통합된 캐릭터 레벨 계산 함수 사용
    const totalLevel = calculateTotalCharacterLevel(stats)
    const levelDetails = getCharacterLevelDetails(stats)
    
    // 디버깅 정보 출력
    if (process.env.NODE_ENV === 'development') {
      debugCharacterLevel(stats, 'Dashboard')
    }

    // 총 경험치와 활동 수 계산
    const totalExp = stats.reduce((sum, stat) => sum + (stat.experience || 0), 0)
    const totalActivities = stats.reduce((sum, stat) => sum + (stat.totalActivities || 0), 0)

    const result = {
      totalLevel,
      totalExp,
      totalActivities,
      maxLevel: Math.max(levelDetails.health, levelDetails.learning, levelDetails.relationship, levelDetails.achievement, 1)
    }

    return result
  }, [stats])
}
