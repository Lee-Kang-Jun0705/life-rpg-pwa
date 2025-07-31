'use client'

import React, { useEffect, useState } from 'react'
import { BattleTicketService, TicketState } from '@/lib/battle/ticket-service'
import { Ticket, Clock, Plus } from 'lucide-react'

interface BattleTicketDisplayProps {
  userId: string
  compact?: boolean
  onTicketChange?: (count: number) => void
  onPurchase?: () => void
}

export function BattleTicketDisplay({ 
  userId, 
  compact = false, 
  onTicketChange,
  onPurchase 
}: BattleTicketDisplayProps) {
  const [ticketState, setTicketState] = useState<TicketState | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeUntilReset, setTimeUntilReset] = useState(0)
  
  const ticketService = BattleTicketService.getInstance()

  // 티켓 상태 로드
  const loadTicketState = async () => {
    try {
      const state = await ticketService.getTicketState(userId)
      setTicketState(state)
      
      if (onTicketChange) {
        onTicketChange(state.count)
      }
    } catch (error) {
      console.error('Failed to load ticket state:', error)
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadTicketState()
    
    // 1분마다 업데이트
    const interval = setInterval(loadTicketState, 60000)
    
    return () => clearInterval(interval)
  }, [userId])

  // 리셋 시간 카운트다운
  useEffect(() => {
    if (!ticketState) return

    const updateCountdown = async () => {
      const seconds = await ticketService.getTimeUntilReset(userId)
      setTimeUntilReset(seconds)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [ticketState, userId])

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`
    } else {
      return `${secs}초`
    }
  }

  if (loading || !ticketState) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
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
          <span className="text-lg font-bold text-purple-600">
            {ticketState.count}장
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          매일 10장씩 지급됩니다
        </div>
      </div>

      {/* 리셋 타이머 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>
          다음 리셋: {formatTime(timeUntilReset)}
        </span>
      </div>

      {/* 구매 버튼 */}
      {onPurchase && ticketState.count < 50 && (
        <button
          onClick={onPurchase}
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