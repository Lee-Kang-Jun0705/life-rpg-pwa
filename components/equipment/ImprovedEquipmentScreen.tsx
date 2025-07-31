'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Shield, Gem, Heart, Zap, TrendingUp, ChevronRight, Lock, Star, Package, Sparkles } from 'lucide-react'
import { dbHelpers } from '@/lib/database/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useShop } from '@/lib/shop'
import type { Character } from '@/lib/types/game-core'
import type { InventoryItem } from '@/lib/shop/types'
import { EnhancementModal } from './EnhancementModal'
import { equipmentEnhancementService } from '@/lib/services/equipment-enhancement.service'
import { inventoryService } from '@/lib/services/inventory.service'
import type { GeneratedItem, EnhanceableItem } from '@/lib/types/item-system'
import type { UserProfile } from '@/lib/database/types'
import type { Equipment, EquipmentType } from '@/lib/types/equipment'

// InventoryItem을 Equipment 타입으로 변환하는 유틸리티 함수
function convertInventoryItemToEquipment(item: InventoryItem): Equipment {
  // category를 EquipmentType으로 매핑
  const typeMapping: Record<string, EquipmentType> = {
    weapon: 'weapon',
    armor: 'armor',
    accessory: 'accessory',
  }

  // 기본 스탯 변환
  const stats: Equipment['stats'] = {}
  if (item.statBonus) {
    if (item.statBonus.health) stats.hp = item.statBonus.health
    if (item.statBonus.learning) stats.health = item.statBonus.learning
    if (item.statBonus.achievement) stats.attack = item.statBonus.achievement
    if (item.statBonus.relationship) stats.defense = item.statBonus.relationship
  }

  // effects를 specialEffects로 변환
  const specialEffects = item.effects?.map((effect, index) => ({
    id: `effect-${index}`,
    name: effect,
    description: effect,
    type: 'passive' as const,
  }))

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    type: typeMapping[item.category] || 'accessory',
    rarity: item.rarity as Equipment['rarity'],
    tier: 1, // 기본값
    level: 1, // 기본값
    stats,
    specialEffects,
    price: item.price,
    enhancementLevel: (item as EnhanceableItem).enhancementLevel || 0,
  }
}

