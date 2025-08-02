'use client'

import { PlayerBehaviorData } from '@/lib/types/dynamic-quest'

/**
 * 플레이어 행동 패턴 분석 서비스
 */
export class PlayerBehaviorService {
  private static STORAGE_KEY = 'player-behavior-data'
  private static ANALYSIS_INTERVAL = 24 * 60 * 60 * 1000 // 24시간

  /**
   * 플레이어 행동 데이터 초기화
   */
  static initializeBehaviorData(userId: string): PlayerBehaviorData {
    return {
      userId,
      combatPreference: {
        totalBattles: 0,
        preferredElements: [],
        averageBattleDuration: 0,
        winRate: 0,
        mostUsedSkills: []
      },
      explorationPreference: {
        totalDungeonsCleared: 0,
        preferredDungeonTypes: [],
        averageClearTime: 0,
        preferredDifficulty: 'normal'
      },
      collectionPreference: {
        totalItemsCollected: 0,
        preferredItemTypes: [],
        craftingActivity: 0
      },
      playTimePattern: {
        averageSessionDuration: 0,
        preferredPlayTime: [],
        playFrequency: 0,
        lastPlayedAt: new Date().toISOString()
      },
      progression: {
        currentLevel: 1,
        totalExp: 0,
        mainQuestProgress: 0,
        completedQuestCount: 0
      }
    }
  }

