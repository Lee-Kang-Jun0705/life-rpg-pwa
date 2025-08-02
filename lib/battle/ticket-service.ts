// 전투 티켓 시스템 서비스
// 자동전투 입장 시 필요한 티켓 관리

import { db } from '@/lib/database'
import type { BattleTicketData } from '@/lib/database'
import { GameError } from '@/lib/types/game-common'

export interface TicketState {
  count: number
  lastReset: Date
  nextResetTime: Date
  canUseFreeTicket: boolean
}

export interface TicketTransaction {
  id: string
  _userId: string
  type: 'use' | 'daily_reset' | 'purchase' | 'reward'
  _amount: number
  _reason: string
  timestamp: Date
  beforeAmount: number
  afterAmount: number
}

const TICKET_CONFIG = {
  DAILY_TICKETS: 10,
  MAX_TICKETS: 50,
  RESET_HOUR: 4, // 오전 4시 리셋
  PURCHASE_COST: 100, // 골드 비용
  PURCHASE_AMOUNT: 5
} as const

export class BattleTicketService {
  private static instance: BattleTicketService

  static getInstance(): BattleTicketService {
    if (!BattleTicketService.instance) {
      BattleTicketService.instance = new BattleTicketService()
    }
    return BattleTicketService.instance
  }

  // 티켓 상태 가져오기
  async getTicketState(_userId: string): Promise<TicketState> {
    try {
      let ticketData = await db.battleTickets
        .where('userId')
        .equals(userId)
        .first()

      // 없으면 초기화
      if (!ticketData) {
        ticketData = await this.initializeTickets(userId)
      }

      // 일일 리셋 체크
      const shouldReset = this.shouldResetTickets(ticketData.lastReset)
      if (shouldReset) {
        ticketData = await this.resetDailyTickets(userId)
      }

      // 다음 리셋 시간 계산
      const nextResetTime = this.getNextResetTime()

      return {
        count: ticketData.count,
        lastReset: ticketData.lastReset,
        nextResetTime,
        canUseFreeTicket: ticketData.count > 0
      }
    } catch (error) {
      throw new GameError(
        'TICKET_ERROR',
        '티켓 정보를 가져올 수 없습니다',
        { originalError: error }
      )
    }
  }

  // 티켓 사용
  async useTicket(_userId: string, _reason = '자동전투 입장'): Promise<boolean> {
    try {
      const ticketData = await db.battleTickets
        .where('userId')
        .equals(userId)
        .first()

      if (!ticketData || ticketData.count <= 0) {
        throw new GameError('TICKET_ERROR', '전투 티켓이 부족합니다')
      }

      const newCount = ticketData.count - 1

      // 티켓 차감
      await db.battleTickets
        .where('userId')
        .equals(userId)
        .modify({ count: newCount })

      // 트랜잭션 기록 (에너지 트랜잭션 테이블 활용)
      await db.energyTransactions.add({
        userId,
        type: 'consume',
        _amount: -1,
        _reason: `[티켓] ${reason}`,
        timestamp: new Date(),
        beforeAmount: ticketData.count,
        afterAmount: newCount
      })

      return true
    } catch (error) {
      if (error instanceof GameError) {
        throw error
      }

      throw new GameError(
        'TICKET_ERROR',
        '티켓 사용 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 티켓 구매
  async purchaseTickets(_userId: string, _goldCost: number): Promise<number> {
    try {
      const ticketData = await db.battleTickets
        .where('userId')
        .equals(userId)
        .first()

      if (!ticketData) {
        throw new GameError('TICKET_ERROR', '티켓 정보를 찾을 수 없습니다')
      }

      const newCount = Math.min(
        ticketData.count + TICKET_CONFIG.PURCHASE_AMOUNT,
        TICKET_CONFIG.MAX_TICKETS
      )

      const actualAmount = newCount - ticketData.count

      if (actualAmount === 0) {
        throw new GameError('TICKET_ERROR', '티켓 보유 한도에 도달했습니다')
      }

      // 티켓 추가
      await db.battleTickets
        .where('userId')
        .equals(userId)
        .modify({ count: newCount })

      // 트랜잭션 기록
      await db.energyTransactions.add({
        userId,
        type: 'purchase',
        _amount: actualAmount,
        _reason: '[티켓] 구매',
        timestamp: new Date(),
        beforeAmount: ticketData.count,
        afterAmount: newCount
      })

      return actualAmount
    } catch (error) {
      if (error instanceof GameError) {
        throw error
      }

      throw new GameError(
        'TICKET_ERROR',
        '티켓 구매 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 보상으로 티켓 획득
  async addTicketReward(_userId: string, _amount: number, _reason: string): Promise<void> {
    try {
      const ticketData = await db.battleTickets
        .where('userId')
        .equals(userId)
        .first()

      if (!ticketData) {
        throw new GameError('TICKET_ERROR', '티켓 정보를 찾을 수 없습니다')
      }

      const newCount = Math.min(
        ticketData.count + amount,
        TICKET_CONFIG.MAX_TICKETS
      )

      // 티켓 추가
      await db.battleTickets
        .where('userId')
        .equals(userId)
        .modify({ count: newCount })

      // 트랜잭션 기록
      await db.energyTransactions.add({
        userId,
        type: 'bonus',
        amount,
        _reason: `[티켓] ${reason}`,
        timestamp: new Date(),
        beforeAmount: ticketData.count,
        afterAmount: newCount
      })
    } catch (error) {
      if (error instanceof GameError) {
        throw error
      }

      throw new GameError(
        'TICKET_ERROR',
        '티켓 보상 지급 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 티켓 초기화
  private async initializeTickets(_userId: string): Promise<BattleTicketData> {
    const initialData: BattleTicketData = {
      userId,
      count: TICKET_CONFIG.DAILY_TICKETS,
      lastReset: new Date()
    }

    const id = await db.battleTickets.add(initialData)
    return { ...initialData, id }
  }

  // 일일 티켓 리셋
  private async resetDailyTickets(_userId: string): Promise<BattleTicketData> {
    const newData = {
      count: TICKET_CONFIG.DAILY_TICKETS,
      lastReset: new Date()
    }

    await db.battleTickets
      .where('userId')
      .equals(userId)
      .modify(newData)

    // 트랜잭션 기록
    await db.energyTransactions.add({
      userId,
      type: 'bonus',
      _amount: TICKET_CONFIG.DAILY_TICKETS,
      _reason: '[티켓] 일일 리셋',
      timestamp: new Date(),
      beforeAmount: 0,
      afterAmount: TICKET_CONFIG.DAILY_TICKETS
    })

    const updated = await db.battleTickets
      .where('userId')
      .equals(userId)
      .first()

    return updated!
  }

  // 리셋 필요 여부 확인
  private shouldResetTickets(lastReset: Date): boolean {
    const now = new Date()
    const lastResetTime = new Date(lastReset)
    const nextResetTime = this.getNextResetTime(lastResetTime)

    return now >= nextResetTime
  }

  // 다음 리셋 시간 계산
  private getNextResetTime(from: Date = new Date()): Date {
    const next = new Date(from)
    next.setHours(TICKET_CONFIG.RESET_HOUR, 0, 0, 0)

    if (next <= from) {
      next.setDate(next.getDate() + 1)
    }

    return next
  }

  // 남은 시간 계산 (초 단위)
  async getTimeUntilReset(_userId: string): Promise<number> {
    const state = await this.getTicketState(userId)
    const now = new Date()
    return Math.floor((state.nextResetTime.getTime() - now.getTime()) / 1000)
  }
}

export default BattleTicketService
