// 업적 서비스
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { RewardService } from '@/lib/rewards/reward-service'
import type {
  Achievement,
  AchievementSystemState,
  AchievementProgress,
  AchievementStats,
  AchievementNotification,
  AchievementFilter,
  AchievementSortOption
} from '@/lib/types/achievements'
import { ACHIEVEMENTS } from './achievement-data'

export class AchievementService {
  private static instance: AchievementService

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService()
    }
    return AchievementService.instance
  }

  // 업적 시스템 초기화
  async initializeAchievements(userId: string): Promise<AchievementSystemState> {
    const savedState = await this.loadAchievementState(userId)

    if (savedState) {
      return savedState
    }

    // 새로운 업적 시스템 생성
    const achievements: Record<string, Achievement> = {}
    const progress: Record<string, AchievementProgress> = {}

    for (const achievement of ACHIEVEMENTS) {
      achievements[achievement.id] = { ...achievement }
      progress[achievement.id] = {
        achievementId: achievement.id,
        current: 0,
        target: achievement.condition.count || achievement.condition.target as number || 1,
        percentage: 0,
        lastUpdated: new Date()
      }
    }

    const newState: AchievementSystemState = {
      achievements,
      progress,
      notifications: [],
      stats: this.calculateStats(achievements),
      lastUpdated: new Date()
    }

    await this.saveAchievementState(userId, newState)
    return newState
  }

  // 업적 진행도 업데이트
  async updateProgress(
    userId: string,
    conditionType: string,
    value: number | string,
    increment = 1
  ): Promise<string[]> {
    const state = await this.loadAchievementState(userId)
    if (!state) {
      return []
    }

    const newlyUnlocked: string[] = []

    for (const achievement of Object.values(state.achievements)) {
      if (achievement.isUnlocked) {
        continue
      }

      // 선행 조건 확인
      if (achievement.prerequisites) {
        const prerequisitesMet = achievement.prerequisites.every(
          prereqId => state.achievements[prereqId]?.isUnlocked
        )
        if (!prerequisitesMet) {
          continue
        }
      }

      // 조건 매칭
      if (!this.matchesCondition(achievement.condition, conditionType, value)) {
        continue
      }

      const progressEntry = state.progress[achievement.id]
      if (!progressEntry) {
        continue
      }

      // 진행도 업데이트
      progressEntry.current = Math.min(
        progressEntry.current + increment,
        progressEntry.target
      )
      progressEntry.percentage = (progressEntry.current / progressEntry.target) * 100
      progressEntry.lastUpdated = new Date()

      // 업적 달성 확인
      if (progressEntry.percentage >= 100 && !achievement.isUnlocked) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()
        newlyUnlocked.push(achievement.id)

        // 알림 추가
        state.notifications.push({
          id: `notif_${achievement.id}_${Date.now()}`,
          achievementId: achievement.id,
          type: 'unlocked',
          timestamp: new Date(),
          isRead: false
        })

        // 보상 지급
        await this.grantRewards(userId, achievement.rewards)
      } else if (progressEntry.percentage > 0) {
        // 진행도 알림 (특정 마일스톤에서만)
        const milestones = [25, 50, 75]
        const currentMilestone = Math.floor(progressEntry.percentage / 25) * 25

        if (milestones.includes(currentMilestone)) {
          const existingNotif = state.notifications.find(
            n => n.achievementId === achievement.id &&
                 n.type === 'progress'
          )

          if (!existingNotif) {
            state.notifications.push({
              id: `notif_progress_${achievement.id}_${Date.now()}`,
              achievementId: achievement.id,
              type: 'progress',
              timestamp: new Date(),
              isRead: false
            })
          }
        }
      }
    }

    // 통계 업데이트
    state.stats = this.calculateStats(state.achievements)
    state.lastUpdated = new Date()

    await this.saveAchievementState(userId, state)
    return newlyUnlocked
  }

  // 조건 매칭 확인
  private matchesCondition(
    condition: Achievement['condition'],
    triggerType: string,
    value: number | string
  ): boolean {
    // 기본 타입 매칭
    if (condition.type !== triggerType) {
      return false
    }

    // 대상 매칭 (있는 경우)
    if (condition.target && condition.target !== value) {
      return false
    }

    return true
  }

  // 보상 지급
  private async grantRewards(userId: string, rewards: Achievement['rewards']): Promise<void> {
    try {
      const rewardService = RewardService.getInstance()

      // 보상 번들 생성
      const rewardBundle = {
        exp: rewards.exp,
        energy: rewards.energy,
        currency: rewards.gold ? { gold: rewards.gold } : undefined,
        items: rewards.items,
        stats: rewards.stat ? {
          [rewards.stat.type]: rewards.stat.value
        } : undefined
      }

      // 보상 지급
      await rewardService.grantRewards(userId, rewardBundle, '업적 달성')

      // 특별 보상 처리 (칭호, 특별 아이템 등)
      if (rewards.title) {
        console.log(`✅ 칭호 "${rewards.title}" 획득!`)
        // 칭호 시스템 연동 시 여기에 구현
      }

      if (rewards.specialReward) {
        console.log(`✅ 특별 보상 획득:`, rewards.specialReward)
        // 특별 보상 시스템 연동 시 여기에 구현
      }

    } catch (error) {
      console.error('업적 보상 지급 실패:', error)
      throw error
    }
  }

  // 통계 계산
  private calculateStats(achievements: Record<string, Achievement>): AchievementStats {
    const achievementList = Object.values(achievements)
    const unlockedList = achievementList.filter(a => a.isUnlocked)

    const stats: AchievementStats = {
      totalAchievements: achievementList.length,
      unlockedAchievements: unlockedList.length,
      completionRate: Math.floor((unlockedList.length / achievementList.length) * 100),
      categoryStats: [],
      difficultyStats: [],
      totalRewardsEarned: {
        exp: 0,
        gold: 0,
        items: 0,
        titles: 0
      }
    }

    // 카테고리별 통계
    const categories = new Set(achievementList.map(a => a.category))
    for (const category of categories) {
      const categoryAchievements = achievementList.filter(a => a.category === category)
      const categoryUnlocked = categoryAchievements.filter(a => a.isUnlocked)

      stats.categoryStats.push({
        category,
        total: categoryAchievements.length,
        unlocked: categoryUnlocked.length
      })
    }

    // 난이도별 통계
    const difficulties = new Set(achievementList.map(a => a.difficulty))
    for (const difficulty of difficulties) {
      const difficultyAchievements = achievementList.filter(a => a.difficulty === difficulty)
      const difficultyUnlocked = difficultyAchievements.filter(a => a.isUnlocked)

      stats.difficultyStats.push({
        difficulty,
        total: difficultyAchievements.length,
        unlocked: difficultyUnlocked.length
      })
    }

    // 총 보상 계산
    for (const achievement of unlockedList) {
      stats.totalRewardsEarned.exp += achievement.rewards.exp || 0
      stats.totalRewardsEarned.gold += achievement.rewards.gold || 0
      stats.totalRewardsEarned.items += achievement.rewards.items?.length || 0
      stats.totalRewardsEarned.titles += achievement.rewards.title ? 1 : 0
    }

    return stats
  }

  // 업적 필터링 및 정렬
  filterAndSortAchievements(
    achievements: Record<string, Achievement>,
    filter: AchievementFilter,
    sortBy: AchievementSortOption,
    progress: Record<string, AchievementProgress>
  ): Achievement[] {
    let filtered = Object.values(achievements)

    // 필터링
    if (filter.category && filter.category.length > 0) {
      filtered = filtered.filter(a => filter.category!.includes(a.category))
    }

    if (filter.difficulty && filter.difficulty.length > 0) {
      filtered = filtered.filter(a => filter.difficulty!.includes(a.difficulty))
    }

    if (filter.unlocked !== undefined) {
      filtered = filtered.filter(a => a.isUnlocked === filter.unlocked)
    }

    if (filter.hidden !== undefined) {
      filtered = filtered.filter(a => (a.isHidden || false) === filter.hidden)
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        case 'difficulty':
          const difficultyOrder = ['easy', 'normal', 'hard', 'expert', 'legendary']
          return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty)
        case 'progress':
          const progressA = progress[a.id]?.percentage || 0
          const progressB = progress[b.id]?.percentage || 0
          return progressB - progressA
        case 'unlock_date':
          if (!a.unlockedAt && !b.unlockedAt) {
            return 0
          }
          if (!a.unlockedAt) {
            return 1
          }
          if (!b.unlockedAt) {
            return -1
          }
          return b.unlockedAt.getTime() - a.unlockedAt.getTime()
        default:
          return 0
      }
    })

    return filtered
  }

  // 알림 읽음 처리
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const state = await this.loadAchievementState(userId)
    if (!state) {
      return
    }

    const notification = state.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
      await this.saveAchievementState(userId, state)
    }
  }

  // 모든 알림 읽음 처리
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const state = await this.loadAchievementState(userId)
    if (!state) {
      return
    }

    state.notifications.forEach(n => n.isRead = true)
    await this.saveAchievementState(userId, state)
  }

  // 상태 저장
  private async saveAchievementState(userId: string, state: AchievementSystemState): Promise<void> {
    const { dbHelpers } = await import('@/lib/database')
    await dbHelpers.saveAchievementState(userId, state)
    console.log('✅ Saved achievement state for user:', userId)
  }

  // 상태 로드
  private async loadAchievementState(userId: string): Promise<AchievementSystemState | null> {
    const { dbHelpers } = await import('@/lib/database')
    const state = await dbHelpers.loadAchievementState(userId)

    if (!state) {
      // 기본 상태 생성
      const defaultState: AchievementSystemState = {
        achievements: ACHIEVEMENTS.reduce((acc, achievement) => {
          acc[achievement.id] = achievement
          return acc
        }, {} as Record<string, Achievement>),
        progress: {},
        notifications: [],
        stats: {
          totalAchievements: ACHIEVEMENTS.length,
          unlockedAchievements: 0,
          completionRate: 0,
          categoryStats: [],
          difficultyStats: [],
          totalRewardsEarned: {
            exp: 0,
            gold: 0,
            items: 0,
            titles: 0
          }
        },
        lastUpdated: new Date()
      }
      await this.saveAchievementState(userId, defaultState)
      return defaultState
    }

    // 날짜 객체 복원
    return {
      ...state,
      lastUpdated: new Date(state.lastUpdated)
    }
  }

  // public 메서드로 상태 가져오기 (외부에서 사용)
  async getAchievementState(): Promise<AchievementSystemState | null> {
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    return this.loadAchievementState(userId)
  }
}

export const achievementService = AchievementService.getInstance()
