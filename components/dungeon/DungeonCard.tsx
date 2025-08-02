'use client'

import React, { useState } from 'react'
import type { Dungeon, DungeonDifficulty } from '@/lib/types/dungeon'
import { DUNGEON_TYPE_INFO } from '@/lib/dungeon/dungeon-data'
import { DungeonDetailModal } from './DungeonDetailModal'
import { DungeonStatusBadge } from './common/DungeonStatusBadge'
import { DungeonDifficultyBadge } from './common/DungeonDifficultyBadge'
import { motion } from 'framer-motion'
import {
  Clock,
  Zap,
  Star,
  Lock,
  Users,
  Sword,
  Calendar,
  Ticket,
  Trophy,
  Target,
  CheckCircle,
  Battery
} from 'lucide-react'

interface DungeonCardProps {
  dungeon: Dungeon
  isAvailable: boolean
  onEnter?: (dungeonId: string) => void
}

const difficultyColors: Record<DungeonDifficulty, string> = {
  easy: 'from-green-400 to-green-600',
  normal: 'from-blue-400 to-blue-600',
  hard: 'from-orange-400 to-orange-600',
  expert: 'from-red-400 to-red-600',
  legendary: 'from-purple-400 to-purple-600',
  dynamic: 'from-gradient-start to-gradient-end'
}

const difficultyInfo: Record<DungeonDifficulty, { name: string; color: string }> = {
  easy: { name: '쉬움', color: 'text-green-600' },
  normal: { name: '보통', color: 'text-blue-600' },
  hard: { name: '어려움', color: 'text-orange-600' },
  expert: { name: '전문가', color: 'text-red-600' },
  legendary: { name: '전설', color: 'text-purple-600' },
  dynamic: { name: '다이나믹', color: 'text-gradient' }
}

const getCardStyle = (status: Dungeon['status']) => {
  switch (status) {
    case 'locked':
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60'
    case 'available':
      return 'bg-white dark:bg-gray-800 border-green-300 dark:border-green-600'
    case 'in_progress':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500'
    case 'completed':
      return 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500'
    case 'cleared':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500'
    default:
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
  }
}

