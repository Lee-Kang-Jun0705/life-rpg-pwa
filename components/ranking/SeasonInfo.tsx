'use client'

import React from 'react'
import type { RankingSeason, RankingReward } from '@/lib/types/ranking'
import { motion } from 'framer-motion'
import { Calendar, Users, Gift, Crown, Clock, Trophy } from 'lucide-react'

interface SeasonInfoProps {
  season: RankingSeason
}

export function SeasonInfo({ season }: SeasonInfoProps) {
  const timeLeft = getTimeLeft(season.endDate)
  const progress = getSeasonProgress(season.startDate, season.endDate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
    >
      {/* 시즌 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{season.name}</h2>
          <div className="flex items-center gap-4 text-sm opacity-90">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{season.participants.toLocaleString()}명 참여</span>
            </div>
            {season.isActive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>진행중</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl mb-1">🏆</div>
          {season.isActive && (
            <div className="text-xs opacity-75">시즌 진행중</div>
          )}
        </div>
      </div>

      {/* 시즌 기간 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">시즌 기간</span>
        </div>
        <div className="text-sm opacity-90">
          {season.startDate.toLocaleDateString()} ~ {season.endDate.toLocaleDateString()}
        </div>
      </div>

      {/* 진행도 바 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">시즌 진행도</span>
          <span className="text-sm">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white rounded-full h-2"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* 남은 시간 */}
      {season.isActive && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">남은 시간</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-lg font-bold">{timeLeft.days}</div>
              <div className="text-xs opacity-75">일</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-lg font-bold">{timeLeft.hours}</div>
              <div className="text-xs opacity-75">시간</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-lg font-bold">{timeLeft.minutes}</div>
              <div className="text-xs opacity-75">분</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-lg font-bold">{timeLeft.seconds}</div>
              <div className="text-xs opacity-75">초</div>
            </div>
          </div>
        </div>
      )}

      {/* 리워드 미리보기 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4" />
          <span className="text-sm font-medium">순위별 보상</span>
        </div>
        <div className="space-y-2">
          {season.rewards.slice(0, 3).map((reward, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reward.rank && (
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${reward.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        reward.rank === 2 ? 'bg-gray-300 text-gray-800' :
                        reward.rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-white/20'
                      }
                    `}>
                      {reward.rank}
                    </div>
                  )}
                  {reward.rankRange && (
                    <div className="text-xs bg-white/20 px-2 py-1 rounded">
                      {reward.rankRange[0]}-{reward.rankRange[1]}위
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  {reward.rewards.gold && (
                    <span className="flex items-center gap-1">
                      💰 {reward.rewards.gold.toLocaleString()}
                    </span>
                  )}
                  {reward.rewards.exp && (
                    <span className="flex items-center gap-1">
                      ⭐ {reward.rewards.exp.toLocaleString()}
                    </span>
                  )}
                  {reward.rewards.title && (
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      칭호
                    </span>
                  )}
                  {reward.rewards.items && reward.rewards.items.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {reward.rewards.items.length}개
                    </span>
                  )}
                </div>
              </div>
              
              {reward.rewards.title && (
                <div className="mt-1 text-xs opacity-75">
                  칭호: {reward.rewards.title}
                </div>
              )}
            </motion.div>
          ))}
          
          {season.rewards.length > 3 && (
            <div className="text-center text-xs opacity-75 mt-2">
              + {season.rewards.length - 3}개 더 많은 순위별 보상
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// 남은 시간 계산
function getTimeLeft(endDate: Date) {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return { days, hours, minutes, seconds }
}

// 시즌 진행도 계산
function getSeasonProgress(startDate: Date, endDate: Date): number {
  const now = new Date()
  const total = endDate.getTime() - startDate.getTime()
  const current = now.getTime() - startDate.getTime()
  
  return Math.max(0, Math.min(100, (current / total) * 100))
}