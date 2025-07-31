/**
 * 타입 안전한 데이터베이스 스키마 정의
 * TypeScript 타입 시스템을 활용한 스키마 정의 및 검증
 */

// 기본 엔티티 타입
export interface BaseEntity {
  id?: number | string
  createdAt?: Date
  updatedAt?: Date
}

// UserProfile 타입
export interface UserProfileSchema extends BaseEntity {
  userId: string
  email: string
  name: string
  avatar?: string
  level: number
  experience: number
}

// Stat 타입
export type StatType = 'health' | 'learning' | 'relationship' | 'achievement'

export interface StatSchema extends BaseEntity {
  userId: string
  type: StatType
  level: number
  experience: number
  totalActivities: number
}

// Activity 타입
export interface ActivitySchema extends BaseEntity {
  userId: string
  statType: StatType
  activityName: string
  description?: string
  experience: number
  timestamp: Date
}

// Mission 타입
export type MissionType = 'daily' | 'weekly' | 'monthly' | 'event'

export interface MissionRequirements {
  _count: number
  experience: number
}

export interface MissionRewards {
  experience: number
  coins?: number
  items?: string[]
}

export interface MissionSchema extends BaseEntity {
  userId: string
  title: string
  description: string
  type: MissionType
  statType: StatType
  requirements: MissionRequirements
  progress: number
  completed: boolean
  rewards: MissionRewards
  startDate: Date
  endDate: Date
  completedAt?: Date
}

// Character 타입
export interface CharacterAppearance {
  base: string
  hair?: string
  outfit?: string
  accessory?: string
  background?: string
}

export interface CharacterSchema extends BaseEntity {
  userId: string
  appearance: CharacterAppearance
  lastReset: Date
}

// FeedPost 타입
export interface FeedPostSchema extends BaseEntity {
  userId: string
  content: string
  images?: string[]
  statType?: StatType
  activityId?: number
  likes: number
  comments: number
  encrypted?: boolean
}

// FeedComment 타입
export interface FeedCommentSchema {
  id?: number
  postId: number
  userId: string
  content: string
  createdAt: Date
}

// FeedReaction 타입
export type FeedReactionType = 'want' | 'respect' | 'support' | 'verify'

export interface FeedReactionSchema {
  id?: number
  postId: number
  userId: string
  type: FeedReactionType
  createdAt: Date
}

// Investment 타입
export type InvestmentType = 'investment' | 'donation' | 'sponsorship'
export type InvestmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface InvestmentSchema extends BaseEntity {
  investorId: string
  recipientId: string
  amount: number
  currency: string
  type: InvestmentType
  status: InvestmentStatus
  description?: string
  receipt?: string
}

// PlayerData 타입 (재귀적 구조)
export type PlayerDataValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | { [key: string]: PlayerDataValue }
  | PlayerDataValue[]

export interface PlayerDataSchema {
  id: string
  data: PlayerDataValue
  updatedAt: Date
}

// Setting 타입
export interface SettingSchema extends BaseEntity {
  key: string
  _value: string
}

/**
 * 타입 가드 함수들
 */
export const isUserProfileSchema = (data: unknown): data is UserProfileSchema => {
  if (!data || typeof data !== 'object') return false
  const profile = data as Record<string, unknown>
  return (
    typeof profile.userId === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.level === 'number' &&
    typeof profile.experience === 'number' &&
    (profile.avatar === undefined || typeof profile.avatar === 'string')
  )
}

export const isStatSchema = (data: unknown): data is StatSchema => {
  if (!data || typeof data !== 'object') return false
  const stat = data as Record<string, unknown>
  return (
    typeof stat.userId === 'string' &&
    ['health', 'learning', 'relationship', 'achievement'].includes(stat.type) &&
    typeof stat.level === 'number' &&
    typeof stat.experience === 'number' &&
    typeof stat.totalActivities === 'number'
  )
}

export const isActivitySchema = (data: unknown): data is ActivitySchema => {
  if (!data || typeof data !== 'object') return false
  const activity = data as Record<string, unknown>
  return (
    typeof activity.userId === 'string' &&
    ['health', 'learning', 'relationship', 'achievement'].includes(activity.statType) &&
    typeof activity.activityName === 'string' &&
    typeof activity.experience === 'number' &&
    activity.timestamp instanceof Date
  )
}

