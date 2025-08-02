'use client'

import React, { useEffect, useState } from 'react'
import { EnergyService } from '@/lib/energy/energy-service'
import { PlayerEnergyState, EnergyRegenTimer } from '@/lib/types/energy'
import { Zap, Clock, Gift } from 'lucide-react'

interface EnergyDisplayProps {
  userId: string
  compact?: boolean
  onEnergyChange?: (energy: number) => void
}

export function EnergyDisplay({ userId, compact = false, onEnergyChange }: EnergyDisplayProps) {
  const [energyState, setEnergyState] = useState<PlayerEnergyState | null>(null)
  const [regenTimer, setRegenTimer] = useState<EnergyRegenTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [canClaimBonus, setCanClaimBonus] = useState(false)

  const energyService = EnergyService.getInstance()

  // 에너지 상태 로드
  const loadEnergyState = async() => {
    try {
      const state = await energyService.getPlayerEnergyState(userId)
      setEnergyState(state)

      // 일일 보너스 수령 가능 여부 체크
      if (state.lastDailyBonus) {
        const lastClaim = new Date(state.lastDailyBonus)
        const now = new Date()
        const timeDiff = now.getTime() - lastClaim.getTime()
        setCanClaimBonus(timeDiff >= 24 * 60 * 60 * 1000)
      } else {
        setCanClaimBonus(true)
      }

      // 회복 타이머 정보
      const timer = await energyService.getEnergyRegenTimer(userId)
      setRegenTimer(timer)

      if (onEnergyChange) {
        onEnergyChange(state.energy.current)
      }
    } catch (error) {
      console.error('Failed to load energy state:', error)
    } finally {
      setLoading(false)
    }
  }

  // 일일 보너스 수령
  const claimDailyBonus = async() => {
    try {
      const result = await energyService.claimDailyBonus(userId)
      if (result.energy) {
        setCanClaimBonus(false)
        await loadEnergyState()
      } else {
        alert('보너스 수령 실패')
      }
    } catch (error) {
      console.error('Failed to claim daily bonus:', error)
    }
  }

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadEnergyState()

    // 1분마다 에너지 업데이트
    const interval = setInterval(loadEnergyState, 60000)

    return () => clearInterval(interval)
  }, [userId])

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) {
      return '0:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (loading || !energyState) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32" />
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">
          {energyState.energy.current}/{energyState.energy.max}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      {/* 에너지 바 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">에너지</span>
          </div>
          <span className="text-sm font-medium">
            {energyState.energy.current}/{energyState.energy.max}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(energyState.energy.current / energyState.energy.max) * 100}%` }}
          />
        </div>
      </div>

      {/* 회복 타이머 */}
      {energyState.energy.current < energyState.energy.max && regenTimer && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            다음 회복: {formatTime(regenTimer.timeUntilNext)} |
            최대까지: {formatTime(regenTimer.timeUntilFull)}
          </span>
        </div>
      )}

      {/* 전투 티켓 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">전투 티켓</span>
        </div>
        <span className="font-medium">{energyState.battleTickets}장</span>
      </div>

      {/* 일일 보너스 버튼 */}
      {canClaimBonus && (
        <button
          onClick={claimDailyBonus}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Gift className="w-4 h-4" />
          <span className="text-sm font-medium">일일 보너스 받기 (+30)</span>
        </button>
      )}
    </div>
  )
}
