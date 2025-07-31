export interface Quest {
  id: string
  title: string
  description: string
  type: 'main' | 'side' | 'daily' | 'weekly' | 'event'
  category: 'battle' | 'collection' | 'exploration' | 'social' | 'achievement'
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed'
  
  // 퀘스트 요구사항
  requirements: {
    level?: number
    quests?: string[] // 선행 퀘스트 ID
    items?: { itemId: string; quantity: number }[]
  }
  
  // 퀘스트 목표
  objectives: {
    id: string
    description: string
    type: 'kill' | 'collect' | 'explore' | 'talk' | 'deliver' | 'craft'
    target?: string // 몬스터 ID, 아이템 ID, NPC ID 등
    current: number
    required: number
    completed: boolean
  }[]
  
  // 보상
  rewards: {
    exp: number
    gold: number
    items?: { itemId: string; quantity: number }[]
    skills?: string[]
    titles?: string[]
  }
  
  // 추가 정보
  npcId?: string // 퀘스트 제공 NPC
  dialogues?: {
    start: string[]
    progress: string[]
    complete: string[]
  }
  timeLimit?: number // 시간 제한 (밀리초)
  resetType?: 'daily' | 'weekly' | 'never'
  expiresAt?: string // ISO date string
  completedAt?: string
  claimedAt?: string
}

export interface QuestProgress {
  questId: string
  userId: string
  startedAt: string
  objectives: {
    objectiveId: string
    current: number
    completed: boolean
  }[]
  completed: boolean
  claimed: boolean
}

export interface QuestChain {
  id: string
  name: string
  description: string
  quests: string[] // Quest IDs in order
  rewards?: Quest['rewards'] // 체인 완료 보상
}