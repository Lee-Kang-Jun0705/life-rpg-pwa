// 업적 데이터
import type { Achievement } from '@/lib/types/achievements'

export const ACHIEVEMENTS: Achievement[] = [
  // 일반 업적
  {
    id: 'first-steps',
    name: '첫 걸음',
    description: '게임을 시작하세요',
    category: 'general',
    difficulty: 'easy',
    icon: '👶',
    condition: {
      type: 'custom',
      count: 1
    },
    rewards: {
      exp: 100,
      gold: 500,
      title: '모험가'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'level-up-master',
    name: '성장의 대가',
    description: '레벨 10에 도달하세요',
    category: 'progression',
    difficulty: 'easy',
    icon: '⬆️',
    condition: {
      type: 'level_reach',
      target: 10
    },
    rewards: {
      exp: 500,
      gold: 2000,
      stat: { type: 'health', value: 10 }
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'rookie-fighter',
    name: '신참 전사',
    description: '첫 번째 몬스터를 처치하세요',
    category: 'combat',
    difficulty: 'easy',
    icon: '⚔️',
    condition: {
      type: 'monster_kill',
      count: 1
    },
    rewards: {
      exp: 200,
      gold: 1000,
      title: '몬스터 헌터'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'slime-slayer',
    name: '슬라임 학살자',
    description: '슬라임을 50마리 처치하세요',
    category: 'combat',
    difficulty: 'normal',
    icon: '🟢',
    condition: {
      type: 'monster_kill',
      target: 'slime',
      count: 50
    },
    rewards: {
      exp: 1000,
      gold: 5000,
      items: ['slime-essence'],
      title: '슬라임 마스터'
    },
    isUnlocked: false,
    progress: 0
  },

  // 전투 업적
  {
    id: 'combo-master',
    name: '콤보 마스터',
    description: '10연승을 달성하세요',
    category: 'combat',
    difficulty: 'normal',
    icon: '🔥',
    condition: {
      type: 'battle_streak',
      count: 10
    },
    rewards: {
      exp: 2000,
      gold: 8000,
      stat: { type: 'attack', value: 5 }
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'critical-expert',
    name: '치명타 전문가',
    description: '치명타를 100번 기록하세요',
    category: 'combat',
    difficulty: 'normal',
    icon: '💥',
    condition: {
      type: 'critical_hits',
      count: 100
    },
    rewards: {
      exp: 1500,
      gold: 6000,
      stat: { type: 'attack', value: 3 }
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'boss-hunter',
    name: '보스 헌터',
    description: '보스 몬스터를 5마리 처치하세요',
    category: 'combat',
    difficulty: 'hard',
    icon: '👑',
    condition: {
      type: 'boss_kill',
      count: 5
    },
    rewards: {
      exp: 5000,
      gold: 20000,
      items: ['boss-essence'],
      title: '보스 슬레이어'
    },
    isUnlocked: false,
    progress: 0
  },

  // 던전 업적
  {
    id: 'dungeon-explorer',
    name: '던전 탐험가',
    description: '첫 번째 던전을 클리어하세요',
    category: 'exploration',
    difficulty: 'easy',
    icon: '🏰',
    condition: {
      type: 'dungeon_clear',
      count: 1
    },
    rewards: {
      exp: 300,
      gold: 1500,
      energy: 20
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'speed-runner',
    name: '스피드러너',
    description: '던전을 5분 이내에 클리어하세요',
    category: 'exploration',
    difficulty: 'hard',
    icon: '⚡',
    condition: {
      type: 'speed_clear',
      timeLimit: 5,
      count: 1
    },
    rewards: {
      exp: 3000,
      gold: 12000,
      title: '번개 같은 자'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'perfect-clear',
    name: '완벽한 클리어',
    description: '체력 손실 없이 던전을 클리어하세요',
    category: 'exploration',
    difficulty: 'expert',
    icon: '⭐',
    condition: {
      type: 'perfect_clear',
      count: 1
    },
    rewards: {
      exp: 5000,
      gold: 25000,
      stat: { type: 'defense', value: 10 },
      title: '완벽주의자'
    },
    isUnlocked: false,
    progress: 0
  },

  // 수집 업적
  {
    id: 'collector-novice',
    name: '수집가 견습생',
    description: '아이템을 50개 수집하세요',
    category: 'collection',
    difficulty: 'easy',
    icon: '📦',
    condition: {
      type: 'item_collect',
      count: 50
    },
    rewards: {
      exp: 500,
      gold: 2500,
      items: ['storage-expansion']
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'equipment-master',
    name: '장비 마스터',
    description: '장비를 +10까지 강화하세요',
    category: 'collection',
    difficulty: 'hard',
    icon: '⚒️',
    condition: {
      type: 'equipment_enhance',
      target: 10
    },
    rewards: {
      exp: 3000,
      gold: 15000,
      items: ['enhancement-stone-rare'],
      title: '강화의 달인'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'monster-scholar',
    name: '몬스터 학자',
    description: '몬스터 도감을 50% 완성하세요',
    category: 'collection',
    difficulty: 'normal',
    icon: '📚',
    condition: {
      type: 'collection_complete',
      target: 50
    },
    rewards: {
      exp: 2000,
      gold: 10000,
      title: '몬스터 박사'
    },
    isUnlocked: false,
    progress: 0
  },

  // 성장 업적
  {
    id: 'wealthy-adventurer',
    name: '부유한 모험가',
    description: '골드 100,000개를 보유하세요',
    category: 'progression',
    difficulty: 'normal',
    icon: '💰',
    condition: {
      type: 'total_gold',
      target: 100000
    },
    rewards: {
      exp: 1000,
      gold: 25000,
      title: '부자'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'experience-hoarder',
    name: '경험치 수집가',
    description: '총 경험치 1,000,000을 획득하세요',
    category: 'progression',
    difficulty: 'expert',
    icon: '⭐',
    condition: {
      type: 'total_exp',
      target: 1000000
    },
    rewards: {
      exp: 10000,
      gold: 50000,
      stat: { type: 'learning', value: 20 },
      title: '지식의 보고'
    },
    isUnlocked: false,
    progress: 0
  },

  // 소셜 업적
  {
    id: 'daily-dedication',
    name: '일일 헌신',
    description: '7일 연속 로그인하세요',
    category: 'social',
    difficulty: 'easy',
    icon: '📅',
    condition: {
      type: 'daily_login',
      count: 7
    },
    rewards: {
      exp: 1000,
      gold: 5000,
      energy: 50,
      title: '성실한 자'
    },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'mission-master',
    name: '미션 마스터',
    description: '일일 미션을 100개 완료하세요',
    category: 'social',
    difficulty: 'hard',
    icon: '🎯',
    condition: {
      type: 'daily_mission',
      count: 100
    },
    rewards: {
      exp: 5000,
      gold: 30000,
      tickets: 10,
      title: '미션 전문가'
    },
    isUnlocked: false,
    progress: 0
  },

  // 특별 업적 (숨겨진)
  {
    id: 'secret-discoverer',
    name: '비밀 발견자',
    description: '숨겨진 던전을 발견하세요',
    category: 'special',
    difficulty: 'legendary',
    icon: '🗝️',
    condition: {
      type: 'custom',
      target: 'secret_dungeon',
      count: 1
    },
    rewards: {
      exp: 10000,
      gold: 100000,
      items: ['legendary-key'],
      title: '비밀의 탐험가'
    },
    isUnlocked: false,
    progress: 0,
    isHidden: true
  },
  {
    id: 'time-traveler',
    name: '시간 여행자',
    description: '자정에 정확히 로그인하세요',
    category: 'special',
    difficulty: 'expert',
    icon: '🕒',
    condition: {
      type: 'time_based',
      parameters: { hour: 0, minute: 0 }
    },
    rewards: {
      exp: 2000,
      gold: 15000,
      items: ['time-crystal'],
      title: '자정의 방문자'
    },
    isUnlocked: false,
    progress: 0,
    isHidden: true
  },
  {
    id: 'lucky-seven',
    name: '행운의 7',
    description: '7이 들어간 날짜에 7번의 승리를 거두세요',
    category: 'special',
    difficulty: 'legendary',
    icon: '🍀',
    condition: {
      type: 'custom',
      parameters: { wins: 7, date_contains: 7 }
    },
    rewards: {
      exp: 7777,
      gold: 77777,
      items: ['lucky-charm'],
      title: '행운의 화신'
    },
    isUnlocked: false,
    progress: 0,
    isHidden: true
  },

  // 마스터 업적 (다른 업적들의 전제조건)
  {
    id: 'ultimate-warrior',
    name: '궁극의 전사',
    description: '모든 전투 업적을 달성하세요',
    category: 'combat',
    difficulty: 'legendary',
    icon: '👑',
    condition: {
      type: 'custom',
      parameters: { category_complete: 'combat' }
    },
    rewards: {
      exp: 50000,
      gold: 200000,
      stat: { type: 'attack', value: 50 },
      title: '전투의 신'
    },
    isUnlocked: false,
    progress: 0,
    prerequisites: ['rookie-fighter', 'combo-master', 'critical-expert', 'boss-hunter']
  },
  {
    id: 'grand-master',
    name: '그랜드 마스터',
    description: '모든 업적을 달성하세요',
    category: 'special',
    difficulty: 'legendary',
    icon: '🏆',
    condition: {
      type: 'custom',
      parameters: { all_achievements: true }
    },
    rewards: {
      exp: 100000,
      gold: 1000000,
      title: '전설의 마스터',
      specialReward: {
        type: 'unlock_character',
        value: 'master_avatar'
      }
    },
    isUnlocked: false,
    progress: 0,
    prerequisites: ['ultimate-warrior'] // 실제로는 모든 업적이 필요
  }
]

// 업적 카테고리별 정보
export const ACHIEVEMENT_CATEGORIES = {
  general: { name: '일반', color: 'gray', icon: '📋' },
  combat: { name: '전투', color: 'red', icon: '⚔️' },
  exploration: { name: '탐험', color: 'blue', icon: '🗺️' },
  collection: { name: '수집', color: 'green', icon: '📦' },
  progression: { name: '성장', color: 'purple', icon: '📈' },
  social: { name: '소셜', color: 'pink', icon: '👥' },
  special: { name: '특별', color: 'yellow', icon: '⭐' }
}

// 업적 난이도별 정보
export const ACHIEVEMENT_DIFFICULTIES = {
  easy: { name: '브론즈', color: 'orange', multiplier: 1 },
  normal: { name: '실버', color: 'gray', multiplier: 1.5 },
  hard: { name: '골드', color: 'yellow', multiplier: 2 },
  expert: { name: '플래티넘', color: 'cyan', multiplier: 3 },
  legendary: { name: '다이아몬드', color: 'purple', multiplier: 5 }
}
