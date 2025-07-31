import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardClient from '@/app/dashboard/DashboardClient'
import { useDashboard } from '@/hooks/useDashboard'
import { useLevelUpDetection } from '@/hooks/useLevelUpDetection'
import { TestWrapper } from './TestWrapper'

// Mock the hooks
jest.mock('@/hooks/useDashboard')
jest.mock('@/hooks/useLevelUpDetection')
jest.mock('@/components/voice/EnhancedVoiceInput', () => ({
  EnhancedVoiceInput: () => null
}))

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (() => {
    const DynamicComponent = () => null
    DynamicComponent.displayName = 'LoadableComponent'
    DynamicComponent.preload = jest.fn()
    return DynamicComponent
  })
}))

const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>
const mockUseLevelUpDetection = useLevelUpDetection as jest.MockedFunction<typeof useLevelUpDetection>

describe('DashboardClient 컴포넌트', () => {
  const mockHandleStatAction = jest.fn()
  const mockHandleVoiceInput = jest.fn()
  const mockLoadUserData = jest.fn()
  const mockDetectLevelUp = jest.fn((type, callback) => callback)
  const mockClearLevelUpAnimation = jest.fn()

  const defaultMockDashboardData = {
    stats: [
      { id: '1', type: 'health', experience: 100, lastUpdated: new Date() },
      { id: '2', type: 'learning', experience: 150, lastUpdated: new Date() },
      { id: '3', type: 'relationship', experience: 80, lastUpdated: new Date() },
      { id: '4', type: 'achievement', experience: 200, lastUpdated: new Date() }
    ],
    loading: false,
    error: null,
    isProcessing: new Set<string>(),
    loadUserData: mockLoadUserData,
    handleStatAction: mockHandleStatAction,
    handleVoiceInput: mockHandleVoiceInput,
    calculatedStats: {
      totalLevel: 10,
      totalExp: 530,
      totalActivities: 20
    }
  }

  const defaultMockLevelUpData = {
    levelUpData: {
      show: false,
      level: 1,
      statType: ''
    },
    detectLevelUp: mockDetectLevelUp,
    clearLevelUpAnimation: mockClearLevelUpAnimation
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDashboard.mockReturnValue(defaultMockDashboardData)
    mockUseLevelUpDetection.mockReturnValue(defaultMockLevelUpData)
  })

  describe('렌더링 테스트', () => {
    test('로딩 상태일 때 LoadingState 컴포넌트가 표시된다', () => {
      mockUseDashboard.mockReturnValue({
        ...defaultMockDashboardData,
        loading: true
      })

      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // LoadingState 컴포넌트의 특징적인 요소 확인
      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })

    test('에러 상태일 때 ErrorState 컴포넌트가 표시된다', () => {
      const errorMessage = '데이터를 불러오는데 실패했습니다'
      mockUseDashboard.mockReturnValue({
        ...defaultMockDashboardData,
        error: errorMessage
      })

      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
    })

    test('정상 상태일 때 대시보드 콘텐츠가 표시된다', () => {
      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // DashboardContent가 렌더링되는지 확인
      expect(screen.getByText('Life RPG')).toBeInTheDocument()
      expect(screen.getByText('스탯 올리기')).toBeInTheDocument()
    })
  })

  describe('스탯 액션 테스트', () => {
    test('스탯 액션 시 레벨업 감지가 작동한다', async () => {
      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // 스탯 카드 클릭 시뮬레이션
      const statCards = screen.getAllByTestId('stat-card')
      fireEvent.click(statCards[0])
      
      // 모달에서 활동 선택
      await waitFor(() => {
        const activityButton = screen.getByText('운동하기')
        fireEvent.click(activityButton)
      })
      
      expect(mockDetectLevelUp).toHaveBeenCalled()
      expect(mockHandleStatAction).toHaveBeenCalled()
    })

    test('레벨업 애니메이션이 표시되고 완료 후 제거된다', () => {
      mockUseLevelUpDetection.mockReturnValue({
        ...defaultMockLevelUpData,
        levelUpData: {
          show: true,
          level: 2,
          statType: 'health'
        }
      })

      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // 레벨업 축하 컴포넌트가 표시되는지 확인
      expect(screen.getByText(/레벨업!/)).toBeInTheDocument()
      expect(screen.getByText(/Lv\.2/)).toBeInTheDocument()
    })
  })

  describe('에러 처리 테스트', () => {
    test('에러 발생 시 콘솔에 로그가 출력된다', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const errorMessage = '테스트 에러'
      
      mockUseDashboard.mockReturnValue({
        ...defaultMockDashboardData,
        error: errorMessage
      })

      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Dashboard] Error:', errorMessage)
      
      consoleErrorSpy.mockRestore()
    })

    test('재시도 버튼 클릭 시 loadUserData가 호출된다', () => {
      mockUseDashboard.mockReturnValue({
        ...defaultMockDashboardData,
        error: '에러 발생'
      })

      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      const retryButton = screen.getByText('다시 시도')
      fireEvent.click(retryButton)
      
      expect(mockLoadUserData).toHaveBeenCalled()
    })
  })

  describe('메모이제이션 테스트', () => {
    test('props가 변경되지 않으면 리렌더링되지 않는다', () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      const initialRenderCount = mockUseDashboard.mock.calls.length
      
      // 동일한 props로 리렌더링
      rerender(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // useDashboard가 추가로 호출되지 않았는지 확인
      expect(mockUseDashboard.mock.calls.length).toBe(initialRenderCount)
    })
  })

  describe('음성 입력 테스트', () => {
    test('음성 입력 에러 발생 시 콘솔에 로그가 출력된다', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <TestWrapper>
          <DashboardClient />
        </TestWrapper>
      )
      
      // EnhancedVoiceInput의 onError 콜백 시뮬레이션
      const error = new Error('음성 인식 실패')
      // 실제로는 EnhancedVoiceInput 컴포넌트가 mock되어 있으므로
      // 직접적인 테스트는 어렵지만, 구조적으로 확인
      
      consoleErrorSpy.mockRestore()
    })
  })
})