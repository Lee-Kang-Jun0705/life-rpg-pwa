'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { OptimizedEnergyService } from '@/lib/energy/energy-service-optimized'
import { PlayerEnergyState } from '@/lib/types/energy'
import { Zap, Clock, Gift } from 'lucide-react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { useVisibilityManager } from '@/lib/utils/visibility-manager'

interface OptimizedEnergyDisplayProps {
  userId: string
  compact?: boolean
  onEnergyChange?: (energy: number) => void
}

export function OptimizedEnergyDisplay({ 
  userId, 
  compact = false, 
  onEnergyChange 
}: OptimizedEnergyDisplayProps) {
  const [energyState, setEnergyState] = useState<PlayerEnergyState | null>(null)
  const [displayEnergy, setDisplayEnergy] = useState(0)
  const [timeUntilNext, setTimeUntilNext] = useState(0)
  const [loading, setLoading] = useState(true)
  const [canClaimBonus, setCanClaimBonus] = useState(false)
  
  const energyService = OptimizedEnergyService.getInstance()
  const { registerTimer, registerInterval } = usePerformanceMonitor('energy')
  const visibility = useVisibilityManager()

  // 에너지 상태 계산 (UI 업데이트용)
  const updateEnergyDisplay = useCallback(async () => {
    if (!energyState) return
    
    const currentState = await energyService.calculateEnergyState(userId)
    setDisplayEnergy(currentState.energy.current)
    
    // 다음 회복 시간 계산
    if (currentState.energy.current < currentState.energy.max) {
      const nextTime = energyService.getTimeUntilNextRegen(currentState)
      setTimeUntilNext(nextTime)
    } else {
      setTimeUntilNext(0)
    }
    
    if (onEnergyChange && currentState.energy.current !== energyState.energy.current) {
      onEnergyChange(currentState.energy.current)
      setEnergyState(currentState)
    }
  }, [energyState, userId, energyService, onEnergyChange])

  // 초기 로드 및 오프라인 회복
  const loadInitialState = useCallback(async () => {
    try {
      // 오프라인 회복 계산
      const state = await energyService.calculateOfflineRecovery(userId)
      setEnergyState(state)
      setDisplayEnergy(state.energy.current)
      
      // 일일 보너스 가능 여부
      if (state.lastDailyBonus) {
        const lastClaim = new Date(state.lastDailyBonus)
        const now = new Date()
        const timeDiff = now.getTime() - lastClaim.getTime()
        setCanClaimBonus(timeDiff >= 24 * 60 * 60 * 1000)
      } else {
        setCanClaimBonus(true)
      }
      
      if (onEnergyChange) {
        onEnergyChange(state.energy.current)
      }
    } catch (error) {
      console.error('Failed to load energy state:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, energyService, onEnergyChange])

  // 일일 보너스 수령
  const claimDailyBonus = async () => {
    try {
      const result = await energyService.claimDailyBonus(userId)
      setEnergyState(result)
      setDisplayEnergy(result.energy.current)
      setCanClaimBonus(false)
      
      if (onEnergyChange) {
        onEnergyChange(result.energy.current)
      }
    } catch (error) {
      console.error('Failed to claim daily bonus:', error)
      alert(error.message)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadInitialState()
  }, [loadInitialState])

  // 스마트 업데이트 - 에너지가 최대치가 아닐 때만
  useEffect(() => {
    if (!energyState || energyState.energy.current >= energyState.energy.max) {
      return
    }

    // 다음 회복 시간 계산
    const timeToNext = energyService.getTimeUntilNextRegen(energyState)
    
    // 다음 회복 시점에 업데이트 예약 (visibility manager 사용)
    visibility.registerTimeout('energy-next-regen', () => {
      updateEnergyDisplay()
    }, timeToNext * 1000)

    // 매 초마다 카운트다운만 업데이트 (실제 API 호출 없음)
    visibility.registerInterval('energy-countdown', () => {
      setTimeUntilNext(prev => Math.max(0, prev - 1))
    }, 1000)

    // 클린업
    return () => {
      visibility.clearTimeout('energy-next-regen')
      visibility.clearInterval('energy-countdown')
    }
  }, [energyState, updateEnergyDisplay, energyService, visibility])

  // 사용자 상호작용 시 업데이트
  useEffect(() => {
    const handleUserInteraction = () => {
      updateEnergyDisplay()
    }

    // 페이지 포커스 시 업데이트
    const handleFocus = () => {
      energyService.invalidateCache(userId)
      loadInitialState()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('click', handleUserInteraction)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('click', handleUserInteraction)
    }
  }, [updateEnergyDisplay, loadInitialState, userId, energyService])

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    } else {
      return `0:${secs.toString().padStart(2, '0')}`
    }
  }

  if (loading || !energyState) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">
          {displayEnergy}/{energyState.energy.max}
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
          <span className="text-sm font-medium" data-testid="energy-display">
            {displayEnergy}/{energyState.energy.max}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(displayEnergy / energyState.energy.max) * 100}%` }}
          />
        </div>
      </div>

      {/* 회복 타이머 - 필요할 때만 표시 */}
      {displayEnergy < energyState.energy.max && timeUntilNext > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            다음 회복: {formatTime(timeUntilNext)}
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