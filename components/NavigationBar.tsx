'use client'

import React, { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, NAV_CONFIG } from '@/lib/constants/navigation.constants'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useBattleStore } from '@/lib/stores/battleStore'

interface NavigationBarProps {
  defaultVisible?: boolean
}

export function NavigationBar({ defaultVisible = false }: NavigationBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(defaultVisible)
  const isInBattle = useBattleStore((state) => state.isInBattle)
  
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isVisible])

  // 프리페치를 통한 페이지 로딩 최적화
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 현재 페이지와 같은 경우 무시
    if (pathname === href) {
      e.preventDefault()
      return
    }
    
    // Next.js Link의 기본 동작을 유지하면서 프리페치만 수행
    // e.preventDefault()를 제거하여 Link의 기본 네비게이션을 허용
    router.prefetch(href)
  }, [pathname, router])

  // 햅틱 피드백 (모바일에서)
  const handleTouchStart = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(NAV_CONFIG.HAPTIC_DURATION)
    }
  }, [])

  return (
    <>
      {/* 플로팅 메뉴 버튼 - 전투 중이 아닐 때만 표시 */}
      <AnimatePresence>
        {!isVisible && !isInBattle && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVisible(true)}
            className="fixed bottom-6 left-6 z-[55] w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            aria-label="메뉴 열기"
          >
            <Menu className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 배경 오버레이 (모바일) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 네비게이션 바 */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            data-testid="navigation-bar"
            className="fixed bottom-2 left-2 right-2 z-50 pointer-events-none"
            aria-label="메인 네비게이션"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-3 pointer-events-auto relative">
              {/* 닫기 버튼 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="w-4 h-4 text-gray-300" />
              </motion.button>
        <ul className="flex items-center justify-around w-full list-none m-0 p-0" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <li key={item.id} className="flex-1 flex justify-center">
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onTouchStart={handleTouchStart}
                  className={cn(
                    'relative flex flex-row items-center justify-center gap-2',
                    'py-2 px-3 min-w-[80px]',
                    'rounded-2xl transition-all duration-200',
                    'touch-manipulation select-none',
                    'hover:scale-105 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'transform-gpu' // GPU 가속 활성화
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${item.label} 페이지로 이동`}
                >
                  {/* 활성 상태 배경 */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl" />
                  )}
                  
                  {/* 아이콘과 라벨 */}
                  <span 
                    className={cn(
                      'text-2xl transition-all duration-200',
                      isActive ? 'scale-110' : ''
                    )} 
                    role="img" 
                    aria-label={item.label}
                  >
                    {item.emoji}
                  </span>
                  
                  <span className={cn(
                    'text-sm font-semibold transition-all duration-200',
                    isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
            </div>
            
            {/* 애니메이션 스타일 */}
            <style jsx>{`
              @media (prefers-reduced-motion: reduce) {
                * {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `}</style>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}