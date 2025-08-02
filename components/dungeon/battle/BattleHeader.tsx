import React from 'react'
import { X } from 'lucide-react'

interface BattleHeaderProps {
  floorInfo?: {
    currentFloor: number
    totalFloors: number
    dungeonName: string
  }
  onClose: () => void
}

export function BattleHeader({ floorInfo, onClose }: BattleHeaderProps) {
  return (
    <>
      {/* X 버튼 - 오른쪽 상단 */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white hover:text-white bg-black/30 hover:bg-black/40 rounded-full w-7 h-7 flex items-center justify-center transition-all shadow-lg z-10"
        aria-label="전투 화면 닫기"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* 던전 진행도 표시 */}
      {floorInfo && (
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white" role="status" aria-label="던전 진행도">
          <p className="text-sm font-bold">{floorInfo.dungeonName}</p>
          <p className="text-xs">
            <span role="status" aria-label={`현재 ${floorInfo.currentFloor}층, 전체 ${floorInfo.totalFloors}층 중`}>
              {floorInfo.currentFloor}층 / {floorInfo.totalFloors}층
            </span>
          </p>
        </div>
      )}
    </>
  )
}
