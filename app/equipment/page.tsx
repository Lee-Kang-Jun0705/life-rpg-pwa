'use client'

import React, { useState, useEffect } from 'react'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { EQUIPMENT_DATA, EQUIPMENT_SETS } from '@/lib/equipment/equipment-data'
import type { Equipment, EquippedGear, EquipmentType, EquipmentFilter, EquipmentSortOption, EquipmentRarity, EnhancementMaterial } from '@/lib/types/equipment'
import { calculateEquipmentPower, calculateTotalStats, getActiveSetBonuses } from '@/lib/types/equipment'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { EquipmentDetail } from '@/components/equipment/EquipmentDetail'
import { EquipmentStats } from '@/components/equipment/EquipmentStats'
import { EquipmentSetBonus } from '@/components/equipment/EquipmentSetBonus'
import { EnhancementModal } from '@/components/equipment/EnhancementModal'
import { EquipmentService } from '@/lib/equipment/equipment-service'
import { useShop } from '@/lib/shop/shop-context'
import { motion } from 'framer-motion'
import { Shield, Swords, Package, SortAsc, Filter, X, Zap } from 'lucide-react'

export default function EquipmentPage() {
  const [inventory, setInventory] = useState<Equipment[]>([])
  const [equippedGear, setEquippedGear] = useState<EquippedGear>({})
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [enhancingEquipment, setEnhancingEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'equipped' | 'inventory'>('equipped')

  // 필터 및 정렬
  const [filter, setFilter] = useState<EquipmentFilter>({})
  const [sortBy, setSortBy] = useState<EquipmentSortOption>('power')
  const [showFilter, setShowFilter] = useState(false)

  const { coins } = useShop()
  const equipmentService = EquipmentService.getInstance()

  // 초기 데이터 로드
  useEffect(() => {
    loadEquipmentData()
  }, [])

  const loadEquipmentData = async() => {
    try {
      setIsLoading(true)

      // 사용자 데이터 로드
      const user = await dbHelpers.getProfile(GAME_CONFIG.DEFAULT_USER_ID)
      if (user) {
        // 임시로 장착된 장비 설정 (나중에 DB에서 로드)
        const tempEquipped: EquippedGear = {
          weapon: EQUIPMENT_DATA.find(e => e.id === 'iron-sword'),
          armor: EQUIPMENT_DATA.find(e => e.id === 'leather-armor'),
          helmet: EQUIPMENT_DATA.find(e => e.id === 'leather-cap')
        }
        setEquippedGear(tempEquipped)

        // 인벤토리 로드 (임시로 일부 장비 추가)
        const tempInventory = [
          ...EQUIPMENT_DATA.slice(0, 20),
          ...EQUIPMENT_DATA.slice(50, 60)
        ]
        setInventory(tempInventory)
      }
    } catch (error) {
      console.error('Failed to load equipment data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 장비 장착/해제
  const handleEquip = (equipment: Equipment) => {
    const newEquipped = { ...equippedGear }

    // 같은 타입의 장비가 이미 장착되어 있으면 교체
    if (equipment.type === 'accessory') {
      // 액세서리는 3개까지 장착 가능
      if (!newEquipped.accessory1) {
        newEquipped.accessory1 = equipment
      } else if (!newEquipped.accessory2) {
        newEquipped.accessory2 = equipment
      } else if (!newEquipped.accessory3) {
        newEquipped.accessory3 = equipment
      } else {
        // 가장 오래된 액세서리 교체
        newEquipped.accessory1 = newEquipped.accessory2
        newEquipped.accessory2 = newEquipped.accessory3
        newEquipped.accessory3 = equipment
      }
    } else {
      // 다른 장비는 타입별로 1개만
      newEquipped[equipment.type] = equipment
    }

    setEquippedGear(newEquipped)
    setSelectedEquipment(null)
  }

  // 장비 해제
  const handleUnequip = (type: EquipmentType, slot?: 'accessory1' | 'accessory2' | 'accessory3') => {
    const newEquipped = { ...equippedGear }

    if (type === 'accessory' && slot) {
      newEquipped[slot] = undefined
    } else if (type !== 'accessory') {
      (newEquipped as Record<string, Equipment | undefined>)[type] = undefined
    }

    setEquippedGear(newEquipped)
  }

  // 장비 강화 처리
  const handleEnhancement = async(
    equipment: Equipment,
    material?: EnhancementMaterial,
    useProtection?: boolean
  ) => {
    const result = await equipmentService.enhanceEquipment(
      GAME_CONFIG.DEFAULT_USER_ID,
      equipment,
      material,
      useProtection
    )

    // 인벤토리 업데이트
    if (result.equipment) {
      setInventory(prev =>
        prev.map(item =>
          item.id === equipment.id ? result.equipment! : item
        )
      )

      // 장착된 장비인 경우 업데이트
      const equippedKeys = Object.keys(equippedGear) as Array<keyof EquippedGear>
      for (const key of equippedKeys) {
        if (equippedGear[key]?.id === equipment.id) {
          setEquippedGear(prev => ({
            ...prev,
            [key]: result.equipment
          }))
          break
        }
      }
    } else if (result.destroyed) {
      // 장비가 파괴된 경우 제거
      setInventory(prev => prev.filter(item => item.id !== equipment.id))

      // 장착된 장비인 경우 제거
      const equippedKeys = Object.keys(equippedGear) as Array<keyof EquippedGear>
      for (const key of equippedKeys) {
        if (equippedGear[key]?.id === equipment.id) {
          setEquippedGear(prev => ({
            ...prev,
            [key]: undefined
          }))
          break
        }
      }
    }

    return result
  }

  // 필터링 및 정렬
  const filteredInventory = inventory
    .filter(equipment => {
      if (filter.type && !filter.type.includes(equipment.type)) {
        return false
      }
      if (filter.rarity && !filter.rarity.includes(equipment.rarity)) {
        return false
      }
      if (filter.tier && !filter.tier.includes(equipment.tier)) {
        return false
      }
      if (filter.minLevel && equipment.level < filter.minLevel) {
        return false
      }
      if (filter.maxLevel && equipment.level > filter.maxLevel) {
        return false
      }
      if (filter.hasSetBonus && !equipment.setId) {
        return false
      }
      if (filter.hasSpecialEffect && (!equipment.specialEffects || equipment.specialEffects.length === 0)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'power':
          return calculateEquipmentPower(b) - calculateEquipmentPower(a)
        case 'level':
          return b.level - a.level
        case 'rarity':
          const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return b.price - a.price
        default:
          return 0
      }
    })

  // 총 스탯 계산
  const totalStats = calculateTotalStats(equippedGear, EQUIPMENT_SETS)
  const activeSetBonuses = getActiveSetBonuses(equippedGear, EQUIPMENT_SETS)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            장비
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            강력한 장비로 캐릭터를 강화하세요
          </p>
        </div>

        {/* 총 스탯 표시 */}
        <EquipmentStats stats={totalStats} />

        {/* 세트 효과 표시 */}
        {activeSetBonuses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">활성화된 세트 효과</h3>
            <div className="space-y-2">
              {activeSetBonuses.map(({ setId, bonuses }) => (
                <EquipmentSetBonus
                  key={setId}
                  set={EQUIPMENT_SETS.find(s => s.id === setId)!}
                  activeBonuses={bonuses}
                />
              ))}
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('equipped')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'equipped'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Swords className="w-4 h-4 inline mr-2" />
            장착중
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            인벤토리 ({inventory.length})
          </button>
        </div>

        {/* 장착중 탭 */}
        {activeTab === 'equipped' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 무기 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">무기</h4>
              {equippedGear.weapon ? (
                <EquipmentCard
                  equipment={equippedGear.weapon}
                  onClick={() => setSelectedEquipment(equippedGear.weapon!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 방패 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">방패</h4>
              {equippedGear.shield ? (
                <EquipmentCard
                  equipment={equippedGear.shield}
                  onClick={() => setSelectedEquipment(equippedGear.shield!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 투구 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">투구</h4>
              {equippedGear.helmet ? (
                <EquipmentCard
                  equipment={equippedGear.helmet}
                  onClick={() => setSelectedEquipment(equippedGear.helmet!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 갑옷 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">갑옷</h4>
              {equippedGear.armor ? (
                <EquipmentCard
                  equipment={equippedGear.armor}
                  onClick={() => setSelectedEquipment(equippedGear.armor!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 장갑 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">장갑</h4>
              {equippedGear.gloves ? (
                <EquipmentCard
                  equipment={equippedGear.gloves}
                  onClick={() => setSelectedEquipment(equippedGear.gloves!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 신발 슬롯 */}
            <div data-testid="equipment-slot" className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 text-gray-500">신발</h4>
              {equippedGear.boots ? (
                <EquipmentCard
                  equipment={equippedGear.boots}
                  onClick={() => setSelectedEquipment(equippedGear.boots!)}
                  isEquipped
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  비어있음
                </div>
              )}
            </div>

            {/* 액세서리 슬롯들 */}
            {['accessory1', 'accessory2', 'accessory3'].map((slot, index) => (
              <div key={slot} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <h4 className="text-sm font-medium mb-2 text-gray-500">액세서리 {index + 1}</h4>
                {equippedGear[slot as keyof EquippedGear] ? (
                  <EquipmentCard
                    equipment={equippedGear[slot as keyof EquippedGear] as Equipment}
                    onClick={() => setSelectedEquipment(equippedGear[slot as keyof EquippedGear] as Equipment)}
                    isEquipped
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400">
                    비어있음
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 인벤토리 탭 */}
        {activeTab === 'inventory' && (
          <>
            {/* 필터 및 정렬 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  필터
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as EquipmentSortOption)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <option value="power">전투력순</option>
                  <option value="level">레벨순</option>
                  <option value="rarity">희귀도순</option>
                  <option value="name">이름순</option>
                  <option value="price">가격순</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">
                {filteredInventory.length} / {inventory.length} 아이템
              </div>
            </div>

            {/* 필터 패널 */}
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                {/* 필터 옵션들 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 타입 필터 */}
                  <div>
                    <h4 className="font-medium mb-2">타입</h4>
                    <div className="space-y-1">
                      {['weapon', 'shield', 'helmet', 'armor', 'gloves', 'boots', 'accessory'].map(type => (
                        <label key={type} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filter.type?.includes(type as EquipmentType) || false}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...(filter.type || []), type as EquipmentType]
                                : filter.type?.filter(t => t !== type) || []
                              setFilter({ ...filter, type: newTypes.length > 0 ? newTypes : undefined })
                            }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 희귀도 필터 */}
                  <div>
                    <h4 className="font-medium mb-2">희귀도</h4>
                    <div className="space-y-1">
                      {['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => (
                        <label key={rarity} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filter.rarity?.includes(rarity as EquipmentRarity) || false}
                            onChange={(e) => {
                              const newRarities = e.target.checked
                                ? [...(filter.rarity || []), rarity as EquipmentRarity]
                                : filter.rarity?.filter(r => r !== rarity) || []
                              setFilter({ ...filter, rarity: newRarities.length > 0 ? newRarities : undefined })
                            }}
                          />
                          {rarity}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 기타 필터 */}
                  <div>
                    <h4 className="font-medium mb-2">기타</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filter.hasSetBonus || false}
                          onChange={(e) => setFilter({ ...filter, hasSetBonus: e.target.checked || undefined })}
                        />
                        세트 아이템만
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filter.hasSpecialEffect || false}
                          onChange={(e) => setFilter({ ...filter, hasSpecialEffect: e.target.checked || undefined })}
                        />
                        특수 효과 있음
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFilter({})}
                  className="mt-4 text-sm text-blue-500 hover:text-blue-600"
                >
                  필터 초기화
                </button>
              </motion.div>
            )}

            {/* 장비 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInventory.map((equipment, index) => (
                <motion.div
                  key={equipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative"
                >
                  <EquipmentCard
                    equipment={equipment}
                    onClick={() => setSelectedEquipment(equipment)}
                  />
                  {/* 강화 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEnhancingEquipment(equipment)
                    }}
                    className="absolute top-2 right-2 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-lg"
                    title="강화하기"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* 장비 상세 정보 모달 */}
        {selectedEquipment && (
          <EquipmentDetail
            equipment={selectedEquipment}
            isEquipped={Object.values(equippedGear).some(e => e?.id === selectedEquipment.id)}
            onEquip={() => handleEquip(selectedEquipment)}
            onUnequip={() => {
              const slot = Object.entries(equippedGear).find(([_, e]) => e?.id === selectedEquipment.id)?.[0]
              if (slot) {
                handleUnequip(
                  selectedEquipment.type,
                  slot as 'accessory1' | 'accessory2' | 'accessory3'
                )
              }
            }}
            onClose={() => setSelectedEquipment(null)}
          />
        )}

        {/* 강화 모달 */}
        {enhancingEquipment && (
          <EnhancementModal
            equipment={enhancingEquipment}
            onEnhance={(material, useProtection) =>
              handleEnhancement(enhancingEquipment, material, useProtection)
            }
            onClose={() => setEnhancingEquipment(null)}
            userGold={coins}
          />
        )}
      </div>
    </div>
  )
}
