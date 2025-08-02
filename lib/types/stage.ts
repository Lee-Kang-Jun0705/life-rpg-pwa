// 스테이지 시스템 타입 정의
// 던전별 다중 스테이지 및 진행도 관리

import type { MonsterData } from '@/lib/types/battle-extended'
import type { DungeonReward } from '@/lib/dungeon/types'

// 스테이지 타입
export interface Stage {
  readonly id: string
  readonly number: number // 스테이지 번호 (1, 2, 3...)
  readonly name: string
  readonly description: string
  readonly monsterIds: string[] // 등장 몬스터 ID 목록
  readonly bossId?: string // 보스 몬스터 ID (선택)
  readonly objectives: StageObjective[]
  readonly rewards: StageReward
  readonly unlockCondition?: StageUnlockCondition
}

// 스테이지 목표
export interface StageObjective {
  readonly id: string
  readonly type: 'defeat_monsters' | 'defeat_boss' | 'survive_time' | 'collect_items'
  readonly description: string
  readonly target: number
  readonly current?: number
  readonly completed?: boolean
}

// 스테이지 보상
export interface StageReward {
  readonly exp: number
  readonly gold: number
  readonly items?: string[]
  readonly firstClearBonus?: {
    readonly exp: number
    readonly gold: number
    readonly items?: string[]
  }
}

// 스테이지 잠금 해제 조건
export interface StageUnlockCondition {
  readonly type: 'clear_previous' | 'player_level' | 'total_stars'
  readonly value: number
}

// 스테이지 진행 상태
export interface StageProgress {
  readonly stageId: string
  readonly status: 'locked' | 'available' | 'in_progress' | 'completed'
  readonly stars: number // 0-3 별
  readonly bestTime?: number // 최고 기록 (초)
  readonly attempts: number
  readonly objectives: StageObjective[]
  readonly firstClearDate?: Date
  readonly lastAttemptDate?: Date
}

// 던전-스테이지 매핑
export interface DungeonStages {
  readonly dungeonId: string
  readonly stages: Stage[]
  readonly totalStages: number
  readonly requiredStagesForCompletion: number // 던전 완료에 필요한 최소 스테이지 수
}

// 스테이지 전투 설정
export interface StageBattleConfig {
  readonly waveCount: number // 웨이브 수
  readonly monstersPerWave: number[] // 웨이브별 몬스터 수
  readonly monsterLevel: {
    readonly min: number
    readonly max: number
  }
  readonly difficultyMultiplier: number // 난이도 배수
  readonly timeLimit?: number // 시간 제한 (초)
}

// 스테이지 클리어 등급
export interface StageClearRating {
  readonly stars: number // 1-3
  readonly score: number
  readonly timeBonus: number
  readonly perfectBonus: boolean // 노 데미지 클리어
  readonly objectivesCompleted: number
  readonly totalObjectives: number
}

// 스테이지 결과
export interface StageResult {
  readonly stageId: string
  readonly success: boolean
  readonly rating: StageClearRating
  readonly rewards: {
    readonly base: StageReward
    readonly bonus: Partial<StageReward>
    readonly total: StageReward
  }
  readonly statistics: {
    readonly damageDealt: number
    readonly damageTaken: number
    readonly monstersDefeated: number
    readonly skillsUsed: number
    readonly comboDamage: number
    readonly clearTime: number
  }
}

// 스테이지 난이도 스케일링
export const STAGE_DIFFICULTY_SCALING = {
  monsterHpMultiplier: [1, 1.2, 1.5, 1.8, 2.2, 2.6, 3.0, 3.5, 4.0, 5.0],
  monsterDamageMultiplier: [1, 1.1, 1.3, 1.5, 1.7, 2.0, 2.3, 2.6, 3.0, 3.5],
  expMultiplier: [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.3, 2.6, 3.0, 3.5],
  goldMultiplier: [1, 1.3, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 5.0]
} as const

// 별 획득 조건
export const STAR_CONDITIONS = {
  time: {
    3: 60, // 60초 이내 클리어
    2: 120, // 120초 이내 클리어
    1: 180 // 180초 이내 클리어
  },
  health: {
    3: 0.8, // HP 80% 이상 유지
    2: 0.5, // HP 50% 이상 유지
    1: 0.2 // HP 20% 이상 유지
  },
  objectives: {
    3: 1.0, // 모든 목표 달성
    2: 0.7, // 70% 목표 달성
    1: 0.5 // 50% 목표 달성
  }
} as const

// 타입 가드
export function isStageCompleted(progress: StageProgress): boolean {
  return progress.status === 'completed' && progress.stars > 0
}

export function isStageAvailable(progress: StageProgress): boolean {
  return progress.status === 'available' || progress.status === 'in_progress'
}

// 별 계산 헬퍼
export function calculateStars(
  clearTime: number,
  healthPercent: number,
  objectivesCompleted: number,
  totalObjectives: number
): number {
  let stars = 0

  // 시간 기준
  if (clearTime <= STAR_CONDITIONS.time[3]) {
    stars++
  } else if (clearTime <= STAR_CONDITIONS.time[2]) {
    stars += 0.5
  } else if (clearTime <= STAR_CONDITIONS.time[1]) {
    stars += 0.3
  }

  // 체력 기준
  if (healthPercent >= STAR_CONDITIONS.health[3]) {
    stars++
  } else if (healthPercent >= STAR_CONDITIONS.health[2]) {
    stars += 0.5
  } else if (healthPercent >= STAR_CONDITIONS.health[1]) {
    stars += 0.3
  }

  // 목표 달성 기준
  const objectiveRatio = totalObjectives > 0 ? objectivesCompleted / totalObjectives : 0
  if (objectiveRatio >= STAR_CONDITIONS.objectives[3]) {
    stars++
  } else if (objectiveRatio >= STAR_CONDITIONS.objectives[2]) {
    stars += 0.5
  } else if (objectiveRatio >= STAR_CONDITIONS.objectives[1]) {
    stars += 0.3
  }

  return Math.min(3, Math.floor(stars))
}
