import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Profile from '../page'

// Mock contexts
jest.mock('@/lib/character/character-context', () => ({
  useCharacter: () => ({
    currentAppearance: {
      gender: 'female',
      skinTone: 'medium',
      hairstyle: 'long',
      hairColor: 'blonde',
      eyeColor: 'blue',
      outfit: 'warrior',
      accessories: ['glasses']
    }
  })
}))

jest.mock('@/lib/i18n/i18n-context', () => ({
  useI18n: () => ({
    t: {
      common: {
        profile: '프로필',
        edit: '편집',
        save: '저장',
        cancel: '취소'
      },
      profile: {
        level: '레벨',
        exp: '경험치',
        nextLevel: '다음 레벨까지',
        totalExp: '총 경험치',
        joined: '가입일',
        lastActive: '마지막 활동',
        bio: '자기소개',
        stats: {
          title: '스탯',
          health: '체력',
          mana: '정신력',
          strength: '근력',
          focus: '집중력'
        },
        achievements: {
          title: '업적',
          empty: '아직 획득한 업적이 없습니다'
        }
      }
    }
  })
}))

describe('Profile Page', () => {
  it('프로필 페이지가 렌더링되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('프로필')).toBeInTheDocument()
  })

  it('캐릭터가 표시되어야 함', () => {
    render(<Profile />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg).toBeInTheDocument()
  })

  it('사용자 이름이 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('플레이어')).toBeInTheDocument()
  })

  it('레벨 정보가 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText(/Lv\.\s*1/)).toBeInTheDocument()
    expect(screen.getByText('레벨')).toBeInTheDocument()
  })

  it('경험치 정보가 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('경험치')).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 100 XP/)).toBeInTheDocument()
  })

  it('스탯 정보가 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('스탯')).toBeInTheDocument()
    expect(screen.getByText('체력')).toBeInTheDocument()
    expect(screen.getByText('정신력')).toBeInTheDocument()
    expect(screen.getByText('근력')).toBeInTheDocument()
    expect(screen.getByText('집중력')).toBeInTheDocument()
  })

  it('업적 섹션이 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('업적')).toBeInTheDocument()
  })

  it('편집 버튼이 표시되어야 함', () => {
    render(<Profile />)
    const editButton = screen.getByRole('button', { name: /편집/i })
    expect(editButton).toBeInTheDocument()
  })

  it('편집 모드로 전환할 수 있어야 함', () => {
    render(<Profile />)
    const editButton = screen.getByRole('button', { name: /편집/i })

    fireEvent.click(editButton)

    // 편집 모드에서는 저장/취소 버튼이 나타남
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument()
  })

  it('자기소개 섹션이 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('자기소개')).toBeInTheDocument()
  })

  it('가입일이 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('가입일')).toBeInTheDocument()
  })

  it('마지막 활동 시간이 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('마지막 활동')).toBeInTheDocument()
  })

  it('총 경험치가 표시되어야 함', () => {
    render(<Profile />)
    expect(screen.getByText('총 경험치')).toBeInTheDocument()
    expect(screen.getByText('0 XP')).toBeInTheDocument()
  })

  it('편집 취소가 작동해야 함', () => {
    render(<Profile />)

    // 편집 모드로 전환
    const editButton = screen.getByRole('button', { name: /편집/i })
    fireEvent.click(editButton)

    // 취소 클릭
    const cancelButton = screen.getByRole('button', { name: /취소/i })
    fireEvent.click(cancelButton)

    // 다시 편집 버튼이 보여야 함
    expect(screen.getByRole('button', { name: /편집/i })).toBeInTheDocument()
  })
})
