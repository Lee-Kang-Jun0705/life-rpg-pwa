import { dbHelpers } from '../index'
import { GAME_CONFIG } from '@/lib/types/dashboard'

/**
 * 데이터베이스 통합 테스트
 * - 실제 데이터베이스 작업 검증
 * - 스탯 계산 및 레벨 업 로직
 * - 데이터 일관성 검증
 */

describe('데이터베이스 통합 테스트', () => {
  const testUserId = 'test-user-integration'
  
  beforeEach(async () => {
    // 테스트 데이터 정리
    try {
      const activities = await dbHelpers.getActivities(testUserId)
      for (const activity of activities) {
        if (activity.id) {
          await dbHelpers.deleteActivity(activity.id)
        }
      }
    } catch (error) {
      // 초기 상태에서는 데이터가 없을 수 있음
    }
  })

  test('스탯 초기화 및 기본값 검증', async () => {
    const stats = await dbHelpers.getStats(testUserId)
    
    // 기본 스탯이 생성되어야 함
    expect(stats).toBeInstanceOf(Array)
    expect(stats.length).toBe(4) // 4개 스탯 (health, learning, relationship, achievement)
    
    // 각 스탯의 기본 구조 확인
    const statTypes = ['health', 'learning', 'relationship', 'achievement']
    for (const statType of statTypes) {
      const stat = stats.find(s => s.type === statType)
      expect(stat).toBeDefined()
      expect(stat?.level).toBeGreaterThanOrEqual(1)
      expect(stat?.experience).toBeGreaterThanOrEqual(0)
    }
  })

  test('활동 추가 및 경험치 누적', async () => {
    // 활동 추가
    const activityData = {
      userId: testUserId,
      statType: 'health' as const,
      activityName: '운동하기',
      description: '30분 조깅',
      experience: 50,
      timestamp: new Date(),
      synced: false
    }
    
    const activity = await dbHelpers.addActivity(activityData)
    expect(activity.id).toBeDefined()
    expect(activity.experience).toBe(50)
    
    // 스탯 업데이트 확인
    const stats = await dbHelpers.getStats(testUserId)
    const healthStat = stats.find(s => s.type === 'health')
    
    expect(healthStat).toBeDefined()
    expect(healthStat?.experience).toBeGreaterThanOrEqual(50)
  })

  test('레벨업 로직 검증', async () => {
    // 많은 경험치를 한 번에 추가하여 레벨업 유발
    const largeExpActivity = {
      userId: testUserId,
      statType: 'learning' as const,
      activityName: '집중 학습',
      description: '3시간 프로그래밍 공부',
      experience: 200, // 레벨업에 충분한 경험치
      timestamp: new Date(),
      synced: false
    }
    
    await dbHelpers.addActivity(largeExpActivity)
    
    // 레벨업 확인
    const stats = await dbHelpers.getStats(testUserId)
    const learningStat = stats.find(s => s.type === 'learning')
    
    expect(learningStat).toBeDefined()
    expect(learningStat?.level).toBeGreaterThan(1)
    expect(learningStat?.experience).toBeGreaterThanOrEqual(0)
  })

  test('다중 스탯 동시 업데이트', async () => {
    const multiStatActivities = [
      {
        userId: testUserId,
        statType: 'health' as const,
        activityName: '헬스장',
        description: '근력 운동',
        experience: 75,
        timestamp: new Date(),
        synced: false
      },
      {
        userId: testUserId,
        statType: 'relationship' as const,
        activityName: '친구 만남',
        description: '저녁 식사',
        experience: 60,
        timestamp: new Date(),
        synced: false
      },
      {
        userId: testUserId,
        statType: 'achievement' as const,
        activityName: '프로젝트 완료',
        description: '웹사이트 개발 완료',
        experience: 100,
        timestamp: new Date(),
        synced: false
      }
    ]
    
    // 모든 활동 추가
    for (const activityData of multiStatActivities) {
      await dbHelpers.addActivity(activityData)
    }
    
    // 모든 스탯이 업데이트되었는지 확인
    const stats = await dbHelpers.getStats(testUserId)
    
    const healthStat = stats.find(s => s.type === 'health')
    const relationshipStat = stats.find(s => s.type === 'relationship')
    const achievementStat = stats.find(s => s.type === 'achievement')
    
    expect(healthStat?.experience).toBeGreaterThanOrEqual(75)
    expect(relationshipStat?.experience).toBeGreaterThanOrEqual(60)
    expect(achievementStat?.experience).toBeGreaterThanOrEqual(100)
  })

  test('총 레벨 계산 정확성', async () => {
    // 각 스탯에 다른 양의 경험치 추가
    const activities = [
      { statType: 'health', experience: 150 },
      { statType: 'learning', experience: 250 },
      { statType: 'relationship', experience: 100 },
      { statType: 'achievement', experience: 300 }
    ]
    
    for (const { statType, experience } of activities) {
      await dbHelpers.addActivity({
        userId: testUserId,
        statType: statType as unknown,
        activityName: `${statType} 활동`,
        description: '테스트 활동',
        experience,
        timestamp: new Date(),
        synced: false
      })
    }
    
    // 총 레벨 계산
    const stats = await dbHelpers.getStats(testUserId)
    const totalLevel = stats.reduce((sum, stat) => sum + stat.level, 0)
    
    expect(totalLevel).toBeGreaterThan(4) // 기본 레벨 4보다는 높아야 함
    expect(totalLevel).toBeLessThan(30) // 너무 높지는 않아야 함 (현실적인 범위 조정)
    
    console.log(`계산된 총 레벨: ${totalLevel}`)
    console.log('각 스탯 레벨:', stats.map(s => ({ type: s.type, level: s.level, exp: s.experience })))
  })

  test('중복 데이터 방지 검증', async () => {
    // 동일한 활동을 여러 번 추가
    const activityData = {
      userId: testUserId,
      statType: 'health' as const,
      activityName: '동일 활동',
      description: '중복 테스트',
      experience: 30,
      timestamp: new Date(),
      synced: false
    }
    
    const activity1 = await dbHelpers.addActivity(activityData)
    const activity2 = await dbHelpers.addActivity(activityData)
    
    // 두 활동이 서로 다른 ID를 가져야 함
    expect(activity1.id).not.toBe(activity2.id)
    
    // 활동 목록에서 두 개 모두 확인되어야 함
    const activities = await dbHelpers.getActivities(testUserId)
    const matchingActivities = activities.filter(a => a.activityName === '동일 활동')
    
    expect(matchingActivities.length).toBe(2)
  })

  test('데이터 영속성 및 일관성', async () => {
    // 활동 추가
    const activity = await dbHelpers.addActivity({
      userId: testUserId,
      statType: 'learning' as const,
      activityName: '영속성 테스트',
      description: '데이터 유지 확인',
      experience: 80,
      timestamp: new Date(),
      synced: false
    })
    
    expect(activity.id).toBeDefined()
    
    // 데이터 재조회하여 영속성 확인
    const activities = await dbHelpers.getActivities(testUserId)
    const persistedActivity = activities.find(a => a.id === activity.id)
    
    expect(persistedActivity).toBeDefined()
    expect(persistedActivity?.activityName).toBe('영속성 테스트')
    expect(persistedActivity?.experience).toBe(80)
    
    // 스탯도 일관성 있게 업데이트되었는지 확인
    const stats = await dbHelpers.getStats(testUserId)
    const learningStat = stats.find(s => s.type === 'learning')
    
    expect(learningStat?.experience).toBeGreaterThanOrEqual(80)
  })

  test('동기화 상태 관리', async () => {
    // 동기화되지 않은 활동 추가
    await dbHelpers.addActivity({
      userId: testUserId,
      statType: 'achievement' as const,
      activityName: '미동기화 활동',
      description: '동기화 테스트',
      experience: 40,
      timestamp: new Date(),
      synced: false
    })
    
    // 동기화된 활동 추가
    await dbHelpers.addActivity({
      userId: testUserId,
      statType: 'achievement' as const,
      activityName: '동기화된 활동',
      description: '동기화 완료',
      experience: 60,
      timestamp: new Date(),
      synced: true
    })
    
    // 모든 활동 조회
    const allActivities = await dbHelpers.getActivities(testUserId)
    const unsyncedActivities = allActivities.filter(a => !a.synced && a.activityName?.includes('활동'))
    const syncedActivities = allActivities.filter(a => a.synced && a.activityName?.includes('활동'))
    
    expect(unsyncedActivities.length).toBeGreaterThanOrEqual(1)
    expect(syncedActivities.length).toBeGreaterThanOrEqual(1)
    
    console.log(`미동기화 활동: ${unsyncedActivities.length}개`)
    console.log(`동기화된 활동: ${syncedActivities.length}개`)
  })
})