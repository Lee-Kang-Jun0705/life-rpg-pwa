'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EquipmentSlot } from './EquipmentSlot'
import { InventoryDisplay } from '@/components/inventory/InventoryDisplay'
import { inventoryService } from '@/lib/services/inventory-service'
import type { EquippedGear, EquipmentSlot as EquipmentSlotType, InventorySlot, EquipmentItem } from '@/lib/types/inventory'
import { isEquipmentItem } from '@/lib/types/inventory'
import { User, Sword, Shield, TrendingUp } from 'lucide-react'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'

interface EquipmentManagerProps {
  userId: string
  onClose?: () => void
}

export function EquipmentManager({ userId, onClose }: EquipmentManagerProps) {
  const [equippedGear, setEquippedGear] = useState<EquippedGear>(inventoryService.getEquippedGear(userId))
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null)
  const [selectedInventorySlot, setSelectedInventorySlot] = useState<InventorySlot | null>(null)
  const [totalStats, setTotalStats] = useState<{ attack: number; defense: number; hp: number; speed: number }>({
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0
  })
  const [characterLevel, setCharacterLevel] = useState(1)

  // 캐릭터 레벨 로드
  useEffect(() => {
    const loadCharacterLevel = async () => {
      try {
        const stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
        }
      } catch (error) {
        console.error('Failed to load character level:', error)
      }
    }
    loadCharacterLevel()
  }, [])

  // 장비 변경 시 새로고침
  const refreshEquipment = useCallback(() => {
    const gear = inventoryService.getEquippedGear(userId)
    setEquippedGear(gear)
    
    // 총 스탯 계산
    let totalAttack = 0
    let totalDefense = 0
    let totalHp = 0
    let totalSpeed = 0
    
    Object.values(gear).forEach(equipped => {
      if (equipped && equipped.item.stats) {
        const stats = equipped.item.stats
        const enhancementBonus = 1 + (equipped.enhancement * 0.1) // 강화당 10% 보너스
        
        totalAttack += Math.floor((stats.attack || 0) * enhancementBonus)
        totalDefense += Math.floor((stats.defense || 0) * enhancementBonus)
        totalHp += Math.floor((stats.hp || 0) * enhancementBonus)
        totalSpeed += Math.floor((stats.speed || 0) * enhancementBonus)
      }
    })
    
    setTotalStats({
      attack: totalAttack,
      defense: totalDefense,
      hp: totalHp,
      speed: totalSpeed
    })
  }, [userId])

  useEffect(() => {
    refreshEquipment()
  }, [refreshEquipment])

  // 장비 슬롯 클릭
  const handleSlotClick = (slot: EquipmentSlotType) => {
    setSelectedSlot(slot)
    setSelectedInventorySlot(null)
  }

  // 인벤토리 아이템 클릭
  const handleInventoryItemClick = (slot: InventorySlot) => {
    if (slot.item && isEquipmentItem(slot.item)) {
      setSelectedInventorySlot(slot)
    }
  }

  // 장비 장착
  const handleEquip = () => {
    if (!selectedInventorySlot || !selectedSlot) return
    
    const item = selectedInventorySlot.item
    if (!isEquipmentItem(item)) return
    
    // 레벨 체크
    if (item.levelRequirement > characterLevel) {
      alert(`레벨 ${item.levelRequirement} 이상이어야 장착할 수 있습니다.`)
      return
    }
    
    // 슬롯 체크
    if (item.slot !== selectedSlot) {
      alert('올바른 장비 슬롯이 아닙니다.')
      return
    }
    
    const success = inventoryService.equipItem(userId, selectedInventorySlot.slotId, selectedSlot)
    if (success) {
      refreshEquipment()
      setSelectedInventorySlot(null)
    }
  }

  // 장비 해제
  const handleUnequip = () => {
    if (!selectedSlot || !equippedGear[selectedSlot]) return
    
    const success = inventoryService.unequipItem(userId, selectedSlot)
    if (success) {
      refreshEquipment()
    }
  }

  // 전투력 계산 (간단한 공식)
  const combatPower = characterLevel * 100 + totalStats.attack * 10 + totalStats.defense * 8 + totalStats.hp + totalStats.speed * 5

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          장비 관리
        </h2>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            닫기
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 캐릭터 & 장비 슬롯 */}
        <div className="space-y-4">
          {/* 캐릭터 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                캐릭터 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto bg-gradient-to-b from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-5xl mb-4">
                  ⚔️
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Lv.{characterLevel} 모험가</p>
                  <p className="text-2xl font-bold text-purple-500">
                    전투력: {combatPower.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 장비 슬롯 */}
              <div className="grid grid-cols-2 gap-4">
                <EquipmentSlot
                  slot="weapon"
                  equippedItem={equippedGear.weapon}
                  onClick={() => handleSlotClick('weapon')}
                  isSelected={selectedSlot === 'weapon'}
                />
                <EquipmentSlot
                  slot="armor"
                  equippedItem={equippedGear.armor}
                  onClick={() => handleSlotClick('armor')}
                  isSelected={selectedSlot === 'armor'}
                />
                <EquipmentSlot
                  slot="accessory1"
                  equippedItem={equippedGear.accessory1}
                  onClick={() => handleSlotClick('accessory1')}
                  isSelected={selectedSlot === 'accessory1'}
                />
                <EquipmentSlot
                  slot="accessory2"
                  equippedItem={equippedGear.accessory2}
                  onClick={() => handleSlotClick('accessory2')}
                  isSelected={selectedSlot === 'accessory2'}
                />
              </div>

              {/* 장비 해제 버튼 */}
              {selectedSlot && equippedGear[selectedSlot] && (
                <Button
                  onClick={handleUnequip}
                  variant="outline"
                  className="w-full mt-4"
                  size="sm"
                >
                  장비 해제
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 스탯 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                장비 스탯
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sword className="w-4 h-4 text-red-500" />
                    공격력
                  </span>
                  <span className="font-bold text-red-500">+{totalStats.attack}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    방어력
                  </span>
                  <span className="font-bold text-blue-500">+{totalStats.defense}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-green-500">❤️</span>
                    체력
                  </span>
                  <span className="font-bold text-green-500">+{totalStats.hp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-yellow-500">⚡</span>
                    속도
                  </span>
                  <span className="font-bold text-yellow-500">+{totalStats.speed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 인벤토리 */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>장비 가능한 아이템</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedSlot ? `${selectedSlot} 슬롯에 장착 가능한 아이템` : '장비 슬롯을 먼저 선택하세요'}
            </p>
          </CardHeader>
          <CardContent>
            <InventoryDisplay
              userId={userId}
              onItemClick={handleInventoryItemClick}
              selectedSlotId={selectedInventorySlot?.slotId}
              filter={{
                type: 'equipment'
              }}
            />
            
            {/* 장착 버튼 */}
            {selectedInventorySlot && selectedSlot && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Button
                  onClick={handleEquip}
                  className="w-full"
                  disabled={
                    !isEquipmentItem(selectedInventorySlot.item) ||
                    selectedInventorySlot.item.slot !== selectedSlot ||
                    selectedInventorySlot.item.levelRequirement > characterLevel
                  }
                >
                  {selectedInventorySlot.item && isEquipmentItem(selectedInventorySlot.item) && 
                   selectedInventorySlot.item.levelRequirement > characterLevel
                    ? `레벨 ${selectedInventorySlot.item.levelRequirement} 필요`
                    : '장착하기'}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}