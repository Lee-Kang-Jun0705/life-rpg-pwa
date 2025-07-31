import { NextRequest, NextResponse } from 'next/server'
import { EnergyService } from '@/lib/services/energy-service'
import { BattleTicketService } from '@/lib/battle/ticket-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { ENERGY_CONFIG } from '@/lib/types/energy'

export async function POST(request: NextRequest) {
  try {
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    const energyService = EnergyService.getInstance()
    const ticketService = BattleTicketService.getInstance()

    // 현재 상태 가져오기
    const energyState = await energyService.getEnergyState(userId)
    const ticketState = await ticketService.getTicketState(userId)

    // 변경 사항 확인
    const energyFull = energyState.energy.current >= ENERGY_CONFIG.MAX_ENERGY
    const ticketsReset = ticketState.lastReset && 
      new Date(ticketState.lastReset).toDateString() !== new Date().toDateString()

    // 응답
    return NextResponse.json({
      energy: {
        current: energyState.energy.current,
        max: energyState.energy.max,
        isFull: energyFull
      },
      tickets: {
        count: ticketState.count,
        wasReset: ticketsReset
      },
      energyFull,
      ticketsReset,
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Energy/Ticket sync failed' },
      { status: 500 }
    )
  }
}