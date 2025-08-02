'use client'

import dynamic from 'next/dynamic'
import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

// 자주 사용하는 아이콘들은 즉시 로드
import {
  Home,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Plus,
  Minus
} from 'lucide-react'

// 나머지 아이콘들은 동적 로드
const iconMap = {
  // 즉시 로드되는 아이콘들
  home: Home,
  user: User,
  settings: Settings,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  x: X,
  check: Check,
  plus: Plus,
  minus: Minus,

  // 동적 로드 아이콘들
  sword: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sword }))),
  shield: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Shield }))),
  heart: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Heart }))),
  brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain }))),
  users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users }))),
  trophy: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trophy }))),
  zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap }))),
  star: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Star }))),
  sparkles: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sparkles }))),
  flame: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Flame }))),
  book: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Book }))),
  calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar }))),
  clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
  gift: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Gift }))),
  coins: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Coins }))),
  gem: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Gem }))),
  scroll: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Scroll }))),
  map: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Map }))),
  target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target }))),
  award: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Award })))
} as const

export type IconName = keyof typeof iconMap

interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  name: IconName
  size?: number | string
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  const IconComponent = iconMap[name] as LucideIcon

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return <IconComponent size={size} className={className} {...props} />
}

// 아이콘 프리로드 함수
export function preloadIcons(icons: IconName[]) {
  icons.forEach(iconName => {
    const icon = iconMap[iconName]
    if (typeof icon === 'object' && 'preload' in icon) {
      // 동적 컴포넌트의 경우 프리로드
      (icon as unknown).preload()
    }
  })
}
