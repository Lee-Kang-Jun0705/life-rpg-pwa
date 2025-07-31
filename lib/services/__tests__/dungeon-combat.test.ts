import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { dungeonCombatService } from '@/lib/services/dungeon-combat.service'
import type { Character } from '@/lib/types/game-core'
import type { DungeonStage } from '@/lib/types/dungeon'
import type { CombatAction } from '@/lib/types/combat-system'

describe('DungeonCombatService', () => {
  let testCharacter: Character
  let testStage: DungeonStage

  beforeEach(() => {
    // 테스트용 캐릭터 설정
    testCharacter = {
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

    // 테스트용 스테이지 설정
    testStage = {
      id: 'test-stage-1',
      dungeonId: 'test-dungeon',
      stageNumber: 1,
      name: '테스트 스테이지 1',
      description: '테스트를 위한 스테이지',
      monsters: [
        {
          id: 'test-monster-1',
          name: '테스트 슬라임',
          level: 1,
          stats: {
            hp: 100,
            maxHp: 100,
            attack: 20,
            defense: 10,
            critRate: 0.05,
            critDamage: 1.2,
            dodge: 0.02,
            accuracy: 0.8,
            resistance: 0
          },
          rewards: {
            exp: 50,
            gold: 30
          },
          type: 'normal',
          icon: '🟢'
        }
      ],
      rewards: {
        exp: 100,
        gold: 50,
        items: []
      },
      completed: false,
      stars: 0
    }
  })

  describe('전투 시작', () => {
    it('정상적으로 전투를 시작할 수 있어야 한다', async () => {
      const combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )

      expect(combatId).toBeTruthy()
      expect(typeof combatId).toBe('string')

      const combatState = dungeonCombatService.getCombatState(combatId)
      expect(combatState).toBeTruthy()
      expect(combatState?.phase).toBe('active')
      expect(combatState?.player.name).toBe('테스트 용사')
      expect(combatState?.enemies.length).toBe(1)
    })

    it('플레이어 HP가 최대값으로 시작해야 한다', async () => {
      const combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )

      const combatState = dungeonCombatService.getCombatState(combatId)
      expect(combatState?.player.currentHP).toBe(testCharacter.combatStats.maxHp)
    })

    it('몬스터 HP가 최대값으로 시작해야 한다', async () => {
      const combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )

      const combatState = dungeonCombatService.getCombatState(combatId)
      const firstEnemy = combatState?.enemies[0]
      expect(firstEnemy?.currentHP).toBe(firstEnemy?.maxHP)
    })
  })

  describe('전투 행동', () => {
    let combatId: string

    beforeEach(async () => {
      combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )
    })

    it('일반 공격으로 적에게 데미지를 줄 수 있어야 한다', () => {
      const initialState = dungeonCombatService.getCombatState(combatId)
      const enemyInitialHP = initialState?.enemies[0].currentHP || 0

      const action: CombatAction = {
        type: 'attack',
        targetId: 'enemy_0'
      }

      dungeonCombatService.executePlayerAction(combatId, action)

      const afterState = dungeonCombatService.getCombatState(combatId)
      const enemyAfterHP = afterState?.enemies[0].currentHP || 0

      expect(enemyAfterHP).toBeLessThan(enemyInitialHP)
    })

    it('방어 행동으로 방어력이 증가해야 한다', () => {
      const action: CombatAction = {
        type: 'defend'
      }

      dungeonCombatService.executePlayerAction(combatId, action)

      const afterState = dungeonCombatService.getCombatState(combatId)
      const defendEffect = afterState?.player.effects.find(e => e.type === 'defend')

      expect(defendEffect).toBeTruthy()
      expect(defendEffect?.remainingTurns).toBeGreaterThan(0)
    })

    it('스킬 사용 시 쿨다운이 적용되어야 한다', () => {
      const action: CombatAction = {
        type: 'skill',
        skillId: 'power-strike',
        targetId: 'enemy_0'
      }

      dungeonCombatService.executePlayerAction(combatId, action)

      const afterState = dungeonCombatService.getCombatState(combatId)
      const skill = afterState?.availableSkills.find(s => s.id === 'power-strike')

      expect(skill?.currentCooldown).toBeGreaterThan(0)
    })
  })

  describe('전투 종료', () => {
    let combatId: string

    beforeEach(async () => {
      combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )
    })

    it('모든 적을 처치하면 승리해야 한다', () => {
      const state = dungeonCombatService.getCombatState(combatId)
      if (!state) return

      // 적의 HP를 0으로 설정
      state.enemies[0].currentHP = 0
      
      // 전투 상태 업데이트
      dungeonCombatService.updateCombatState(combatId)

      const updatedState = dungeonCombatService.getCombatState(combatId)
      expect(updatedState?.phase).toBe('victory')
    })

    it('플레이어 HP가 0이 되면 패배해야 한다', () => {
      const state = dungeonCombatService.getCombatState(combatId)
      if (!state) return

      // 플레이어 HP를 0으로 설정
      state.player.currentHP = 0
      
      // 전투 상태 업데이트
      dungeonCombatService.updateCombatState(combatId)

      const updatedState = dungeonCombatService.getCombatState(combatId)
      expect(updatedState?.phase).toBe('defeat')
    })

    it('승리 시 보상을 받아야 한다', () => {
      const state = dungeonCombatService.getCombatState(combatId)
      if (!state) return

      // 적을 처치
      state.enemies[0].currentHP = 0
      dungeonCombatService.updateCombatState(combatId)

      const finalState = dungeonCombatService.getCombatState(combatId)
      expect(finalState?.rewards).toBeTruthy()
      expect(finalState?.rewards?.experience).toBeGreaterThan(0)
      expect(finalState?.rewards?.gold).toBeGreaterThan(0)
    })
  })

  describe('데미지 계산', () => {
    it('크리티컬 히트 시 추가 데미지가 적용되어야 한다', () => {
      // 크리티컬 확률을 100%로 설정
      const highCritCharacter = { ...testCharacter }
      highCritCharacter.combatStats.critRate = 1.0

      const normalDamage = dungeonCombatService.calculateDamage(
        testCharacter.combatStats.attack,
        10, // defense
        0, // critRate
        1.5 // critDamage
      )

      const critDamage = dungeonCombatService.calculateDamage(
        highCritCharacter.combatStats.attack,
        10, // defense
        1.0, // critRate
        1.5 // critDamage
      )

      // 크리티컬 데미지가 일반 데미지보다 커야 함
      expect(critDamage.damage).toBeGreaterThan(normalDamage.damage)
      expect(critDamage.isCritical).toBe(true)
    })

    it('방어력이 높을수록 받는 데미지가 줄어야 한다', () => {
      const lowDefenseDamage = dungeonCombatService.calculateDamage(
        50, // attack
        10, // low defense
        0, // critRate
        1.5 // critDamage
      )

      const highDefenseDamage = dungeonCombatService.calculateDamage(
        50, // attack
        40, // high defense
        0, // critRate
        1.5 // critDamage
      )

      expect(highDefenseDamage.damage).toBeLessThan(lowDefenseDamage.damage)
    })
  })

  describe('자동 전투', () => {
    let combatId: string

    beforeEach(async () => {
      combatId = await dungeonCombatService.startCombat(
        'test-dungeon',
        'test-stage-1',
        testCharacter,
        testStage,
        { type: 'dungeon', difficulty: 'easy' }
      )
    })

    it('자동 전투를 활성화할 수 있어야 한다', () => {
      dungeonCombatService.setAutoBattle(combatId, true)
      
      const state = dungeonCombatService.getCombatState(combatId)
      expect(state?.isAutoBattleEnabled).toBe(true)
    })

    it('자동 전투 중 적절한 행동을 선택해야 한다', () => {
      dungeonCombatService.setAutoBattle(combatId, true)
      
      const action = dungeonCombatService.getAutoBattleAction(combatId)
      expect(action).toBeTruthy()
      expect(['attack', 'skill', 'defend', 'item'].includes(action?.type || '')).toBe(true)
    })
  })
})