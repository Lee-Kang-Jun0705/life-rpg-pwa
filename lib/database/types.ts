// 데이터베이스 타입 정의
// Dexie와 독립적으로 사용할 수 있는 타입들

export interface UserProfile {
  id?: number
  userId: string
  email: string
  name: string
  avatar?: string
  level: number
  experience: number // 기존 필드 (deprecated - totalExperience로 이전 예정)
  totalExperience: number // 모든 스탯의 총 경험치
  currentExperience: number // 현재 레벨에서의 경험치
  dataVersion?: number // 스키마 버전 관리
  createdAt: Date
  updatedAt: Date
}

export interface Stat {
  id?: number
  userId: string
  type: 'health' | 'learning' | 'relationship' | 'achievement'
  level: number
  experience: number
  totalActivities: number
  updatedAt: Date
  createdAt?: Date  // 누락된 속성 추가 (옵셔널)
}

export interface Activity {
  id?: number
  userId: string
  statType: 'health' | 'learning' | 'relationship' | 'achievement'
  activityName: string
  description?: string
  experience: number
  timestamp: Date
  synced?: boolean
}

export interface Mission {
  id?: number
  userId: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'event'
  statType: 'health' | 'learning' | 'relationship' | 'achievement'
  requirements: {
    count: number
    experience: number
  }
  progress: number
  completed: boolean
  rewards: {
    experience: number
    coins?: number
    items?: string[]
  }
  startDate: Date
  endDate: Date
  completedAt?: Date
}

export interface FeedPost {
  id?: number
  userId: string
  content: string
  images?: string[]
  statType?: 'health' | 'learning' | 'relationship' | 'achievement'
  activityId?: number
  likes: number
  comments: number
  createdAt: Date
  updatedAt: Date
  encrypted?: boolean
}

export interface FeedComment {
  id?: number
  postId: number
  userId: string
  content: string
  createdAt: Date
}

export interface FeedReaction {
  id?: number
  postId: number
  userId: string
  type: 'want' | 'respect' | 'support' | 'verify'
  createdAt: Date
}

export interface Investment {
  id?: number
  investorId: string
  recipientId: string
  amount: number
  currency: string
  type: 'investment' | 'donation' | 'sponsorship'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  description?: string
  receipt?: string
  createdAt: Date
  updatedAt: Date
}

export interface Character {
  id?: number
  userId: string
  appearance: {
    base: string
    hair?: string
    outfit?: string
    accessory?: string
    background?: string
  }
  lastReset: Date
  updatedAt: Date
}

// 플레이어 데이터 타입들
export type PlayerDataValue =
  | string
  | number
  | boolean
  | Date
  | { [key: string]: PlayerDataValue }
  | PlayerDataValue[]

// 키-값 저장소용 인터페이스
export interface PlayerData {
  id: string
  data: PlayerDataValue
  updatedAt: Date
}

// 설정 테이블용 인터페이스
export interface Setting {
  id?: number
  key: string
  value: string
  updatedAt: Date
}

// 장비 관련
export interface UserEquipment {
  id?: number
  userId: string
  equipmentId: string
  type: 'weapon' | 'armor' | 'accessory'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  enhancementLevel: number
  isEquipped: boolean
  slot?: string
  acquiredAt: Date
  updatedAt: Date
}

// 리소스 관련
export interface UserResources {
  id?: number
  userId: string
  gold: number
  energy: number
  maxEnergy: number
  lastEnergyUpdate: Date
  premiumCurrency: number
  updatedAt: Date
}

// JRPG 시스템 타입 임포트
import type { ItemInstance, SkillInstance } from '../jrpg/types'

// JRPG 아이템 인벤토리
export interface JRPGInventory {
  id?: number
  userId: string
  items: ItemInstance[]
  maxSlots: number
  updatedAt: Date
}

// JRPG 스킬 목록
export interface JRPGSkills {
  id?: number
  userId: string
  skills: SkillInstance[]
  skillPoints: number
  updatedAt: Date
}

// JRPG 전투 기록
export interface JRPGBattleLog {
  id?: number
  userId: string
  dungeonId: string
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  result: 'victory' | 'defeat' | 'retreat'
  turns: number
  damageDealt: number
  damageTaken: number
  expGained: number
  goldGained: number
  itemsGained: string[]
  timestamp: Date
}

// JRPG 진행 상황
export interface JRPGProgress {
  id?: number
  userId: string
  highestDungeonCleared: number
  totalBattlesWon: number
  totalBattlesLost: number
  totalDamageDealt: number
  totalGoldEarned: number
  unlockedDungeons: string[]
  completedQuests: string[]
  achievements: string[]
  updatedAt: Date
}

// Dexie 데이터베이스 타입 정의
import type { Table } from 'dexie'

export interface LifeRPGDatabase {
  profiles: Table<UserProfile>
  stats: Table<Stat>
  activities: Table<Activity>
  missions: Table<Mission>
  feedPosts: Table<FeedPost>
  feedComments: Table<FeedComment>
  feedReactions: Table<FeedReaction>
  investments: Table<Investment>
  characters: Table<Character>
  playerData: Table<PlayerData>
  settings: Table<Setting>
  userEquipments: Table<UserEquipment>
  userResources: Table<UserResources>
  // JRPG 테이블들
  jrpgInventory: Table<JRPGInventory>
  jrpgSkills: Table<JRPGSkills>
  jrpgBattleLogs: Table<JRPGBattleLog>
  jrpgProgress: Table<JRPGProgress>
  transaction<T>(_mode: string, _table: Table<unknown>, _callback: () => Promise<T>): Promise<T>
}

export interface ActivityVerification {
  id?: number
  activityId: string
  userId: string
  timestamp: number
  type: 'interval_check' | 'photo_upload' | 'location_check'
  verified: boolean
  metadata?: {
    previousActivityTime?: number
    intervalSeconds?: number
    photoUrl?: string
    location?: { lat: number; lng: number }
    reason?: string
  }
}

// 던전 진행 상황
export interface DungeonProgress {
  id?: number
  userId: string
  dungeonId: string
  status: 'available' | 'in_progress' | 'completed' | 'failed'
  attempts: number
  currentChallengeIndex?: number
  completedAt?: Date
  lastAttemptAt?: Date
  energyUsed?: number
  rewards?: {
    exp: number
    coins?: number
    items?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// 장비 인벤토리 관련
export interface EquipmentInventoryItem {
  id: number
  inventoryId: number
  itemId: string
  type: 'weapon' | 'armor' | 'accessory'
  rarity: string
  level: number
  enhancement: number
  isEquipped: boolean
  equippedSlot: string | null
  obtainedAt: Date
  locked: boolean
}

export interface EquipmentInventory {
  id: number
  userId: string
  maxSlots: number
  currentSlots: number
  items: EquipmentInventoryItem[]
  createdAt: Date
  updatedAt: Date
}
