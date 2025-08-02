// 일일 콘텐츠 시스템 타입 정의
// 매일 갱신되는 도전 과제와 보상 시스템

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface DailyMission {
  id: string
  title: string
  description: string
  category: 'health' | 'learning' | 'relationship' | 'achievement' | 'general'
  difficulty: 'easy' | 'normal' | 'hard'
  target: number
  current: number
  rewards: {
    exp: number
    gold: number
    energy?: number
    items?: string[]
  }
  isCompleted: boolean
  completedAt?: Date
  expiresAt: Date
}

export interface DailyDungeon {
  id: string
  name: string
  description: string
  dayOfWeek: DayOfWeek
  dungeonId: string // 실제 던전 ID 참조
  bonusRewards: {
    expMultiplier: number // 1.5 = 50% 추가
    goldMultiplier: number
    guaranteedItems?: string[]
  }
  isAvailable: boolean
  attempts: number
  maxAttempts: number
}

export interface DailyLogin {
  day: number
  rewards: {
    exp: number
    gold: number
    energy?: number
    items?: string[]
    tickets?: number
  }
  isClaimed: boolean
  claimedAt?: Date
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  missions: {
    id: string
    description: string
    target: number
    current: number
    completed: boolean
  }[]
  rewards: {
    exp: number
    gold: number
    items: string[]
    title?: string // 칭호
  }
  progress: number // 0-100
  isCompleted: boolean
  isClaimed: boolean
}

export interface DailyContentState {
  missions: DailyMission[]
  dailyDungeons: DailyDungeon[]
  loginStreak: number
  lastLoginDate?: Date
  loginRewards: DailyLogin[]
  weeklyChallenge?: WeeklyChallenge
  lastResetDate: Date
}

// 일일 미션 템플릿
export const DAILY_MISSION_TEMPLATES: Omit<DailyMission, 'id' | 'current' | 'isCompleted' | 'completedAt' | 'expiresAt'>[] = [
  // 건강 미션
  {
    title: '아침 스트레칭',
    description: '10분간 스트레칭을 하세요',
    category: 'health',
    difficulty: 'easy',
    target: 1,
    rewards: { exp: 20, gold: 10 }
  },
  {
    title: '물 마시기',
    description: '물을 8잔 이상 마시세요',
    category: 'health',
    difficulty: 'normal',
    target: 8,
    rewards: { exp: 30, gold: 15, energy: 5 }
  },
  {
    title: '운동하기',
    description: '30분 이상 운동하세요',
    category: 'health',
    difficulty: 'hard',
    target: 30,
    rewards: { exp: 50, gold: 30, items: ['stamina-potion'] }
  },

  // 학습 미션
  {
    title: '독서하기',
    description: '책을 20페이지 읽으세요',
    category: 'learning',
    difficulty: 'easy',
    target: 20,
    rewards: { exp: 25, gold: 12 }
  },
  {
    title: '새로운 것 배우기',
    description: '새로운 기술이나 지식을 학습하세요',
    category: 'learning',
    difficulty: 'normal',
    target: 1,
    rewards: { exp: 40, gold: 20, items: ['wisdom-scroll'] }
  },

  // 관계 미션
  {
    title: '감사 표현하기',
    description: '누군가에게 감사를 표현하세요',
    category: 'relationship',
    difficulty: 'easy',
    target: 1,
    rewards: { exp: 20, gold: 10 }
  },
  {
    title: '친구와 대화하기',
    description: '친구나 가족과 30분 이상 대화하세요',
    category: 'relationship',
    difficulty: 'normal',
    target: 30,
    rewards: { exp: 35, gold: 18, energy: 5 }
  },

  // 성취 미션
  {
    title: '할 일 완료하기',
    description: '오늘의 할 일 3개를 완료하세요',
    category: 'achievement',
    difficulty: 'normal',
    target: 3,
    rewards: { exp: 35, gold: 20 }
  },
  {
    title: '목표 달성하기',
    description: '설정한 목표 중 하나를 달성하세요',
    category: 'achievement',
    difficulty: 'hard',
    target: 1,
    rewards: { exp: 60, gold: 40, items: ['exp-booster'] }
  },

  // 일반 미션
  {
    title: '던전 클리어',
    description: '아무 던전이나 1개 클리어하세요',
    category: 'general',
    difficulty: 'easy',
    target: 1,
    rewards: { exp: 30, gold: 15, energy: 10 }
  },
  {
    title: '전투 승리',
    description: '전투에서 5회 승리하세요',
    category: 'general',
    difficulty: 'normal',
    target: 5,
    rewards: { exp: 40, gold: 25, items: ['battle-ticket'] }
  }
]

