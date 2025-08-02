export interface CharacterAppearance {
  style: 'pixel' | 'emoji' | 'avatar'
  color: string
  accessory?: string
}

export interface CharacterStats {
  level: number
  experience: number
  health: number
  energy: number
}

export interface Character {
  id: string
  name: string
  appearance: CharacterAppearance
  stats: CharacterStats
  createdAt: Date
  updatedAt: Date
}
