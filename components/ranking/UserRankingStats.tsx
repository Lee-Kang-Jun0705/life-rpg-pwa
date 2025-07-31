'use client'

import React from 'react'
import type { UserRankingStats } from '@/lib/types/ranking'
import { RANKING_CATEGORIES } from '@/lib/ranking/ranking-data'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Trophy, Target, Calendar, Award } from 'lucide-react'

interface UserRankingStatsProps {
  stats: UserRankingStats
  userRank?: number
}

export function UserRankingStats({ stats, userRank }: UserRankingStatsProps) {
  const growthCategories = [
    { key: 'totalLevel', label: '총 레벨', icon: '📈' },
    { key: 'combatPower', label: '전투력', icon: '⚔️' },
    { key: 'monsterKills', label: '몬스터 처치', icon: '👹' },
    { key: 'achievements', label: '업적 달성', icon: '🏆' }
  ]

  return (
    <div className="space-y-6">
      {/* 전체 순위 카드 */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">현재 순위</h3>
              <p className="opacity-90">주간 종합 랭킹</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">#{userRank}</div>
              <div className="flex items-center gap-1 mt-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">1,247명 중</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 주간 성장 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          주간 성장
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {growthCategories.map((category, index) => {
            const currentValue = stats.currentWeek[category.key as keyof typeof stats.currentWeek] as number
            const lastValue = stats.lastWeek[category.key as keyof typeof stats.lastWeek] as number
            const growth = stats.weeklyGrowth[category.key as keyof typeof stats.weeklyGrowth] as number
            const growthPercent = lastValue > 0 ? ((growth / lastValue) * 100) : 0
            const isPositive = growth > 0

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {(currentValue || 0).toLocaleString()}
                  </div>
                  
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}{(growth || 0).toLocaleString()}
                      {growthPercent > 0 && ` (${growthPercent.toFixed(1)}%)`}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 카테고리별 상세 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          카테고리별 통계
        </h3>
        
        <div className="space-y-4">
          {Object.entries(RANKING_CATEGORIES).slice(0, 6).map(([key, categoryInfo], index) => {
            const currentValue = stats.currentWeek[key as keyof typeof stats.currentWeek] as number
            const allTimeValue = stats.allTime[key as keyof typeof stats.allTime] as number
            const weeklyProgress = allTimeValue > 0 ? (currentValue / allTimeValue) * 100 : 0

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{categoryInfo.icon}</span>
                  <div>
                    <div className="font-medium">{categoryInfo.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      이번 주: {(currentValue || 0).toLocaleString()} {categoryInfo.unit}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {(allTimeValue || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    전체: {categoryInfo.unit}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 달성률 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          주요 성과
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.currentWeek.achievements}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              달성한 업적 수
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.currentWeek.collectionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              도감 완성률
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              +{stats.currentWeek.equipmentEnhance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              장비 강화 레벨
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}