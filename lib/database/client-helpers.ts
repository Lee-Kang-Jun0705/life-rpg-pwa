// 클라이언트 전용 데이터베이스 헬퍼 함수
// SSR 환경에서 안전하게 동작하도록 설계

import { getClientDatabase, waitForDatabase } from './client-only'
import type { 
  UserProfile, 
  Stat, 
  Activity, 
  Mission, 
  PlayerDataValue,
  PlayerData,
  DungeonProgress,
  EquipmentInventory 
} from './types'
import { calculateLevelFromExperience } from '../utils/stat-calculator'
import { DatabaseLock } from './db-lock'
import { leaderboardService } from '../services/leaderboard.service'

// 클라이언트 전용 헬퍼 함수들
export const clientDbHelpers = {
  // 프로필 관련
  async getProfile(userId: string): Promise<UserProfile | null> {
    const db = await waitForDatabase()
    return await db.profiles.where('userId').equals(userId).first() || null
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const db = await waitForDatabase()
    const profile = await this.getProfile(userId)
    if (profile && profile.id) {
      const result = await db.profiles.update(profile.id, { ...updates, updatedAt: new Date() })
      
      // 레벨 기록 업데이트
      if (updates.level) {
        await leaderboardService.updateRecord(
          'level', 
          'highest_level', 
          '최고 레벨', 
          updates.level, 
          '레벨'
        )
      }
      
      return result
    }
    return null
  },

  // 스탯 관련
  async getStats(userId: string): Promise<Stat[]> {
    const db = await waitForDatabase()
    let stats = await db.stats.where('userId').equals(userId).toArray()
    
    // 스탯이 없으면 기본 스탯 생성
    if (stats.length === 0) {
      const defaultStats: Omit<Stat, 'id'>[] = [
        {
          userId,
          type: 'health',
          level: 0,
          experience: 0,
          totalActivities: 0,
          updatedAt: new Date()
        },
        {
          userId,
          type: 'learning',
          level: 0,
          experience: 0,
          totalActivities: 0,
          updatedAt: new Date()
        },
        {
          userId,
          type: 'relationship',
          level: 0,
          experience: 0,
          totalActivities: 0,
          updatedAt: new Date()
        },
        {
          userId,
          type: 'achievement',
          level: 0,
          experience: 0,
          totalActivities: 0,
          updatedAt: new Date()
        }
      ]
      
      for (const stat of defaultStats) {
        await db.stats.add(stat)
      }
      
      // 새로 생성된 스탯들 반환
      stats = await db.stats.where('userId').equals(userId).toArray()
    }
    
    return stats
  },

  async saveStat(stat: Stat) {
    const db = await waitForDatabase()
    // userId와 type으로 기존 스탯 찾기
    const userStats = await db.stats.where('userId').equals(stat.userId).toArray()
    const existing = userStats.find((s) => s.type === stat.type)
    
    if (existing && existing.id) {
      // 기존 스탯 업데이트
      return await db.stats.update(existing.id, {
        ...stat,
        id: existing.id,
        updatedAt: new Date()
      })
    } else {
      // 새 스탯 추가
      return await db.stats.add(stat)
    }
  },

  async updateStat(userId: string, type: Stat['type'], experience: number) {
    const db = await waitForDatabase()
    
    // 해당 사용자의 모든 스탯 가져와서 필터링
    const userStats = await db.stats.where('userId').equals(userId).toArray()
    const stat = userStats.find((s) => s.type === type)
    
    if (stat && stat.id) {
      const newExperience = stat.experience + experience
      const { level: newLevel } = calculateLevelFromExperience(newExperience)
      return await db.stats.update(stat.id, {
        experience: newExperience,
        level: newLevel,
        totalActivities: stat.totalActivities + 1,
        updatedAt: new Date()
      })
    } else {
      // 스탯이 없으면 새로 생성
      const { level: newLevel } = calculateLevelFromExperience(experience)
      const newStat: Omit<Stat, 'id'> = {
        userId,
        type,
        level: newLevel,
        experience,
        totalActivities: 1,
        updatedAt: new Date()
      }
      return await db.stats.add(newStat)
    }
  },

  // 활동 관련
  async addActivity(activity: Omit<Activity, 'id'>): Promise<Activity | null> {
    const db = await waitForDatabase()
    const id = await db.activities.add(activity)
    // 스탯 업데이트
    await this.updateStat(activity.userId, activity.statType, activity.experience)
    
    // 일일 경험치 기록 업데이트
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayActivities = await this.getActivitiesByDateRange(
      activity.userId, 
      today, 
      new Date()
    )
    const dailyExp = todayActivities.reduce((sum, a) => sum + a.experience, 0)
    await leaderboardService.updateRecord(
      'daily', 
      'max_daily_exp', 
      '일일 최고 경험치', 
      dailyExp, 
      'EXP'
    )
    
    // 연속 활동 일수 업데이트
    const allActivities = await this.getActivities(activity.userId)
    const streak = this.calculateActivityStreak(allActivities)
    if (streak > 0) {
      await leaderboardService.updateRecord(
        'daily', 
        'activity_streak', 
        '연속 활동 일수', 
        streak, 
        '일'
      )
    }
    
    // 전체 활동 객체 반환
    return { ...activity, id }
  },

  async getActivities(userId: string, limit?: number): Promise<Activity[]> {
    const db = await waitForDatabase()
    const query = db.activities
      .where('userId')
      .equals(userId)
      .reverse()
    
    if (limit) {
      return await query.limit(limit).toArray()
    }
    
    return await query.toArray()
  },

  async deleteActivity(id: number) {
    const db = await waitForDatabase()
    return await db.activities.delete(id)
  },

  async getRecentActivities(userId: string, limit = 10): Promise<Activity[]> {
    const db = await waitForDatabase()
    return await db.activities
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp')
      .then((activities) => activities.slice(0, limit))
  },


  async getActivitiesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Activity[]> {
    const db = await waitForDatabase()
    return await db.activities
      .where('userId')
      .equals(userId)
      .and((activity) => activity.timestamp >= startDate && activity.timestamp <= endDate)
      .toArray()
  },

  // 미션 관련
  async getActiveMissions(userId: string): Promise<Mission[]> {
    const db = await waitForDatabase()
    const now = new Date()
    return await db.missions
      .where('userId')
      .equals(userId)
      .and((mission) => !mission.completed && mission.endDate > now)
      .toArray()
  },

  async updateMissionProgress(missionId: number, progress: number) {
    const db = await waitForDatabase()
    const mission = await db.missions.get(missionId)
    if (mission) {
      const completed = progress >= mission.requirements.count
      return await db.missions.update(missionId, {
        progress,
        completed,
        completedAt: completed ? new Date() : undefined
      })
    }
  },

  // 플레이어 데이터 (키-값 저장소)
  async getPlayerData(key: string): Promise<PlayerData | null> {
    const db = await waitForDatabase()
    return await db.playerData.get(key) || null
  },

  async setPlayerData(key: string, data: PlayerDataValue) {
    const db = await waitForDatabase()
    return await db.playerData.put({
      id: key,
      data,
      updatedAt: new Date()
    })
  },

  // 초기 데이터 설정
  async initializeUserData(userId: string, email: string, name: string) {
    const db = await waitForDatabase()
    return DatabaseLock.acquire(`init-${userId}`, async () => {
      // 프로필이 이미 존재하는지 확인
      const existingProfile = await db.profiles.where('userId').equals(userId).first()
      
      if (!existingProfile) {
        // 프로필 생성
        await db.profiles.add({
          userId,
          email,
          name,
          level: 4,  // 새 플레이어는 레벨 4부터 시작
          experience: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // 초기 스탯 생성 (트랜잭션으로 처리)
      await db.transaction('rw', db.stats, async () => {
        const statTypes: Stat['type'][] = ['health', 'learning', 'relationship', 'achievement']
        
        for (const type of statTypes) {
          // 이미 존재하는지 확인
          const existing = await db.stats
            .where('[userId+type]')
            .equals([userId, type])
            .first()
          
          if (!existing) {
            console.log(`📝 Creating stat: ${type}`)
            await db.stats.add({
              userId,
              type,
              level: 0,
              experience: 0,
              totalActivities: 0,
              updatedAt: new Date()
            })
          } else {
            console.log(`✅ Stat already exists: ${type}`)
          }
        }
      })
    })
  },

  // 중복된 스탯 제거
  async removeDuplicateStats(userId: string): Promise<{ removed: number; remaining: number }> {
    const db = await waitForDatabase()
    return db.transaction('rw', db.stats, async () => {
      const stats = await db.stats.where('userId').equals(userId).toArray()
      const uniqueStats = new Map<string, Stat>()
      
      console.log(`🔍 Checking ${stats.length} stats for duplicates...`)
      
      // 각 타입별로 가장 높은 레벨과 경험치를 가진 스탯만 유지
      for (const stat of stats) {
        const existing = uniqueStats.get(stat.type)
        if (!existing || 
            stat.level > existing.level || 
            (stat.level === existing.level && stat.experience > existing.experience)) {
          uniqueStats.set(stat.type, stat)
        }
      }
      
      // 중복된 스탯이 있는 경우 처리
      if (stats.length > uniqueStats.size) {
        console.log(`🧹 Removing duplicate stats: ${stats.length} → ${uniqueStats.size}`)
        
        // 모든 스탯 삭제
        await db.stats.where('userId').equals(userId).delete()
        
        // 유니크한 스탯만 다시 저장 (ID 없이)
        const newStats = []
        for (const stat of uniqueStats.values()) {
          const newStat = {
            userId: stat.userId,
            type: stat.type,
            level: stat.level,
            experience: stat.experience,
            totalActivities: stat.totalActivities,
            updatedAt: new Date()
          }
          await db.stats.add(newStat)
          newStats.push(newStat)
        }
        
        console.log(`✅ Duplicates removed. New stats:`, newStats.map(s => s.type))
        return { removed: stats.length - uniqueStats.size, remaining: uniqueStats.size }
      }
      
      console.log('✅ No duplicates found')
      return { removed: 0, remaining: stats.length }
    })
  },

  // 컬렉션 데이터 저장
  async saveCollectionData(userId: string, data: Record<string, unknown>): Promise<void> {
    const db = await getClientDatabase()
    await db.transaction('rw', db.metadata, async () => {
      await db.metadata.put({
        key: `collection_${userId}`,
        value: data,
        updatedAt: new Date()
      })
    })
  },

  // 컬렉션 데이터 로드
  async getCollectionData(userId: string): Promise<Record<string, unknown> | null> {
    const db = await getClientDatabase()
    const metadata = await db.metadata.where('key').equals(`collection_${userId}`).first()
    return metadata?.value as Record<string, unknown> || null
  },

  // 리더보드 데이터 저장
  async saveLeaderboardData(userId: string, data: Record<string, unknown>): Promise<void> {
    const db = await getClientDatabase()
    await db.transaction('rw', db.metadata, async () => {
      await db.metadata.put({
        key: `leaderboard_${userId}`,
        value: data,
        updatedAt: new Date()
      })
    })
  },

  // 리더보드 데이터 로드
  async getLeaderboardData(userId: string): Promise<Record<string, unknown> | null> {
    const db = await getClientDatabase()
    const metadata = await db.metadata.where('key').equals(`leaderboard_${userId}`).first()
    return metadata?.value as Record<string, unknown> || null
  },

  // 연속 활동 일수 계산
  calculateActivityStreak(activities: Activity[]): number {
    if (activities.length === 0) return 0

    const sortedDates = Array.from(new Set(
      activities.map(a => {
        const date = new Date(a.timestamp)
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      })
    )).sort().reverse()

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const dateStr of sortedDates) {
      const [year, month, day] = dateStr.split('-').map(Number)
      const activityDate = new Date(year, month - 1, day)

      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  // 던전 진행도 관련
  async getAllDungeonProgress(userId: string): Promise<DungeonProgress[]> {
    const db = await waitForDatabase()
    return await db.dungeonProgress.where('userId').equals(userId).toArray()
  },

  // 에너지 상태 관련
  async loadEnergyState(userId: string): Promise<{ current: number; max: number; lastUpdate: Date } | null> {
    const db = await getClientDatabase()
    const metadata = await db.metadata.where('key').equals(`energy_${userId}`).first()
    if (metadata?.value) {
      const state = metadata.value as { current: number; max: number; lastUpdate: string }
      return {
        current: state.current,
        max: state.max,
        lastUpdate: new Date(state.lastUpdate)
      }
    }
    return null
  },

  async saveEnergyState(userId: string, state: { current: number; max: number; lastUpdate: Date }): Promise<void> {
    const db = await getClientDatabase()
    await db.metadata.put({
      key: `energy_${userId}`,
      value: {
        current: state.current,
        max: state.max,
        lastUpdate: state.lastUpdate.toISOString()
      },
      updatedAt: new Date()
    })
  },

  // 커스텀 액션 관련
  async loadCustomActions(userId: string): Promise<Record<string, unknown> | null> {
    const db = await getClientDatabase()
    const metadata = await db.metadata.where('key').equals(`custom_actions_${userId}`).first()
    return metadata?.value as Record<string, unknown> || null
  },

  async saveCustomActions(userId: string, actions: Record<string, unknown>): Promise<void> {
    const db = await getClientDatabase()
    await db.metadata.put({
      key: `custom_actions_${userId}`,
      value: actions,
      updatedAt: new Date()
    })
  },

  // 장비 인벤토리 관련
  async getEquipmentInventory(userId: string): Promise<EquipmentInventory | null> {
    const db = await getClientDatabase()
    
    const equipments = await db.userEquipments
      .where('userId')
      .equals(userId)
      .toArray()
    
    if (!equipments.length) {
      return {
        id: 0,
        userId,
        maxSlots: 100,
        currentSlots: 0,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    // userEquipments를 EquipmentInventory 형식으로 변환
    const items = equipments.map(eq => ({
      id: eq.id!,
      inventoryId: 0, // 임시
      itemId: eq.equipmentId,
      type: eq.type,
      rarity: eq.rarity,
      level: 1,
      enhancement: eq.enhancementLevel || 0,
      isEquipped: eq.isEquipped,
      equippedSlot: eq.slot || null,
      obtainedAt: eq.acquiredAt,
      locked: false
    }))
    
    return {
      id: 0,
      userId,
      maxSlots: 100,
      currentSlots: items.length,
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },

  // 장비 인벤토리에 아이템 추가 (userEquipments 테이블 사용)
  async addEquipmentToInventory(
    userId: string,
    itemId: string,
    type: 'weapon' | 'armor' | 'accessory',
    rarity: string
  ): Promise<number> {
    const db = await getClientDatabase()
    
    // userEquipments 테이블에 아이템 추가
    const equipment = {
      userId,
      equipmentId: itemId,
      type,
      rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary',
      enhancementLevel: 0,
      isEquipped: false,
      acquiredAt: new Date(),
      updatedAt: new Date()
    }
    
    const id = await db.userEquipments.add(equipment)
    return id
  },

  // 던전 진행도 조회
  async getDungeonProgress(userId: string, dungeonId: string): Promise<DungeonProgress | undefined> {
    const db = await getClientDatabase()
    return await db.dungeonProgress
      .where('[userId+dungeonId]')
      .equals([userId, dungeonId])
      .first()
  },

  // 던전 진행도 업데이트
  async updateDungeonProgress(userId: string, dungeonId: string, updates: Partial<DungeonProgress>): Promise<void> {
    const db = await getClientDatabase()
    await db.dungeonProgress
      .where('[userId+dungeonId]')
      .equals([userId, dungeonId])
      .modify(updates)
  },

  // 던전 진행도 생성
  async createDungeonProgress(progress: DungeonProgress): Promise<void> {
    const db = await getClientDatabase()
    await db.dungeonProgress.add(progress)
  }
}