'use client'

import React, { useState, useEffect } from 'react'
import type { Equipment, EnhancementMaterial } from '@/lib/types/equipment'
import { calculateEnhancementSuccessRate } from '@/lib/types/equipment'
import { ENHANCEMENT_STONES, SPECIAL_ENHANCEMENT_ITEMS, ENHANCEMENT_COSTS, getEnhancementFailurePenalty } from '@/lib/equipment/enhancement-materials'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Shield, AlertTriangle, TrendingUp, Coins, Package, Lock } from 'lucide-react'

interface EnhancementModalProps {
  equipment: Equipment
  onEnhance: (material?: EnhancementMaterial, useProtection?: boolean) => Promise<{
    success: boolean
    newLevel?: number
    destroyed?: boolean
    equipment?: Equipment
  }>
  onClose: () => void
  userGold: number
}

export function EnhancementModal({ equipment, onEnhance, onClose, userGold }: EnhancementModalProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<EnhancementMaterial | null>(null)
  const [useProtection, setUseProtection] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    newLevel?: number
    destroyed?: boolean
  } | null>(null)

  const currentLevel = equipment.enhancementLevel || 0
  const costInfo = ENHANCEMENT_COSTS[currentLevel]
  const penalty = getEnhancementFailurePenalty(currentLevel)
  const baseSuccessRate = calculateEnhancementSuccessRate(currentLevel)
  const materialSuccessRate = selectedMaterial 
    ? calculateEnhancementSuccessRate(currentLevel, selectedMaterial)
    : baseSuccessRate

  // 사용 가능한 재료 필터링
  const availableMaterials = [...ENHANCEMENT_STONES, ...SPECIAL_ENHANCEMENT_ITEMS].filter(
    material => {
      // 티어에 맞는 재료만 표시
      if (material.tier > 1) {
        const requiredLevel = (material.tier - 1) * 3
        return currentLevel >= requiredLevel
      }
      return true
    }
  )

  const handleEnhance = async () => {
    if (!costInfo || userGold < costInfo.gold) {
      alert('골드가 부족합니다')
      return
    }

    setIsEnhancing(true)
    setResult(null)

    try {
      const enhanceResult = await onEnhance(selectedMaterial || undefined, useProtection)
      setResult(enhanceResult)
      
      // 성공 시 장비 정보 업데이트
      if (enhanceResult.success && enhanceResult.equipment) {
        equipment.enhancementLevel = enhanceResult.newLevel || currentLevel + 1
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
      alert('강화 중 오류가 발생했습니다')
    } finally {
      setIsEnhancing(false)
    }
  }

  const getResultMessage = () => {
    if (!result) return null

    if (result.destroyed) {
      return '장비가 파괴되었습니다! 😱'
    } else if (result.success) {
      return `강화 성공! +${result.newLevel} 🎉`
    } else {
      return `강화 실패! ${result.newLevel !== undefined ? `+${result.newLevel}로 하락` : ''} 😢`
    }
  }

  const getResultColor = () => {
    if (!result) return ''
    if (result.destroyed) return 'text-red-600'
    if (result.success) return 'text-green-600'
    return 'text-orange-600'
  }

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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className="relative p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">장비 강화</h2>
                <p className="text-sm opacity-90 mt-1">
                  {equipment.name} +{currentLevel}
                </p>
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {/* 강화 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-medium mb-2">현재 강화</h3>
                <div className="text-2xl font-bold text-purple-600">+{currentLevel}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-medium mb-2">성공 시</h3>
                <div className="text-2xl font-bold text-green-600">+{currentLevel + 1}</div>
              </div>
            </div>

            {/* 성공률 표시 */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                강화 성공률
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span>기본 성공률</span>
                  <span className="font-medium">{baseSuccessRate}%</span>
                </div>
                {selectedMaterial && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>재료 보너스</span>
                    <span className="font-medium">+{selectedMaterial.successRateBonus}%</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">최종 성공률</span>
                    <span className="text-xl font-bold text-purple-600">
                      {selectedMaterial?.guaranteedSuccess ? '100' : materialSuccessRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 실패 패널티 경고 */}
            {penalty.destruction && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-300">경고!</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      강화 실패 시 장비가 파괴될 수 있습니다!
                      {penalty.levelDecrease > 0 && ` (강화 수치 -${penalty.levelDecrease})`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 강화 재료 선택 */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                강화 재료 선택 (선택사항)
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableMaterials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedMaterial(
                      selectedMaterial?.id === material.id ? null : material
                    )}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${selectedMaterial?.id === material.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{material.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {material.guaranteedSuccess && '✨ 100% 성공'}
                      {material.protectDestruction && '🛡️ 파괴 방지'}
                      {material.successRateBonus > 0 && `📈 +${material.successRateBonus}%`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 파괴 방지 옵션 */}
            {penalty.destruction && !selectedMaterial?.protectDestruction && (
              <label className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProtection}
                  onChange={(e) => setUseProtection(e.target.checked)}
                  className="w-5 h-5 text-orange-600"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    파괴 방지 사용
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    추가 비용이 발생하지만 장비 파괴를 방지합니다
                  </div>
                </div>
              </label>
            )}

            {/* 비용 정보 */}
            {costInfo && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  필요 비용
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>골드</span>
                    <span className={`font-medium ${userGold >= costInfo.gold ? 'text-green-600' : 'text-red-600'}`}>
                      {costInfo.gold.toLocaleString()} / {userGold.toLocaleString()}
                    </span>
                  </div>
                  {costInfo.materials.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between text-sm">
                      <span>{mat.id}</span>
                      <span className="font-medium">{mat.amount}개</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 강화 결과 */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center py-6 text-2xl font-bold ${getResultColor()}`}
              >
                {getResultMessage()}
              </motion.div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || currentLevel >= 15 || (costInfo && userGold < costInfo.gold)}
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isEnhancing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    강화 중...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    강화 시작
                  </>
                )}
              </button>
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