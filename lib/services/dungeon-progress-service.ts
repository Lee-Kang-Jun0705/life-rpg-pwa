'use client'

import type { DungeonProgress, DungeonSaveState, DungeonStatistics } from '@/lib/types/dungeon-progress'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { checkMilestoneUnlocked, getMilestoneInfo } from '@/lib/config/dungeon-milestones'

export class DungeonProgressService {
  private static instance: DungeonProgressService
  private readonly STORAGE_KEY = 'dungeon_progress'
  private readonly SAVE_STATE_KEY = 'dungeon_save_state'
  private readonly STATISTICS_KEY = 'dungeon_statistics'

  static getInstance(): DungeonProgressService {
    if (!DungeonProgressService.instance) {
      DungeonProgressService.instance = new DungeonProgressService()
    }
    return DungeonProgressService.instance
  }

  // 던전 진행 상황 불러오기
  getDungeonProgress(userId: string, dungeonId: number): DungeonProgress | null {
    if (typeof window === 'undefined') return null
    
    const key = `${this.STORAGE_KEY}_${userId}`
    const data = localStorage.getItem(key)
    
    if (!data) return null
    
    try {
      const allProgress: Record<number, DungeonProgress> = JSON.parse(data)
      return allProgress[dungeonId] || null
    } catch (error) {
      console.error('Failed to load dungeon progress:', error)
      return null
    }
  }

