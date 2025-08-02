'use client'

import React, { useState } from 'react'
import type { MonsterData } from '@/lib/types/battle-extended'
import type { MonsterCollectionEntry, MonsterLore } from '@/lib/types/collection'
import { MonsterDetailModal } from './MonsterDetailModal'
import { motion } from 'framer-motion'
import { Eye, Sword, Star, Lock } from 'lucide-react'

interface MonsterCardProps {
  monster: MonsterData
  entry: MonsterCollectionEntry
  lore?: MonsterLore
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

const rarityColors: Record<string, string> = {
  common: 'border-gray-400',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-orange-400',
  mythic: 'border-red-400'
}

const tierStarCount: Record<string, number> = {
  common: 1,
  elite: 2,
  boss: 3,
  legendary: 5
}

export function MonsterCard({ monster, entry, lore }: MonsterCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  const isDiscovered = entry.isDiscovered
  const isDefeated = entry.isDefeated
  const killCount = entry.killCount

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => isDiscovered && setShowDetail(true)}
        className={`
          relative p-4 rounded-xl border-2 transition-all
          ${isDiscovered ? 'cursor-pointer hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}
          ${rarityColors[monster.tier || 'common']}
          ${isDiscovered
      ? 'bg-white dark:bg-gray-800'
      : 'bg-gray-100 dark:bg-gray-900'
    }
        `}
      >
        {/* 잠금 상태 */}
        {!isDiscovered && (
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* 처치 표시 */}
        {isDefeated && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            처치
          </div>
        )}

        {/* 티어 표시 */}
        {monster.tier && monster.tier !== 'common' && isDiscovered && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {monster.tier.toUpperCase()}
          </div>
        )}

        {/* 몬스터 이미지 (대체: 이모지) */}
        <div className={`
          w-full aspect-square rounded-lg mb-3 flex items-center justify-center text-4xl
          ${isDiscovered
      ? `bg-gradient-to-br ${elementColors['neutral']}`
      : 'bg-gray-300 dark:bg-gray-700'
    }
        `}>
          {isDiscovered ? (
            monster.emoji || '👾'
          ) : (
            '❓'
          )}
        </div>

        {/* 몬스터 정보 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-center">
            {isDiscovered ? monster.name : '???'}
          </h3>

          {isDiscovered && (
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Lv.{(monster as unknown).level || '1'}</span>
                <span>•</span>
                <span className="capitalize">{monster.tier}</span>
              </div>

              {/* 스탯 표시 (간단) */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>HP</span>
                  <span>{monster.stats.hp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ATK</span>
                  <span>{monster.stats.attack}</span>
                </div>
              </div>

              {/* 상태 아이콘 */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className={`flex items-center gap-1 text-xs ${
                  isDiscovered ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <Eye className="w-3 h-3" />
                  <span>발견</span>
                </div>

                <div className={`flex items-center gap-1 text-xs ${
                  isDefeated ? 'text-red-600' : 'text-gray-400'
                }`}>
                  <Sword className="w-3 h-3" />
                  <span>처치</span>
                </div>
              </div>

              {/* 처치 횟수 */}
              {killCount > 0 && (
                <div className="text-center text-xs text-purple-600 font-medium">
                  {killCount}번 처치
                </div>
              )}
            </>
          )}
        </div>

        {/* 별점 (강함 정도) */}
        {isDiscovered && (
          <div className="flex items-center justify-center mt-2">
            {[...Array(Math.min(tierStarCount[monster.tier] || 1, 5))].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        )}
      </motion.div>

      {/* 상세 정보 모달 */}
      {showDetail && isDiscovered && (
        <MonsterDetailModal
          monster={monster}
          entry={entry}
          lore={lore}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
