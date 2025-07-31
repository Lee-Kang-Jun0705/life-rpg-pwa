import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatCard } from './StatCard'
import { Stat, StatType } from '@/lib/types/dashboard'

describe('StatCard', () => {
  const mockStatType: StatType = {
    type: 'health',
    name: '건강',
    emoji: '💪',
    color: 'red',
    variant: 'default' as const
  }

  const mockStat: Stat = {
    userId: 'test-user',
    type: 'health',
    level: 5,
    experience: 450,
    totalActivities: 20,
    updatedAt: new Date()
  }

  const mockOnClick = jest.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('renders stat information correctly', () => {
    render(
      <StatCard
        statType={mockStatType}
        stat={mockStat}
        isProcessing={false}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('💪')).toBeInTheDocument()
    expect(screen.getByText('건강')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('handles click event', () => {
    render(
      <StatCard
        statType={mockStatType}
        stat={mockStat}
        isProcessing={false}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledWith('health')
  })

  it('handles swipe event', () => {
    const { container } = render(
      <StatCard
        statType={mockStatType}
        stat={mockStat}
        isProcessing={false}
        onClick={mockOnClick}
      />
    )

    const card = container.firstChild as HTMLElement

    // Simulate swipe
    fireEvent.touchStart(card, {
      targetTouches: [{ clientX: 100 }]
    })

    fireEvent.touchMove(card, {
      targetTouches: [{ clientX: 200 }]
    })

    fireEvent.touchEnd(card)

    expect(mockOnClick).toHaveBeenCalledWith('health')
  })

  it('does not trigger on small swipe', () => {
    const { container } = render(
      <StatCard
        statType={mockStatType}
        stat={mockStat}
        isProcessing={false}
        onClick={mockOnClick}
      />
    )

    const card = container.firstChild as HTMLElement

    // Simulate small swipe (less than 50px)
    fireEvent.touchStart(card, {
      targetTouches: [{ clientX: 100 }]
    })

    fireEvent.touchMove(card, {
      targetTouches: [{ clientX: 120 }]
    })

    fireEvent.touchEnd(card)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('disables interaction when processing', () => {
    render(
      <StatCard
        statType={mockStatType}
        stat={mockStat}
        isProcessing={true}
        onClick={mockOnClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(mockOnClick).not.toHaveBeenCalled()
  })
})