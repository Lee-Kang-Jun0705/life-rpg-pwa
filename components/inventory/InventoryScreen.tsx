'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InventoryGrid } from './InventoryGrid'
import { EquipmentPanel } from './EquipmentPanel'
import { ItemDetailModal } from './ItemDetailModal'
import { InventoryFilters } from './InventoryFilters'
import { inventoryService, type InventoryState } from '@/lib/services/inventory.service'
import { persistenceService } from '@/lib/services/persistence.service'
import type { GeneratedItem, InventoryItem, ItemFilter, ItemSortOption } from '@/lib/types/item-system'
import { 
  Package, 
  Filter, 
  Search, 
  Coins,
  Grid3X3,
  User,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react'

interface InventoryScreenProps {
  onClose?: () => void
}

export function InventoryScreen({ onClose }: InventoryScreenProps) {
  const [inventoryState, setInventoryState] = useState<InventoryState>({
    items: [],
    equipment: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
      accessory3: null
    },
    maxSlots: 50,
    usedSlots: 0
  })
  
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null)
  const [filter, setFilter] = useState<ItemFilter>({})
  const [sortBy, setSortBy] = useState<ItemSortOption>('obtainedAt')
  const [sortAscending, setSortAscending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'inventory' | 'equipment'>('inventory')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // 저장된 데이터 불러오기
    persistenceService.loadInventory('player-1').then(() => {
      loadInventory()
    })
  }, [])

  const loadInventory = () => {
    const state = inventoryService.getInventoryState()
    setInventoryState(state)
  }

  const handleEquipItem = (item: GeneratedItem) => {
    if (inventoryService.equipItem(item.uniqueId)) {
      loadInventory()
      // 자동 저장
      persistenceService.saveInventory('player-1')
    }
  }

  const handleUnequipItem = (slot: string) => {
    if (inventoryService.unequipItem(slot as any)) {
      loadInventory()
      // 자동 저장
      persistenceService.saveInventory('player-1')
    }
  }

  const handleSellSelected = () => {
    const result = inventoryService.sellItems(Array.from(selectedItems))
    if (result.soldCount > 0) {
      setSelectedItems(new Set())
      loadInventory()
      // TODO: 골드 추가 및 알림 표시
      // 자동 저장
      persistenceService.saveInventory('player-1')
    }
  }

  const handleToggleLock = (itemId: string) => {
    if (inventoryService.toggleItemLock(itemId)) {
      loadInventory()
      // 자동 저장
      persistenceService.saveInventory('player-1')
    }
  }

  const handleSelectItem = (item: GeneratedItem, event: React.MouseEvent) => {
    if (event.shiftKey || event.ctrlKey) {
      // 다중 선택
      const newSelection = new Set(selectedItems)
      if (newSelection.has(item.uniqueId)) {
        newSelection.delete(item.uniqueId)
      } else {
        newSelection.add(item.uniqueId)
      }
      setSelectedItems(newSelection)
    } else {
      // 단일 선택
      setSelectedItem(item)
    }
  }

  const handleUseItem = async (item: GeneratedItem) => {
    // 스킬북인 경우
    if (item.type === 'consumable' && item.consumableEffect?.type === 'skill_book') {
      const { skillBookService } = await import('@/lib/services/skillbook.service')
      const result = await skillBookService.useSkillBook(item.uniqueId)
      
      if (result.success) {
        // 성공 알림
        console.log(result.message)
        loadInventory()
        setSelectedItem(null)
        // 자동 저장
        persistenceService.saveInventory('player-1')
      } else {
        // 실패 알림
        console.error(result.message)
      }
    }
    // 다른 소비 아이템 처리는 나중에 추가
  }

  // 필터링 및 정렬된 아이템 목록
  const getFilteredItems = (): InventoryItem[] => {
    let items = inventoryState.items

    // 검색어 필터
    if (searchQuery) {
      items = inventoryService.searchItems(searchQuery)
    }

    // 필터 적용
    items = inventoryService.filterItems(filter)

    // 정렬
    items = inventoryService.sortItems(items, sortBy, sortAscending)

    return items
  }

  const filteredItems = getFilteredItems()
  const totalValue = filteredItems.reduce((sum, item) => sum + item.item.value * item.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  data-testid="close-inventory"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8 text-purple-500" />
                인벤토리
              </h1>
            </div>

            {/* 탭 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'inventory'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid="inventory-tab"
              >
                <Grid3X3 className="w-5 h-5" />
                가방
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'equipment'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid="equipment-tab"
              >
                <User className="w-5 h-5" />
                장비
              </button>
            </div>
          </div>

          {/* 인벤토리 정보 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span data-testid="inventory-slots">
                  {inventoryState.usedSlots} / {inventoryState.maxSlots} 슬롯
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span data-testid="total-value">총 가치: {totalValue.toLocaleString()} 골드</span>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="아이템 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  data-testid="search-input"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                data-testid="toggle-filters"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 패널 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <InventoryFilters
              filter={filter}
              onFilterChange={setFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortAscending={sortAscending}
              onSortAscendingChange={setSortAscending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'inventory' ? (
          <>
            {/* 액션 바 */}
            {selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-gray-800 rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">
                  {selectedItems.size}개 아이템 선택됨
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    선택 해제
                  </button>
                  <button
                    onClick={handleSellSelected}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-1"
                    data-testid="sell-selected"
                  >
                    <Trash2 className="w-4 h-4" />
                    판매
                  </button>
                </div>
              </motion.div>
            )}

            {/* 인벤토리 그리드 */}
            <InventoryGrid
              items={filteredItems}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onEquipItem={handleEquipItem}
              onToggleLock={handleToggleLock}
            />
          </>
        ) : (
          /* 장비 패널 */
          <EquipmentPanel
            equipment={inventoryState.equipment}
            onUnequipItem={handleUnequipItem}
            onSelectItem={setSelectedItem}
          />
        )}
      </div>

      {/* 아이템 상세 모달 */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            equipped={inventoryState.items.find(i => i.item.uniqueId === selectedItem.uniqueId)?.equipped || false}
            locked={inventoryState.items.find(i => i.item.uniqueId === selectedItem.uniqueId)?.locked || false}
            onClose={() => setSelectedItem(null)}
            onEquip={handleEquipItem}
            onUnequip={(slot) => handleUnequipItem(slot)}
            onToggleLock={() => handleToggleLock(selectedItem.uniqueId)}
            onUseItem={handleUseItem}
            currentEquipment={inventoryState.equipment}
          />
        )}
      </AnimatePresence>
    </div>
  )
}