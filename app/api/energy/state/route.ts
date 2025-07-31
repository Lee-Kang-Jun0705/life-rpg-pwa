import { NextRequest, NextResponse } from 'next/server'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { ENERGY_CONFIG } from '@/lib/types/energy'

// 간단한 메모리 저장소 (실제로는 데이터베이스 사용)
const energyStates = new Map<string, {
  current: number
  max: number
  lastUpdate: Date
}>()

export async function GET(request: NextRequest) {
  try {
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    // 저장된 상태가 없으면 기본값 생성
    if (!energyStates.has(userId)) {
      energyStates.set(userId, {
        current: ENERGY_CONFIG.MAX_ENERGY,
        max: ENERGY_CONFIG.MAX_ENERGY,
        lastUpdate: new Date()
      })
    }
    
    const state = energyStates.get(userId)!
    
    // 시간 경과에 따른 에너지 회복 계산
    const now = new Date()
    const timePassed = now.getTime() - state.lastUpdate.getTime()
    const regenCycles = Math.floor(timePassed / (ENERGY_CONFIG.REGEN_INTERVAL * 1000))
    
    if (regenCycles > 0) {
      state.current = Math.min(
        state.current + (regenCycles * ENERGY_CONFIG.REGEN_RATE),
        state.max
      )
      state.lastUpdate = now
    }
    
    return NextResponse.json({
      energy: {
        current: state.current,
        max: state.max,
        regenRate: ENERGY_CONFIG.REGEN_RATE,
        regenTime: ENERGY_CONFIG.REGEN_INTERVAL
      }
    })
  } catch (error) {
    console.error('Error fetching energy state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch energy state' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { amount, action } = await request.json()
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    const state = energyStates.get(userId) || {
      current: ENERGY_CONFIG.MAX_ENERGY,
      max: ENERGY_CONFIG.MAX_ENERGY,
      lastUpdate: new Date()
    }
    
    if (action === 'consume') {
      if (state.current < amount) {
        return NextResponse.json(
          { error: 'Not enough energy' },
          { status: 400 }
        )
      }
      state.current -= amount
    } else if (action === 'restore') {
      state.current = Math.min(state.current + amount, state.max)
    }
    
    state.lastUpdate = new Date()
    energyStates.set(userId, state)
    
    return NextResponse.json({
      energy: {
        current: state.current,
        max: state.max,
        regenRate: ENERGY_CONFIG.REGEN_RATE,
        regenTime: ENERGY_CONFIG.REGEN_INTERVAL
      }
    })
  } catch (error) {
    console.error('Error updating energy state:', error)
    return NextResponse.json(
      { error: 'Failed to update energy state' },
      { status: 500 }
    )
  }
}