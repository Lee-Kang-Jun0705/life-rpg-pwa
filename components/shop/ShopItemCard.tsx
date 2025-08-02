'use client'

import { motion } from 'framer-motion'
import { ShopItem } from '@/lib/types/shop.types'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/userStore'

interface ShopItemCardProps {
  item: ShopItem
  price: number
  canPurchase: boolean
  onPurchase: () => void
}

export function ShopItemCard({ item, price, canPurchase, onPurchase }: ShopItemCardProps) {
  const user = useUserStore(state => state.user)
  const userLevel = user?.level || 1
  
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'uncommon': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'rare': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'epic': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
      case 'legendary': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      default: return 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
    }
  }
  
  const isLocked = item.requirements?.level && userLevel < item.requirements.level
  const isSoldOut = item.stock === 0
  
  return (
    <motion.div
      whileHover={!isLocked && !isSoldOut ? { scale: 1.02 } : {}}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        getRarityColor(item.rarity),
        isLocked || isSoldOut ? "opacity-50" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{item.icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {item.description}
          </p>
          
          {/* 요구 사항 표시 */}
          {item.requirements && (
            <div className="mt-2 text-xs space-y-1">
              {item.requirements.level && (
                <div className={cn(
                  userLevel >= item.requirements.level
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  요구 레벨: {item.requirements.level}
                </div>
              )}
            </div>
          )}
          
          {/* 재고 표시 */}
          {item.stock !== undefined && item.stock !== -1 && (
            <div className="mt-2 text-xs">
              {item.stock > 0 ? (
                <span className="text-gray-600 dark:text-gray-400">
                  재고: {item.stock}개
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-bold">
                  품절
                </span>
              )}
            </div>
          )}
          
          {/* 아이템 상세 정보 */}
          {item.type === 'equipment' && item.itemData && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {Object.entries(item.itemData.stats || {}).map(([stat, value]) => (
                <div key={stat}>
                  {getStatName(stat)}: +{value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-yellow-600 dark:text-yellow-400">💰</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {price}
          </span>
          {price < item.price && (
            <span className="text-xs text-gray-500 line-through">
              {item.price}
            </span>
          )}
        </div>
        
        <motion.button
          whileHover={canPurchase ? { scale: 1.05 } : {}}
          whileTap={canPurchase ? { scale: 0.95 } : {}}
          onClick={onPurchase}
          disabled={!canPurchase || isLocked || isSoldOut}
          className={cn(
            "px-4 py-2 rounded-lg font-bold transition-colors",
            canPurchase && !isLocked && !isSoldOut
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          )}
        >
          {isSoldOut ? '품절' : isLocked ? '잠김' : '구매'}
        </motion.button>
      </div>
    </motion.div>
  )
}

function getStatName(stat: string): string {
  const statNames: Record<string, string> = {
    hp: 'HP',
    mp: 'MP',
    attack: '공격력',
    defense: '방어력',
    speed: '속도',
    critRate: '치명타율',
    critDamage: '치명타 피해',
    dropRate: '드롭률'
  }
  return statNames[stat] || stat
}