import React from 'react'
import { cn } from '@/lib/utils'

interface TabSkeletonProps {
  className?: string
  tabName?: string
}

export function TabSkeleton({ className, tabName }: TabSkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="mb-4">
          <div className="h-6 bg-gray-700 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-700 rounded w-48" />
        </div>
        
        {/* 탭별 스켈레톤 */}
        {tabName === 'quest' && <QuestSkeleton />}
        {tabName === 'dungeon' && <DungeonSkeleton />}
        {tabName === 'inventory' && <InventorySkeleton />}
        {tabName === 'skill' && <SkillSkeleton />}
        {tabName === 'shop' && <ShopSkeleton />}
        {tabName === 'achievement' && <AchievementSkeleton />}
        
        {/* 기본 스켈레톤 */}
        {!tabName && <DefaultSkeleton />}
      </div>
    </div>
  )
}

function QuestSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-4">
          <div className="h-5 bg-gray-600 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-600 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function DungeonSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-6">
          <div className="h-6 bg-gray-600 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-600 rounded w-full mb-2" />
          <div className="h-4 bg-gray-600 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg aspect-square p-4">
          <div className="w-full h-full bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  )
}

function SkillSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-700/50 rounded-lg aspect-square" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-700/50 rounded-lg p-3">
            <div className="h-4 bg-gray-600 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ShopSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-4">
          <div className="w-full h-32 bg-gray-600 rounded mb-3" />
          <div className="h-5 bg-gray-600 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-600 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function AchievementSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full" />
          <div className="flex-1">
            <div className="h-5 bg-gray-600 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-600 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DefaultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-gray-700 rounded" />
      <div className="h-32 bg-gray-700 rounded" />
    </div>
  )
}