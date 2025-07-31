import { getClientDatabase } from './client-only'
import type { Stat } from './types'

/**
 * 중복된 스탯을 정리하는 함수
 * 각 타입별로 가장 높은 레벨과 경험치를 가진 스탯만 남기고 나머지는 삭제
 */
export async function cleanupDuplicateStats(userId: string): Promise<{
  removed: number
  kept: Record<string, Stat>
}> {
  const db = await getClientDatabase()
  
  // 해당 사용자의 모든 스탯 가져오기
  const allStats = await db.stats.where('userId').equals(userId).toArray()
  
  console.log('[cleanupDuplicateStats] 전체 스탯 개수:', allStats.length)
  
  // 타입별로 그룹화
  const statsByType = new Map<string, Stat[]>()
  allStats.forEach(stat => {
    const existing = statsByType.get(stat.type) || []
    existing.push(stat)
    statsByType.set(stat.type, existing)
  })
  
  // 중복 확인 및 정리 대상 선정
  const toKeep = new Map<string, Stat>()
  const toRemove: number[] = []
  
  statsByType.forEach((stats, type) => {
    console.log(`[cleanupDuplicateStats] ${type} 타입 스탯 개수:`, stats.length)
    
    if (stats.length === 1) {
      // 중복 없음
      toKeep.set(type, stats[0])
    } else {
      // 중복 있음 - 가장 높은 레벨/경험치를 가진 것만 유지
      const bestStat = stats.reduce((best, current) => {
        if (current.level > best.level) return current
        if (current.level === best.level && current.experience > best.experience) return current
        if (current.level === best.level && current.experience === best.experience &&
            current.totalActivities > best.totalActivities) return current
        return best
      })
      
      toKeep.set(type, bestStat)
      
      // 나머지는 삭제 대상
      stats.forEach(stat => {
        if (stat.id && stat.id !== bestStat.id) {
          toRemove.push(stat.id)
        }
      })
    }
  })
  
  // 중복 스탯 삭제
  if (toRemove.length > 0) {
    console.log('[cleanupDuplicateStats] 삭제할 중복 스탯:', toRemove.length)
    for (const id of toRemove) {
      await db.stats.delete(id)
    }
  }
  
  const result = {
    removed: toRemove.length,
    kept: Object.fromEntries(toKeep)
  }
  
  console.log('[cleanupDuplicateStats] 정리 완료:', result)
  
  return result
}

/**
 * 모든 사용자의 중복 스탯을 정리
 */
export async function cleanupAllUsersDuplicateStats(): Promise<{
  totalRemoved: number
  userCount: number
}> {
  const db = await getClientDatabase()
  
  // 모든 고유 사용자 ID 가져오기
  const allStats = await db.stats.toArray()
  const userIds = [...new Set(allStats.map(s => s.userId))]
  
  let totalRemoved = 0
  
  for (const userId of userIds) {
    const result = await cleanupDuplicateStats(userId)
    totalRemoved += result.removed
  }
  
  return {
    totalRemoved,
    userCount: userIds.length
  }
}