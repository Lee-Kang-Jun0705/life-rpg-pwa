'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { InventoryItem, GeneratedItem } from '@/lib/types/item-system'
import { Lock, Unlock } from 'lucide-react'

interface InventoryGridProps {
  items: InventoryItem[]
  selectedItems: Set<string>
  onSelectItem: (item: GeneratedItem, event: React.MouseEvent) => void
  onEquipItem: (item: GeneratedItem) => void
  onToggleLock: (itemId: string) => void
}

export function InventoryGrid({
  items,
  selectedItems,
  onSelectItem,
  onEquipItem,
  onToggleLock
}: InventoryGridProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'uncommon': return 'border-green-400'
      case 'rare': return 'border-blue-400'
      case 'epic': return 'border-purple-400'
      case 'legendary': return 'border-orange-400'
      default: return 'border-gray-400'
    }
  }

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-800 to-gray-700'
      case 'uncommon': return 'from-green-900 to-gray-800'
      case 'rare': return 'from-blue-900 to-gray-800'
      case 'epic': return 'from-purple-900 to-gray-800'
      case 'legendary': return 'from-orange-900 to-gray-800'
      default: return 'from-gray-800 to-gray-700'
    }
  }

  const canEquip = (item: GeneratedItem) => {
    return ['weapon', 'armor', 'accessory'].includes(item.type)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-400">인벤토리가 비어있습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {items.map((invItem, index) => {
        const item = invItem.item
        const isSelected = selectedItems.has(item.uniqueId)

        return (
          <motion.div
            key={item.uniqueId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            whileHover={{ scale: 1.05 }}
            className={`relative aspect-square cursor-pointer group ${
              isSelected ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={(e) => onSelectItem(item, e)}
            onDoubleClick={() => canEquip(item) && onEquipItem(item)}
            data-testid="inventory-item"
          >
            {/* 아이템 배경 */}
            <div className={`
              absolute inset-0 rounded-lg border-2 
              ${getRarityColor(item.rarity)}
              ${invItem.equipped ? 'opacity-50' : ''}
              bg-gradient-to-br ${getRarityGradient(item.rarity)}
              transition-all group-hover:brightness-110
            `} />

            {/* 아이템 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">
                {item.icon || (
                  item.type === 'weapon' ? '⚔️' :
                    item.type === 'armor' ? '🛡️' :
                      item.type === 'accessory' ? '💎' :
                        item.type === 'consumable' ? '🧪' :
                          '📦'
                )}
              </span>
            </div>

            {/* 수량 표시 */}
            {invItem.quantity > 1 && (
              <div className="absolute bottom-0 right-0 bg-gray-900 text-xs px-1 rounded-tl">
                {invItem.quantity}
              </div>
            )}

            {/* 레벨 표시 */}
            <div className="absolute top-0 left-0 bg-gray-900 text-xs px-1 rounded-br">
              {item.level}
            </div>

            {/* 장착 중 표시 */}
            {invItem.equipped && (
              <div className="absolute inset-0 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xs bg-purple-600 px-2 py-1 rounded">E</span>
              </div>
            )}

            {/* 잠금 표시 */}
            {invItem.locked && (
              <div className="absolute top-0 right-0 p-1">
                <Lock className="w-3 h-3 text-yellow-500" />
              </div>
            )}

            {/* 호버 액션 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all rounded-lg">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity h-full flex flex-col justify-end p-1">
                {/* 잠금 토글 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLock(item.uniqueId)
                  }}
                  className="p-1 bg-gray-800 hover:bg-gray-700 rounded text-xs mb-1"
                  data-testid="toggle-lock"
                >
                  {invItem.locked ? (
                    <Unlock className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                </button>

                {/* 장착 버튼 */}
                {canEquip(item) && !invItem.equipped && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEquipItem(item)
                    }}
                    className="p-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                    data-testid="equip-btn"
                  >
                    장착
                  </button>
                )}
              </div>
            </div>

            {/* 아이템 이름 툴팁 */}
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity z-10
            ">
              <div className="bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                {item.name}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
