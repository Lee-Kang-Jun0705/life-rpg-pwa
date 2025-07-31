// 스테이지 시스템 서비스
// 던전 내 스테이지 진행 및 관리

import { dbHelpers } from '@/lib/database'
import type { 
  Stage, 
  StageProgress, 
  StageResult, 
  StageClearRating,
  StageObjective 
} from '@/lib/types/stage'
import { 
  getStagesForDungeon, 
  getStageById, 
  getBattleConfig,
  DUNGEON_STAGES_MAP 
} from './stage-data'
import { calculateStars } from '@/lib/types/stage'
import { GameError } from '@/lib/types/game-common'

interface ProgressObjective {
  id: string
  current: number
  completed: boolean
}

// 스테이지 진행 데이터 인터페이스
export interface StageProgressData {
  id?: number
  userId: string
  dungeonId: string
  stageId: string
  status: 'locked' | 'available' | 'in_progress' | 'completed'
  stars: number
  bestTime?: number
  attempts: number
  objectives: string // JSON string of objectives
  firstClearDate?: Date
  lastAttemptDate?: Date
}

export class StageService {
  private static instance: StageService
  
  static getInstance(): StageService {
    if (!StageService.instance) {
      StageService.instance = new StageService()
    }
    return StageService.instance
  }

  // 던전의 스테이지 진행 상황 가져오기
  async getDungeonStageProgress(
    userId: string, 
    dungeonId: string
  ): Promise<StageProgress[]> {
    try {
      const stages = getStagesForDungeon(dungeonId)
      if (!stages.length) return []

      // DB에서 스테이지별 진행 상황 가져오기
      const progressData = await dbHelpers.getDungeonStageProgress(userId, dungeonId)

      // 스테이지별 진행 상황 맵 생성
      const progressMap = new Map<string, any>()
      progressData.forEach(progress => {
        try {
          progressMap.set(progress.stageId, {
            ...progress,
            objectives: JSON.parse(progress.objectives || '[]')
          })
        } catch (error) {
          console.error('Failed to parse objectives:', error)
          progressMap.set(progress.stageId, {
            ...progress,
            objectives: []
          })
        }
      })
      
      return stages.map((stage, index) => {
        const progress = progressMap.get(stage.id)
        
        // 잠금 해제 조건 확인
        let isUnlocked = index === 0 // 첫 스테이지는 항상 열림
        
        if (stage.unlockCondition && index > 0) {
          switch (stage.unlockCondition.type) {
            case 'clear_previous':
              const prevProgress = progressMap.get(stages[index - 1].id)
              isUnlocked = prevProgress?.status === 'completed'
              break
            case 'player_level':
              // TODO: 플레이어 레벨 체크 - 일단 true로 설정
              isUnlocked = true
              break
            case 'total_stars':
              const totalStars = Array.from(progressMap.values())
                .reduce((sum, p) => sum + (p.stars || 0), 0)
              isUnlocked = totalStars >= stage.unlockCondition.value
              break
          }
        }
        
        return {
          stageId: stage.id,
          status: progress?.status || (isUnlocked ? 'available' : 'locked'),
          stars: progress?.stars || 0,
          bestTime: progress?.bestTime,
          attempts: progress?.attempts || 0,
          objectives: stage.objectives.map(obj => {
            const progressObj = progress?.objectives?.find((po: ProgressObjective) => po.id === obj.id)
            return {
              ...obj,
              current: progressObj?.current || 0,
              completed: progressObj?.completed || false
            }
          }),
          firstClearDate: progress?.firstClearDate,
          lastAttemptDate: progress?.lastAttemptDate
        } as StageProgress
      })
    } catch (error) {
      console.error('Failed to get stage progress:', error)
      return []
    }
  }

