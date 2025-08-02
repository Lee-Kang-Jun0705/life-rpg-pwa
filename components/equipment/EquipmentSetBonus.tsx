'use client'

import React from 'react'
import type { EquipmentSet, SetBonus } from '@/lib/types/equipment'
import { motion } from 'framer-motion'
import { Crown, Check } from 'lucide-react'

interface EquipmentSetBonusProps {
  set: EquipmentSet
  activeBonuses: SetBonus[]
}

export function EquipmentSetBonus({ set, activeBonuses }: EquipmentSetBonusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-500 rounded-lg">
          <Crown className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-purple-700 dark:text-purple-300">
            {set.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {set.description}
          </p>

          {/* 세트 보너스 목록 */}
          <div className="mt-3 space-y-2">
            {set.setBonuses.map((bonus, index) => {
              const isActive = activeBonuses.includes(bonus)

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 text-sm p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  <div className="mt-0.5">
                    {isActive ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="block w-4 h-4 rounded-full border-2 border-current" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">
                      {bonus.requiredPieces}세트 효과
                    </div>
                    <div className="text-xs opacity-90">
                      {bonus.description}
                    </div>

                    {/* 스탯 보너스 표시 */}
                    {bonus.stats && isActive && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(bonus.stats).map(([stat, value]) => (
                          <span key={stat} className="text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded">
                            {stat} +{value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
