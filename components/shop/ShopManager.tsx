'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShopList } from './ShopList'
import { ShopItemCard } from './ShopItemCard'
import { shopService } from '@/lib/services/shop-service'
import { ShopData, ShopItem } from '@/lib/types/shop.types'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { useUserStore } from '@/lib/stores/userStore'
import { cn } from '@/lib/utils'

export function ShopManager() {
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null)
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([])
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null)
  const user = useUserStore(state => state.user)
  
  useEffect(() => {
    if (selectedShop) {
      const items = shopService.getAvailableItems(selectedShop.id, GAME_CONFIG.DEFAULT_USER_ID)
      setAvailableItems(items)
    }
  }, [selectedShop])
  
  const handlePurchase = (item: ShopItem) => {
    if (!selectedShop) return
    
    const canPurchaseResult = shopService.canPurchase(
      selectedShop.id,
      item.id,
      GAME_CONFIG.DEFAULT_USER_ID,
      1
    )
    
    if (!canPurchaseResult.canPurchase) {
      setPurchaseResult({
        success: false,
        message: canPurchaseResult.reason || '구매할 수 없습니다'
      })
      setTimeout(() => setPurchaseResult(null), 3000)
      return
    }
    
    const success = shopService.purchaseItem(
      selectedShop.id,
      item.id,
      GAME_CONFIG.DEFAULT_USER_ID,
      1
    )
    
    if (success) {
      setPurchaseResult({
        success: true,
        message: `${item.name}을(를) 구매했습니다!`
      })
      
      // 아이템 목록 갱신
      const items = shopService.getAvailableItems(selectedShop.id, GAME_CONFIG.DEFAULT_USER_ID)
      setAvailableItems(items)
    } else {
      setPurchaseResult({
        success: false,
        message: '구매에 실패했습니다'
      })
    }
    
    setTimeout(() => setPurchaseResult(null), 3000)
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            상점
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 dark:text-yellow-400">💰</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {user?.coins || 0}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* 상점 목록 */}
        <div className="w-1/3 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            상점 목록
          </h3>
          <ShopList
            onSelectShop={setSelectedShop}
            selectedShopId={selectedShop?.id}
          />
        </div>
        
        {/* 아이템 목록 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedShop ? (
            <>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                {selectedShop.name}
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableItems.map((item) => {
                  const price = shopService.calculatePrice(item, GAME_CONFIG.DEFAULT_USER_ID)
                  const canPurchaseResult = shopService.canPurchase(
                    selectedShop.id,
                    item.id,
                    GAME_CONFIG.DEFAULT_USER_ID,
                    1
                  )
                  
                  return (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      price={price}
                      canPurchase={canPurchaseResult.canPurchase}
                      onPurchase={() => handlePurchase(item)}
                    />
                  )
                })}
              </div>
              
              {availableItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  구매 가능한 아이템이 없습니다
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              상점을 선택해주세요
            </div>
          )}
        </div>
      </div>
      
      {/* 구매 결과 알림 */}
      <AnimatePresence>
        {purchaseResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-4 left-1/2 transform -translate-x-1/2",
              "px-6 py-3 rounded-lg shadow-lg",
              purchaseResult.success
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            )}
          >
            {purchaseResult.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}