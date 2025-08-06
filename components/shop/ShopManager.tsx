'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Store, Coins, Search, Filter, Package, X, ShoppingCart, DollarSign } from 'lucide-react'
import { JRPGShopManager } from '@/lib/jrpg/shop-manager'
import { SHOP_DATABASE, SHOP_CATEGORIES, SPECIAL_ITEMS } from '@/lib/jrpg/shop-database'
import { ITEM_DATABASE } from '@/lib/jrpg/items-database'
import { JRPGItemCard, JRPGItemDetails } from '@/components/inventory/JRPGItemCard'
import { ItemRarityBadge } from '@/components/inventory/ItemRarityBadge'
import { jrpgDbHelpers } from '@/lib/jrpg/database-helpers'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { useUserStore } from '@/lib/stores/userStore'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { cn } from '@/lib/utils'
import { soundManager } from '@/lib/jrpg/sound-system'
import type { Shop, ShopItem } from '@/lib/jrpg/shop-database'
import type { ItemInstance, ItemDefinition } from '@/lib/jrpg/types'

// 상점 탭 컴포넌트
function ShopTab({ 
  shop, 
  isActive, 
  onClick,
  isLocked = false
}: { 
  shop: Shop
  isActive: boolean
  onClick: () => void
  isLocked?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        isActive
          ? "bg-gradient-to-br from-purple-600 to-pink-600 border-white text-white"
          : isLocked
          ? "bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed"
          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-400"
      )}
    >
      <div className="text-3xl mb-2">{shop.icon}</div>
      <h3 className="font-bold">{shop.name}</h3>
      <p className="text-xs mt-1">{shop.description}</p>
      {isLocked && (
        <p className="text-xs text-red-400 mt-2">Lv.{shop.levelRequirement} 필요</p>
      )}
    </button>
  )
}

