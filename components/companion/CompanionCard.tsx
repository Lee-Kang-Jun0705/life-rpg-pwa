'use client'

import { motion } from 'framer-motion'
import type { CompanionInstance } from '@/lib/types/companion'
import { getCompanionById } from '@/lib/data/companions'
import { calculateCompanionPower, calculateLevelProgress } from '@/lib/helpers/companion-calculations'

interface CompanionCardProps {
  companion: CompanionInstance
  isActive?: boolean
  onSelect?: () => void
  onViewDetails?: () => void
  showActions?: boolean
}

export default function CompanionCard({
  companion,
  isActive = false,
  onSelect,
  onViewDetails,
  showActions = true
}: CompanionCardProps) {
  const companionData = getCompanionById(companion.companionId)
  if (!companionData) return null

  const levelProgress = calculateLevelProgress(companion)
  const power = calculateCompanionPower(companion)

  // 희귀도별 카드 색상
  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-500 to-orange-500',
    mythic: 'from-pink-500 to-rose-500'
  }

  // 기분별 이모지
  const moodEmojis = {
    happy: '😊',
    normal: '😐',
    sad: '😢',
    tired: '😴',
    hungry: '🤤'
  }

  // 타입별 아이콘
  const typeIcons = {
    offensive: '⚔️',
    defensive: '🛡️',
    support: '💚',
    balanced: '⚖️'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl ${
        isActive ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* 배경 그라디언트 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[companionData.rarity]} opacity-20`} />
      
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{companionData.emoji}</span>
            <div>
              <h3 className="font-bold text-lg">
                {companion.nickname || companionData.name}
                {isActive && <span className="ml-1 text-yellow-500">★</span>}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {companionData.species} · Lv.{companion.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl">{moodEmojis[companion.mood]}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {typeIcons[companionData.type]}
            </p>
          </div>
        </div>

        {/* 스탯 바 */}
        <div className="space-y-2 mb-3">
          {/* 경험치 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>EXP</span>
              <span>{companion.exp}/{companion.expToNext}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* 충성도 */}
          <div className="flex items-center gap-2">
            <span className="text-xs">❤️</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500"
                style={{ width: `${companion.loyalty}%` }}
              />
            </div>
            <span className="text-xs">{companion.loyalty}</span>
          </div>

          {/* 배고픔 */}
          <div className="flex items-center gap-2">
            <span className="text-xs">🍖</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500"
                style={{ width: `${companion.hunger}%` }}
              />
            </div>
            <span className="text-xs">{companion.hunger}</span>
          </div>

          {/* 피로도 */}
          <div className="flex items-center gap-2">
            <span className="text-xs">💤</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${companion.fatigue}%` }}
              />
            </div>
            <span className="text-xs">{companion.fatigue}</span>
          </div>
        </div>

        {/* 전투력 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">전투력</span>
          <span className="font-bold text-lg">{power.toLocaleString()}</span>
        </div>

        {/* 액션 버튼 */}
        {showActions && (
          <div className="flex gap-2">
            {onSelect && (
              <button
                onClick={onSelect}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={isActive}
              >
                {isActive ? '활성화됨' : '선택'}
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                상세보기
              </button>
            )}
          </div>
        )}

        {/* 희귀도 라벨 */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${rarityColors[companionData.rarity]}`}>
          {companionData.rarity.toUpperCase()}
        </div>
      </div>
    </motion.div>
  )
}