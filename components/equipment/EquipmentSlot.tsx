'use client'

import { motion } from 'framer-motion'
import type { EquippedItem, EquipmentSlot as EquipmentSlotType } from '@/lib/types/inventory'
import { cn } from '@/lib/utils'
import { Sword, Shield, Gem } from 'lucide-react'

interface EquipmentSlotProps {
  slot: EquipmentSlotType
  equippedItem: EquippedItem | null
  onClick: () => void
  isSelected?: boolean
}

export function EquipmentSlot({ slot, equippedItem, onClick, isSelected }: EquipmentSlotProps) {
  const getSlotIcon = () => {
    switch (slot) {
      case 'weapon':
        return <Sword className="w-8 h-8 text-gray-400" />
      case 'armor':
        return <Shield className="w-8 h-8 text-gray-400" />
      case 'accessory1':
      case 'accessory2':
        return <Gem className="w-8 h-8 text-gray-400" />
      default:
        return null
    }
  }

  const getSlotName = () => {
    switch (slot) {
      case 'weapon':
        return '무기'
      case 'armor':
        return '방어구'
      case 'accessory1':
        return '액세서리 1'
      case 'accessory2':
        return '액세서리 2'
      default:
        return ''
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'uncommon': return 'border-green-500'
      case 'rare': return 'border-blue-500'
      case 'epic': return 'border-purple-500'
      case 'legendary': return 'border-orange-500'
      default: return 'border-gray-400'
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative w-24 h-24 rounded-lg border-2 transition-all",
        equippedItem
          ? `${getRarityColor(equippedItem.item.rarity)} bg-gradient-to-br from-gray-800 to-gray-900`
          : "border-gray-600 bg-gray-800/50 border-dashed",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {equippedItem ? (
        <>
          {/* 장착된 아이템 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">{equippedItem.item.icon}</span>
          </div>
          
          {/* 강화 수치 */}
          {equippedItem.enhancement > 0 && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-1 rounded-bl font-bold">
              +{equippedItem.enhancement}
            </div>
          )}
          
          {/* 아이템 이름 */}
          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-xs text-white p-1 rounded-b">
            {equippedItem.item.name}
          </div>
        </>
      ) : (
        <>
          {/* 빈 슬롯 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {getSlotIcon()}
            <span className="text-xs text-gray-500">{getSlotName()}</span>
          </div>
        </>
      )}
    </motion.button>
  )
}