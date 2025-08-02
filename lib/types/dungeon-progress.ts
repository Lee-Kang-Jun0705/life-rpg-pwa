/**
 * 던전 진행 상황 관련 타입 정의
 */

export interface DungeonProgress {
  dungeonId: number
  firstClearDate?: string
  totalClears: number
  bestTime?: number // 밀리초
  totalGoldEarned: number
  unlockedMilestones: number[] // 달성한 마일스톤 횟수들
  lastClearDate?: string
}

export interface DungeonMilestone {
  threshold: number
  title: string
  gold?: number
  items?: { id: string; quantity: number }[]
  hidden: boolean // 달성 전까지 숨김
  claimed: boolean // 보상 수령 여부
}

export interface DungeonSaveState {
  currentDungeonId?: number
  currentFloor?: number
  currentMonsterIndex?: number
  playerHpRatio?: number
  startTime?: number
  inProgress: boolean
}

export interface DungeonStatistics {
  totalDungeonsCleared: number
  totalGoldEarned: number
  totalPlayTime: number // 밀리초
  favoriteeDungeon?: number // 가장 많이 클리어한 던전
  unlockedTitles: string[]
}
