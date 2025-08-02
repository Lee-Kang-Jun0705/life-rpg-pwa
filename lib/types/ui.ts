// UI 관련 타입 정의

export interface SwipeAction {
  direction: 'up' | 'down' | 'left' | 'right'
  action: string
  emoji: string
  color: string
}

export type GradientClass = 'gradient-health' | 'gradient-learning' | 'gradient-relationship' | 'gradient-achievement'

export interface AnimationProps {
  delay?: string | number
  duration?: string | number
}

export interface ThemeColors {
  candyPink: string
  candyBlue: string
  candyYellow: string
  candyGreen: string
  candyPurple: string
  candyOrange: string
  candyMint: string
  candyCoral: string
}

export type EmojiSize = 'giant' | 'large' | 'medium'
