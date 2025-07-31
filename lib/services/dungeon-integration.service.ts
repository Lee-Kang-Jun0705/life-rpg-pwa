/**
 * 던전 통합 서비스
 * 던전 페이지에서 모든 게임 요소 통합 관리
 */

import type { Dungeon, DungeonProgress, DungeonStage } from '@/lib/types/dungeon'
import type { Character } from '@/lib/types/game-core'
import type { GeneratedItem } from '@/lib/types/item-system'
import type { CombatResult, CombatAction, CombatState } from '@/lib/types/combat-system'
import type { MonsterData } from '@/lib/types/battle-extended'
import { dungeonService } from '@/lib/services/dungeon-service'
import { dungeonCombatService } from '@/lib/services/dungeon-combat.service'
import { itemGenerationService } from '@/lib/services/item-generation.service'
import { dbHelpers, type DungeonProgress as DBDungeonProgress } from '@/lib/database/client'
import { ENERGY_CONFIG } from '@/lib/constants/progression.constants'
import { generateStageMonsters } from '@/lib/data/monsters'
import { collectionService } from './collection.service'
import { leaderboardService } from './leaderboard.service'
import { IdGenerators } from '@/lib/utils/id-generator'

interface DungeonSession {
  userId: string
  dungeonId: string
  progress: DungeonProgress
  currentCombatId?: string
  rewards: {
    gold: number
    items: GeneratedItem[]
  }
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary'
}

export class DungeonIntegrationService {
  private static instance: DungeonIntegrationService
  private sessions: Map<string, DungeonSession> = new Map()

  static getInstance(): DungeonIntegrationService {
    if (!this.instance) {
      this.instance = new DungeonIntegrationService()
    }
    return this.instance
  }

