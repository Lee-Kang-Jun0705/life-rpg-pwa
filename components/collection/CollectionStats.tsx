'use client'

import React from 'react'
import type { CollectionStats } from '@/lib/types/collection'
import { motion } from 'framer-motion'
import { Eye, Sword, Target, Trophy } from 'lucide-react'

interface CollectionStatsProps {
  stats: CollectionStats
}

export function CollectionStats({ stats }: CollectionStatsProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.discoveredMonsters}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                / {stats.totalMonsters} 발견
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          transition={{ _delay: 0.1 }}
          className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <Sword className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.defeatedMonsters}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                / {stats.totalMonsters} 처치
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          transition={{ _delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalKills}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                총 처치 수
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          transition={{ _delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.completionRate}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                완성도
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 전체 진행도 바 */}
      <motion.div
        initial={{ opacity: 0, _y: 20 }}
        animate={{ opacity: 1, _y: 0 }}
        transition={{ _delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">전체 도감 완성도</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {stats.defeatedMonsters} / {stats.totalMonsters}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            transition={{ duration: 1, _delay: 0.5 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
          />
        </div>

        <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
          {stats.completionRate}% 완료
        </div>
      </motion.div>

      {/* 카테고리별 진행도 */}
      {stats.categoryProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, _y: 20 }}
          animate={{ opacity: 1, _y: 0 }}
          transition={{ _delay: 0.6 }}
          className="mt-4"
        >
          <h3 className="font-medium mb-3">카테고리별 진행도</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.categoryProgress.map((progress, index) => {
              const percentage = Math.floor((progress.discovered / progress.total) * 100)

              return (
                <div key={progress.categoryId} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {progress.categoryId}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {progress.discovered}/{progress.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, _delay: 0.7 + index * 0.1 }}
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full"
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
      )}
    </div>
  )
}
