/**
 * SaveManager - 게임 저장/로드 시스템
 * 
 * 코딩 규칙:
 * - any 타입 금지 - 명확한 타입 정의
 * - 하드코딩 금지 - 설정값 상수화
 * - 데이터 무결성 - 검증 및 백업
 * - 확장성 - 새로운 저장 데이터 추가 가능
 */

import { levelSyncService } from './level-sync.service'
import { inventoryManager } from './inventory-manager'
import { skillManager } from './skill-manager'
import { shopManager } from './shop-manager'
import { dungeonManager } from './dungeon-manager'
import { battleManager } from './battle-manager'
import { transactionManager } from './transaction-manager'
import { withMutex, PREDEFINED_MUTEXES } from '@/lib/utils/async-mutex'
import { STORAGE_KEYS, GAME_EVENTS } from '@/lib/config/game-constants'
import { gameStateManager } from './game-state-manager'

// 저장 슬롯
export interface SaveSlot {
  id: string
  name: string
  saveTime: number
  playTime: number
  level: number
  location: string
  thumbnail?: string
  isAutoSave: boolean
  version: string
}

// 저장 데이터
export interface SaveData {
  version: string
  timestamp: number
  playTime: number
  
  // 플레이어 데이터
  player: {
    name: string
    level: number
    gold: number
    stats: {
      strength: number
      intelligence: number
      agility: number
      vitality: number
    }
  }
  
  // 시스템별 데이터
  inventory: any // InventoryState
  skills: any // SkillState
  dungeonProgress: any[] // DungeonProgress[]
  shopState: any // ShopState
  
  // 통계
  statistics: {
    totalPlayTime: number
    battlesWon: number
    dungeonsCleared: number
    goldEarned: number
    itemsCollected: number
  }
  
  // 설정
  settings: {
    difficulty: string
    autoSave: boolean
    soundEnabled: boolean
    musicVolume: number
    sfxVolume: number
  }
}

// 저장 결과
export interface SaveResult {
  success: boolean
  slotId?: string
  error?: string
}

// 로드 결과
export interface LoadResult {
  success: boolean
  data?: SaveData
  error?: string
}

// 설정 상수
const CONFIG = {
  MAX_SAVE_SLOTS: 10,
  MAX_AUTO_SAVES: 3,
  AUTO_SAVE_INTERVAL: 5 * 60 * 1000, // 5분
  SAVE_VERSION: '1.0.0',
  COMPRESSION_ENABLED: true,
  BACKUP_ENABLED: true,
  MAX_BACKUPS: 3
} as const

export class SaveManager {
  private static instance: SaveManager | null = null
  private saveSlots = new Map<string, SaveSlot>()
  private currentSlotId: string | null = null
  private autoSaveTimer: NodeJS.Timeout | null = null
  private playStartTime: number = Date.now()
  private totalPlayTime: number = 0
  
  // 통계
  private stats = {
    totalSaves: 0,
    totalLoads: 0,
    autoSaves: 0,
    failedSaves: 0,
    failedLoads: 0,
    lastSaveTime: 0,
    averageSaveSize: 0
  }
  
