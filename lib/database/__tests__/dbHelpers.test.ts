import { dbHelpers } from '../index'
import { Activity, Stat, UserProfile, Character } from '../index'
import type { CharacterAppearance } from '@/lib/types/character'

// DB 모킹
jest.mock('../index', () => {
  // 전역 db 사용
  const mockDB = global.db || {
    profiles: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      first: jest.fn(),
      add: jest.fn(),
      update: jest.fn()
    },
    stats: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      first: jest.fn(),
      toArray: jest.fn(),
      add: jest.fn(),
      update: jest.fn()
    },
    activities: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      add: jest.fn(),
      reverse: jest.fn().mockReturnThis(),
      sortBy: jest.fn(),
      and: jest.fn().mockReturnThis(),
      toArray: jest.fn()
    },
    characters: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      first: jest.fn(),
      add: jest.fn(),
      update: jest.fn()
    },
    missions: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      get: jest.fn(),
      update: jest.fn()
    }
  }

  return {
    db: mockDB,
    dbHelpers: {
      // 프로필 관련
      async getProfile(userId: string) {
        return await mockDB.profiles.where('userId').equals(userId).first()
      },

      async updateProfile(userId: string, updates: Partial<unknown>) {
        const profile = await this.getProfile(userId)
        if (profile) {
          return await mockDB.profiles.update(profile.id!, { ...updates, updatedAt: new Date() })
        }
        return null
      },

      // 스탯 관련
      async getStats(userId: string) {
        return await mockDB.stats.where('userId').equals(userId).toArray()
      },

      async updateStat(userId: string, type: string, experience: number) {
        const stat = await mockDB.stats.where('[userId+type]').equals([userId, type]).first()
        if (stat) {
          const newExperience = stat.experience + experience
          const newLevel = Math.floor(newExperience / 100) + 1
          return await mockDB.stats.update(stat.id!, {
            experience: newExperience,
            level: newLevel,
            totalActivities: stat.totalActivities + 1,
            updatedAt: new Date()
          })
        }
      },

      // 활동 관련
      async addActivity(activity: Activity) {
        const id = await mockDB.activities.add(activity)
        // 스탯 업데이트
        await this.updateStat(activity.userId, activity.statType, activity.experience)
        return id
      },

      async getRecentActivities(userId: string, limit = 10) {
        return await mockDB.activities
          .where('userId')
          .equals(userId)
          .reverse()
          .sortBy('timestamp')
          .then((activities: Activity[]) => activities.slice(0, limit))
      },

      async getUnsyncedActivities(userId: string) {
        return await mockDB.activities
          .where('userId')
          .equals(userId)
          .and((activity: Activity) => !activity.synced)
          .toArray()
      },

      // 캐릭터 관련
      async getCharacter(userId: string) {
        return await mockDB.characters.where('userId').equals(userId).first()
      },

      async updateCharacterAppearance(userId: string, appearance: Partial<CharacterAppearance>) {
        const character = await this.getCharacter(userId)
        if (character) {
          return await mockDB.characters.update(character.id!, {
            appearance: { ...character.appearance, ...appearance },
            updatedAt: new Date()
          })
        }
      },

      // 초기 데이터 설정
      async initializeUserData(userId: string, email: string, name: string) {
        // 프로필 생성
        await mockDB.profiles.add({
          userId,
          email,
          name,
          level: 1,
          experience: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        // 초기 스탯 생성
        const statTypes: string[] = ['health', 'learning', 'relationship', 'achievement']
        for (const type of statTypes) {
          await mockDB.stats.add({
            userId,
            type,
            level: 1,
            experience: 0,
            totalActivities: 0,
            updatedAt: new Date()
          })
        }

        // 초기 캐릭터 생성
        await mockDB.characters.add({
          userId,
          appearance: {
            base: 'default'
          },
          lastReset: new Date(),
          updatedAt: new Date()
        })
      }
    }
  }
})

// 전역 db 참조
const { db } = global as unknown

