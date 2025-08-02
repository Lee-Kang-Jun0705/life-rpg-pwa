'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StageService } from '@/lib/dungeon/stage-service'
import { getStagesForDungeon } from '@/lib/dungeon/stage-data'
import type { Stage, StageProgress } from '@/lib/types/stage'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { Lock, Star, Trophy, Clock, Target, Zap } from 'lucide-react'

interface StageSelectProps {
  dungeonId: string
  dungeonName: string
  onSelectStage: (stageId: string) => void
  onClose: () => void
}

export function StageSelect({
  dungeonId,
  dungeonName,
  onSelectStage,
  onClose
}: StageSelectProps) {
  const [stages, setStages] = useState<Stage[]>([])
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStars, setTotalStars] = useState(0)

  const stageService = StageService.getInstance()

  useEffect(() => {
    const loadStages = async() => {
      try {
        setLoading(true)

        // 스테이지 목록 가져오기
        const stageList = getStagesForDungeon(dungeonId)
        setStages(stageList)

        // 진행 상황 가져오기
        const progress = await stageService.getDungeonStageProgress(
          GAME_CONFIG.DEFAULT_USER_ID,
          dungeonId
        )
        setStageProgress(progress)

        // 총 별 개수 계산
        const stars = progress.reduce((sum, p) => sum + p.stars, 0)
        setTotalStars(stars)

        setLoading(false)
      } catch (error) {
        console.error('Failed to load stages:', error)
        setLoading(false)
      }
    }

    loadStages()
  }, [dungeonId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50">
        <div className="text-white text-xl">스테이지 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{dungeonName}</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-300">
                  총 별: <span className="text-white font-medium">{totalStars}</span> / {stages.length * 3}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-purple-500" />
                <span className="text-gray-300">
                  클리어: <span className="text-white font-medium">
                    {stageProgress.filter(p => p.status === 'completed').length}
                  </span> / {stages.length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 스테이지 목록 */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {stages.map((stage, index) => {
            const progress = stageProgress.find(p => p.stageId === stage.id)
            if (!progress) {
              return null
            }

            const isLocked = progress.status === 'locked'
            const isCompleted = progress.status === 'completed'
            const isAvailable = progress.status === 'available'

            return (
              <motion.div
                key={stage.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isLocked
                    ? 'bg-gray-800/50 border-gray-700 opacity-60'
                    : isCompleted
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-blue-900/20 border-blue-600 hover:bg-blue-900/30'
                } ${!isLocked && 'cursor-pointer'}`}
                onClick={() => !isLocked && onSelectStage(stage.id)}
              >
                {/* 스테이지 번호 */}
                <div className="absolute -left-2 -top-2 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                  <span className="text-white font-bold">{stage.number}</span>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      {stage.name}
                      {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{stage.description}</p>

                    {/* 목표 */}
                    <div className="space-y-1 mb-3">
                      {stage.objectives.map((objective, objIndex) => {
                        const objProgress = progress.objectives[objIndex]
                        return (
                          <div key={objective.id} className="flex items-center gap-2 text-sm">
                            <Target className={`w-3 h-3 ${
                              objProgress?.completed ? 'text-green-500' : 'text-gray-500'
                            }`} />
                            <span className={`${
                              objProgress?.completed ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              {objective.description}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* 보상 */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-300">{stage.rewards.exp} EXP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">💰</span>
                        <span className="text-gray-300">{stage.rewards.gold} 골드</span>
                      </div>
                      {stage.rewards.items && stage.rewards.items.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-500">📦</span>
                          <span className="text-gray-300">아이템 {stage.rewards.items.length}개</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 별 표시 */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(star => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= progress.stars
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    {progress.bestTime && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {Math.floor(progress.bestTime / 60)}:
                          {(progress.bestTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {progress.attempts > 0 && (
                      <span className="text-xs text-gray-400">
                        시도: {progress.attempts}회
                      </span>
                    )}
                  </div>
                </div>

                {/* 잠금 해제 조건 */}
                {isLocked && stage.unlockCondition && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-red-400">
                      🔒 잠금 해제 조건: {
                        stage.unlockCondition.type === 'clear_previous'
                          ? '이전 스테이지 클리어'
                          : stage.unlockCondition.type === 'player_level'
                            ? `레벨 ${stage.unlockCondition.value} 필요`
                            : `총 별 ${stage.unlockCondition.value}개 필요`
                      }
                    </p>
                  </div>
                )}

                {/* 첫 클리어 보너스 */}
                {!isCompleted && stage.rewards.firstClearBonus && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-purple-400">
                      ✨ 첫 클리어 보너스: +{stage.rewards.firstClearBonus.exp} EXP,
                      +{stage.rewards.firstClearBonus.gold} 골드
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  )
}
