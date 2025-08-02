import { useMemo } from 'react'
import { Stat } from '@/lib/types/dashboard'
import { CalculatedStats } from './types'
import { calculateCharacterInfo, debugStats } from '@/lib/utils/level-calculator'

export function useCalculatedStats(stats: Stat[]): CalculatedStats {
  return useMemo(() => {
    if (!stats.length) {
      return { totalLevel: 0, totalExp: 0, totalActivities: 0, maxLevel: 1 }
    }

    // 중앙화된 레벨 계산 함수 사용
    const info = calculateCharacterInfo(stats)

    // 디버깅 정보 출력
    debugStats(stats, 'useCalculatedStats')

    const result = {
      totalLevel: info.level,
      totalExp: info.totalExperience,
      totalActivities: info.uniqueStats.reduce((sum, stat) => sum + (stat.totalActivities || 0), 0),
      maxLevel: Math.max(...info.uniqueStats.map(s => s.level || 1))
    }

    return result
  }, [stats])
}