// 요일별 던전 설정
export const DAILY_DUNGEON_SCHEDULE: Record<DayOfWeek, Omit<DailyDungeon, 'id' | 'isAvailable' | 'attempts'>> = {
  monday: {
    name: '월요일: 건강의 시련',
    description: '건강 관련 던전 보상 2배',
    dayOfWeek: 'monday',
    dungeonId: 'daily-health-1',
    bonusRewards: {
      expMultiplier: 2,
      goldMultiplier: 2,
      guaranteedItems: ['stamina-potion']
    },
    maxAttempts: 3
  },
  tuesday: {
    name: '화요일: 지식의 전당',
    description: '학습 관련 던전 보상 2배',
    dayOfWeek: 'tuesday',
    dungeonId: 'daily-study-1',
    bonusRewards: {
      expMultiplier: 2,
      goldMultiplier: 2,
      guaranteedItems: ['wisdom-scroll']
    },
    maxAttempts: 3
  },
  wednesday: {
    name: '수요일: 인연의 고리',
    description: '관계 관련 던전 보상 2배',
    dayOfWeek: 'wednesday',
    dungeonId: 'daily-relation-1',
    bonusRewards: {
      expMultiplier: 2,
      goldMultiplier: 2,
      guaranteedItems: ['friendship-badge']
    },
    maxAttempts: 3
  },
  thursday: {
    name: '목요일: 성취의 요새',
    description: '성취 관련 던전 보상 2배',
    dayOfWeek: 'thursday',
    dungeonId: 'daily-achievement-1',
    bonusRewards: {
      expMultiplier: 2,
      goldMultiplier: 2,
      guaranteedItems: ['exp-booster']
    },
    maxAttempts: 3
  },
  friday: {
    name: '금요일: 보물 사냥',
    description: '모든 던전 골드 보상 3배',
    dayOfWeek: 'friday',
    dungeonId: 'daily-hard-balance',
    bonusRewards: {
      expMultiplier: 1.5,
      goldMultiplier: 3,
      guaranteedItems: ['treasure-chest']
    },
    maxAttempts: 3
  },
  saturday: {
    name: '토요일: 경험치 축제',
    description: '모든 던전 경험치 보상 3배',
    dayOfWeek: 'saturday',
    dungeonId: 'weekly-boss-1',
    bonusRewards: {
      expMultiplier: 3,
      goldMultiplier: 1.5,
      guaranteedItems: ['exp-booster', 'exp-booster']
    },
    maxAttempts: 2
  },
  sunday: {
    name: '일요일: 도전의 날',
    description: '특별 보스 레이드 오픈',
    dayOfWeek: 'sunday',
    dungeonId: 'weekly-boss-1',
    bonusRewards: {
      expMultiplier: 2,
      goldMultiplier: 2,
      guaranteedItems: ['legendary-chest']
    },
    maxAttempts: 1
  }
}

// 출석 보상 (28일 주기)
export const LOGIN_REWARDS: Omit<DailyLogin, 'isClaimed' | 'claimedAt'>[] = [
  { day: 1, rewards: { exp: 10, gold: 50 } },
  { day: 2, rewards: { exp: 20, gold: 100 } },
  { day: 3, rewards: { exp: 30, gold: 150, energy: 30 } },
  { day: 4, rewards: { exp: 40, gold: 200 } },
  { day: 5, rewards: { exp: 50, gold: 250, items: ['exp-booster'] } },
  { day: 6, rewards: { exp: 60, gold: 300 } },
  { day: 7, rewards: { exp: 100, gold: 500, items: ['stamina-potion', 'wisdom-scroll'], tickets: 10 } },
  { day: 8, rewards: { exp: 70, gold: 350 } },
  { day: 9, rewards: { exp: 80, gold: 400 } },
  { day: 10, rewards: { exp: 90, gold: 450, energy: 60 } },
  { day: 11, rewards: { exp: 100, gold: 500 } },
  { day: 12, rewards: { exp: 110, gold: 550, items: ['health-potion', 'mana-potion'] } },
  { day: 13, rewards: { exp: 120, gold: 600 } },
  { day: 14, rewards: { exp: 200, gold: 1000, items: ['rare-chest'], tickets: 20 } },
  { day: 15, rewards: { exp: 130, gold: 650 } },
  { day: 16, rewards: { exp: 140, gold: 700 } },
  { day: 17, rewards: { exp: 150, gold: 750, energy: 90 } },
  { day: 18, rewards: { exp: 160, gold: 800 } },
  { day: 19, rewards: { exp: 170, gold: 850, items: ['exp-booster', 'exp-booster'] } },
  { day: 20, rewards: { exp: 180, gold: 900 } },
  { day: 21, rewards: { exp: 300, gold: 1500, items: ['epic-chest'], tickets: 30 } },
  { day: 22, rewards: { exp: 190, gold: 950 } },
  { day: 23, rewards: { exp: 200, gold: 1000 } },
  { day: 24, rewards: { exp: 210, gold: 1050, energy: 120 } },
  { day: 25, rewards: { exp: 220, gold: 1100 } },
  { day: 26, rewards: { exp: 230, gold: 1150, items: ['legendary-scroll'] } },
  { day: 27, rewards: { exp: 240, gold: 1200 } },
  { day: 28, rewards: { exp: 500, gold: 3000, items: ['legendary-chest', 'legendary-weapon'], tickets: 50 } }
]
