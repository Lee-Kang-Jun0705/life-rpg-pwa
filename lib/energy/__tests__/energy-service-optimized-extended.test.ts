import { OptimizedEnergyService } from '../energy-service-optimized'
import { ENERGY_CONFIG } from '@/lib/types/energy'
import type { PlayerEnergyState } from '@/lib/types/energy'

// Mock database helpers
jest.mock('@/lib/database/client', () => ({
  dbHelpers: {
    loadPlayerEnergyState: jest.fn(),
    savePlayerEnergyState: jest.fn(),
    addActivity: jest.fn(),
  }
}))

// Mock performance utilities
jest.mock('@/lib/utils/performance', () => ({
  performanceMonitor: {
    startTimer: jest.fn(() => ({
      end: jest.fn()
    })),
    recordMetric: jest.fn(),
    getMetrics: jest.fn(() => ({
      dbQueries: { count: 0, totalTime: 0, avgTime: 0 },
      cacheHits: { count: 0, hitRate: 0 },
      energyCalculations: { count: 0, totalTime: 0, avgTime: 0 }
    }))
  }
}))

import { dbHelpers } from '@/lib/database/client'
import { performanceMonitor } from '@/lib/utils/performance'

describe('OptimizedEnergyService - Extended Tests', () => {
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

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed')
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockRejectedValue(dbError)

      await expect(service.calculateEnergyState(mockUserId)).rejects.toThrow(dbError)
    })

    it('should handle invalid user ID', async () => {
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(null)

      await expect(service.calculateEnergyState('')).rejects.toThrow()
    })

    it('should handle corrupted state data', async () => {
      const corruptedState = {
        userId: mockUserId,
        energy: null, // Invalid energy object
        battleTickets: 10,
        lastEnergyUpdate: mockDate
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(corruptedState)

      await expect(service.calculateEnergyState(mockUserId)).rejects.toThrow()
    })

    it('should handle extreme time differences', async () => {
      const veryOldDate = new Date('2020-01-01T00:00:00Z')
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 0,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: veryOldDate,
          regenRate: ENERGY_CONFIG.REGEN_RATE
        },
        battleTickets: 10,
        lastEnergyUpdate: veryOldDate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateOfflineRecovery(mockUserId)
      
      // Should cap at max energy despite years of offline time
      expect(result.energy.current).toBe(ENERGY_CONFIG.MAX_ENERGY)
    })
  })

  describe('Performance Optimizations', () => {
    it('should track performance metrics', async () => {
      const mockState = createMockEnergyState()
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      await service.calculateEnergyState(mockUserId)

      expect(performanceMonitor.startTimer).toHaveBeenCalledWith('dbQuery')
      expect(performanceMonitor.recordMetric).toHaveBeenCalled()
    })

    it('should batch multiple requests efficiently', async () => {
      const mockState = createMockEnergyState()
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      // Simulate multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        service.calculateEnergyState(mockUserId)
      )

      await Promise.all(promises)

      // Should only load from DB once due to caching
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(1)
    })

    it('should handle cache invalidation correctly', async () => {
      const mockState = createMockEnergyState()
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      // First call
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(1)

      // Invalidate cache
      service.invalidateCache(mockUserId)

      // Second call should hit DB again
      await service.calculateEnergyState(mockUserId)
      expect(dbHelpers.loadPlayerEnergyState).toHaveBeenCalledTimes(2)
    })
  })

  describe('Energy Regeneration Logic', () => {
    it('should calculate partial regeneration correctly', async () => {
      const lastUpdate = new Date('2024-01-01T11:55:30Z') // 4.5 minutes ago
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

      // No regen should occur as it's less than 10 minutes
      expect(result.energy.current).toBe(50)
    })

    it('should handle premium regen rates', async () => {
      const lastUpdate = new Date('2024-01-01T10:00:00Z') // 2 hours ago
      const mockState = {
        userId: mockUserId,
        energy: {
          current: 50,
          max: ENERGY_CONFIG.MAX_ENERGY,
          lastRegenTime: lastUpdate,
          regenRate: 2 // Premium rate
        },
        battleTickets: 10,
        lastEnergyUpdate: lastUpdate,
        energyPotions: [],
        premiumTickets: [],
        transactions: []
      }

      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateOfflineRecovery(mockUserId)

      // 2 hours = 12 cycles × 2 energy = 24 energy
      expect(result.energy.current).toBe(74) // 50 + 24
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent consume operations', async () => {
      const mockState = createMockEnergyState(100)
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      // Simulate concurrent consumption
      const promises = [
        service.consumeEnergy(mockUserId, 20, 'dungeon'),
        service.consumeEnergy(mockUserId, 30, 'battle'),
        service.consumeEnergy(mockUserId, 40, 'skill')
      ]

      const results = await Promise.all(promises)

      // All should succeed as total is 90 < 100
      expect(results.every(r => r.success)).toBe(true)
      
      // Final state should reflect all consumptions
      const finalCalls = (dbHelpers.savePlayerEnergyState as jest.Mock).mock.calls
      const lastCall = finalCalls[finalCalls.length - 1]
      const savedState = lastCall[0]
      
      expect(savedState.energy.current).toBe(10) // 100 - 90
    })

    it('should prevent over-consumption with concurrent requests', async () => {
      const mockState = createMockEnergyState(50)
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      // Try to consume more than available
      const promises = [
        service.consumeEnergy(mockUserId, 30, 'dungeon'),
        service.consumeEnergy(mockUserId, 30, 'battle'),
        service.consumeEnergy(mockUserId, 30, 'skill')
      ]

      const results = await Promise.all(promises)

      // At least one should fail
      const successCount = results.filter(r => r.success).length
      expect(successCount).toBeLessThan(3)
      
      // Total consumed should not exceed available
      const finalCalls = (dbHelpers.savePlayerEnergyState as jest.Mock).mock.calls
      if (finalCalls.length > 0) {
        const lastCall = finalCalls[finalCalls.length - 1]
        const savedState = lastCall[0]
        expect(savedState.energy.current).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Event System', () => {
    it('should emit events on energy changes', async () => {
      const mockState = createMockEnergyState(50)
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      const events: unknown[] = []
      const listener = (event: unknown) => events.push(event)
      
      // Add event listener
      service.addEventListener('energyChanged', listener)

      await service.consumeEnergy(mockUserId, 20, 'dungeon')

      expect(events).toHaveLength(1)
      expect(events[0].detail.userId).toBe(mockUserId)
      expect(events[0].detail.energy.current).toBe(30)

      // Clean up
      service.removeEventListener('energyChanged', listener)
    })

    it('should emit daily bonus claimed event', async () => {
      const lastBonus = new Date('2023-12-31T12:00:00Z')
      const mockState = createMockEnergyState(50, lastBonus)
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)
      ;(dbHelpers.savePlayerEnergyState as jest.Mock).mockResolvedValue(undefined)

      const events: unknown[] = []
      const listener = (event: unknown) => events.push(event)
      
      service.addEventListener('dailyBonusClaimed', listener)

      await service.claimDailyBonus(mockUserId)

      expect(events).toHaveLength(1)
      expect(events[0].detail.bonusAmount).toBe(30)

      service.removeEventListener('dailyBonusClaimed', listener)
    })
  })

  describe('Time Until Full Calculation', () => {
    it('should calculate correct time until full energy', () => {
      const state = createMockEnergyState(60)
      
      const timeUntilFull = service.getTimeUntilFull(state)
      
      // Need 60 energy to full, at 1 per 10 min = 600 minutes
      expect(timeUntilFull).toBe(36000) // 600 minutes in seconds
    })

    it('should return 0 when energy is already full', () => {
      const state = createMockEnergyState(ENERGY_CONFIG.MAX_ENERGY)
      
      const timeUntilFull = service.getTimeUntilFull(state)
      
      expect(timeUntilFull).toBe(0)
    })
  })

  describe('State Validation', () => {
    it('should validate energy boundaries', async () => {
      const mockState = createMockEnergyState(150) // Over max
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateEnergyState(mockUserId)
      
      // Should cap at max
      expect(result.energy.current).toBe(ENERGY_CONFIG.MAX_ENERGY)
    })

    it('should validate negative energy', async () => {
      const mockState = createMockEnergyState(-10) // Negative
      ;(dbHelpers.loadPlayerEnergyState as jest.Mock).mockResolvedValue(mockState)

      const result = await service.calculateEnergyState(mockUserId)
      
      // Should floor at 0
      expect(result.energy.current).toBe(0)
    })
  })
})

// Helper function to create mock energy state
function createMockEnergyState(
  currentEnergy: number = 50,
  lastDailyBonus?: Date
): PlayerEnergyState {
  return {
    userId: 'test-user-123',
    energy: {
      current: currentEnergy,
      max: ENERGY_CONFIG.MAX_ENERGY,
      lastRegenTime: new Date('2024-01-01T12:00:00Z'),
      regenRate: ENERGY_CONFIG.REGEN_RATE
    },
    battleTickets: 10,
    lastEnergyUpdate: new Date('2024-01-01T12:00:00Z'),
    lastDailyBonus,
    energyPotions: [],
    premiumTickets: [],
    transactions: []
  }
}