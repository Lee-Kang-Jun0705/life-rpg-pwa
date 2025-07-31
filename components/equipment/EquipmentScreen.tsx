'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Shield, Gem, Heart, Zap, ChevronRight, Package, Sparkles } from 'lucide-react'
import { dbHelpers } from '@/lib/database/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { InventoryItem } from '@/lib/shop/types'
import type { UserProfile } from '@/lib/database/types'
import type { EnhanceableItem } from '@/lib/types/item-system'

interface InventoryData {
  items: InventoryItem[]
  coins: number
}

interface EquippedData {
  weapon?: string
  armor?: string
  accessory?: string
}

// 최적화된 Equipment Screen - Shop context 의존성 제거
export function EquipmentScreen() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [equippedItems, setEquippedItems] = useState<{
    weapon?: InventoryItem
    armor?: InventoryItem
    accessory?: InventoryItem
  }>({})
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [characterRotation, setCharacterRotation] = useState(0)

  useEffect(() => {
    if (userId) {
      loadAllData()
    }
  }, [userId])

  const loadAllData = async () => {
    if (!userId) return

    try {
      console.time('Equipment data loading')
      
      // 캐시 확인
      const cachedData = sessionStorage.getItem(`equipment-${userId}`)
      if (cachedData) {
        const { profile: cachedProfile, inventory, equipped } = JSON.parse(cachedData)
        setProfile(cachedProfile)
        setInventoryItems(inventory)
        setEquippedItems(equipped)
        setLoading(false)
        
        // 백그라운드에서 최신 데이터 확인
        loadFreshData().catch(console.error)
        return
      }

      // 새로 로드
      await loadFreshData()
    } catch (error) {
      console.error('Failed to load equipment data:', error)
      setLoading(false)
    }
  }

  const loadFreshData = async () => {
    if (!userId) return

    // 병렬로 데이터 로드
    const [profileData, inventoryData, equippedData] = await Promise.all([
      dbHelpers.getProfile(userId),
      dbHelpers.getPlayerData('inventory').then(data => data?.data || { items: [], coins: 0 }),
      dbHelpers.getPlayerData('equippedItems').then(data => data?.data || {})
    ])

    if (profileData) {
      setProfile(profileData)
    }

    // 인벤토리 아이템 처리
    let items: InventoryItem[] = []
    if (inventoryData && typeof inventoryData === 'object' && 'items' in inventoryData) {
      items = (inventoryData as InventoryData).items || []
    }
    setInventoryItems(items)

    // 장착 아이템 처리
    const equipped: {
      weapon?: InventoryItem
      armor?: InventoryItem
      accessory?: InventoryItem
    } = {}
    if (equippedData && typeof equippedData === 'object') {
      const equipData = equippedData as EquippedData
      if (equipData.weapon) {
        equipped.weapon = items.find(item => item.id === equipData.weapon)
      }
      if (equipData.armor) {
        equipped.armor = items.find(item => item.id === equipData.armor)
      }
      if (equipData.accessory) {
        equipped.accessory = items.find(item => item.id === equipData.accessory)
      }
    }
    setEquippedItems(equipped)

    // 캐시 저장
    sessionStorage.setItem(`equipment-${userId}`, JSON.stringify({
      profile: profileData,
      inventory: items,
      equipped
    }))

    console.timeEnd('Equipment data loading')
    setLoading(false)
  }

  const handleEquip = async (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    if (!item) return

    // 낙관적 업데이트
    const newEquipped = { ...equippedItems }
    newEquipped[item.category as keyof typeof equippedItems] = item
    setEquippedItems(newEquipped)
    setSelectedSlot(null)

    // DB 업데이트
    try {
      // 현재 장착 아이템 정보 가져오기
      const currentEquipped = await dbHelpers.getPlayerData('equippedItems')
      const equippedData = (currentEquipped?.data || {}) as any
      equippedData[item.category] = itemId
      
      // 업데이트된 장착 정보 저장
      await dbHelpers.setPlayerData('equippedItems', equippedData)
      
      // 캐시 무효화
      sessionStorage.removeItem(`equipment-${userId}`)
    } catch (error) {
      console.error('Failed to equip item:', error)
      // 실패 시 롤백
      loadFreshData()
    }
  }

  const handleUnequip = async (itemId: string) => {
    const slot = Object.entries(equippedItems).find(([_, item]) => item?.id === itemId)?.[0]
    if (!slot) return

    // 낙관적 업데이트
    const newEquipped = { ...equippedItems }
    delete newEquipped[slot as keyof typeof equippedItems]
    setEquippedItems(newEquipped)

    // DB 업데이트
    try {
      // 현재 장착 아이템 정보 가져오기
      const currentEquipped = await dbHelpers.getPlayerData('equippedItems')
      const equippedData = (currentEquipped?.data || {}) as any
      delete equippedData[slot]
      
      // 업데이트된 장착 정보 저장
      await dbHelpers.setPlayerData('equippedItems', equippedData)
      
      // 캐시 무효화
      sessionStorage.removeItem(`equipment-${userId}`)
    } catch (error) {
      console.error('Failed to unequip item:', error)
      // 실패 시 롤백
      loadFreshData()
    }
  }

  const equipmentSlots = [
    { id: 'weapon', name: '무기', icon: '⚔️', type: 'weapon' },
    { id: 'armor', name: '갑옷', icon: '🛡️', type: 'armor' },
    { id: 'accessory', name: '액세서리', icon: '💎', type: 'accessory' },
  ]

  const getItemsForSlot = (slotType: string) => {
    return inventoryItems.filter(item => 
      item.category === slotType && 
      item.isEquippable &&
      !Object.values(equippedItems).some(equipped => equipped?.id === item.id)
    )
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

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-lg shadow-yellow-500/50'
      case 'epic': return 'shadow-lg shadow-purple-500/50'
      case 'rare': return 'shadow-md shadow-blue-500/30'
      case 'uncommon': return 'shadow-md shadow-green-500/30'
      default: return ''
    }
  }

  // 총 스탯 계산을 메모이제이션
  const totalStats = useMemo(() => {
    const stats = {
      attack: 10,
      defense: 10,
      hp: 100,
      mp: 50,
    }

    Object.values(equippedItems).forEach(item => {
      if (item?.effects) {
        item.effects.forEach(effect => {
          const match = effect.match(/(\w+)\s*\+(\d+)/)
          if (match) {
            const stat = match[1]
            const value = parseInt(match[2])
            if (stat.includes('공격')) stats.attack += value
            if (stat.includes('방어')) stats.defense += value
            if (stat.includes('체력')) stats.hp += value
            if (stat.includes('마나')) stats.mp += value
          }
        })
      }
    })

    return stats
  }, [equippedItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* 헤더 - 다른 탭과 동일한 크기로 조정 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">장비 관리</h1>
            <p className="text-xs text-gray-900 font-semibold">장비를 장착하여 캐릭터를 강화하세요</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {/* 좌측: 캐릭터 프리뷰 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50"
          >
            <h2 className="text-xl font-bold text-white mb-4">캐릭터</h2>
            
            {/* 캐릭터 프리뷰 영역 */}
            <div className="relative h-64 md:h-96 bg-gray-900/50 rounded-xl mb-4 md:mb-6 overflow-hidden">
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotateY: characterRotation }}
                transition={{ duration: 0.5 }}
              >
                {/* 캐릭터 아바타 */}
                <div className="relative">
                  <motion.div 
                    className="text-9xl"
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {profile?.avatar || '🧙‍♂️'}
                  </motion.div>
                  
                  {/* 장착 아이템 시각화 */}
                  {equippedItems.weapon && (
                    <motion.div 
                      className="absolute -right-8 top-1/2 -translate-y-1/2 text-5xl"
                      animate={{ 
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                      }}
                    >
                      {equippedItems.weapon.icon}
                    </motion.div>
                  )}
                  
                  {equippedItems.armor && (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">
                      {equippedItems.armor.icon}
                    </div>
                  )}
                  
                  {equippedItems.accessory && (
                    <motion.div 
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      {equippedItems.accessory.icon}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* 회전 컨트롤 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setCharacterRotation(prev => prev - 90)}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setCharacterRotation(0)}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  정면
                </button>
                <button
                  onClick={() => setCharacterRotation(prev => prev + 90)}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* 캐릭터 스탯 */}
            <div className="grid grid-cols-2 gap-3">
              <StatDisplay icon={<Sword className="w-5 h-5" />} label="공격력" value={totalStats.attack} color="text-red-400" />
              <StatDisplay icon={<Shield className="w-5 h-5" />} label="방어력" value={totalStats.defense} color="text-blue-400" />
              <StatDisplay icon={<Heart className="w-5 h-5" />} label="체력" value={totalStats.hp} color="text-green-400" />
              <StatDisplay icon={<Zap className="w-5 h-5" />} label="마나" value={totalStats.mp} color="text-purple-400" />
            </div>
          </motion.div>

          {/* 우측: 장비 슬롯 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50"
          >
            <h2 className="text-xl font-bold text-white mb-4">장비 슬롯</h2>
            
            <div className="space-y-4">
              {equipmentSlots.map((slot) => {
                const equippedItem = equippedItems[slot.type as keyof typeof equippedItems]
                const availableItems = getItemsForSlot(slot.type)
                
                return (
                  <motion.div
                    key={slot.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <div 
                      className={`relative bg-gray-800/50 rounded-xl p-4 border transition-all cursor-pointer ${
                        selectedSlot === slot.id 
                          ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                          : 'border-gray-700/50 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
                      data-testid="equipment-slot"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{slot.icon}</div>
                          <div>
                            <h3 className="font-medium text-white">{slot.name}</h3>
                            {equippedItem ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl">{equippedItem.icon}</span>
                                <span className="text-sm text-gray-300">
                                  {equippedItem.name} {(equippedItem as EnhanceableItem).enhancementLevel && (equippedItem as EnhanceableItem).enhancementLevel > 0 && `+${(equippedItem as EnhanceableItem).enhancementLevel}`}
                                </span>
                                <div className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getRarityColor(equippedItem.rarity)} text-white`}>
                                  {equippedItem.rarity}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">비어있음</p>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                          selectedSlot === slot.id ? 'rotate-90' : ''
                        }`} />
                      </div>

                      {/* 장착 해제 버튼 */}
                      {equippedItem && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnequip(equippedItem.id)
                            }}
                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                          >
                            <span className="text-xs">해제</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 아이템 선택 패널 */}
                    <AnimatePresence>
                      {selectedSlot === slot.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 overflow-hidden"
                        >
                          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <h4 className="text-sm font-medium text-gray-400 mb-3">보유 {slot.name}</h4>
                            
                            {availableItems.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {availableItems.map((item) => (
                                  <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative bg-gray-800/50 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700/50 ${getRarityGlow(item.rarity)}`}
                                    onClick={() => handleEquip(item.id)}
                                    data-testid="inventory-item"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div>
                                          <div className="font-medium text-white text-sm">
                                            {item.name} {(item as EnhanceableItem).enhancementLevel && (item as EnhanceableItem).enhancementLevel > 0 && `+${(item as EnhanceableItem).enhancementLevel}`}
                                          </div>
                                          <div className={`text-xs mt-0.5 bg-gradient-to-r ${getRarityColor(item.rarity)} bg-clip-text text-transparent`}>
                                            {item.rarity}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {item.effects && (
                                      <div className="mt-2 space-y-1">
                                        {item.effects.map((effect, index) => (
                                          <div key={index} className="text-xs text-purple-400">
                                            ✨ {effect}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Package className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                <p className="text-sm text-gray-500">보유한 {slot.name}이(가) 없습니다</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

interface StatDisplayProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatDisplay({ icon, label, value, color }: StatDisplayProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={color}>{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  )
}