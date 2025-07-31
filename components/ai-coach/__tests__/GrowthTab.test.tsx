import { render, screen } from '@testing-library/react'
import { GrowthTab } from '../GrowthTab'
import type { ChartDataPoint, GrowthAnalysis } from '@/lib/ai-coach/types'

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }: { name: string }) => <div data-testid="line">{name}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}))

// Mock UI components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>
}))

const mockGrowthData: ChartDataPoint[] = [
  {
    date: '2024-01-15',
    health: 120,
    learning: 80,
    relationship: 40,
    achievement: 100
  },
  {
    date: '2024-01-16',
    health: 135,
    learning: 95,
    relationship: 55,
    achievement: 110
  }
]

const mockGrowthAnalyses: GrowthAnalysis[] = [
  {
    statType: 'health',
    growthRate: 15.5,
    trend: 'improving',
    lastActivityDate: new Date('2024-01-16'),
    totalActivities: 10,
    suggestions: ['매일 운동하기', '건강한 식단 유지하기']
  },
  {
    statType: 'learning',
    growthRate: 8.2,
    trend: 'stable',
    lastActivityDate: new Date('2024-01-15'),
    totalActivities: 6,
    suggestions: ['독서 시간 늘리기', '온라인 강의 수강하기']
  },
  {
    statType: 'relationship',
    growthRate: 3.1,
    trend: 'declining',
    lastActivityDate: new Date('2024-01-14'),
    totalActivities: 3,
    suggestions: ['친구와 만나기', '새로운 사람들과 소통하기']
  },
  {
    statType: 'achievement',
    growthRate: 12.0,
    trend: 'improving',
    lastActivityDate: new Date('2024-01-16'),
    totalActivities: 8,
    suggestions: ['목표 설정하기', '작은 성취 축하하기']
  }
]

describe('GrowthTab', () => {
  it('성장 데이터가 있을 때 차트를 렌더링해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByText('30일 성장 추이')).toBeInTheDocument()
  })

  it('성장 데이터가 없을 때 안내 메시지를 보여야 함', () => {
    render(<GrowthTab growthData={[]} growthAnalyses={[]} />)
    
    expect(screen.getByText('성장 데이터를 수집 중입니다...')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('모든 스탯의 차트 라인을 렌더링해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('건강')).toBeInTheDocument()
    expect(screen.getByText('학습')).toBeInTheDocument()
    expect(screen.getByText('관계')).toBeInTheDocument()
    expect(screen.getByText('성취')).toBeInTheDocument()
  })

  it('스탯별 성장 분석 카드를 렌더링해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('🏃 건강')).toBeInTheDocument()
    expect(screen.getByText('📚 학습')).toBeInTheDocument()
    expect(screen.getByText('🤝 관계')).toBeInTheDocument()
    expect(screen.getByText('🎯 성취')).toBeInTheDocument()
  })

  it('성장률을 올바르게 표시해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('15.5 EXP')).toBeInTheDocument()
    expect(screen.getByText('8.2 EXP')).toBeInTheDocument()
    expect(screen.getByText('3.1 EXP')).toBeInTheDocument()
    expect(screen.getByText('12.0 EXP')).toBeInTheDocument()
  })

  it('추세를 올바른 색상과 아이콘으로 표시해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    // 상승 추세
    const improvingTrends = screen.getAllByText('상승')
    expect(improvingTrends).toHaveLength(2) // health, achievement
    
    // 정체 추세
    expect(screen.getByText('정체')).toBeInTheDocument()
    
    // 하락 추세
    expect(screen.getByText('하락')).toBeInTheDocument()
  })

  it('총 활동 횟수를 표시해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('10회')).toBeInTheDocument()
    expect(screen.getByText('6회')).toBeInTheDocument()
    expect(screen.getByText('3회')).toBeInTheDocument()
    expect(screen.getByText('8회')).toBeInTheDocument()
  })

  it('마지막 활동 날짜를 표시해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('2024. 1. 16.')).toBeInTheDocument()
    expect(screen.getByText('2024. 1. 15.')).toBeInTheDocument()
    expect(screen.getByText('2024. 1. 14.')).toBeInTheDocument()
  })

  it('추천사항을 표시해야 함', () => {
    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={mockGrowthAnalyses} />)
    
    expect(screen.getByText('매일 운동하기')).toBeInTheDocument()
    expect(screen.getByText('건강한 식단 유지하기')).toBeInTheDocument()
    expect(screen.getByText('독서 시간 늘리기')).toBeInTheDocument()
    expect(screen.getByText('온라인 강의 수강하기')).toBeInTheDocument()
  })

  it('추천사항이 2개까지만 표시되어야 함', () => {
    const analysisWithManySuggestions: GrowthAnalysis[] = [
      {
        statType: 'health',
        growthRate: 15.5,
        trend: 'improving',
        lastActivityDate: new Date('2024-01-16'),
        totalActivities: 10,
        suggestions: ['첫 번째 제안', '두 번째 제안', '세 번째 제안', '네 번째 제안']
      }
    ]

    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={analysisWithManySuggestions} />)
    
    expect(screen.getByText('첫 번째 제안')).toBeInTheDocument()
    expect(screen.getByText('두 번째 제안')).toBeInTheDocument()
    expect(screen.queryByText('세 번째 제안')).not.toBeInTheDocument()
    expect(screen.queryByText('네 번째 제안')).not.toBeInTheDocument()
  })

  it('추천사항이 없을 때는 추천사항 섹션을 표시하지 않아야 함', () => {
    const analysisWithoutSuggestions: GrowthAnalysis[] = [
      {
        statType: 'health',
        growthRate: 15.5,
        trend: 'improving',
        lastActivityDate: new Date('2024-01-16'),
        totalActivities: 10,
        suggestions: []
      }
    ]

    render(<GrowthTab growthData={mockGrowthData} growthAnalyses={analysisWithoutSuggestions} />)
    
    expect(screen.queryByText('추천사항')).not.toBeInTheDocument()
  })
})
