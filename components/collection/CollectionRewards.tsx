'use client'

import React from 'react'
import type { CollectionCategory, MonsterCollectionEntry } from '@/lib/types/collection'
import { motion } from 'framer-motion'
import { Gift, Check, Lock, Trophy, Coins, Zap, Crown } from 'lucide-react'

interface CollectionRewardsProps {
  categories: CollectionCategory[]
  entries: Record<string, MonsterCollectionEntry>
}

export function CollectionRewards({ categories, entries }: CollectionRewardsProps) {
  return (
    <div className="space-y-6">
      {categories.map((category, categoryIndex) => {
        // 카테고리 진행도 계산
        const categoryEntries = category.monsterIds.map(id => entries[id])
        const discoveredCount = categoryEntries.filter(e => e?.isDiscovered).length
        const defeatedCount = categoryEntries.filter(e => e?.isDefeated).length
        const totalCount = category.monsterIds.length
        
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            {/* 카테고리 헤더 */}
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{category.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
              
              {/* 진행도 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-blue-500">발견:</span>
                  <span className="font-medium">{discoveredCount}/{totalCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500">처치:</span>
                  <span className="font-medium">{defeatedCount}/{totalCount}</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(defeatedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            {/* 보상 목록 */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500" />
                카테고리 보상
              </h4>
              
              {category.rewards.map((reward, rewardIndex) => {
                const isUnlocked = defeatedCount >= reward.requiredCount
                const isClaimed = reward.isClaimed
                
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categoryIndex * 0.1) + (rewardIndex * 0.05) }}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${isUnlocked 
                        ? isClaimed 
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                          : 'border-purple-300 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{reward.name}</h5>
                          {isClaimed && <Check className="w-4 h-4 text-green-500" />}
                          {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {reward.description}
                        </p>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          조건: {reward.requiredCount}종 처치 ({defeatedCount}/{reward.requiredCount})
                        </div>
                        
                        {/* 보상 내용 */}
                        <div className="flex flex-wrap gap-2 text-sm">
                          {reward.rewards.exp && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                              <Zap className="w-3 h-3" />
                              <span>{reward.rewards.exp} EXP</span>
                            </div>
                          )}
                          
                          {reward.rewards.gold && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">
                              <Coins className="w-3 h-3" />
                              <span>{reward.rewards.gold} 골드</span>
                            </div>
                          )}
                          
                          {reward.rewards.title && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                              <Crown className="w-3 h-3" />
                              <span>{reward.rewards.title}</span>
                            </div>
                          )}
                          
                          {reward.rewards.items && (
                            reward.rewards.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                                <Gift className="w-3 h-3" />
                                <span>{item}</span>
                              </div>
                            ))
                          )}
                          
                          {reward.rewards.stat && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                              <Trophy className="w-3 h-3" />
                              <span>{reward.rewards.stat.type} +{reward.rewards.stat.value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 수령 버튼 */}
                      <div className="ml-4">
                        {isClaimed ? (
                          <div className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg">
                            수령 완료
                          </div>
                        ) : isUnlocked ? (
                          <button className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors">
                            수령하기
                          </button>
                        ) : (
                          <div className="px-4 py-2 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed">
                            잠김
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}