export function ImprovedEquipmentScreen() {
  const { userId } = useAuth()
  const { state, isLoading: shopLoading, getInventoryItems, getEquippedItems, equipItem, unequipItem } = useShop()
  const [character, setCharacter] = useState<Character | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [characterRotation, setCharacterRotation] = useState(0)
  const [enhancementModalOpen, setEnhancementModalOpen] = useState(false)
  const [selectedEquipmentForEnhancement, setSelectedEquipmentForEnhancement] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (userId) {
      loadCharacterData()
    }
  }, [userId])

  const loadCharacterData = async () => {
    if (!userId) return
    
    try {
      // Performance: 캐시 확인
      const cachedProfile = sessionStorage.getItem(`profile-${userId}`)
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile)
        setProfile(profileData)
        
        // 캐시된 데이터로 즉시 표시
        const tempCharacter: Character = {
          id: userId,
          name: profileData.name,
          level: profileData.level,
          experience: profileData.experience,
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
        setLoading(false)
        
        // 백그라운드에서 최신 데이터 확인
        dbHelpers.getProfile(userId).then(freshData => {
          if (freshData && JSON.stringify(freshData) !== cachedProfile) {
            sessionStorage.setItem(`profile-${userId}`, JSON.stringify(freshData))
            setProfile(freshData)
          }
        }).catch(console.error)
        
        return
      }
      
      // 캐시가 없으면 새로 로드
      const profileData = await dbHelpers.getProfile(userId)
      if (profileData) {
        sessionStorage.setItem(`profile-${userId}`, JSON.stringify(profileData))
        setProfile(profileData)
        // 임시 Character 객체 생성
        const tempCharacter: Character = {
          id: userId,
          name: profileData.name,
          level: profileData.level,
          experience: profileData.experience,
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

  const inventoryItems = shopLoading ? [] : getInventoryItems()
  const equippedItems = shopLoading ? { weapon: undefined, armor: undefined, accessory: undefined } : getEquippedItems()

  const equipmentSlots = [
    { id: 'weapon', name: '무기', icon: '⚔️', type: 'weapon' },
    { id: 'armor', name: '갑옷', icon: '🛡️', type: 'armor' },
    { id: 'accessory', name: '액세서리', icon: '💎', type: 'accessory' },
  ]

  const getItemsForSlot = (slotType: string) => {
    return inventoryItems.filter(item => 
      item.category === slotType && item.isEquippable
    )
  }

  const handleEquip = async (itemId: string) => {
    const success = await equipItem(itemId)
    if (success) {
      loadCharacterData()
      setSelectedSlot(null)
    }
  }

  const handleUnequip = async (itemId: string) => {
    const success = await unequipItem(itemId)
    if (success) {
      loadCharacterData()
    }
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

  const calculateTotalStats = () => {
    let totalStats = {
      attack: character?.combatStats?.attack || 0,
      defense: character?.combatStats?.defense || 0,
      hp: character?.combatStats?.hp || 100,
      mp: character?.combatStats?.mp || 50,
    }

    Object.values(equippedItems).forEach(item => {
      if (item?.effects) {
        item.effects.forEach(effect => {
          // 간단한 효과 파싱 (예: "공격력 +10")
          const match = effect.match(/(\w+)\s*\+(\d+)/)
          if (match) {
            const stat = match[1]
            const value = parseInt(match[2])
            if (stat.includes('공격')) totalStats.attack += value
            if (stat.includes('방어')) totalStats.defense += value
            if (stat.includes('체력')) totalStats.hp += value
            if (stat.includes('마나')) totalStats.mp += value
          }
        })
      }
    })

    return totalStats
  }

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const totalStats = calculateTotalStats()

  return (
    <div className="min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">장비 관리</h1>
            <p className="text-gray-400">장비를 장착하여 캐릭터를 강화하세요</p>
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
            
            {/* 3D 캐릭터 프리뷰 영역 */}
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
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEquipmentForEnhancement(equippedItem)
                              setEnhancementModalOpen(true)
                            }}
                            className="p-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
                            title="강화"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
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
                                    className={`relative bg-gray-800/50 rounded-lg p-3 cursor-pointer transition-all ${
                                      item.isEquipped ? 'opacity-50' : 'hover:bg-gray-700/50'
                                    } ${getRarityGlow(item.rarity)}`}
                                    onClick={() => !item.isEquipped && handleEquip(item.id)}
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
                                      
                                      <div className="flex items-center gap-2">
                                        {!item.isEquipped && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setSelectedEquipmentForEnhancement(item)
                                              setEnhancementModalOpen(true)
                                            }}
                                            className="p-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-purple-400 transition-colors"
                                            title="강화"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                          </button>
                                        )}
                                        {item.isEquipped && (
                                          <div className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                                            장착중
                                          </div>
                                        )}
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

      {/* 강화 모달 */}
      {selectedEquipmentForEnhancement && (
        <EnhancementModal
          equipment={convertInventoryItemToEquipment(selectedEquipmentForEnhancement)}
          onEnhance={async (material, useProtection) => {
            try {
              const result = await equipmentEnhancementService.enhanceEquipment(
                selectedEquipmentForEnhancement.id,
                material ? [{ id: material.id, quantity: 1 }] : [],
                useProtection ?? false
              )
              
              if ('success' in result && result.success) {
                loadCharacterData()
                return {
                  success: true,
                  newLevel: result.newLevel,
                  equipment: result.item ? convertInventoryItemToEquipment(result.item as InventoryItem) : undefined
                }
              } else if ('success' in result && !result.success) {
                const failureResult = result as { success: boolean; destroyed?: boolean }
                return {
                  success: false,
                  destroyed: failureResult.destroyed || false
                }
              }
              
              return { success: false }
            } catch (error) {
              console.error('Enhancement error:', error)
              return { success: false }
            }
          }}
          onClose={() => {
            setEnhancementModalOpen(false)
            setSelectedEquipmentForEnhancement(null)
          }}
          userGold={character?.gold || 0}
        />
      )}
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