  // 스테이지 시작
  async startStage(
    userId: string,
    dungeonId: string,
    stageId: string
  ): Promise<boolean> {
    try {
      const stage = getStageById(stageId)
      if (!stage) {
        throw new GameError('STAGE_ERROR', '존재하지 않는 스테이지입니다')
      }

      // 스테이지 진행 가능 여부 확인
      const progress = await this.getDungeonStageProgress(userId, dungeonId)
      const stageProgress = progress.find(p => p.stageId === stageId)
      
      if (!stageProgress || stageProgress.status === 'locked') {
        throw new GameError('STAGE_ERROR', '아직 잠긴 스테이지입니다')
      }

      // 진행 상태 업데이트 - DB에 저장
      await dbHelpers.updateStageProgress(userId, dungeonId, stageId, {
        status: 'in_progress',
        lastAttemptDate: new Date()
      })
      
      return true
    } catch (error) {
      if (error instanceof GameError) throw error
      
      throw new GameError(
        'STAGE_ERROR',
        '스테이지 시작 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 스테이지 완료
  async completeStage(
    userId: string,
    dungeonId: string,
    stageId: string,
    result: {
      clearTime: number
      healthPercent: number
      objectivesCompleted: StageObjective[]
      damageDealt: number
      damageTaken: number
      monstersDefeated: number
    }
  ): Promise<StageResult> {
    try {
      const stage = getStageById(stageId)
      if (!stage) {
        throw new GameError('STAGE_ERROR', '존재하지 않는 스테이지입니다')
      }

      // 별 계산
      const stars = calculateStars(
        result.clearTime,
        result.healthPercent,
        result.objectivesCompleted.filter(obj => obj.completed).length,
        stage.objectives.length
      )

      // 점수 계산
      const score = Math.floor(
        (result.damageDealt * 0.3) +
        (result.monstersDefeated * 100) +
        (result.healthPercent * 1000) +
        (stars * 500) -
        (result.clearTime * 10)
      )

      // 보상 계산 - For now, assume it's first clear
      // This would be implemented with proper database tracking
      const isFirstClear = true
      const baseRewards = { ...stage.rewards }
      const bonusRewards: { exp?: number; gold?: number; items?: string[] } = {}
      
      // 별 개수에 따른 보너스
      if (stars >= 3) {
        bonusRewards.exp = Math.floor(baseRewards.exp * 0.5)
        bonusRewards.gold = Math.floor(baseRewards.gold * 0.5)
      } else if (stars >= 2) {
        bonusRewards.exp = Math.floor(baseRewards.exp * 0.2)
        bonusRewards.gold = Math.floor(baseRewards.gold * 0.2)
      }

      // 첫 클리어 보너스
      if (isFirstClear && stage.rewards.firstClearBonus) {
        bonusRewards.exp = (bonusRewards.exp || 0) + stage.rewards.firstClearBonus.exp
        bonusRewards.gold = (bonusRewards.gold || 0) + stage.rewards.firstClearBonus.gold
        if (stage.rewards.firstClearBonus.items) {
          bonusRewards.items = [
            ...(bonusRewards.items || []),
            ...stage.rewards.firstClearBonus.items
          ]
        }
      }

      const totalRewards = {
        exp: baseRewards.exp + (bonusRewards.exp || 0),
        gold: baseRewards.gold + (bonusRewards.gold || 0),
        items: [
          ...(baseRewards.items || []),
          ...(bonusRewards.items || [])
        ]
      }

      // 결과 생성
      const stageResult: StageResult = {
        stageId,
        success: true,
        rating: {
          stars,
          score,
          timeBonus: Math.max(0, 300 - result.clearTime) * 10,
          perfectBonus: result.healthPercent >= 1.0,
          objectivesCompleted: result.objectivesCompleted.filter(obj => obj.completed).length,
          totalObjectives: stage.objectives.length
        },
        rewards: {
          base: baseRewards,
          bonus: bonusRewards,
          total: totalRewards
        },
        statistics: {
          damageDealt: result.damageDealt,
          damageTaken: result.damageTaken,
          monstersDefeated: result.monstersDefeated,
          skillsUsed: 0, // TODO: 향후 스킬 시스템 구현 시 추가
          comboDamage: 0, // TODO: 향후 콤보 시스템 구현 시 추가
          clearTime: result.clearTime
        }
      }

      // DB에 기록 저장 - 이미 dbHelpers.completeStage에서 처리됨

      return stageResult
    } catch (error) {
      if (error instanceof GameError) throw error
      
      throw new GameError(
        'STAGE_ERROR',
        '스테이지 완료 처리 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 스테이지 진행도 업데이트
  async updateStageProgress(
    userId: string,
    dungeonId: string,
    stageId: string,
    objectiveId: string,
    progress: number
  ): Promise<void> {
    try {
      // 현재 스테이지 진행상황 가져오기
      const currentProgress = await dbHelpers.getStageProgress(userId, dungeonId, stageId)
      if (!currentProgress) {
        // 스테이지 진행상황이 없으면 새로 생성
        await dbHelpers.updateStageProgress(userId, dungeonId, stageId, {
          status: 'in_progress'
        })
        return
      }

      // 목표 진행도 업데이트
      let objectives = []
      try {
        objectives = JSON.parse(currentProgress.objectives || '[]')
      } catch (error) {
        objectives = []
      }

      const objectiveIndex = objectives.findIndex((obj: StageObjective) => obj.id === objectiveId)
      if (objectiveIndex >= 0) {
        objectives[objectiveIndex].current = Math.max(objectives[objectiveIndex].current || 0, progress)
        objectives[objectiveIndex].completed = objectives[objectiveIndex].current >= objectives[objectiveIndex].target
      } else {
        // 새로운 목표 추가
        objectives.push({
          id: objectiveId,
          current: progress,
          completed: false
        })
      }

      // DB 업데이트
      await dbHelpers.updateStageProgress(userId, dungeonId, stageId, {
        objectives: JSON.stringify(objectives)
      })
    } catch (error) {
      throw new GameError(
        'STAGE_ERROR',
        '스테이지 진행도 업데이트 중 오류가 발생했습니다',
        { originalError: error }
      )
    }
  }

  // 던전 완료 여부 확인
  async checkDungeonCompletion(
    userId: string,
    dungeonId: string
  ): Promise<boolean> {
    try {
      const dungeonStages = DUNGEON_STAGES_MAP[dungeonId]
      if (!dungeonStages) return false

      const progress = await this.getDungeonStageProgress(userId, dungeonId)
      const completedStages = progress.filter(p => p.status === 'completed').length

      return completedStages >= dungeonStages.requiredStagesForCompletion
    } catch (error) {
      console.error('Failed to check dungeon completion:', error)
      return false
    }
  }

  // 총 별 개수 가져오기
  async getTotalStars(userId: string, dungeonId?: string): Promise<number> {
    try {
      // For now, return 0 as we don't have persistent star tracking
      // This would be implemented with proper database queries
      return 0
    } catch (error) {
      console.error('Failed to get total stars:', error)
      return 0
    }
  }
}

export default StageService