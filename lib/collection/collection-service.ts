// 몬스터 도감 서비스
import { dbHelpers } from '@/lib/database'
import type { 
  MonsterCollectionEntry, 
  CollectionState, 
  CollectionStats,
  CollectionFilter,
  CollectionSortOption 
} from '@/lib/types/collection'
import { COLLECTION_CATEGORIES, COLLECTION_ACHIEVEMENTS, COLLECTION_MILESTONES } from './collection-data'
import { MONSTER_DATABASE as MONSTERS } from '@/lib/battle/monster-database'

export class CollectionService {
  private static instance: CollectionService

  static getInstance(): CollectionService {
    if (!CollectionService.instance) {
      CollectionService.instance = new CollectionService()
    }
    return CollectionService.instance
  }

  // 도감 상태 초기화
  async initializeCollection(userId: string): Promise<CollectionState> {
    // DB에서 기존 데이터 로드
    const savedState = await this.loadCollectionState(userId)
    
    if (savedState) {
      return savedState
    }

    // 새로운 도감 생성
    const newState: CollectionState = {
      entries: {},
      categories: COLLECTION_CATEGORIES,
      achievements: COLLECTION_ACHIEVEMENTS,
      lastUpdated: new Date()
    }

    // 모든 몬스터에 대한 빈 엔트리 생성
    for (const monster of Object.values(MONSTERS)) {
      newState.entries[monster.id] = {
        monsterId: monster.id,
        killCount: 0,
        lastSeenAt: new Date(),
        isDiscovered: false,
        isDefeated: false
      }
    }

    await this.saveCollectionState(userId, newState)
    return newState
  }

  // 몬스터 조우 기록
  async recordMonsterEncounter(userId: string, monsterId: string): Promise<void> {
    const state = await this.loadCollectionState(userId)
    if (!state) return

    const entry = state.entries[monsterId]
    if (!entry) return

    // 첫 조우 기록
    if (!entry.isDiscovered) {
      entry.isDiscovered = true
      entry.firstEncounteredAt = new Date()
      
      // 발견 업적 확인
      await this.checkDiscoveryAchievements(userId, state)
    }

    entry.lastSeenAt = new Date()
    await this.saveCollectionState(userId, state)
  }

  // 몬스터 처치 기록
  async recordMonsterDefeat(userId: string, monsterId: string): Promise<{
    newAchievements?: string[]
    categoryRewards?: string[]
  }> {
    const state = await this.loadCollectionState(userId)
    if (!state) return {}

    const entry = state.entries[monsterId]
    if (!entry) return {}

    // 첫 처치 기록
    if (!entry.isDefeated) {
      entry.isDefeated = true
      entry.firstDefeatedAt = new Date()
    }

    entry.killCount++
    entry.lastSeenAt = new Date()

    // 발견되지 않았다면 발견 처리
    if (!entry.isDiscovered) {
      entry.isDiscovered = true
      entry.firstEncounteredAt = new Date()
    }

    // 업적 및 보상 확인
    const newAchievements = await this.checkKillAchievements(userId, state)
    const categoryRewards = await this.checkCategoryRewards(userId, state)

    await this.saveCollectionState(userId, state)

    return { newAchievements, categoryRewards }
  }

  // 도감 통계 계산
  calculateStats(state: CollectionState): CollectionStats {
    const entries = Object.values(state.entries)
    
    const stats: CollectionStats = {
      totalMonsters: entries.length,
      discoveredMonsters: entries.filter(e => e.isDiscovered).length,
      defeatedMonsters: entries.filter(e => e.isDefeated).length,
      totalKills: entries.reduce((sum, e) => sum + e.killCount, 0),
      completionRate: 0,
      categoryProgress: []
    }

    // 완성도 계산
    stats.completionRate = Math.floor((stats.defeatedMonsters / stats.totalMonsters) * 100)

    // 카테고리별 진행도
    for (const category of state.categories) {
      const categoryMonsters = category.monsterIds
      const discovered = categoryMonsters.filter(id => 
        state.entries[id]?.isDiscovered
      ).length

      stats.categoryProgress.push({
        categoryId: category.id,
        discovered,
        total: categoryMonsters.length
      })
    }

    return stats
  }

  // 몬스터 필터링 및 정렬
  filterAndSortMonsters(
    entries: Record<string, MonsterCollectionEntry>,
    filter: CollectionFilter,
    sortBy: CollectionSortOption
  ): MonsterCollectionEntry[] {
    let filtered = Object.values(entries)

    // 필터링
    if (filter.discovered !== undefined) {
      filtered = filtered.filter(e => e.isDiscovered === filter.discovered)
    }

    if (filter.defeated !== undefined) {
      filtered = filtered.filter(e => e.isDefeated === filter.defeated)
    }

    if (filter.category && filter.category.length > 0) {
      const categoryMonsterIds = new Set<string>()
      for (const categoryId of filter.category) {
        const category = COLLECTION_CATEGORIES.find(c => c.id === categoryId)
        if (category) {
          category.monsterIds.forEach(id => categoryMonsterIds.add(id))
        }
      }
      filtered = filtered.filter(e => categoryMonsterIds.has(e.monsterId))
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      filtered = filtered.filter(e => {
        const monster = MONSTERS[e.monsterId]
        return monster?.name.toLowerCase().includes(query) || 
               monster?.description?.toLowerCase().includes(query)
      })
    }

    // 정렬
    filtered.sort((a, b) => {
      const monsterA = MONSTERS[a.monsterId]
      const monsterB = MONSTERS[b.monsterId]

      switch (sortBy) {
        case 'name':
          return (monsterA?.name || '').localeCompare(monsterB?.name || '')
        case 'level':
          return (monsterB?.stats.level || 0) - (monsterA?.stats.level || 0)
        case 'kills':
          return b.killCount - a.killCount
        case 'discovered':
          return Number(b.isDiscovered) - Number(a.isDiscovered)
        default:
          return 0
      }
    })

    return filtered
  }