// 상점 아이템 카드
function ShopItemCard({
  item,
  shopItem,
  onPurchase,
  canAfford,
  playerLevel
}: {
  item: ItemDefinition
  shopItem: ShopItem & { currentStock: number; finalPrice: number }
  onPurchase: () => void
  canAfford: boolean
  playerLevel: number
}) {
  const isLocked = playerLevel < shopItem.levelRequirement
  const isOutOfStock = shopItem.currentStock === 0
  const canPurchase = canAfford && !isLocked && !isOutOfStock
  
  return (
    <motion.div
      whileHover={{ scale: canPurchase ? 1.02 : 1 }}
      whileTap={{ scale: canPurchase ? 0.98 : 1 }}
      className={cn(
        "bg-gray-800 rounded-lg p-4 border-2",
        canPurchase
          ? "border-gray-600 hover:border-purple-400 cursor-pointer"
          : "border-gray-700 opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-4">
        <JRPGItemCard 
          item={{
            id: shopItem.itemId,
            itemId: shopItem.itemId,
            rarity: item.rarity,
            quantity: 1
          }} 
          size="medium" 
        />
        
        <div className="flex-1">
          <h4 className="font-bold text-white">{item.name}</h4>
          <p className="text-xs text-gray-400 mb-2">{item.description}</p>
          
          {/* 가격 */}
          <div className="flex items-center gap-2 mb-2">
            <Coins className={cn(
              "w-4 h-4",
              canAfford ? "text-yellow-400" : "text-red-400"
            )} />
            <span className={cn(
              "font-bold",
              canAfford ? "text-white" : "text-red-400"
            )}>
              {shopItem.finalPrice.toLocaleString()}
            </span>
            {shopItem.finalPrice < shopItem.price && (
              <span className="text-xs text-gray-500 line-through">
                {shopItem.price.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* 재고 */}
          {shopItem.stock !== -1 && (
            <div className="text-xs text-gray-400">
              재고: {shopItem.currentStock}/{shopItem.stock}
            </div>
          )}
          
          {/* 레벨 제한 */}
          {isLocked && (
            <div className="text-xs text-red-400 mt-1">
              Lv.{shopItem.levelRequirement} 필요
            </div>
          )}
          
          {/* 구매 버튼 */}
          <button
            onClick={onPurchase}
            disabled={!canPurchase}
            className={cn(
              "mt-3 px-4 py-1 rounded text-sm font-bold transition-colors",
              canPurchase
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-700 text-gray-500"
            )}
          >
            {isOutOfStock ? '품절' : isLocked ? '레벨 부족' : !canAfford ? '골드 부족' : '구매'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// 판매 탭
function SellTab({ userId, onSell }: { userId: string; onSell: (goldEarned: number) => void }) {
  const [inventory, setInventory] = useState<ItemInstance[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemInstance | null>(null)
  const [sellQuantity, setSellQuantity] = useState(1)
  
  useEffect(() => {
    const loadInventory = async () => {
      const inv = await jrpgDbHelpers.getJRPGInventory(userId)
      if (inv) {
        // 판매 가능한 아이템만 (장착하지 않은 것)
        setInventory(inv.items.filter(item => !item.equippedBy))
      }
    }
    loadInventory()
  }, [userId])
  
  const handleSell = async () => {
    if (!selectedItem) return
    
    const shopManager = new JRPGShopManager(userId, 1)
    const result = await shopManager.sellItem(selectedItem.id, sellQuantity)
    
    if (result.success) {
      soundManager.playSFX('gold_get')
      onSell(result.goldEarned)
      // 인벤토리 새로고침
      const inv = await jrpgDbHelpers.getJRPGInventory(userId)
      if (inv) {
        setInventory(inv.items.filter(item => !item.equippedBy))
      }
      setSelectedItem(null)
      setSellQuantity(1)
    }
    
    alert(result.message)
  }
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 인벤토리 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">인벤토리</h3>
        <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
          {inventory.map(item => (
            <JRPGItemCard
              key={item.id}
              item={item}
              selected={selectedItem?.id === item.id}
              onClick={() => {
                setSelectedItem(item)
                setSellQuantity(1)
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 판매 정보 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">판매</h3>
        {selectedItem ? (
          <>
            <JRPGItemDetails item={selectedItem} />
            
            {/* 수량 선택 */}
            {selectedItem.quantity > 1 && (
              <div className="mt-4">
                <label className="text-sm text-gray-400">수량</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            )}
            
            {/* 판매 가격 */}
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">판매 가격</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-lg font-bold text-white">
                    {(() => {
                      const itemDef = ITEM_DATABASE[selectedItem.itemId] || SPECIAL_ITEMS[selectedItem.itemId]
                      if (!itemDef) return 0
                      let price = itemDef.sellPrice || 10
                      if (selectedItem.enhancement) {
                        price = Math.floor(price * (1 + selectedItem.enhancement * 0.1))
                      }
                      return (price * sellQuantity).toLocaleString()
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSell}
              className="w-full mt-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold"
            >
              판매하기
            </button>
          </>
        ) : (
          <p className="text-gray-400 text-center py-8">
            판매할 아이템을 선택하세요
          </p>
        )}
      </div>
    </div>
  )
}

export function ShopManager() {
  const user = useUserStore(state => state.user)
  const userId = user?.id || GAME_CONFIG.DEFAULT_USER_ID
  const { addCoins } = useUserStore()
  
  const [shopManager, setShopManager] = useState<JRPGShopManager | null>(null)
  const [characterLevel, setCharacterLevel] = useState(1)
  const [activeShop, setActiveShop] = useState<Shop | null>(null)
  const [shopItems, setShopItems] = useState<Array<ShopItem & { currentStock: number; finalPrice: number }>>([])
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // 캐릭터 레벨 및 상점 매니저 초기화
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        // 레벨 계산
        const stats = await dbHelpers.getStats(userId)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
          
          // 상점 매니저 초기화
          const manager = new JRPGShopManager(userId, level)
          await manager.loadShopData()
          setShopManager(manager)
          
          // 첫 번째 상점 선택
          const shops = manager.getAvailableShops()
          if (shops.length > 0) {
            setActiveShop(shops[0])
          }
        }
      } catch (error) {
        console.error('Failed to initialize shop:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
  }, [userId])
  
  // 상점 아이템 로드
  useEffect(() => {
    if (shopManager && activeShop) {
      const items = shopManager.getShopItems(activeShop.id)
      setShopItems(items)
    }
  }, [shopManager, activeShop])
  
  // 아이템 구매
  const handlePurchase = async (shopItem: ShopItem & { currentStock: number; finalPrice: number }) => {
    if (!shopManager || !activeShop || !user) return
    
    // 골드 확인
    if (user.coins < shopItem.finalPrice) {
      soundManager.playSFX('menu_cancel')
      alert('골드가 부족합니다!')
      return
    }
    
    // 구매 처리
    const result = await shopManager.purchaseItem(activeShop.id, shopItem.itemId, 1)
    
    if (result.success) {
      soundManager.playSFX('item_get')
      // 골드 차감
      addCoins(-shopItem.finalPrice)
      
      // 상점 아이템 새로고침
      const items = shopManager.getShopItems(activeShop.id)
      setShopItems(items)
      
      alert(result.message)
    } else {
      soundManager.playSFX('menu_cancel')
      alert(result.message)
    }
  }
  
  // 필터링된 아이템
  const filteredItems = shopItems.filter(shopItem => {
    const itemDef = ITEM_DATABASE[shopItem.itemId] || SPECIAL_ITEMS[shopItem.itemId]
    if (!itemDef) return false
    
    // 카테고리 필터
    if (categoryFilter !== 'all' && shopItem.category !== categoryFilter) return false
    
    // 검색 필터
    if (searchTerm && !itemDef.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })
  
  if (isLoading || !shopManager) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  const availableShops = shopManager.getAvailableShops()
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-purple-400" />
          상점
        </h2>
        <div className="flex items-center gap-4">
          {/* 탭 전환 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={cn(
                "px-4 py-2 rounded font-medium transition-colors",
                activeTab === 'buy'
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              구매
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={cn(
                "px-4 py-2 rounded font-medium transition-colors",
                activeTab === 'sell'
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              판매
            </button>
          </div>
          
          {/* 골드 표시 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-bold text-white">{user?.coins.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>
      
      {activeTab === 'buy' ? (
        <>
          {/* 상점 선택 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.values(SHOP_DATABASE).map(shop => {
              const isAvailable = availableShops.some(s => s.id === shop.id)
              return (
                <ShopTab
                  key={shop.id}
                  shop={shop}
                  isActive={activeShop?.id === shop.id}
                  onClick={() => isAvailable && setActiveShop(shop)}
                  isLocked={!isAvailable}
                />
              )
            })}
          </div>
          
          {activeShop && (
            <>
              {/* 필터 */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex gap-2 flex-1">
                  {SHOP_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setCategoryFilter(category.id)}
                      className={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        categoryFilter === category.id
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      )}
                    >
                      {category.icon} {category.label}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="아이템 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              {/* 아이템 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map(shopItem => {
                  const itemDef = ITEM_DATABASE[shopItem.itemId] || SPECIAL_ITEMS[shopItem.itemId]
                  if (!itemDef) return null
                  
                  return (
                    <ShopItemCard
                      key={shopItem.itemId}
                      item={itemDef}
                      shopItem={shopItem}
                      onPurchase={() => handlePurchase(shopItem)}
                      canAfford={user ? user.coins >= shopItem.finalPrice : false}
                      playerLevel={characterLevel}
                    />
                  )
                })}
              </div>
              
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">조건에 맞는 아이템이 없습니다</p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <SellTab 
          userId={userId} 
          onSell={(goldEarned) => {
            addCoins(goldEarned)
          }} 
        />
      )}
    </div>
  )
}