export const isMissionSchema = (data: unknown): data is MissionSchema => {
  if (!data || typeof data !== 'object') return false
  const mission = data as Record<string, unknown>
  return (
    typeof mission.userId === 'string' &&
    typeof mission.title === 'string' &&
    typeof mission.description === 'string' &&
    ['daily', 'weekly', 'monthly', 'event'].includes(mission.type) &&
    ['health', 'learning', 'relationship', 'achievement'].includes(mission.statType) &&
    mission.requirements &&
    typeof mission.requirements.count === 'number' &&
    typeof mission.requirements.experience === 'number' &&
    typeof mission.progress === 'number' &&
    typeof mission.completed === 'boolean' &&
    mission.rewards &&
    typeof mission.rewards.experience === 'number' &&
    mission.startDate instanceof Date &&
    mission.endDate instanceof Date
  )
}

export const isCharacterSchema = (data: unknown): data is CharacterSchema => {
  if (!data || typeof data !== 'object') return false
  const character = data as Record<string, unknown>
  return (
    typeof character.userId === 'string' &&
    character.appearance &&
    typeof character.appearance.base === 'string' &&
    character.lastReset instanceof Date
  )
}

export const isFeedPostSchema = (data: unknown): data is FeedPostSchema => {
  if (!data || typeof data !== 'object') return false
  const post = data as Record<string, unknown>
  return (
    typeof post.userId === 'string' &&
    typeof post.content === 'string' &&
    typeof post.likes === 'number' &&
    typeof post.comments === 'number'
  )
}

export const isFeedCommentSchema = (data: unknown): data is FeedCommentSchema => {
  if (!data || typeof data !== 'object') return false
  const comment = data as Record<string, unknown>
  return (
    typeof comment.postId === 'number' &&
    typeof comment.userId === 'string' &&
    typeof comment.content === 'string' &&
    comment.createdAt instanceof Date
  )
}

export const isFeedReactionSchema = (data: unknown): data is FeedReactionSchema => {
  if (!data || typeof data !== 'object') return false
  const reaction = data as Record<string, unknown>
  return (
    typeof reaction.postId === 'number' &&
    typeof reaction.userId === 'string' &&
    ['want', 'respect', 'support', 'verify'].includes(reaction.type) &&
    reaction.createdAt instanceof Date
  )
}

export const isInvestmentSchema = (data: unknown): data is InvestmentSchema => {
  if (!data || typeof data !== 'object') return false
  const investment = data as Record<string, unknown>
  return (
    typeof investment.investorId === 'string' &&
    typeof investment.recipientId === 'string' &&
    typeof investment.amount === 'number' &&
    typeof investment.currency === 'string' &&
    ['investment', 'donation', 'sponsorship'].includes(investment.type) &&
    ['pending', 'confirmed', 'completed', 'cancelled'].includes(investment.status)
  )
}

export const isPlayerDataSchema = (data: unknown): data is PlayerDataSchema => {
  if (!data || typeof data !== 'object') return false
  const playerData = data as Record<string, unknown>
  return (
    typeof playerData.id === 'string' &&
    playerData.data !== undefined &&
    playerData.updatedAt instanceof Date
  )
}

export const isSettingSchema = (data: unknown): data is SettingSchema => {
  if (!data || typeof data !== 'object') return false
  const setting = data as Record<string, unknown>
  return (
    typeof setting.key === 'string' &&
    typeof setting.value === 'string'
  )
}

/**
 * 데이터 검증 유틸리티
 */
export class DataValidator {
  static validateUserProfile(data: unknown): UserProfileSchema {
    if (!isUserProfileSchema(data)) {
      throw new Error('Invalid UserProfile data')
    }
    return data
  }

  static validateStat(data: unknown): StatSchema {
    if (!isStatSchema(data)) {
      throw new Error('Invalid Stat data')
    }
    return data
  }

  static validateActivity(data: unknown): ActivitySchema {
    if (!isActivitySchema(data)) {
      throw new Error('Invalid Activity data')
    }
    return data
  }

  static validateMission(data: unknown): MissionSchema {
    if (!isMissionSchema(data)) {
      throw new Error('Invalid Mission data')
    }
    return data
  }

  static validateCharacter(data: unknown): CharacterSchema {
    if (!isCharacterSchema(data)) {
      throw new Error('Invalid Character data')
    }
    return data
  }

  static validateFeedPost(data: unknown): FeedPostSchema {
    if (!isFeedPostSchema(data)) {
      throw new Error('Invalid FeedPost data')
    }
    return data
  }

