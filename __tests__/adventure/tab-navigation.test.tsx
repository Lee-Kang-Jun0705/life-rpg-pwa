import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdventurePage from '@/app/adventure/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

// Mock database
jest.mock('@/lib/database/client', () => ({
  dbHelpers: {
    getProfile: jest.fn().mockResolvedValue({ name: 'Test User' }),
    getStats: jest.fn().mockResolvedValue([])
  }
}))

// Mock sound
jest.mock('@/lib/jrpg/sound-system', () => ({
  soundManager: {
    playBGM: jest.fn(),
    stopBGM: jest.fn(),
    playSFX: jest.fn()
  }
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('탭 네비게이션 통합 테스트', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  })

  it('키보드로 탭을 탐색할 수 있다', async () => {
    const user = userEvent.setup()
    
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    const questTab = screen.getByRole('tab', { name: '퀘스트 탭' })
    const dungeonTab = screen.getByRole('tab', { name: '탐험 탭' })

    // 첫 번째 탭으로 포커스
    await user.tab()
    expect(questTab).toHaveFocus()

    // 다음 탭으로 이동
    await user.tab()
    expect(dungeonTab).toHaveFocus()

    // 엔터키로 탭 선택
    await user.keyboard('{Enter}')
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('?tab=dungeon'),
      expect.any(Object)
    )
  })

  it('활성 탭이 시각적으로 구분된다', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    const questTab = screen.getByRole('tab', { name: '퀘스트 탭' })
    const dungeonTab = screen.getByRole('tab', { name: '탐험 탭' })

    // 기본 활성 탭 확인
    expect(questTab).toHaveAttribute('aria-selected', 'true')
    expect(dungeonTab).toHaveAttribute('aria-selected', 'false')

    // 던전 탭 클릭
    fireEvent.click(dungeonTab)

    // aria-selected 상태 확인
    waitFor(() => {
      expect(questTab).toHaveAttribute('aria-selected', 'false')
      expect(dungeonTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('탭 전환시 애니메이션이 작동한다', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    const inventoryTab = screen.getByRole('tab', { name: '인벤토리 탭' })
    
    // 탭 클릭
    fireEvent.click(inventoryTab)

    // AnimatePresence의 exit 애니메이션을 위한 대기
    await waitFor(() => {
      const tabPanel = screen.getByRole('tabpanel')
      expect(tabPanel).toBeInTheDocument()
    })
  })

  it('브라우저 뒤로가기시 이전 탭으로 돌아간다', async () => {
    let currentParams = new URLSearchParams()
    
    const mockUseSearchParams = jest.fn(() => currentParams)
    ;(useSearchParams as jest.Mock).mockImplementation(mockUseSearchParams)

    const { rerender } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    // 스킬 탭 클릭
    fireEvent.click(screen.getByRole('tab', { name: '스킬 탭' }))
    
    // URL 파라미터 변경 시뮬레이션
    currentParams = new URLSearchParams('?tab=skill')
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('skill-tab')).toBeInTheDocument()
    })

    // 뒤로가기 시뮬레이션
    currentParams = new URLSearchParams('?tab=quest')
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('quest-tab')).toBeInTheDocument()
    })
  })

  it('연속적인 탭 전환이 원활하게 작동한다', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AdventurePage />
      </QueryClientProvider>
    )

    const tabs = [
      { name: '탐험 탭', testId: 'dungeon-tab' },
      { name: '인벤토리 탭', testId: 'inventory-tab' },
      { name: '스킬 탭', testId: 'skill-tab' },
      { name: '상점 탭', testId: 'shop-tab' }
    ]

    // 연속적으로 탭 전환
    for (const tab of tabs) {
      fireEvent.click(screen.getByRole('tab', { name: tab.name }))
      
      await waitFor(() => {
        expect(screen.getByTestId(tab.testId)).toBeInTheDocument()
      })
    }

    // 모든 탭 전환이 URL에 반영되었는지 확인
    expect(mockRouter.push).toHaveBeenCalledTimes(tabs.length)
  })
})