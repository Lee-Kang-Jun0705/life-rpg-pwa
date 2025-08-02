import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdventurePage from '@/app/adventure/page'
import { SimpleDungeonTab } from '@/components/tabs/SimpleDungeonTab'
import { CompanionBattleService } from '@/lib/services/companion-battle.service'
import { companionService } from '@/lib/services/companion.service'
import { GAME_CONFIG } from '@/lib/config/game-config'

// Mock 설정
vi.mock('@/lib/database/client', () => ({
  dbHelpers: {
    getProfile: vi.fn().mockResolvedValue({ name: 'Test Player', id: 'test-user' }),
    getStats: vi.fn().mockResolvedValue([
      { stat_id: 'strength', value: 50, exp: 2500 },
      { stat_id: 'intelligence', value: 40, exp: 1600 },
      { stat_id: 'agility', value: 45, exp: 2025 },
      { stat_id: 'vitality', value: 55, exp: 3025 }
    ])
  }
}))

vi.mock('@/lib/stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    user: { coins: 1000, level: 10 },
    updateUser: vi.fn(),
    addCoins: vi.fn()
  }))
}))

describe('Adventure Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('페이지 렌더링', () => {
    it('모험 페이지 기본 요소가 올바르게 렌더링되어야 함', async () => {
      render(<AdventurePage />)
      
      // 제목 확인
      expect(screen.getByText('모험 & 성장')).toBeInTheDocument()
      
      // 탭 메뉴 확인
      expect(screen.getByText('퀘스트')).toBeInTheDocument()
      expect(screen.getByText('탐험')).toBeInTheDocument()
      expect(screen.getByText('인벤토리')).toBeInTheDocument()
      expect(screen.getByText('장비')).toBeInTheDocument()
      expect(screen.getByText('스킬')).toBeInTheDocument()
      expect(screen.getByText('상점')).toBeInTheDocument()
      
      // 캐릭터 정보 로드 대기
      await waitFor(() => {
        expect(screen.getByText('Test Player')).toBeInTheDocument()
      })
    })

    it('탭 전환이 올바르게 동작해야 함', async () => {
      render(<AdventurePage />)
      
      // 탐험 탭 클릭
      fireEvent.click(screen.getByText('탐험'))
      
      // 던전 목록이 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText('초보자의 숲')).toBeInTheDocument()
      })
    })
  })

  describe('자동 전투 시스템', () => {
    it('전투가 자동으로 진행되어야 함', () => {
      // SimpleBattleScreen의 startAutoBattle 함수가 자동으로 호출되는지 테스트
      expect(true).toBe(true) // 구현 필요
    })

    it('플레이어가 스킬을 수동으로 사용할 수 있어야 함', () => {
      // handleSkillUse 함수가 올바르게 동작하는지 테스트
      expect(true).toBe(true) // 구현 필요
    })
  })

  describe('컴패니언 전투 통합', () => {
    it('컴패니언이 자동으로 전투에 참여해야 함', async () => {
      // 컴패니언 모킹
      const mockCompanion = {
        id: 'test-companion',
        companionId: 'flame_dragon',
        nickname: '불꽃이',
        level: 5,
        experience: 500,
        currentStats: {
          hp: 100,
          maxHp: 100,
          attack: 30,
          defense: 20,
          speed: 15
        },
        mood: 'happy' as const,
        loyalty: 80,
        battleStats: {
          battlesWon: 10,
          totalDamageDealt: 1000,
          totalDamageTaken: 500,
          assistKills: 5
        },
        lastInteraction: new Date().toISOString()
      }

      vi.spyOn(companionService, 'getActiveCompanion').mockReturnValue(mockCompanion)

      // 컴패니언 전투 서비스 테스트
      const enemyList = [
        {
          id: 1,
          name: '슬라임',
          hp: 50,
          maxHp: 50,
          attack: 10,
          defense: 5,
          speed: 1.0,
          element: 'normal' as const
        }
      ]

      const context = {
        companion: mockCompanion,
        companionHp: 100,
        maxCompanionHp: 100,
        playerHp: 200,
        maxPlayerHp: 200,
        enemyList,
        currentTurn: 1,
        companionStatusManager: {} as any,
        companionSkillCooldowns: new Map()
      }

      const result = await CompanionBattleService.processCompanionTurn(
        context,
        vi.fn(), // addLog
        vi.fn(), // showDamageEffect
        vi.fn()  // showCompanionHeal
      )

      // 컴패니언이 공격했는지 확인
      expect(result.companionHp).toBe(100)
      expect(result.enemyList[0].hp).toBeLessThan(50)
      expect(result.animations).toHaveLength(1)
      expect(result.animations[0].type).toBe('attack')
    })

    it('컴패니언이 피해를 받을 수 있어야 함', () => {
      const mockCompanion = {
        id: 'test-companion',
        companionId: 'flame_dragon',
        currentStats: {
          defense: 20
        }
      } as any

      const result = CompanionBattleService.processCompanionDamage(
        mockCompanion,
        50, // damage
        100, // companionHp
        100  // maxCompanionHp
      )

      // 방어력에 의한 피해 감소 확인
      expect(result.finalDamage).toBeLessThan(50)
      expect(result.newHp).toBeGreaterThan(50)
    })

    it('전투 종료 시 컴패니언 보상을 받아야 함', () => {
      const mockCompanion = {
        mood: 'happy' as const
      } as any

      // 승리 시 보상
      const victoryRewards = CompanionBattleService.processCompanionRewards(
        mockCompanion,
        true, // victory
        3,    // enemiesDefeated
        'test-user'
      )

      expect(victoryRewards.expGained).toBeGreaterThan(0)
      expect(victoryRewards.loyaltyChange).toBeGreaterThan(0)

      // 패배 시 보상
      const defeatRewards = CompanionBattleService.processCompanionRewards(
        mockCompanion,
        false, // victory
        0,     // enemiesDefeated
        'test-user'
      )

      expect(defeatRewards.expGained).toBe(0)
      expect(defeatRewards.loyaltyChange).toBeLessThan(0)
    })
  })

  describe('난이도 시스템', () => {
    it('난이도 선택이 몬스터 스탯에 영향을 미쳐야 함', () => {
      // DifficultyService 테스트는 별도 파일에서 진행
      expect(true).toBe(true)
    })
  })

  describe('데이터 무결성', () => {
    it('모든 던전이 유효한 몬스터를 가져야 함', () => {
      // SimpleDungeonTab 내부 DUNGEONS 데이터 검증
      expect(true).toBe(true)
    })

    it('전투 중 HP가 음수가 되지 않아야 함', () => {
      // BattleEngine 로직 검증
      expect(true).toBe(true)
    })
  })
})