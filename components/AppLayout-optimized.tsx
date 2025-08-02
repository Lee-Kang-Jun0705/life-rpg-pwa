'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Activity, Trophy, Settings, Swords, Package,
  ChartBar, Target, Gift, Brain, Users, Sparkles,
  User, Menu, X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: Home },
  { href: '/activities', label: '활동', icon: Activity },
  { href: '/adventure', label: '모험', icon: Swords },
  { href: '/inventory', label: '인벤토리', icon: Package },
  { href: '/skills', label: '스킬', icon: Target },
  { href: '/collection', label: '컬렉션', icon: Sparkles },
  { href: '/achievements', label: '업적', icon: Trophy },
  { href: '/ranking', label: '랭킹', icon: ChartBar },
  { href: '/daily', label: '일일', icon: Gift },
  { href: '/ai-coach', label: 'AI 코치', icon: Brain },
  { href: '/profile', label: '프로필', icon: User },
  { href: '/settings', label: '설정', icon: Settings }
]

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 페이지 프리페치
  useEffect(() => {
    // 현재 페이지 인덱스 찾기
    const currentIndex = navItems.findIndex(item => item.href === pathname)

    if (currentIndex !== -1) {
      // 다음 페이지와 이전 페이지 프리페치
      const nextItem = navItems[currentIndex + 1]
      const prevItem = navItems[currentIndex - 1]

      if (nextItem) {
        router.prefetch(nextItem.href)
      }
      if (prevItem) {
        router.prefetch(prevItem.href)
      }

      // 인기 페이지들 프리페치
      const popularPages = ['/dashboard', '/adventure', '/activities']
      popularPages.forEach(page => {
        if (page !== pathname) {
          router.prefetch(page)
        }
      })
    }
  }, [pathname, router])

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(!isMenuOpen)
  }, [isMenuOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={toggleMenu}
        className="fixed bottom-4 right-4 z-50 md:hidden bg-primary text-white p-3 rounded-full shadow-lg"
        aria-label="메뉴 토글"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 사이드바 */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 transform transition-transform
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Life RPG
            </h1>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                      `}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* 오버레이 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* 메인 컨텐츠 */}
      <main className="md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
