'use client'

import { ReactNode, useEffect, useState } from 'react'
import { NavigationBar } from './NavigationBar'
import { ErrorNotifications } from './ErrorNotifications'
import { OfflineIndicator } from './OfflineIndicator'
import { ThemeToggle } from './ThemeToggle'
import { SaveLoadIndicator } from './SaveLoadIndicator'
import { usePathname } from 'next/navigation'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useAchievementToast } from '@/hooks/useAchievementToast'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const showNavigation = pathname !== '/'
  const { isReady, error } = useServiceWorker()
  const [isMounted, setIsMounted] = useState(false)
  
  // 업적 달성 Toast 알림
  useAchievementToast()
  
  // 클라이언트 사이드에서만 렌더링
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // 디버깅 로그
  useEffect(() => {
    console.log('🗺️ Current pathname:', pathname)
    console.log('👁️ Show navigation:', showNavigation)
    console.log('🎨 Children type:', typeof children)
  }, [pathname, showNavigation, children])

  useEffect(() => {
    if (isReady) {
      console.log('Service Worker가 준비되었습니다.')
    }
    if (error) {
      console.error('Service Worker 오류:', error)
    }
  }, [isReady, error])

  return (
    <div className="relative min-h-screen bg-background">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 safe-top">
          <h1 className="text-xl font-bold">Life RPG</h1>
          {isMounted ? <ThemeToggle /> : <div className="w-10 h-10" />}
        </div>
      </header>

      {/* 오프라인 인디케이터 */}
      <OfflineIndicator />

      {/* 에러 알림 */}
      <ErrorNotifications />

      {/* 메인 콘텐츠 */}
      <main 
        id="main-content"
        tabIndex={-1}
        className={cn(
          'pt-14', // 헤더 높이
          // 네비게이션 바가 숨겨진 상태이므로 패딩 제거
        )}
      >
        {children}
      </main>

      {/* 네비게이션 바 */}
      {showNavigation && (
        <NavigationBar defaultVisible={false} />
      )}

      {/* 저장/불러오기 인디케이터 */}
      {showNavigation && <SaveLoadIndicator />}
    </div>
  )
}