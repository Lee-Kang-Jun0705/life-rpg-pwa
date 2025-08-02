'use client'

import React, { useState, useEffect } from 'react'
import { useShop } from '@/lib/shop'
import { ItemCategory, CATEGORY_NAMES, RARITY_COLORS, ShopItem, InventoryItem } from '@/lib/shop/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast, toastHelpers } from '@/components/ui/Toast'
import { playerService } from '@/lib/services/player.service'
import { ALL_ITEMS } from '@/lib/data/items'

export default function ShopContent() {
  const {
    state,
    isLoading,
    purchaseItem,
    equipItem,
    unequipItem,
    useConsumableItem,
    setSelectedCategory,
    getFilteredItems,
    getInventoryItems,
    getEquippedItems
  } = useShop()

  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop')
  const [selectedItem, setSelectedItem] = useState<ShopItem | InventoryItem | null>(null)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [playerGold, setPlayerGold] = useState(0)

  const equippedItems = isLoading ? { weapon: undefined, armor: undefined, accessory: undefined } : getEquippedItems()

  // 플레이어 골드 불러오기
  useEffect(() => {
    const loadPlayerData = async() => {
      const player = await playerService.getPlayer('current-user')
      if (player) {
        setPlayerGold(player.gold)
      }
    }
    loadPlayerData()
  }, [state.inventory.coins])

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-48" />
            <div className="h-4 bg-gray-300 rounded mb-8 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredShopItems = getFilteredItems()
  const inventoryItems = getInventoryItems()

  const handleCategoryChange = (category: ItemCategory | 'all') => {
    setSelectedCategory(category)
  }

  const handlePurchase = async(item: ShopItem) => {
    const success = await purchaseItem(item, purchaseQuantity)
    if (success) {
      setSelectedItem(null)
      setPurchaseQuantity(1)
      toast(toastHelpers.success(
        '구매 완료!',
        `${item.name} ${purchaseQuantity}개를 구매했습니다.`,
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

  const handleEquip = async(itemId: string) => {
    const success = await equipItem(itemId)
    if (success) {
      const item = getInventoryItems().find(i => i.id === itemId)
      toast(toastHelpers.success(
        '장착 완료!',
        `${item?.name || '아이템'}을(를) 장착했습니다.`,
        { duration: 3000 }
      ))
    } else {
      toast(toastHelpers.error(
        '장착 실패',
        '아이템 장착 중 오류가 발생했습니다.',
        { duration: 3000 }
      ))
    }
  }

  const handleUnequip = async(itemId: string) => {
    const success = await unequipItem(itemId)
    if (success) {
      const item = getInventoryItems().find(i => i.id === itemId)
      toast(toastHelpers.success(
        '해제 완료!',
        `${item?.name || '아이템'}을(를) 해제했습니다.`,
        { duration: 3000 }
      ))
    } else {
      toast(toastHelpers.error(
        '해제 실패',
        '아이템 해제 중 오류가 발생했습니다.',
        { duration: 3000 }
      ))
    }
  }

  const handleUseConsumable = async(itemId: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const success = await useConsumableItem(itemId)
    if (success) {
      const item = getInventoryItems().find(i => i.id === itemId)
      toast(toastHelpers.success(
        '사용 완료!',
        `${item?.name || '소모품'}을(를) 사용했습니다.`,
        { duration: 3000 }
      ))
    } else {
      toast(toastHelpers.error(
        '사용 실패',
        '소모품 사용 중 오류가 발생했습니다.',
        { duration: 3000 }
      ))
    }
  }

  const CategoryFilter = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {Object.entries(CATEGORY_NAMES).map(([category, name]) => (
        <Button
          key={category}
          variant={state.selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryChange(category as ItemCategory | 'all')}
          className="whitespace-nowrap"
        >
          {name}
        </Button>
      ))}
    </div>
  )

  const ItemCard = ({
    item,
    isInventoryItem = false
  }: {
    item: ShopItem | InventoryItem
    isInventoryItem?: boolean
  }) => {
    const inventoryItem = isInventoryItem ? item as InventoryItem : null
    const isEquipped = inventoryItem?.isEquipped || false
    const quantity = inventoryItem?.quantity || 0

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => setSelectedItem(item)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                <div className={`text-xs px-2 py-1 rounded-full ${RARITY_COLORS[item.rarity]}`}>
                  {item.rarity}
                </div>
              </div>
            </div>
            {isInventoryItem && (
              <div className="text-right text-sm">
                {quantity > 1 && <div className="text-gray-500">×{quantity}</div>}
                {isEquipped && <div className="text-green-600 font-medium">장착중</div>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>

          {item.effects && (
            <div className="mb-3">
              {item.effects.map((effect, index) => (
                <div key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-1">
                  {effect}
                </div>
              ))}
            </div>
          )}

          {!isInventoryItem && (
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-yellow-600">💰 {item.price}</span>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePurchase(item as ShopItem)
                }}
                disabled={playerGold < item.price}
              >
                구매
              </Button>
            </div>
          )}

          {isInventoryItem && (
            <div className="flex gap-2">
              {item.isEquippable && (
                <Button
                  size="sm"
                  variant={isEquipped ? 'destructive' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation()
                    isEquipped ? handleUnequip(item.id) : handleEquip(item.id)
                  }}
                >
                  {isEquipped ? '해제' : '장착'}
                </Button>
              )}

              {item.category === 'consumable' && quantity > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUseConsumable(item.id)
                  }}
                >
                  사용
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const ShopTab = () => (
    <div className="space-y-4">
      <CategoryFilter />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShopItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )

  const InventoryTab = () => (
    <div className="space-y-4">
      {/* 장착된 아이템 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">장착 아이템</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">무기</div>
              {equippedItems.weapon ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="text-2xl">{equippedItems.weapon?.icon}</span>
                  <span className="text-sm font-medium">{equippedItems.weapon?.name}</span>
                </div>
              ) : (
                <div className="p-2 border-2 border-dashed border-gray-300 rounded text-gray-500">
                  미장착
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">갑옷</div>
              {equippedItems.armor ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="text-2xl">{equippedItems.armor?.icon}</span>
                  <span className="text-sm font-medium">{equippedItems.armor?.name}</span>
                </div>
              ) : (
                <div className="p-2 border-2 border-dashed border-gray-300 rounded text-gray-500">
                  미장착
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">액세서리</div>
              {equippedItems.accessory ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="text-2xl">{equippedItems.accessory?.icon}</span>
                  <span className="text-sm font-medium">{equippedItems.accessory?.name}</span>
                </div>
              ) : (
                <div className="p-2 border-2 border-dashed border-gray-300 rounded text-gray-500">
                  미장착
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 인벤토리 아이템 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventoryItems.map((item) => (
          <ItemCard key={`${item.id}-${item.purchaseDate.getTime()}`} item={item} isInventoryItem />
        ))}
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">상점</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-lg">
            <span className="text-xl">💰</span>
            <span className="font-bold text-yellow-800">{playerGold.toLocaleString()} 골드</span>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-4 mb-6 border-b">
        <Button
          variant="ghost"
          className={`pb-3 ${activeTab === 'shop' ? 'border-b-2 border-primary text-primary' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🏪 상점
        </Button>
        <Button
          variant="ghost"
          className={`pb-3 ${activeTab === 'inventory' ? 'border-b-2 border-primary text-primary' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          🎒 인벤토리
        </Button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[500px]">
        {activeTab === 'shop' ? <ShopTab /> : <InventoryTab />}
      </div>
    </div>
  )
}
