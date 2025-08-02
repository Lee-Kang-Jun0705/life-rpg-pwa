'use client'

import { motion } from 'framer-motion'
import { Quest } from '@/lib/types/quest'
import { CheckCircle, Clock, Lock, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestCardProps {
  quest: Quest
  onClick: () => void
  isActive?: boolean
}

export function QuestCard({ quest, onClick, isActive }: QuestCardProps) {
  const getStatusIcon = () => {
    switch (quest.status) {
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />
      case 'available':
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'claimed':
        return <CheckCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getTypeColor = () => {
    switch (quest.type) {
      case 'main':
        return 'from-purple-500 to-pink-500'
      case 'daily':
        return 'from-blue-500 to-cyan-500'
      case 'side':
        return 'from-green-500 to-emerald-500'
      case 'weekly':
        return 'from-orange-500 to-amber-500'
      case 'event':
        return 'from-red-500 to-rose-500'
    }
  }

  const progress = quest.objectives.reduce((acc, obj) => acc + (obj.completed ? 1 : 0), 0)
  const totalObjectives = quest.objectives.length
  const progressPercentage = (progress / totalObjectives) * 100

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-lg border transition-all cursor-pointer',
        quest.status === 'locked' ? 'border-gray-700 opacity-60' : 'border-gray-600',
        isActive && 'ring-2 ring-purple-500'
      )}
      onClick={onClick}
    >
      {/* 배경 그라데이션 */}
      <div className={cn(
        'absolute inset-0 opacity-10 bg-gradient-to-br',
        getTypeColor()
      )} />

      <div className="relative p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <h3 className="font-semibold text-white">{quest.title}</h3>
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">{quest.description}</p>
          </div>
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r',
            getTypeColor(),
            'text-white'
          )}>
            {quest.type === 'main' && '메인'}
            {quest.type === 'daily' && '일일'}
            {quest.type === 'side' && '사이드'}
            {quest.type === 'weekly' && '주간'}
            {quest.type === 'event' && '이벤트'}
          </span>
        </div>

        {/* 진행도 */}
        {quest.status === 'in_progress' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">진행도</span>
              <span className="text-white">{progress}/{totalObjectives}</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* 보상 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">✨</span>
            <span className="text-gray-300">{quest.rewards.exp} EXP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">💰</span>
            <span className="text-gray-300">{quest.rewards.gold} Gold</span>
          </div>
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-purple-500">🎁</span>
              <span className="text-gray-300">{quest.rewards.items.length} 아이템</span>
            </div>
          )}
        </div>

        {/* 시간 제한 (이벤트 퀘스트) */}
        {quest.timeLimit && quest.expiresAt && (
          <div className="mt-2 text-xs text-red-400">
            ⏰ {new Date(quest.expiresAt).toLocaleDateString()} 까지
          </div>
        )}
      </div>
    </motion.div>
  )
}