  // 모든 던전 진행 상황 불러오기
  getAllDungeonProgress(userId: string): Record<number, DungeonProgress> {
    if (typeof window === 'undefined') return {}
    
    const key = `${this.STORAGE_KEY}_${userId}`
    const data = localStorage.getItem(key)
    
    if (!data) return {}
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load all dungeon progress:', error)
      return {}
    }
  }

  // 던전 진행 상황 저장
  saveDungeonProgress(userId: string, dungeonId: number, progress: Partial<DungeonProgress>): void {
    if (typeof window === 'undefined') return
    
    const key = `${this.STORAGE_KEY}_${userId}`
    const allProgress = this.getAllDungeonProgress(userId)
    
    // 기존 데이터와 병합
    const existingProgress = allProgress[dungeonId] || {
      dungeonId,
      totalClears: 0,
      totalGoldEarned: 0,
      unlockedMilestones: []
    }
    
    allProgress[dungeonId] = {
      ...existingProgress,
      ...progress,
      dungeonId // dungeonId는 변경 불가
    }
    
    localStorage.setItem(key, JSON.stringify(allProgress))
  }

  // 던전 클리어 기록
  recordDungeonClear(userId: string, dungeonId: number, clearTime: number, goldEarned: number): { newMilestones: Array<{ threshold: number; title: string; goldReward: number }> } {
    const progress = this.getDungeonProgress(userId, dungeonId) || {
      dungeonId,
      totalClears: 0,
      totalGoldEarned: 0,
      unlockedMilestones: []
    }
    
    const now = new Date().toISOString()
    const isFirstClear = progress.totalClears === 0
    const newClearCount = progress.totalClears + 1
    
    // 새로 달성한 마일스톤 확인
    const previousMilestones = progress.unlockedMilestones || []
    const currentMilestones = checkMilestoneUnlocked(dungeonId, newClearCount)
    const newMilestoneThresholds = currentMilestones.filter(m => !previousMilestones.includes(m))
    
    // 새로 달성한 마일스톤 정보 가져오기
    const newMilestones = newMilestoneThresholds.map(threshold => {
      const info = getMilestoneInfo(dungeonId, threshold)
      if (info) {
        // 칭호 추가
        this.addUnlockedTitle(userId, info.title)
        // 보상 골드 추가
        goldEarned += info.goldReward
      }
      return info
    }).filter(Boolean) as Array<{ threshold: number; title: string; goldReward: number }>
    
    // 업데이트
    this.saveDungeonProgress(userId, dungeonId, {
      firstClearDate: isFirstClear ? now : progress.firstClearDate,
      lastClearDate: now,
      totalClears: newClearCount,
      totalGoldEarned: progress.totalGoldEarned + goldEarned,
      bestTime: !progress.bestTime || clearTime < progress.bestTime ? clearTime : progress.bestTime,
      unlockedMilestones: currentMilestones
    })
    
    // 통계 업데이트
    this.updateStatistics(userId, goldEarned, clearTime)
    
    return { newMilestones }
  }

  // 첫 클리어 여부 확인
  isFirstClear(userId: string, dungeonId: number): boolean {
    const progress = this.getDungeonProgress(userId, dungeonId)
    return !progress || progress.totalClears === 0
  }

  // 현재 진행 중인 던전 상태 저장
  saveCurrentState(userId: string, state: DungeonSaveState): void {
    if (typeof window === 'undefined') return
    
    const key = `${this.SAVE_STATE_KEY}_${userId}`
    localStorage.setItem(key, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }))
  }

  // 현재 진행 중인 던전 상태 불러오기
  getCurrentState(userId: string): DungeonSaveState | null {
    if (typeof window === 'undefined') return null
    
    const key = `${this.SAVE_STATE_KEY}_${userId}`
    const data = localStorage.getItem(key)
    
    if (!data) return null
    
    try {
      const state = JSON.parse(data)
      
      // 24시간 이상 지난 상태는 무효
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
        this.clearCurrentState(userId)
        return null
      }
      
      return state
    } catch (error) {
      console.error('Failed to load current state:', error)
      return null
    }
  }

  // 현재 상태 초기화
  clearCurrentState(userId: string): void {
    if (typeof window === 'undefined') return
    
    const key = `${this.SAVE_STATE_KEY}_${userId}`
    localStorage.removeItem(key)
  }

  // 통계 업데이트
  private updateStatistics(userId: string, goldEarned: number, playTime: number): void {
    if (typeof window === 'undefined') return
    
    const key = `${this.STATISTICS_KEY}_${userId}`
    const stats = this.getStatistics(userId)
    
    stats.totalDungeonsCleared++
    stats.totalGoldEarned += goldEarned
    stats.totalPlayTime += playTime
    
    // 가장 많이 클리어한 던전 계산
    const allProgress = this.getAllDungeonProgress(userId)
    let maxClears = 0
    let favoriteDungeon: number | undefined
    
    Object.entries(allProgress).forEach(([dungeonId, progress]) => {
      if (progress.totalClears > maxClears) {
        maxClears = progress.totalClears
        favoriteDungeon = parseInt(dungeonId)
      }
    })
    
    stats.favoriteDungeon = favoriteDungeon
    
    localStorage.setItem(key, JSON.stringify(stats))
  }

  // 통계 불러오기
  getStatistics(userId: string): DungeonStatistics {
    if (typeof window === 'undefined') {
      return {
        totalDungeonsCleared: 0,
        totalGoldEarned: 0,
        totalPlayTime: 0,
        unlockedTitles: []
      }
    }
    
    const key = `${this.STATISTICS_KEY}_${userId}`
    const data = localStorage.getItem(key)
    
    if (!data) {
      return {
        totalDungeonsCleared: 0,
        totalGoldEarned: 0,
        totalPlayTime: 0,
        unlockedTitles: []
      }
    }
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
      return {
        totalDungeonsCleared: 0,
        totalGoldEarned: 0,
        totalPlayTime: 0,
        unlockedTitles: []
      }
    }
  }

  // 칭호 추가
  addUnlockedTitle(userId: string, title: string): void {
    const stats = this.getStatistics(userId)
    
    if (!stats.unlockedTitles.includes(title)) {
      stats.unlockedTitles.push(title)
      
      if (typeof window !== 'undefined') {
        const key = `${this.STATISTICS_KEY}_${userId}`
        localStorage.setItem(key, JSON.stringify(stats))
      }
    }
  }
  
  // 마일스톤 정보 가져오기 (숨김 처리)
  getMilestoneInfoForDisplay(userId: string, dungeonId: number) {
    const progress = this.getDungeonProgress(userId, dungeonId)
    const clearCount = progress?.totalClears || 0
    const unlockedMilestones = progress?.unlockedMilestones || []
    
    // 모든 가능한 마일스톤 중 달성한 것만 표시
    return {
      clearCount,
      unlockedMilestones: unlockedMilestones.map(threshold => {
        const info = getMilestoneInfo(dungeonId, threshold)
        return info ? { ...info, unlocked: true } : null
      }).filter(Boolean),
      // 다음 마일스톤은 숨김 (???로 표시)
      nextMilestone: null // 유저가 알 수 없도록 함
    }
  }
}

// 전역 인스턴스
export const dungeonProgressService = DungeonProgressService.getInstance()