  /**
   * 플레이어 행동 데이터 가져오기
   */
  static getBehaviorData(userId: string): PlayerBehaviorData {
    const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userId}`)
    if (stored) {
      return JSON.parse(stored)
    }
    return this.initializeBehaviorData(userId)
  }

  /**
   * 플레이어 행동 데이터 저장
   */
  static saveBehaviorData(data: PlayerBehaviorData): void {
    localStorage.setItem(`${this.STORAGE_KEY}-${data.userId}`, JSON.stringify(data))
  }

  /**
   * 전투 행동 기록
   */
  static recordBattleActivity(
    userId: string,
    battleData: {
      duration: number
      won: boolean
      enemyElement?: string
      skillsUsed: string[]
    }
  ): void {
    const behavior = this.getBehaviorData(userId)
    
    // 전투 통계 업데이트
    behavior.combatPreference.totalBattles++
    
    // 평균 전투 시간 계산
    const totalDuration = behavior.combatPreference.averageBattleDuration * 
      (behavior.combatPreference.totalBattles - 1) + battleData.duration
    behavior.combatPreference.averageBattleDuration = 
      totalDuration / behavior.combatPreference.totalBattles
    
    // 승률 계산
    if (battleData.won) {
      const wins = behavior.combatPreference.winRate * 
        (behavior.combatPreference.totalBattles - 1) / 100
      behavior.combatPreference.winRate = 
        ((wins + 1) / behavior.combatPreference.totalBattles) * 100
    }
    
    // 선호 속성 업데이트
    if (battleData.enemyElement && battleData.won) {
      const elementIndex = behavior.combatPreference.preferredElements
        .findIndex(e => e === battleData.enemyElement)
      if (elementIndex === -1) {
        behavior.combatPreference.preferredElements.push(battleData.enemyElement)
      }
    }
    
    // 자주 사용하는 스킬 업데이트
    battleData.skillsUsed.forEach(skill => {
      if (!behavior.combatPreference.mostUsedSkills.includes(skill)) {
        behavior.combatPreference.mostUsedSkills.push(skill)
      }
    })
    
    this.saveBehaviorData(behavior)
  }

  /**
   * 던전 탐험 행동 기록
   */
  static recordDungeonActivity(
    userId: string,
    dungeonData: {
      dungeonId: string
      dungeonType: string
      clearTime: number
      difficulty: string
      cleared: boolean
    }
  ): void {
    const behavior = this.getBehaviorData(userId)
    
    if (dungeonData.cleared) {
      behavior.explorationPreference.totalDungeonsCleared++
      
      // 평균 클리어 시간 계산
      const totalTime = behavior.explorationPreference.averageClearTime * 
        (behavior.explorationPreference.totalDungeonsCleared - 1) + dungeonData.clearTime
      behavior.explorationPreference.averageClearTime = 
        totalTime / behavior.explorationPreference.totalDungeonsCleared
      
      // 선호 던전 타입 업데이트
      if (!behavior.explorationPreference.preferredDungeonTypes.includes(dungeonData.dungeonType)) {
        behavior.explorationPreference.preferredDungeonTypes.push(dungeonData.dungeonType)
      }
      
      // 선호 난이도 업데이트
      behavior.explorationPreference.preferredDifficulty = dungeonData.difficulty
    }
    
    this.saveBehaviorData(behavior)
  }

  /**
   * 아이템 수집 행동 기록
   */
  static recordCollectionActivity(
    userId: string,
    itemData: {
      itemId: string
      itemType: string
      quantity: number
      fromCrafting?: boolean
    }
  ): void {
    const behavior = this.getBehaviorData(userId)
    
    behavior.collectionPreference.totalItemsCollected += itemData.quantity
    
    // 선호 아이템 타입 업데이트
    if (!behavior.collectionPreference.preferredItemTypes.includes(itemData.itemType)) {
      behavior.collectionPreference.preferredItemTypes.push(itemData.itemType)
    }
    
    // 제작 활동 기록
    if (itemData.fromCrafting) {
      behavior.collectionPreference.craftingActivity++
    }
    
    this.saveBehaviorData(behavior)
  }

  /**
   * 플레이 시간 패턴 기록
   */
  static recordPlaySession(
    userId: string,
    sessionData: {
      startTime: Date
      endTime: Date
    }
  ): void {
    const behavior = this.getBehaviorData(userId)
    
    // 세션 시간 계산
    const sessionDuration = sessionData.endTime.getTime() - sessionData.startTime.getTime()
    
    // 평균 세션 시간 업데이트
    const sessions = behavior.playTimePattern.playFrequency || 1
    const totalDuration = behavior.playTimePattern.averageSessionDuration * sessions + sessionDuration
    behavior.playTimePattern.averageSessionDuration = totalDuration / (sessions + 1)
    
    // 선호 플레이 시간대 판단
    const hour = sessionData.startTime.getHours()
    let timeOfDay: string
    if (hour >= 6 && hour < 12) {
      timeOfDay = 'morning'
    } else if (hour >= 12 && hour < 18) {
      timeOfDay = 'afternoon'
    } else if (hour >= 18 && hour < 24) {
      timeOfDay = 'evening'
    } else {
      timeOfDay = 'night'
    }
    
    if (!behavior.playTimePattern.preferredPlayTime.includes(timeOfDay)) {
      behavior.playTimePattern.preferredPlayTime.push(timeOfDay)
    }
    
    // 플레이 빈도 업데이트
    behavior.playTimePattern.playFrequency++
    behavior.playTimePattern.lastPlayedAt = sessionData.endTime.toISOString()
    
    this.saveBehaviorData(behavior)
  }

  /**
   * 진행 상황 업데이트
   */
  static updateProgression(
    userId: string,
    progressData: {
      level?: number
      exp?: number
      questCompleted?: boolean
      mainQuestProgress?: number
    }
  ): void {
    const behavior = this.getBehaviorData(userId)
    
    if (progressData.level) {
      behavior.progression.currentLevel = progressData.level
    }
    
    if (progressData.exp) {
      behavior.progression.totalExp += progressData.exp
    }
    
    if (progressData.questCompleted) {
      behavior.progression.completedQuestCount++
    }
    
    if (progressData.mainQuestProgress !== undefined) {
      behavior.progression.mainQuestProgress = progressData.mainQuestProgress
    }
    
    this.saveBehaviorData(behavior)
  }

  /**
   * 플레이어 행동 분석 및 선호도 계산
   */
  static analyzePlayerPreferences(userId: string): {
    primaryCategory: string
    secondaryCategory: string
    playStyle: 'casual' | 'regular' | 'hardcore'
    recommendedDifficulty: string
  } {
    const behavior = this.getBehaviorData(userId)
    
    // 주요 카테고리 판단
    const scores = {
      battle: behavior.combatPreference.totalBattles * 2 + 
        behavior.combatPreference.winRate,
      exploration: behavior.explorationPreference.totalDungeonsCleared * 3,
      collection: behavior.collectionPreference.totalItemsCollected + 
        behavior.collectionPreference.craftingActivity * 5
    }
    
    const sortedCategories = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category)
    
    // 플레이 스타일 판단
    let playStyle: 'casual' | 'regular' | 'hardcore'
    const avgSession = behavior.playTimePattern.averageSessionDuration / (60 * 60 * 1000) // 시간 단위
    
    if (avgSession < 1 || behavior.playTimePattern.playFrequency < 3) {
      playStyle = 'casual'
    } else if (avgSession < 3 || behavior.playTimePattern.playFrequency < 7) {
      playStyle = 'regular'
    } else {
      playStyle = 'hardcore'
    }
    
    // 추천 난이도
    const recommendedDifficulty = behavior.explorationPreference.preferredDifficulty || 'normal'
    
    return {
      primaryCategory: sortedCategories[0] || 'battle',
      secondaryCategory: sortedCategories[1] || 'exploration',
      playStyle,
      recommendedDifficulty
    }
  }

  /**
   * 비활성 기간 계산
   */
  static getInactivityDays(userId: string): number {
    const behavior = this.getBehaviorData(userId)
    const lastPlayed = new Date(behavior.playTimePattern.lastPlayedAt)
    const now = new Date()
    
    const diffTime = Math.abs(now.getTime() - lastPlayed.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }
}