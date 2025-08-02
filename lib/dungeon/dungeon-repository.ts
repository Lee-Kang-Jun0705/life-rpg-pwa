import { db, DungeonProgressData } from '../db'
import { DungeonProgress, DungeonStatus } from './types'

/**
 * 던전 데이터베이스 작업을 위한 Repository 패턴 구현
 */
export class DungeonRepository {
  /**
   * 던전 진행 상황 조회
   */
  static async getProgress(dungeonId: string, userId: string): Promise<DungeonProgress | null> {
    try {
      const progressData = await db.dungeonProgress
        .where(['dungeonId', 'userId'])
        .equals([dungeonId, userId])
        .first()

      if (!progressData) {
        return null
      }

      return this.mapToProgress(progressData)
    } catch (error) {
      console.error('[DungeonRepository] getProgress error:', error)
      return null
    }
  }

  /**
   * 사용자의 모든 던전 진행 상황 조회
   */
  static async getUserProgress(userId: string): Promise<DungeonProgress[]> {
    try {
      const progressData = await db.dungeonProgress
        .where('userId')
        .equals(userId)
        .toArray()

      return progressData.map(this.mapToProgress)
    } catch (error) {
      console.error('[DungeonRepository] getUserProgress error:', error)
      return []
    }
  }

  /**
   * 진행 중인 던전 조회
   */
  static async getActiveProgress(userId: string): Promise<DungeonProgress[]> {
    try {
      const progressData = await db.dungeonProgress
        .where('userId')
        .equals(userId)
        .and(p => p.status === 'in_progress')
        .toArray()

      return progressData.map(this.mapToProgress)
    } catch (error) {
      console.error('[DungeonRepository] getActiveProgress error:', error)
      return []
    }
  }

  /**
   * 던전 진행 상황 생성
   */
  static async createProgress(progress: Omit<DungeonProgress, 'id'>): Promise<DungeonProgress | null> {
    try {
      const data: DungeonProgressData = {
        dungeonId: progress.dungeonId,
        userId: progress.userId,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        completedChallenges: progress.completedChallenges,
        totalProgress: progress.totalProgress,
        status: progress.status as DungeonProgressData['status'],
        attempts: 1
      }

      const id = await db.dungeonProgress.add(data)
      return { ...progress, id: String(id) }
    } catch (error) {
      console.error('[DungeonRepository] createProgress error:', error)
      return null
    }
  }

  /**
   * 던전 진행 상황 업데이트
   */
  static async updateProgress(
    dungeonId: string,
    userId: string,
    updates: Partial<DungeonProgress>
  ): Promise<boolean> {
    try {
      const result = await db.dungeonProgress
        .where(['dungeonId', 'userId'])
        .equals([dungeonId, userId])
        .modify({
          ...updates,
          updatedAt: new Date()
        })

      return result > 0
    } catch (error) {
      console.error('[DungeonRepository] updateProgress error:', error)
      return false
    }
  }

  /**
   * 던전 진행 상황 삭제
   */
  static async deleteProgress(dungeonId: string, userId: string): Promise<boolean> {
    try {
      await db.dungeonProgress
        .where(['dungeonId', 'userId'])
        .equals([dungeonId, userId])
        .delete()

      return true
    } catch (error) {
      console.error('[DungeonRepository] deleteProgress error:', error)
      return false
    }
  }

  /**
   * 완료된 던전 수 조회
   */
  static async getCompletedCount(userId: string): Promise<number> {
    try {
      return await db.dungeonProgress
        .where('userId')
        .equals(userId)
        .and(p => p.status === 'completed' || p.status === 'cleared')
        .count()
    } catch (error) {
      console.error('[DungeonRepository] getCompletedCount error:', error)
      return 0
    }
  }

  /**
   * 데이터베이스 모델을 도메인 모델로 변환
   */
  private static mapToProgress(data: DungeonProgressData): DungeonProgress {
    return {
      id: String(data.id),
      dungeonId: data.dungeonId,
      userId: data.userId,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      completedChallenges: data.completedChallenges,
      totalProgress: data.totalProgress,
      status: data.status as DungeonStatus,
      currentStage: data.currentStage
    }
  }
}
