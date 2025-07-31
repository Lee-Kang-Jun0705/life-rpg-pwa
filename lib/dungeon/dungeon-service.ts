import { 
  Dungeon, 
  DungeonProgress, 
  Challenge, 
  DifficultyLevel,
  DungeonType,
  DungeonStats,
  DungeonReward,
  DungeonStatus
} from './types'
import { EnergyService } from '../energy/energy-service'
import { DUNGEON_ENERGY_COST } from '../types/energy'
import { StageService } from './stage-service'
import { DUNGEON_STAGES_MAP } from './stage-data'
import { DungeonRepository } from './dungeon-repository'
import { DungeonFactory } from './dungeon-factory'
import { DUNGEON_TEMPLATES_ARRAY } from './dungeon-templates-array'
import { getClientDatabase } from '../database/client'

// 필요한 인터페이스 추가
interface DungeonProgressData extends Omit<DungeonProgress, 'id'> {
  id?: number
}

export class DungeonService {
  private static instance: DungeonService
  private energyService: EnergyService
  
  constructor() {
    this.energyService = EnergyService.getInstance()
  }
  
  static getInstance(): DungeonService {
    if (!DungeonService.instance) {
      DungeonService.instance = new DungeonService()
    }
    return DungeonService.instance
  }

  // 사용 가능한 던전 목록 가져오기
  async getAvailableDungeons(_userId: string, _userLevel: number = 1): Promise<Dungeon[]> {
    try {
      const db = getClientDatabase()
      if (!db) {
        console.warn('Database not available, returning default dungeons')
        return DUNGEON_TEMPLATES_ARRAY
      }

      // IndexedDB에서 던전 진행 상황 가져오기
      const progressRecords = await db.dungeonProgress
        .where('userId')
        .equals(userId)
        .toArray()

      // 플레이어 에너지 상태 가져오기
      const energyState = await this.energyService.getPlayerEnergyState(userId)
      
      // 스테이지 서비스 인스턴스
      const stageService = StageService.getInstance()

      const now = new Date()
      
      return await Promise.all(DUNGEON_TEMPLATES_ARRAY.map(async template => {
        const progress = progressRecords.find(p => p.dungeonId === template.id)
        const isCompleted = !!(progress?.status === 'completed' && 
          progress.completedAt && 
          progress.completedAt > template.resetTime)

        const attempts = progress?.attempts || 0
        const energyRequired = DUNGEON_ENERGY_COST[template.difficulty as keyof typeof DUNGEON_ENERGY_COST] || 20
        const hasEnoughEnergy = energyState.energy.current >= energyRequired

        const isAvailable = this.checkRequirements(template, userLevel) && 
          (!template.maxAttempts || attempts < template.maxAttempts) &&
          !isCompleted &&
          hasEnoughEnergy

        // 스테이지 정보 가져오기
        let stageInfo = {
          hasStages: false,
          totalStages: 0,
          completedStages: 0,
          currentStage: 0
        }

        if (DUNGEON_STAGES_MAP[template.id]) {
          const dungeonStages = DUNGEON_STAGES_MAP[template.id]
          const stageProgress = await stageService.getDungeonStageProgress(userId, template.id)
          
          stageInfo = {
            hasStages: true,
            totalStages: dungeonStages.totalStages,
            completedStages: stageProgress.filter(s => s.status === 'completed').length,
            currentStage: stageProgress.findIndex(s => s.status === 'available') + 1
          }
        }

        return {
          ...template,
          isAvailable,
          isCompleted,
          completedAt: progress?.completedAt,
          attempts,
          energyRequired,
          hasEnoughEnergy,
          ...stageInfo
        } as Dungeon & { energyRequired: number; hasEnoughEnergy: boolean }
      }))
    } catch (error) {
      console.error('Failed to get dungeons:', error)
      return []
    }
  }

  // 던전 입장
  async enterDungeon(_dungeonId: string, _userId: string): Promise<DungeonProgress | null> {
    try {
      const dungeon = DUNGEON_TEMPLATES_ARRAY.find(d => d.id === dungeonId)
      if (!dungeon) return null

      // 에너지 체크
      const energyCheck = await this.energyService.checkEnergy(userId, dungeon.difficulty)
      if (!energyCheck.hasEnough) {
        throw new Error(`에너지가 부족합니다. 필요: ${energyCheck.required}, 현재: ${energyCheck.current}`)
      }

      // 에너지 소비
      const energyResult = await this.energyService.consumeEnergy(
        userId,
        energyCheck.required,
        `던전 입장: ${dungeon.name}`
      )

      if (!energyResult.success) {
        throw new Error(energyResult.error || '에너지 소비 실패')
      }

      const db = getClientDatabase()
      if (!db) {
        throw new Error('Database not available')
      }

      // 기존 진행 상황 확인
      const existing = await db.dungeonProgress
        .where(['dungeonId', 'userId'])
        .equals([dungeonId, userId])
        .first()

      const attempts = (existing?.attempts || 0) + 1

      const progressData: DungeonProgressData = {
        dungeonId,
        userId,
        startedAt: new Date(),
        completedChallenges: [],
        totalProgress: 0,
        status: 'in_progress',
        attempts
      }

      if (existing?.id) {
        await db.dungeonProgress.put({ ...progressData, id: existing.id })
      } else {
        await db.dungeonProgress.add(progressData)
      }

      return progressData
    } catch (error) {
      console.error('Failed to enter dungeon:', error)
      // 에너지 환불 (실패 시)
      if (error instanceof Error && error.message.includes('에너지')) {
        // 에너지 관련 오류는 그대로 전달
        throw error
      }
      return null
    }
  }

