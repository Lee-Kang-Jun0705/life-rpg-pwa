'use client'

import React from 'react'
import type { Dungeon } from '@/lib/types/dungeon'
import { DUNGEON_TYPE_INFO, DIFFICULTY_INFO } from '@/lib/dungeon/dungeon-data'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Clock,
  Zap,
  Star,
  Users,
  Sword,
  Calendar,
  Ticket,
  Trophy,
  Target,
  Gift,
  Crown,
  Shield,
  Flame,
  AlertTriangle
} from 'lucide-react'

interface DungeonDetailModalProps {
  dungeon: Dungeon
  isAvailable: boolean
  onClose: () => void
  onEnter?: (dungeonId: string) => void
}

const difficultyColors = {
  easy: 'from-green-400 to-green-600',
  normal: 'from-blue-400 to-blue-600',
  hard: 'from-orange-400 to-orange-600',
  expert: 'from-red-400 to-red-600',
  legendary: 'from-purple-400 to-purple-600',
  dynamic: 'from-indigo-400 to-indigo-600'
}

export function DungeonDetailModal({ dungeon, isAvailable, onClose, onEnter }: DungeonDetailModalProps) {
  const typeInfo = DUNGEON_TYPE_INFO[dungeon.type]
  const difficultyInfo = DIFFICULTY_INFO[dungeon.difficulty]

  const handleEnter = () => {
    if (isAvailable && onEnter) {
      onEnter(dungeon.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className={`relative p-6 bg-gradient-to-br ${difficultyColors[dungeon.difficulty]} text-white`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4">{dungeon.icon}</div>
              <h2 className="text-3xl font-bold mb-2">{dungeon.name}</h2>
              <div className="flex items-center justify-center gap-3 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  {typeInfo.icon} {typeInfo.name}
                </span>
                <span>•</span>
                <span>{difficultyInfo.name}</span>
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {/* 설명 */}
            <div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {dungeon.description}
              </p>
            </div>

            {/* 기본 정보 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                던전 정보
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">스테이지</span>
                  </div>
                  <div className="text-2xl font-bold">{dungeon.stages}개</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="font-medium">예상 시간</span>
                  </div>
                  <div className="text-2xl font-bold">{dungeon.estimatedTime}분</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sword className="w-4 h-4 text-red-500" />
                    <span className="font-medium">권장 전투력</span>
                  </div>
                  <div className="text-2xl font-bold">{dungeon.recommendedCombatPower.toLocaleString()}</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">클리어 횟수</span>
                  </div>
                  <div className="text-2xl font-bold">{dungeon.clearedCount}회</div>
                </div>
              </div>
            </div>

            {/* 입장 조건 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                입장 조건
              </h3>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">레벨 {dungeon.requirements.level} 이상</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">에너지 {dungeon.requirements.energy}</span>
                  </div>
                  {dungeon.requirements.tickets && (
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">티켓 {dungeon.requirements.tickets}개</span>
                    </div>
                  )}
                </div>

                {dungeon.requirements.previousDungeon && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                      <Shield className="w-4 h-4" />
                      <span>선행 던전 클리어 필요</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 제한사항 */}
            {(dungeon.dailyLimit || dungeon.weeklyLimit || dungeon.availableDays) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  제한사항
                </h3>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
                  {dungeon.dailyLimit && (
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      • 일일 {dungeon.dailyLimit}회 입장 제한
                    </div>
                  )}
                  {dungeon.weeklyLimit && (
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      • 주간 {dungeon.weeklyLimit}회 입장 제한
                    </div>
                  )}
                  {dungeon.availableDays && (
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      • 입장 가능 요일: {getDayNames(dungeon.availableDays)}
                    </div>
                  )}
                  {dungeon.availableHours && (
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      • 입장 가능 시간: {dungeon.availableHours[0]}:00 ~ {dungeon.availableHours[1]}:00
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 보상 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-500" />
                보상
              </h3>

              <div className="space-y-4">
                {/* 기본 보상 */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">기본 보상</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{dungeon.rewards.exp} 경험치</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">캐릭터 성장</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{dungeon.rewards.gold} 골드</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">즉시 지급</div>
                      </div>
                    </div>
                  </div>

                  {dungeon.rewards.items.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">드롭 아이템</div>
                      <div className="flex flex-wrap gap-2">
                        {dungeon.rewards.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                            <span className="text-gray-500">({item.dropRate}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 첫 클리어 보너스 */}
                {dungeon.rewards.firstClearBonus && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                      <Flame className="w-4 h-4" />
                      첫 클리어 보너스
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">+{dungeon.rewards.firstClearBonus.exp} 경험치</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">추가 보너스</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">+{dungeon.rewards.firstClearBonus.gold} 골드</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">추가 보너스</div>
                        </div>
                      </div>
                    </div>

                    {dungeon.rewards.firstClearBonus.items.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">보너스 아이템</div>
                        <div className="flex flex-wrap gap-2">
                          {dungeon.rewards.firstClearBonus.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                              <span>{item.icon}</span>
                              <span>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 입장 버튼 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={handleEnter}
                  disabled={!isAvailable}
                  className={`
                    flex-1 py-3 rounded-lg font-medium transition-all
                    ${isAvailable
      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl'
      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
    }
                  `}
                >
                  {isAvailable ? '입장하기' : '입장 불가'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// 요일 이름 변환
function getDayNames(days: number[]): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return days.map(day => dayNames[day]).join(', ')
}
