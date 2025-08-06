/**
 * 캐릭터 총 레벨 계산을 위한 중앙화된 유틸리티
 * 모든 페이지에서 동일한 레벨 계산 로직 사용
 */

import type { Stat } from '@/lib/database/types'
import { calculateLevelFromExperience } from './stat-calculator'

/**
 * 스탯 배열에서 캐릭터 총 레벨 계산
 * 각 스탯의 경험치로부터 레벨을 계산하고 합산
 */
export function calculateTotalCharacterLevel(stats: Stat[]): number {
  if (!stats || stats.length === 0) {
    return 0
  }

  // 중복 제거 - 각 타입별로 가장 높은 경험치를 가진 스탯만 선택
  const uniqueStatsMap = new Map<string, Stat>()
  
  stats.forEach(stat => {
    const existing = uniqueStatsMap.get(stat.type)
    if (!existing || stat.experience > existing.experience) {
      uniqueStatsMap.set(stat.type, stat)
    }
  })

  // 각 스탯의 경험치로부터 레벨 계산 후 합산
  let totalLevel = 0
  uniqueStatsMap.forEach(stat => {
    const { level } = calculateLevelFromExperience(stat.experience || 0)
    totalLevel += level
  })

  return totalLevel
}

/**
 * 스탯 정보와 함께 상세 레벨 정보 반환
 */
export function getCharacterLevelDetails(stats: Stat[]) {
  const uniqueStatsMap = new Map<string, Stat>()
  
  stats.forEach(stat => {
    const existing = uniqueStatsMap.get(stat.type)
    if (!existing || stat.experience > existing.experience) {
      uniqueStatsMap.set(stat.type, stat)
    }
  })

  const levelDetails = {
    health: 0,
    learning: 0,
    relationship: 0,
    achievement: 0,
    total: 0
  }

  uniqueStatsMap.forEach((stat, type) => {
    const { level } = calculateLevelFromExperience(stat.experience || 0)
    levelDetails[type as keyof typeof levelDetails] = level
    levelDetails.total += level
  })

  return levelDetails
}

/**
 * 디버깅용 레벨 정보 출력
 */
export function debugCharacterLevel(stats: Stat[], source: string) {
  console.log(`[${source}] 캐릭터 레벨 디버깅:`)
  
  const details = getCharacterLevelDetails(stats)
  console.log('- 건강:', details.health)
  console.log('- 학습:', details.learning)
  console.log('- 관계:', details.relationship)
  console.log('- 성취:', details.achievement)
  console.log('- 총 레벨:', details.total)
  
  return details
}