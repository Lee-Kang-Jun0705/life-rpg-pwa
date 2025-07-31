import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database/client'
import { EnergyService } from '@/lib/services/energy-service'
import { BattleTicketService } from '@/lib/battle/ticket-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'

// 배치 요청 타입
interface BatchRequest {
  requests: Array<{
    endpoint: string
    params?: Record<string, any>
  }>
}

// 배치 응답 타입
interface BatchResponse {
  results: Record<string, any>
  timestamp: number
  errors?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json()
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    const results: Record<string, any> = {}
    const errors: Record<string, string> = {}

    // 각 요청을 병렬로 처리
    const promises = body.requests.map(async (req) => {
      try {
        switch (req.endpoint) {
          case 'energy/state':
            const energyService = EnergyService.getInstance()
            const energyState = await energyService.getEnergy(userId)
            results['energy/state'] = energyState
            break

          case 'tickets/state':
            const ticketService = BattleTicketService.getInstance()
            const ticketState = await ticketService.getTicketState(userId)
            results['tickets/state'] = ticketState
            break

          case 'player/stats':
            const playerStats = await dbHelpers.getCharacterStatsList(userId)
            results['player/stats'] = playerStats
            break

          case 'player/inventory':
            // 인벤토리 데이터 (추후 구현)
            results['player/inventory'] = { items: [] }
            break

          default:
            errors[req.endpoint] = 'Unknown endpoint'
        }
      } catch (error) {
        errors[req.endpoint] = error instanceof Error ? error.message : 'Unknown error'
      }
    })

    await Promise.all(promises)

    const response: BatchResponse = {
      results,
      timestamp: Date.now(),
      ...(Object.keys(errors).length > 0 && { errors })
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: 'Batch sync failed' },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 지원 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Request',
    },
  })
}