  /**
   * 던전 입장
   */
  async enterDungeon(
    userId: string,
    dungeonId: string,
    character?: Character,
    difficulty?: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary'
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // 캐릭터 정보 가져오기 (전달되지 않은 경우에만)
      if (!character) {
        character = await this.getCharacter(userId)
      }
      if (!character) {
        return { success: false, error: '캐릭터를 찾을 수 없습니다.' }
      }

      // 던전 정보 가져오기
      const dungeon = await dungeonService.getDungeon(dungeonId)
      if (!dungeon) {
        return { success: false, error: '던전을 찾을 수 없습니다.' }
      }

      // 입장 조건 체크
      if (character.level < dungeon.requirements.level) {
        return { success: false, error: `레벨 ${dungeon.requirements.level} 이상 필요합니다.` }
      }

      if (character.energy < dungeon.requirements.energy) {
        return { success: false, error: '에너지가 부족합니다.' }
      }

      // 에너지 차감
      await this.consumeEnergy(userId, dungeon.requirements.energy)

      // 세션 생성
      const sessionId = this.generateSessionId()
      const progress: DungeonProgress = {
        dungeonId,
        stageId: `${dungeonId}_stage_1`,
        status: 'in_progress',
        startTime: new Date(),
        currentStage: 1,
        totalStages: dungeon.stages,
        defeatedMonsters: 0,
        totalMonsters: this.calculateTotalMonsters(dungeon),
        earnedExp: 0,
        earnedGold: 0,
        earnedItems: [],
        damageDealt: 0,
        damageTaken: 0,
        criticalHits: 0,
        skillsUsed: 0,
        completionTime: 0,
        survivedWithFullHP: true,
        usedNoConsumables: true,
        clearedStages: 0,
        isCleared: false
      }

      const session: DungeonSession = {
        userId,
        dungeonId,
        progress,
        rewards: {
          gold: 0,
          items: []
        },
        difficulty: difficulty || dungeon.difficulty
      }

      this.sessions.set(sessionId, session)

      // DB에 진행상황 저장
      await this.saveDungeonProgress(userId, dungeonId, 'in_progress')

      // 첫 스테이지 시작
      await this.startStage(sessionId, 1)

      return { success: true, sessionId }
    } catch (error) {
      console.error('Failed to enter dungeon:', error)
      return { success: false, error: '던전 입장 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 스테이지 시작
   */
  private async startStage(sessionId: string, stageNumber: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const dungeon = await dungeonService.getDungeon(session.dungeonId)
    if (!dungeon) return

    // 스테이지 정보 가져오기 (임시)
    const stage: DungeonStage = {
      id: `${session.dungeonId}_stage_${stageNumber}`,
      dungeonId: session.dungeonId,
      stageNumber,
      name: `스테이지 ${stageNumber}`,
      description: `${dungeon.name}의 ${stageNumber}번째 스테이지`,
      monsters: this.generateStageMonsters(dungeon, stageNumber, session.difficulty),
      rewards: {
        gold: 100 * stageNumber, // 경험치 제거, 골드 2배 증가
        items: []
      },
      completed: false,
      stars: 0
    }

    // 몬스터 조우 기록
    for (const monster of stage.monsters) {
      await collectionService.recordMonsterEncounter(monster.id)
    }

    // 전투 시작
    const userId = session.userId
    const character = await this.getCharacter(userId)
    
    if (character) {
      const combatId = await dungeonCombatService.startCombat(
        session.dungeonId,
        stage.id,
        character,
        stage,
        { 
          type: 'dungeon', 
          difficulty: (() => {
            const difficultyMap: Record<string, 'easy' | 'normal' | 'hard' | 'nightmare'> = {
              'easy': 'easy',
              'normal': 'normal',
              'hard': 'hard',
              'expert': 'nightmare',
              'legendary': 'nightmare'
            }
            return difficultyMap[session.difficulty] || 'normal'
          })()
        }
      )

      session.currentCombatId = combatId
      session.progress.stageId = stage.id
    }
  }

  /**
   * 전투 행동 실행
   */
  async executeAction(
    sessionId: string,
    action: CombatAction
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.currentCombatId) {
      return { success: false, error: '진행 중인 전투가 없습니다.' }
    }

    const result = dungeonCombatService.executePlayerAction(
      session.currentCombatId,
      action
    )

    if (result.success) {
      // 전투 상태 체크
      const combatState = dungeonCombatService.getCombatState(session.currentCombatId)
      if (combatState && combatState.phase !== 'battle') {
        await this.handleCombatEnd(sessionId, combatState)
      }
    }

    return result
  }

  /**
   * 전투 종료 처리
   */
  private async handleCombatEnd(sessionId: string, combatState: CombatState): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (combatState.phase === 'victory') {
      // 처치한 몬스터 기록
      const defeatedMonsters = combatState.participants.filter(p => 
        p.team === 'enemy' && p.currentHp <= 0
      )
      
      for (const monster of defeatedMonsters) {
        // 몬스터 ID 추출 (enemy_slime_0 -> slime)
        const monsterId = monster.id.split('_')[1]
        if (monsterId) {
          await collectionService.recordMonsterEncounter(monsterId)
          await collectionService.recordMonsterDefeat(monsterId)
        }
      }

      // 보상 적용 - 경험치 제거
      const rewards = combatState.rewards
      if (rewards) {
        session.rewards.gold += rewards.gold
        session.rewards.items.push(...rewards.items)
        
        session.progress.earnedGold = session.rewards.gold
        session.progress.earnedItems = rewards.items.map(item => ({
          id: item.itemId,
          name: item.name || 'Unknown Item',
          type: 'equipment',
          rarity: 'common',
          icon: '🎁',
          quantity: item.quantity || 1,
          dropRate: 100,
        }))
      }

      // 다음 스테이지 체크
      if (session.progress.currentStage < session.progress.totalStages) {
        session.progress.currentStage++
        await this.startStage(sessionId, session.progress.currentStage)
      } else {
        // 던전 클리어
        await this.completeDungeon(sessionId)
      }
    } else if (combatState.phase === 'defeat') {
      // 던전 실패
      session.progress.status = 'failed'
      
      // DB에 실패 기록
      await this.saveDungeonProgress(
        session.userId,
        session.dungeonId,
        'failed'
      )
      
      await this.endDungeonSession(sessionId, false)
    }
  }

  /**
   * 던전 완료
   */
  private async completeDungeon(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.progress.status = 'completed'
    session.progress.endTime = new Date()
    session.progress.completionTime = 
      session.progress.endTime.getTime() - session.progress.startTime.getTime()

    // 별점 계산
    const stars = this.calculateStars(session.progress)
    
    // 보상 지급
    const userId = session.userId
    await this.grantRewards(userId, session.rewards)

    // 리더보드 업데이트
    await leaderboardService.updateDungeonRecords({
      clearTime: Math.floor(session.progress.completionTime / 1000), // 초 단위
      score: session.rewards.gold * 10 + session.rewards.items.length * 100, // 골드와 아이템으로 점수 계산
      perfectClear: session.progress.survivedWithFullHP,
      dungeonId: session.dungeonId
    })

    // 수집 기록 업데이트
    const collectionStats = await collectionService.getCollectionStats()
    await leaderboardService.updateCollectionRecords({
      totalMonsters: collectionStats.totalUnique,
      totalItems: session.rewards.items.length
    })

    // 던전 클리어 기록 - DB에 저장
    await this.saveDungeonProgress(
      userId, 
      session.dungeonId, 
      'completed',
      {
        coins: session.rewards.gold,
        items: session.rewards.items.map(item => item.id)
      }
    )

    await this.endDungeonSession(sessionId, true)
  }

