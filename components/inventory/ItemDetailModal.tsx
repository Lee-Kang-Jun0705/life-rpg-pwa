'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GeneratedItem } from '@/lib/types/item-system'
import type { Equipment, EquipmentSlot } from '@/lib/services/inventory.service'
import { inventoryService } from '@/lib/services/inventory.service'
import { skillBookService } from '@/lib/services/skillbook.service'
import {
  X,
  Sword,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Lock,
  Unlock,
  ChevronRight,
  Coins,
  BookOpen
} from 'lucide-react'

interface ItemDetailModalProps {
  item: GeneratedItem
  equipped: boolean
  locked: boolean
  onClose: () => void
  onEquip: (item: GeneratedItem) => void
  onUnequip: (slot: string) => void
  onToggleLock: () => void
  onUseItem?: (item: GeneratedItem) => void
  currentEquipment: Equipment
}

export function ItemDetailModal({
  item,
  equipped,
  locked,
  onClose,
  onEquip,
  onUnequip,
  onToggleLock,
  onUseItem,
  currentEquipment
}: ItemDetailModalProps) {
  const [showComparison, setShowComparison] = useState(false)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityBgColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-800'
      case 'uncommon': return 'bg-green-900'
      case 'rare': return 'bg-blue-900'
      case 'epic': return 'bg-purple-900'
      case 'legendary': return 'bg-orange-900'
      default: return 'bg-gray-800'
    }
  }

  const canEquip = ['weapon', 'armor', 'accessory'].includes(item.type)

  // 현재 장착된 같은 타입의 아이템 찾기
  const getEquippedItemOfSameType = (): GeneratedItem | null => {
    if (item.type === 'weapon') {
      return currentEquipment.weapon
    }
    if (item.type === 'armor') {
      return currentEquipment.armor
    }
    if (item.type === 'accessory') {
      // 액세서리는 첫 번째로 장착된 것과 비교
      return currentEquipment.accessory1 || currentEquipment.accessory2 || currentEquipment.accessory3
    }
    return null
  }

  const equippedItem = getEquippedItemOfSameType()
  const comparison = equippedItem && !equipped ? inventoryService.compareItems(item, equippedItem) : null

  const getEquippedSlot = (): string | null => {
    for (const [slot, equippedItem] of Object.entries(currentEquipment)) {
      if (equippedItem?.uniqueId === item.uniqueId) {
        return slot
      }
    }
    return null
  }

  const equippedSlot = getEquippedSlot()

  // 스킬북 정보 가져오기
  const skillBookInfo = skillBookService.isSkillBook(item) ? skillBookService.getSkillBookInfo(item) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="item-detail-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`relative p-6 ${getRarityBgColor(item.rarity)} bg-opacity-30`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="text-6xl">
              {item.icon || (
                item.type === 'weapon' ? '⚔️' :
                  item.type === 'armor' ? '🛡️' :
                    item.type === 'accessory' ? '💎' :
                      item.type === 'consumable' ? '🧪' :
                        '📦'
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{item.name}</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-semibold ${getRarityColor(item.rarity)}`}>
                  {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                </span>
                <span className="text-gray-400">Lv.{item.level}</span>
                <span className="text-gray-400">{item.type}</span>
              </div>
              <p className="text-gray-300 mt-2">{item.description}</p>
            </div>
          </div>
        </div>

        {/* 스탯 정보 */}
        <div className="p-6 space-y-6">
          {/* 기본 스탯 */}
          {Object.keys(item.baseStats).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                기본 능력치
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 grid grid-cols-2 gap-3">
                {Object.entries(item.baseStats).map(([stat, value]) => (
                  value && (
                    <div key={stat} className="flex justify-between">
                      <span className="text-gray-400">{getStatName(stat)}</span>
                      <span className="font-semibold">+{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* 랜덤 스탯 */}
          {item.randomStats.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                추가 옵션
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                {item.randomStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-400">{getStatName(stat.type)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-400">
                        +{stat.value}{stat.type.includes('Rate') || stat.type.includes('Bonus') ? '%' : ''}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: stat.tier }).map((_, i) => (
                          <div key={i} className="w-1 h-3 bg-purple-400 rounded-sm" />
                        ))}
                        {Array.from({ length: 5 - stat.tier }).map((_, i) => (
                          <div key={i} className="w-1 h-3 bg-gray-600 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 특수 효과 */}
          {item.specialEffects && item.specialEffects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                특수 효과
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                {item.specialEffects.map((effect, index) => (
                  <div key={index}>
                    <div className="font-semibold text-yellow-400">{effect.name}</div>
                    <div className="text-sm text-gray-300">{effect.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 스킬북 정보 */}
          {skillBookInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                스킬 정보
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <div>
                  <div className="font-semibold text-purple-400">{skillBookInfo.skillName}</div>
                  <div className="text-sm text-gray-300 mt-1">{skillBookInfo.skillDescription}</div>
                </div>
                {!skillBookInfo.canLearn && (
                  <div className="text-sm text-red-400 italic">
                    {skillBookInfo.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 아이템 비교 */}
          {comparison && canEquip && !equipped && (
            <div>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
                현재 장착 아이템과 비교
              </button>

              <AnimatePresence>
                {showComparison && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 bg-gray-700 rounded-lg p-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      {comparison.better.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-green-400 mb-1">더 좋은 스탯</div>
                          {comparison.better.map((stat, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-400">{getStatName(stat.stat)}</span>
                              <span className="text-green-400">+{stat.difference}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {comparison.worse.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-red-400 mb-1">더 낮은 스탯</div>
                          {comparison.worse.map((stat, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-400">{getStatName(stat.stat)}</span>
                              <span className="text-red-400">-{stat.difference}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">총 평가</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  comparison.overallScore > 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.abs(comparison.overallScore) * 50 + 50}%`,
                                  marginLeft: comparison.overallScore < 0 ? `${50 - Math.abs(comparison.overallScore) * 50}%` : '0'
                                }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${
                              comparison.overallScore > 0 ? 'text-green-400' :
                                comparison.overallScore < 0 ? 'text-red-400' :
                                  'text-gray-400'
                            }`}>
                              {comparison.overallScore > 0 ? '상승' :
                                comparison.overallScore < 0 ? '하락' :
                                  '동일'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 가치 정보 */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400">판매 가격</span>
              </div>
              <span className="font-semibold text-yellow-400">
                {item.value.toLocaleString()} 골드
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3">
            {/* 잠금 토글 */}
            <button
              onClick={onToggleLock}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                locked
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              data-testid="toggle-lock-btn"
            >
              {locked ? (
                <>
                  <Unlock className="w-5 h-5" />
                  잠금 해제
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  잠금
                </>
              )}
            </button>

            {/* 사용 버튼 (소비 아이템) */}
            {item.type === 'consumable' && onUseItem && (
              <button
                onClick={() => onUseItem(item)}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                data-testid="use-item-btn"
              >
                {skillBookService.isSkillBook(item) ? (
                  <>
                    <BookOpen className="w-5 h-5" />
                    스킬 배우기
                  </>
                ) : (
                  '사용하기'
                )}
              </button>
            )}

            {/* 장착/해제 버튼 */}
            {canEquip && (
              equipped ? (
                <button
                  onClick={() => equippedSlot && onUnequip(equippedSlot)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  data-testid="unequip-btn"
                >
                  장착 해제
                </button>
              ) : (
                <button
                  onClick={() => onEquip(item)}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  data-testid="equip-btn"
                >
                  장착하기
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 스탯 이름 변환 함수
function getStatName(stat: string): string {
  const statNames: Record<string, string> = {
    attack: '공격력',
    defense: '방어력',
    hp: '체력',
    mp: '마나',
    speed: '속도',
    critRate: '치명타 확률',
    critDamage: '치명타 피해',
    dodge: '회피율',
    lifeSteal: '생명력 흡수',
    mpRegen: '마나 재생',
    expBonus: '경험치 보너스',
    goldBonus: '골드 보너스'
  }
  return statNames[stat] || stat
}
