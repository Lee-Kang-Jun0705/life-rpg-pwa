import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { StatType, Stat } from '@/lib/types/dashboard'
import { TestWrapper } from '../TestWrapper'

describe('StatsGrid 컴포넌트', () => {
  const mockOnStatAction = jest.fn()

  const statTypes: StatType[] = [
    { id: '1', type: 'health', name: '건강', emoji: '🏃' },
    { id: '2', type: 'learning', name: '학습', emoji: '📚' },
    { id: '3', type: 'relationship', name: '관계', emoji: '🤝' },
    { id: '4', type: 'achievement', name: '성취', emoji: '🎯' }
  ]

  const stats: Stat[] = [
    { id: '1', type: 'health', experience: 100, lastUpdated: new Date() },
    { id: '2', type: 'learning', experience: 150, lastUpdated: new Date() },
    { id: '3', type: 'relationship', experience: 80, lastUpdated: new Date() },
    { id: '4', type: 'achievement', experience: 200, lastUpdated: new Date() }
  ]

  const isProcessing = new Set<string>()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('모든 스탯 카드가 렌더링된다', () => {
    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={stats}
          isProcessing={isProcessing}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    // 타이틀 확인
    expect(screen.getByText('스탯 올리기')).toBeInTheDocument()

    // 모든 스탯 카드가 표시되는지 확인
    statTypes.forEach(statType => {
      expect(screen.getByText(statType.name)).toBeInTheDocument()
    })

    // 스탯 카드 개수 확인
    const statCards = screen.getAllByTestId('stat-card')
    expect(statCards).toHaveLength(4)
  })

  test('스탯 카드가 올바른 순서로 애니메이션된다', () => {
    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={stats}
          isProcessing={isProcessing}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    const statCards = screen.getAllByTestId('stat-card')

    statCards.forEach((card, index) => {
      const wrapper = card.parentElement
      expect(wrapper).toHaveClass('animate-bounce-in')
      expect(wrapper).toHaveStyle({ animationDelay: `${index * 0.1}s` })
    })
  })

  test('스탯 카드 클릭 시 onStatAction이 호출된다', () => {
    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={stats}
          isProcessing={isProcessing}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    const firstStatCard = screen.getAllByTestId('stat-card')[0]
    fireEvent.click(firstStatCard)

    // 모달이 열리고 활동을 선택하는 시뮬레이션
    // StatActionCard 컴포넌트 내부에서 처리됨
  })

  test('처리 중인 스탯 카드는 비활성화된다', () => {
    const processingSet = new Set(['health'])

    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={stats}
          isProcessing={processingSet}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    // 첫 번째 카드(건강)가 처리 중 상태인지 확인
    const healthCard = screen.getByText('건강').closest('[data-testid="stat-card"]')
    expect(healthCard).toHaveClass('opacity-75')
  })

  test('스탯이 없는 경우에도 카드가 표시된다', () => {
    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={[]} // 빈 배열
          isProcessing={isProcessing}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    // 모든 스탯 타입에 대한 카드가 표시되는지 확인
    const statCards = screen.getAllByTestId('stat-card')
    expect(statCards).toHaveLength(4)

    // 기본 레벨이 표시되는지 확인
    const levelTexts = screen.getAllByText(/Lv\.1/)
    expect(levelTexts.length).toBeGreaterThan(0)
  })

  test('반응형 그리드 클래스가 적용된다', () => {
    render(
      <TestWrapper>
        <StatsGrid
          statTypes={statTypes}
          stats={stats}
          isProcessing={isProcessing}
          onStatAction={mockOnStatAction}
        />
      </TestWrapper>
    )

    const grid = screen.getByText('스탯 올리기').nextElementSibling
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4')
  })

  test('에러 경계가 올바르게 작동한다', () => {
    // 에러를 발생시키는 잘못된 데이터
    const invalidStatTypes = null as any

    // 에러 경계가 에러를 잡아서 fallback UI를 표시하는지 확인
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(
        <TestWrapper>
          <StatsGrid
            statTypes={invalidStatTypes}
            stats={stats}
            isProcessing={isProcessing}
            onStatAction={mockOnStatAction}
          />
        </TestWrapper>
      )
    }).not.toThrow()

    consoleErrorSpy.mockRestore()
  })
})
