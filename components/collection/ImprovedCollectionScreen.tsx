'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Search, Filter, Grid3X3, List, Star, Lock, Trophy, Sparkles, ChevronRight } from 'lucide-react'
import { EQUIPMENT_DATA } from '@/lib/equipment/equipment-data'
import type { Equipment } from '@/lib/types/equipment'

interface CollectionCategory {
  id: string
  name: string
  icon: string
  count: number
  total: number
  color: string
}

export function ImprovedCollectionScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyCollected, setShowOnlyCollected] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)

  // 임시 수집 데이터 (실제로는 DB에서 가져와야 함)
  const [collectedItems] = useState<Set<string>>(new Set([
    'iron-sword', 'leather-armor', 'leather-cap', 'wooden-shield',
    'steel-sword', 'chainmail', 'iron-helmet', 'steel-shield'
  ]))

  const categories: CollectionCategory[] = [
    { id: 'all', name: '전체', icon: '📚', count: collectedItems.size, total: EQUIPMENT_DATA.length, color: 'from-purple-500 to-pink-500' },
    { id: 'weapon', name: '무기', icon: '⚔️', count: 8, total: 50, color: 'from-red-500 to-orange-500' },
    { id: 'armor', name: '방어구', icon: '🛡️', count: 6, total: 40, color: 'from-blue-500 to-cyan-500' },
    { id: 'accessory', name: '액세서리', icon: '💎', count: 4, total: 30, color: 'from-green-500 to-emerald-500' },
    { id: 'consumable', name: '소모품', icon: '🧪', count: 12, total: 25, color: 'from-yellow-500 to-amber-500' },
    { id: 'special', name: '특별', icon: '⭐', count: 2, total: 15, color: 'from-purple-500 to-indigo-500' },
  ]

  const filteredItems = EQUIPMENT_DATA.filter(item => {
    if (selectedCategory !== 'all' && item.type !== selectedCategory) return false
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (showOnlyCollected && !collectedItems.has(item.id)) return false
    return true
  })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'uncommon': return 'from-green-500 to-emerald-500'
      case 'rare': return 'from-blue-500 to-cyan-500'
      case 'epic': return 'from-purple-500 to-pink-500'
      case 'legendary': return 'from-yellow-500 to-orange-500'
      case 'mythic': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCompletionPercentage = (category: CollectionCategory) => {
    return Math.round((category.count / category.total) * 100)
  }

  return (
    <div className="min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Book className="w-8 h-8 text-purple-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">컬렉션</h1>
            <p className="text-gray-400">수집한 아이템과 업적을 확인하세요</p>
          </div>
          
          {/* 전체 진행도 */}
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{collectedItems.size} / {EQUIPMENT_DATA.length}</div>
            <div className="text-sm text-gray-400">전체 수집률 {Math.round((collectedItems.size / EQUIPMENT_DATA.length) * 100)}%</div>
          </div>
        </div>

        {/* 카테고리 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative overflow-hidden rounded-xl p-4 transition-all ${
                selectedCategory === category.id 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20`} />
              <div className="relative z-10">
                <div className="text-3xl mb-2">{category.icon}</div>
                <div className="font-medium text-white">{category.name}</div>
                <div className="text-xs text-gray-400 mt-1">{category.count}/{category.total}</div>
                
                {/* 진행도 바 */}
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full bg-gradient-to-r ${category.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getCompletionPercentage(category)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="아이템 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnlyCollected(!showOnlyCollected)}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                showOnlyCollected
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              수집한 것만
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 아이템 갤러리 */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredItems.map((item, index) => {
              const isCollected = collectedItems.has(item.id)
              const rarityGradient = getRarityColor(item.rarity)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: isCollected ? 1.05 : 1 }}
                  onClick={() => isCollected && setSelectedItem(item)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer ${
                    isCollected ? '' : 'opacity-50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${rarityGradient} opacity-20`} />
                  <div className="absolute inset-0 bg-gray-800/50" />
                  
                  {/* 아이템 아이콘 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl ${isCollected ? '' : 'grayscale opacity-50'}`}>
                      {item.icon || '❓'}
                    </span>
                    
                    {!isCollected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* 아이템 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-xs text-white font-medium truncate">{item.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-2 h-2 ${
                            i < (item.tier || 1) 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-gray-600'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const isCollected = collectedItems.has(item.id)
              const rarityGradient = getRarityColor(item.rarity)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => isCollected && setSelectedItem(item)}
                  className={`relative bg-gray-800/50 rounded-xl p-4 cursor-pointer transition-all ${
                    isCollected ? 'hover:bg-gray-700/50' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br ${rarityGradient}`}>
                      <div className="absolute inset-0 bg-gray-900/50" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl ${isCollected ? '' : 'grayscale opacity-50'}`}>
                          {item.icon || '❓'}
                        </span>
                        {!isCollected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{item.name}</h3>
                        <div className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${rarityGradient} text-white`}>
                          {item.rarity}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>

                    {isCollected && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* 컬렉션 보상 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/30"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            컬렉션 보상
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">초급 수집가</span>
                <span className="text-green-400 text-sm">달성!</span>
              </div>
              <div className="text-sm text-gray-300">아이템 10개 수집</div>
              <div className="text-xs text-purple-400 mt-1">보상: 1000 골드</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">중급 수집가</span>
                <span className="text-yellow-400 text-sm">8/50</span>
              </div>
              <div className="text-sm text-gray-300">아이템 50개 수집</div>
              <div className="text-xs text-purple-400 mt-1">보상: 전설 상자</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4 opacity-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">전설 수집가</span>
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-sm text-gray-300">아이템 100개 수집</div>
              <div className="text-xs text-purple-400 mt-1">보상: ???</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

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
                <span className="text-6xl">{selectedItem.icon || '❓'}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">{selectedItem.name}</h3>
              <div className={`text-center mb-4`}>
                <span className={`text-sm px-3 py-1 rounded-full bg-gradient-to-r ${getRarityColor(selectedItem.rarity)} text-white`}>
                  {selectedItem.rarity}
                </span>
              </div>
              <p className="text-gray-400 mb-4">{selectedItem.description}</p>
              
              {selectedItem.stats && (
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">스탯</h4>
                  <div className="space-y-1">
                    {selectedItem.stats.attack && (
                      <div className="text-sm">⚔️ 공격력 +{selectedItem.stats.attack}</div>
                    )}
                    {selectedItem.stats.defense && (
                      <div className="text-sm">🛡️ 방어력 +{selectedItem.stats.defense}</div>
                    )}
                    {selectedItem.stats.health && (
                      <div className="text-sm">❤️ 체력 +{selectedItem.stats.health}</div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}