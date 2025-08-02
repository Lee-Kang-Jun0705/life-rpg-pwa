'use client'

import React from 'react'
import type { RankingEntry } from '@/lib/types/ranking'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Crown, Users, Clock, Trophy } from 'lucide-react'

interface RankingCardProps {
  entry: RankingEntry
  _category: string
  showChange?: boolean
  isCurrentUser?: boolean
}

const rankColors = {
  1: 'from-yellow-400 to-yellow-600', // 금
  2: 'from-gray-300 to-gray-500',     // 은
  3: 'from-orange-400 to-orange-600' // 동
}

const changeIcons = {
  up: TrendingUp,
  down: TrendingDown,
  same: Minus,
  new: Trophy
}

const changeColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  same: 'text-gray-400',
  new: 'text-blue-500'
}

export function RankingCard({ entry, category, showChange = true, isCurrentUser = false }: RankingCardProps) {
  const ChangeIcon = changeIcons[entry.change]
  const isTopThree = entry.rank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative p-4 rounded-xl border transition-all
        ${isCurrentUser
      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
        ${isTopThree ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {/* 현재 사용자 표시 */}
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            나
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* 순위 */}
        <div className="flex-shrink-0">
          {isTopThree ? (
            <div className={`
              w-12 h-12 rounded-full bg-gradient-to-br ${rankColors[entry.rank as keyof typeof rankColors]}
              flex items-center justify-center text-white font-bold text-lg shadow-lg
            `}>
              {entry.rank}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-lg">
              {entry.rank}
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{entry.profileIcon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{entry.username}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Lv.{entry.level}</span>
                {entry.title && (
                  <>
                    <span>•</span>
                    <span className="text-purple-600 dark:text-purple-400">{entry.title}</span>
                  </>
                )}
                {entry.guild && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="truncate max-w-20">{entry.guild}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 점수 */}
        <div className="text-right">
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {entry.score.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {getCategoryUnit(category)}
          </div>
        </div>

        {/* 순위 변화 */}
        {showChange && entry.previousRank && (
          <div className="flex flex-col items-center gap-1">
            <ChangeIcon className={`w-4 h-4 ${changeColors[entry.change]}`} />
            <span className={`text-xs font-medium ${changeColors[entry.change]}`}>
              {entry.change === 'up' && `+${entry.previousRank - entry.rank}`}
              {entry.change === 'down' && `-${entry.rank - entry.previousRank}`}
              {entry.change === 'same' && '0'}
              {entry.change === 'new' && 'NEW'}
            </span>
          </div>
        )}
      </div>

      {/* 최근 활동 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>최근 활동: {formatLastActive(entry.lastActive)}</span>
          </div>
          {isTopThree && (
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">TOP {entry.rank}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// 카테고리별 단위 반환
function getCategoryUnit(_category: string): string {
  const units: Record<string, string> = {
    total_level: 'Level',
    combat_power: 'CP',
    monster_kills: '마리',
    boss_kills: '마리',
    dungeon_clears: '회',
    achievements: '개',
    collection_rate: '%',
    equipment_enhance: '+',
    gold_earned: 'Gold',
    exp_gained: 'EXP'
  }
  return units[category] || 'pts'
}

// 최근 활동 시간 포맷팅
function formatLastActive(lastActive: Date): string {
  const now = new Date()
  const diff = now.getTime() - lastActive.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) {
    return '방금 전'
  } else if (minutes < 60) {
    return `${minutes}분 전`
  } else if (hours < 24) {
    return `${hours}시간 전`
  } else if (days < 7) {
    return `${days}일 전`
  } else {
    return lastActive.toLocaleDateString()
  }
}
