import { dbHelpers } from '@/lib/database/client'
import type { Stat } from '@/lib/database/client'

export class StatRepository {
  async findByUserId(userId: string): Promise<Stat[]> {
    return await dbHelpers.getStats(userId)
  }

  async findByUserIdAndType(userId: string, type: Stat['type']): Promise<Stat | undefined> {
    const stats = await dbHelpers.getStats(userId)
    return stats.find(s => s.type === type)
  }

  async updateStat(userId: string, type: Stat['type'], experience: number): Promise<boolean> {
    const result = await dbHelpers.updateStat(userId, type, experience)
    return result !== null
  }

  async saveStat(stat: Stat): Promise<boolean> {
    const result = await dbHelpers.saveStat(stat)
    return result !== null
  }

  async getStats(userId: string): Promise<Stat[]> {
    return await dbHelpers.getStats(userId)
  }

  async removeDuplicates(userId: string): Promise<{ removed: number; remaining: number }> {
    return await dbHelpers.removeDuplicateStats(userId)
  }

  async incrementExperience(
    userId: string,
    type: Stat['type'],
    experience: number
  ): Promise<boolean> {
    const result = await dbHelpers.updateStat(userId, type, experience)
    return result !== null
  }

  async createInitialStats(userId: string): Promise<void> {
    // This is handled by initializeUserData
    const stats = await dbHelpers.getStats(userId)
    if (stats.length === 0) {
      await dbHelpers.initializeUserData(userId, 'user@example.com', 'User')
    }
  }

  async getStatsSummary(userId: string) {
    const stats = await this.findByUserId(userId)

    const totalExperience = stats.reduce((sum, stat) => sum + stat.experience, 0)
    const totalLevel = stats.reduce((sum, stat) => sum + stat.level, 0)
    const totalActivities = stats.reduce((sum, stat) => sum + stat.totalActivities, 0)

    return {
      stats,
      totalExperience,
      totalLevel,
      averageLevel: stats.length > 0 ? totalLevel / stats.length : 0,
      totalActivities
    }
  }
}

export const statRepository = new StatRepository()
