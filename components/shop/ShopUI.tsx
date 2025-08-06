/**
 * ShopUI - 상점 UI 컴포넌트
 * 
 * 코딩 규칙:
 * - any 타입 금지
 * - 하드코딩 금지
 * - 일관된 스타일
 * - 접근성 지원
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Package, Coins, Star, Filter, 
  Search, RefreshCw, X, Check, AlertCircle,
  Sword, Shield, Gem, Potion, Book, ChevronRight
} from 'lucide-react'
import { shopManager, type ShopItem, type ItemRarity, type ItemType } from '@/lib/services/shop-manager'
import { inventoryManager } from '@/lib/services/inventory-manager'
import { soundManager } from '@/lib/services/sound-manager'
import { UI_CONSTANTS } from '@/lib/config/game-constants'

// 상점 UI Props
interface ShopUIProps {
  shopType?: 'general' | 'special' | 'premium'
  onClose?: () => void
}

// 아이템 카드 Props
interface ItemCardProps {
  item: ShopItem
  onBuy: (item: ShopItem) => void
  onSell?: (item: ShopItem) => void
  playerGold: number
  owned: number
  mode: 'buy' | 'sell'
}

// 필터 옵션
interface FilterOptions {
  types: ItemType[]
  rarities: ItemRarity[]
  minLevel: number
  maxLevel: number
  searchQuery: string
  sortBy: 'name' | 'price' | 'level' | 'rarity'
  sortOrder: 'asc' | 'desc'
}

// 트랜잭션 모달 Props
interface TransactionModalProps {
  isOpen: boolean
  item: ShopItem | null
  mode: 'buy' | 'sell'
  maxQuantity: number
  onConfirm: (quantity: number) => void
  onCancel: () => void
}

// 설정 상수
const CONFIG = {
  ITEMS_PER_PAGE: 12,
  REFRESH_COOLDOWN: 60 * 60 * 1000, // 1시간
  ANIMATION_DURATION: UI_CONSTANTS.ANIMATION_DURATION.NORMAL,
  SPECIAL_SHOP_UNLOCK_LEVEL: 10,
  PREMIUM_SHOP_UNLOCK_LEVEL: 20,
  SELL_PRICE_RATIO: 0.5, // 판매가 = 구매가의 50%
  BULK_DISCOUNT_THRESHOLD: 10, // 10개 이상 구매 시 할인
  BULK_DISCOUNT_RATE: 0.1 // 10% 할인
} as const

// 아이템 타입 아이콘
const TYPE_ICONS: Record<ItemType, React.ReactNode> = {
  weapon: <Sword className="w-4 h-4" />,
  armor: <Shield className="w-4 h-4" />,
  accessory: <Gem className="w-4 h-4" />,
  consumable: <Potion className="w-4 h-4" />,
  material: <Package className="w-4 h-4" />,
  skillbook: <Book className="w-4 h-4" />,
  misc: <Package className="w-4 h-4" />
}

// 희귀도 색상
const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-gray-400 bg-gray-400/10',
  uncommon: 'border-green-400 bg-green-400/10',
  rare: 'border-blue-400 bg-blue-400/10',
  epic: 'border-purple-400 bg-purple-400/10',
  legendary: 'border-yellow-400 bg-yellow-400/10'
}

export default function ShopUI({ shopType = 'general', onClose }: ShopUIProps) {
  // 상태
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [items, setItems] = useState<ShopItem[]>([])
  const [playerGold, setPlayerGold] = useState(0)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    rarities: [],
    minLevel: 1,
    maxLevel: 100,
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(0)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  // 상점 초기화
  useEffect(() => {
    const loadShopData = async () => {
      const shopItems = mode === 'buy' 
        ? shopManager.getAvailableItems(shopType)
        : shopManager.getSellableItems()
      
      setItems(shopItems)
      setPlayerGold(shopManager.getPlayerGold())
      
      // 새로고침 쿨다운 확인
      const lastRefresh = shopManager.getLastRefreshTime()
      const cooldownRemaining = Math.max(0, CONFIG.REFRESH_COOLDOWN - (Date.now() - lastRefresh))
      setRefreshCooldown(cooldownRemaining)
    }

    loadShopData()
    // 상점 BGM은 일시적으로 비활성화 (던전에서만 사운드 재생)
    // soundManager.playBGM('shop')

    return () => {
      // soundManager.stopBGM()
    }
  }, [shopType, mode])

  // 쿨다운 타이머
  useEffect(() => {
    if (refreshCooldown <= 0) return

    const timer = setInterval(() => {
      setRefreshCooldown(prev => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [refreshCooldown])

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // 타입 필터
    if (filters.types.length > 0) {
      filtered = filtered.filter(item => filters.types.includes(item.type))
    }

    // 희귀도 필터
    if (filters.rarities.length > 0) {
      filtered = filtered.filter(item => filters.rarities.includes(item.rarity))
    }

    // 레벨 필터
    filtered = filtered.filter(item => 
      item.level >= filters.minLevel && item.level <= filters.maxLevel
    )

    // 검색어 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (filters.sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'price':
          compareValue = a.price - b.price
          break
        case 'level':
          compareValue = a.level - b.level
          break
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary']
          compareValue = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
          break
      }

      return filters.sortOrder === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [items, filters])

  // 아이템 구매
  const handleBuy = useCallback(async (item: ShopItem, quantity: number) => {
    soundManager.playSFX('button_click')
    
    const result = await shopManager.buyItem(item.id, quantity)
    
    if (result.success) {
      soundManager.playSFX('coin')
      setPlayerGold(shopManager.getPlayerGold())
      showNotification('success', `${item.name} x${quantity} 구매 완료!`)
      
      // 구매 후 상점 목록 갱신
      setItems(shopManager.getAvailableItems(shopType))
    } else {
      soundManager.playSFX('error')
      showNotification('error', result.error || '구매 실패')
    }
    
    setShowTransactionModal(false)
    setSelectedItem(null)
  }, [shopType])

  // 아이템 판매
  const handleSell = useCallback(async (item: ShopItem, quantity: number) => {
    soundManager.playSFX('button_click')
    
    const result = await shopManager.sellItem(item.id, quantity)
    
    if (result.success) {
      soundManager.playSFX('coin')
      setPlayerGold(shopManager.getPlayerGold())
      showNotification('success', `${item.name} x${quantity} 판매 완료! (+${result.goldEarned}G)`)
      
      // 판매 후 목록 갱신
      setItems(shopManager.getSellableItems())
    } else {
      soundManager.playSFX('error')
      showNotification('error', result.error || '판매 실패')
    }
    
    setShowTransactionModal(false)
    setSelectedItem(null)
  }, [])

  // 상점 새로고침
  const handleRefresh = useCallback(async () => {
    if (refreshCooldown > 0) {
      showNotification('info', `새로고침 쿨다운: ${Math.ceil(refreshCooldown / 60000)}분`)
      return
    }

    soundManager.playSFX('button_click')
    
    const success = await shopManager.refreshShop()
    if (success) {
      setItems(shopManager.getAvailableItems(shopType))
      setRefreshCooldown(CONFIG.REFRESH_COOLDOWN)
      showNotification('success', '상점이 새로고침되었습니다!')
    }
  }, [refreshCooldown, shopType])

  // 알림 표시
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // 모드 전환
  const toggleMode = useCallback(() => {
    const newMode = mode === 'buy' ? 'sell' : 'buy'
    setMode(newMode)
    soundManager.playSFX('button_click')
  }, [mode])

  // 아이템 소유 수량 확인
  const getOwnedQuantity = useCallback((itemId: string) => {
    return inventoryManager.getItemQuantity(itemId)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 z-50">
      {/* 헤더 */}
      <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShoppingCart className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">
            {shopType === 'special' ? '특별 상점' : 
             shopType === 'premium' ? '프리미엄 상점' : '일반 상점'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* 골드 표시 */}
          <div className="flex items-center gap-2 bg-yellow-900/50 px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{playerGold.toLocaleString()}</span>
          </div>

          {/* 닫기 버튼 */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* 모드 전환 및 필터 */}
      <div className="p-4 flex items-center justify-between">
        {/* 모드 전환 탭 */}
        <div className="flex bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => mode !== 'buy' && toggleMode()}
            className={`px-6 py-2 rounded-md font-bold transition-colors ${
              mode === 'buy' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            구매
          </button>
          <button
            onClick={() => mode !== 'sell' && toggleMode()}
            className={`px-6 py-2 rounded-md font-bold transition-colors ${
              mode === 'sell' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            판매
          </button>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="아이템 검색..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 필터 토글 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5 text-white" />
          </button>

          {/* 새로고침 (구매 모드만) */}
          {mode === 'buy' && (
            <button
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              className={`p-2 rounded-lg transition-colors ${
                refreshCooldown > 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
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
            <div className="p-4 bg-black/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 타입 필터 */}
                <div>
                  <h3 className="text-white font-bold mb-2">타입</h3>
                  <div className="space-y-1">
                    {(['weapon', 'armor', 'accessory', 'consumable', 'material', 'skillbook'] as ItemType[]).map(type => (
                      <label key={type} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.types.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, types: [...prev.types, type] }))
                            } else {
                              setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }))
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 희귀도 필터 */}
                <div>
                  <h3 className="text-white font-bold mb-2">희귀도</h3>
                  <div className="space-y-1">
                    {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as ItemRarity[]).map(rarity => (
                      <label key={rarity} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.rarities.includes(rarity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, rarities: [...prev.rarities, rarity] }))
                            } else {
                              setFilters(prev => ({ ...prev, rarities: prev.rarities.filter(r => r !== rarity) }))
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="capitalize">{rarity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 레벨 범위 */}
                <div>
                  <h3 className="text-white font-bold mb-2">레벨</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="최소"
                      value={filters.minLevel}
                      onChange={(e) => setFilters(prev => ({ ...prev, minLevel: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-1 bg-gray-800 rounded text-white"
                    />
                    <input
                      type="number"
                      placeholder="최대"
                      value={filters.maxLevel}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxLevel: parseInt(e.target.value) || 100 }))}
                      className="w-full px-3 py-1 bg-gray-800 rounded text-white"
                    />
                  </div>
                </div>

                {/* 정렬 옵션 */}
                <div>
                  <h3 className="text-white font-bold mb-2">정렬</h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-1 bg-gray-800 rounded text-white mb-2"
                  >
                    <option value="name">이름</option>
                    <option value="price">가격</option>
                    <option value="level">레벨</option>
                    <option value="rarity">희귀도</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                    className="w-full px-3 py-1 bg-gray-800 rounded text-white"
                  >
                    <option value="asc">오름차순</option>
                    <option value="desc">내림차순</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 아이템 그리드 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            {mode === 'buy' ? '판매 중인 아이템이 없습니다.' : '판매할 수 있는 아이템이 없습니다.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onBuy={() => {
                  setSelectedItem(item)
                  setShowTransactionModal(true)
                }}
                onSell={() => {
                  setSelectedItem(item)
                  setShowTransactionModal(true)
                }}
                playerGold={playerGold}
                owned={getOwnedQuantity(item.id)}
                mode={mode}
              />
            ))}
          </div>
        )}
      </div>

      {/* 트랜잭션 모달 */}
      <TransactionModal
        isOpen={showTransactionModal}
        item={selectedItem}
        mode={mode}
        maxQuantity={mode === 'buy' 
          ? Math.floor(playerGold / (selectedItem?.price || 1))
          : getOwnedQuantity(selectedItem?.id || '')
        }
        onConfirm={(quantity) => {
          if (selectedItem) {
            if (mode === 'buy') {
              handleBuy(selectedItem, quantity)
            } else {
              handleSell(selectedItem, quantity)
            }
          }
        }}
        onCancel={() => {
          setShowTransactionModal(false)
          setSelectedItem(null)
        }}
      />

      {/* 알림 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-600' :
              notification.type === 'error' ? 'bg-red-600' :
              'bg-blue-600'
            } text-white font-bold flex items-center gap-2`}
          >
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <X className="w-5 h-5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 아이템 카드 컴포넌트
function ItemCard({ item, onBuy, onSell, playerGold, owned, mode }: ItemCardProps) {
  const canAfford = playerGold >= item.price
  const isOwned = owned > 0
  const sellPrice = Math.floor(item.price * CONFIG.SELL_PRICE_RATIO)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border-2 ${
        RARITY_COLORS[item.rarity]
      } hover:shadow-lg transition-all cursor-pointer`}
      onClick={() => mode === 'buy' ? onBuy(item) : onSell?.(item)}
    >
      {/* 아이템 아이콘 */}
      <div className="flex items-center justify-center h-20 mb-2">
        <div className="text-4xl">
          {TYPE_ICONS[item.type] || '📦'}
        </div>
      </div>

      {/* 아이템 정보 */}
      <h3 className="text-white font-bold text-sm mb-1 truncate">{item.name}</h3>
      <p className="text-gray-400 text-xs mb-2">Lv.{item.level}</p>

      {/* 가격 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className={`font-bold ${
            mode === 'buy' 
              ? canAfford ? 'text-yellow-400' : 'text-red-400'
              : 'text-yellow-400'
          }`}>
            {mode === 'buy' ? item.price.toLocaleString() : sellPrice.toLocaleString()}
          </span>
        </div>

        {/* 소유 수량 */}
        {isOwned && (
          <span className="text-gray-400 text-xs">
            보유: {owned}
          </span>
        )}
      </div>

      {/* 판매 불가 표시 */}
      {mode === 'sell' && !isOwned && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
          <span className="text-gray-500 font-bold">미보유</span>
        </div>
      )}

      {/* 구매 불가 표시 */}
      {mode === 'buy' && !canAfford && (
        <div className="absolute top-2 right-2">
          <span className="text-red-400 text-xs font-bold">골드 부족</span>
        </div>
      )}
    </motion.div>
  )
}

// 트랜잭션 모달 컴포넌트
function TransactionModal({ 
  isOpen, 
  item, 
  mode, 
  maxQuantity, 
  onConfirm, 
  onCancel 
}: TransactionModalProps) {
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  const totalPrice = mode === 'buy' 
    ? item.price * quantity
    : Math.floor(item.price * CONFIG.SELL_PRICE_RATIO) * quantity

  const bulkDiscount = mode === 'buy' && quantity >= CONFIG.BULK_DISCOUNT_THRESHOLD
    ? Math.floor(totalPrice * CONFIG.BULK_DISCOUNT_RATE)
    : 0

  const finalPrice = totalPrice - bulkDiscount

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {mode === 'buy' ? '아이템 구매' : '아이템 판매'}
            </h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 아이템 정보 */}
          <div className={`bg-gray-800/50 rounded-xl p-4 mb-4 border-2 ${RARITY_COLORS[item.rarity]}`}>
            <div className="flex items-start gap-4">
              <div className="text-3xl">
                {TYPE_ICONS[item.type] || '📦'}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">{item.name}</h3>
                <p className="text-gray-400 text-sm">Lv.{item.level} • {item.rarity}</p>
                <p className="text-gray-300 text-sm mt-1">{item.description}</p>
              </div>
            </div>
          </div>

          {/* 수량 선택 */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-2 block">수량</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white rotate-180" />
              </button>
              
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, Math.min(maxQuantity, val)))
                }}
                className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <button
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={() => setQuantity(maxQuantity)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white text-sm"
              >
                MAX
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1 text-center">
              최대: {maxQuantity}개
            </p>
          </div>

          {/* 가격 정보 */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-1">
            <div className="flex justify-between text-gray-300">
              <span>단가</span>
              <span>{mode === 'buy' ? item.price.toLocaleString() : Math.floor(item.price * CONFIG.SELL_PRICE_RATIO).toLocaleString()}G</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>수량</span>
              <span>x{quantity}</span>
            </div>
            {bulkDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>대량 구매 할인</span>
                <span>-{bulkDiscount.toLocaleString()}G</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-1 flex justify-between text-white font-bold">
              <span>총 {mode === 'buy' ? '구매가' : '판매가'}</span>
              <span className="text-yellow-400">{finalPrice.toLocaleString()}G</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => onConfirm(quantity)}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white transition-colors"
            >
              {mode === 'buy' ? '구매' : '판매'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}