/**
 * 네비게이션 관련 상수 정의
 */

export interface NavItem {
  id: string
  href: string
  label: string
  emoji: string
}

// 테스트에서 사용하는 주요 네비게이션 항목
export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', label: '대시보드', emoji: '🏠', href: '/dashboard' },
  { id: 'nav-dungeon', label: '던전', emoji: '🏰', href: '/dungeon' },
  { id: 'nav-ai-coach', label: 'AI코치', emoji: '🤖', href: '/ai-coach' },
  { id: 'nav-profile', label: '프로필', emoji: '👤', href: '/profile' }
] as const

// 전체 네비게이션 항목
export const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', label: '대시보드', emoji: '🏠', href: '/dashboard' },
  { id: 'nav-dungeon', label: '던전', emoji: '🏰', href: '/dungeon' },
  { id: 'nav-ai-coach', label: 'AI코치', emoji: '🤖', href: '/ai-coach' },
  { id: 'nav-profile', label: '프로필', emoji: '👤', href: '/profile' }
] as const

// 네비게이션 설정
export const NAV_CONFIG = {
  HAPTIC_DURATION: 10, // ms
  ANIMATION_DELAY_MULTIPLIER: 0.1 // 각 아이템 애니메이션 지연
} as const
