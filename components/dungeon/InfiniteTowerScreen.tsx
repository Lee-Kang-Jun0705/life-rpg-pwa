'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { infiniteTowerService } from '@/lib/services/infinite-tower.service'
import type { 
  InfiniteTowerProgress, 
  TowerBuff,
  InfiniteTowerRanking 
} from '@/lib/types/dungeon'
import { 
  Trophy, 
  Zap, 
  Shield, 
  Heart, 
  ChevronUp,
  Clock,
  Sword,
  Store,
  RotateCcw,
  Flag,
  Crown
} from 'lucide-react'

interface InfiniteTowerScreenProps {
  userId: string
  onEnterFloor: (floor: number) => void
  onExit: () => void
}

export function InfiniteTowerScreen({ userId, onEnterFloor, onExit }: InfiniteTowerScreenProps) {
  const [progress, setProgress] = useState<InfiniteTowerProgress | null>(null)
  const [rankings, setRankings] = useState<InfiniteTowerRanking[]>([])
  const [showBuffShop, setShowBuffShop] = useState(false)
  const [buffShopItems, setBuffShopItems] = useState<TowerBuff[]>([])
  const [activeTab, setActiveTab] = useState<'progress' | 'rankings' | 'rewards'>('progress')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTowerData()
  }, [userId])

  const loadTowerData = async () => {
    setLoading(true)
    try {
      // 진행 상황과 랭킹 로드
      const result = await infiniteTowerService.enterTower(userId, false)
      if (result.success) {
        // TODO: 실제 진행 상황 가져오기
        setRankings(infiniteTowerService.getRankings('all', 10))
      }
    } catch (error) {
      console.error('Failed to load tower data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartFromBeginning = async () => {
    const result = await infiniteTowerService.enterTower(userId, false)
    if (result.success) {
      onEnterFloor(result.floor)
    }
  }

  const handleStartFromCheckpoint = async () => {
    const result = await infiniteTowerService.enterTower(userId, true)
    if (result.success) {
      onEnterFloor(result.floor)
    }
  }

  const handleOpenBuffShop = () => {
    if (progress) {
      const items = infiniteTowerService.getBuffShopItems(progress.currentFloor)
      setBuffShopItems(items)
      setShowBuffShop(true)
    }
  }

  const handlePurchaseBuff = async (buffId: string) => {
    const success = await infiniteTowerService.purchaseBuff(userId, buffId)
    if (success) {
      setShowBuffShop(false)
      // TODO: 진행 상황 새로고침
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>무한의 탑 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-gray-900 text-white p-4">
      {/* 헤더 */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">무한의 탑</h1>
            <span className="text-2xl">🏰</span>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            나가기
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-4 mb-6">
          {(['progress', 'rankings', 'rewards'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'progress' && '진행 상황'}
              {tab === 'rankings' && '랭킹'}
              {tab === 'rewards' && '보상'}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 현재 진행 상황 */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">현재 진행 상황</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronUp className="w-5 h-5 text-green-400" />
                      <span className="text-gray-400">현재 층</span>
                    </div>
                    <p className="text-2xl font-bold">{progress?.currentFloor || 1}층</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-400">최고 기록</span>
                    </div>
                    <p className="text-2xl font-bold">{progress?.highestFloor || 0}층</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-400">체크포인트</span>
                    </div>
                    <p className="text-2xl font-bold">{progress?.lastCheckpoint || 0}층</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sword className="w-5 h-5 text-red-400" />
                      <span className="text-gray-400">처치한 몬스터</span>
                    </div>
                    <p className="text-2xl font-bold">{progress?.totalMonstersDefeated || 0}</p>
                  </div>
                </div>

                {/* 시작 버튼 */}
                <div className="flex gap-4">
                  <button
                    onClick={handleStartFromBeginning}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105"
                  >
                    처음부터 시작
                  </button>
                  
                  {(progress?.lastCheckpoint || 0) > 0 && (
                    <button
                      onClick={handleStartFromCheckpoint}
                      className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
                    >
                      체크포인트에서 시작 ({progress?.lastCheckpoint}층)
                    </button>
                  )}
                </div>
              </div>

              {/* 활성 버프 */}
              {progress?.activeBuffs && progress.activeBuffs.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">활성 버프</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {progress.activeBuffs.map((buff, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{buff.icon}</span>
                          <div>
                            <p className="font-semibold">{buff.name}</p>
                            <p className="text-sm text-gray-400">
                              {buff.remainingFloors}층 남음
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{buff.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleOpenBuffShop}
                    className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    버프 상점
                  </button>
                </div>
              )}

              {/* 통계 */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">전체 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 mb-1">총 도전 횟수</p>
                    <p className="text-xl font-semibold">{progress?.stats.totalRuns || 0}회</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">총 클리어 층수</p>
                    <p className="text-xl font-semibold">{progress?.stats.totalFloorsCleared || 0}층</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">평균 층당 시간</p>
                    <p className="text-xl font-semibold">
                      {Math.floor(progress?.stats.averageFloorTime || 0)}초
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">최고 기록</p>
                    <p className="text-xl font-semibold">{progress?.stats.bestRunFloor || 0}층</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold mb-6">전체 랭킹</h2>
              
              {rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((rank, index) => (
                    <div
                      key={rank.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        rank.userId === userId 
                          ? 'bg-purple-700' 
                          : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold w-12 text-center">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `${index + 1}`}
                        </div>
                        <div>
                          <p className="font-semibold">{rank.userName}</p>
                          <p className="text-sm text-gray-400">
                            총 {rank.totalFloorsCleared}층 클리어
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{rank.highestFloor}층</p>
                        <p className="text-sm text-gray-400">최고 기록</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400">아직 랭킹이 없습니다.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold mb-6">보상 정보</h2>
              
              <div className="space-y-6">
                {/* 층별 보상 */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">층별 기본 보상</h3>
                  <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                    <p>• 매 층: 골드 + 경험치 (층수에 비례 증가)</p>
                    <p>• 5층마다: 일반 아이템</p>
                    <p>• 10층마다: 희귀 아이템 + 체크포인트</p>
                    <p>• 25층마다: 영웅 아이템 + 휴식층</p>
                    <p>• 50층마다: 전설 아이템 + 특별 보상</p>
                  </div>
                </div>

                {/* 마일스톤 보상 */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">마일스톤 보상</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-3xl mb-2">🥉</p>
                      <p className="font-semibold">10층</p>
                      <p className="text-sm text-gray-400">청동 배지</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-3xl mb-2">🥈</p>
                      <p className="font-semibold">25층</p>
                      <p className="text-sm text-gray-400">은 배지</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-3xl mb-2">🥇</p>
                      <p className="font-semibold">50층</p>
                      <p className="text-sm text-gray-400">금 배지</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-3xl mb-2">💎</p>
                      <p className="font-semibold">100층</p>
                      <p className="text-sm text-gray-400">플래티넘 배지</p>
                    </div>
                  </div>
                </div>

                {/* 특수 메커니즘 */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">특수 메커니즘</h3>
                  <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                    <p className="text-yellow-400">⚠️ 주의사항</p>
                    <p>• 20층부터: 몬스터가 버프 사용</p>
                    <p>• 40층부터: 몬스터가 회복 능력 사용</p>
                    <p>• 60층부터: 몬스터가 부하 소환</p>
                    <p>• 80층부터: 광역 공격 패턴</p>
                    <p>• 100층부터: 즉사 공격 가능성</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 버프 상점 모달 */}
      {showBuffShop && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">버프 상점</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buffShopItems.map((buff) => (
                <div key={buff.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{buff.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{buff.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{buff.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          지속: {buff.duration}층
                        </span>
                        <button
                          onClick={() => handlePurchaseBuff(buff.id)}
                          className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700 transition-colors text-sm"
                        >
                          구매
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowBuffShop(false)}
              className="mt-6 w-full py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}