  static validateFeedComment(data: unknown): FeedCommentSchema {
    if (!isFeedCommentSchema(data)) {
      throw new Error('Invalid FeedComment data')
    }
    return data
  }

  static validateFeedReaction(data: unknown): FeedReactionSchema {
    if (!isFeedReactionSchema(data)) {
      throw new Error('Invalid FeedReaction data')
    }
    return data
  }

  static validateInvestment(data: unknown): InvestmentSchema {
    if (!isInvestmentSchema(data)) {
      throw new Error('Invalid Investment data')
    }
    return data
  }

  static validatePlayerData(data: unknown): PlayerDataSchema {
    if (!isPlayerDataSchema(data)) {
      throw new Error('Invalid PlayerData data')
    }
    return data
  }

  static validateSetting(data: unknown): SettingSchema {
    if (!isSettingSchema(data)) {
      throw new Error('Invalid Setting data')
    }
    return data
  }

  /**
   * 안전한 검증 (에러 시 null 반환)
   */
  static safeValidate<T>(
    _validator: (data: unknown) => T,
    data: unknown
  ): { success: true; data: T } | { success: false; _error: Error } {
    try {
      const result = validator(data)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, _error: error as Error }
    }
  }
}

/**
 * 데이터베이스 쿼리 빌더 타입
 */
export interface QueryBuilder<T> {
  where<K extends keyof T>(_field: K, _value: T[K]): QueryBuilder<T>
  equals<V>(_value: V): QueryBuilder<T>
  notEquals<V>(_value: V): QueryBuilder<T>
  greaterThan<V>(_value: V): QueryBuilder<T>
  lessThan<V>(_value: V): QueryBuilder<T>
  between<V>(_min: V, _max: V): QueryBuilder<T>
  in<V>(_values: V[]): QueryBuilder<T>
  orderBy(_field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>
  limit(_count: number): QueryBuilder<T>
  offset(_count: number): QueryBuilder<T>
  and(_condition: (item: T) => boolean): QueryBuilder<T>
  or(_condition: (item: T) => boolean): QueryBuilder<T>
  toArray(): Promise<T[]>
  first(): Promise<T | undefined>
  count(): Promise<number>
  delete(): Promise<number>
  update(_updates: Partial<T>): Promise<number>
}

/**
 * 타입 안전한 데이터베이스 트랜잭션
 */
export interface Transaction {
  commit(): Promise<void>
  rollback(): Promise<void>
  isActive(): boolean
}

export interface TransactionScope {
  profiles: QueryBuilder<UserProfileSchema>
  stats: QueryBuilder<StatSchema>
  activities: QueryBuilder<ActivitySchema>
  missions: QueryBuilder<MissionSchema>
  characters: QueryBuilder<CharacterSchema>
  feedPosts: QueryBuilder<FeedPostSchema>
  feedComments: QueryBuilder<FeedCommentSchema>
  feedReactions: QueryBuilder<FeedReactionSchema>
  investments: QueryBuilder<InvestmentSchema>
  playerData: QueryBuilder<PlayerDataSchema>
  settings: QueryBuilder<SettingSchema>
}

/**
 * 마이그레이션 타입 정의
 */
export interface Migration {
  version: number
  name: string
  up(_db: TransactionScope): Promise<void>
  down(_db: TransactionScope): Promise<void>
}

/**
 * 데이터베이스 이벤트 타입
 */
export type DatabaseEvent = 
  | { type: 'created'; table: string; data: unknown }
  | { type: 'updated'; table: string; id: string | number; changes: Partial<unknown> }
  | { type: 'deleted'; table: string; id: string | number }
  | { type: 'error'; _error: Error }
  | { type: 'synced'; table: string; _count: number }

export interface DatabaseEventHandler {
  (_event: DatabaseEvent): void | Promise<void>
}

/**
 * 데이터베이스 설정 타입
 */
export interface DatabaseConfig {
  name: string
  version: number
  autoOpen: boolean
  indexedDB?: IDBFactory
  IDBKeyRange?: typeof IDBKeyRange
  migrations?: Migration[]
  onReady?: () => void | Promise<void>
  onError?: (_error: Error) => void
  onVersionChange?: (_oldVersion: number, _newVersion: number) => void | Promise<void>
}

/**
 * 사용자 데이터 내보내기/가져오기 타입
 */
export interface ExportedUserData {
  profile: UserProfileSchema | null
  stats: StatSchema[]
  activities: ActivitySchema[]
  missions: MissionSchema[]
  character: CharacterSchema | null
  exportedAt: Date
}