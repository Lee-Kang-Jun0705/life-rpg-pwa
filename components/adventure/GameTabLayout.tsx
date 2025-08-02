'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { soundService } from '@/lib/services/sound.service'

interface Tab {
  id: string
  label: string
  emoji: string
  description?: string
}

interface GameTabLayoutProps {
  tabs: Tab[]
  children: React.ReactNode[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function GameTabLayout({
  tabs,
  children,
  activeTab: externalActiveTab,
  onTabChange
}: GameTabLayoutProps) {
  const [activeTab, setActiveTab] = useState(externalActiveTab || tabs[0]?.id)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
    soundService.playEffect('button_click') // 탭 클릭 효과음
  }

  // 현재 인덱스 찾기
  const currentIndex = tabs.findIndex(tab => tab.id === activeTab)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 탭 네비게이션 */}
      <nav className="sticky top-0 z-40 bg-gradient-to-b from-gray-900/95 to-gray-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <div key={tab.id} className="relative">
                  <motion.button
                    data-testid={`ai-coach-tab-${tab.id}`}
                    onClick={() => handleTabChange(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative px-6 py-3 rounded-xl transition-all duration-300',
                      'bg-gradient-to-br',
                      activeTab === tab.id
                        ? 'from-purple-600/30 to-pink-600/30 text-white shadow-lg shadow-purple-500/25'
                        : 'from-gray-800/50 to-gray-700/50 text-gray-400 hover:text-white',
                      'border border-gray-700/50 hover:border-purple-500/50',
                      'backdrop-blur-sm'
                    )}
                  >
                    {/* 활성 탭 배경 효과 */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* 탭 콘텐츠 */}
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <motion.span
                        className="text-2xl"
                        animate={{
                          rotate: activeTab === tab.id ? [0, -10, 10, -10, 0] : 0,
                          scale: activeTab === tab.id ? 1.1 : 1
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {tab.emoji}
                      </motion.span>
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>

                    {/* 활성 탭 하단 빛 효과 */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>

                  {/* 호버 툴팁 */}
                  <AnimatePresence>
                    {hoveredTab === tab.id && tab.description && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50"
                      >
                        <div className="bg-gray-800 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-gray-300 whitespace-nowrap shadow-xl">
                          {tab.description}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-l border-t border-purple-500/30 rotate-45" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <div data-testid={`ai-coach-content-${activeTab}`} className="h-full">
              {children[currentIndex]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 모바일 하단 탭바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 to-gray-900/80 backdrop-blur-xl border-t border-purple-500/20">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              data-testid={`ai-coach-mobile-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'flex-1 py-2 flex flex-col items-center gap-1 transition-all',
                activeTab === tab.id
                  ? 'text-purple-400'
                  : 'text-gray-500'
              )}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                />
              )}
            </motion.button>
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
