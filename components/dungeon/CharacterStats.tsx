import React from 'react'
import type { CharacterBattleStats } from '@/lib/types/dungeon'

interface CharacterStatsProps {
  stats: CharacterBattleStats
  showHealthBar?: boolean
}

export default function CharacterStats({ stats, showHealthBar }: CharacterStatsProps) {
  const healthPercentage = (stats.health / stats.maxHealth) * 100

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 p-2 sm:p-4 rounded-lg border border-blue-500/30">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="text-white font-semibold text-sm sm:text-base">🦸‍♂️ 캐릭터 (Lv.{stats.totalLevel})</h3>
        <span className="text-blue-300 text-xs sm:text-sm">
          {stats.health.toLocaleString()} / {stats.maxHealth.toLocaleString()} HP
        </span>
      </div>
      
      {showHealthBar && (
        <div className="mb-2 sm:mb-3">
          <div className="bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
              style={{ width: `${Math.max(0, healthPercentage)}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
        <div className="text-gray-300">
          <span className="text-white">⚔️ 공격력:</span> {stats.attack}
        </div>
        <div className="text-gray-300">
          <span className="text-white">🛡️ 방어력:</span> {stats.defense}
        </div>
        <div className="text-gray-300">
          <span className="text-white">⚡ 공격속도:</span> {stats.attackSpeed}%
        </div>
        <div className="text-gray-300">
          <span className="text-white">💥 치명타:</span> {stats.criticalChance.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}