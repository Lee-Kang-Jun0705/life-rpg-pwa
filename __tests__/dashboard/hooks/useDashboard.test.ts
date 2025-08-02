import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboard } from '@/hooks/useDashboard'
import { dbHelpers } from '@/lib/database/client'
import { recordActivity } from '@/lib/actions/record-activity'

// Mock dependencies
jest.mock('@/lib/database/client')
jest.mock('@/lib/actions/record-activity')
jest.mock('@/lib/auth/session', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id')
}))

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>
const mockRecordActivity = recordActivity as jest.MockedFunction<typeof recordActivity>

// 테스트 래퍼 컴포넌트
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children)
}

describe('useDashboard 훅', () => {
  const mockStats = [
    { id: '1', userId: 'test-user-id', type: 'health', experience: 100, lastUpdated: new Date() },
    { id: '2', userId: 'test-user-id', type: 'learning', experience: 150, lastUpdated: new Date() },
    { id: '3', userId: 'test-user-id', type: 'relationship', experience: 80, lastUpdated: new Date() },
    { id: '4', userId: 'test-user-id', type: 'achievement', experience: 200, lastUpdated: new Date() }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDbHelpers.getStats.mockResolvedValue(mockStats)
    mockRecordActivity.mockResolvedValue({ success: true })
  })

  describe('초기 로드', () => {
    test('컴포넌트 마운트 시 사용자 데이터를 로드한다', async() => {
      const { result } = renderHook(() => useDashboard())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockDbHelpers.getStats).toHaveBeenCalledWith('test-user-id')
      expect(result.current.stats).toEqual(mockStats)
    })

    test('로드 실패 시 에러 상태를 설정한다', async() => {
      const errorMessage = '데이터 로드 실패'
      mockDbHelpers.getStats.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.stats).toEqual([])
    })
  })

  describe('계산된 통계', () => {
    test('총 레벨, 경험치, 활동 수를 올바르게 계산한다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const { calculatedStats } = result.current

      // 총 레벨 = 각 스탯의 레벨 합 (100->2, 150->2, 80->1, 200->3 = 8)
      expect(calculatedStats.totalLevel).toBe(8)

      // 총 경험치 = 100 + 150 + 80 + 200 = 530
      expect(calculatedStats.totalExp).toBe(530)

      // 총 활동 수는 초기값 0
      expect(calculatedStats.totalActivities).toBe(0)
    })
  })

  describe('스탯 액션 처리', () => {
    test('활동 기록이 성공적으로 처리된다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async() => {
        await result.current.handleStatAction('health', '운동하기')
      })

      expect(mockRecordActivity).toHaveBeenCalledWith({
        userId: 'test-user-id',
        statType: 'health',
        activityName: '운동하기',
        experience: 10
      })

      // 데이터가 다시 로드되었는지 확인
      expect(mockDbHelpers.getStats).toHaveBeenCalledTimes(2)
    })

    test('처리 중 상태가 올바르게 관리된다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 느린 응답 시뮬레이션
      mockRecordActivity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const actionPromise = act(async() => {
        await result.current.handleStatAction('health', '운동하기')
      })

      // 처리 중 상태 확인
      expect(result.current.isProcessing.has('health')).toBe(true)

      await actionPromise

      // 처리 완료 후 상태 확인
      expect(result.current.isProcessing.has('health')).toBe(false)
    })

    test('활동 기록 실패 시 에러를 처리한다', async() => {
      mockRecordActivity.mockResolvedValueOnce({
        success: false,
        error: '활동 기록 실패'
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async() => {
        await result.current.handleStatAction('health', '운동하기')
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Dashboard] Failed to record activity:',
        '활동 기록 실패'
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('음성 입력 처리', () => {
    test('음성 입력 텍스트가 올바르게 처리된다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async() => {
        await result.current.handleVoiceInput('운동 30분 완료', 'health')
      })

      expect(mockRecordActivity).toHaveBeenCalledWith({
        userId: 'test-user-id',
        statType: 'health',
        activityName: '운동 30분 완료',
        experience: 10
      })
    })

    test('활동 타입이 없을 때 기본값을 사용한다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async() => {
        await result.current.handleVoiceInput('오늘의 활동')
      })

      expect(mockRecordActivity).toHaveBeenCalledWith({
        userId: 'test-user-id',
        statType: 'achievement',
        activityName: '오늘의 활동',
        experience: 10
      })
    })
  })

  describe('데이터 새로고침', () => {
    test('loadUserData를 호출하면 데이터가 다시 로드된다', async() => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockDbHelpers.getStats).toHaveBeenCalledTimes(1)

      await act(async() => {
        await result.current.loadUserData()
      })

      expect(mockDbHelpers.getStats).toHaveBeenCalledTimes(2)
    })
  })

  describe('메모리 누수 방지', () => {
    test('컴포넌트 언마운트 시 진행 중인 작업이 취소된다', async() => {
      const { result, unmount } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 느린 작업 시작
      mockRecordActivity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      )

      act(() => {
        result.current.handleStatAction('health', '운동하기')
      })

      // 즉시 언마운트
      unmount()

      // 상태 업데이트가 발생하지 않아야 함
      expect(mockDbHelpers.getStats).toHaveBeenCalledTimes(1)
    })
  })
})
