'use client'

import type { RankingCategoryInfo, RankingReward, RankingSeason, RankingEntry } from '@/lib/types/ranking'

// 랭킹 카테고리 정보
export const RANKING_CATEGORIES: Record<string, RankingCategoryInfo> = {
  total_level: {
    id: 'total_level',
    name: '총 레벨',
    description: '모든 스탯의 총 레벨',
    icon: '📈',
    unit: 'Lv',
    color: 'purple'
  },
  combat_power: {
    id: 'combat_power',
    name: '전투력',
    description: '계산된 총 전투력',
    icon: '⚔️',
    unit: 'CP',
    color: 'red'
  },
  monster_kills: {
    id: 'monster_kills',
    name: '몬스터 처치',
    description: '처치한 몬스터 수',
    icon: '👹',
    unit: '마리',
    color: 'orange'
  },
  boss_kills: {
    id: 'boss_kills',
    name: '보스 처치',
    description: '처치한 보스 수',
    icon: '👑',
    unit: '마리',
    color: 'gold'
  },
  dungeon_clears: {
    id: 'dungeon_clears',
    name: '던전 클리어',
    description: '클리어한 던전 수',
    icon: '🏰',
    unit: '회',
    color: 'blue'
  },
  achievements: {
    id: 'achievements',
    name: '업적 달성',
    description: '달성한 업적 수',
    icon: '🏆',
    unit: '개',
    color: 'yellow'
  },
  collection_rate: {
    id: 'collection_rate',
    name: '도감 완성률',
    description: '몬스터 도감 완성률',
    icon: '📖',
    unit: '%',
    color: 'green'
  },
  equipment_enhance: {
    id: 'equipment_enhance',
    name: '장비 강화',
    description: '장비 강화 총 레벨',
    icon: '⚡',
    unit: '+',
    color: 'cyan'
  },
  gold_earned: {
    id: 'gold_earned',
    name: '획득 골드',
    description: '주간 획득한 골드',
    icon: '💰',
    unit: 'G',
    color: 'amber'
  },
  exp_gained: {
    id: 'exp_gained',
    name: '획득 경험치',
    description: '주간 획득한 경험치',
    icon: '⭐',
    unit: 'EXP',
    color: 'indigo'
  }
}

// 주간 랭킹 리워드
export const WEEKLY_RANKING_REWARDS: RankingReward[] = [
  {
    rank: 1,
    rewards: {
      gold: 100000,
      exp: 50000,
      title: '주간 챔피언',
      badge: '🥇',
      items: ['전설 장비 상자', '고급 강화석']
    }
  },
  {
    rank: 2,
    rewards: {
      gold: 75000,
      exp: 35000,
      title: '주간 준우승자',
      badge: '🥈',
      items: ['영웅 장비 상자', '중급 강화석']
    }
  },
  {
    rank: 3,
    rewards: {
      gold: 50000,
      exp: 25000,
      title: '주간 3위',
      badge: '🥉',
      items: ['희귀 장비 상자', '일반 강화석']
    }
  },
  {
    rank: 4,
    rankRange: [4, 10],
    rewards: {
      gold: 25000,
      exp: 15000,
      items: ['일반 장비 상자']
    }
  },
  {
    rank: 11,
    rankRange: [11, 50],
    rewards: {
      gold: 15000,
      exp: 10000,
      items: ['포션 팩']
    }
  },
  {
    rank: 51,
    rankRange: [51, 100],
    rewards: {
      gold: 10000,
      exp: 5000
    }
  }
]

// 현재 시즌 정보
export const CURRENT_SEASON: RankingSeason = {
  id: 'season-2024-w30',
  name: '2024년 30주차',
  startDate: new Date('2024-07-22'),
  endDate: new Date('2024-07-28'),
  isActive: true,
  rewards: WEEKLY_RANKING_REWARDS,
  participants: 1247
}

