'use client'

import React from 'react'
import type { DungeonProgress as DungeonProgressType, Dungeon } from '@/lib/types/dungeon'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Zap, 
  Star, 
  Target, 
  Sword, 
  Shield, 
  Heart,
  Trophy,
  Play,
  Pause,
  X
} from 'lucide-react'

interface DungeonProgressProps {
  dungeon: Dungeon
  progress: DungeonProgressType
  onContinue?: () => void
  onPause?: () => void
  onAbandon?: () => void
}

export function DungeonProgress({ dungeon, progress, onContinue, onPause, onAbandon }: DungeonProgressProps) {
  const progressPercentage = (progress.currentStage / progress.totalStages) * 100
  const monsterProgressPercentage = progress.totalMonsters > 0 ? (progress.defeatedMonsters / progress.totalMonsters) * 100 : 0
  const elapsedTime = progress.endTime 
    ? progress.endTime.getTime() - progress.startTime.getTime()
    : Date.now() - progress.startTime.getTime()

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{dungeon.icon}</div>
          <div>
            <h3 className="text-xl font-bold">{dungeon.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${progress.status === 'in_progress' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : progress.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }
              `}>
                {progress.status === 'in_progress' ? '진행 중' : 
                 progress.status === 'completed' ? '완료' : '실패'}
              </span>
              <span>•</span>
              <span>{formatTime(elapsedTime)} 경과</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {progress.status === 'in_progress' && onPause && (
            <button
              onClick={onPause}
              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              title="일시정지"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {onAbandon && (
            <button
              onClick={onAbandon}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="포기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 진행도 바 */}
      <div className="space-y-4 mb-6">
        {/* 스테이지 진행도 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">스테이지 진행도</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress.currentStage} / {progress.totalStages}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-center mt-1 text-xs text-gray-500">
            {Math.floor(progressPercentage)}% 완료
          </div>
        </div>

        {/* 몬스터 처치 진행도 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">몬스터 처치</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress.defeatedMonsters} / {progress.totalMonsters}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${monsterProgressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {progress.earnedExp.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">경험치</div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {progress.earnedGold.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">골드</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Sword className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {progress.damageDealt.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">가한 피해</div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            {progress.damageTaken.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">받은 피해</div>
        </div>
      </div>

      {/* 획득 아이템 */}
      {progress.earnedItems.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            획득 아이템
          </h4>
          <div className="flex flex-wrap gap-2">
            {progress.earnedItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                {item.quantity > 1 && <span>x{item.quantity}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 특별 달성 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">달성 조건</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`
            flex items-center gap-2 p-2 rounded-lg text-sm
            ${progress.survivedWithFullHP 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-500'
            }
          `}>
            <Heart className="w-4 h-4" />
            <span>체력 만땅 유지</span>
            {progress.survivedWithFullHP && <span className="ml-auto">✓</span>}
          </div>
          
          <div className={`
            flex items-center gap-2 p-2 rounded-lg text-sm
            ${progress.usedNoConsumables 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-500'
            }
          `}>
            <Zap className="w-4 h-4" />
            <span>소비품 미사용</span>
            {progress.usedNoConsumables && <span className="ml-auto">✓</span>}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      {progress.status === 'in_progress' && onContinue && (
        <button
          onClick={onContinue}
          className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          계속하기
        </button>
      )}
      
      {progress.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-green-600 dark:text-green-400 font-medium mb-2">
            🎉 던전 클리어 완료!
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            총 {formatTime(elapsedTime)} 소요
          </div>
        </div>
      )}
      
      {progress.status === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div className="text-red-600 dark:text-red-400 font-medium mb-2">
            💀 던전 실패
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            다시 도전해보세요
          </div>
        </div>
      )}
    </motion.div>
  )
}