import React from 'react'
import type { Monster } from '@/lib/types/dungeon'

interface MonsterDisplayProps {
  monster: Monster
  showHealthBar?: boolean
}

const TIER_COLORS = {
  common: 'from-gray-600/20 to-gray-700/20 border-gray-500/30',
  elite: 'from-green-600/20 to-green-700/20 border-green-500/30',
  boss: 'from-purple-600/20 to-purple-700/20 border-purple-500/30',
  legendary: 'from-red-600/20 to-red-700/20 border-red-500/30'
}

const TIER_LABELS = {
  common: '일반',
  elite: '정예',
  boss: '보스',
  legendary: '전설'
}

export default function MonsterDisplay({ monster, showHealthBar }: MonsterDisplayProps) {
  const healthPercentage = (monster.health / monster.maxHealth) * 100
  const tierStyle = TIER_COLORS[monster.tier]

  return (
    <div className={`bg-gradient-to-r ${tierStyle} p-2 sm:p-4 rounded-lg border`}>
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div>
          <h3 className="text-white font-semibold text-sm sm:text-base">{monster.name}</h3>
          <span className={`text-xs px-2 py-0.5 sm:py-1 rounded-full ${
            monster.tier === 'legendary' ? 'bg-red-500/30 text-red-300' :
            monster.tier === 'boss' ? 'bg-purple-500/30 text-purple-300' :
            monster.tier === 'elite' ? 'bg-green-500/30 text-green-300' :
            'bg-gray-500/30 text-gray-300'
          }`}>
            {TIER_LABELS[monster.tier]}
          </span>
        </div>
        <span className="text-red-300 text-xs sm:text-sm">
          {monster.health.toLocaleString()} / {monster.maxHealth.toLocaleString()} HP
        </span>
      </div>
      
      {showHealthBar && (
        <div className="mb-2 sm:mb-3">
          <div className="bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                monster.tier === 'legendary' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                monster.tier === 'boss' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                monster.tier === 'elite' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}
              style={{ width: `${Math.max(0, healthPercentage)}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
        <div className="text-gray-300">
          <span className="text-white">⚔️ 공격력:</span> {monster.attack}
        </div>
        <div className="text-gray-300">
          <span className="text-white">🛡️ 방어력:</span> {monster.defense}
        </div>
        <div className="text-gray-300">
          <span className="text-white">💰 보상:</span> {monster.goldReward} 골드
        </div>
        <div className="text-gray-300">
          <span className="text-white">📦 드롭률:</span> {monster.itemDropRate.toFixed(0)}%
        </div>
      </div>
    </div>
  )
}