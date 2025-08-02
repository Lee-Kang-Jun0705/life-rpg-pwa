'use client'

import React from 'react'
import type { CollectionAchievement } from '@/lib/types/collection'
import { motion } from 'framer-motion'
import { Trophy, Lock, Check, Crown, Coins, Zap, Calendar } from 'lucide-react'

interface CollectionAchievementsProps {
  achievements: CollectionAchievement[]
}

export function CollectionAchievements({ achievements }: CollectionAchievementsProps) {
  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked)

  return (
    <div className="space-y-6">
      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {unlockedAchievements.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                / {achievements.length} 달성
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                완성률
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {unlockedAchievements.reduce((sum, a) => sum + (a.rewards.exp || 0), 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                총 획득 EXP
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 달성한 업적 */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            달성한 업적 ({unlockedAchievements.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-4 border-2 border-green-300 dark:border-green-700"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {achievement.description}
                    </p>

                    {achievement.unlockedAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* 보상 */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {achievement.rewards.exp && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          <Zap className="w-3 h-3" />
                          <span>{achievement.rewards.exp} EXP</span>
                        </div>
                      )}

                      {achievement.rewards.gold && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">
                          <Coins className="w-3 h-3" />
                          <span>{achievement.rewards.gold} 골드</span>
                        </div>
                      )}

                      {achievement.rewards.title && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                          <Crown className="w-3 h-3" />
                          <span>{achievement.rewards.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 미달성 업적 */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            미달성 업적 ({lockedAchievements.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (unlockedAchievements.length * 0.05) + (index * 0.05) }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-300 dark:border-gray-700 opacity-75"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-600 dark:text-gray-400">
                        {achievement.name}
                      </h4>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      {achievement.description}
                    </p>

                    {/* 달성 조건 */}
                    <div className="text-xs text-gray-500 mb-2">
                      {achievement.condition.type === 'discover' && (
                        <span>조건: {achievement.condition.count}종 발견</span>
                      )}
                      {achievement.condition.type === 'defeat' && (
                        <span>조건: {achievement.condition.count}종 처치</span>
                      )}
                      {achievement.condition.type === 'kill_count' && (
                        <span>조건: 총 {achievement.condition.count}마리 처치</span>
                      )}
                      {achievement.condition.type === 'category_complete' && (
                        <span>조건: 카테고리 완료</span>
                      )}
                    </div>

                    {/* 보상 (회색조) */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {achievement.rewards.exp && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded">
                          <Zap className="w-3 h-3" />
                          <span>{achievement.rewards.exp} EXP</span>
                        </div>
                      )}

                      {achievement.rewards.gold && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded">
                          <Coins className="w-3 h-3" />
                          <span>{achievement.rewards.gold} 골드</span>
                        </div>
                      )}

                      {achievement.rewards.title && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded">
                          <Crown className="w-3 h-3" />
                          <span>{achievement.rewards.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
