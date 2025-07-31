import { BaseEntity, UserEntity } from './common'

// 캐릭터 관련 타입
export interface Character extends UserEntity {
  name: string
  level: number
  experience: number
  health: number
  maxHealth: number
  stats: PlayerCharacterStats
  inventory: string[]
  gold: number
  appearance: CharacterAppearance
  achievements: CharacterAchievement[]
}

export interface PlayerCharacterStats {
  strength: number
  agility: number
  intelligence: number
  charisma: number
}

export interface CharacterAppearance {
  gender: 'male' | 'female' | 'neutral'
  skinTone: SkinTone
  hairstyle: string
  hairColor: string
  eyeColor: string
  outfit: string
  accessories: string[]
}

export type SkinTone = 'light' | 'medium' | 'dark' | 'pale' | 'tan' | 'olive'

export interface CharacterAchievement extends BaseEntity {
  characterId: string
  type: CharacterAchievementType
  name: string
  description: string
  icon: string
  unlockedAt: Date
  progress?: number
  maxProgress?: number
}

export type CharacterAchievementType = 
  | 'level'
  | 'quest'
  | 'combat'
  | 'collection'
  | 'social'
  | 'exploration'
  | 'special'

export interface CharacterCustomization extends BaseEntity {
  name: string
  appearance: CharacterAppearance
}

// 캐릭터 서비스 관련 타입
export interface CreateCharacterDTO {
  userId: string
  name: string
  appearance?: Partial<CharacterAppearance>
}

export interface UpdateCharacterDTO {
  name?: string
  appearance?: Partial<CharacterAppearance>
  stats?: Partial<PlayerCharacterStats>
}

export interface CharacterProgressDTO {
  experience?: number
  level?: number
  health?: number
  maxHealth?: number
}