  // 발견 업적 확인
  private async checkDiscoveryAchievements(userId: string, state: CollectionState): Promise<string[]> {
    const unlockedAchievements: string[] = []
    const discoveredCount = Object.values(state.entries).filter(e => e.isDiscovered).length

    for (const achievement of state.achievements) {
      if (achievement.isUnlocked) continue

      if (achievement.condition.type === 'discover' && 
          achievement.condition.count && 
          discoveredCount >= achievement.condition.count) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()
        unlockedAchievements.push(achievement.id)
      }
    }

    return unlockedAchievements
  }

  // 처치 업적 확인
  private async checkKillAchievements(userId: string, state: CollectionState): Promise<string[]> {
    const unlockedAchievements: string[] = []
    const defeatedCount = Object.values(state.entries).filter(e => e.isDefeated).length
    const totalKills = Object.values(state.entries).reduce((sum, e) => sum + e.killCount, 0)

    for (const achievement of state.achievements) {
      if (achievement.isUnlocked) continue

      if (achievement.condition.type === 'defeat' && 
          achievement.condition.count && 
          defeatedCount >= achievement.condition.count) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()
        unlockedAchievements.push(achievement.id)
      }

      if (achievement.condition.type === 'kill_count' && 
          achievement.condition.count && 
          totalKills >= achievement.condition.count) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()
        unlockedAchievements.push(achievement.id)
      }
    }

    return unlockedAchievements
  }

  // 카테고리 보상 확인
  private async checkCategoryRewards(userId: string, state: CollectionState): Promise<string[]> {
    const claimedRewards: string[] = []

    for (const category of state.categories) {
      const categoryEntries = category.monsterIds.map(id => state.entries[id])
      const defeatedCount = categoryEntries.filter(e => e?.isDefeated).length

      for (const reward of category.rewards) {
        if (reward.isClaimed) continue

        if (defeatedCount >= reward.requiredCount) {
          reward.isClaimed = true
          claimedRewards.push(reward.id)

          // 카테고리 완료 업적 확인
          if (defeatedCount === category.monsterIds.length) {
            for (const achievement of state.achievements) {
              if (achievement.condition.type === 'category_complete' &&
                  achievement.condition.target === category.id &&
                  !achievement.isUnlocked) {
                achievement.isUnlocked = true
                achievement.unlockedAt = new Date()
              }
            }
          }
        }
      }
    }

    return claimedRewards
  }

  // 도감 상태 저장
  private async saveCollectionState(userId: string, state: CollectionState): Promise<void> {
    try {
      await dbHelpers.saveCollectionState(userId, state)
      console.log('✅ Collection state saved for user:', userId)
    } catch (error) {
      console.error('❌ Failed to save collection state:', error)
      throw error
    }
  }

  // 도감 상태 로드
  private async loadCollectionState(userId: string): Promise<CollectionState | null> {
    try {
      // For now, return null since we don't have persistent collection state storage
      // This would be implemented to load from database when available
      return null
    } catch (error) {
      console.error('❌ Failed to load collection state:', error)
      return null
    }
  }

  // 실제 DB 연동 메서드들
  async recordMonsterDefeatToDB(userId: string, monsterId: string): Promise<boolean> {
    try {
      // For now, just return true since we don't have persistent monster defeat storage
      // This would be implemented to save to database when available
      console.log('Recording monster defeat:', { userId, monsterId })
      return true
    } catch (error) {
      console.error('❌ Failed to record monster defeat:', error)
      return false
    }
  }

  async recordItemCollectionToDB(userId: string, itemId: string): Promise<boolean> {
    try {
      // For now, just return true since we don't have persistent item collection storage
      // This would be implemented to save to database when available
      console.log('Recording item collection:', { userId, itemId })
      return true
    } catch (error) {
      console.error('❌ Failed to record item collection:', error)
      return false
    }
  }

  async getCollectionProgress(userId: string): Promise<{
    monsters: unknown[]
    items: unknown[]
  }> {
    try {
      // For now, return empty arrays since we don't have persistent collection storage
      const monsters: unknown[] = []
      const items: unknown[] = []

      return { monsters, items }
    } catch (error) {
      console.error('❌ Failed to get collection progress:', error)
      return { monsters: [], items: [] }
    }
  }

  // 실제 몬스터 처치와 컬렉션 상태 동기화
  async syncMonsterDefeat(userId: string, monsterId: string): Promise<{
    newAchievements?: string[]
    categoryRewards?: string[]
    isFirstDefeat: boolean
  }> {
    try {
      // DB에 처치 기록
      const isFirstDefeat = await this.recordMonsterDefeatToDB(userId, monsterId)
      
      // 컬렉션 상태 업데이트
      const result = await this.recordMonsterDefeat(userId, monsterId)
      
      return {
        ...result,
        isFirstDefeat
      }
    } catch (error) {
      console.error('❌ Failed to sync monster defeat:', error)
      return { isFirstDefeat: false }
    }
  }

  // 실제 아이템 획득과 컬렉션 상태 동기화
  async syncItemCollection(userId: string, itemId: string): Promise<boolean> {
    try {
      return await this.recordItemCollectionToDB(userId, itemId)
    } catch (error) {
      console.error('❌ Failed to sync item collection:', error)
      return false
    }
  }
}