  // 도전 과제 진행 상황 업데이트
  async updateChallengeProgress(
    _dungeonId: string,
    _challengeId: string,
    _userId: string,
    progressValue: number
  ): Promise<boolean> {
    try {
      const dungeon = DUNGEON_TEMPLATES_ARRAY.find(d => d.id === dungeonId)
      if (!dungeon) return false

      const challenge = dungeon.challenges.find(c => c.id === challengeId)
      if (!challenge) return false

      // 도전 과제 진행 상황 업데이트
      challenge.currentValue = Math.min(progressValue, challenge.targetValue)
      
      // 목표 달성 시 자동 완료
      if (challenge.currentValue >= challenge.targetValue) {
        const result = await this.completeChallenge(dungeonId, challengeId, userId)
        return result.success
      }

      return true
    } catch (error) {
      console.error('Failed to update challenge progress:', error)
      return false
    }
  }

  // 도전 과제 완료
  async completeChallenge(
    _dungeonId: string, 
    _challengeId: string, 
    _userId: string
  ): Promise<{ success: boolean; completed?: boolean; rewards?: DungeonReward }> {
    try {
      const db = getClientDatabase()
      if (!db) {
        return { success: false }
      }

      const progress = await db.dungeonProgress
        .where(['dungeonId', 'userId'])
        .equals([dungeonId, userId])
        .first()

      if (!progress || progress.status !== 'in_progress') return { success: false }

      const dungeon = DUNGEON_TEMPLATES_ARRAY.find(d => d.id === dungeonId)
      if (!dungeon) return { success: false }

      // 이미 완료한 도전인지 확인
      if (progress.completedChallenges.includes(challengeId)) return { success: false }

      // 도전 과제를 완료 상태로 변경
      const challenge = dungeon.challenges.find(c => c.id === challengeId)
      if (challenge) {
        challenge.completed = true
        challenge.completedAt = new Date()
      }

      // 도전 완료 처리
      progress.completedChallenges.push(challengeId)
      progress.totalProgress = (progress.completedChallenges.length / dungeon.challenges.length) * 100

      // 모든 도전 완료 시
      if (progress.completedChallenges.length === dungeon.challenges.length) {
        progress.status = 'completed'
        progress.completedAt = new Date()
        
        // 던전 완료 상태를 DB에 저장 (중요!)
        if (progress.id) {
          await db.dungeonProgress.put(progress)
        }
        
        // 보상 정보 반환
        return { success: true, completed: true, rewards: dungeon.rewards }
      }

      // 진행 상황 저장
      if (progress.id) {
        await db.dungeonProgress.put(progress)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to complete challenge:', error)
      return { success: false }
    }
  }

  // 던전 통계
  async getDungeonStats(_userId: string): Promise<DungeonStats> {
    try {
      const db = getClientDatabase()
      if (!db) {
        console.warn('Database not available, returning default stats')
        return {
          totalCompleted: 0,
          totalAttempts: 0,
          successRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          favoriteType: 'daily',
          totalRewardsEarned: {
            exp: 0,
            coins: 0,
            items: []
          }
        }
      }

      const allProgress = await db.dungeonProgress
        .where('userId')
        .equals(userId)
        .toArray()

      const completed = allProgress.filter(p => p.status === 'completed')
      const totalAttempts = allProgress.length
      const totalCompleted = completed.length

      return {
        totalCompleted,
        totalAttempts,
        successRate: totalAttempts > 0 ? (totalCompleted / totalAttempts) * 100 : 0,
        currentStreak: 0, // TODO: 연속 클리어 계산
        bestStreak: 0,
        favoriteType: 'daily',
        totalRewardsEarned: {
          exp: 0, // TODO: 실제 보상 집계
          coins: 0,
          items: 0
        }
      }
    } catch (error) {
      console.error('Failed to get dungeon stats:', error)
      return {
        totalCompleted: 0,
        totalAttempts: 0,
        successRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        favoriteType: 'daily',
        totalRewardsEarned: { exp: 0, coins: 0, items: 0 }
      }
    }
  }

  // 요구사항 확인
  private checkRequirements(dungeon: typeof DUNGEON_TEMPLATES_ARRAY[0], _userLevel: number): boolean {
    if (dungeon.requirements.minLevel && userLevel < dungeon.requirements.minLevel) {
      return false
    }

    // TODO: 스탯 요구사항 확인 (character-service와 연동 필요)
    
    return true
  }

  // 던전 리셋 (일일/주간)
  async resetDungeons(): Promise<void> {
    const now = new Date()
    
    for (const template of DUNGEON_TEMPLATES_ARRAY) {
      if (now > template.resetTime) {
        // 리셋 시간 업데이트
        if (template.type === 'daily') {
          template.resetTime = new Date(now.setHours(24, 0, 0, 0))
        } else if (template.type === 'weekly') {
          template.resetTime = new Date(now.setDate(now.getDate() + (7 - now.getDay())))
        }

        // 진행 상황 리셋
        const db = getClientDatabase()
        if (db) {
          await db.dungeonProgress
            .where('dungeonId')
            .equals(template.id)
            .modify({ attempts: 0, status: 'abandoned' })
        }
      }
    }
  }
}