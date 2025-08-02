import React from 'react'
import { useBattleStore } from '@/lib/stores/battleStore'
import { BATTLE_CONFIG } from '@/lib/constants/battle.constants'

export function BattleControls() {
  const battleSpeed = useBattleStore((state) => state.battleSpeed)
  const setBattleSpeed = useBattleStore((state) => state.setBattleSpeed)

  console.log('🔄 BattleControls 리렌더링, 현재 속도:', battleSpeed)

  const handleSpeedChange = () => {
    console.log('⚡ 배속 버튼 클릭됨, 현재 속도:', battleSpeed)
    const currentIndex = BATTLE_CONFIG.AVAILABLE_SPEEDS.indexOf(battleSpeed)
    const nextIndex = (currentIndex + 1) % BATTLE_CONFIG.AVAILABLE_SPEEDS.length
    const newSpeed = BATTLE_CONFIG.AVAILABLE_SPEEDS[nextIndex]
    console.log(`⚡ 새로운 속도 설정: ${newSpeed}x`)
    setBattleSpeed(newSpeed)
    console.log(`⚡ 배속 변경: ${battleSpeed}x → ${newSpeed}x`)
  }

  const getSpeedColorClass = () => {
    switch (battleSpeed) {
      case 1:
        return 'bg-blue-600/40 hover:bg-blue-600/50'
      case 2:
        return 'bg-yellow-600/40 hover:bg-yellow-600/50'
      case 3:
        return 'bg-red-600/40 hover:bg-red-600/50'
      default:
        return 'bg-black/30 hover:bg-black/40'
    }
  }

  return (
    <div className="absolute right-4 md:right-8 bottom-4 md:bottom-8">
      <button
        onClick={handleSpeedChange}
        className={`text-white hover:text-white rounded-full px-4 py-2 transition-all font-bold text-sm flex items-center gap-1 shadow-lg ${getSpeedColorClass()}`}
      >
        ⚡ {battleSpeed}x
      </button>
    </div>
  )
}
