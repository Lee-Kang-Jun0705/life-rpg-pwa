/**
 * 컬렉션(도감) 시스템 서비스
 * 몬스터 도감 관리 및 보상 처리
 */

import type {
  MonsterCollectionEntry,
  CollectionReward,
  CollectionCategory,
  CollectionStats,
  CollectionFilter,
  CollectionSortOption,
  CollectionAchievement,
  CollectionState
} from '@/lib/types/collection'
import type { MonsterData } from '@/lib/types/monster'
import { dbHelpers } from '@/lib/database'
import { MONSTER_TEMPLATES, getMonsterData } from '@/lib/data/monsters'
import { characterIntegrationService } from './character-integration.service'
// import { Toast } from '@/lib/contexts/ToastContext'

// 컬렉션 카테고리 정의
const COLLECTION_CATEGORIES: CollectionCategory[] = [
  {
    id: 'slimes',
    name: '슬라임 계열',
    description: '다양한 슬라임 몬스터를 수집하세요',
    monsterIds: ['slime', 'ice_slime', 'fire_slime', 'poison_slime'],
    rewards: [
      {
        id: 'slime_5',
        name: '슬라임 사냥꾼',
        description: '슬라임 5종 발견',
        requiredCount: 5,
        rewards: { exp: 100, gold: 500 },
        isClaimed: false
      },
      {
        id: 'slime_master',
        name: '슬라임 마스터',
        description: '모든 슬라임 처치',
        requiredCount: 4,
        rewards: { exp: 500, title: '슬라임 정복자' },
        isClaimed: false
      }
    ]
  },
  {
    id: 'undead',
    name: '언데드 계열',
    description: '어둠의 언데드를 정복하세요',
    monsterIds: ['skeleton_warrior', 'skeleton_archer', 'zombie', 'vampire', 'lich'],
    rewards: [
      {
        id: 'undead_hunter',
        name: '언데드 사냥꾼',
        description: '언데드 10종 처치',
        requiredCount: 10,
        rewards: { exp: 300, stat: { type: 'attack', value: 5 } },
        isClaimed: false
      }
    ]
  },
  {
    id: 'dragons',
    name: '드래곤 계열',
    description: '전설의 드래곤을 수집하세요',
    monsterIds: ['wyvern', 'fire_dragon', 'ice_dragon', 'dark_dragon'],
    rewards: [
      {
        id: 'dragon_slayer',
        name: '드래곤 슬레이어',
        description: '모든 드래곤 처치',
        requiredCount: 4,
        rewards: { exp: 2000, title: '용사', stat: { type: 'hp', value: 50 } },
        isClaimed: false
      }
    ]
  }
]

// 도감 업적 정의
const COLLECTION_ACHIEVEMENTS: CollectionAchievement[] = [
  {
    id: 'first_discovery',
    name: '첫 발견',
    description: '첫 번째 몬스터 발견',
    icon: '🔍',
    condition: { type: 'discover', count: 1 },
    rewards: { exp: 50 },
    isUnlocked: false
  },
  {
    id: 'monster_hunter_10',
    name: '초보 사냥꾼',
    description: '10종의 몬스터 처치',
    icon: '🏹',
    condition: { type: 'defeat', count: 10 },
    rewards: { exp: 200, gold: 1000 },
    isUnlocked: false
  },
  {
    id: 'monster_hunter_50',
    name: '숙련된 사냥꾼',
    description: '50종의 몬스터 처치',
    icon: '⚔️',
    condition: { type: 'defeat', count: 50 },
    rewards: { exp: 1000, gold: 5000, title: '몬스터 헌터' },
    isUnlocked: false
  },
  {
    id: 'kill_count_100',
    name: '백인참수',
    description: '총 100마리 처치',
    icon: '💀',
    condition: { type: 'kill_count', count: 100 },
    rewards: { exp: 500 },
    isUnlocked: false
  },
  {
    id: 'complete_category',
    name: '카테고리 마스터',
    description: '하나의 카테고리 완성',
    icon: '🏆',
    condition: { type: 'category_complete', count: 1 },
    rewards: { exp: 1000, title: '수집가' },
    isUnlocked: false
  }
]

class CollectionService {
  private static instance: CollectionService
  private state: CollectionState = {
    entries: {},
    categories: COLLECTION_CATEGORIES,
    achievements: COLLECTION_ACHIEVEMENTS,
    lastUpdated: new Date()
  }
  private userId = 'current-user'
  private initialized = false

  static getInstance(): CollectionService {
    if (!this.instance) {
      this.instance = new CollectionService()
    }
    return this.instance
  }

  /**
   * 서비스 초기화
   */
  async initialize(userId = 'current-user'): Promise<void> {
    if (this.initialized && this.userId === userId) {
      return
    }

    this.userId = userId
    await this.loadFromDB()
    this.initialized = true
  }

