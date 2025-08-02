'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { shopService } from '@/lib/services/shop-service'
import { ShopData } from '@/lib/types/shop.types'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { cn } from '@/lib/utils'

interface ShopListProps {
  onSelectShop: (shop: ShopData) => void
  selectedShopId?: string
}

export function ShopList({ onSelectShop, selectedShopId }: ShopListProps) {
  const [availableShops, setAvailableShops] = useState<ShopData[]>([])
  
  useEffect(() => {
    const shops = shopService.getAvailableShops(GAME_CONFIG.DEFAULT_USER_ID)
    setAvailableShops(shops)
  }, [])
  
  return (
    <div className="space-y-2">
      {availableShops.map((shop) => {
        const timeUntilRefresh = shopService.getTimeUntilRefresh(shop.id)
        const isSelected = selectedShopId === shop.id
        
        return (
          <motion.button
            key={shop.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectShop(shop)}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all text-left",
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{shop.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {shop.description}
                  </p>
                </div>
              </div>
              
              {shop.type === 'special' && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  ✨ 특별
                </div>
              )}
            </div>
            
            {timeUntilRefresh !== null && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                다음 갱신: {formatTimeUntilRefresh(timeUntilRefresh)}
              </div>
            )}
          </motion.button>
        )
      })}
      
      {availableShops.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          이용 가능한 상점이 없습니다
        </div>
      )}
    </div>
  )
}

function formatTimeUntilRefresh(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  return `${minutes}분`
}