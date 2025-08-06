'use client'

import { Star, Heart, X, Sword, Loader2 } from 'lucide-react'
import type { DungeonDefinition } from './DungeonSelector'

export interface DungeonProgressData {
  dungeonId: string
  currentFloor: number
  totalGold: number
  totalExp: number
}

interface DungeonProgressProps {
  dungeon: DungeonDefinition
  progress: DungeonProgressData
  isLoading: boolean
  onStartBattle: () => void
  onExit: () => void
}

export function DungeonProgress({
  dungeon,
  progress,
  isLoading,
  onStartBattle,
  onExit
}: DungeonProgressProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{dungeon.name}</h2>
          <p className="text-gray-400">{progress.currentFloor}층 / {dungeon.floors}층</p>
        </div>
        <button
          onClick={onExit}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="던전 나가기"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* 진행 상황 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">획득 골드</span>
          </div>
          <div className="text-2xl font-bold text-white">{progress.totalGold}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-sm">획득 경험치</span>
          </div>
          <div className="text-2xl font-bold text-white">{progress.totalExp}</div>
        </div>
      </div>
      
      {/* 전투 시작 버튼 */}
      <div className="text-center">
        <button
          onClick={onStartBattle}
          disabled={isLoading}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2 mx-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              준비 중...
            </>
          ) : (
            <>
              <Sword className="w-5 h-5" />
              전투 시작
            </>
          )}
        </button>
      </div>
    </div>
  )
}