  /**
   * DB에서 컬렉션 데이터 로드
   */
  private async loadFromDB(): Promise<void> {
    try {
      const data = await dbHelpers.getCollectionState(this.userId)
      if (data) {
        this.state = {
          entries: data.entries || {},
          categories: data.categories || COLLECTION_CATEGORIES,
          achievements: data.achievements || COLLECTION_ACHIEVEMENTS,
          lastUpdated: data.lastUpdated || new Date()
        }
      }
    } catch (error) {
      console.error('Failed to load collection data:', error)
    }
  }

  /**
   * DB에 컬렉션 데이터 저장
   */
  private async saveToDB(): Promise<void> {
    try {
      await dbHelpers.saveCollectionState(this.userId, this.state)
    } catch (error) {
      console.error('Failed to save collection data:', error)
    }
  }

  /**
   * 몬스터 조우 기록
   */
  async recordMonsterEncounter(monsterId: string): Promise<void> {
    const entry = this.state.entries[monsterId] || {
      monsterId,
      killCount: 0,
      lastSeenAt: new Date(),
      isDiscovered: false,
      isDefeated: false
    }

    if (!entry.isDiscovered) {
      entry.isDiscovered = true
      entry.firstEncounteredAt = new Date()

      // Toast.show({
      //   message: `새로운 몬스터 발견! ${MONSTER_TEMPLATES[monsterId]?.name || monsterId}`,
      //   type: 'success'
      // })

      // 업적 체크
      await this.checkAchievements()
    }

    entry.lastSeenAt = new Date()
    this.state.entries[monsterId] = entry
    await this.saveToDB()
  }

  /**
   * 몬스터 처치 기록
   */
  async recordMonsterDefeat(monsterId: string): Promise<void> {
    const entry = this.state.entries[monsterId] || {
      monsterId,
      killCount: 0,
      lastSeenAt: new Date(),
      isDiscovered: true,
      isDefeated: false
    }

    if (!entry.isDefeated) {
      entry.isDefeated = true
      entry.firstDefeatedAt = new Date()

      // Toast.show({
      //   message: `첫 처치! ${MONSTER_TEMPLATES[monsterId]?.name || monsterId}`,
      //   type: 'success'
      // })
    }

    entry.killCount++
    entry.lastSeenAt = new Date()
    this.state.entries[monsterId] = entry

    // 카테고리 보상 체크
    await this.checkCategoryRewards()

    // 업적 체크
    await this.checkAchievements()

    await this.saveToDB()
  }

  /**
   * 카테고리 보상 체크 및 지급
   */
  private async checkCategoryRewards(): Promise<void> {
    for (const category of this.state.categories) {
      const progress = this.getCategoryProgress(category.id)

      for (const reward of category.rewards) {
        if (!reward.isClaimed && progress.defeated >= reward.requiredCount) {
          await this.claimReward(category.id, reward.id)
        }
      }
    }
  }

