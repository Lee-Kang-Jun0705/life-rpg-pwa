import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card'

describe('Card Components', () => {
  describe('Card', () => {
    it('기본 카드가 렌더링되어야 함', () => {
      render(<Card>카드 내용</Card>)
      expect(screen.getByText('카드 내용')).toBeInTheDocument()
    })

    it('hover 효과가 있는 카드를 렌더링할 수 있어야 함', () => {
      render(<Card hover>호버 카드</Card>)
      const card = screen.getByText('호버 카드').parentElement
      expect(card).toHaveClass('hover:shadow-xl')
    })

    it('추가 className이 적용되어야 함', () => {
      render(<Card className="custom-card">커스텀 카드</Card>)
      const card = screen.getByText('커스텀 카드').parentElement
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('CardHeader', () => {
    it('카드 헤더가 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>헤더 내용</CardHeader>
        </Card>
      )
      expect(screen.getByText('헤더 내용')).toBeInTheDocument()
    })

    it('올바른 스타일이 적용되어야 함', () => {
      render(
        <Card>
          <CardHeader>스타일 헤더</CardHeader>
        </Card>
      )
      const header = screen.getByText('스타일 헤더')
      expect(header).toHaveClass('p-6', 'pb-3')
    })
  })

  describe('CardTitle', () => {
    it('카드 제목이 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>제목</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('제목')).toBeInTheDocument()
    })

    it('h3 태그로 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>제목 태그</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('제목 태그')
      expect(title.tagName).toBe('H3')
    })
  })

  describe('CardDescription', () => {
    it('카드 설명이 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>설명 텍스트</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('설명 텍스트')).toBeInTheDocument()
    })

    it('p 태그로 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>설명 태그</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('설명 태그')
      expect(description.tagName).toBe('P')
    })
  })

  describe('CardContent', () => {
    it('카드 내용이 렌더링되어야 함', () => {
      render(
        <Card>
          <CardContent>본문 내용</CardContent>
        </Card>
      )
      expect(screen.getByText('본문 내용')).toBeInTheDocument()
    })

    it('올바른 패딩이 적용되어야 함', () => {
      render(
        <Card>
          <CardContent>패딩 테스트</CardContent>
        </Card>
      )
      const content = screen.getByText('패딩 테스트')
      expect(content).toHaveClass('p-6', 'pt-3')
    })
  })

  describe('CardFooter', () => {
    it('카드 푸터가 렌더링되어야 함', () => {
      render(
        <Card>
          <CardFooter>푸터 내용</CardFooter>
        </Card>
      )
      expect(screen.getByText('푸터 내용')).toBeInTheDocument()
    })

    it('올바른 스타일이 적용되어야 함', () => {
      render(
        <Card>
          <CardFooter>스타일 푸터</CardFooter>
        </Card>
      )
      const footer = screen.getByText('스타일 푸터')
      expect(footer).toHaveClass('p-6', 'pt-3')
    })
  })

  describe('전체 카드 구조', () => {
    it('완전한 카드 구조가 렌더링되어야 함', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>카드 제목</CardTitle>
            <CardDescription>카드 설명입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <p>카드 본문 내용입니다</p>
          </CardContent>
          <CardFooter>
            <button>액션 버튼</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('카드 제목')).toBeInTheDocument()
      expect(screen.getByText('카드 설명입니다')).toBeInTheDocument()
      expect(screen.getByText('카드 본문 내용입니다')).toBeInTheDocument()
      expect(screen.getByText('액션 버튼')).toBeInTheDocument()
    })
  })
})
