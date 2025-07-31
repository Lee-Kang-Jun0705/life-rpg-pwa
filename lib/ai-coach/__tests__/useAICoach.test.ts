import { renderHook, waitFor } from '@testing-library/react'
import { useAICoach } from '../useAICoach'
import { AICoachService } from '../ai-coach-service'
import { dbHelpers } from '@/lib/database/client'

// Mock dependencies
jest.mock('../ai-coach-service')
jest.mock('@/lib/database', () => ({
  dbHelpers: {
    getStats: jest.fn()
  }
}))

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>
const MockAICoachService = AICoachService as jest.MockedClass<typeof AICoachService>

const mockStats = [
  { userId: 'test-user', type: 'health', level: 5, experience: 120, totalActivities: 10, updatedAt: new Date() },
  { userId: 'test-user', type: 'learning', level: 3, experience: 80, totalActivities: 6, updatedAt: new Date() },
  { userId: 'test-user', type: 'relationship', level: 2, experience: 40, totalActivities: 3, updatedAt: new Date() },
  { userId: 'test-user', type: 'achievement', level: 4, experience: 100, totalActivities: 8, updatedAt: new Date() }
]

const mockGrowthData = [
  { date: '2024-01-15', health: 120, learning: 80, relationship: 40, achievement: 100 }
]

const mockGrowthAnalyses = [
  {
    statType: 'health',
    growthRate: 15.5,
    trend: 'improving' as const,
    lastActivityDate: new Date(),
    totalActivities: 10,
    suggestions: ['매일 운동하기']
  }
]

const mockActivityPattern = {
  mostActiveTime: '14시~15시',
  averageActivitiesPerDay: 2.5,
  streakDays: 7,
  mostFrequentActivity: '운동하기',
  weakDays: ['토', '일']
}

const mockPersonalizedAdvice = [
  {
    type: 'strength' as const,
    title: '건강 관리 우수',
    description: '꾸준한 운동 패턴이 좋습니다.',
    actionItems: ['현재 패턴 유지하기'],
    priority: 'high' as const
  }
]

describe('useAICoach', () => {
  let mockServiceInstance: unknown

  beforeEach(() => {
    mockServiceInstance = {
      getGrowthChartData: jest.fn(),
      analyzeGrowth: jest.fn(),
      analyzeActivityPatterns: jest.fn(),
      generatePersonalizedAdvice: jest.fn()
    }
    
    MockAICoachService.mockImplementation(() => mockServiceInstance)
    
    mockDbHelpers.getStats.mockResolvedValue(mockStats)
    mockServiceInstance.getGrowthChartData.mockResolvedValue(mockGrowthData)
    mockServiceInstance.analyzeGrowth.mockResolvedValue(mockGrowthAnalyses)
    mockServiceInstance.analyzeActivityPatterns.mockResolvedValue(mockActivityPattern)
    mockServiceInstance.generatePersonalizedAdvice.mockResolvedValue(mockPersonalizedAdvice)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태에서는 로딩 상태여야 함', () => {
    const { result } = renderHook(() => useAICoach())
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.userStats).toEqual([])
    expect(result.current.growthData).toEqual([])
    expect(result.current.growthAnalyses).toEqual([])
    expect(result.current.personalizedAdvice).toEqual([])
  })

  it('데이터 로딩이 성공적으로 완료되어야 함', async () => {
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBeNull()
    expect(result.current.userStats).toEqual(mockStats)
    expect(result.current.growthData).toEqual(mockGrowthData)
    expect(result.current.growthAnalyses).toEqual(mockGrowthAnalyses)
    expect(result.current.activityPattern).toEqual(mockActivityPattern)
    expect(result.current.personalizedAdvice).toEqual(mockPersonalizedAdvice)
  })

  it('모든 AI Coach 서비스 메서드가 올바른 인자로 호출되어야 함', async () => {
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(mockDbHelpers.getStats).toHaveBeenCalledWith('local-user')
    expect(mockServiceInstance.getGrowthChartData).toHaveBeenCalledWith('local-user', 30)
    expect(mockServiceInstance.analyzeGrowth).toHaveBeenCalledWith('local-user', mockStats)
    expect(mockServiceInstance.analyzeActivityPatterns).toHaveBeenCalledWith('local-user')
    expect(mockServiceInstance.generatePersonalizedAdvice).toHaveBeenCalledWith(
      'local-user',
      mockStats,
      mockGrowthAnalyses,
      mockActivityPattern
    )
  })

  it('통계 데이터 로딩 실패 시 에러를 처리해야 함', async () => {
    mockDbHelpers.getStats.mockRejectedValue(new Error('DB 연결 실패'))
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBe('DB 연결 실패')
    expect(result.current.userStats).toEqual([])
  })

  it('성장 차트 데이터 로딩 실패 시 에러를 처리해야 함', async () => {
    mockServiceInstance.getGrowthChartData.mockRejectedValue(new Error('차트 데이터 로딩 실패'))
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBe('차트 데이터 로딩 실패')
    expect(result.current.growthData).toEqual([])
  })

  it('성장 분석 실패 시 에러를 처리해야 함', async () => {
    mockServiceInstance.analyzeGrowth.mockRejectedValue(new Error('분석 실패'))
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBe('분석 실패')
    expect(result.current.growthAnalyses).toEqual([])
  })

  it('활동 패턴 분석 실패 시 에러를 처리해야 함', async () => {
    mockServiceInstance.analyzeActivityPatterns.mockRejectedValue(new Error('패턴 분석 실패'))
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBe('패턴 분석 실패')
    expect(result.current.activityPattern).toBeNull()
  })

  it('맞춤형 조언 생성 실패 시 에러를 처리해야 함', async () => {
    mockServiceInstance.generatePersonalizedAdvice.mockRejectedValue(new Error('조언 생성 실패'))
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBe('조언 생성 실패')
    expect(result.current.personalizedAdvice).toEqual([])
  })

  it('사용자 통계가 비어있을 때 적절히 처리해야 함', async () => {
    mockDbHelpers.getStats.mockResolvedValue([])
    
    const { result } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.error).toBeNull()
    expect(result.current.userStats).toEqual([])
    // 빈 통계로도 서비스 메서드들이 호출되어야 함
    expect(mockServiceInstance.analyzeGrowth).toHaveBeenCalledWith('local-user', [])
  })

  it('컴포넌트 언마운트 시 정리 작업이 수행되어야 함', async () => {
    const { result, unmount } = renderHook(() => useAICoach())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    unmount()
    
    // 언마운트 후에는 상태 업데이트가 발생하지 않아야 함
    expect(() => unmount()).not.toThrow()
  })
})