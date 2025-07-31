'use client'

import React from 'react'
import type { Equipment } from '@/lib/types/equipment'
import { calculateEquipmentPower } from '@/lib/types/equipment'
import { motion } from 'framer-motion'
import { Sword, Shield, HardHat, Shirt, Hand, Footprints, Gem, Star } from 'lucide-react'

interface EquipmentCardProps {
  equipment: Equipment
  onClick: () => void
  isEquipped?: boolean
}

const typeIcons = {
  weapon: Sword,
  shield: Shield,
  helmet: HardHat,
  armor: Shirt,
  gloves: Hand,
  boots: Footprints,
  accessory: Gem,
}

const rarityColors = {
  common: 'border-gray-400 bg-gray-50 dark:bg-gray-900',
  uncommon: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  rare: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  epic: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  legendary: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
  mythic: 'border-red-400 bg-red-50 dark:bg-red-900/20',
}

const rarityGradients = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 to-orange-600',
  mythic: 'from-red-400 to-red-600',
}

export function EquipmentCard({ equipment, onClick, isEquipped }: EquipmentCardProps) {
  const Icon = typeIcons[equipment.type]
  const power = calculateEquipmentPower(equipment)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all
        ${rarityColors[equipment.rarity]}
        ${isEquipped ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
        hover:shadow-lg
      `}
    >
      {/* 장착 중 표시 */}
      {isEquipped && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
          E
        </div>
      )}

      {/* 세트 아이템 표시 */}
      {equipment.setId && (
        <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          SET
        </div>
      )}

      {/* 상단 정보 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${rarityGradients[equipment.rarity]}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm line-clamp-1">{equipment.name}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Lv.{equipment.level}</span>
              {equipment.enhancementLevel && equipment.enhancementLevel > 0 && (
                <span className="text-green-500">+{equipment.enhancementLevel}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 주요 스탯 */}
      <div className="space-y-1 mb-3">
        {equipment.stats.attack && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">공격력</span>
            <span className="font-medium">+{equipment.stats.attack}</span>
          </div>
        )}
        {equipment.stats.defense && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">방어력</span>
            <span className="font-medium">+{equipment.stats.defense}</span>
          </div>
        )}
        {equipment.stats.hp && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">체력</span>
            <span className="font-medium">+{equipment.stats.hp}</span>
          </div>
        )}
      </div>

      {/* 특수 효과 */}
      {equipment.specialEffects && equipment.specialEffects.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          {equipment.specialEffects.slice(0, 2).map((effect, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full"
            >
              {effect.name}
            </div>
          ))}
          {equipment.specialEffects.length > 2 && (
            <span className="text-xs text-gray-500">+{equipment.specialEffects.length - 2}</span>
          )}
        </div>
      )}

      {/* 하단 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[...Array(Math.min(equipment.tier, 5))].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          ))}
          {equipment.tier > 5 && (
            <span className="text-xs text-yellow-600">+{equipment.tier - 5}</span>
          )}
        </div>
        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
          전투력 {power.toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}