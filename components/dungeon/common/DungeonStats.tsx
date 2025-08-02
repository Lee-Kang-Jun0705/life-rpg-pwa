'use client'

import React from 'react'
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react'

interface BattleStats {
  totalDamageDealt: number
  totalDamageTaken: number
  turnsElapsed: number
  skillsUsed: number
  accuracy?: number
  criticalHits?: number
  healingDone?: number
  comboDamage?: number
}

interface DungeonStatsProps {
  stats: BattleStats
  title?: string
  showAdvancedStats?: boolean
}

export function DungeonStats({
  stats,
  title = '전투 통계',
  showAdvancedStats = false
}: DungeonStatsProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

      {/* 기본 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Swords className="w-4 h-4 text-red-400" />
            <p className="text-gray-400 text-sm">총 피해량</p>
          </div>
          <p className="text-xl font-bold text-red-400">
            {stats.totalDamageDealt.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-yellow-400" />
            <p className="text-gray-400 text-sm">받은 피해</p>
          </div>
          <p className="text-xl font-bold text-yellow-400">
            {stats.totalDamageTaken.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <p className="text-gray-400 text-sm">경과 턴</p>
          </div>
          <p className="text-xl font-bold text-blue-400">
            {stats.turnsElapsed}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-400" />
            <p className="text-gray-400 text-sm">스킬 사용</p>
          </div>
          <p className="text-xl font-bold text-purple-400">
            {stats.skillsUsed}
          </p>
        </div>
      </div>

      {/* 고급 통계 */}
      {showAdvancedStats && (
        <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
          {stats.accuracy !== undefined && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-400" />
                <p className="text-gray-400 text-sm">명중률</p>
              </div>
              <p className="text-xl font-bold text-green-400">
                {stats.accuracy}%
              </p>
            </div>
          )}

          {stats.criticalHits !== undefined && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <p className="text-gray-400 text-sm">치명타</p>
              </div>
              <p className="text-xl font-bold text-orange-400">
                {stats.criticalHits}
              </p>
            </div>
          )}

          {stats.healingDone !== undefined && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-pink-400" />
                <p className="text-gray-400 text-sm">회복량</p>
              </div>
              <p className="text-xl font-bold text-pink-400">
                {stats.healingDone.toLocaleString()}
              </p>
            </div>
          )}

          {stats.comboDamage !== undefined && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <p className="text-gray-400 text-sm">콤보 피해</p>
              </div>
              <p className="text-xl font-bold text-cyan-400">
                {stats.comboDamage.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
