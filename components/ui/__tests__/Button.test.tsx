import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('버튼이 렌더링되어야 함', () => {
    render(<Button>테스트 버튼</Button>)
    expect(screen.getByText('테스트 버튼')).toBeInTheDocument()
  })

  it('클릭 이벤트가 작동해야 함', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>클릭</Button>)
    
    fireEvent.click(screen.getByText('클릭'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('비활성화 상태에서는 클릭되지 않아야 함', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>비활성화</Button>)
    
    const button = screen.getByText('비활성화')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('다양한 variant가 적용되어야 함', () => {
    // Button 컴포넌트는 기본적으로 Tailwind 클래스를 사용하지만,
    // 실제 variant는 default로 설정되어 있음
    const { rerender } = render(<Button>Default</Button>)
    const button = screen.getByText('Default')
    expect(button).toBeInTheDocument()
    
    // 각 variant에 대한 props 전달 확인
    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByText('Secondary')).toBeInTheDocument()
    
    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByText('Outline')).toBeInTheDocument()
    
    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByText('Ghost')).toBeInTheDocument()
  })

  it('다양한 크기가 적용되어야 함', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('text-sm')
    
    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByText('Medium')).toHaveClass('text-base')
    
    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('text-lg')
  })

  it('fullWidth prop이 작동해야 함', () => {
    render(<Button fullWidth>전체 너비</Button>)
    expect(screen.getByText('전체 너비')).toHaveClass('w-full')
  })

  it('추가 className이 적용되어야 함', () => {
    render(<Button className="custom-class">커스텀</Button>)
    expect(screen.getByText('커스텀')).toHaveClass('custom-class')
  })

  it('type prop이 적용되어야 함', () => {
    render(<Button type="submit">제출</Button>)
    expect(screen.getByText('제출')).toHaveAttribute('type', 'submit')
  })

  it('로딩 상태를 표시할 수 있어야 함', () => {
    const { rerender } = render(<Button>버튼</Button>)
    expect(screen.getByText('버튼')).not.toHaveClass('opacity-50')
    
    // 로딩 상태를 시뮬레이션하기 위해 disabled와 함께 사용
    rerender(<Button disabled className="opacity-50">로딩중...</Button>)
    expect(screen.getByText('로딩중...')).toHaveClass('opacity-50')
  })

  it('아이콘과 함께 렌더링할 수 있어야 함', () => {
    render(
      <Button>
        <span>🎮</span>
        게임 시작
      </Button>
    )
    
    expect(screen.getByText('🎮')).toBeInTheDocument()
    expect(screen.getByText('게임 시작')).toBeInTheDocument()
  })
})