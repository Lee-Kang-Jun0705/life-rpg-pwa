/**
 * LevelSyncService - 캐릭터 레벨 동기화 서비스
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - Single Source of Truth - 대시보드 스탯이 유일한 레벨 소스
 * - 실시간 동기화 - Subscription 패턴 사용
 */

import { EventEmitter } from 'events'
import { PREDEFINED_MUTEXES } from '@/lib/utils/async-mutex'
import React from 'react'

// 대시보드 스탯 타입
export interface DashboardStats {
  strength: number
  intelligence: number
  agility: number
  vitality: number
}

// 캐릭터 레벨 정보
export interface CharacterLevel {
  level: number
  totalStatPoints: number
  stats: DashboardStats
  lastUpdated: number
}

// 레벨 변경 이벤트
export interface LevelChangeEvent {
  oldLevel: number
  newLevel: number
  reason: 'stats_updated' | 'manual_sync' | 'initial_load'
  timestamp: number
}

// 구독자 타입
export type LevelChangeListener = (event: LevelChangeEvent) => void

// 설정 상수 (코딩규칙: 하드코딩 금지)
const CONFIG = {
  // 레벨 계산 공식: 총 스탯 / 4 (각 스탯 1레벨 = 0.25 캐릭터 레벨)
  STATS_PER_LEVEL: 4,
  // 최대 캐릭터 레벨
  MAX_CHARACTER_LEVEL: 200,
  // 로컬 스토리지 키
  STORAGE_KEY: 'life_rpg_character_level',
  // 동기화 디바운스 시간 (ms)
  SYNC_DEBOUNCE: 500,
  // 이벤트 이름
  EVENTS: {
    STATS_UPDATED: 'stats-updated',
    LEVEL_CHANGED: 'level-changed',
    SYNC_REQUEST: 'level-sync-request'
  }
} as const

export class LevelSyncService extends EventEmitter {
  private static instance: LevelSyncService | null = null
  private currentLevel: CharacterLevel | null = null
  private subscribers = new Set<LevelChangeListener>()
  private syncDebounceTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  
  // 통계
  private stats = {
    totalSyncs: 0,
    levelChanges: 0,
    lastSyncTime: 0,
    averageSyncTime: 0,
    syncTimes: [] as number[]
  }
  
  private constructor() {
    super()
    this.setupEventListeners()
  }
  
  static getInstance(): LevelSyncService {
    if (!LevelSyncService.instance) {
      LevelSyncService.instance = new LevelSyncService()
    }
    return LevelSyncService.instance
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    console.log('[LevelSyncService] Initializing...')
    
    try {
      // 저장된 레벨 정보 로드
      await this.loadFromStorage()
      
      // 대시보드에서 현재 스탯 가져오기
      await this.syncWithDashboard('initial_load')
      
      this.isInitialized = true
      console.log('[LevelSyncService] Initialized successfully')
      
    } catch (error) {
      console.error('[LevelSyncService] Initialization failed:', error)
      throw error
    }
  }
  
  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 대시보드 스탯 업데이트 이벤트 수신
    window.addEventListener(CONFIG.EVENTS.STATS_UPDATED, async (event) => {
      const customEvent = event as CustomEvent<DashboardStats>
      console.log('[LevelSyncService] Stats updated event received:', customEvent.detail)
      
      // 디바운싱 처리
      if (this.syncDebounceTimer) {
        clearTimeout(this.syncDebounceTimer)
      }
      
      this.syncDebounceTimer = setTimeout(async () => {
        await this.updateStats(customEvent.detail, 'stats_updated')
      }, CONFIG.SYNC_DEBOUNCE)
    })
    
