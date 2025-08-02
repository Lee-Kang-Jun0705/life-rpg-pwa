import type { Stat } from '@/lib/database/types'

/**
 * 스탯 배열에서 중복을 제거하고 각 타입별로 가장 높은 레벨의 스탯만 반환
 */
export function getUniqueStats(stats: Stat[]): Stat[] {
  const uniqueStatsMap = new Map<string, Stat>()

  stats.forEach(stat => {
    const existing = uniqueStatsMap.get(stat.type)
    if (!existing ||
        stat.level > existing.level ||
        (stat.level === existing.level && stat.experience > existing.experience)) {
      uniqueStatsMap.set(stat.type, stat)
    }
  })

  return Array.from(uniqueStatsMap.values())
}

/**
 * 스탯 배열에서 전체 경험치 합계 계산
 */
export function calculateTotalExperience(stats: Stat[]): number {
  const uniqueStats = getUniqueStats(stats)
  return uniqueStats.reduce((total, stat) => total + stat.experience, 0)
}

/**
 * 스탯 배열에서 캐릭터 레벨 계산
 * 캐릭터 레벨 = 모든 스탯 레벨의 합계
 */
export function calculateCharacterLevel(stats: Stat[]): number {
  const uniqueStats = getUniqueStats(stats)
  return uniqueStats.reduce((total, stat) => total + stat.level, 0)
}

/**
 * 스탯 정보를 포함한 전체 캐릭터 정보 계산
 */
export function calculateCharacterInfo(stats: Stat[]) {
  const uniqueStats = getUniqueStats(stats)
  const totalExp = calculateTotalExperience(stats)
  const characterLevel = calculateCharacterLevel(stats)

  return {
    level: characterLevel,
    totalExperience: totalExp,
    currentLevelExp: 0, // 캐릭터 레벨은 스탯 레벨 합산이므로 개별 경험치 개념 없음
    nextLevelExp: 0, // 캐릭터 레벨은 스탯 레벨 합산이므로 개별 경험치 개념 없음
    uniqueStats,
    statSummary: {
      health: uniqueStats.find(s => s.type === 'health')?.level || 0,
      learning: uniqueStats.find(s => s.type === 'learning')?.level || 0,
      relationship: uniqueStats.find(s => s.type === 'relationship')?.level || 0,
      achievement: uniqueStats.find(s => s.type === 'achievement')?.level || 0
    }
  }
}

/**
 * 디버깅용 스탯 정보 출력
 */
export function debugStats(stats: Stat[], source: string) {
  console.log(`[${source}] 스탯 디버깅 정보:`)
  console.log(`- 전체 스탯 개수: ${stats.length}`)

  const uniqueStats = getUniqueStats(stats)
  console.log(`- 중복 제거 후: ${uniqueStats.length}`)

  uniqueStats.forEach(stat => {
    console.log(`  ${stat.type}: Lv.${stat.level} (${stat.experience} EXP)`)
  })

  const info = calculateCharacterInfo(stats)
  console.log(`- 캐릭터 레벨: ${info.level}`)
  console.log(`- 총 경험치: ${info.totalExperience}`)
}
