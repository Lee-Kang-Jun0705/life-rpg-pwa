import { render, screen } from '@testing-library/react'
import { AdviceTab } from '../AdviceTab'
import type { PersonalizedAdvice } from '@/lib/ai-coach/types'

// Mock components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div data-testid="card-content" className={className}>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h3 data-testid="card-title" className={className}>{children}</h3>
}))

const mockAdvice: PersonalizedAdvice[] = [
  {
    type: 'strength',
    title: '건강 관리 우수',
    description: '꾸준한 운동으로 건강 스탯이 높게 유지되고 있습니다.',
    actionItems: ['현재 패턴 유지하기', '운동 강도 조금씩 늘리기'],
    priority: 'high'
  },
  {
    type: 'weakness',
    title: '학습 시간 부족',
    description: '학습 활동이 부족합니다. 일일 학습 목표를 설정해보세요.',
    actionItems: ['하루 30분 독서하기', '온라인 강의 수강하기'],
    priority: 'medium'
  },
  {
    type: 'opportunity',
    title: '관계 개선 기회',
    description: '새로운 만남과 소통의 기회를 늘려보세요.',
    actionItems: ['주 1회 친구 만나기', '새로운 모임 참여하기'],
    priority: 'low'
  },
  {
    type: 'habit',
    title: '일관성 있는 루틴 형성',
    description: '규칙적인 활동 패턴을 만들어보세요.',
    actionItems: ['아침 루틴 만들기', '활동 시간 고정하기'],
    priority: 'medium'
  }
]

describe('AdviceTab', () => {
  it('조언이 없을 때 안내 메시지를 보여야 함', () => {
    render(<AdviceTab personalizedAdvice={[]} />)
    
    expect(screen.getByText('더 정확한 조언을 위해 활동 데이터를 수집 중입니다...')).toBeInTheDocument()
    expect(screen.getByText('며칠 더 활동하시면 맞춤형 조언을 받아보실 수 있어요!')).toBeInTheDocument()
  })

  it('조언 목록을 올바르게 렌더링해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    expect(screen.getByText('건강 관리 우수')).toBeInTheDocument()
    expect(screen.getByText('학습 시간 부족')).toBeInTheDocument()
    expect(screen.getByText('관계 개선 기회')).toBeInTheDocument()
    expect(screen.getByText('일관성 있는 루틴 형성')).toBeInTheDocument()
  })

  it('조언 타입별 아이콘을 올바르게 표시해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    const strengthAdvice = screen.getByText('건강 관리 우수').closest('[data-testid="card-title"]')
    const weaknessAdvice = screen.getByText('학습 시간 부족').closest('[data-testid="card-title"]')
    
    expect(strengthAdvice).toHaveTextContent('💪')
    expect(weaknessAdvice).toHaveTextContent('🎯')
  })

  it('조언 타입별 레이블을 올바르게 표시해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    expect(screen.getByText('강점')).toBeInTheDocument()
    expect(screen.getByText('개선점')).toBeInTheDocument()
    expect(screen.getByText('기회')).toBeInTheDocument()
    expect(screen.getByText('습관')).toBeInTheDocument()
  })

  it('우선순위별 라벨을 올바르게 표시해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getAllByText('보통')).toHaveLength(2)
    expect(screen.getByText('낮음')).toBeInTheDocument()
  })

  it('조언 설명을 올바르게 표시해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    expect(screen.getByText('꾸준한 운동으로 건강 스탯이 높게 유지되고 있습니다.')).toBeInTheDocument()
    expect(screen.getByText('학습 활동이 부족합니다. 일일 학습 목표를 설정해보세요.')).toBeInTheDocument()
  })

  it('실행 방안을 올바르게 표시해야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    expect(screen.getByText('현재 패턴 유지하기')).toBeInTheDocument()
    expect(screen.getByText('운동 강도 조금씩 늘리기')).toBeInTheDocument()
    expect(screen.getByText('하루 30분 독서하기')).toBeInTheDocument()
    expect(screen.getByText('온라인 강의 수강하기')).toBeInTheDocument()
  })

  it('우선순위별로 정렬되어야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    const cards = screen.getAllByTestId('card')
    const titles = cards.map(card => 
      card.querySelector('[data-testid="card-title"]')?.textContent
    )
    
    // 높은 우선순위(건강 관리 우수)가 먼저 나와야 함
    expect(titles[0]).toContain('건강 관리 우수')
  })

  it('우선순위별 border 스타일이 적용되어야 함', () => {
    render(<AdviceTab personalizedAdvice={mockAdvice} />)
    
    const cards = screen.getAllByTestId('card')
    
    // 높은 우선순위는 빨간 테두리
    expect(cards[0]).toHaveClass('border-l-red-500')
  })
})