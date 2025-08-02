'use client'

import { useState, useEffect } from 'react'
import { ImprovedShopScreen } from '@/components/shop/ImprovedShopScreen'
import { useShop } from '@/lib/shop'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast, toastHelpers } from '@/components/ui/Toast'
import type { ShopItem } from '@/lib/shop/types'

export function ShopTab() {
  const { state, isLoading, purchaseItem, getFilteredItems } = useShop()
  const { toast } = useToast()
  const [shopItems, setShopItems] = useState<ShopItem[]>([])

  useEffect(() => {
    if (!isLoading) {
      // 모든 카테고리의 아이템 가져오기
      const allItems = getFilteredItems()
      setShopItems(allItems)
    }
  }, [isLoading, state.selectedCategory, getFilteredItems])

  const handlePurchase = async(item: ShopItem) => {
    const success = await purchaseItem(item, 1)
    if (success) {
      toast(toastHelpers.success(
        '구매 완료!',
        `${item.name}을(를) 구매했습니다.`,
        { duration: 3000 }
      ))
    } else {
      toast(toastHelpers.error(
        '구매 실패',
        '골드가 부족하거나 오류가 발생했습니다.',
        { duration: 4000 }
      ))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="large" message="상점 로딩 중..." />
      </div>
    )
  }

  return (
    <ImprovedShopScreen
      shopItems={shopItems}
      onPurchase={handlePurchase}
    />
  )
}
