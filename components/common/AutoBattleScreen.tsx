'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Swords,
  Shield,
  Heart,
  Zap
} from 'lucide-react'

interface BattleStats {
  totalDamageDealt: number
  totalDamageTaken: number
  turnsElapsed: number
  skillsUsed: number
}

interface AutoBattleScreenProps {
  title: string
  subtitle?: string
  player: {
    name: string
    level: number
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    stats?: {
      ATK?: number
      DEF?: number
      SPD?: number
    }
  }
  enemy?: {
    name: string
    level?: number
    hp: number
    maxHp: number
  }
  isPaused: boolean
  speed: number
  stats: BattleStats
  onPause: () => void
  onResume: () => void
  onSpeedChange: (speed: number) => void
  onRestart: () => void
  children?: React.ReactNode
}

export function AutoBattleScreen({
  title,
  subtitle,
  player,
  enemy,
  isPaused,
  speed,
  stats,
  onPause,
  onResume,
  onSpeedChange,
  onRestart,
  children
}: AutoBattleScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-4xl mx-auto p-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {subtitle && (
            <p className="text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* 플레이어 정보 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {player.name}
              </h3>
              <p className="text-gray-400">레벨 {player.level}</p>
            </div>
            {player.stats && (
              <div className="flex gap-4 text-sm">
                {player.stats.ATK && (
                  <div className="flex items-center gap-1">
                    <Swords className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">{player.stats.ATK}</span>
                  </div>
                )}
                {player.stats.DEF && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{player.stats.DEF}</span>
                  </div>
                )}
                {player.stats.SPD && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{player.stats.SPD}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HP/MP 바 */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">HP</span>
                <span className="text-sm text-white">
                  {player.hp} / {player.maxHp}
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">MP</span>
                <span className="text-sm text-white">
                  {player.mp} / {player.maxMp}
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 적 정보 (있을 경우) */}
        {enemy && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {enemy.name}
                </h3>
                {enemy.level && (
                  <p className="text-gray-400">레벨 {enemy.level}</p>
                )}
              </div>
            </div>

            {/* HP 바 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">HP</span>
                <span className="text-sm text-white">
                  {enemy.hp} / {enemy.maxHp}
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 전투 컨트롤 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            {isPaused ? (
              <button
                onClick={onResume}
                className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Play className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              >
                <Pause className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={onRestart}
              className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 ml-4">
              <FastForward className="w-5 h-5 text-gray-400" />
              <select
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="bg-gray-700 text-white rounded px-3 py-1"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
          </div>
        </div>

        {/* 전투 통계 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">전투 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">총 피해량</p>
              <p className="text-xl font-bold text-red-400">
                {stats.totalDamageDealt.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">받은 피해</p>
              <p className="text-xl font-bold text-yellow-400">
                {stats.totalDamageTaken.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">경과 턴</p>
              <p className="text-xl font-bold text-blue-400">
                {stats.turnsElapsed}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">스킬 사용</p>
              <p className="text-xl font-bold text-purple-400">
                {stats.skillsUsed}
              </p>
            </div>
          </div>
        </div>

        {/* 추가 컨텐츠 */}
        {children}
      </div>
    </div>
  )
}