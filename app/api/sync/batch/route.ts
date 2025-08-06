import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database/client'
import { EnergyService } from '@/lib/energy/energy-service'
import { BattleTicketService } from '@/lib/battle/ticket-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'

// 배치 요청 파라미터 타입 정의
type BatchRequestParams =
  | { userId?: string }
  | { limit?: number }
  | { filter?: string }
  | Record<string, string | number | boolean>

// 배치 응답 결과 타입 정의
interface EnergyState {
  currentEnergy: number
  maxEnergy: number
  lastRegenTime: number
  regenRate: number
}

interface TicketState {
  battleTickets: number
  maxTickets: number
  lastRegenTime: number
}

interface PlayerStats {
  level: number
  experience: number
  health: number
  learning: number
  relationship: number
  achievement: number
}

interface InventoryData {
  items: Array<{ id: string; name: string; quantity: number }>
}

type BatchResultData = EnergyState | TicketState | PlayerStats | InventoryData

// 배치 요청 타입
interface BatchRequest {
  requests: Array<{
    endpoint: string
    params?: BatchRequestParams
  }>
}

// 배치 응답 타입
interface BatchResponse {
  results: Record<string, BatchResultData>
  timestamp: number
  errors?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json()
    const userId = GAME_CONFIG.DEFAULT_USER_ID

    const results: Record<string, BatchResultData> = {}
    const errors: Record<string, string> = {}

    // 각 요청을 병렬로 처리
    const promises = body.requests.map(async(req) => {
      try {
        switch (req.endpoint) {
          case 'energy/state': {
            const energyService = EnergyService.getInstance()
            const energyState = await (energyService as any).getEnergyState(userId)
            results['energy/state'] = energyState
            break
          }

          case 'tickets/state': {
            const ticketService = BattleTicketService.getInstance()
            const ticketState = await ticketService.getTicketState(userId)
            results['tickets/state'] = ticketState as any
            break
          }

          case 'player/stats': {
            const playerStats = await dbHelpers.getStats(userId)
            // Stat[] 타입을 PlayerStats 타입으로 변환
            const formattedStats: PlayerStats = {
              level: 1,
              experience: 0,
              health: 0,
              learning: 0,
              relationship: 0,
              achievement: 0
            }
            
            // 각 스탯 타입별로 레벨 매핑
            playerStats.forEach(stat => {
              if (stat.type === 'health') formattedStats.health = stat.level
              else if (stat.type === 'learning') formattedStats.learning = stat.level
              else if (stat.type === 'relationship') formattedStats.relationship = stat.level
              else if (stat.type === 'achievement') formattedStats.achievement = stat.level
              
              // 총 경험치 계산
              formattedStats.experience += stat.experience
            })
            
            // 평균 레벨 계산
            const totalLevels = formattedStats.health + formattedStats.learning + 
                              formattedStats.relationship + formattedStats.achievement
            formattedStats.level = Math.floor(totalLevels / 4) || 1
            
            results['player/stats'] = formattedStats
            break
          }

          case 'player/inventory': {
            // 인벤토리 데이터 (추후 구현)
            results['player/inventory'] = { items: [] }
            break
          }

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
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Request'
    }
  })
}