// 샘플 랭킹 데이터
export const SAMPLE_RANKING_DATA: RankingEntry[] = [
  {
    userId: 'user-001',
    username: '전설의용사',
    level: 127,
    profileIcon: '🛡️',
    rank: 1,
    score: 945678,
    previousRank: 2,
    change: 'up',
    title: '드래곤 슬레이어',
    guild: '발할라',
    lastActive: new Date('2024-07-26T15:30:00')
  },
  {
    userId: 'user-002',
    username: '마법사왕',
    level: 124,
    profileIcon: '🔮',
    rank: 2,
    score: 923456,
    previousRank: 1,
    change: 'down',
    title: '아크메이지',
    guild: '마법사탑',
    lastActive: new Date('2024-07-26T14:20:00')
  },
  {
    userId: 'user-003',
    username: '그림자자객',
    level: 121,
    profileIcon: '🗡️',
    rank: 3,
    score: 912345,
    previousRank: 3,
    change: 'same',
    title: '암살자',
    guild: '그림자단',
    lastActive: new Date('2024-07-26T16:45:00')
  },
  {
    userId: 'user-004',
    username: '성기사',
    level: 119,
    profileIcon: '⚔️',
    rank: 4,
    score: 898765,
    previousRank: 5,
    change: 'up',
    title: '팔라딘',
    guild: '빛의수호자',
    lastActive: new Date('2024-07-26T13:10:00')
  },
  {
    userId: 'user-005',
    username: '궁수마스터',
    level: 118,
    profileIcon: '🏹',
    rank: 5,
    score: 887654,
    previousRank: 4,
    change: 'down',
    title: '명사수',
    guild: '엘프연합',
    lastActive: new Date('2024-07-26T17:20:00')
  },
  {
    userId: 'user-006',
    username: '드루이드',
    level: 115,
    profileIcon: '🌿',
    rank: 6,
    score: 876543,
    change: 'new',
    title: '자연의친구',
    guild: '숲의수호자',
    lastActive: new Date('2024-07-26T12:30:00')
  },
  {
    userId: 'user-007',
    username: '바바리안',
    level: 114,
    profileIcon: '🪓',
    rank: 7,
    score: 865432,
    previousRank: 8,
    change: 'up',
    title: '광전사',
    guild: '전사부족',
    lastActive: new Date('2024-07-26T11:40:00')
  },
  {
    userId: 'user-008',
    username: '네크로맨서',
    level: 113,
    profileIcon: '💀',
    rank: 8,
    score: 854321,
    previousRank: 6,
    change: 'down',
    title: '언데드마스터',
    guild: '어둠의군단',
    lastActive: new Date('2024-07-26T18:00:00')
  },
  {
    userId: 'user-009',
    username: '몽크',
    level: 112,
    profileIcon: '👊',
    rank: 9,
    score: 843210,
    previousRank: 7,
    change: 'down',
    title: '무술가',
    guild: '무림맹',
    lastActive: new Date('2024-07-26T10:15:00')
  },
  {
    userId: 'user-010',
    username: '서머너',
    level: 111,
    profileIcon: '🔥',
    rank: 10,
    score: 832109,
    previousRank: 12,
    change: 'up',
    title: '소환사',
    guild: '정령계약자',
    lastActive: new Date('2024-07-26T19:30:00')
  }
]

// 사용자 개인 랭킹 히스토리
export const USER_RANKING_HISTORY = {
  userId: 'current-user',
  weeklyHistory: [
    { week: '30주차', rank: 15, score: 456789, category: 'total_level' },
    { week: '29주차', rank: 18, score: 432109, category: 'total_level' },
    { week: '28주차', rank: 22, score: 398765, category: 'total_level' },
    { week: '27주차', rank: 25, score: 365432, category: 'total_level' }
  ],
  bestRanks: {
    total_level: { rank: 12, week: '26주차' },
    combat_power: { rank: 8, week: '25주차' },
    monster_kills: { rank: 5, week: '24주차' },
    achievements: { rank: 3, week: '23주차' }
  }
}
