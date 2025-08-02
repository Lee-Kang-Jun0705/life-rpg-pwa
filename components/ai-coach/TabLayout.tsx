'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Tab {
  id: string
  label: string
  emoji: string
}

interface TabLayoutProps {
  tabs: Tab[]
  children: React.ReactNode[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function TabLayout({
  tabs,
  children,
  activeTab: externalActiveTab,
  onTabChange
}: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(externalActiveTab || tabs[0]?.id)

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  // 스와이프 제스처를 위한 현재 인덱스 찾기
  const currentIndex = tabs.findIndex(tab => tab.id === activeTab)

  // 좌우 스와이프로 탭 전환
  const handleSwipe = (direction: number) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < tabs.length) {
      handleTabChange(tabs[newIndex].id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 탭 네비게이션 */}
      <nav className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-testid={`ai-coach-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex-1 min-w-[100px] px-4 py-4 flex flex-col items-center gap-1.5 transition-all relative',
                  activeTab === tab.id
                    ? 'text-candy-purple'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <span className="text-3xl">{tab.emoji}</span>
                <span className="text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-candy-blue to-candy-purple"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 relative overflow-hidden pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)
              if (swipe < -swipeConfidenceThreshold) {
                handleSwipe(1)
              } else if (swipe > swipeConfidenceThreshold) {
                handleSwipe(-1)
              }
            }}
            className="h-full overflow-y-auto"
          >
            <div data-testid={`ai-coach-content-${activeTab}`} className="max-w-6xl mx-auto p-4">
              {children[currentIndex]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 모바일 하단 탭바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-testid={`ai-coach-mobile-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex-1 py-3 flex flex-col items-center gap-1 transition-all',
                activeTab === tab.id
                  ? 'text-candy-purple'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <span className="text-2xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// 스와이프 감지를 위한 헬퍼 함수
const swipeConfidenceThreshold = 10000
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
}
