'use client'

import React from 'react'
import type { MonsterData } from '@/lib/types/battle-extended'
import type { MonsterCollectionEntry, MonsterLore } from '@/lib/types/collection'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Sword, Calendar, Star, Shield, Zap, Heart } from 'lucide-react'

interface MonsterDetailModalProps {
  monster: MonsterData
  entry: MonsterCollectionEntry
  lore?: MonsterLore
  onClose: () => void
}

const elementColors = {
  fire: 'from-red-400 to-orange-500',
  water: 'from-blue-400 to-cyan-500',
  earth: 'from-green-400 to-yellow-500',
  air: 'from-gray-400 to-white',
  light: 'from-yellow-300 to-white',
  dark: 'from-purple-500 to-black',
  neutral: 'from-gray-400 to-gray-600'
}

const rarityNames = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  mythic: '신화'
}

const tierStarCount: Record<string, number> = {
  common: 1,
  elite: 2,
  boss: 3,
  legendary: 5
}

export function MonsterDetailModal({ monster, entry, lore, onClose }: MonsterDetailModalProps) {
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
          <div className={`relative p-6 bg-gradient-to-br ${elementColors['neutral']} text-white`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="text-6xl">
                {monster.emoji || '👾'}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{monster.name}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm opacity-90">
                  <span>Lv.{(monster as unknown).level || '1'}</span>
                  <span>•</span>
                  <span className="capitalize">{monster.tier}</span>
                </div>
              </div>
            </div>

            {/* 별점 */}
            <div className="flex items-center gap-1 mt-3">
              {[...Array(Math.min(tierStarCount[monster.tier] || 1, 5))].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              ))}
              <span className="ml-2 text-sm opacity-90">위험도 {tierStarCount[monster.tier] || 1}</span>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {/* 기본 스탯 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                기본 능력치
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">체력</span>
                  </div>
                  <div className="text-xl font-bold">{monster.stats.hp}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sword className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">공격력</span>
                  </div>
                  <div className="text-xl font-bold">{monster.stats.attack}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">방어력</span>
                  </div>
                  <div className="text-xl font-bold">{monster.stats.defense}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">속도</span>
                  </div>
                  <div className="text-xl font-bold">{monster.stats.speed}</div>
                </div>
              </div>
            </div>

            {/* 수집 정보 */}
            <div>
              <h3 className="font-semibold mb-3">수집 정보</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <span>첫 발견</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.firstEncounteredAt ?
                      new Date(entry.firstEncounteredAt).toLocaleDateString() :
                      '미발견'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sword className="w-4 h-4 text-red-500" />
                    <span>첫 처치</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.firstDefeatedAt ?
                      new Date(entry.firstDefeatedAt).toLocaleDateString() :
                      '미처치'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>마지막 조우</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(entry.lastSeenAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="font-medium">총 처치 횟수</span>
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {entry.killCount}회
                  </span>
                </div>
              </div>
            </div>

            {/* 몬스터 설명 (lore) */}
            {lore && (
              <div>
                <h3 className="font-semibold mb-3">몬스터 도감</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">설명</h4>
                    <p className="text-sm leading-relaxed">{lore.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">서식지</h4>
                    <p className="text-sm">{lore.habitat}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">행동 패턴</h4>
                    <p className="text-sm">{lore.behavior}</p>
                  </div>

                  {lore.weakness && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">약점</h4>
                      <p className="text-sm text-red-600 dark:text-red-400">{lore.weakness}</p>
                    </div>
                  )}

                  {lore.trivia && lore.trivia.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">흥미로운 사실</h4>
                      <ul className="text-sm space-y-1">
                        {lore.trivia.map((fact, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 드롭 아이템 */}
            {monster.dropTable && monster.dropTable.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">드롭 아이템</h3>
                <div className="flex flex-wrap gap-2">
                  {monster.dropTable.map((drop, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm rounded-full"
                    >
                      {drop.itemId} ({Math.round(drop.chance * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
