'use client'

import React, { useMemo } from 'react'
import type { AchievementStats } from '@/lib/types/achievements'
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DIFFICULTIES } from '@/lib/achievements/achievement-data'
import { motion } from 'framer-motion'
import { Trophy, Target, Coins, Zap, Crown, Gift } from 'lucide-react'
import { getCardStyle, textStyles } from '@/lib/utils/style-utils'

interface AchievementStatsProps {
  stats: AchievementStats
}

export function AchievementStats({ stats }: AchievementStatsProps) {
  // 메인 통계 카드 데이터 메모이제이션
  const mainStatsCards = useMemo(() => [
    {
      icon: Trophy,
      value: stats.unlockedAchievements,
      subtitle: `/ ${stats.totalAchievements} 달성`,
      color: 'yellow',
      bgGradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30'
    },
    {
      icon: Target,
      value: `${stats.completionRate}%`,
      subtitle: '완성률',
      color: 'purple',
      bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30'
    },
    {
      icon: Zap,
      value: stats.totalRewardsEarned.exp.toLocaleString(),
      subtitle: '총 경험치',
      color: 'blue',
      bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30'
    },
    {
      icon: Coins,
      value: stats.totalRewardsEarned.gold.toLocaleString(),
      subtitle: '총 골드',
      color: 'green',
      bgGradient: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30'
    }
  ], [stats])

  return (
    <div className="mb-8 space-y-6">
      {/* 메인 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainStatsCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <motion.div
              key={card.color}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${card.bgGradient} rounded-xl p-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${card.color}-500 rounded-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`text-2xl font-bold text-${card.color}-600 dark:text-${card.color}-400`}>
                    {card.value}
                  </div>
                  <div className={textStyles.body.small}>
                    {card.subtitle}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 전체 진행도 바 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">전체 업적 달성률</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-purple-500" />
              <span>{stats.totalRewardsEarned.titles} 칭호</span>
            </div>
            <div className="flex items-center gap-1">
              <Gift className="w-4 h-4 text-green-500" />
              <span>{stats.totalRewardsEarned.items} 아이템</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full rounded-full"
          />
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {stats.unlockedAchievements} / {stats.totalAchievements} 업적 달성 ({stats.completionRate}%)
        </div>
      </motion.div>

      {/* 카테고리별 진행도 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 카테고리별 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">카테고리별 진행도</h3>
          <div className="space-y-3">
            {stats.categoryStats.map((categoryStat, index) => {
              const categoryInfo = ACHIEVEMENT_CATEGORIES[categoryStat.category]
              const percentage = Math.floor((categoryStat.unlocked / categoryStat.total) * 100)

              return (
                <div key={categoryStat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{categoryInfo.icon}</span>
                      <span className="text-sm font-medium">{categoryInfo.name}</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {categoryStat.unlocked}/{categoryStat.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                      className={`h-full rounded-full bg-${categoryInfo.color}-500`}
                      style={{ backgroundColor: getCategoryColor(categoryStat.category) }}
                    />
                  </div>

                  <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 난이도별 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">난이도별 진행도</h3>
          <div className="space-y-3">
            {stats.difficultyStats.map((difficultyStat, index) => {
              const difficultyInfo = ACHIEVEMENT_DIFFICULTIES[difficultyStat.difficulty]
              const percentage = Math.floor((difficultyStat.unlocked / difficultyStat.total) * 100)

              return (
                <div key={difficultyStat.difficulty}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{difficultyInfo.name}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {difficultyStat.unlocked}/{difficultyStat.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                      className={`h-full rounded-full bg-${difficultyInfo.color}-500`}
                      style={{ backgroundColor: getDifficultyColor(difficultyStat.difficulty) }}
                    />
                  </div>

                  <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// 카테고리 색상 매핑
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    general: '#6b7280',
    combat: '#ef4444',
    exploration: '#3b82f6',
    collection: '#10b981',
    progression: '#8b5cf6',
    social: '#ec4899',
    special: '#eab308'
  }
  return colors[category] || '#6b7280'
}

// 난이도 색상 매핑
function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: '#f97316',
    normal: '#6b7280',
    hard: '#eab308',
    expert: '#06b6d4',
    legendary: '#8b5cf6'
  }
  return colors[difficulty] || '#6b7280'
}
