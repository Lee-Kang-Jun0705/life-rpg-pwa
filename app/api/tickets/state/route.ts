import { NextRequest, NextResponse } from 'next/server'
import { GAME_CONFIG } from '@/lib/types/dashboard'

// 간단한 메모리 저장소
const ticketStates = new Map<string, {
  tickets: number
  lastReset: Date
}>()

export async function GET(request: NextRequest) {
  try {
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    // 저장된 상태가 없으면 기본값 생성
    if (!ticketStates.has(userId)) {
      ticketStates.set(userId, {
        tickets: 10,
        lastReset: new Date()
      })
    }
    
    const state = ticketStates.get(userId)!
    
    // 매일 오전 5시 리셋 체크
    const now = new Date()
    const today5AM = new Date(now)
    today5AM.setHours(5, 0, 0, 0)
    
    if (now.getHours() < 5) {
      today5AM.setDate(today5AM.getDate() - 1)
    }
    
    if (state.lastReset < today5AM) {
      state.tickets = 10
      state.lastReset = today5AM
    }
    
    return NextResponse.json({
      tickets: state.tickets,
      maxTickets: 10,
      nextResetTime: new Date(today5AM.getTime() + 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Error fetching ticket state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket state' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, action } = await request.json()
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    const state = ticketStates.get(userId) || {
      tickets: 10,
      lastReset: new Date()
    }
    
    if (action === 'consume') {
      if (state.tickets < amount) {
        return NextResponse.json(
          { error: 'Not enough tickets' },
          { status: 400 }
        )
      }
      state.tickets -= amount
    } else if (action === 'add') {
      state.tickets = Math.min(state.tickets + amount, 10)
    }
    
    ticketStates.set(userId, state)
    
    return NextResponse.json({
      tickets: state.tickets,
      maxTickets: 10
    })
  } catch (error) {
    console.error('Error updating ticket state:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket state' },
      { status: 500 }
    )
  }
}