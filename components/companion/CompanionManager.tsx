'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompanionInstance } from '@/lib/types/companion'
import { companionService } from '@/lib/services/companion.service'
import { COMPANION_DATA } from '@/lib/data/companions'
import CompanionCard from './CompanionCard'
import CompanionDetailModal from './CompanionDetailModal'

export default function CompanionManager() {
  const [companions, setCompanions] = useState<CompanionInstance[]>([])
  const [activeCompanion, setActiveCompanion] = useState<CompanionInstance | null>(null)
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionInstance | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showGachaModal, setShowGachaModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 컴패니언 목록 로드
  useEffect(() => {
    loadCompanions()
  }, [])

  const loadCompanions = () => {
    setIsLoading(true)
    try {
      const allCompanions = companionService.getAllCompanions('current-user')
      setCompanions(allCompanions)
      
      const active = companionService.getActiveCompanion('current-user')
      setActiveCompanion(active)
      
      // 시간 경과에 따른 상태 업데이트
      companionService.updateCompanionStates('current-user')
    } catch (error) {
      console.error('Failed to load companions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCompanion = (companion: CompanionInstance) => {
    companionService.setActiveCompanion('current-user', companion.id)
    setActiveCompanion(companion)
  }

  const handleViewDetails = (companion: CompanionInstance) => {
    setSelectedCompanion(companion)
    setShowDetailModal(true)
  }

  const handleGacha = () => {
    // 간단한 가챠 시뮬레이션 (실제로는 서버에서 처리해야 함)
    const rarityRates = {
      common: 0.65,
      rare: 0.25,
      epic: 0.08,
      legendary: 0.019,
      mythic: 0.001
    }
    
    const random = Math.random()
    let selectedRarity: CompanionRarity = 'common'
    let cumulative = 0
    
    for (const [rarity, rate] of Object.entries(rarityRates)) {
      cumulative += rate
      if (random <= cumulative) {
        selectedRarity = rarity as CompanionRarity
        break
      }
    }
    
    // 해당 희귀도의 컴패니언 중 랜덤 선택
    const companionsOfRarity = COMPANION_DATA.filter(c => c.rarity === selectedRarity)
    const randomCompanion = companionsOfRarity[Math.floor(Math.random() * companionsOfRarity.length)]
    
    if (randomCompanion) {
      const newCompanion = companionService.addCompanion('current-user', randomCompanion.id)
      if (newCompanion) {
        loadCompanions()
        alert(`🎉 ${randomCompanion.name}을(를) 획득했습니다! (${selectedRarity})`)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">컴패니언 관리</h2>
          <p className="text-gray-600 dark:text-gray-400">
            보유 컴패니언: {companions.length}개
          </p>
        </div>
        <button
          onClick={() => setShowGachaModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
        >
          🎰 컴패니언 뽑기
        </button>
      </div>

      {/* 활성 컴패니언 */}
      {activeCompanion && (
        <div>
          <h3 className="text-lg font-medium mb-3">활성 컴패니언</h3>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl">
            <CompanionCard
              companion={activeCompanion}
              isActive={true}
              onViewDetails={() => handleViewDetails(activeCompanion)}
              showActions={false}
            />
          </div>
        </div>
      )}

      {/* 컴패니언 목록 */}
      <div>
        <h3 className="text-lg font-medium mb-3">보유 컴패니언</h3>
        {companions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="text-5xl mb-4 block">🐾</span>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              아직 컴패니언이 없습니다.
            </p>
            <button
              onClick={() => setShowGachaModal(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              첫 컴패니언 뽑기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companions.map(companion => (
              <CompanionCard
                key={companion.id}
                companion={companion}
                isActive={activeCompanion?.id === companion.id}
                onSelect={() => handleSelectCompanion(companion)}
                onViewDetails={() => handleViewDetails(companion)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {selectedCompanion && (
        <CompanionDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          companion={selectedCompanion}
          onActivityPerformed={loadCompanions}
        />
      )}

      {/* 가챠 모달 */}
      <AnimatePresence>
        {showGachaModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowGachaModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 p-6 w-[400px]"
            >
              <h3 className="text-xl font-bold mb-4">컴패니언 뽑기</h3>
              
              {/* 확률 표시 */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Common</span>
                  <span className="text-gray-500">65%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Rare</span>
                  <span className="text-blue-500">25%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Epic</span>
                  <span className="text-purple-500">8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Legendary</span>
                  <span className="text-orange-500">1.9%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-pink-600">Mythic</span>
                  <span className="text-pink-500">0.1%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleGacha()
                    setShowGachaModal(false)
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
                >
                  🎰 1회 뽑기 (1000 골드)
                </button>
                <button
                  onClick={() => setShowGachaModal(false)}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}