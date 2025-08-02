'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Equipment } from '@/lib/services/inventory.service'
import type { GeneratedItem } from '@/lib/types/item-system'
import {
  Sword,
  Shield,
  HardHat,
  Shirt,
  Footprints,
  Gem,
  X
} from 'lucide-react'

interface EquipmentPanelProps {
  equipment: Equipment
  onUnequipItem: (slot: string) => void
  onSelectItem: (item: GeneratedItem) => void
}

export function EquipmentPanel({
  equipment,
  onUnequipItem,
  onSelectItem
}: EquipmentPanelProps) {
  const equipmentSlots = [
    { key: 'helmet', name: '머리', icon: HardHat, position: 'top-0 left-1/2 -translate-x-1/2' },
    { key: 'weapon', name: '무기', icon: Sword, position: 'top-1/3 left-0' },
    { key: 'armor', name: '갑옷', icon: Shirt, position: 'top-1/3 left-1/2 -translate-x-1/2' },
    { key: 'gloves', name: '장갑', icon: Shield, position: 'top-1/3 right-0' },
    { key: 'boots', name: '신발', icon: Footprints, position: 'bottom-0 left-1/2 -translate-x-1/2' },
    { key: 'accessory1', name: '액세서리 1', icon: Gem, position: 'top-2/3 left-0' },
    { key: 'accessory2', name: '액세서리 2', icon: Gem, position: 'top-2/3 left-1/2 -translate-x-1/2' },
    { key: 'accessory3', name: '액세서리 3', icon: Gem, position: 'top-2/3 right-0' }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'uncommon': return 'border-green-400'
      case 'rare': return 'border-blue-400'
      case 'epic': return 'border-purple-400'
      case 'legendary': return 'border-orange-400'
      default: return 'border-gray-400'
    }
  }

  const getTotalStats = () => {
    const stats = {
      attack: 0,
      defense: 0,
      hp: 0,
      mp: 0,
      speed: 0,
      critRate: 0,
      critDamage: 0,
      dodge: 0
    }

    Object.values(equipment).forEach(item => {
      if (item) {
        // 기본 스탯
        Object.entries(item.baseStats).forEach(([stat, value]) => {
          if (stat in stats && value) {
            stats[stat as keyof typeof stats] += value
          }
        })

        // 랜덤 스탯
        item.randomStats.forEach(rs => {
          if (rs.type in stats) {
            stats[rs.type as keyof typeof stats] += rs.value
          }
        })
      }
    })

    return stats
  }

  const totalStats = getTotalStats()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 캐릭터 장비 슬롯 */}
      <div className="bg-gray-800 rounded-xl p-8">
        <h2 className="text-xl font-bold mb-6 text-center">장착 장비</h2>

        <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
          {/* 캐릭터 실루엣 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="text-[200px]">👤</div>
          </div>

          {/* 장비 슬롯 */}
          {equipmentSlots.map(slot => {
            const item = equipment[slot.key as keyof Equipment]
            const Icon = slot.icon

            return (
              <div
                key={slot.key}
                className={`absolute w-20 h-20 ${slot.position}`}
                data-testid={`equipment-slot-${slot.key}`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`
                    w-full h-full rounded-lg border-2 border-dashed
                    ${item ? getRarityColor(item.rarity) : 'border-gray-600'}
                    bg-gray-900 bg-opacity-80 cursor-pointer
                    flex items-center justify-center relative group
                  `}
                  onClick={() => item ? onSelectItem(item) : null}
                >
                  {item ? (
                    <>
                      {/* 아이템 아이콘 */}
                      <span className="text-3xl">
                        {item.icon || (
                          slot.key === 'weapon' ? '⚔️' :
                            slot.key.includes('accessory') ? '💎' :
                              '🛡️'
                        )}
                      </span>

                      {/* 장비 해제 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnequipItem(slot.key)
                        }}
                        className="
                          absolute -top-2 -right-2
                          w-6 h-6 bg-red-600 hover:bg-red-700
                          rounded-full flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transition-opacity
                        "
                        data-testid={`unequip-${slot.key}`}
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* 아이템 이름 툴팁 */}
                      <div className="
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-opacity z-10
                      ">
                        <div className="bg-gray-900 px-3 py-2 rounded whitespace-nowrap">
                          <div className="text-sm font-semibold">{item.name}</div>
                          <div className="text-xs text-gray-400">Lv.{item.level}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Icon className="w-8 h-8 text-gray-600" />
                      {/* 빈 슬롯 툴팁 */}
                      <div className="
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-opacity z-10
                      ">
                        <div className="bg-gray-900 px-3 py-2 rounded whitespace-nowrap text-sm">
                          {slot.name}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 총 스탯 */}
      <div className="bg-gray-800 rounded-xl p-8">
        <h2 className="text-xl font-bold mb-6">총 능력치</h2>

        <div className="space-y-4">
          {/* 주요 스탯 */}
          <div className="grid grid-cols-2 gap-4">
            <StatDisplay
              icon="⚔️"
              name="공격력"
              value={totalStats.attack}
              color="text-red-400"
            />
            <StatDisplay
              icon="🛡️"
              name="방어력"
              value={totalStats.defense}
              color="text-blue-400"
            />
            <StatDisplay
              icon="❤️"
              name="체력"
              value={totalStats.hp}
              color="text-green-400"
            />
            <StatDisplay
              icon="💙"
              name="마나"
              value={totalStats.mp}
              color="text-blue-400"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">추가 능력치</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">속도</span>
                <span className="font-semibold">{totalStats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">치명타 확률</span>
                <span className="font-semibold">{(totalStats.critRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">치명타 피해</span>
                <span className="font-semibold">x{totalStats.critDamage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">회피율</span>
                <span className="font-semibold">{(totalStats.dodge * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 세트 효과 */}
          {/* TODO: 세트 효과 표시 */}
        </div>
      </div>
    </div>
  )
}

// 스탯 표시 컴포넌트
function StatDisplay({
  icon,
  name,
  value,
  color
}: {
  icon: string
  name: string
  value: number
  color: string
}) {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-gray-300">{name}</span>
        </div>
        <span className={`text-2xl font-bold ${color}`}>
          {value}
        </span>
      </div>
    </div>
  )
}
