'use client'

import { motion } from 'framer-motion'
import { Trophy, Lock, CheckCircle, TrendingUp } from 'lucide-react'
import type { Achievement, AchievementProgress } from '@/lib/jrpg/achievements-database'
import { ACHIEVEMENT_RARITY_STYLES, ACHIEVEMENT_CATEGORY_STYLES } from '@/lib/jrpg/achievements-database'
import { cn } from '@/lib/utils'

interface AchievementCardProps {
  achievement: Achievement
  progress?: AchievementProgress
  percentage: number
  onClick?: () => void
  compact?: boolean
}

export function AchievementCard({
  achievement,
  progress,
  percentage,
  onClick,
  compact = false
}: AchievementCardProps) {
  const isUnlocked = !!progress?.unlockedAt
  const isHidden = achievement.hidden && !isUnlocked
  const rarityStyle = ACHIEVEMENT_RARITY_STYLES[achievement.rarity]
  const categoryStyle = ACHIEVEMENT_CATEGORY_STYLES[achievement.category]
  
  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        className={cn(
          "relative p-3 rounded-lg transition-all",
          "hover:scale-105 cursor-pointer",
          isUnlocked 
            ? "bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600"
            : "bg-gray-800/50 border border-gray-700"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-3">
          {/* 아이콘 */}
          <div className={cn(
            "text-2xl",
            isUnlocked ? "opacity-100" : "opacity-50",
            isHidden && "blur-sm"
          )}>
            {isHidden ? '❓' : achievement.icon}
          </div>
          
          {/* 정보 */}
          <div className="flex-1 text-left">
            <div className={cn(
              "font-medium text-sm",
              isUnlocked ? "text-white" : "text-gray-400",
              isHidden && "blur-sm"
            )}>
              {isHidden ? '???' : achievement.name}
            </div>
            <div className={cn(
              "text-xs",
              isUnlocked ? rarityStyle.color : "text-gray-500"
            )}>
              {achievement.points} 포인트
            </div>
          </div>
          
          {/* 상태 */}
          {isUnlocked ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <div className="text-xs text-gray-500">
              {percentage}%
            </div>
          )}
        </div>
        
        {/* 진행률 바 */}
        {!isUnlocked && percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </motion.button>
    )
  }
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl transition-all",
        "hover:scale-105 cursor-pointer",
        isUnlocked 
          ? "bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-yellow-600/50"
          : "bg-gray-800/50 border-2 border-gray-700"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 해금 효과 */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      
      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* 아이콘 */}
            <div className={cn(
              "text-4xl",
              isUnlocked ? "opacity-100" : "opacity-50",
              isHidden && "blur-sm"
            )}>
              {isHidden ? '❓' : achievement.icon}
            </div>
            
            {/* 제목과 카테고리 */}
            <div>
              <h3 className={cn(
                "font-bold text-lg",
                isUnlocked ? "text-white" : "text-gray-400",
                isHidden && "blur-sm"
              )}>
                {isHidden ? '숨겨진 도전과제' : achievement.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  categoryStyle.bgColor,
                  categoryStyle.color
                )}>
                  {categoryStyle.label}
                </span>
                <span className={cn("text-xs", rarityStyle.color)}>
                  {achievement.rarity}
                </span>
              </div>
            </div>
          </div>
          
          {/* 포인트 */}
          <div className="text-right">
            <div className={cn(
              "text-2xl font-bold",
              isUnlocked ? "text-yellow-400" : "text-gray-500"
            )}>
              {achievement.points}
            </div>
            <div className="text-xs text-gray-500">포인트</div>
          </div>
        </div>
        
        {/* 설명 */}
        <p className={cn(
          "text-sm mb-3",
          isUnlocked ? "text-gray-300" : "text-gray-500",
          isHidden && "blur-sm"
        )}>
          {isHidden ? '조건을 달성하면 공개됩니다' : achievement.description}
        </p>
        
        {/* 진행 상황 */}
        {!isHidden && (
          <div className="space-y-2">
            {/* 진행률 바 */}
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full",
                  isUnlocked 
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : "bg-gradient-to-r from-purple-600 to-pink-600"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* 진행 텍스트 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {isUnlocked ? '완료!' : `진행률: ${percentage}%`}
              </span>
              {progress && !isUnlocked && (
                <span className="text-gray-500">
                  {progress.progress} / {achievement.requirements.value}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* 보상 */}
        {!isHidden && achievement.rewards && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-1">보상:</div>
            <div className="flex flex-wrap gap-2">
              {achievement.rewards.title && (
                <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                  칭호: {achievement.rewards.title}
                </span>
              )}
              {achievement.rewards.gold && (
                <span className="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded">
                  💰 {achievement.rewards.gold}
                </span>
              )}
              {achievement.rewards.items && (
                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                  📦 아이템 {achievement.rewards.items.length}개
                </span>
              )}
              {achievement.rewards.premium && (
                <span className="text-xs px-2 py-1 bg-pink-600/20 text-pink-400 rounded">
                  💎 {achievement.rewards.premium}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* 해금 날짜 */}
        {isUnlocked && progress?.unlockedAt && (
          <div className="absolute top-2 right-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
        )}
      </div>
    </motion.button>
  )
}