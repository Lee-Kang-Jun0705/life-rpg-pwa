'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { BattleTicketService, TicketState } from '@/lib/battle/ticket-service'
import { Ticket, Clock, Plus } from 'lucide-react'
import { useVisibilityManager } from '@/lib/utils/visibility-manager'

interface OptimizedBattleTicketDisplayProps {
  userId: string
  compact?: boolean
  onTicketChange?: (count: number) => void
  onPurchase?: () => void
}

export function OptimizedBattleTicketDisplay({
  userId,
  compact = false,
  onTicketChange,
  onPurchase
}: OptimizedBattleTicketDisplayProps) {
  const [ticketState, setTicketState] = useState<TicketState | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayTime, setDisplayTime] = useState<string>('0:00')
  const nextResetTime = useRef<Date | null>(null)

  const ticketService = BattleTicketService.getInstance()
  const visibility = useVisibilityManager()

  // 티켓 상태 로드
  const loadTicketState = useCallback(async() => {
    try {
      const state = await ticketService.getTicketState(userId)
      setTicketState(state)

      // 다음 리셋 시간 계산 (매일 오전 5시)
      const now = new Date()
      const reset = new Date()
      reset.setHours(5, 0, 0, 0)

      if (reset <= now) {
        reset.setDate(reset.getDate() + 1)
      }

      nextResetTime.current = reset

      if (onTicketChange) {
        onTicketChange(state.count)
      }
    } catch (error) {
      console.error('Failed to load ticket state:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, ticketService, onTicketChange])

  // 시간 표시 업데이트 (실제 서버 호출 없음)
  const updateTimeDisplay = useCallback(() => {
    if (!nextResetTime.current) {
      return
    }

    const now = new Date()
    const diff = nextResetTime.current.getTime() - now.getTime()

    if (diff <= 0) {
      // 리셋 시간이 지났으면 새로 로드
      loadTicketState()
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 0) {
      setDisplayTime(`${hours}시간 ${minutes}분`)
    } else if (minutes > 0) {
      setDisplayTime(`${minutes}분 ${seconds}초`)
    } else {
      setDisplayTime(`${seconds}초`)
    }
  }, [loadTicketState])

  // 초기 로드
  useEffect(() => {
    loadTicketState()
  }, [loadTicketState])

  // 시간 표시만 업데이트 (실제 계산은 클라이언트에서)
  useEffect(() => {
    if (!ticketState || !nextResetTime.current) {
      return
    }

    // 초기 표시
    updateTimeDisplay()

    // 남은 시간에 따라 업데이트 주기 결정
    const now = new Date()
    const diff = nextResetTime.current.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    // 1시간 이상 남았으면 분 단위로만 업데이트
    const updateInterval = hours > 0 ? 60000 : 1000

    // visibility manager 사용하여 인터벌 등록
    visibility.registerInterval('ticket-countdown', updateTimeDisplay, updateInterval)

    return () => visibility.clearInterval('ticket-countdown')
  }, [ticketState, updateTimeDisplay, visibility])

  // 페이지 포커스 시 상태 재확인
  useEffect(() => {
    const handleFocus = () => {
      // 실제로 시간이 많이 지났을 때만 업데이트
      if (nextResetTime.current && new Date() > nextResetTime.current) {
        loadTicketState()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadTicketState])

  // 티켓 구매
  const handlePurchase = async() => {
    if (!onPurchase) {
      return
    }

    await onPurchase()
    // 구매 후 상태 새로고침
    loadTicketState()
  }

  if (loading || !ticketState) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32" />
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Ticket className="w-4 h-4 text-purple-500" />
        <span className="font-medium">{ticketState.count}장</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      {/* 티켓 정보 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-500" />
            <span className="font-medium">전투 티켓</span>
          </div>
          <span className="text-lg font-bold text-purple-600" data-testid="ticket-display">
            {ticketState.count}장
          </span>
        </div>

        <div className="text-sm text-gray-600">
          매일 오전 5시에 10장 지급
        </div>
      </div>

      {/* 리셋 타이머 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>
          다음 리셋: {displayTime}
        </span>
      </div>

      {/* 구매 버튼 */}
      {onPurchase && ticketState.count < 50 && (
        <button
          onClick={handlePurchase}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">티켓 구매 (100 골드)</span>
        </button>
      )}

      {/* 최대 보유량 안내 */}
      {ticketState.count >= 50 && (
        <div className="text-xs text-red-500 text-center">
          최대 보유량 도달 (50장)
        </div>
      )}
    </div>
  )
}