  private constructor() {
    this.loadSaveSlots()
    this.setupAutoSave()
  }
  
  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager()
    }
    return SaveManager.instance
  }
  
  /**
   * 저장 슬롯 로드
   */
  private loadSaveSlots(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVE_SLOTS)
      if (saved) {
        const slots: SaveSlot[] = JSON.parse(saved)
        slots.forEach(slot => {
          this.saveSlots.set(slot.id, slot)
        })
      }
    } catch (error) {
      console.error('[SaveManager] Failed to load save slots:', error)
    }
  }
  
  /**
   * 자동 저장 설정
   */
  private setupAutoSave(): void {
    // 기존 타이머 정리
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    // 새 타이머 설정
    this.autoSaveTimer = setInterval(() => {
      this.autoSave()
    }, CONFIG.AUTO_SAVE_INTERVAL)
    
    // 게임 상태 변경 시 자동 저장
    gameStateManager.addStateChangeListener('save-manager', (newState, oldState) => {
      // 중요한 상태 변경 시 자동 저장
      if (oldState === 'battle' || oldState === 'dungeon_select') {
        this.autoSave()
      }
    })
  }
  
  /**
   * 게임 저장
   */
  async saveGame(slotName: string, isAutoSave = false): Promise<SaveResult> {
    return withMutex(PREDEFINED_MUTEXES.save, async () => {
      try {
        // 저장 데이터 수집
        const saveData = await this.collectSaveData()
        
        // 슬롯 ID 생성
        const slotId = isAutoSave ? 
          this.generateAutoSaveId() : 
          this.generateSaveId()
        
        // 저장 슬롯 정보
        const saveSlot: SaveSlot = {
          id: slotId,
          name: slotName,
          saveTime: Date.now(),
          playTime: this.calculateTotalPlayTime(),
          level: saveData.player.level,
          location: this.getCurrentLocation(),
          isAutoSave,
          version: CONFIG.SAVE_VERSION
        }
        
        // 데이터 압축 (옵션)
        const dataToSave = CONFIG.COMPRESSION_ENABLED ? 
          this.compressData(saveData) : 
          saveData
        
        // 백업 생성 (옵션)
        if (CONFIG.BACKUP_ENABLED && this.currentSlotId) {
          await this.createBackup(this.currentSlotId)
        }
        
        // 데이터 저장
        const saveKey = `${STORAGE_KEYS.SAVE_DATA}_${slotId}`
        localStorage.setItem(saveKey, JSON.stringify(dataToSave))
        
        // 슬롯 정보 업데이트
        this.saveSlots.set(slotId, saveSlot)
        this.saveSaveSlots()
        
        // 자동 저장 슬롯 관리
        if (isAutoSave) {
          this.manageAutoSaveSlots()
        }
        
        // 현재 슬롯 ID 업데이트
        this.currentSlotId = slotId
        
        // 통계 업데이트
        this.stats.totalSaves++
        if (isAutoSave) this.stats.autoSaves++
        this.stats.lastSaveTime = Date.now()
        this.updateAverageSaveSize(JSON.stringify(dataToSave).length)
        
        // 이벤트 발생
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.GAME_SAVED, {
          detail: { slotId, slotName, isAutoSave }
        }))
        
        console.log(`[SaveManager] Game saved: ${slotName} (${slotId})`)
        
        return { success: true, slotId }
        
      } catch (error) {
        console.error('[SaveManager] Failed to save game:', error)
        this.stats.failedSaves++
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '저장 실패' 
        }
      }
    })
  }
  
  /**
   * 게임 로드
   */
  async loadGame(slotId: string): Promise<LoadResult> {
    return withMutex(PREDEFINED_MUTEXES.save, async () => {
      try {
        // 슬롯 확인
        const slot = this.saveSlots.get(slotId)
        if (!slot) {
          return { success: false, error: '저장 슬롯을 찾을 수 없습니다.' }
        }
        
        // 데이터 로드
        const saveKey = `${STORAGE_KEYS.SAVE_DATA}_${slotId}`
        const saved = localStorage.getItem(saveKey)
        if (!saved) {
          return { success: false, error: '저장 데이터를 찾을 수 없습니다.' }
        }
        
        // 데이터 파싱
        let saveData: SaveData = JSON.parse(saved)
        
        // 압축 해제 (필요시)
        if (CONFIG.COMPRESSION_ENABLED && this.isCompressed(saveData)) {
          saveData = this.decompressData(saveData)
        }
        
        // 버전 확인
        if (!this.checkVersion(saveData.version)) {
          // 버전 마이그레이션
          saveData = await this.migrateData(saveData)
        }
        
        // 데이터 검증
        if (!this.validateSaveData(saveData)) {
          return { success: false, error: '저장 데이터가 손상되었습니다.' }
        }
        
        // 데이터 적용
        await this.applySaveData(saveData)
        
        // 현재 슬롯 업데이트
        this.currentSlotId = slotId
        this.playStartTime = Date.now()
        this.totalPlayTime = saveData.playTime
        
        // 통계 업데이트
        this.stats.totalLoads++
        
        // 이벤트 발생
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.GAME_LOADED, {
          detail: { slotId, slotName: slot.name }
        }))
        
        console.log(`[SaveManager] Game loaded: ${slot.name} (${slotId})`)
        
        return { success: true, data: saveData }
        
      } catch (error) {
        console.error('[SaveManager] Failed to load game:', error)
        this.stats.failedLoads++
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '로드 실패' 
        }
      }
    })
  }
  
  /**
   * 저장 데이터 수집
   */
  private async collectSaveData(): Promise<SaveData> {
    const playerLevel = levelSyncService.getCurrentLevel()
    const playerGold = await this.getPlayerGold()
    
    return {
      version: CONFIG.SAVE_VERSION,
      timestamp: Date.now(),
      playTime: this.calculateTotalPlayTime(),
      
      player: {
        name: 'Player', // TODO: 플레이어 이름 시스템
        level: playerLevel?.level || 1,
        gold: playerGold,
        stats: playerLevel?.stats || {
          strength: 1,
          intelligence: 1,
          agility: 1,
          vitality: 1
        }
      },
      
      inventory: inventoryManager.getState(),
      skills: skillManager.getState(),
      dungeonProgress: dungeonManager.getSavedProgress(),
      shopState: shopManager.getShopState(),
      
      statistics: {
        totalPlayTime: this.calculateTotalPlayTime(),
        battlesWon: battleManager.getStats().victories,
        dungeonsCleared: dungeonManager.getStats().totalDungeonsCleared,
        goldEarned: shopManager.getStats().goldEarned,
        itemsCollected: inventoryManager.getStats().totalItemsAdded
      },
      
      settings: {
        difficulty: 'normal', // TODO: 난이도 시스템
        autoSave: true,
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.5
      }
    }
  }
  
  /**
   * 저장 데이터 적용
   */
  private async applySaveData(data: SaveData): Promise<void> {
    // 트랜잭션으로 안전하게 적용
    await transactionManager.executeTransaction([
      {
        id: 'load_player',
        description: '플레이어 데이터 로드',
        execute: async () => {
          // TODO: 플레이어 데이터 적용
          await this.setPlayerGold(data.player.gold)
        },
        rollback: async () => {
          // 롤백 시 현재 상태 유지
        }
      },
      {
        id: 'load_inventory',
        description: '인벤토리 로드',
        execute: async () => {
          await inventoryManager.loadState(data.inventory)
        },
        rollback: async () => {
          await inventoryManager.loadState(inventoryManager.getState())
        }
      },
      {
        id: 'load_skills',
        description: '스킬 로드',
        execute: async () => {
          await skillManager.loadState(data.skills)
        },
        rollback: async () => {
          await skillManager.loadState(skillManager.getState())
        }
      }
      // TODO: 다른 시스템들도 추가
    ])
  }
  
  /**
   * 자동 저장
   */
  private async autoSave(): Promise<void> {
    // 게임 상태 확인 (전투 중이면 저장 안함)
    if (battleManager.isInBattle()) {
      console.log('[SaveManager] Skip auto save - in battle')
      return
    }
    
    const result = await this.saveGame('자동 저장', true)
    if (result.success) {
      console.log('[SaveManager] Auto save completed')
    }
  }
  
  /**
   * 백업 생성
   */
  private async createBackup(slotId: string): Promise<void> {
    const backupKey = `${STORAGE_KEYS.SAVE_BACKUP}_${slotId}_${Date.now()}`
    const originalKey = `${STORAGE_KEYS.SAVE_DATA}_${slotId}`
    
    const data = localStorage.getItem(originalKey)
    if (data) {
      localStorage.setItem(backupKey, data)
      
      // 오래된 백업 정리
      this.cleanupOldBackups(slotId)
    }
  }
  
  /**
   * 오래된 백업 정리
   */
  private cleanupOldBackups(slotId: string): void {
    const backupPrefix = `${STORAGE_KEYS.SAVE_BACKUP}_${slotId}_`
    const backups: Array<{ key: string; timestamp: number }> = []
    
    // 백업 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(backupPrefix)) {
        const timestamp = parseInt(key.replace(backupPrefix, ''))
        backups.push({ key, timestamp })
      }
    }
    
    // 시간순 정렬
    backups.sort((a, b) => b.timestamp - a.timestamp)
    
    // 최대 개수 초과분 삭제
    backups.slice(CONFIG.MAX_BACKUPS).forEach(backup => {
      localStorage.removeItem(backup.key)
    })
  }
  
  /**
   * 자동 저장 슬롯 관리
   */
  private manageAutoSaveSlots(): void {
    const autoSaves = Array.from(this.saveSlots.values())
      .filter(slot => slot.isAutoSave)
      .sort((a, b) => b.saveTime - a.saveTime)
    
    // 최대 개수 초과분 삭제
    autoSaves.slice(CONFIG.MAX_AUTO_SAVES).forEach(slot => {
      this.deleteSlot(slot.id)
    })
  }
  
  /**
   * 슬롯 삭제
   */
  async deleteSlot(slotId: string): Promise<boolean> {
    const slot = this.saveSlots.get(slotId)
    if (!slot) return false
    
    // 데이터 삭제
    const saveKey = `${STORAGE_KEYS.SAVE_DATA}_${slotId}`
    localStorage.removeItem(saveKey)
    
    // 백업 삭제
    const backupPrefix = `${STORAGE_KEYS.SAVE_BACKUP}_${slotId}_`
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(backupPrefix)) {
        localStorage.removeItem(key)
      }
    }
    
    // 슬롯 정보 삭제
    this.saveSlots.delete(slotId)
    this.saveSaveSlots()
    
    console.log(`[SaveManager] Slot deleted: ${slotId}`)
    return true
  }
  
  /**
   * 데이터 압축
   */
  private compressData(data: SaveData): any {
    // 간단한 압축 (실제로는 더 복잡한 압축 알고리즘 사용 가능)
    return {
      compressed: true,
      data: JSON.stringify(data)
    }
  }
  
  /**
   * 데이터 압축 해제
   */
  private decompressData(compressed: any): SaveData {
    return JSON.parse(compressed.data)
  }
  
  /**
   * 압축 여부 확인
   */
  private isCompressed(data: any): boolean {
    return data.compressed === true
  }
  
  /**
   * 버전 확인
   */
  private checkVersion(version: string): boolean {
    return version === CONFIG.SAVE_VERSION
  }
  
  /**
   * 데이터 마이그레이션
   */
  private async migrateData(data: SaveData): Promise<SaveData> {
    console.log(`[SaveManager] Migrating save data from v${data.version} to v${CONFIG.SAVE_VERSION}`)
    
    // TODO: 버전별 마이그레이션 로직
    
    data.version = CONFIG.SAVE_VERSION
    return data
  }
  
  /**
   * 저장 데이터 검증
   */
  private validateSaveData(data: SaveData): boolean {
    // 필수 필드 확인
    if (!data.version || !data.timestamp || !data.player) {
      return false
    }
    
    // 데이터 무결성 확인
    if (data.player.level < 1 || data.player.gold < 0) {
      return false
    }
    
    return true
  }
  
  /**
   * 현재 위치 가져오기
   */
  private getCurrentLocation(): string {
    const gameState = gameStateManager.getCurrentState()
    
    switch (gameState) {
      case 'dungeon_select':
        return '던전'
      case 'shopping':
        return '상점'
      case 'battle':
        return '전투 중'
      default:
        return '마을'
    }
  }
  
  /**
   * 총 플레이 시간 계산
   */
  private calculateTotalPlayTime(): number {
    const sessionTime = Date.now() - this.playStartTime
    return this.totalPlayTime + sessionTime
  }
  
  /**
   * 평균 저장 크기 업데이트
   */
  private updateAverageSaveSize(size: number): void {
    const totalSize = this.stats.averageSaveSize * (this.stats.totalSaves - 1) + size
    this.stats.averageSaveSize = totalSize / this.stats.totalSaves
  }
  
  /**
   * 저장 슬롯 정보 저장
   */
  private saveSaveSlots(): void {
    const slots = Array.from(this.saveSlots.values())
    localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(slots))
  }
  
  /**
   * ID 생성
   */
  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateAutoSaveId(): string {
    return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 플레이어 골드 가져오기
   */
  private async getPlayerGold(): Promise<number> {
    // TODO: 실제 플레이어 골드 시스템 연동
    return shopManager.getShopState()?.playerGold || 0
  }
  
  /**
   * 플레이어 골드 설정
   */
  private async setPlayerGold(gold: number): Promise<void> {
    // TODO: 실제 플레이어 골드 시스템 연동
    const shopState = shopManager.getShopState()
    if (shopState) {
      shopState.playerGold = gold
    }
  }
  
  // 공개 메서드들
  
  /**
   * 저장 슬롯 목록 가져오기
   */
  getSaveSlots(): SaveSlot[] {
    return Array.from(this.saveSlots.values())
      .sort((a, b) => b.saveTime - a.saveTime)
  }
  
  /**
   * 빠른 저장
   */
  async quickSave(): Promise<SaveResult> {
    return this.saveGame('빠른 저장')
  }
  
  /**
   * 빠른 로드
   */
  async quickLoad(): Promise<LoadResult> {
    // 가장 최근 저장 찾기
    const slots = this.getSaveSlots()
    const recentSlot = slots.find(slot => !slot.isAutoSave) || slots[0]
    
    if (!recentSlot) {
      return { success: false, error: '저장된 게임이 없습니다.' }
    }
    
    return this.loadGame(recentSlot.id)
  }
  
  /**
   * 현재 슬롯 ID 가져오기
   */
  getCurrentSlotId(): string | null {
    return this.currentSlotId
  }
  
  /**
   * 자동 저장 활성화/비활성화
   */
  setAutoSaveEnabled(enabled: boolean): void {
    if (enabled) {
      this.setupAutoSave()
    } else {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    }
  }
  
  /**
   * 통계 조회
   */
  getStats(): Readonly<typeof this.stats> {
    return { ...this.stats }
  }
  
  /**
   * 디버그 정보
   */
  debug(): void {
    console.log('[SaveManager] Debug Info:')
    console.log('- Save Slots:', this.saveSlots.size)
    console.log('- Current Slot:', this.currentSlotId)
    console.log('- Stats:', this.stats)
    console.log('- Play Time:', this.calculateTotalPlayTime())
  }
}

// 전역 인스턴스 export
export const saveManager = SaveManager.getInstance()