  /**
   * 던전 세션 종료
   */
  private async endDungeonSession(sessionId: string, success: boolean): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // 세션 정리
    this.sessions.delete(sessionId)

    // TODO: 결과 화면 표시
  }

  /**
   * 보상 지급
   */
  private async grantRewards(
    userId: string,
    rewards: DungeonSession['rewards']
  ): Promise<void> {
    // 골드 지급
    const { characterIntegrationService } = await import('./character-integration.service')
    await characterIntegrationService.addGold(userId, rewards.gold)

    // 아이템 지급
    // TODO: 인벤토리 서비스가 사용자별로 관리되지 않음 - 추후 개선 필요
    const { inventoryService } = await import('./inventory.service')
    for (const item of rewards.items) {
      inventoryService.addItem(item, 1)
    }
  }

  /**
   * 별점 계산
   */
  private calculateStars(progress: DungeonProgress): number {
    let stars = 1 // 기본 1성

    // 빠른 클리어
    if (progress.completionTime < 300000) { // 5분 이내
      stars++
    }

    // 무피해 또는 최소 피해
    if (progress.survivedWithFullHP || progress.damageTaken < 100) {
      stars++
    }

    return Math.min(stars, 3)
  }

  /**
   * 스테이지 몬스터 생성
   */
  private generateStageMonsters(dungeon: Dungeon, stageNumber: number, sessionDifficulty?: string): MonsterData[] {
    // 세션 난이도 우선, 없으면 던전 기본 난이도 사용
    const selectedDifficulty = sessionDifficulty || dungeon.difficulty
    
    // 던전 난이도를 difficulty로 변환
    const difficultyMap: Record<string, 'easy' | 'normal' | 'hard' | 'nightmare'> = {
      'easy': 'easy',
      'normal': 'normal',
      'hard': 'hard',
      'expert': 'nightmare',
      'legendary': 'nightmare'
    }
    
    // 던전 타입별 기본 배율 (던전이 어려울수록 몬스터가 강함)
    const dungeonTypeMultipliers: Record<string, number> = {
      'daily': 1.0,       // 일일 던전: 기본
      'weekly': 1.3,      // 주간 던전: 30% 강화
      'special': 1.5,     // 특별 던전: 50% 강화
      'event': 1.8,       // 이벤트 던전: 80% 강화
      'infinite': 2.0     // 무한의 탑: 100% 강화
    }
    
    // 던전 난이도별 추가 배율
    const dungeonDifficultyMultipliers: Record<string, number> = {
      'easy': 0.8,
      'normal': 1.0,
      'hard': 1.3,
      'expert': 1.6,
      'legendary': 2.0
    }
    
    // 선택된 난이도에 따른 추가 배율
    const selectedDifficultyMultipliers: Record<string, number> = {
      'easy': 0.8,
      'normal': 1.0,
      'hard': 1.5,
      'expert': 2.0,
      'legendary': 3.0
    }
    
    const difficulty = difficultyMap[selectedDifficulty] || 'normal'
    
    // 던전 ID를 몬스터 구성 ID로 매핑
    const dungeonMappings: Record<string, string> = {
      'beginner-01': 'beginner_forest',
      'beginner-02': 'beginner_forest',
      'beginner-03': 'beginner_forest',
      'dungeon_beginner_1': 'beginner_forest',
      'dungeon_beginner_2': 'beginner_forest',
      'dungeon_intermediate_1': 'dark_cave',
      'dungeon_intermediate_2': 'dark_cave',
      'dungeon_advanced_1': 'demon_fortress',
      'dungeon_advanced_2': 'demon_fortress'
    }
    
    const mappedDungeonId = dungeonMappings[dungeon.id] || 'beginner_forest'
    
    // 실제 몬스터 데이터 생성
    const monsters = generateStageMonsters(mappedDungeonId, stageNumber, difficulty)
    
    // 모든 배율 계산
    const dungeonTypeMultiplier = dungeonTypeMultipliers[dungeon.type] || 1.0
    const dungeonDiffMultiplier = dungeonDifficultyMultipliers[dungeon.difficulty] || 1.0
    const selectedDiffMultiplier = selectedDifficultyMultipliers[selectedDifficulty] || 1.0
    
    // 최종 배율 = 던전 타입 배율 × 던전 난이도 배율 × 선택 난이도 배율
    const finalMultiplier = dungeonTypeMultiplier * dungeonDiffMultiplier * selectedDiffMultiplier
    
    // 배율 적용
    if (finalMultiplier !== 1.0) {
      monsters.forEach(monster => {
        monster.hp = Math.floor(monster.hp * finalMultiplier)
        monster.attack = Math.floor(monster.attack * finalMultiplier)
        monster.defense = Math.floor(monster.defense * finalMultiplier)
        // 속도는 적게 증가
        monster.speed = monster.speed ? Math.floor(monster.speed * (0.9 + finalMultiplier * 0.1)) : 40
      })
    }
    
    console.log('[generateStageMonsters]', {
      dungeonId: dungeon.id,
      dungeonType: dungeon.type,
      dungeonDifficulty: dungeon.difficulty,
      selectedDifficulty,
      mappedDungeonId,
      stageNumber,
      difficulty,
      finalMultiplier,
      monstersGenerated: monsters.map(m => ({
        id: m.id,
        name: m.name,
        level: m.level,
        hp: m.hp,
        attack: m.attack,
        defense: m.defense,
        type: m.type
      }))
    })
    
    return monsters
  }

  /**
   * 유틸리티 함수
   */
  private async getCharacter(userId: string): Promise<Character | null> {
    const { characterIntegrationService } = await import('./character-integration.service')
    return characterIntegrationService.getCharacter(userId)

  }

  private async consumeEnergy(userId: string, amount: number): Promise<void> {
    const { characterIntegrationService } = await import('./character-integration.service')
    await characterIntegrationService.useEnergy(userId, amount)
  }

  private calculateTotalMonsters(dungeon: Dungeon): number {
    // 임시 계산
    return dungeon.stages * 4
  }

  private generateSessionId(): string {
    return IdGenerators.dungeonSession()
  }

  private getUserIdFromSession(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    return session?.userId || 'current-user'
  }

  /**
   * 현재 세션 가져오기
   */
  getSession(sessionId: string): DungeonSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * 던전 포기
   */
  async abandonDungeon(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.progress.status = 'failed'
    await this.endDungeonSession(sessionId, false)
  }

  /**
   * 다음 스테이지로 진행
   */
  async proceedToNextStage(sessionId: string): Promise<{ success: boolean; combatId?: string; error?: string }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return { success: false, error: '세션을 찾을 수 없습니다.' }
    }

    // 다음 스테이지 번호
    const nextStage = session.progress.currentStage + 1
    
    // 최대 스테이지 체크
    if (nextStage > session.progress.totalStages) {
      return { success: false, error: '모든 스테이지를 완료했습니다.' }
    }

    // 진행 상태 업데이트
    session.progress.currentStage = nextStage
    session.progress.clearedStages = nextStage - 1

    // 다음 스테이지 시작
    await this.startStage(sessionId, nextStage)

    return { 
      success: true, 
      combatId: session.currentCombatId 
    }
  }

  /**
   * 던전 진행상황 DB 저장
   */
  private async saveDungeonProgress(
    userId: string,
    dungeonId: string,
    status: 'available' | 'in_progress' | 'completed' | 'failed',
    rewards?: {
      coins?: number
      items?: string[]
    }
  ): Promise<void> {
    try {
      const existingProgress = await dbHelpers.getDungeonProgress(userId, dungeonId)
      
      if (existingProgress) {
        await dbHelpers.updateDungeonProgress(userId, dungeonId, {
          status,
          lastAttemptAt: new Date(),
          attempts: existingProgress.attempts + 1,
          completedAt: status === 'completed' ? new Date() : undefined,
          rewards
        })
      } else {
        await dbHelpers.createDungeonProgress({
          userId,
          dungeonId,
          status,
          attempts: 1,
          lastAttemptAt: new Date(),
          completedAt: status === 'completed' ? new Date() : undefined,
          rewards,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to save dungeon progress:', error)
    }
  }

  /**
   * 던전 진행상황 불러오기
   */
  async getDungeonProgress(userId: string, dungeonId: string): Promise<DBDungeonProgress | null> {
    try {
      return await dbHelpers.getDungeonProgress(userId, dungeonId)
    } catch (error) {
      console.error('Failed to load dungeon progress:', error)
      return null
    }
  }

  /**
   * 사용자의 모든 던전 진행상황 불러오기
   */
  async getAllDungeonProgress(userId: string): Promise<DBDungeonProgress[]> {
    try {
      return await dbHelpers.getAllDungeonProgress(userId)
    } catch (error) {
      console.error('Failed to load all dungeon progress:', error)
      return []
    }
  }
}

// 싱글톤 인스턴스 export
export const dungeonIntegrationService = DungeonIntegrationService.getInstance()