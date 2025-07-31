'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Package, Gem, Coins, Star, ChevronRight, Sparkles, MessageCircle } from 'lucide-react'
import { dbHelpers } from '@/lib/database/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Character } from '@/lib/types/game-core'
import type { ShopItem } from '@/lib/shop/types'

// 확장된 ShopItem 타입 (프로모션 등을 위한 추가 속성)
interface ExtendedShopItem extends ShopItem {
  discount?: number
  currency?: 'coins' | 'gems'
  originalPrice?: number
  stock?: number
}

interface ImprovedShopScreenProps {
  shopItems: ShopItem[]
  onPurchase: (item: ShopItem) => void
}

const npcMerchants = [
  {
    id: 'general',
    name: '일반 상인 토비',
    avatar: '🧙‍♂️',
    greeting: '안녕하세요! 모험에 필요한 물품을 준비했어요.',
    category: 'general',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'equipment',
    name: '대장장이 브론',
    avatar: '⚒️',
    greeting: '최고급 장비들을 준비했습니다. 튼튼한 장비로 모험을 준비하세요!',
    category: 'equipment',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'consumable',
    name: '물약상인 엘리나',
    avatar: '🧪',
    greeting: '신선한 물약과 버프 아이템을 판매합니다. 전투에 도움이 될 거예요!',
    category: 'consumable',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'special',
    name: '신비한 상인 루나',
    avatar: '🌙',
    greeting: '특별한 아이템들을 모아왔어요... 흔히 볼 수 없는 것들이죠.',
    category: 'special',
    color: 'from-purple-500 to-pink-500'
  }
]

