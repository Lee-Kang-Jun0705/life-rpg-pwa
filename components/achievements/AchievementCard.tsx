'use client'

import React, { useState } from 'react'
import type { Achievement, AchievementProgress } from '@/lib/types/achievements'
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DIFFICULTIES } from '@/lib/achievements/achievement-data'
import { AchievementDetailModal } from './AchievementDetailModal'
import { motion } from 'framer-motion'
import { Lock, Check, Star, Trophy, Clock, Zap, Coins, Crown, Gift } from 'lucide-react'

interface AchievementCardProps {
  achievement: Achievement
  progress?: AchievementProgress
}

const difficultyColors = {
  easy: 'from-orange-400 to-orange-600',
  normal: 'from-gray-400 to-gray-600', 
  hard: 'from-yellow-400 to-yellow-600',
  expert: 'from-cyan-400 to-cyan-600',
  legendary: 'from-purple-400 to-purple-600'
}

const categoryColors = {
  general: 'border-gray-400',
  combat: 'border-red-400',
  exploration: 'border-blue-400',
  collection: 'border-green-400',
  progression: 'border-purple-400',
  social: 'border-pink-400',
  special: 'border-yellow-400'
}

export function AchievementCard({ achievement, progress }: AchievementCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  
  const isUnlocked = achievement.isUnlocked
  const isHidden = achievement.isHidden && !isUnlocked
  const categoryInfo = ACHIEVEMENT_CATEGORIES[achievement.category]
  const difficultyInfo = ACHIEVEMENT_DIFFICULTIES[achievement.difficulty]
  
  // デフォルトのprogressを設定
  const actualProgress = progress || {
    current: 0,
    target: 1,
    percentage: 0
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !isHidden && setShowDetail(true)}
        className={`
          relative p-4 rounded-xl border-2 transition-all cursor-pointer
          ${categoryColors[achievement.category]}
          ${isUnlocked 
            ? 'bg-white dark:bg-gray-800 shadow-lg' 
            : isHidden 
              ? 'bg-gray-100 dark:bg-gray-900 opacity-60'
              : 'bg-gray-50 dark:bg-gray-800'
          }
          hover:shadow-lg
        `}
      >
        {/* 잠금/완료 상태 */}
        <div className="absolute top-3 right-3">
          {isUnlocked ? (
            <div className="p-2 bg-green-500 rounded-full">
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : isHidden ? (
            <div className="p-2 bg-gray-400 rounded-full">
              <Lock className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="p-2 bg-gray-300 dark:bg-gray-600 rounded-full">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>

        {/* 난이도 표시 */}
        <div className={`
          absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white
          bg-gradient-to-r ${difficultyColors[achievement.difficulty]}
        `}>
          {difficultyInfo.name}
        </div>

        {/* 아이콘 */}
        <div className="flex justify-center mb-4 mt-6">
          <div className={`
            text-4xl p-4 rounded-full 
            ${isUnlocked 
              ? `bg-gradient-to-br ${difficultyColors[achievement.difficulty]} text-white`
              : isHidden
                ? 'bg-gray-300 dark:bg-gray-600 grayscale'
                : 'bg-gray-200 dark:bg-gray-700'
            }
          `}>
            {isHidden ? '❓' : achievement.icon}
          </div>
        </div>

        {/* 제목 */}
        <h3 className={`
          text-lg font-bold text-center mb-2
          ${isHidden ? 'text-gray-500' : ''}
        `}>
          {isHidden ? '숨겨진 업적' : achievement.name}
        </h3>

        {/* 설명 */}
        <p className={`
          text-sm text-center mb-4 line-clamp-2
          ${isHidden 
            ? 'text-gray-400' 
            : 'text-gray-600 dark:text-gray-400'
          }
        `}>
          {isHidden ? '조건을 만족하면 공개됩니다' : achievement.description}
        </p>

        {/* 카테고리 */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <span className="text-sm">{categoryInfo.icon}</span>
          <span className="text-xs text-gray-500">{categoryInfo.name}</span>
        </div>

        {/* 진행도 */}
        {!isHidden && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">진행도</span>
              <span className="font-medium">
                {isUnlocked ? '완료!' : `${actualProgress.current}/${actualProgress.target}`}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${difficultyColors[achievement.difficulty]}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(actualProgress.percentage, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="text-center mt-1 text-xs text-gray-500">
              {Math.floor(actualProgress.percentage)}%
            </div>
          </div>
        )}

        {/* 보상 미리보기 */}
        {!isHidden && (
          <div className="flex flex-wrap gap-1 justify-center">
            {achievement.rewards.exp && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded">
                <Zap className="w-3 h-3" />
                {achievement.rewards.exp}
              </div>
            )}
            
            {achievement.rewards.gold && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded">
                <Coins className="w-3 h-3" />
                {achievement.rewards.gold}
              </div>
            )}
            
            {achievement.rewards.title && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded">
                <Crown className="w-3 h-3" />
                칭호
              </div>
            )}
            
            {achievement.rewards.items && achievement.rewards.items.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded">
                <Gift className="w-3 h-3" />
                {achievement.rewards.items.length}개
              </div>
            )}
          </div>
        )}

        {/* 달성 날짜 */}
        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-center text-gray-500">
              {new Date(achievement.unlockedAt).toLocaleDateString()} 달성
            </div>
          </div>
        )}

        {/* 특별 표시 */}
        {achievement.difficulty === 'legendary' && (
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-yellow-500/20 rounded-xl animate-pulse" />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        )}
      </motion.div>

      {/* 상세 정보 모달 */}
      {showDetail && !isHidden && (
        <AchievementDetailModal
          achievement={achievement}
          progress={actualProgress}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}