  /**
   * 업적 체크 및 달성
   */
  private async checkAchievements(): Promise<void> {
    const stats = this.getCollectionStats()

    for (const achievement of this.state.achievements) {
      if (achievement.isUnlocked) {
        continue
      }

      let isAchieved = false

      switch (achievement.condition.type) {
        case 'discover':
          isAchieved = stats.discoveredMonsters >= (achievement.condition.count || 0)
          break
        case 'defeat':
          isAchieved = stats.defeatedMonsters >= (achievement.condition.count || 0)
          break
        case 'kill_count':
          isAchieved = stats.totalKills >= (achievement.condition.count || 0)
          break
        case 'category_complete':
          const completedCategories = stats.categoryProgress.filter(
            p => p.discovered === p.total
          ).length
          isAchieved = completedCategories >= (achievement.condition.count || 0)
          break
      }

      if (isAchieved) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()

        // 보상 지급
        if (achievement.rewards.exp) {
          await characterIntegrationService.addExperience(this.userId, achievement.rewards.exp)
        }
        if (achievement.rewards.gold) {
          await characterIntegrationService.addGold(this.userId, achievement.rewards.gold)
        }

        // Toast.show({
        //   message: `업적 달성! ${achievement.name}`,
        //   type: 'success'
        // })
      }
    }
  }

  /**
   * 보상 수령
   */
  async claimReward(categoryId: string, rewardId: string): Promise<boolean> {
    const category = this.state.categories.find(c => c.id === categoryId)
    if (!category) {
      return false
    }

    const reward = category.rewards.find(r => r.id === rewardId)
    if (!reward || reward.isClaimed) {
      return false
    }

    // 보상 지급
    if (reward.rewards.exp) {
      await characterIntegrationService.addExperience(this.userId, reward.rewards.exp)
    }
    if (reward.rewards.gold) {
      await characterIntegrationService.addGold(this.userId, reward.rewards.gold)
    }
    if (reward.rewards.stat) {
      // TODO: 스탯 보상 적용
    }

    reward.isClaimed = true
    await this.saveToDB()

    // Toast.show({
    //   message: `보상 획득! ${reward.name}`,
    //   type: 'success'
    // })

    return true
  }

  /**
   * 컬렉션 통계 조회
   */
  getCollectionStats(): CollectionStats {
    const entries = Object.values(this.state.entries)
    const totalMonsters = Object.keys(MONSTER_TEMPLATES).length

    const stats: CollectionStats = {
      totalMonsters,
      discoveredMonsters: entries.filter(e => e.isDiscovered).length,
      defeatedMonsters: entries.filter(e => e.isDefeated).length,
      totalKills: entries.reduce((sum, e) => sum + e.killCount, 0),
      completionRate: 0,
      categoryProgress: []
    }

    stats.completionRate = (stats.defeatedMonsters / totalMonsters) * 100

    // 카테고리별 진행도
    for (const category of this.state.categories) {
      const progress = this.getCategoryProgress(category.id)
      stats.categoryProgress.push({
        categoryId: category.id,
        discovered: progress.discovered,
        total: category.monsterIds.length
      })
    }

    return stats
  }

  /**
   * 카테고리 진행도 조회
   */
  getCategoryProgress(categoryId: string): { discovered: number; defeated: number; total: number } {
    const category = this.state.categories.find(c => c.id === categoryId)
    if (!category) {
      return { discovered: 0, defeated: 0, total: 0 }
    }

    let discovered = 0
    let defeated = 0

    for (const monsterId of category.monsterIds) {
      const entry = this.state.entries[monsterId]
      if (entry?.isDiscovered) {
        discovered++
      }
      if (entry?.isDefeated) {
        defeated++
      }
    }

    return { discovered, defeated, total: category.monsterIds.length }
  }

  /**
   * 필터링된 몬스터 목록 조회
   */
  getFilteredMonsters(
    filter: CollectionFilter,
    sortBy: CollectionSortOption = 'id',
    ascending = true
  ): Array<{ monster: MonsterData; entry?: MonsterCollectionEntry }> {
    let monsters = Object.entries(MONSTER_TEMPLATES).map(([id, template]) => ({
      monster: getMonsterData(id, 1), // 레벨 1 기준
      entry: this.state.entries[id]
    }))

    // 필터링
    if (filter.discovered !== undefined) {
      monsters = monsters.filter(m =>
        filter.discovered ? m.entry?.isDiscovered : !m.entry?.isDiscovered
      )
    }

    if (filter.defeated !== undefined) {
      monsters = monsters.filter(m =>
        filter.defeated ? m.entry?.isDefeated : !m.entry?.isDefeated
      )
    }

    if (filter.category && filter.category.length > 0) {
      const categoryMonsterIds = new Set<string>()
      for (const categoryId of filter.category) {
        const category = this.state.categories.find(c => c.id === categoryId)
        if (category) {
          category.monsterIds.forEach(id => categoryMonsterIds.add(id))
        }
      }
      monsters = monsters.filter(m => categoryMonsterIds.has(m.monster.id))
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      monsters = monsters.filter(m =>
        m.monster.name.toLowerCase().includes(query) ||
        (m.monster.description?.toLowerCase().includes(query) ?? false)
      )
    }

    // 정렬
    monsters.sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'name':
          compareValue = a.monster.name.localeCompare(b.monster.name)
          break
        case 'level':
          compareValue = a.monster.level - b.monster.level
          break
        case 'kills':
          compareValue = (a.entry?.killCount || 0) - (b.entry?.killCount || 0)
          break
        case 'discovered':
          compareValue = (a.entry?.isDiscovered ? 1 : 0) - (b.entry?.isDiscovered ? 1 : 0)
          break
        case 'id':
        default:
          compareValue = a.monster.id.localeCompare(b.monster.id)
      }

      return ascending ? compareValue : -compareValue
    })

    return monsters
  }

  /**
   * 모든 컬렉션 데이터 조회
   */
  getCollectionState(): CollectionState {
    return this.state
  }

  /**
   * 특정 몬스터 엔트리 조회
   */
  getMonsterEntry(monsterId: string): MonsterCollectionEntry | null {
    return this.state.entries[monsterId] || null
  }

  /**
   * 카테고리 목록 조회
   */
  getCategories(): CollectionCategory[] {
    return this.state.categories
  }

  /**
   * 업적 목록 조회
   */
  getAchievements(): CollectionAchievement[] {
    return this.state.achievements
  }
}

export const collectionService = CollectionService.getInstance()
