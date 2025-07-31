// 에너지 시스템 전용 데이터베이스
import Dexie, { Table } from 'dexie'
import type { 
  EnergyTransaction
} from './types/energy'

// Energy system data interfaces
export interface PlayerEnergyData {
  id?: number
  userId: string
  current: number
  max: number
  lastRegenTime: Date
  lastDailyBonus?: Date
}

export interface BattleTicketData {
  id?: number
  userId: string
  count: number
  lastReset: Date
}

export interface DailyContentData {
  id?: number
  userId: string
  type: 'mission' | 'dungeon' | 'login' | 'weekly' | 'state'
  contentId: string
  data: string // JSON stringified data
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

// Energy Database
export class EnergyDatabase extends Dexie {
  playerEnergy!: Table<PlayerEnergyData>
  battleTickets!: Table<BattleTicketData>
  energyTransactions!: Table<EnergyTransaction>
  dailyContent!: Table<DailyContentData>

  constructor() {
    super('LifeRPGEnergyDB')

    this.version(1).stores({
      playerEnergy: '++id, userId',
      battleTickets: '++id, userId',
      energyTransactions: '++id, userId, timestamp'
    })

    this.version(2).stores({
      playerEnergy: '++id, userId',
      battleTickets: '++id, userId',
      energyTransactions: '++id, userId, timestamp',
      dailyContent: '++id, [userId+type], contentId, createdAt, expiresAt'
    })
  }
}

// Create database instance
export const energyDb = new EnergyDatabase()

// Helper functions
export const energyDbHelpers = {
  // 플레이어 에너지 초기화
  async initializePlayerEnergy(userId: string): Promise<PlayerEnergyData> {
    const existing = await energyDb.playerEnergy
      .where('userId')
      .equals(userId)
      .first()

    if (existing) {
      return existing
    }

    const initialEnergy: PlayerEnergyData = {
      userId,
      current: 120, // 시작 시 최대 에너지
      max: 120,
      lastRegenTime: new Date()
    }

    const id = await energyDb.playerEnergy.add(initialEnergy)
    return { ...initialEnergy, id }
  },

  // 전투 티켓 초기화
  async initializeBattleTickets(userId: string): Promise<BattleTicketData> {
    const existing = await energyDb.battleTickets
      .where('userId')
      .equals(userId)
      .first()

    if (existing) {
      return existing
    }

    const initialTickets: BattleTicketData = {
      userId,
      count: 10,
      lastReset: new Date()
    }

    const id = await energyDb.battleTickets.add(initialTickets)
    return { ...initialTickets, id }
  },

  // 에너지 트랜잭션 기록
  async recordEnergyTransaction(transaction: EnergyTransaction): Promise<void> {
    await energyDb.energyTransactions.add(transaction)
  },

  // 오래된 트랜잭션 정리 (30일 이상)
  async cleanupOldTransactions(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await energyDb.energyTransactions
      .where('timestamp')
      .below(thirtyDaysAgo)
      .delete()
  }
}

export default energyDb