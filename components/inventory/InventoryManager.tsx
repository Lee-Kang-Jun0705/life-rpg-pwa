'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { InventoryDisplay } from './InventoryDisplay'
import { inventoryService } from '@/lib/services/inventory-service'
import type { InventorySlot, Item, ItemRarity, EquipmentSlot } from '@/lib/types/inventory'
import { isEquipmentItem, isConsumableItem } from '@/lib/types/inventory'
import { Package, Filter, Sword, Shield, Gem, Potion, HelpCircle } from 'lucide-react'

interface InventoryManagerProps {
  userId: string
  onClose?: () => void
}

export function InventoryManager({ userId, onClose }: InventoryManagerProps) {
  const [selectedSlot, setSelectedSlot] = useState<InventorySlot | null>(null)
  const [filterType, setFilterType] = useState<Item['type'] | null>(null)
  const [filterRarity, setFilterRarity] = useState<ItemRarity | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'sell' | 'use' | null>(null)
  
  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((slot: InventorySlot) => {
    setSelectedSlot(slot)
  }, [])
  
  // 아이템 사용
  const handleUseItem = useCallback(() => {
    if (!selectedSlot || !selectedSlot.item) return
    
    if (isConsumableItem(selectedSlot.item)) {
      setConfirmAction('use')
      setShowConfirm(true)
    }
  }, [selectedSlot])
  
  // 아이템 판매
  const handleSellItem = useCallback(() => {
    if (!selectedSlot || !selectedSlot.item) return
    
    setConfirmAction('sell')
    setShowConfirm(true)
  }, [selectedSlot])
  
  // 확인 처리
  const handleConfirm = useCallback(() => {
    if (!selectedSlot || !confirmAction) return
    
    if (confirmAction === 'sell') {
      const success = inventoryService.sellItem(userId, selectedSlot.slotId, 1)
      if (success) {
        setSelectedSlot(null)
      }
    } else if (confirmAction === 'use') {
      const success = inventoryService.useItem(userId, selectedSlot.slotId)
      if (success) {
        setSelectedSlot(null)
      }
    }
    
    setShowConfirm(false)
    setConfirmAction(null)
  }, [userId, selectedSlot, confirmAction])
  
  // 장비 장착
  const handleEquipItem = useCallback((targetSlot: EquipmentSlot) => {
    if (!selectedSlot || !selectedSlot.item) return
    
    const success = inventoryService.equipItem(userId, selectedSlot.slotId, targetSlot)
    if (success) {
      setSelectedSlot(null)
    }
  }, [userId, selectedSlot])
  
  // 필터 객체 생성
  const filter = {
    type: filterType || undefined,
    rarity: filterRarity || undefined,
    searchText: searchText || undefined
  }
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          인벤토리
        </h2>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            닫기
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 인벤토리 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>보유 아이템</CardTitle>
              
              {/* 필터 옵션 */}
              <div className="mt-4 space-y-3">
                {/* 타입 필터 */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={filterType === null ? "default" : "outline"}
                    onClick={() => setFilterType(null)}
                  >
                    전체
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'equipment' ? "default" : "outline"}
                    onClick={() => setFilterType('equipment')}
                  >
                    <Sword className="w-4 h-4 mr-1" />
                    장비
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'consumable' ? "default" : "outline"}
                    onClick={() => setFilterType('consumable')}
                  >
                    <Potion className="w-4 h-4 mr-1" />
                    소비
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'material' ? "default" : "outline"}
                    onClick={() => setFilterType('material')}
                  >
                    <Gem className="w-4 h-4 mr-1" />
                    재료
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === 'misc' ? "default" : "outline"}
                    onClick={() => setFilterType('misc')}
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    기타
                  </Button>
                </div>
                
                {/* 검색 */}
                <input
                  type="text"
                  placeholder="아이템 검색..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border
                           border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800
                           focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <InventoryDisplay
                userId={userId}
                onItemClick={handleItemClick}
                selectedSlotId={selectedSlot?.slotId}
                filter={filter}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* 사이드바 - 아이템 상세 정보 */}
        <div className="space-y-4">
          {/* 선택된 아이템 정보 */}
          {selectedSlot && selectedSlot.item ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">아이템 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 아이템 아이콘과 이름 */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-3xl">
                      {selectedSlot.item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedSlot.item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSlot.item.type} • {selectedSlot.item.rarity}
                      </p>
                    </div>
                  </div>
                  
                  {/* 설명 */}
                  <p className="text-sm">{selectedSlot.item.description}</p>
                  
                  {/* 장비 스탯 */}
                  {isEquipmentItem(selectedSlot.item) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">능력치</h4>
                      <div className="space-y-1">
                        {Object.entries(selectedSlot.item.stats).map(([stat, value]) => (
                          <div key={stat} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{stat}</span>
                            <span className="text-green-500">+{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 아이템 정보 */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">필요 레벨</span>
                      <span>{selectedSlot.item.levelRequirement}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">판매 가격</span>
                      <span className="text-yellow-500">{selectedSlot.item.sellPrice} 골드</span>
                    </div>
                    {selectedSlot.quantity > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">보유 수량</span>
                        <span>{selectedSlot.quantity}개</span>
                      </div>
                    )}
                    {selectedSlot.enhancement > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">강화</span>
                        <span className="text-yellow-500">+{selectedSlot.enhancement}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 액션 버튼 */}
                  <div className="space-y-2">
                    {isConsumableItem(selectedSlot.item) && (
                      <Button
                        onClick={handleUseItem}
                        className="w-full"
                        size="sm"
                      >
                        사용하기
                      </Button>
                    )}
                    
                    {isEquipmentItem(selectedSlot.item) && (
                      <Button
                        onClick={() => handleEquipItem(selectedSlot.item.slot)}
                        className="w-full"
                        size="sm"
                      >
                        장착하기
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleSellItem}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      판매 ({selectedSlot.item.sellPrice} 골드)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>아이템을 선택하세요</p>
              </CardContent>
            </Card>
          )}
          
          {/* 도움말 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">도움말</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>• 아이템을 클릭하여 상세 정보를 확인하세요</p>
              <p>• 소비 아이템은 사용할 수 있습니다</p>
              <p>• 장비 아이템은 장착할 수 있습니다</p>
              <p>• 필요 없는 아이템은 판매할 수 있습니다</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 확인 모달 */}
      {showConfirm && selectedSlot && selectedSlot.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              {confirmAction === 'sell' ? '아이템 판매' : '아이템 사용'}
            </h3>
            <p className="mb-6">
              {confirmAction === 'sell'
                ? `${selectedSlot.item.name}을(를) ${selectedSlot.item.sellPrice} 골드에 판매하시겠습니까?`
                : `${selectedSlot.item.name}을(를) 사용하시겠습니까?`}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirm}
                className="flex-1"
                size="sm"
              >
                확인
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmAction(null)
                }}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                취소
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}