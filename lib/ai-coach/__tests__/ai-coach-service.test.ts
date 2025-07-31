import { AICoachService } from '../ai-coach-service'
import { dbHelpers } from '@/lib/database/client'
import { Stat, Activity } from '@/lib/types/dashboard'

// Mock dbHelpers
jest.mock('@/lib/database', () => ({
  dbHelpers: {
    getActivitiesByDateRange: jest.fn(),
    getStats: jest.fn()
  }
}))

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>

describe('AICoachService', () => {
  let service: AICoachService
  const userId = 'test-user'

  beforeEach(() => {
    service = new AICoachService()
    jest.clearAllMocks()
  })

  const mockStats: Stat[] = [
    { userId, type: 'health', level: 5, experience: 120, totalActivities: 10, updatedAt: new Date() },
    { userId, type: 'learning', level: 3, experience: 80, totalActivities: 6, updatedAt: new Date() },
    { userId, type: 'relationship', level: 2, experience: 40, totalActivities: 3, updatedAt: new Date() },
    { userId, type: 'achievement', level: 4, experience: 100, totalActivities: 8, updatedAt: new Date() }
  ]

  const mockActivities: Activity[] = [
    {
      userId,
      statType: 'health',
      activityName: '운동하기',
      experience: 10,
      timestamp: new Date('2024-01-15'),
      synced: true
    },
    {
      userId,
      statType: 'learning',
      activityName: '책 읽기',
      experience: 15,
      timestamp: new Date('2024-01-14'),
      synced: true
    }
  ]

  describe('getGrowthChartData', () => {
    it('30일간 성장 차트 데이터를 생성해야 함', async () => {
      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue(mockActivities)

      const result = await service.getGrowthChartData(userId, 30)

      expect(mockDbHelpers.getActivitiesByDateRange).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(Date)
      )
      expect(Array.isArray(result)).toBe(true)
    })

    it('활동이 없을 때 빈 배열을 반환해야 함', async () => {
      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue([])

      const result = await service.getGrowthChartData(userId, 30)

      expect(result).toEqual([])
    })
  })

  describe('analyzeGrowth', () => {
    it('스탯별 성장 분석을 수행해야 함', async () => {
      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue(mockActivities)

      const result = await service.analyzeGrowth(userId, mockStats)

      expect(result).toHaveLength(4)
      expect(result[0]).toHaveProperty('statType')
      expect(result[0]).toHaveProperty('growthRate')
      expect(result[0]).toHaveProperty('trend')
      expect(result[0]).toHaveProperty('suggestions')
    })

    it('올바른 트렌드를 계산해야 함', async () => {
      // 최근 7일에 더 많은 활동이 있는 경우
      const recentActivities: Activity[] = [
        ...mockActivities,
        {
          userId,
          statType: 'health',
          activityName: '운동하기',
          experience: 20,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전
          synced: true
        }
      ]

      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue(recentActivities)

      const result = await service.analyzeGrowth(userId, mockStats)
      const healthAnalysis = result.find(a => a.statType === 'health')

      expect(healthAnalysis?.trend).toBeDefined()
    })
  })

  describe('analyzeActivityPatterns', () => {
    it('활동 패턴을 분석해야 함', async () => {
      const activitiesWithTime = mockActivities.map(activity => ({
        ...activity,
        timestamp: new Date(2024, 0, 15, 14, 30) // 14:30
      }))

      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue(activitiesWithTime)

      const result = await service.analyzeActivityPatterns(userId)

      expect(result).toHaveProperty('mostActiveTime')
      expect(result).toHaveProperty('averageActivitiesPerDay')
      expect(result).toHaveProperty('streakDays')
      expect(result).toHaveProperty('mostFrequentActivity')
      expect(result).toHaveProperty('weakDays')
    })

    it('연속 활동 일수를 올바르게 계산해야 함', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      const consecutiveActivities: Activity[] = [
        {
          userId,
          statType: 'health',
          activityName: '운동하기',
          experience: 10,
          timestamp: today,
          synced: true
        },
        {
          userId,
          statType: 'learning',
          activityName: '독서',
          experience: 15,
          timestamp: yesterday,
          synced: true
        }
      ]

      mockDbHelpers.getActivitiesByDateRange.mockResolvedValue(consecutiveActivities)

      const result = await service.analyzeActivityPatterns(userId)

      expect(result.streakDays).toBeGreaterThanOrEqual(1)
    })
  })

  describe('generatePersonalizedAdvice', () => {
    const mockGrowthAnalyses = [
      {
        statType: 'health',
        growthRate: 15,
        trend: 'improving' as const,
        lastActivityDate: new Date(),
        totalActivities: 10,
        suggestions: ['매일 운동하기']
      },
      {
        statType: 'learning',
        growthRate: 5,
        trend: 'declining' as const,
        lastActivityDate: new Date(),
        totalActivities: 3,
        suggestions: ['독서 시간 늘리기']
      }
    ]

    const mockActivityPattern = {
      mostActiveTime: '14시~15시',
      averageActivitiesPerDay: 2.5,
      streakDays: 7,
      mostFrequentActivity: '운동하기',
      weakDays: ['토', '일']
    }

    it('맞춤형 조언을 생성해야 함', async () => {
      const result = await service.generatePersonalizedAdvice(
        userId,
        mockStats,
        mockGrowthAnalyses,
        mockActivityPattern
      )

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      const advice = result[0]
      expect(advice).toHaveProperty('type')
      expect(advice).toHaveProperty('title')
      expect(advice).toHaveProperty('description')
      expect(advice).toHaveProperty('actionItems')
      expect(advice).toHaveProperty('priority')
    })

    it('강점 조언을 포함해야 함', async () => {
      const result = await service.generatePersonalizedAdvice(
        userId,
        mockStats,
        mockGrowthAnalyses,
        mockActivityPattern
      )

      const strengthAdvice = result.find(advice => advice.type === 'strength')
      expect(strengthAdvice).toBeDefined()
      expect(strengthAdvice?.title).toContain('건강')
    })

    it('약점 개선 조언을 포함해야 함', async () => {
      const weakStats = mockStats.map(stat => 
        stat.type === 'relationship' ? { ...stat, level: 1 } : stat
      )

      const result = await service.generatePersonalizedAdvice(
        userId,
        weakStats,
        mockGrowthAnalyses,
        mockActivityPattern
      )

      const weaknessAdvice = result.find(advice => advice.type === 'weakness')
      expect(weaknessAdvice).toBeDefined()
    })

    it('습관 형성 조언을 포함해야 함', async () => {
      const result = await service.generatePersonalizedAdvice(
        userId,
        mockStats,
        mockGrowthAnalyses,
        mockActivityPattern
      )

      const habitAdvice = result.find(advice => advice.type === 'habit')
      expect(habitAdvice).toBeDefined()
    })
  })

  describe('private methods', () => {
    it('스탯 이름을 올바르게 반환해야 함', () => {
      const service = new AICoachService()
      // private 메서드 테스트를 위해 타입 캐스팅
      const getStatName = (service as any).getStatName

      expect(getStatName('health')).toBe('건강')
      expect(getStatName('learning')).toBe('학습')
      expect(getStatName('relationship')).toBe('관계')
      expect(getStatName('achievement')).toBe('성취')
      expect(getStatName('unknown')).toBe('unknown')
    })

    it('제안사항을 생성해야 함', () => {
      const service = new AICoachService()
      const generateSuggestions = (service as any).generateSuggestions

      const suggestions = generateSuggestions('health', 5, 'declining', mockActivities)

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.includes('건강'))).toBe(true)
    })
  })
})