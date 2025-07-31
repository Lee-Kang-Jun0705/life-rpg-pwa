'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { DailyMission } from '@/lib/types/daily-content'
import { CheckCircle, Clock, Zap, Star } from 'lucide-react'

interface DailyMissionCardProps {
  mission: DailyMission
  onProgress: (missionId: string, progress: number) => void
  onComplete: (missionId: string) => void
}

const categoryColors = {
  health: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  learning: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  relationship: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  achievement: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  general: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
}

const categoryIcons = {
  health: '💪',
  learning: '📚',
  relationship: '❤️',
  achievement: '🏆',
  general: '⚔️'
}

const difficultyStars = {
  easy: 1,
  normal: 2,
  hard: 3
}

export function DailyMissionCard({ mission, onProgress, onComplete }: DailyMissionCardProps) {
  const progress = (mission.current / mission.target) * 100
  const remainingTime = new Date(mission.expiresAt).getTime() - new Date().getTime()
  const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60))

  const handleProgressClick = () => {
    if (!mission.isCompleted) {
      onProgress(mission.id, 1)
    }
  }

  return (
    <motion.div
      data-testid="daily-mission-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-xl border-2 ${categoryColors[mission.category]} ${
        mission.isCompleted ? 'opacity-75' : ''
      } transition-all hover:shadow-lg`}
    >
      {/* 완료 표시 */}
      {mission.isCompleted && (
        <div className="absolute inset-0 bg-green-500/10 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-500 opacity-50" />
        </div>
      )}

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryIcons[mission.category]}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {mission.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {mission.description}
              </p>
            </div>
          </div>
          
          {/* 난이도 표시 */}
          <div className="flex items-center gap-1">
            {[...Array(difficultyStars[mission.difficulty])].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">진행도</span>
            <span className="font-medium">
              {mission.current} / {mission.target}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 보상 및 시간 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{mission.rewards.exp} EXP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">💰</span>
              <span>{mission.rewards.gold} 골드</span>
            </div>
            {mission.rewards.energy && (
              <div className="flex items-center gap-1">
                <span className="text-blue-500">⚡</span>
                <span>+{mission.rewards.energy} 에너지</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{hoursRemaining}시간</span>
            </div>

            {!mission.isCompleted && (
              <button
                data-testid="mission-progress-button"
                onClick={handleProgressClick}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                +1
              </button>
            )}

            {mission.current >= mission.target && !mission.isCompleted && (
              <button
                data-testid="mission-complete-button"
                onClick={() => onComplete(mission.id)}
                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors animate-pulse"
              >
                완료
              </button>
            )}
          </div>
        </div>

        {/* 추가 아이템 보상 */}
        {mission.rewards.items && mission.rewards.items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>추가 보상:</span>
              {mission.rewards.items.map((item, index) => (
                <span key={index} className="text-purple-500">
                  📦 {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}