    // 수동 동기화 요청 이벤트
    window.addEventListener(CONFIG.EVENTS.SYNC_REQUEST, async () => {
      console.log('[LevelSyncService] Manual sync requested')
      await this.syncWithDashboard('manual_sync')
    })
  }
  
  /**
   * 대시보드와 동기화
   */
  private async syncWithDashboard(reason: LevelChangeEvent['reason']): Promise<void> {
    const startTime = performance.now()
    
    try {
      // 대시보드 스토어에서 스탯 가져오기
      const dashboardStats = await this.fetchDashboardStats()
      if (!dashboardStats) {
        console.warn('[LevelSyncService] No dashboard stats available')
        return
      }
      
      await this.updateStats(dashboardStats, reason)
      
      // 통계 업데이트
      const syncTime = performance.now() - startTime
      this.updateSyncStats(syncTime)
      
    } catch (error) {
      console.error('[LevelSyncService] Sync failed:', error)
      throw error
    }
  }
  
  /**
   * 대시보드 스탯 가져오기
   */
  private async fetchDashboardStats(): Promise<DashboardStats | null> {
    // 대시보드 스토어가 있다고 가정
    // 실제 구현 시 useAuthStore 또는 useStatsStore에서 가져옴
    try {
      // 임시 구현 - 로컬 스토리지에서 읽기
      const stored = localStorage.getItem('life_rpg_dashboard_stats')
      if (stored) {
        return JSON.parse(stored)
      }
      
      // 기본값
      return {
        strength: 1,
        intelligence: 1,
        agility: 1,
        vitality: 1
      }
    } catch (error) {
      console.error('[LevelSyncService] Failed to fetch dashboard stats:', error)
      return null
    }
  }
  
  /**
   * 스탯 업데이트 및 레벨 계산
   */
  private async updateStats(
    stats: DashboardStats,
    reason: LevelChangeEvent['reason']
  ): Promise<void> {
    const release = await PREDEFINED_MUTEXES.save.acquire()
    
    try {
      const totalStatPoints = stats.strength + stats.intelligence + stats.agility + stats.vitality
      const newLevel = Math.min(
        Math.floor(totalStatPoints / CONFIG.STATS_PER_LEVEL),
        CONFIG.MAX_CHARACTER_LEVEL
      )
      
      const oldLevel = this.currentLevel?.level || 1
      
      // 레벨 정보 업데이트
      this.currentLevel = {
        level: newLevel,
        totalStatPoints,
        stats: { ...stats },
        lastUpdated: Date.now()
      }
      
      // 저장
      await this.saveToStorage()
      
      // 레벨이 변경된 경우에만 이벤트 발생
      if (newLevel !== oldLevel) {
        const event: LevelChangeEvent = {
          oldLevel,
          newLevel,
          reason,
          timestamp: Date.now()
        }
        
        this.notifyLevelChange(event)
        this.stats.levelChanges++
        
        console.log(`[LevelSyncService] Level changed: ${oldLevel} -> ${newLevel}`)
      }
      
      this.stats.totalSyncs++
      
    } finally {
      release()
    }
  }
  
  /**
   * 현재 레벨 정보 조회
   */
  getCurrentLevel(): CharacterLevel | null {
    return this.currentLevel ? { ...this.currentLevel } : null
  }
  
  /**
   * 레벨만 조회
   */
  getLevel(): number {
    return this.currentLevel?.level || 1
  }
  
  /**
   * 레벨 변경 구독
   */
  subscribe(listener: LevelChangeListener): () => void {
    this.subscribers.add(listener)
    
    // 현재 레벨 정보 즉시 전달
    if (this.currentLevel) {
      listener({
        oldLevel: this.currentLevel.level,
        newLevel: this.currentLevel.level,
        reason: 'initial_load',
        timestamp: Date.now()
      })
    }
    
    // unsubscribe 함수 반환
    return () => {
      this.subscribers.delete(listener)
    }
  }
  
  /**
   * 레벨 변경 알림
   */
  private notifyLevelChange(event: LevelChangeEvent): void {
    // 구독자들에게 알림
    this.subscribers.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[LevelSyncService] Subscriber error:', error)
      }
    })
    
    // 전역 이벤트 발생
    window.dispatchEvent(new CustomEvent(CONFIG.EVENTS.LEVEL_CHANGED, {
      detail: {
        ...event,
        currentLevel: this.currentLevel
      }
    }))
    
    // EventEmitter로도 발생
    this.emit('levelChanged', event)
  }
  
  /**
   * 로컬 스토리지에 저장
   */
  private async saveToStorage(): Promise<void> {
    if (!this.currentLevel) return
    
    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEY,
        JSON.stringify(this.currentLevel)
      )
    } catch (error) {
      console.error('[LevelSyncService] Failed to save to storage:', error)
    }
  }
  
  /**
   * 로컬 스토리지에서 로드
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY)
      if (stored) {
        this.currentLevel = JSON.parse(stored)
        console.log('[LevelSyncService] Loaded level from storage:', this.currentLevel?.level)
      }
    } catch (error) {
      console.error('[LevelSyncService] Failed to load from storage:', error)
    }
  }
  
  /**
   * 강제 동기화
   */
  async forceSync(): Promise<void> {
    console.log('[LevelSyncService] Force sync initiated')
    await this.syncWithDashboard('manual_sync')
  }
  
  /**
   * 특정 컴포넌트에서 레벨 확인
   */
  async verifyLevel(componentName: string): Promise<boolean> {
    const currentLevel = this.getLevel()
    console.log(`[LevelSyncService] Level verification from ${componentName}: ${currentLevel}`)
    
    // 대시보드와 동기화 확인
    const dashboardStats = await this.fetchDashboardStats()
    if (!dashboardStats) return false
    
    const totalStats = dashboardStats.strength + dashboardStats.intelligence + 
                      dashboardStats.agility + dashboardStats.vitality
    const expectedLevel = Math.floor(totalStats / CONFIG.STATS_PER_LEVEL)
    
    if (currentLevel !== expectedLevel) {
      console.warn(`[LevelSyncService] Level mismatch detected! Current: ${currentLevel}, Expected: ${expectedLevel}`)
      await this.syncWithDashboard('manual_sync')
      return false
    }
    
    return true
  }
  
  /**
   * 동기화 통계 업데이트
   */
  private updateSyncStats(syncTime: number): void {
    this.stats.syncTimes.push(syncTime)
    
    // 최대 100개까지만 유지
    if (this.stats.syncTimes.length > 100) {
      this.stats.syncTimes.shift()
    }
    
    // 평균 계산
    const sum = this.stats.syncTimes.reduce((acc, time) => acc + time, 0)
    this.stats.averageSyncTime = sum / this.stats.syncTimes.length
    this.stats.lastSyncTime = Date.now()
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return { ...this.stats }
  }
  
  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('[LevelSyncService] Debug Info:')
    console.log('- Current Level:', this.currentLevel)
    console.log('- Subscribers:', this.subscribers.size)
    console.log('- Stats:', this.stats)
    console.log('- Initialized:', this.isInitialized)
  }
  
  /**
   * 서비스 정리
   */
  async cleanup(): Promise<void> {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer)
    }
    
    this.subscribers.clear()
    this.removeAllListeners()
    
    console.log('[LevelSyncService] Cleaned up')
  }
}

// React Hook for easy usage
export function useLevelSync() {
  const [level, setLevel] = React.useState<CharacterLevel | null>(null)
  const service = LevelSyncService.getInstance()
  
  React.useEffect(() => {
    // 초기 레벨 설정
    setLevel(service.getCurrentLevel())
    
    // 구독
    const unsubscribe = service.subscribe((event) => {
      setLevel(service.getCurrentLevel())
    })
    
    return unsubscribe
  }, [])
  
  return {
    level: level?.level || 1,
    totalStats: level?.totalStatPoints || 4,
    stats: level?.stats || { strength: 1, intelligence: 1, agility: 1, vitality: 1 },
    forceSync: () => service.forceSync()
  }
}

// 전역 인스턴스 export
export const levelSyncService = LevelSyncService.getInstance()