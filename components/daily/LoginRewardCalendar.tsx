'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { DailyLogin } from '@/lib/types/daily-content'
import { Gift, Check, Lock, Star, Zap } from 'lucide-react'

interface LoginRewardCalendarProps {
  loginRewards: DailyLogin[]
  currentStreak: number
  onClaimReward: (day: number) => void
}

export function LoginRewardCalendar({
  loginRewards,
  currentStreak,
  onClaimReward
}: LoginRewardCalendarProps) {
  const currentCycleDay = ((currentStreak - 1) % 28) + 1

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-500" />
            출석 보상
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            매일 접속하여 보상을 받으세요! (28일 주기)
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-500">{currentStreak}</div>
          <div className="text-xs text-gray-500">연속 출석</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {loginRewards.map((reward) => {
          const isToday = reward.day === currentCycleDay
          const isClaimed = reward.isClaimed
          const isLocked = reward.day > currentCycleDay
          const isSpecial = reward.day % 7 === 0 // 7일마다 특별 보상

          return (
            <motion.div
              key={reward.day}
              data-testid={isToday && !isClaimed ? 'attendance-button' : `attendance-day-${reward.day}`}
              whileHover={!isLocked ? { scale: 1.05 } : {}}
              whileTap={!isLocked && !isClaimed ? { scale: 0.95 } : {}}
              className={`relative aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isToday && !isClaimed
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 animate-pulse'
                  : isClaimed
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : isLocked
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 opacity-50'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
              } ${isSpecial ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => {
                if (isToday && !isClaimed) {
                  onClaimReward(reward.day)
                }
              }}
            >
              {/* 특별 보상 표시 */}
              {isSpecial && (
                <Star className="absolute top-1 right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}

              {/* 날짜 */}
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {reward.day}일
              </div>

              {/* 상태 아이콘 */}
              {isClaimed ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : isLocked ? (
                <Lock className="w-5 h-5 text-gray-400" />
              ) : (
                <Gift className="w-6 h-6 text-purple-500" />
              )}

              {/* 주요 보상 표시 */}
              <div className="mt-1 text-xs text-center">
                {reward.rewards.items && reward.rewards.items.length > 0 ? (
                  <span className="text-purple-600 dark:text-purple-400">📦</span>
                ) : reward.rewards.energy ? (
                  <span className="text-blue-500">⚡{reward.rewards.energy}</span>
                ) : reward.rewards.tickets ? (
                  <span className="text-orange-500">🎫{reward.rewards.tickets}</span>
                ) : (
                  <span className="text-yellow-500">💰</span>
                )}
              </div>

              {/* 오늘 표시 */}
              {isToday && !isClaimed && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  오늘
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 보상 상세 정보 */}
      {loginRewards.find(r => r.day === currentCycleDay && !r.isClaimed) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            오늘의 보상
          </h3>
          <div className="flex flex-wrap gap-3 text-sm">
            {loginRewards[currentCycleDay - 1].rewards.exp && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{loginRewards[currentCycleDay - 1].rewards.exp} EXP</span>
              </div>
            )}
            {loginRewards[currentCycleDay - 1].rewards.gold && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">💰</span>
                <span>{loginRewards[currentCycleDay - 1].rewards.gold} 골드</span>
              </div>
            )}
            {loginRewards[currentCycleDay - 1].rewards.energy && (
              <div className="flex items-center gap-1">
                <span className="text-blue-500">⚡</span>
                <span>{loginRewards[currentCycleDay - 1].rewards.energy} 에너지</span>
              </div>
            )}
            {loginRewards[currentCycleDay - 1].rewards.tickets && (
              <div className="flex items-center gap-1">
                <span className="text-orange-500">🎫</span>
                <span>{loginRewards[currentCycleDay - 1].rewards.tickets} 티켓</span>
              </div>
            )}
            {loginRewards[currentCycleDay - 1].rewards.items && (
              <div className="flex items-center gap-1">
                <span className="text-purple-500">📦</span>
                <span>{loginRewards[currentCycleDay - 1].rewards.items?.join(', ')}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
