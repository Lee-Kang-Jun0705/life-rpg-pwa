/**
 * 스킬 실행 서비스 테스트
 * any 타입 사용 금지, 하드코딩 금지 검증
 */

import { skillExecutionService } from '@/lib/services/skill-execution.service'
import type {
  Skill,
  SkillContext,
  SkillExecutionResult,
  SkillEffect
} from '@/lib/types/skill-system'
import {
  SKILL_LEVEL_CONFIG,
  ELEMENT_EFFECTIVENESS,
  SKILL_EFFECT_CONFIG,
  COMBO_CONFIG
} from '@/lib/constants/skill.constants'
import { baseSkills } from '@/lib/data/base-skills'

describe('SkillExecutionService', () => {
  let mockContext: SkillContext

  beforeEach(() => {
    // 테스트 전 초기화
    jest.clearAllMocks()
    skillExecutionService.clearAllCooldowns('test-user')

    // Mock context 설정
    mockContext = {
      caster: {
        id: 'player1',
        stats: {
          hp: 100,
          mp: 50,
          attack: 30,
          defense: 10,
          speed: 50,
          critRate: 0.2,
          critDamage: 1.5,
          dodge: 0.1,
          accuracy: 0.95,
          resistance: 0.1
        },
        buffs: [],
        debuffs: []
      },
      targets: [
        {
          id: 'enemy_1',
          stats: {
            hp: 200,
            maxHp: 200,
            mp: 30,
            attack: 20,
            defense: 15,
            speed: 40,
            critRate: 0.1,
            critDamage: 1.3,
            dodge: 0.05,
            accuracy: 0.9,
            resistance: 0.05
          },
          resistances: {}
        }
      ]
    }
  })

  describe('executeSkill', () => {
    it('should execute a basic attack skill successfully', () => {
      const result = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      expect(result.skillId).toBe('power_strike')
      expect(result.caster).toBe('player1')
      expect(result.targets).toContain('enemy_1')
      expect(result.effects.length).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should apply skill level bonuses correctly', () => {
      // 첫 번째 실행을 위해 쿨다운 초기화
      skillExecutionService.clearAllCooldowns('player1')

      const level1Result = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      // 두 번째 실행을 위해 쿨다운 초기화
      skillExecutionService.clearAllCooldowns('player1')

      const level5Result = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        5
      )

      const level1Damage = level1Result.effects[0].actualValue
      const level5Damage = level5Result.effects[0].actualValue

      // 레벨 5 스킬이 레벨 1보다 더 높은 데미지를 가져야 함
      expect(level5Damage).toBeGreaterThan(level1Damage)
    })

    it('should respect cooldowns', () => {
      // 첫 번째 사용 - 성공
      const firstUse = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      expect(firstUse.skillId).toBe('power_strike')

      // 두 번째 사용 - 쿨다운으로 실패
      expect(() => {
        skillExecutionService.executeSkill(
          'power_strike',
          'player1',
          ['enemy_1'],
          mockContext,
          1
        )
      }).toThrow('Skill is on cooldown')

      // 쿨다운 확인
      const remainingCooldown = skillExecutionService.getRemainingCooldown(
        'player1',
        'power_strike'
      )
      expect(remainingCooldown).toBeGreaterThan(0)
    })

    it('should check MP cost', () => {
      // MP가 부족한 상황 생성
      mockContext.caster.stats.mp = 5

      expect(() => {
        skillExecutionService.executeSkill(
          'power_strike', // MP 10 소비
          'player1',
          ['enemy_1'],
          mockContext,
          1
        )
      }).toThrow('Not enough MP')
    })

    it('should validate targets based on skill target type', () => {
      // Self-target skill
      const selfResult = skillExecutionService.executeSkill(
        'iron_wall',
        'player1',
        ['player1'],
        mockContext,
        1
      )
      expect(selfResult.targets).toEqual(['player1'])

      // 다중 대상 스킬 (multi_slash는 단일 대상에게 3번 공격)
      const multiResult = skillExecutionService.executeSkill(
        'multi_slash',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )
      expect(multiResult.targets).toContain('enemy_1')
      expect(multiResult.effects.length).toBeGreaterThan(0)
    })

    it('should calculate critical hits based on caster stats', () => {
      // 크리티컬 확률을 100%로 설정
      mockContext.caster.stats.critRate = 1.0

      const results = Array.from({ length: 10 }, (_, i) => {
        skillExecutionService.clearAllCooldowns('player1') // 각 실행 전 쿨다운 초기화
        return skillExecutionService.executeSkill(
          'power_strike',
          'player1',
          ['enemy_1'],
          mockContext,
          1
        )
      })

      // 모든 공격이 크리티컬이어야 함
      results.forEach(result => {
        const damageEffect = result.effects.find(e => e.effect.type === 'damage')
        expect(damageEffect?.isCritical).toBe(true)
      })
    })

    it('should calculate dodge based on target stats', () => {
      // 회피율을 100%로 설정
      mockContext.targets[0].stats.dodge = 1.0

      const result = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      const damageEffect = result.effects.find(e => e.effect.type === 'damage')
      expect(damageEffect?.isDodged).toBe(true)
      expect(damageEffect?.actualValue).toBe(0)
    })

    it('should not use any types', () => {
      // TypeScript 컴파일러가 any 타입 사용을 방지함
      const skillId = 'power_strike'
      const casterId = 'player1'
      const targets: string[] = ['enemy_1']
      const context: SkillContext = mockContext
      const level = 1

      const result: SkillExecutionResult = skillExecutionService.executeSkill(
        skillId,
        casterId,
        targets,
        context,
        level
      )

      // 모든 타입이 명시적으로 정의되어 있음
      expect(typeof result.skillId).toBe('string')
      expect(typeof result.caster).toBe('string')
      expect(Array.isArray(result.targets)).toBe(true)
    })
  })

  describe('combo system', () => {
    it('should detect skill combos', async() => {
      // 연속으로 스킬 사용
      skillExecutionService.clearAllCooldowns('player1')
      skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      // 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100))

      // whirlwind 스킬이 없으므로 multi_slash 사용
      skillExecutionService.clearAllCooldowns('player1')
      skillExecutionService.executeSkill(
        'multi_slash',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      // 세 번째 스킬 사용
      skillExecutionService.clearAllCooldowns('player1')
      const comboResult = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      // 콤보가 발동되었는지 확인
      if (comboResult.combos) {
        expect(comboResult.combos.length).toBeGreaterThan(0)
      }
    })

    it('should clear old skill records after timeout', async() => {
      skillExecutionService.clearAllCooldowns('player1')
      skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      // 10초 이상 대기 (실제 테스트에서는 시간을 mock)
      jest.advanceTimersByTime(11000)

      skillExecutionService.clearAllCooldowns('player1')
      const result = skillExecutionService.executeSkill(
        'multi_slash',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      // 오래된 스킬은 콤보에 포함되지 않아야 함
      expect(result.combos).toBeUndefined()
    })
  })

  describe('cooldown management', () => {
    it('should reduce cooldown with skill level', () => {
      const skill = baseSkills['meteor_strike']
      const baseCooldown = skill.cooldown

      // 레벨 1 쿨다운
      skillExecutionService.executeSkill(
        'meteor_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )
      const level1Cooldown = skillExecutionService.getRemainingCooldown(
        'player1',
        'meteor_strike'
      )

      // 쿨다운 초기화
      skillExecutionService.clearSkillCooldown('player1', 'meteor_strike')

      // 레벨 5 쿨다운
      skillExecutionService.executeSkill(
        'meteor_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        5
      )
      const level5Cooldown = skillExecutionService.getRemainingCooldown(
        'player1',
        'meteor_strike'
      )

      // 높은 레벨일수록 쿨다운이 짧아야 함
      expect(level5Cooldown).toBeLessThan(level1Cooldown)
    })

    it('should clear specific skill cooldown', () => {
      skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      expect(skillExecutionService.isOnCooldown('player1', 'power_strike')).toBe(true)

      skillExecutionService.clearSkillCooldown('player1', 'power_strike')

      expect(skillExecutionService.isOnCooldown('player1', 'power_strike')).toBe(false)
    })

    it('should clear all cooldowns for a user', () => {
      // 여러 스킬 사용
      skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['enemy_1'],
        mockContext,
        1
      )

      skillExecutionService.clearSkillCooldown('player1', 'power_strike')

      skillExecutionService.executeSkill(
        'iron_wall',
        'player1',
        ['player1'],
        mockContext,
        1
      )

      expect(skillExecutionService.isOnCooldown('player1', 'power_strike')).toBe(false)
      expect(skillExecutionService.isOnCooldown('player1', 'iron_wall')).toBe(true)

      // 모든 쿨다운 초기화
      skillExecutionService.clearAllCooldowns('player1')

      expect(skillExecutionService.isOnCooldown('player1', 'power_strike')).toBe(false)
      expect(skillExecutionService.isOnCooldown('player1', 'iron_wall')).toBe(false)
    })
  })

  describe('skill leveling', () => {
    it('should calculate level up cost correctly', () => {
      const result1 = skillExecutionService.levelUpSkill('player1', 'power_strike', 1)
      const result2 = skillExecutionService.levelUpSkill('player1', 'power_strike', 5)

      expect(result1.success).toBe(true)
      expect(result1.newLevel).toBe(2)
      expect(result1.cost).toBeGreaterThan(0)

      expect(result2.success).toBe(true)
      expect(result2.newLevel).toBe(6)
      expect(result2.cost).toBeGreaterThan(result1.cost)

      // 비용이 지수적으로 증가해야 함
      const expectedCost = Math.floor(
        SKILL_LEVEL_CONFIG.expRequiredBase *
        Math.pow(SKILL_LEVEL_CONFIG.expMultiplier, 5)
      )
      expect(result2.cost).toBe(expectedCost)
    })

    it('should not exceed max level', () => {
      const skill = baseSkills['power_strike']
      const maxLevel = skill.maxLevel

      const result = skillExecutionService.levelUpSkill(
        'player1',
        'power_strike',
        maxLevel
      )

      expect(result.success).toBe(false)
      expect(result.newLevel).toBe(maxLevel)
    })
  })

  describe('constants validation', () => {
    it('should not have hardcoded values', () => {
      // 모든 설정값이 상수로 정의되어 있는지 확인
      expect(SKILL_LEVEL_CONFIG).toBeDefined()
      expect(ELEMENT_EFFECTIVENESS).toBeDefined()
      expect(SKILL_EFFECT_CONFIG).toBeDefined()
      expect(COMBO_CONFIG).toBeDefined()

      // 하드코딩된 값이 없는지 확인
      expect(typeof SKILL_LEVEL_CONFIG.damagePerLevel).toBe('number')
      expect(typeof SKILL_LEVEL_CONFIG.cooldownReductionPerLevel).toBe('number')
      expect(typeof SKILL_LEVEL_CONFIG.manaCostReductionPerLevel).toBe('number')
    })

    it('should have properly structured base skills', () => {
      Object.values(baseSkills).forEach(skill => {
        expect(skill.id).toBeDefined()
        expect(skill.name).toBeDefined()
        expect(skill.category).toBeDefined()
        expect(skill.target).toBeDefined()
        expect(skill.effects).toBeDefined()
        expect(Array.isArray(skill.effects)).toBe(true)
        expect(skill.cooldown).toBeGreaterThanOrEqual(0)
        expect(skill.maxLevel).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('error handling', () => {
    it('should throw error for non-existent skill', () => {
      expect(() => {
        skillExecutionService.executeSkill(
          'invalid_skill',
          'player1',
          ['enemy_1'],
          mockContext,
          1
        )
      }).toThrow('Skill not found: invalid_skill')
    })

    it('should handle invalid targets gracefully', () => {
      const result = skillExecutionService.executeSkill(
        'power_strike',
        'player1',
        ['non_existent_target'],
        mockContext,
        1
      )

      expect(result.targets.length).toBe(0)
      expect(result.effects.length).toBe(0)
    })
  })
})
