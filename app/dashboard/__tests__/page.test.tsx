import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import Dashboard from '../page'

// DB 모킹
jest.mock('@/lib/offline/db', () => ({
  db: {
    stats: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([
        { id: '1', userId: 'demo-user', type: 'health', value: 80, createdAt: new Date() },
        { id: '2', userId: 'demo-user', type: 'learning', value: 60, createdAt: new Date() },
        { id: '3', userId: 'demo-user', type: 'relationship', value: 70, createdAt: new Date() },
        { id: '4', userId: 'demo-user', type: 'achievement', value: 90, createdAt: new Date() }
      ])
    },
    activities: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      reverse: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([
        {
          id: '1',
          userId: 'demo-user',
          type: 'learning',
          description: '테스트 활동',
          experience: 10,
          createdAt: new Date()
        }
      ])
    }
  },
  dbHelpers: {
    getRecentActivities: jest.fn().mockResolvedValue([
      {
        id: '1',
        userId: 'demo-user',
        type: 'learning',
        description: '테스트 활동',
        experience: 10,
        createdAt: new Date()
      }
    ])
  }
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('대시보드가 렌더링되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Life RPG/)).toBeInTheDocument()
    })
  })

  it('환영 메시지가 표시되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      const welcomeText = screen.getByText(/님,|안녕하세요/)
      expect(welcomeText).toBeInTheDocument()
    })
  })

  it('스탯 카드들이 표시되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('건강')).toBeInTheDocument()
      expect(screen.getByText('학습')).toBeInTheDocument()
      expect(screen.getByText('관계')).toBeInTheDocument()
      expect(screen.getByText('성취')).toBeInTheDocument()
    })
  })

  it('스탯 값들이 올바르게 표시되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('80')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('70')).toBeInTheDocument()
      expect(screen.getByText('90')).toBeInTheDocument()
    })
  })

  it('최근 활동이 표시되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('최근 활동')).toBeInTheDocument()
      expect(screen.getByText('테스트 활동')).toBeInTheDocument()
    })
  })

  it('음성 입력 버튼이 표시되어야 함', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      const voiceButton = screen.getByRole('button', { name: /음성으로 활동 기록/ })
      expect(voiceButton).toBeInTheDocument()
    })
  })

  it('오프라인 상태가 표시되어야 함', async () => {
    // 오프라인 상태 시뮬레이션
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('오프라인')).toBeInTheDocument()
    })

    // 온라인 상태로 복원
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })
})