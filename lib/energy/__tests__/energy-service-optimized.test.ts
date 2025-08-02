import { OptimizedEnergyService } from '../energy-service-optimized'
import { ENERGY_CONFIG } from '@/lib/types/energy'

// Mock database helpers
jest.mock('@/lib/database/client', () => ({
  dbHelpers: {
    loadPlayerEnergyState: jest.fn(),
    savePlayerEnergyState: jest.fn(),
    addActivity: jest.fn()
  }
}))

import { dbHelpers } from '@/lib/database/client'

describe('OptimizedEnergyService', () => {
  let service: OptimizedEnergyService
  const mockUserId = 'test-user-123'
  const mockDate = new Date('2024-01-01T12:00:00Z')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
    service = OptimizedEnergyService.getInstance()
    service.invalidateCache(mockUserId)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('calculateOfflineRecovery', () => {
    it('should calculate correct offline recovery within 24 hours', async() => {
      const lastUpdate = new Date('2024-01-01T10:00:00Z') // 2 hours ago
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: lastUpdate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: lastUpdate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateOfflineRecovery(mockUserId)

      // 2 hours = 120 minutes = 12 regen cycles (10 min each)
      // 12 * 1 = 12 energy gained
      expect(result.energy.current).toBe(62) // 50 + 12
      expect(result.lastEnergyUpdate).toEqual(mockDate)
    })

    it('should cap offline recovery at 24 hours', async() => {
      const lastUpdate = new Date('2023-12-29T12:00:00Z') // 3 days ago
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 0,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: lastUpdate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: lastUpdate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateOfflineRecovery(mockUserId)

      // 24 hours = 1440 minutes = 144 regen cycles
      // 144 * 1 = 144 energy, but capped at max (120)
      expect(result.energy.current).toBe(ENERGY_CONFIG.MAX_ENERGY)
    })

    it('should not exceed max energy', async() => {
      const lastUpdate = new Date('2024-01-01T11:50:00Z') // 10 minutes ago
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 119,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: lastUpdate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: lastUpdate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateOfflineRecovery(mockUserId)

      // Should cap at max energy
      expect(result.energy.current).toBe(ENERGY_CONFIG.MAX_ENERGY)
    })
  })

  describe('consumeEnergy', () => {
    it('should consume energy when sufficient', async() => {
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      const result = await service.consumeEnergy(mockUserId, 20, 'dungeon')

      expect(result.success).toBe(true)
      expect(result.energy?.current).toBe(30)
      expect(dbHelpers.savePlayerEnergyState).toHaveBeenCalled()
    })

    it('should fail when insufficient energy', async() => {
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 10,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.consumeEnergy(mockUserId, 20, 'dungeon')

      expect(result.success).toBe(false)
      expect(result.error).toBe('에너지가 부족합니다')
      expect(dbHelpers.savePlayerEnergyState).not.toHaveBeenCalled()
    })
  })

  describe('claimDailyBonus', () => {
    it('should grant daily bonus when eligible', async() => {
      const lastBonus = new Date('2023-12-31T12:00:00Z') // Yesterday
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        lastDailyBonus: lastBonus,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      const result = await service.claimDailyBonus(mockUserId)

      expect(result.energy.current).toBe(80) // 50 + 30
      expect(result.lastDailyBonus).toEqual(mockDate)
    })

    it('should fail when already claimed today', async() => {
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        lastDailyBonus: mockDate, // Already claimed today
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      await expect(service.claimDailyBonus(mockUserId))
        .rejects.toThrow('일일 보너스는 24시간마다 한 번만 받을 수 있습니다')
    })
  })

  describe('getTimeUntilNextRegen', () => {
    it('should calculate correct time until next regen', () => {
      const lastRegen = new Date('2024-01-01T11:55:00Z') // 5 minutes ago
      const state = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: lastRegen,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: lastRegen,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      const timeUntilNext = service.getTimeUntilNextRegen(state)

      // 5 minutes passed, 5 minutes remaining until next regen
      expect(timeUntilNext).toBe(300) // 5 minutes in seconds
    })

    it('should return 0 when energy is full', () => {
      const state = {
        userId: mockUserId,
        energy: {
          current: ENERGY_CONFIG.MAX_ENERGY,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      const timeUntilNext = service.getTimeUntilNextRegen(state)

      expect(timeUntilNext).toBe(0)
    })
  })

  describe('caching', () => {
    it('should use cached data within cache duration', async() => {
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      // First call - loads from database
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(1)

      // Second call - uses cache
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache after duration', async() => {
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: mockDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: mockDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      // First call
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(1)

      // Advance time beyond cache duration
      jest.advanceTimersByTime(60000) // 1 minute

      // Should load from database again
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(2)
    })
  })
})
