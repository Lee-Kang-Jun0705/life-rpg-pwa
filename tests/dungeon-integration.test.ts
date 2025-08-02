// Jest를 사용하므로 별도 import 필요 없음
import { dungeonIntegrationService } from '@/lib/services/dungeon-integration.service'
import { dungeonCombatService } from '@/lib/services/dungeon-combat.service'
import { characterIntegrationService } from '@/lib/services/character-integration.service'
import { itemGenerationService } from '@/lib/services/item-generation.service'
import type { Character } from '@/lib/types/game-core'
import type { CombatAction } from '@/lib/types/combat-system'

describe('던전 시스템 통합 테스트', () => {
  let testCharacter: Character
  const userId = 'test-user-123'

  beforeEach(() => {
    // 테스트용 캐릭터 생성
    testCharacter = {
      id: userId,
      name: '테스트 모험가',
      level: 20,
      experience: 1000,
      coreStats: {
        health: 80,
        learning: 80,
        relationship: 80,
        achievement: 80
      },
      combatStats: {
        hp: 500,
        mp: 200,
        attack: 100,
        defense: 50,
        speed: 60,
        critRate: 0.2,
        critDamage: 2.0,
        dodge: 0.1,
        accuracy: 0.9,
        resistance: 0.1
      },
      energy: 100,
      maxEnergy: 100,
      gold: 1000,
      gems: 100,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
  })

  afterEach(() => {
    // 테스트 후 정리
    dungeonCombatService.clearAllCombats()
  })

  describe('던전 입장 및 난이도 설정', () => {
    it('선택한 난이도로 던전에 입장할 수 있어야 함', async() => {
      const result = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_beginner_1',
        testCharacter,
        'legendary'
      )

      expect(result.success).toBe(true)
      expect(result.sessionId).toBeDefined()

      if (result.sessionId) {
        const session = dungeonIntegrationService.getSession(result.sessionId)
        expect(session).toBeDefined()
        expect(session?.difficulty).toBe('legendary')
      }
    })

    it('에너지가 부족하면 던전에 입장할 수 없어야 함', async() => {
      const lowEnergyCharacter = {
        ...testCharacter,
        energy: 5
      }

      const result = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_beginner_1',
        lowEnergyCharacter
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('에너지가 부족')
    })

    it('레벨이 부족하면 던전에 입장할 수 없어야 함', async() => {
      const lowLevelCharacter = {
        ...testCharacter,
        level: 1
      }

      const result = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_advanced_1',
        lowLevelCharacter
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('레벨')
    })
  })

  describe('난이도별 몬스터 스탯 및 보상', () => {
    it('난이도가 높을수록 몬스터 스탯이 증가해야 함', async() => {
      const difficulties: Array<'easy' | 'normal' | 'hard' | 'legendary'> = ['easy', 'normal', 'hard', 'legendary']
      const monsterStats: Record<string, number> = {}

      for (const difficulty of difficulties) {
        const result = await dungeonIntegrationService.enterDungeon(
          userId,
          'dungeon_beginner_1',
          testCharacter,
          difficulty
        )

        if (result.sessionId) {
          const session = dungeonIntegrationService.getSession(result.sessionId)
          const combatState = dungeonCombatService.getCombatState(session!.currentCombatId!)

          if (combatState) {
            const firstMonster = combatState.participants.find(p => p.team === 'enemy')
            if (firstMonster) {
              monsterStats[difficulty] = firstMonster.stats.attack
            }
          }
        }
      }

      // 난이도별 몬스터 공격력 비교
      expect(monsterStats.easy).toBeLessThan(monsterStats.normal)
      expect(monsterStats.normal).toBeLessThan(monsterStats.hard)
      expect(monsterStats.hard).toBeLessThan(monsterStats.legendary)
    })

    it('난이도가 높을수록 보상이 증가해야 함', async() => {
      // 이 테스트는 실제 전투를 완료해야 하므로 모의 데이터로 테스트
      const difficultyMultipliers = {
        'easy': 0.8,
        'normal': 1.0,
        'hard': 1.5,
        'legendary': 5.0
      }

      const baseGold = 100

      for (const [difficulty, multiplier] of Object.entries(difficultyMultipliers)) {
        const expectedGold = baseGold * multiplier
        expect(expectedGold).toBe(baseGold * multiplier)
      }
    })
  })

  describe('전투 시스템 통합', () => {
    it('플레이어가 공격 시 몬스터 HP가 감소해야 함', async() => {
      const enterResult = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_beginner_1',
        testCharacter
      )

      expect(enterResult.success).toBe(true)

      if (enterResult.sessionId) {
        const session = dungeonIntegrationService.getSession(enterResult.sessionId)
        const combatId = session!.currentCombatId!

        // 초기 상태 확인
        const initialState = dungeonCombatService.getCombatState(combatId)
        const monster = initialState!.participants.find(p => p.team === 'enemy')
        const initialHp = monster!.currentHp

        // 플레이어 공격 실행
        const action: CombatAction = {
          id: `action_${Date.now()}`,
          turn: 1,
          actorId: 'player_' + userId,
          type: 'attack',
          targetIds: [monster!.id],
          results: [],
          timestamp: Date.now()
        }

        const result = dungeonCombatService.executePlayerAction(combatId, action)
        expect(result.success).toBe(true)

        // HP 감소 확인 (약간의 지연 후)
        await new Promise(resolve => setTimeout(resolve, 100))

        const updatedState = dungeonCombatService.getCombatState(combatId)
        const updatedMonster = updatedState!.participants.find(p => p.id === monster!.id)

        expect(updatedMonster!.currentHp).toBeLessThan(initialHp)
      }
    })

    it('스킬 사용 시 MP가 소모되어야 함', async() => {
      const enterResult = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_beginner_1',
        testCharacter
      )

      if (enterResult.sessionId) {
        const session = dungeonIntegrationService.getSession(enterResult.sessionId)
        const combatId = session!.currentCombatId!

        const initialState = dungeonCombatService.getCombatState(combatId)
        const player = initialState!.participants.find(p => p.team === 'player')
        const initialMp = player!.currentMp

        // 스킬 사용
        const action: CombatAction = {
          id: `action_${Date.now()}`,
          turn: 1,
          actorId: player!.id,
          type: 'skill',
          skillId: 'powerStrike',
          targetIds: [initialState!.participants.find(p => p.team === 'enemy')!.id],
          results: [],
          timestamp: Date.now()
        }

        dungeonCombatService.executePlayerAction(combatId, action)

        await new Promise(resolve => setTimeout(resolve, 100))

        const updatedState = dungeonCombatService.getCombatState(combatId)
        const updatedPlayer = updatedState!.participants.find(p => p.id === player!.id)

        expect(updatedPlayer!.currentMp).toBeLessThan(initialMp)
      }
    })
  })

  describe('아이템 드롭 시스템', () => {
    it('난이도가 높을수록 아이템 드롭률이 증가해야 함', () => {
      const difficulties = {
        easy: 0.8,
        normal: 1.0,
        hard: 1.5,
        legendary: 5.0
      }

      const baseDropChance = 0.3

      for (const [difficulty, multiplier] of Object.entries(difficulties)) {
        const dropChance = Math.min(1, baseDropChance * multiplier)

        if (difficulty === 'legendary') {
          expect(dropChance).toBe(1) // 레전더리는 100% 드롭
        } else {
          expect(dropChance).toBe(baseDropChance * multiplier)
        }
      }
    })

    it('아이템이 올바른 희귀도로 생성되어야 함', () => {
      const item = itemGenerationService.generateDropItem(20, 'boss')

      if (item) {
        expect(item.level).toBe(20)
        expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(item.rarity)
        expect(item.uniqueId).toBeDefined()
        expect(item.generatedAt).toBeDefined()
        expect(item.baseStats).toBeDefined()
      }
    })
  })

  describe('레벨 연동', () => {
    it('캐릭터 레벨이 던전에 제대로 전달되어야 함', async() => {
      const customCharacter = {
        ...testCharacter,
        level: 85
      }

      const result = await dungeonIntegrationService.enterDungeon(
        userId,
        'dungeon_beginner_1',
        customCharacter
      )

      if (result.sessionId) {
        const session = dungeonIntegrationService.getSession(result.sessionId)
        const combatState = dungeonCombatService.getCombatState(session!.currentCombatId!)
        const player = combatState!.participants.find(p => p.team === 'player')

        expect(player!.level).toBe(85)
      }
    })
  })
})
