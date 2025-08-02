import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import 'fake-indexeddb/auto'
import { db, dbHelpers } from '@/lib/offline/db'
import type { UserProfile, Stat, Activity } from '@/lib/types'

describe('오프라인 데이터베이스 테스트', () => {
  const testUserId = 'test-user-123'
  const testEmail = 'test@example.com'
  const testName = '테스트 사용자'

  beforeEach(async() => {
    // 테스트 전 데이터베이스 초기화
    await db.profiles.clear()
    await db.stats.clear()
    await db.activities.clear()
    await db.characters.clear()
    await db.missions.clear()
  })

  afterEach(async() => {
    // 테스트 후 정리
    await db.delete()
    await db.open()
  })

  describe('사용자 초기화', () => {
    it('새로운 사용자의 초기 데이터를 생성해야 함', async() => {
      // Act
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)

      // Assert
      const profile = await dbHelpers.getProfile(testUserId)
      expect(profile).toBeDefined()
      expect(profile?.userId).toBe(testUserId)
      expect(profile?.email).toBe(testEmail)
      expect(profile?.name).toBe(testName)
      expect(profile?.level).toBe(1)
      expect(profile?.experience).toBe(0)

      const stats = await dbHelpers.getStats(testUserId)
      expect(stats).toHaveLength(4)
      stats.forEach(stat => {
        expect(stat.userId).toBe(testUserId)
        expect(stat.level).toBe(1)
        expect(stat.experience).toBe(0)
        expect(stat.totalActivities).toBe(0)
      })

      const character = await dbHelpers.getCharacter(testUserId)
      expect(character).toBeDefined()
      expect(character?.userId).toBe(testUserId)
      expect(character?.appearance.base).toBe('default')
    })
  })

  describe('활동 기록 (오프라인)', () => {
    beforeEach(async() => {
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)
    })

    it('오프라인 상태에서 활동을 기록하고 저장해야 함', async() => {
      // Arrange
      const activity: Omit<Activity, 'id'> = {
        userId: testUserId,
        statType: 'health',
        category: '운동',
        description: '30분 달리기',
        experience: 20,
        timestamp: new Date(),
        synced: false // 오프라인 상태
      }

      // Act
      const activityId = await dbHelpers.addActivity(activity)

      // Assert
      expect(activityId).toBeDefined()

      const savedActivity = await db.activities.get(activityId)
      expect(savedActivity).toBeDefined()
      expect(savedActivity?.synced).toBe(false)
      expect(savedActivity?.statType).toBe('health')
      expect(savedActivity?.experience).toBe(20)

      // 스탯도 업데이트되었는지 확인
      const healthStat = await db.stats
        .where('[userId+type]')
        .equals([testUserId, 'health'])
        .first()
      expect(healthStat?.experience).toBe(20)
      expect(healthStat?.totalActivities).toBe(1)
    })

    it('여러 활동을 기록하고 경험치가 누적되어야 함', async() => {
      // Arrange
      const activities = [
        { statType: 'health' as const, experience: 20, description: '운동' },
        { statType: 'health' as const, experience: 30, description: '산책' },
        { statType: 'learning' as const, experience: 25, description: '독서' }
      ]

      // Act
      for (const act of activities) {
        await dbHelpers.addActivity({
          userId: testUserId,
          ...act,
          category: act.statType,
          timestamp: new Date(),
          synced: false
        })
      }

      // Assert
      const healthStat = await db.stats
        .where('[userId+type]')
        .equals([testUserId, 'health'])
        .first()
      expect(healthStat?.experience).toBe(50) // 20 + 30
      expect(healthStat?.totalActivities).toBe(2)

      const learningStat = await db.stats
        .where('[userId+type]')
        .equals([testUserId, 'learning'])
        .first()
      expect(learningStat?.experience).toBe(25)
      expect(learningStat?.totalActivities).toBe(1)
    })

    it('레벨업이 정확하게 계산되어야 함', async() => {
      // Arrange & Act
      // 100 경험치마다 레벨업
      for (let i = 0; i < 5; i++) {
        await dbHelpers.addActivity({
          userId: testUserId,
          statType: 'achievement',
          category: '성취',
          description: `목표 달성 ${i + 1}`,
          experience: 25,
          timestamp: new Date(),
          synced: false
        })
      }

      // Assert
      const achievementStat = await db.stats
        .where('[userId+type]')
        .equals([testUserId, 'achievement'])
        .first()
      expect(achievementStat?.experience).toBe(125) // 25 * 5
      expect(achievementStat?.level).toBe(2) // 100 경험치 초과로 레벨 2
    })
  })

  describe('오프라인 데이터 동기화 대기열', () => {
    beforeEach(async() => {
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)
    })

    it('동기화되지 않은 활동들을 조회할 수 있어야 함', async() => {
      // Arrange
      const activities = [
        { description: '활동1', synced: false },
        { description: '활동2', synced: true },
        { description: '활동3', synced: false }
      ]

      for (const act of activities) {
        await dbHelpers.addActivity({
          userId: testUserId,
          statType: 'health',
          category: '건강',
          description: act.description,
          experience: 10,
          timestamp: new Date(),
          synced: act.synced
        })
      }

      // Act
      const unsyncedActivities = await dbHelpers.getUnsyncedActivities(testUserId)

      // Assert
      expect(unsyncedActivities).toHaveLength(2)
      expect(unsyncedActivities.every(a => !a.synced)).toBe(true)
    })
  })

  describe('캐릭터 커스터마이징 (오프라인)', () => {
    beforeEach(async() => {
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)
    })

    it('오프라인에서 캐릭터 외모를 변경하고 저장해야 함', async() => {
      // Arrange
      const newAppearance = {
        hair: 'long_brown',
        outfit: 'casual_shirt',
        accessory: 'glasses'
      }

      // Act
      await dbHelpers.updateCharacterAppearance(testUserId, newAppearance)

      // Assert
      const character = await dbHelpers.getCharacter(testUserId)
      expect(character?.appearance.base).toBe('default')
      expect(character?.appearance.hair).toBe('long_brown')
      expect(character?.appearance.outfit).toBe('casual_shirt')
      expect(character?.appearance.accessory).toBe('glasses')
    })
  })

  describe('데이터 영속성', () => {
    it('데이터베이스를 닫고 다시 열어도 데이터가 유지되어야 함', async() => {
      // Arrange
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)
      await dbHelpers.addActivity({
        userId: testUserId,
        statType: 'learning',
        category: '학습',
        description: '프로그래밍 공부',
        experience: 30,
        timestamp: new Date(),
        synced: false
      })

      // Act - 데이터베이스 닫고 다시 열기
      db.close()
      await db.open()

      // Assert
      const profile = await dbHelpers.getProfile(testUserId)
      expect(profile?.userId).toBe(testUserId)

      const activities = await dbHelpers.getRecentActivities(testUserId)
      expect(activities).toHaveLength(1)
      expect(activities[0].description).toBe('프로그래밍 공부')
    })
  })

  describe('오프라인 미션 시스템', () => {
    beforeEach(async() => {
      await dbHelpers.initializeUserData(testUserId, testEmail, testName)
    })

    it('오프라인에서 미션 진행도를 업데이트해야 함', async() => {
      // Arrange
      const missionId = await db.missions.add({
        userId: testUserId,
        title: '매일 운동하기',
        description: '7일 연속 운동하기',
        type: 'weekly',
        statType: 'health',
        requirements: {
          count: 7,
          experience: 140
        },
        progress: 0,
        completed: false,
        rewards: {
          experience: 100,
          coins: 50
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Act
      await dbHelpers.updateMissionProgress(missionId, 3)

      // Assert
      const mission = await db.missions.get(missionId)
      expect(mission?.progress).toBe(3)
      expect(mission?.completed).toBe(false)

      // 미션 완료
      await dbHelpers.updateMissionProgress(missionId, 7)
      const completedMission = await db.missions.get(missionId)
      expect(completedMission?.completed).toBe(true)
      expect(completedMission?.completedAt).toBeDefined()
    })
  })
})
