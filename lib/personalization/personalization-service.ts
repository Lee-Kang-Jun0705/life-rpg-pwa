import { db } from '../database'
import { 
  PersonalizationMode, 
  PersonalizationSettings, 
  UserPreferences,
  StoragePolicy,
  MODE_CONFIGS,
  StorageUsage
} from './types'
import type { Activity } from '../types'

export class PersonalizationService {
  private static instance: PersonalizationService
  private currentSettings: PersonalizationSettings | null = null

  private constructor() {}

  static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService()
    }
    return PersonalizationService.instance
  }

  /**
   * 현재 개인화 설정 가져오기
   */
  async getSettings(userId: string): Promise<PersonalizationSettings> {
    try {
      // 캐시된 설정이 있으면 반환
      if (this.currentSettings) {
        return this.currentSettings
      }

      // DB에서 설정 조회
      const savedSettings = await db.metadata
        .where('key')
        .equals(`personalization_${userId}`)
        .first()

      if (savedSettings) {
        this.currentSettings = JSON.parse(savedSettings.data as string)
        return this.currentSettings
      }

      // 기본 설정 반환
      const defaultSettings = this.createDefaultSettings()
      await this.saveSettings(userId, defaultSettings)
      return defaultSettings
    } catch (error) {
      console.error('Failed to get personalization settings:', error)
      return this.createDefaultSettings()
    }
  }

  /**
   * 개인화 모드 변경
   */
  async changeMode(userId: string, newMode: PersonalizationMode): Promise<void> {
    const currentSettings = await this.getSettings(userId)
    
    if (currentSettings.mode === newMode) {
      return // 같은 모드로는 변경하지 않음
    }

    // 모드 변경 처리
    if (newMode === 'pro' && currentSettings.mode === 'light') {
      await this.upgradeToProMode(userId)
    } else if (newMode === 'light' && currentSettings.mode === 'pro') {
      await this.downgradeToLightMode(userId)
    }

    // 설정 업데이트
    const newSettings: PersonalizationSettings = {
      ...currentSettings,
      mode: newMode,
      storagePolicy: MODE_CONFIGS[newMode],
      lastUpdated: new Date()
    }

    await this.saveSettings(userId, newSettings)
  }

  /**
   * 사용자 선호도 업데이트
   */
  async updatePreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const currentSettings = await this.getSettings(userId)
    
    const updatedSettings: PersonalizationSettings = {
      ...currentSettings,
      preferences: {
        ...currentSettings.preferences,
        ...preferences
      },
      lastUpdated: new Date()
    }

    await this.saveSettings(userId, updatedSettings)
  }

  /**
   * 저장 공간 사용량 계산
   */
  async calculateStorageUsage(userId: string): Promise<StorageUsage> {
    try {
      // 활동 데이터 크기
      const activities = await db.activities
        .where('userId')
        .equals(userId)
        .count()
      
      const activityDataMB = (activities * 200) / (1024 * 1024) // 약 200 bytes per activity

      // AI 상호작용 데이터
      const interactions = await db.metadata
        .where('key')
        .startsWith(`ai_interaction_${userId}`)
        .count()
      
      const interactionDataMB = (interactions * 1000) / (1024 * 1024) // 약 1KB per interaction

      // 패턴 데이터
      const patternDataMB = 0.5 // 예상치

      // 미디어 데이터 (향후 구현)
      const mediaDataMB = 0

      const totalMB = activityDataMB + interactionDataMB + patternDataMB + mediaDataMB

      return {
        totalMB,
        activityDataMB,
        patternDataMB,
        mediaDataMB,
        breakdown: {
          activities,
          interactions,
          patterns: 1,
          media: 0
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage usage:', error)
      return {
        totalMB: 0,
        activityDataMB: 0,
        patternDataMB: 0,
        mediaDataMB: 0,
        breakdown: {
          activities: 0,
          interactions: 0,
          patterns: 0,
          media: 0
        }
      }
    }
  }

  /**
   * 프로 모드로 업그레이드
   */
  private async upgradeToProMode(userId: string): Promise<void> {
    console.log('Upgrading to Pro mode for user:', userId)
    
    // 기존 라이트 데이터는 유지
    // 이제부터 더 상세한 데이터 수집 시작
    
    // 설정 마이그레이션
    await db.metadata.put({
      id: Date.now(),
      key: `mode_upgrade_${userId}`,
      data: JSON.stringify({
        from: 'light',
        to: 'pro',
        timestamp: new Date()
      })
    })
  }

  /**
   * 라이트 모드로 다운그레이드
   */
  private async downgradeToLightMode(userId: string): Promise<void> {
    console.log('Downgrading to Light mode for user:', userId)
    
    // 데이터 요약 생성
    const summary = await this.generateDataSummary(userId)
    
    // 요약 저장
    await db.metadata.put({
      id: Date.now(),
      key: `data_summary_${userId}`,
      data: JSON.stringify(summary)
    })
    
    // 오래된 상세 데이터 정리 (사용자 확인 필요)
    // 실제 구현시에는 UI에서 확인 받아야 함
  }

  /**
   * 데이터 요약 생성
   */
  private async generateDataSummary(userId: string): Promise<{
    totalActivities: number
    dateRange: {
      start: Date | null
      end: Date | null
    }
    topActivities: string[]
    averageQuality: number
    completionRate: number
  }> {
    const activities = await db.activities
      .where('userId')
      .equals(userId)
      .toArray()
    
    return {
      totalActivities: activities.length,
      dateRange: {
        start: activities[0]?.timestamp || null,
        end: activities[activities.length - 1]?.timestamp || null
      },
      topActivities: this.getTopActivities(activities),
      averageQuality: this.calculateAverageQuality(activities),
      completionRate: this.calculateCompletionRate(activities)
    }
  }

  /**
   * 설정 저장
   */
  private async saveSettings(
    userId: string, 
    settings: PersonalizationSettings
  ): Promise<void> {
    this.currentSettings = settings
    
    await db.metadata.put({
      id: Date.now(),
      key: `personalization_${userId}`,
      data: JSON.stringify(settings)
    })
  }

  /**
   * 기본 설정 생성
   */
  private createDefaultSettings(): PersonalizationSettings {
    return {
      mode: 'light',
      preferences: {
        coachingStyle: {
          directness: 5,
          detailLevel: 5,
          emotionalSupport: 7
        },
        feedbackPreferences: {
          tone: 'balanced',
          frequency: 'moderate',
          format: 'mixed'
        },
        sensitivities: [],
        primaryGoal: '',
        secondaryGoals: []
      },
      storagePolicy: MODE_CONFIGS.light,
      lastUpdated: new Date()
    }
  }

  // 헬퍼 메서드들
  private getTopActivities(activities: Activity[], limit: number = 5): string[] {
    const counts: Record<string, number> = {}
    
    activities.forEach(activity => {
      counts[activity.activityName] = (counts[activity.activityName] || 0) + 1
    })
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name]) => name)
  }

  private calculateAverageQuality(activities: Activity[]): number {
    if (activities.length === 0) return 0
    
    const qualityValues = {
      'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1
    }
    
    const total = activities.reduce((sum, activity) => {
      return sum + (qualityValues[activity.quality] || 0)
    }, 0)
    
    return total / activities.length
  }

  private calculateCompletionRate(activities: Activity[]): number {
    if (activities.length === 0) return 0
    
    // 설명이 있거나 품질이 B 이상인 활동을 완료된 것으로 간주
    const completed = activities.filter(a => 
      a.description || ['A', 'B', 'S'].includes(a.quality)
    ).length
    return (completed / activities.length) * 100
  }
}