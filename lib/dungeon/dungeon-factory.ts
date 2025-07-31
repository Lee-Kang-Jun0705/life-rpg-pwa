import { 
  Dungeon, 
  DungeonType, 
  DifficultyLevel, 
  Challenge,
  DungeonStatus
} from './types'

/**
 * 던전 생성을 위한 Factory 패턴 구현
 */
export class DungeonFactory {
  /**
   * 일일 던전 생성
   */
  static createDailyDungeon(
    id: string,
    name: string,
    difficulty: DifficultyLevel,
    challenges: Challenge[]
  ): Dungeon {
    const resetTime = new Date()
    resetTime.setHours(24, 0, 0, 0)

    return {
      id,
      name,
      description: `오늘의 ${name} 도전 과제를 완료하세요!`,
      difficulty,
      type: 'daily',
      status: 'available',
      requirements: {
        minLevel: this.getMinLevelByDifficulty(difficulty),
        requiredEnergy: this.getEnergyByDifficulty(difficulty)
      },
      rewards: this.getRewardsByDifficulty(difficulty, 'daily'),
      challenges,
      resetTime,
      attempts: 0,
      maxAttempts: 1
    }
  }

  /**
   * 주간 던전 생성
   */
  static createWeeklyDungeon(
    id: string,
    name: string,
    difficulty: DifficultyLevel,
    challenges: Challenge[]
  ): Dungeon {
    const resetTime = new Date()
    const dayOfWeek = resetTime.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    resetTime.setDate(resetTime.getDate() + daysUntilMonday)
    resetTime.setHours(0, 0, 0, 0)

    return {
      id,
      name,
      description: `이번 주 ${name} 미션을 완료하고 특별 보상을 받으세요!`,
      difficulty,
      type: 'weekly',
      status: 'available',
      requirements: {
        minLevel: this.getMinLevelByDifficulty(difficulty) + 5,
        requiredEnergy: this.getEnergyByDifficulty(difficulty) * 2
      },
      rewards: this.getRewardsByDifficulty(difficulty, 'weekly'),
      challenges,
      resetTime,
      attempts: 0,
      maxAttempts: 3
    }
  }

  /**
   * 무한의 탑 던전 생성
   */
  static createInfiniteTowerDungeon(floor: number): Dungeon {
    const difficulty = this.getDifficultyByFloor(floor)
    
    return {
      id: `infinite-tower-${floor}`,
      name: `무한의 탑 ${floor}층`,
      description: '끝없는 도전! 얼마나 높이 올라갈 수 있을까요?',
      difficulty,
      type: 'infinite',
      status: 'available',
      requirements: {
        minLevel: Math.max(1, floor * 2),
        requiredTickets: 1
      },
      rewards: {
        exp: floor * 50,
        coins: floor * 30,
        items: floor % 10 === 0 ? ['legendary-chest'] : []
      },
      challenges: [],
      resetTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후
      attempts: 0,
      stages: {
        total: 1,
        completed: 0,
        current: 1
      }
    }
  }

  /**
   * 난이도에 따른 최소 레벨 계산
   */
  private static getMinLevelByDifficulty(difficulty: DifficultyLevel): number {
    const levelMap: Record<DifficultyLevel, number> = {
      easy: 1,
      normal: 5,
      hard: 10,
      expert: 20,
      legendary: 30,
      dynamic: 1
    }
    return levelMap[difficulty] || 1
  }

  /**
   * 난이도에 따른 에너지 소모량 계산
   */
  private static getEnergyByDifficulty(difficulty: DifficultyLevel): number {
    const energyMap: Record<DifficultyLevel, number> = {
      easy: 5,
      normal: 10,
      hard: 15,
      expert: 20,
      legendary: 30,
      dynamic: 10
    }
    return energyMap[difficulty] || 10
  }

  /**
   * 난이도와 타입에 따른 보상 계산
   */
  private static getRewardsByDifficulty(
    difficulty: DifficultyLevel, 
    type: DungeonType
  ): Dungeon['rewards'] {
    const baseRewards = {
      easy: { exp: 50, coins: 30 },
      normal: { exp: 100, coins: 60 },
      hard: { exp: 200, coins: 120 },
      expert: { exp: 400, coins: 250 },
      legendary: { exp: 800, coins: 500 },
      dynamic: { exp: 100, coins: 60 }
    }

    const multipliers = {
      daily: 1,
      weekly: 2.5,
      special: 3,
      infinite: 1.5,
      event: 4
    }

    const base = baseRewards[difficulty]
    const multiplier = multipliers[type]

    return {
      exp: Math.floor(base.exp * multiplier),
      coins: Math.floor(base.coins * multiplier),
      items: this.getRewardItems(difficulty, type)
    }
  }

  /**
   * 보상 아이템 결정
   */
  private static getRewardItems(difficulty: DifficultyLevel, type: DungeonType): string[] {
    const items: string[] = []

    // 난이도별 기본 아이템
    if (difficulty === 'hard' || difficulty === 'expert') {
      items.push('rare-chest')
    }
    if (difficulty === 'legendary') {
      items.push('legendary-chest')
    }

    // 타입별 추가 아이템
    if (type === 'weekly') {
      items.push('weekly-token')
    }
    if (type === 'special' || type === 'event') {
      items.push('event-token')
    }

    return items
  }

  /**
   * 층수에 따른 난이도 결정
   */
  private static getDifficultyByFloor(floor: number): DifficultyLevel {
    if (floor <= 10) return 'easy'
    if (floor <= 25) return 'normal'
    if (floor <= 50) return 'hard'
    if (floor <= 75) return 'expert'
    return 'legendary'
  }
}