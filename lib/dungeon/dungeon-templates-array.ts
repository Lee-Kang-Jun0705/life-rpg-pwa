import { Dungeon, DifficultyLevel, DungeonType } from './types'
import { DUNGEON_TEMPLATES } from './dungeon-templates'

/**
 * DUNGEON_TEMPLATES를 배열 형태로 변환
 */
export const DUNGEON_TEMPLATES_ARRAY: Dungeon[] = [
  // 일일 던전 - 건강의 시련
  {
    id: 'daily-health-1',
    name: '건강의 시련',
    description: '오늘의 건강 목표를 달성하고 보상을 획득하세요!',
    imageUrl: '/images/dungeons/health.png',
    difficulty: 'normal' as DifficultyLevel,
    type: 'daily' as DungeonType,
    requirements: {
      minLevel: 1,
      energy: 10
    },
    rewards: {
      exp: 50,
      gold: 30,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.daily.health.challenges,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
    maxAttempts: 3,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 일일 던전 - 지식의 전당
  {
    id: 'daily-learning-1',
    name: '지식의 전당',
    description: '학습 목표를 달성하고 지혜를 쌓으세요!',
    imageUrl: '/images/dungeons/learning.png',
    difficulty: 'normal' as DifficultyLevel,
    type: 'daily' as DungeonType,
    requirements: {
      minLevel: 1,
      energy: 10
    },
    rewards: {
      exp: 50,
      gold: 30,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.daily.learning.challenges,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
    maxAttempts: 3,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 일일 던전 - 인연의 고리
  {
    id: 'daily-relation-1',
    name: '인연의 고리',
    description: '소중한 사람들과 시간을 보내세요',
    imageUrl: '/images/dungeons/relationship.png',
    difficulty: 'normal' as DifficultyLevel,
    type: 'daily' as DungeonType,
    requirements: {
      minLevel: 1,
      energy: 10
    },
    rewards: {
      exp: 45,
      gold: 25,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.daily.relationship.challenges,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
    maxAttempts: 3,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 일일 던전 - 성취의 길
  {
    id: 'daily-achieve-1',
    name: '성취의 길',
    description: '목표를 달성하고 성취감을 느껴보세요',
    imageUrl: '/images/dungeons/achievement.png',
    difficulty: 'normal' as DifficultyLevel,
    type: 'daily' as DungeonType,
    requirements: {
      minLevel: 1,
      energy: 10
    },
    rewards: {
      exp: 50,
      gold: 30,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.daily.achievement.challenges,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
    maxAttempts: 3,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 주간 던전 - 균형의 시험
  {
    id: 'weekly-balanced-1',
    name: '균형의 시험',
    description: '모든 스탯을 골고루 향상시키세요',
    imageUrl: '/images/dungeons/balanced.png',
    difficulty: 'hard' as DifficultyLevel,
    type: 'weekly' as DungeonType,
    requirements: {
      minLevel: 5,
      energy: 20
    },
    rewards: {
      exp: 150,
      gold: 100,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.weekly.balanced.challenges,
    resetTime: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()))),
    maxAttempts: 1,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 주간 던전 - 집중 훈련장
  {
    id: 'weekly-intensive-1',
    name: '집중 훈련장',
    description: '특정 분야에 집중하여 실력을 키우세요',
    imageUrl: '/images/dungeons/intensive.png',
    difficulty: 'hard' as DifficultyLevel,
    type: 'weekly' as DungeonType,
    requirements: {
      minLevel: 5,
      energy: 20
    },
    rewards: {
      exp: 200,
      gold: 150,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.weekly.intensive.challenges,
    resetTime: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()))),
    maxAttempts: 1,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  },
  // 특별 던전 - 극한의 도전
  {
    id: 'special-challenge-1',
    name: '극한의 도전',
    description: '한계를 뛰어넘는 특별한 도전!',
    imageUrl: '/images/dungeons/challenge.png',
    difficulty: 'nightmare' as DifficultyLevel,
    type: 'special' as DungeonType,
    requirements: {
      minLevel: 10,
      energy: 30
    },
    rewards: {
      exp: 500,
      gold: 300,
      items: []
    },
    challenges: DUNGEON_TEMPLATES.special.challenge.challenges,
    resetTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    maxAttempts: 1,
    isAvailable: false,
    isCompleted: false,
    attempts: 0
  }
]
