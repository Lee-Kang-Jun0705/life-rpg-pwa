'use client'

import React from 'react'
import type { EquipmentStats } from '@/lib/types/equipment'
import { motion } from 'framer-motion'
import { Swords, Shield, Heart, Zap, Target, Sparkles, Coins, TrendingUp } from 'lucide-react'

interface EquipmentStatsProps {
  stats: EquipmentStats
}

const statIcons = {
  attack: Swords,
  defense: Shield,
  hp: Heart,
  speed: Zap,
  critRate: Target,
  critDamage: Sparkles,
  expBonus: TrendingUp,
  goldBonus: Coins
}

const statNames = {
  attack: '공격력',
  defense: '방어력',
  hp: '체력',
  speed: '속도',
  critRate: '치명타 확률',
  critDamage: '치명타 피해',
  expBonus: '경험치 보너스',
  goldBonus: '골드 보너스'
}

const statColors = {
  attack: 'text-red-500',
  defense: 'text-blue-500',
  hp: 'text-green-500',
  speed: 'text-yellow-500',
  critRate: 'text-purple-500',
  critDamage: 'text-pink-500',
  expBonus: 'text-indigo-500',
  goldBonus: 'text-amber-500'
}

export function EquipmentStats({ stats }: EquipmentStatsProps) {
  const totalPower = Object.entries(stats).reduce((sum, [stat, value]) => {
    const weights = {
      attack: 2,
      defense: 1.5,
      hp: 0.1,
      speed: 1.2,
      critRate: 3,
      critDamage: 2,
      expBonus: 1,
      goldBonus: 0.5
    }
    return sum + (value || 0) * (weights[stat as keyof typeof weights] || 1)
  }, 0)

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          총 능력치
        </h3>

        {/* 총 전투력 */}
        <div className="text-center mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            {Math.floor(totalPower).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">총 전투력</div>
        </div>

        {/* 개별 스탯 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([stat, value], index) => {
            if (!value || value === 0) {
              return null
            }

            const Icon = statIcons[stat as keyof typeof statIcons]
            const name = statNames[stat as keyof typeof statNames]
            const color = statColors[stat as keyof typeof statColors]

            return (
              <motion.div
                key={stat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  {Icon && <Icon className={`w-4 h-4 ${color}`} />}
                  <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
                </div>
                <div className={`text-xl font-bold ${color}`}>
                  {stat === 'critRate' || stat === 'critDamage' || stat === 'expBonus' || stat === 'goldBonus'
                    ? `+${value}%`
                    : `+${value}`
                  }
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 추가 정보 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">장착 아이템</span>
              <span className="font-medium">
                {Object.keys(stats).length} 종
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">세트 효과</span>
              <span className="font-medium text-purple-500">
                확인 필요
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
