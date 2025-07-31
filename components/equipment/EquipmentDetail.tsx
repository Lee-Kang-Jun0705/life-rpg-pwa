'use client'

import React from 'react'
import type { Equipment } from '@/lib/types/equipment'
import { calculateEquipmentPower, calculateEnhancementSuccessRate } from '@/lib/types/equipment'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sword, Shield, HardHat, Shirt, Hand, Footprints, Gem, Star, Zap, Lock } from 'lucide-react'

interface EquipmentDetailProps {
  equipment: Equipment
  isEquipped: boolean
  onEquip: () => void
  onUnequip: () => void
  onClose: () => void
}

const typeIcons = {
  weapon: Sword,
  shield: Shield,
  helmet: HardHat,
  armor: Shirt,
  gloves: Hand,
  boots: Footprints,
  accessory: Gem,
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-orange-400 to-orange-600',
  mythic: 'from-red-400 to-red-600',
}

const rarityNames = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  mythic: '신화',
}

export function EquipmentDetail({ equipment, isEquipped, onEquip, onUnequip, onClose }: EquipmentDetailProps) {
  const Icon = typeIcons[equipment.type]
  const power = calculateEquipmentPower(equipment)
  const enhanceRate = calculateEnhancementSuccessRate(equipment.enhancementLevel || 0)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className={`relative p-6 bg-gradient-to-br ${rarityColors[equipment.rarity]} text-white`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl">
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{equipment.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm opacity-90">{rarityNames[equipment.rarity]}</span>
                  <span className="text-sm opacity-90">Lv.{equipment.level}</span>
                  {equipment.enhancementLevel && equipment.enhancementLevel > 0 && (
                    <span className="text-sm font-bold">+{equipment.enhancementLevel}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 전투력 */}
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold">{power.toLocaleString()}</div>
              <div className="text-sm opacity-90">전투력</div>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {/* 설명 */}
            <div>
              <p className="text-gray-600 dark:text-gray-400">{equipment.description}</p>
            </div>

            {/* 기본 스탯 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                기본 능력치
              </h3>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {Object.entries(equipment.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{stat}</span>
                    <span className="font-medium">+{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 특수 효과 */}
            {equipment.specialEffects && equipment.specialEffects.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">특수 효과</h3>
                <div className="space-y-2">
                  {equipment.specialEffects.map((effect, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-purple-700 dark:text-purple-300">
                            {effect.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {effect.description}
                          </p>
                        </div>
                        {effect.chance && (
                          <span className="text-sm text-purple-600 dark:text-purple-400">
                            {effect.chance}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 세트 정보 */}
            {equipment.setId && (
              <div>
                <h3 className="font-semibold mb-3">세트 아이템</h3>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    이 장비는 세트 아이템입니다. 같은 세트의 다른 아이템과 함께 장착하면 추가 효과를 얻을 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 강화 정보 */}
            <div>
              <h3 className="font-semibold mb-3">강화 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">현재 강화</span>
                  <span className="font-medium">+{equipment.enhancementLevel || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">다음 강화 성공률</span>
                  <span className="font-medium text-green-500">{enhanceRate}%</span>
                </div>
                {equipment.locked && (
                  <div className="flex items-center gap-2 text-orange-500">
                    <Lock className="w-4 h-4" />
                    <span>파괴 방지 적용됨</span>
                  </div>
                )}
              </div>
            </div>

            {/* 티어 표시 */}
            <div>
              <h3 className="font-semibold mb-3">티어</h3>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(equipment.tier, 10))].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>

            {/* 가격 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">판매 가격</span>
              <span className="font-medium text-yellow-600">💰 {equipment.price.toLocaleString()} 골드</span>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              {isEquipped ? (
                <button
                  onClick={onUnequip}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  장착 해제
                </button>
              ) : (
                <button
                  onClick={onEquip}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  장착하기
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}