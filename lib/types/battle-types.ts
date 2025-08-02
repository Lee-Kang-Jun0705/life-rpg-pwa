export interface BattleState {
  player: {
    id: string
    name: string
    level: number
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    attack: number
    defense: number
    speed: number
    critRate: number
    critDamage: number
  }
  enemies: BattleMonster[]
  currentTurn: number
  isPlayerTurn: boolean
  battleLog: BattleLogEntry[]
}

export interface BattleMonster {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  stats: {
    attack: number
    defense: number
    speed: number
    critRate: number
    critDamage: number
  }
  abilities?: string[]
  element?: 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'neutral'
}

export interface BattleLogEntry {
  timestamp: number
  type: 'damage' | 'heal' | 'skill' | 'ability' | 'statusEffect' | 'defeat' | 'victory'
  source: string
  target: string
  value?: number
  message: string
}