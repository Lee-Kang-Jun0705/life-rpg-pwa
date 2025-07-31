import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { dungeonIntegrationService } from '@/lib/services/dungeon-integration.service'
import { dungeonService } from '@/lib/services/dungeon-service'
import { characterIntegrationService } from '@/lib/services/character-integration.service'
import type { Character } from '@/lib/types/game-core'
import type { Dungeon } from '@/lib/types/dungeon'

// Mock 설정
jest.mock('@/lib/services/character-integration.service')
jest.mock('@/lib/services/dungeon-service')
jest.mock('@/lib/database/client')

describe('DungeonIntegrationService', () => {
  let mockCharacter: Character
  let mockDungeon: Dungeon

  beforeEach(() => {
    // 모든 mock 초기화
    jest.clearAllMocks()

    // 테스트용 캐릭터
    mockCharacter = {
      id: 'test-user',
      name: '테스트 용사',
      level: 5,
      experience: 1000,
      coreStats: {
        health: 5,
        learning: 3,
        relationship: 2,
        achievement: 4
      },
      combatStats: {
        hp: 500,
        maxHp: 500,
        attack: 50,
        defense: 30,
        critRate: 0.1,
        critDamage: 1.5,
        dodge: 0.05,
        accuracy: 0.9,
        resistance: 0
      },
      energy: 100,
      maxEnergy: 100,
      gold: 1000,
      gems: 10,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }

    // 테스트용 던전
    mockDungeon = {
      id: 'test-dungeon',
      name: '테스트 던전',
      description: '테스트를 위한 던전',
      type: 'story',
      difficulty: 'easy',
      icon: '🧪',
      requirements: {
        level: 1,
        energy: 5
      },
      rewards: {
        exp: 100,
        gold: 50,
        items: []
      },
      stages: 3,
      estimatedTime: 10,
      recommendedCombatPower: 100,
      status: 'available',
      clearedCount: 0
    }

    // Mock 함수 설정
    const mockCharacterService = characterIntegrationService as jest.Mocked<typeof characterIntegrationService>
    mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)
    mockCharacterService.useEnergy.mockResolvedValue()

    const mockDungeonServiceInstance = dungeonService as jest.Mocked<typeof dungeonService>
    mockDungeonServiceInstance.getDungeon.mockResolvedValue(mockDungeon)
  })

  describe('던전 입장', () => {
    it('정상적으로 던전에 입장할 수 있어야 한다', async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(result.success).toBe(true)
      expect(result.sessionId).toBeTruthy()
      expect(result.error).toBeUndefined()
    })

    it('캐릭터를 찾을 수 없으면 실패해야 한다', async () => {
      const mockCharacterService = characterIntegrationService as jest.Mocked<typeof characterIntegrationService>
      mockCharacterService.getCharacter.mockResolvedValue(null)

      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(result.success).toBe(false)
      expect(result.error).toBe('캐릭터를 찾을 수 없습니다.')
    })

    it('던전을 찾을 수 없으면 실패해야 한다', async () => {
      const mockDungeonServiceInstance = dungeonService as jest.Mocked<typeof dungeonService>
      mockDungeonServiceInstance.getDungeon.mockResolvedValue(null)

      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(result.success).toBe(false)
      expect(result.error).toBe('던전을 찾을 수 없습니다.')
    })

    it('레벨이 부족하면 입장할 수 없어야 한다', async () => {
      mockDungeon.requirements.level = 10 // 플레이어 레벨(5)보다 높게 설정

      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(result.success).toBe(false)
      expect(result.error).toContain('레벨')
    })

    it('에너지가 부족하면 입장할 수 없어야 한다', async () => {
      mockCharacter.energy = 0 // 에너지를 0으로 설정

      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(result.success).toBe(false)
      expect(result.error).toBe('에너지가 부족합니다.')
    })

    it('입장 성공 시 에너지가 차감되어야 한다', async () => {
      const mockCharacterService = characterIntegrationService as jest.Mocked<typeof characterIntegrationService>
      
      await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')

      expect(mockCharacterService.useEnergy).toHaveBeenCalledWith('test-user', mockDungeon.requirements.energy)
    })
  })

  describe('세션 관리', () => {
    it('입장 시 세션이 생성되어야 한다', async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      
      expect(result.sessionId).toBeTruthy()
      
      const session = dungeonIntegrationService.getSession(result.sessionId!)
      expect(session).toBeTruthy()
      expect(session?.userId).toBe('test-user')
      expect(session?.dungeonId).toBe('test-dungeon')
    })

    it('세션에 진행 상황이 포함되어야 한다', async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      const session = dungeonIntegrationService.getSession(result.sessionId!)

      expect(session?.progress).toBeTruthy()
      expect(session?.progress.status).toBe('in_progress')
      expect(session?.progress.currentStage).toBe(1)
      expect(session?.progress.totalStages).toBe(mockDungeon.stages)
    })

    it('세션에 보상 정보가 초기화되어야 한다', async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      const session = dungeonIntegrationService.getSession(result.sessionId!)

      expect(session?.rewards).toEqual({
        exp: 0,
        gold: 0,
        items: []
      })
    })
  })

  describe('스테이지 진행', () => {
    let sessionId: string

    beforeEach(async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      sessionId = result.sessionId!
    })

    it('다음 스테이지로 진행할 수 있어야 한다', async () => {
      const result = await dungeonIntegrationService.proceedToNextStage(sessionId)

      expect(result.success).toBe(true)
      expect(result.combatId).toBeTruthy()

      const session = dungeonIntegrationService.getSession(sessionId)
      expect(session?.progress.currentStage).toBe(2)
    })

    it('마지막 스테이지 이후에는 진행할 수 없어야 한다', async () => {
      const session = dungeonIntegrationService.getSession(sessionId)
      if (session) {
        session.progress.currentStage = mockDungeon.stages
      }

      const result = await dungeonIntegrationService.proceedToNextStage(sessionId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('모든 스테이지를 완료')
    })

    it('존재하지 않는 세션은 진행할 수 없어야 한다', async () => {
      const result = await dungeonIntegrationService.proceedToNextStage('invalid-session')

      expect(result.success).toBe(false)
      expect(result.error).toBe('세션을 찾을 수 없습니다.')
    })
  })

  describe('던전 포기', () => {
    let sessionId: string

    beforeEach(async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      sessionId = result.sessionId!
    })

    it('던전을 포기할 수 있어야 한다', async () => {
      await dungeonIntegrationService.abandonDungeon(sessionId)

      const session = dungeonIntegrationService.getSession(sessionId)
      expect(session?.progress.status).toBe('failed')
    })
  })

  describe('전투 행동 실행', () => {
    let sessionId: string
    let combatId: string

    beforeEach(async () => {
      const result = await dungeonIntegrationService.enterDungeon('test-user', 'test-dungeon')
      sessionId = result.sessionId!
      const session = dungeonIntegrationService.getSession(sessionId)
      combatId = session?.currentCombatId || ''
    })

    it('전투 행동을 실행할 수 있어야 한다', async () => {
      const action = {
        type: 'attack' as const,
        targetId: 'enemy_0'
      }

      const result = await dungeonIntegrationService.executeAction(sessionId, action)

      expect(result.success).toBe(true)
    })

    it('세션이 없으면 행동을 실행할 수 없어야 한다', async () => {
      const action = {
        type: 'attack' as const,
        targetId: 'enemy_0'
      }

      const result = await dungeonIntegrationService.executeAction('invalid-session', action)

      expect(result.success).toBe(false)
      expect(result.error).toBe('진행 중인 전투가 없습니다.')
    })
  })
})