// 메모리 기반 임시 저장소 (IndexedDB 사용 불가 시 폴백)
import { Stat } from '@/lib/types/dashboard'
import { Activity } from '@/lib/database/client'

class MemoryStore {
  private stats: Map<string, Stat> = new Map()
  private activities: Activity[] = []
  private settings: Map<string, unknown> = new Map()

  // Stats
  getStats(): Stat[] {
    return Array.from(this.stats.values())
  }

  setStat(stat: Stat): void {
    this.stats.set(stat.type, stat)
  }

  // Activities
  addActivity(activity: Activity): void {
    this.activities.push(activity)
    
    // 스탯 업데이트
    const stat = this.stats.get(activity.statType) || {
      id: Math.floor(Math.random() * 1000000),
      userId: activity.userId,
      type: activity.statType as Stat['type'],
      level: 1,
      experience: 0,
      totalActivities: 0,
      updatedAt: new Date()
    }
    
    stat.experience += activity.experience
    stat.totalActivities++
    this.stats.set(activity.statType, stat)
  }

  getActivities(): Activity[] {
    return this.activities
  }

  // Settings
  getSetting(key: string): unknown {
    return this.settings.get(key)
  }

  setSetting(key: string, value: unknown): void {
    this.settings.set(key, value)
  }

  // Initialize with default stats
  initializeDefaults(userId: string): void {
    const defaultStats: Array<Stat['type']> = ['health', 'learning', 'relationship', 'achievement']
    
    defaultStats.forEach(type => {
      if (!this.stats.has(type)) {
        this.stats.set(type, {
          id: Math.floor(Math.random() * 1000000),
          userId,
          type,
          level: 1,
          experience: 0,
          totalActivities: 0,
          updatedAt: new Date()
        })
      }
    })
  }
}

export const memoryStore = new MemoryStore()