import { memoryCache } from '@/lib/cache/memory-cache'
import { db } from './client'

/**
 * 최적화된 데이터베이스 쿼리
 * 캐싱과 인덱스를 활용하여 성능 향상
 */

// 사용자 통계 조회 (캐싱 적용)
export async function getOptimizedUserStats(userId: string) {
  const cacheKey = `user-stats:${userId}`
  
  // 캐시 확인
  const cached = memoryCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // DB 조회
  const stats = await db.stats
    .where('userId')
    .equals(userId)
    .toArray()

  // 캐시 저장 (5분)
  memoryCache.set(cacheKey, stats, 300000)
  
  return stats
}

// 최근 활동 조회 (페이지네이션 + 캐싱)
export async function getOptimizedRecentActivities(
  userId: string, 
  limit: number = 10,
  offset: number = 0
) {
  const cacheKey = `activities:${userId}:${limit}:${offset}`
  
  // 캐시 확인
  const cached = memoryCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // DB 조회 - 인덱스 활용
  const activities = await db.activities
    .where('userId')
    .equals(userId)
    .reverse() // 최신순
    .offset(offset)
    .limit(limit)
    .toArray()

  // 캐시 저장 (2분)
  memoryCache.set(cacheKey, activities, 120000)
  
  return activities
}

// 캐릭터 정보 조회 (자주 변경되지 않으므로 긴 캐시)
export async function getOptimizedCharacter(userId: string) {
  const cacheKey = `character:${userId}`
  
  // 캐시 확인
  const cached = memoryCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // DB 조회
  const character = await db.characters
    .where('userId')
    .equals(userId)
    .first()

  if (character) {
    // 캐시 저장 (10분)
    memoryCache.set(cacheKey, character, 600000)
  }
  
  return character
}

// 배치 조회 최적화
export async function getOptimizedBatchData(userId: string) {
  // 병렬로 여러 데이터 조회
  const [stats, character, recentActivities] = await Promise.all([
    getOptimizedUserStats(userId),
    getOptimizedCharacter(userId),
    getOptimizedRecentActivities(userId, 5)
  ])

  return {
    stats,
    character,
    recentActivities
  }
}

// 캐시 무효화 함수들
export function invalidateUserCache(userId: string) {
  memoryCache.deletePattern(`.*:${userId}.*`)
}

export function invalidateStatsCache(userId: string) {
  memoryCache.delete(`user-stats:${userId}`)
}

export function invalidateActivitiesCache(userId: string) {
  memoryCache.deletePattern(`activities:${userId}:.*`)
}

export function invalidateCharacterCache(userId: string) {
  memoryCache.delete(`character:${userId}`)
}