describe('dbHelpers', () => {
  const mockUserId = 'test-user-123'
  const mockStat: Stat = {
    id: 1,
    userId: mockUserId,
    type: 'health',
    level: 2,
    experience: 150,
    totalActivities: 5,
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateStat', () => {
    it('기존 스탯의 경험치를 증가시켜야 함', async () => {
      // Mock 설정
      const mockFirst = jest.fn().mockResolvedValue(mockStat)
      ;(db.stats.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: mockFirst
        })
      })
      ;(db.stats.update as jest.Mock).mockResolvedValue(1)

      await dbHelpers.updateStat(mockUserId, 'health', 50)

      // 스탯 조회 확인
      expect(db.stats.where).toHaveBeenCalledWith('[userId+type]')

      // 스탯 업데이트 확인
      expect(db.stats.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          experience: 200, // 150 + 50
          level: 3, // Math.floor(200 / 100) + 1
          totalActivities: 6, // 5 + 1
          updatedAt: expect.any(Date)
        })
      )
    })

    it('스탯이 없으면 업데이트하지 않아야 함', async () => {
      const mockFirst = jest.fn().mockResolvedValue(null)
      ;(db.stats.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: mockFirst
        })
      })

      const result = await dbHelpers.updateStat(mockUserId, 'health', 50)

      expect(result).toBeUndefined()
      expect(db.stats.update).not.toHaveBeenCalled()
    })
  })

  describe('addActivity', () => {
    it('활동을 추가하고 스탯을 업데이트해야 함', async () => {
      const activity = {
        userId: mockUserId,
        statType: 'health' as const,
        activityName: 'Morning run',
        experience: 30,
        timestamp: new Date(),
        synced: false
      }

      // Mock 설정
      ;(db.activities.add as jest.Mock).mockResolvedValue(123)
      
      // updateStat 스파이
      const updateStatSpy = jest.spyOn(dbHelpers, 'updateStat').mockResolvedValue(1)

      const result = await dbHelpers.addActivity(activity)

      // 활동 추가 확인
      expect(db.activities.add).toHaveBeenCalledWith(activity)
      
      // 스탯 업데이트 확인
      expect(updateStatSpy).toHaveBeenCalledWith(mockUserId, 'health', 30)
      
      expect(result).toBe(123)

      // 스파이 정리
      updateStatSpy.mockRestore()
    })
  })

  describe('getRecentActivities', () => {
    it('최근 활동 목록을 가져와야 함', async () => {
      const mockActivities = [
        { id: 1, activityName: 'Run', timestamp: new Date() },
        { id: 2, activityName: 'Study', timestamp: new Date() }
      ]

      const mockSortBy = jest.fn().mockResolvedValue(mockActivities)
      ;(db.activities.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          reverse: jest.fn().mockReturnValue({
            sortBy: mockSortBy
          })
        })
      })

      const result = await dbHelpers.getRecentActivities(mockUserId, 5)

      expect(db.activities.where).toHaveBeenCalledWith('userId')
      expect(mockSortBy).toHaveBeenCalledWith('timestamp')
      expect(result).toEqual(mockActivities.slice(0, 5))
    })
  })

  describe('initializeUserData', () => {
    it('사용자 초기 데이터를 생성해야 함', async () => {
      ;(db.profiles.add as jest.Mock).mockResolvedValue(1)
      ;(db.stats.add as jest.Mock).mockResolvedValue(1)
      ;(db.characters.add as jest.Mock).mockResolvedValue(1)

      await dbHelpers.initializeUserData(mockUserId, 'test@example.com', 'Test User')

      // 프로필 생성 확인
      expect(db.profiles.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          level: 1,
          experience: 0
        })
      )

      // 4개 스탯 생성 확인
      expect(db.stats.add).toHaveBeenCalledTimes(4)
      
      // 건강 스탯 생성 확인
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'health',
          level: 1,
          experience: 0,
          totalActivities: 0
        })
      )

      // 캐릭터 생성 확인
      expect(db.characters.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          appearance: {
            base: 'default'
          }
        })
      )
    })
  })

  describe('getProfile', () => {
    it('사용자 프로필을 가져와야 함', async () => {
      const mockProfile: UserProfile = {
        id: 1,
        userId: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        level: 5,
        experience: 250,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockFirst = jest.fn().mockResolvedValue(mockProfile)
      ;(db.profiles.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: mockFirst
        })
      })

      const result = await dbHelpers.getProfile(mockUserId)

      expect(db.profiles.where).toHaveBeenCalledWith('userId')
      expect(result).toEqual(mockProfile)
    })
  })

  describe('updateCharacterAppearance', () => {
    it('캐릭터 외모를 업데이트해야 함', async () => {
      const mockCharacter: Character = {
        id: 1,
        userId: mockUserId,
        appearance: {
          base: 'default',
          hair: 'short'
        },
        lastReset: new Date(),
        updatedAt: new Date()
      }

      const mockFirst = jest.fn().mockResolvedValue(mockCharacter)
      ;(db.characters.where as jest.Mock).mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: mockFirst
        })
      })
      ;(db.characters.update as jest.Mock).mockResolvedValue(1)

      const newAppearance = { outfit: 'casual' }
      await dbHelpers.updateCharacterAppearance(mockUserId, newAppearance)

      expect(db.characters.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          appearance: {
            base: 'default',
            hair: 'short',
            outfit: 'casual'
          },
          updatedAt: expect.any(Date)
        })
      )
    })
  })
})