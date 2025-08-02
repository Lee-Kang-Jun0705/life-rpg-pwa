'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { Dungeon } from '@/lib/types/dungeon'
import { Sword, Shield, Star, Clock, Zap, Lock, ChevronRight } from 'lucide-react'

interface ImprovedDungeonListProps {
  dungeons: Dungeon[]
  onSelectDungeon: (dungeon: Dungeon) => void
  playerLevel: number
}

export function ImprovedDungeonList({ dungeons, onSelectDungeon, playerLevel }: ImprovedDungeonListProps) {
  const [hoveredDungeon, setHoveredDungeon] = useState<string | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-500'
      case 'normal': return 'from-blue-500 to-cyan-500'
      case 'hard': return 'from-orange-500 to-red-500'
      case 'nightmare': return 'from-purple-500 to-pink-500'
      case 'infinite': return 'from-indigo-500 to-purple-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 1
      case 'normal': return 2
      case 'hard': return 3
      case 'nightmare': return 4
      case 'infinite': return 5
      default: return 1
    }
  }

  const canEnterDungeon = (dungeon: Dungeon) => {
    const canEnter = playerLevel >= dungeon.requirements.level
    console.log(`던전 ${dungeon.name}: 플레이어 레벨 ${playerLevel} >= 요구 레벨 ${dungeon.requirements.level} = ${canEnter}`)
    return canEnter
  }

  const getDungeonTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return '📖'
      case 'daily': return '📅'
      case 'weekly': return '📆'
      case 'event': return '🎉'
      case 'raid': return '👥'
      case 'infinite': return '♾️'
      default: return '⚔️'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 던전 맵 스타일 레이아웃 - 간격 축소 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        {dungeons.map((dungeon, index) => {
          const canEnter = canEnterDungeon(dungeon)
          const difficulty = getDifficultyColor(dungeon.difficulty)
          const stars = getDifficultyStars(dungeon.difficulty)

          return (
            <motion.div
              key={dungeon.id}
              data-testid="dungeon-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: canEnter ? 1.02 : 1 }}
              onMouseEnter={() => setHoveredDungeon(dungeon.id)}
              onMouseLeave={() => setHoveredDungeon(null)}
              onClick={() => {
                if (canEnter) {
                  console.log('던전 카드 클릭됨:', dungeon.name)
                  onSelectDungeon(dungeon)
                }
              }}
              className={`
                relative
                ${canEnter ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
              <div
                className={`
                  relative overflow-hidden rounded-2xl border transition-all duration-300
                  ${canEnter
              ? 'border-purple-500/30 hover:border-purple-500/60'
              : 'border-gray-700/50 opacity-60'
            }
                `}
              >
                {/* 배경 이미지 또는 그라데이션 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${difficulty} opacity-20`} />

                {/* 던전 이미지 영역 - 더욱 컴팩트하게 */}
                <div className="relative h-20 md:h-24 bg-gray-800/50 backdrop-blur-sm">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl md:text-4xl opacity-50">{getDungeonTypeIcon(dungeon.type)}</span>
                  </div>

                  {/* 타입 배지 */}
                  <div className="absolute top-2 left-2">
                    <span className={`
                      px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium
                      bg-gradient-to-r ${difficulty} text-white
                    `}>
                      {dungeon.type.toUpperCase()}
                    </span>
                  </div>

                  {/* 레벨 요구사항 */}
                  <div className="absolute top-2 right-2">
                    <div className={`
                      px-2 py-0.5 rounded-md text-[10px] md:text-xs font-medium
                      ${canEnter
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }
                    `}>
                      Lv.{dungeon.requirements.level}+
                    </div>
                  </div>

                  {/* 잠금 오버레이 */}
                  {!canEnter && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* 던전 정보 - 더욱 컴팩트하게 */}
                <div className="relative p-2 md:p-3">
                  <h3 className="text-sm md:text-base font-bold text-white mb-0.5">{dungeon.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 mb-1.5 line-clamp-1">{dungeon.description}</p>

                  {/* 난이도와 에너지 - 더 컴팩트하게 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-0.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < stars
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-[10px]">
                      <Zap className="w-2.5 h-2.5 text-yellow-500" />
                      <span className="text-gray-400">{dungeon.requirements.energy}</span>
                    </div>
                  </div>

                  {/* 보상 미리보기 - 더 컴팩트하게 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] md:text-xs">
                      <div className="flex items-center gap-0.5">
                        <span className="text-yellow-500">🏆</span>
                        <span className="text-gray-400">{dungeon.rewards.exp}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-yellow-500">💰</span>
                        <span className="text-gray-400">{dungeon.rewards.gold}</span>
                      </div>
                    </div>

                    {canEnter && (
                      <motion.div
                        animate={{
                          x: hoveredDungeon === dungeon.id ? 3 : 0
                        }}
                      >
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      </motion.div>
                    )}
                  </div>

                  {/* 추가 정보 (호버 시) */}
                  {hoveredDungeon === dungeon.id && canEnter && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-gray-700/50"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>예상 소요시간: 5-10분</span>
                      </div>
                      {dungeon.rewards.items && dungeon.rewards.items.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span>추가 보상: {dungeon.rewards.items.length}개 아이템</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