export function DungeonCard({ dungeon, isAvailable, onEnter }: DungeonCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  const typeInfo = DUNGEON_TYPE_INFO[dungeon.type] || {
    label: dungeon.type,
    icon: Target,
    color: 'bg-gray-500'
  }

  const isLocked = dungeon.status === 'locked'
  const isActive = dungeon.status === 'in_progress'
  const isCompleted = dungeon.status === 'completed' || dungeon.status === 'cleared'
  const canEnter = isAvailable && !isLocked && !isActive

  const handleCardClick = () => {
    if (!isLocked) {
      setShowDetail(true)
    }
  }

  const handleEnter = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAvailable && onEnter) {
      onEnter(dungeon.id)
    }
  }

  return (
    <>
      <motion.div
        data-testid="dungeon-card"
        whileHover={!isLocked ? { scale: 1.02 } : undefined}
        whileTap={!isLocked ? { scale: 0.98 } : undefined}
        onClick={handleCardClick}
        className={`
          relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden touch-active
          ${getCardStyle(dungeon.status)}
          ${!isLocked ? 'hover:shadow-lg' : ''}
        `}
        style={{ touchAction: 'manipulation' }}
      >
        {/* 배경 이미지 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* 상태 아이콘 */}
        <div className="absolute top-3 right-3 z-10">
          {isLocked ? (
            <div className="p-2 bg-gray-500 rounded-full">
              <Lock className="w-4 h-4 text-white" />
            </div>
          ) : isCompleted ? (
            <div className="p-2 bg-green-500 rounded-full">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          ) : isAvailable ? (
            <div className="p-2 bg-blue-500 rounded-full">
              <Zap className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="p-2 bg-orange-500 rounded-full">
              <Clock className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* 타입 뱃지 */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-${typeInfo.color}-500`}>
            {typeInfo.icon} {typeInfo.name}
          </div>
        </div>

        {/* 난이도 뱃지 */}
        <div className="absolute top-12 left-3 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${difficultyColors[dungeon.difficulty]}`}>
            {difficultyInfo[dungeon.difficulty].name}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 p-6">
          {/* 아이콘 */}
          <div className="flex justify-center mb-4 mt-8">
            <div className={`
              text-5xl p-4 rounded-full 
              ${isLocked
      ? 'bg-gray-300 dark:bg-gray-600 grayscale'
      : `bg-gradient-to-br ${difficultyColors[dungeon.difficulty]} text-white shadow-lg`
    }
            `}>
              {dungeon.icon || typeInfo.icon}
            </div>
          </div>

          {/* 제목 */}
          <h3 className={`
            text-xl font-bold text-center mb-2
            ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}
          `}>
            {dungeon.name}
          </h3>

          {/* 설명 */}
          <p className={`
            text-sm text-center mb-4 line-clamp-2 min-h-[2.5rem]
            ${isLocked
      ? 'text-gray-400'
      : 'text-gray-600 dark:text-gray-400'
    }
          `}>
            {isLocked ? '조건을 만족하면 입장할 수 있습니다' : dungeon.description}
          </p>

          {/* 정보 */}
          {!isLocked && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>스테이지</span>
                </div>
                <span className="font-medium">{dungeon.stages}개</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>예상 시간</span>
                </div>
                <span className="font-medium">{dungeon.estimatedTime}분</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Sword className="w-4 h-4 text-red-500" />
                  <span>권장 전투력</span>
                </div>
                <span className="font-medium">{dungeon.recommendedCombatPower.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* 요구사항 */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                <Users className="w-3 h-3" />
                Lv.{dungeon.requirements.level}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded">
                <Zap className="w-3 h-3" />
                {dungeon.requirements.energy}
              </div>
              {dungeon.requirements.tickets && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded">
                  <Ticket className="w-3 h-3" />
                  {dungeon.requirements.tickets}
                </div>
              )}
            </div>
          </div>

          {/* 제한사항 */}
          {(dungeon.dailyLimit || dungeon.weeklyLimit || dungeon.availableDays) && !isLocked && (
            <div className="mb-4 text-center">
              {dungeon.dailyLimit && (
                <div className="text-xs text-gray-500 mb-1">
                  일일 {dungeon.dailyLimit}회 제한
                </div>
              )}
              {dungeon.weeklyLimit && (
                <div className="text-xs text-gray-500 mb-1">
                  주간 {dungeon.weeklyLimit}회 제한
                </div>
              )}
              {dungeon.availableDays && (
                <div className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {getDayNames(dungeon.availableDays)}
                </div>
              )}
            </div>
          )}

          {/* 보상 미리보기 */}
          {!isLocked && (
            <div className="flex flex-wrap gap-1 justify-center mb-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded">
                <Star className="w-3 h-3" />
                {dungeon.rewards.exp}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded">
                💰 {dungeon.rewards.gold}
              </div>
              {dungeon.rewards.items && dungeon.rewards.items.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded">
                  🎁 {dungeon.rewards.items.length}개
                </div>
              )}
            </div>
          )}

          {/* 클리어 정보 */}
          {isCompleted && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-300">클리어 {dungeon.clearedCount}회</span>
                </div>
                {dungeon.bestTime && (
                  <span className="text-green-600 dark:text-green-400 text-xs">
                    최고 기록: {Math.floor(dungeon.bestTime / 60000)}:{String(Math.floor((dungeon.bestTime % 60000) / 1000)).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 입장 버튼 */}
          {!isLocked && (
            <button
              onClick={handleEnter}
              disabled={!isAvailable}
              className={`
                w-full py-3 rounded-lg font-medium transition-all text-sm
                ${isAvailable
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
              `}
            >
              {isAvailable ? '입장하기' : '입장 불가'}
            </button>
          )}

          {/* 잠금 상태 버튼 */}
          {isLocked && (
            <div className="w-full py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-center text-sm font-medium">
              <Lock className="w-4 h-4 inline mr-2" />
              잠금됨
            </div>
          )}
        </div>
      </motion.div>

      {/* 상세 정보 모달 */}
      {showDetail && !isLocked && (
        <DungeonDetailModal
          dungeon={dungeon}
          isAvailable={isAvailable}
          onClose={() => setShowDetail(false)}
          onEnter={onEnter}
        />
      )}
    </>
  )
}

// 요일 이름 변환
function getDayNames(days: number[]): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return days.map(day => dayNames[day]).join(', ')
}
