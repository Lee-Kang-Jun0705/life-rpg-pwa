import Dexie, { Table } from 'dexie'
import type { Character } from './types/game-core'
import type { GeneratedItem, InventoryItem } from './types/item-system'
import type { LearnedSkill } from './types/skill-system'
import type { DungeonProgress } from './types/dungeon'

// 기본 데이터 저장 인터페이스 (설정, 상점 데이터 등을 위한)
export interface PlayerData {
  id: string // 'inventory', 'purchaseHistory', 'settings' 등
  data: Record<string, unknown>
  lastUpdated: Date
}

// 캐릭터 데이터
export interface CharacterData {
  id: string
  character: Character
  lastUpdated: Date
}

// 인벤토리 데이터
export interface InventoryData {
  id: string
  items: InventoryItem[]
  equipment: {
    weapon: GeneratedItem | null
    helmet: GeneratedItem | null
    armor: GeneratedItem | null
    gloves: GeneratedItem | null
    boots: GeneratedItem | null
    accessory1: GeneratedItem | null
    accessory2: GeneratedItem | null
    accessory3: GeneratedItem | null
  }
  maxSlots: number
  lastUpdated: Date
}

// 스킬 데이터
export interface SkillsData {
  id: string
  learnedSkills: LearnedSkill[]
  quickSlots: Record<number, string>
  skillPoints: number
  lastUpdated: Date
}

// 던전 진행 상황 인터페이스
export interface DungeonProgressData {
  id?: number
  dungeonId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  completedChallenges: string[]
  totalProgress: number
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned'
  attempts: number
}

// 동기화 대기열 인터페이스
export interface SyncQueueData {
  id?: number
  type: 'activity' | 'character' | 'dungeon' | 'shop'
  action: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: Date
  retryCount: number
  lastError?: string
}

// 간단한 키-값 저장소를 위한 데이터베이스
class LifeRPGSimpleDB extends Dexie {
  playerData!: Table<PlayerData>
  characters!: Table<CharacterData>
  inventory!: Table<InventoryData>
  skills!: Table<SkillsData>
  dungeonProgress!: Table<DungeonProgressData>
  syncQueue!: Table<SyncQueueData>

  constructor() {
    super('LifeRPGSimpleDB')
    
    this.version(1).stores({
      playerData: 'id, lastUpdated'
    })
    
    this.version(2).stores({
      playerData: 'id, lastUpdated',
      dungeonProgress: '++id, [dungeonId+userId], userId, dungeonId, status, completedAt'
    })
    
    this.version(3).stores({
      playerData: 'id, lastUpdated',
      dungeonProgress: '++id, [dungeonId+userId], userId, dungeonId, status, completedAt',
      syncQueue: '++id, type, timestamp, retryCount'
    })
    
    this.version(4).stores({
      playerData: 'id, lastUpdated',
      characters: 'id, lastUpdated',
      inventory: 'id, lastUpdated',
      skills: 'id, lastUpdated',
      dungeonProgress: '++id, [dungeonId+userId], userId, dungeonId, status, completedAt',
      syncQueue: '++id, type, timestamp, retryCount'
    })
  }
}

// 데이터베이스 인스턴스 생성
export const db = new LifeRPGSimpleDB()

export default db