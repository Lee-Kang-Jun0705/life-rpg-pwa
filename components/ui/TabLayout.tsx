'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  emoji: string
}

interface TabLayoutProps {
  tabs: Tab[]
  children: React.ReactNode
  className?: string
}

export function TabLayout({ tabs, children, className }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  const childrenArray = React.Children.toArray(children)

  return (
    <div className={cn('w-full', className)}>
      {/* 탭 헤더 */}
      <div className="flex gap-2 mb-6 p-2 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm shadow-sm">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70 hover:scale-105'
            )}
          >
            <span className="text-lg">{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="w-full">
        {childrenArray.map((child, index) => {
          const tabId = tabs[index]?.id
          if (!tabId || activeTab !== tabId) {
            return null
          }

          return (
            <div
              key={tabId}
              className="animate-fade-in"
            >
              {child}
            </div>
          )
        })}
      </div>
    </div>
  )
}
