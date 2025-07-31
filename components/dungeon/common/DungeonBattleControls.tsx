'use client'

import React from 'react'
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw,
  SkipForward
} from 'lucide-react'

interface DungeonBattleControlsProps {
  isPaused: boolean
  speed: number
  canSkip?: boolean
  onPause: () => void
  onResume: () => void
  onSpeedChange: (speed: number) => void
  onRestart: () => void
  onSkip?: () => void
}

export function DungeonBattleControls({
  isPaused,
  speed,
  canSkip = false,
  onPause,
  onResume,
  onSpeedChange,
  onRestart,
  onSkip
}: DungeonBattleControlsProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-center gap-4">
        {/* 재생/일시정지 */}
        {isPaused ? (
          <button
            onClick={onResume}
            className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            aria-label="전투 재개"
          >
            <Play className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            aria-label="전투 일시정지"
          >
            <Pause className="w-6 h-6" />
          </button>
        )}

        {/* 재시작 */}
        <button
          onClick={onRestart}
          className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="전투 재시작"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        {/* 스킵 (옵션) */}
        {canSkip && onSkip && (
          <button
            onClick={onSkip}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            aria-label="전투 스킵"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        )}

        {/* 속도 조절 */}
        <div className="flex items-center gap-2 ml-4">
          <FastForward className="w-5 h-5 text-gray-400" />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-gray-700 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="전투 속도"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
        </div>
      </div>
    </div>
  )
}