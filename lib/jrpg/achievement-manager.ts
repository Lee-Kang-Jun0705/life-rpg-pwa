// JRPG 도전과제 매니저
import { ACHIEVEMENT_DATABASE, type Achievement } from './achievements-database'
import { jrpgDbHelpers } from './database-helpers'
import { soundManager } from './sound-system'

export interface AchievementProgress {
  achievementId: string
  progress: number
  unlockedAt?: Date
  claimed: boolean
}

export interface AchievementStats {
  totalPoints: number
  unlockedCount: number
  totalCount: number
  categoryProgress: Record<string, { unlocked: number; total: number }>
}

export class JRPGAchievementManager {
  private userId: string
  private achievements: Map<string, AchievementProgress> = new Map()
  private stats: {
    totalKills: number
    criticalHits: number
    totalGoldEarned: number
    totalItemsCollected: number
    questsCompleted: number
    dungeonClears: Record<string, boolean>
    nightmareBossKills: number
    highestEnhancement: number
    skillsLearned: number
    consecutiveLogins: number
    lastLoginDate?: Date
  } = {
    totalKills: 0,
    criticalHits: 0,
    totalGoldEarned: 0,
    totalItemsCollected: 0,
    questsCompleted: 0,
    dungeonClears: {},
    nightmareBossKills: 0,
    highestEnhancement: 0,
    skillsLearned: 0,
    consecutiveLogins: 0
  }
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  // 도전과제 진행 상황 로드
  async loadProgress(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress) {
        // 도전과제 진행 상황 복원
        if (progress.achievementProgress) {
          Object.entries(progress.achievementProgress).forEach(([id, prog]) => {
            this.achievements.set(id, prog as AchievementProgress)
          })
        }
        
        // 통계 복원
        if (progress.achievementStats) {
          this.stats = { ...this.stats, ...progress.achievementStats }
        }
        
        // 베타 테스터 도전과제 자동 해금
        await this.checkAchievement('custom', 'beta_player', 1)
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error)
    }
  }
  
  // 도전과제 체크 및 업데이트
  async checkAchievement(type: string, target?: string, value: number = 1): Promise<Achievement[]> {
    const unlocked: Achievement[] = []
    
    // 통계 업데이트
    this.updateStats(type, target, value)
    
    // 모든 도전과제 확인
    for (const achievement of Object.values(ACHIEVEMENT_DATABASE)) {
      // 이미 해금된 도전과제 스킵
      const progress = this.achievements.get(achievement.id)
      if (progress?.unlockedAt) continue
      
      // 요구사항 확인
      const req = achievement.requirements
      let currentProgress = 0
      let isCompleted = false
      
      switch (req.type) {
        case 'kill_count':
          if (type === 'kill') {
            currentProgress = this.stats.totalKills
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'item_collect':
          if (type === 'item') {
            if (req.target === 'legendary' && target === 'legendary') {
              currentProgress = (progress?.progress || 0) + value
            } else if (!req.target) {
              currentProgress = this.stats.totalItemsCollected
            }
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'quest_complete':
          if (type === 'quest') {
            currentProgress = this.stats.questsCompleted
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'level_reach':
          if (type === 'level') {
            currentProgress = value
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'gold_earn':
          if (type === 'gold') {
            currentProgress = this.stats.totalGoldEarned
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'enhance_success':
          if (type === 'enhance') {
            currentProgress = value
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'skill_master':
          if (type === 'skill') {
            currentProgress = this.stats.skillsLearned
            isCompleted = currentProgress >= req.value
          }
          break
          
        case 'dungeon_clear':
          if (type === 'dungeon') {
            const clearedCount = Object.values(this.stats.dungeonClears).filter(v => v).length
            currentProgress = clearedCount
            isCompleted = req.target === 'all' ? clearedCount >= req.value : false
          }
          break
          
        case 'custom':
          if (type === 'custom' && req.target === target) {
            currentProgress = (progress?.progress || 0) + value
            isCompleted = currentProgress >= req.value
          }
          break
      }
      
      // 진행 상황 업데이트
      if (currentProgress > 0 || isCompleted) {
        const newProgress: AchievementProgress = {
          achievementId: achievement.id,
          progress: currentProgress,
          claimed: false
        }
        
        if (isCompleted && !progress?.unlockedAt) {
          newProgress.unlockedAt = new Date()
          unlocked.push(achievement)
          
          // 해금 효과음
          soundManager.playSFX('quest_complete')
        }
        
        this.achievements.set(achievement.id, newProgress)
      }
    }
    
    // 진행 상황 저장
    if (unlocked.length > 0 || type !== 'check') {
      await this.saveProgress()
    }
    
    return unlocked
  }
  
  // 통계 업데이트
  private updateStats(type: string, target?: string, value: number = 1) {
    switch (type) {
      case 'kill':
        this.stats.totalKills += value
        break
      case 'critical':
        this.stats.criticalHits += value
        break
      case 'gold':
        this.stats.totalGoldEarned += value
        break
      case 'item':
        this.stats.totalItemsCollected += value
        break
      case 'quest':
        this.stats.questsCompleted += value
        break
      case 'dungeon':
        if (target) {
          this.stats.dungeonClears[target] = true
        }
        break
      case 'nightmare_boss':
        this.stats.nightmareBossKills += value
        break
      case 'enhance':
        this.stats.highestEnhancement = Math.max(this.stats.highestEnhancement, value)
        break
      case 'skill':
        this.stats.skillsLearned = value
        break
      case 'login':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (this.stats.lastLoginDate) {
          const lastLogin = new Date(this.stats.lastLoginDate)
          lastLogin.setHours(0, 0, 0, 0)
          
          const dayDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            this.stats.consecutiveLogins += 1
          } else if (dayDiff > 1) {
            this.stats.consecutiveLogins = 1
          }
        } else {
          this.stats.consecutiveLogins = 1
        }
        
        this.stats.lastLoginDate = new Date()
        break
    }
  }
  
  // 도전과제 보상 수령
  async claimRewards(achievementId: string): Promise<boolean> {
    const progress = this.achievements.get(achievementId)
    const achievement = ACHIEVEMENT_DATABASE[achievementId]
    
    if (!progress || !achievement || !progress.unlockedAt || progress.claimed) {
      return false
    }
    
    try {
      // 보상 지급
      if (achievement.rewards.gold) {
        // dbHelpers import가 필요한지 확인
        const { dbHelpers } = await import('../database/client-helpers')
        const goldAdded = await dbHelpers.addGold(this.userId, achievement.rewards.gold)
        if (!goldAdded) {
          console.error('Failed to add gold reward')
          return false
        }
      }
      
      if (achievement.rewards.items) {
        for (const item of achievement.rewards.items) {
          await jrpgDbHelpers.addItemToInventory(this.userId, item.itemId, item.quantity)
        }
      }
      
      // 타이틀과 프리미엄 화폐는 별도 처리 필요
      if (achievement.rewards.premiumCurrency) {
        const { dbHelpers } = await import('../database/client-helpers')
        const resources = await dbHelpers.getUserResources(this.userId)
        if (resources) {
          await dbHelpers.updateUserResources(this.userId, {
            premiumCurrency: resources.premiumCurrency + achievement.rewards.premiumCurrency
          })
        }
      }
      
      progress.claimed = true
      await this.saveProgress()
      
      return true
    } catch (error) {
      console.error('Error claiming achievement rewards:', error)
      return false
    }
  }
  
  // 도전과제 목록 가져오기
  getAchievements(category?: string, showHidden: boolean = false): Array<{
    achievement: Achievement
    progress: AchievementProgress | undefined
    percentage: number
  }> {
    const results: Array<{
      achievement: Achievement
      progress: AchievementProgress | undefined
      percentage: number
    }> = []
    
    Object.values(ACHIEVEMENT_DATABASE).forEach(achievement => {
      // 카테고리 필터
      if (category && achievement.category !== category) return
      
      // 숨김 도전과제 필터
      if (!showHidden && achievement.hidden) {
        const progress = this.achievements.get(achievement.id)
        if (!progress?.unlockedAt) return
      }
      
      const progress = this.achievements.get(achievement.id)
      const percentage = this.calculateProgress(achievement, progress)
      
      results.push({ achievement, progress, percentage })
    })
    
    // 정렬: 해금됨 > 진행중 > 미시작
    results.sort((a, b) => {
      const aUnlocked = a.progress?.unlockedAt ? 1 : 0
      const bUnlocked = b.progress?.unlockedAt ? 1 : 0
      if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked
      
      return b.percentage - a.percentage
    })
    
    return results
  }
  
  // 진행률 계산
  private calculateProgress(achievement: Achievement, progress?: AchievementProgress): number {
    if (progress?.unlockedAt) return 100
    
    const current = progress?.progress || 0
    const required = achievement.requirements.value
    
    return Math.min(100, Math.round((current / required) * 100))
  }
  
  // 도전과제 통계
  getStats(): AchievementStats {
    let totalPoints = 0
    let unlockedCount = 0
    const categoryProgress: Record<string, { unlocked: number; total: number }> = {}
    
    Object.values(ACHIEVEMENT_DATABASE).forEach(achievement => {
      const progress = this.achievements.get(achievement.id)
      
      // 카테고리별 통계 초기화
      if (!categoryProgress[achievement.category]) {
        categoryProgress[achievement.category] = { unlocked: 0, total: 0 }
      }
      
      categoryProgress[achievement.category].total++
      
      if (progress?.unlockedAt) {
        totalPoints += achievement.points
        unlockedCount++
        categoryProgress[achievement.category].unlocked++
      }
    })
    
    return {
      totalPoints,
      unlockedCount,
      totalCount: Object.keys(ACHIEVEMENT_DATABASE).length,
      categoryProgress
    }
  }
  
  // 진행 상황 저장
  private async saveProgress(): Promise<void> {
    try {
      const progress = await jrpgDbHelpers.getJRPGProgress(this.userId)
      if (progress) {
        // Map을 객체로 변환
        const achievementProgress: Record<string, AchievementProgress> = {}
        this.achievements.forEach((value, key) => {
          achievementProgress[key] = value
        })
        
        progress.achievementProgress = achievementProgress
        progress.achievementStats = this.stats
        
        await jrpgDbHelpers.saveJRPGProgress(this.userId, progress)
      }
    } catch (error) {
      console.error('Failed to save achievement progress:', error)
    }
  }
  
  // 일일 로그인 체크
  async checkDailyLogin(): Promise<void> {
    await this.checkAchievement('login')
    await this.checkAchievement('custom', 'consecutive_login', this.stats.consecutiveLogins)
  }
}