export function ImprovedShopScreen({ shopItems, onPurchase }: ImprovedShopScreenProps) {
  const { userId } = useAuth()
  const [selectedMerchant, setSelectedMerchant] = useState(npcMerchants[0])
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)

  useEffect(() => {
    if (userId) {
      loadCharacterData()
    }
  }, [userId])

  const loadCharacterData = async () => {
    if (!userId) return
    
    try {
      const profile = await dbHelpers.getProfile(userId)
      if (profile) {
        // Create a Character object from profile data
        const tempCharacter: Character = {
          id: userId,
          name: profile.name,
          level: profile.level,
          experience: profile.experience,
          coreStats: {
            health: 10,
            learning: 10,
            relationship: 10,
            achievement: 10
          },
          combatStats: {
            attack: 10,
            defense: 10,
            hp: 100,
            mp: 50,
            speed: 10,
            accuracy: 10,
            critRate: 5,
            critDamage: 150,
            dodge: 5,
            resistance: 0
          },
          energy: 100,
          maxEnergy: 100,
          gold: 1000,
          gems: 0,
          createdAt: Date.now(),
          lastActiveAt: Date.now()
        }
        setCharacter(tempCharacter)
      }
    } catch (error) {
      console.error('Failed to load character:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = shopItems.filter(item => {
    if (selectedMerchant.category === 'general') {
      return item.category === 'consumable' || item.category === 'misc'
    }
    if (selectedMerchant.category === 'equipment') {
      return item.category === 'weapon' || item.category === 'armor' || item.category === 'accessory'
    }
    if (selectedMerchant.category === 'special') {
      return item.category === 'cosmetic'
    }
    return item.category === selectedMerchant.category
  })

  const canAfford = (item: ShopItem) => {
    if (!character) return false
    return character.gold >= item.price
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'uncommon': return 'from-green-500 to-emerald-500'
      case 'rare': return 'from-blue-500 to-cyan-500'
      case 'epic': return 'from-purple-500 to-pink-500'
      case 'legendary': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRarityStars = (rarity: string) => {
    switch (rarity) {
      case 'common': return 1
      case 'uncommon': return 2
      case 'rare': return 3
      case 'epic': return 4
      case 'legendary': return 5
      default: return 1
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2">
      {/* 상단 정보 바 - 크기 대폭 축소 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-3"
      >
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-2 backdrop-blur-sm border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">마법 상점가</h2>
                <p className="text-[10px] text-white font-semibold">다양한 상인들이 특별한 물품을 판매합니다</p>
              </div>
            </div>
            
            {character && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-white font-bold">{character.gold.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-white font-bold">{character.gems || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* 좌측 상인 목록 - 크기 축소 */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-lg p-2 backdrop-blur-sm border border-gray-700/50"
          >
            <h3 className="text-sm font-bold text-white mb-2">상인 목록</h3>
            <div className="space-y-1">
              {npcMerchants.map((merchant) => (
                <motion.button
                  key={merchant.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMerchant(merchant)
                    setShowDialog(true)
                  }}
                  className={`w-full p-2 rounded-lg transition-all ${
                    selectedMerchant.id === merchant.id
                      ? 'bg-gradient-to-r ' + merchant.color + ' text-white shadow-lg'
                      : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{merchant.avatar}</span>
                    <div className="text-left flex-1">
                      <div className="text-xs font-medium">{merchant.name}</div>
                      <div className="text-[10px] opacity-80 capitalize">{merchant.category}</div>
                    </div>
                    {selectedMerchant.id === merchant.id && (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 우측 상점 콘텐츠 */}
        <div className="lg:col-span-3">
          {/* NPC 대화 - 크기 축소 */}
          <AnimatePresence>
            {showDialog && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3"
              >
                <div className={`relative bg-gradient-to-r ${selectedMerchant.color} p-[1px] rounded-lg`}>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="text-2xl">{selectedMerchant.avatar}</div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-1">{selectedMerchant.name}</h3>
                        <p className="text-xs text-gray-300">{selectedMerchant.greeting}</p>
                      </div>
                      <button
                        onClick={() => setShowDialog(false)}
                        className="text-gray-500 hover:text-gray-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 아이템 그리드 - 간격 축소 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {filteredItems.map((item, index) => {
              const affordable = canAfford(item)
              const rarityGradient = getRarityColor(item.rarity || 'common')
              const stars = getRarityStars(item.rarity || 'common')

              return (
                <motion.div
                  key={item.id}
                  data-testid="shop-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: affordable ? 1.02 : 1 }}
                  className="relative"
                >
                  <div 
                    className={`relative overflow-hidden rounded-lg border transition-all ${
                      affordable 
                        ? 'border-gray-700/50 hover:border-purple-500/50 cursor-pointer' 
                        : 'border-gray-800/50 opacity-60'
                    }`}
                    onClick={() => affordable && setSelectedItem(item)}
                  >
                    {/* 희귀도 배경 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradient} opacity-10`} />
                    
                    {/* 아이템 이미지 영역 - 높이 축소 */}
                    <div className="relative h-20 bg-gray-800/50 flex items-center justify-center">
                      <span className="text-3xl">{item.icon || '📦'}</span>
                      
                      {/* 희귀도 별 */}
                      <div className="absolute top-1 right-1 flex">
                        {[...Array(stars)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>

                      {/* 할인 배지 */}
                      {(item as ExtendedShopItem).discount && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          -{(item as ExtendedShopItem).discount}%
                        </div>
                      )}
                    </div>

                    {/* 아이템 정보 - 패딩 축소 */}
                    <div className="relative p-2.5">
                      <h4 className="font-bold text-sm text-white mb-0.5">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 mb-2 line-clamp-1">{item.description}</p>
                      
                      {/* 가격 - 크기 축소 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {(item as ExtendedShopItem).currency === 'gems' ? (
                            <Gem className="w-3.5 h-3.5 text-purple-500" />
                          ) : (
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                          )}
                          <span className={`text-xs font-bold ${affordable ? 'text-white' : 'text-red-400'}`}>
                            {item.price.toLocaleString()}
                          </span>
                          {(item as ExtendedShopItem).originalPrice && (
                            <span className="text-[10px] text-gray-500 line-through">
                              {(item as ExtendedShopItem).originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {(item as ExtendedShopItem).stock && (
                          <span className="text-[10px] text-gray-400">
                            재고: {(item as ExtendedShopItem).stock}
                          </span>
                        )}
                      </div>

                      {/* 특별 효과 */}
                      {item.effects && (
                        <div className="mt-1 flex items-center gap-0.5 text-[10px] text-purple-400">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>특수 효과</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* 빈 상태 */}
          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">현재 판매 중인 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 아이템 상세 모달 */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="text-6xl">{selectedItem.icon || '📦'}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">{selectedItem.name}</h3>
              <p className="text-gray-400 mb-4">{selectedItem.description}</p>
              
              {selectedItem.effects && (
                <div className="bg-purple-500/10 rounded-lg p-3 mb-4">
                  <div className="text-sm text-purple-300">
                    <strong>효과:</strong> {selectedItem.effects}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {selectedItem.currency === 'gems' ? (
                    <Gem className="w-6 h-6 text-purple-500" />
                  ) : (
                    <Coins className="w-6 h-6 text-yellow-500" />
                  )}
                  <span className="text-2xl font-bold text-white">
                    {selectedItem.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (canAfford(selectedItem)) {
                      onPurchase(selectedItem)
                      setSelectedItem(null)
                      loadCharacterData()
                    }
                  }}
                  disabled={!canAfford(selectedItem)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    canAfford(selectedItem)
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  구매하기
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}