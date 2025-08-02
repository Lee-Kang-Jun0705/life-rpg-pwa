'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { InventorySlot, Item, ItemRarity } from '@/lib/types/inventory'
import { inventoryService } from '@/lib/services/inventory-service'
import { isStackableItem } from '@/lib/types/inventory'
import { cn } from '@/lib/utils'

interface InventoryDisplayProps {
  userId: string
  onItemClick?: (slot: InventorySlot) => void
  selectedSlotId?: number
  filter?: {
    type?: Item['type']
    rarity?: ItemRarity
    searchText?: string
  }
}

export function InventoryDisplay({
  userId,
  onItemClick,
  selectedSlotId,
  filter
}: InventoryDisplayProps) {
  const [inventory, setInventory] = useState(inventoryService.getInventory(userId))
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  
  // 인벤토리 새로고침
  const refreshInventory = () => {
    setInventory(inventoryService.getInventory(userId))
  }
  
  useEffect(() => {
    refreshInventory()
  }, [userId])
  
  // 희귀도별 색상
  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'uncommon': return 'border-green-500'
      case 'rare': return 'border-blue-500'
      case 'epic': return 'border-purple-500'
      case 'legendary': return 'border-orange-500'
      default: return 'border-gray-400'
    }
  }
  
  // 희귀도별 배경 그라데이션
  const getRarityGradient = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
      case 'uncommon': return 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800'
      case 'rare': return 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'
      case 'epic': return 'from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800'
      case 'legendary': return 'from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800'
      default: return 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
    }
  }
  
  // 필터링된 슬롯 가져오기
  const getFilteredSlots = () => {
    if (!filter) return inventory.slots
    
    return inventory.slots.filter(slot => {
      if (!slot.item) return false
      
      if (filter.type && slot.item.type !== filter.type) return false
      if (filter.rarity && slot.item.rarity !== filter.rarity) return false
      
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        return (
          slot.item.name.toLowerCase().includes(searchLower) ||
          slot.item.description.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
  }
  
  const filteredSlots = getFilteredSlots()
  
  return (
    <div className="space-y-4">
      {/* 인벤토리 정보 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-400">
            슬롯: {inventory.slots.filter(s => s.item).length} / {inventory.maxSlots}
          </span>
          <span className="text-yellow-600 dark:text-yellow-400">
            💰 {inventory.gold.toLocaleString()} 골드
          </span>
          {inventory.diamonds > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              💎 {inventory.diamonds.toLocaleString()} 다이아몬드
            </span>
          )}
        </div>
      </div>
      
      {/* 인벤토리 그리드 */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {filteredSlots.map((slot) => (
          <motion.div
            key={slot.slotId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: slot.slotId * 0.01 }}
            className="relative"
            onMouseEnter={() => setHoveredSlot(slot.slotId)}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            <button
              onClick={() => onItemClick?.(slot)}
              className={cn(
                "w-full aspect-square rounded-lg border-2 transition-all",
                "hover:scale-105 active:scale-95",
                slot.item
                  ? `${getRarityColor(slot.item.rarity)} bg-gradient-to-br ${getRarityGradient(slot.item.rarity)}`
                  : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800",
                selectedSlotId === slot.slotId && "ring-2 ring-primary ring-offset-2",
                slot.locked && "opacity-50 cursor-not-allowed"
              )}
              disabled={slot.locked}
            >
              {slot.item && (
                <>
                  {/* 아이템 아이콘 */}
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {slot.item.icon}
                  </div>
                  
                  {/* 수량 표시 (스택 가능한 아이템) */}
                  {isStackableItem(slot.item) && slot.quantity > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                      {slot.quantity}
                    </div>
                  )}
                  
                  {/* 강화 수치 (장비) */}
                  {slot.enhancement > 0 && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-1 rounded-bl font-bold">
                      +{slot.enhancement}
                    </div>
                  )}
                  
                  {/* 장착 중 표시 */}
                  {slot.item.type === 'equipment' && (
                    <div className="absolute top-0 left-0">
                      {/* 장착 여부는 장비 서비스에서 확인해야 함 */}
                    </div>
                  )}
                </>
              )}
            </button>
            
            {/* 툴팁 */}
            {hoveredSlot === slot.slotId && slot.item && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 text-white p-3 rounded-lg shadow-xl min-w-[200px]"
                >
                  <div className="font-semibold mb-1">{slot.item.name}</div>
                  <div className="text-xs text-gray-300 mb-2">{slot.item.description}</div>
                  
                  {/* 장비 스탯 */}
                  {slot.item.type === 'equipment' && 'stats' in slot.item && (
                    <div className="text-xs space-y-1 mb-2">
                      {Object.entries(slot.item.stats).map(([stat, value]) => (
                        <div key={stat} className="text-green-400">
                          {stat}: +{value}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">레벨 {slot.item.levelRequirement}</span>
                    <span className="text-yellow-400">{slot.item.sellPrice} 골드</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}
        
        {/* 빈 슬롯 채우기 */}
        {Array.from({ length: Math.max(0, 20 - filteredSlots.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-full aspect-square rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-30"
          />
        ))}
      </div>
    </div>
  )
}