import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatActionCard } from '@/components/dashboard/StatActionCard'
import { StatType, Stat } from '@/lib/types/dashboard'
import { TestWrapper } from '../TestWrapper'

describe('StatActionCard 컴포넌트', () => {
  const mockOnAction = jest.fn()
  
  const statType: StatType = {
    id: '1',
    type: 'health',
    name: '건강',
    emoji: '🏃'
  }
  
  const stat: Stat = {
    id: '1',
    type: 'health',
    experience: 250,
    lastUpdated: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('렌더링 테스트', () => {
    test('스탯 정보가 올바르게 표시된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      // 스탯 이름
      expect(screen.getByText('건강')).toBeInTheDocument()
      
      // 이모지
      expect(screen.getByText('🏃')).toBeInTheDocument()
      
      // 레벨 (경험치 250 = 레벨 3)
      expect(screen.getByText('Lv.3')).toBeInTheDocument()
      
      // 경험치
      expect(screen.getByText('50/100 EXP')).toBeInTheDocument()
    })

    test('스탯이 없을 때 기본값이 표시된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={undefined}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      // 기본 레벨 1
      expect(screen.getByText('Lv.1')).toBeInTheDocument()
      
      // 기본 경험치
      expect(screen.getByText('0/100 EXP')).toBeInTheDocument()
    })

    test('올바른 그라데이션 클래스가 적용된다', () => {
      const { container } = render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const card = container.querySelector('.gradient-health')
      expect(card).toBeInTheDocument()
    })
  })

  describe('상호작용 테스트', () => {
    test('카드 클릭 시 모달이 열린다', async () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const card = screen.getByTestId('stat-card')
      fireEvent.click(card)
      
      // 모달이 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    test('처리 중일 때는 클릭이 비활성화된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={true}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const card = screen.getByTestId('stat-card')
      expect(card).toHaveClass('opacity-75', 'cursor-not-allowed')
      
      // 클릭해도 모달이 열리지 않음
      fireEvent.click(card)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('모달에서 활동 선택 시 onAction이 호출된다', async () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      // 카드 클릭
      const card = screen.getByTestId('stat-card')
      fireEvent.click(card)
      
      // 모달에서 활동 선택
      await waitFor(() => {
        const activityButton = screen.getByText('운동하기')
        fireEvent.click(activityButton)
      })
      
      expect(mockOnAction).toHaveBeenCalledWith('health', '운동하기')
    })
  })

  describe('애니메이션 테스트', () => {
    test('마우스/터치 이벤트에 따라 scale이 변경된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const card = screen.getByTestId('stat-card')
      
      // 마우스 다운
      fireEvent.mouseDown(card)
      expect(card).toHaveClass('scale-95')
      
      // 마우스 업
      fireEvent.mouseUp(card)
      expect(card).not.toHaveClass('scale-95')
    })

    test('진행도 바가 올바른 너비로 표시된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      // 경험치 250 = 레벨 3, 50/100 = 50%
      const progressBar = screen.getByTestId('stat-card').querySelector('.bg-white.rounded-full')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })
  })

  describe('접근성 테스트', () => {
    test('버튼이 올바른 접근성 속성을 가진다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeEnabled()
      
      // 처리 중일 때는 비활성화
      const { rerender } = render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={true}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const disabledButton = screen.getAllByRole('button')[1]
      expect(disabledButton).toBeDisabled()
    })
  })

  describe('반응형 디자인 테스트', () => {
    test('모바일과 데스크탑에서 다른 크기가 적용된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      const card = screen.getByTestId('stat-card').querySelector('div')
      expect(card).toHaveClass('min-h-[140px]', 'md:min-h-[200px]')
      expect(card).toHaveClass('p-4', 'md:p-8')
    })

    test('텍스트 크기가 반응형으로 조정된다', () => {
      render(
        <TestWrapper>
          <StatActionCard 
            statType={statType}
            stat={stat}
            isProcessing={false}
            onAction={mockOnAction}
          />
        </TestWrapper>
      )
      
      // 스탯 이름
      const statName = screen.getByText('건강')
      expect(statName).toHaveClass('text-lg', 'md:text-2xl')
      
      // 레벨
      const level = screen.getByText('Lv.3')
      expect(level).toHaveClass('text-xl', 'md:text-3xl')
    })
  })
})