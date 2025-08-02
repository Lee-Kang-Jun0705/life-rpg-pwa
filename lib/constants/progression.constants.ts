/**
 * 게임 진행도 관련 상수
 * 레벨, 경험치, 업적, 일일 컨텐츠 등
 */

// 레벨 시스템
export const LEVEL_CONFIG = {
  maxLevel: 100,
  baseExpPerLevel: 100,
  expMultiplier: 1.2, // 레벨당 20% 증가

  // 레벨 구간별 보너스
  milestones: {
    10: { gold: 1000, gems: 10, items: ['beginner_package'] },
    25: { gold: 5000, gems: 25, items: ['intermediate_package'] },
    50: { gold: 20000, gems: 50, items: ['advanced_package'] },
    75: { gold: 50000, gems: 100, items: ['expert_package'] },
    100: { gold: 100000, gems: 200, items: ['master_package'] }
  },

  // 스탯 포인트
  statPointsPerLevel: 3,
  bonusStatPointsAt: [10, 25, 50, 75, 100] // 추가 5포인트
} as const

// 일일 컨텐츠
export const DAILY_CONTENT_CONFIG = {
  // 일일 미션
  missions: {
    count: 5,
    refreshTime: 4, // 오전 4시

    rewards: {
      easy: { exp: 100, gold: 50 },
      medium: { exp: 200, gold: 100 },
      hard: { exp: 500, gold: 250 }
    },

    types: {
      combat: { weight: 0.3, description: '몬스터 처치' },
      activity: { weight: 0.3, description: '활동 수행' },
      dungeon: { weight: 0.2, description: '던전 클리어' },
      social: { weight: 0.1, description: '소셜 활동' },
      special: { weight: 0.1, description: '특별 미션' }
    }
  },

  // 일일 보상
  loginRewards: {
    consecutive: [
      { day: 1, gold: 100, exp: 50 },
      { day: 2, gold: 200, exp: 100 },
      { day: 3, gold: 300, exp: 150, items: ['energy_potion'] },
      { day: 4, gold: 400, exp: 200 },
      { day: 5, gold: 500, exp: 250, items: ['skill_reset'] },
      { day: 6, gold: 600, exp: 300 },
      { day: 7, gold: 1000, exp: 500, items: ['premium_chest'], gems: 10 }
    ],

    monthly: [
      { day: 1, items: ['monthly_ticket'] },
      { day: 7, gems: 20 },
      { day: 14, items: ['legendary_skillbook'] },
      { day: 21, gems: 30 },
      { day: 28, items: ['legendary_equipment_box'] }
    ]
  },

  // 일일 제한
  limits: {
    dungeonEntries: 10,
    pvpBattles: 5,
    energyRefills: 3,
    shopRefreshes: 2,
    friendGifts: 10
  }
} as const

// 업적 시스템
export const ACHIEVEMENT_CONFIG = {
  categories: {
    combat: {
      name: '전투',
      icon: '⚔️',
      achievements: {
        monsterSlayer: {
          tiers: [10, 50, 100, 500, 1000],
          rewards: { gems: [5, 10, 20, 50, 100] }
        },
        bossHunter: {
          tiers: [1, 5, 10, 25, 50],
          rewards: { gems: [10, 20, 30, 50, 100] }
        },
        combatPower: {
          tiers: [1000, 5000, 10000, 50000, 100000],
          rewards: { gold: [1000, 5000, 10000, 50000, 100000] }
        }
      }
    },

    collection: {
      name: '수집',
      icon: '📦',
      achievements: {
        itemCollector: {
          tiers: [10, 50, 100, 250, 500],
          rewards: { inventory: [10, 20, 30, 40, 50] }
        },
        setCollector: {
          tiers: [1, 3, 5, 10, 20],
          rewards: { gems: [20, 40, 60, 100, 200] }
        },
        skillMaster: {
          tiers: [5, 10, 20, 40, 80],
          rewards: { skillPoints: [1, 2, 3, 5, 10] }
        }
      }
    },

    exploration: {
      name: '탐험',
      icon: '🗺️',
      achievements: {
        dungeonExplorer: {
          tiers: [5, 20, 50, 100, 200],
          rewards: { energy: [50, 100, 200, 500, 1000] }
        },
        speedRunner: {
          tiers: [60, 120, 180, 300, 600], // 초
          rewards: { gold: [1000, 2500, 5000, 10000, 25000] }
        }
      }
    },

    social: {
      name: '소셜',
      icon: '🤝',
      achievements: {
        friendlyPlayer: {
          tiers: [5, 10, 25, 50, 100],
          rewards: { socialPoints: [100, 250, 500, 1000, 2500] }
        },
        giftGiver: {
          tiers: [10, 50, 100, 500, 1000],
          rewards: { gold: [500, 2500, 5000, 25000, 50000] }
        }
      }
    },

    progression: {
      name: '성장',
      icon: '📈',
      achievements: {
        levelMaster: {
          tiers: [10, 25, 50, 75, 100],
          rewards: { gems: [10, 25, 50, 100, 200] }
        },
        activityStreak: {
          tiers: [7, 14, 30, 60, 100], // 일
          rewards: { energy: [100, 200, 500, 1000, 2000] }
        }
      }
    }
  },

  // 히든 업적
  hidden: {
    perfectionist: {
      condition: 'all_achievements',
      reward: { title: '완벽주의자', gems: 1000 }
    },
    luckyOne: {
      condition: 'legendary_first_try',
      reward: { title: '행운아', luck: 10 }
    },
    speedDemon: {
      condition: 'clear_dungeon_30s',
      reward: { title: '스피드 데몬', speed: 20 }
    }
  }
} as const

// 에너지 시스템
export const ENERGY_CONFIG = {
  maxEnergy: 100,
  regenRate: 1, // 분당
  regenInterval: 60000, // 1분

  // 활동별 소비량
  costs: {
    normalDungeon: 10,
    eliteDungeon: 20,
    bossDungeon: 30,
    pvpBattle: 15,
    dailyMission: 5
  },

  // 에너지 회복 아이템
  recovery: {
    smallPotion: 20,
    mediumPotion: 50,
    largePotion: 100,
    energyMeal: 30
  }
} as const

// 활동 경험치
export const ACTIVITY_EXP_CONFIG = {
  // 품질별 배율
  qualityMultipliers: {
    D: 0.5,
    C: 0.75,
    B: 1.0,
    A: 1.5,
    S: 2.0
  },

  // 활동 타입별 기본 경험치
  baseExp: {
    health: {
      exercise: 20,
      meal: 10,
      sleep: 15,
      meditation: 12
    },
    learning: {
      study: 25,
      reading: 15,
      practice: 20,
      course: 30
    },
    relationship: {
      meeting: 20,
      call: 10,
      gift: 15,
      help: 25
    },
    achievement: {
      project: 30,
      goal: 25,
      challenge: 20,
      milestone: 35
    }
  },

  // 연속 활동 보너스
  streakBonus: {
    3: 1.1, // 3일 연속 10%
    7: 1.2, // 7일 연속 20%
    14: 1.3, // 14일 연속 30%
    30: 1.5 // 30일 연속 50%
  }
} as const

// 상점 새로고침
export const SHOP_REFRESH_CONFIG = {
  // 자동 새로고침 시간
  autoRefreshHours: [0, 6, 12, 18], // 6시간마다

  // 수동 새로고침 비용
  manualRefreshCost: {
    free: 2, // 무료 횟수
    gold: [100, 200, 500, 1000], // 점진적 증가
    gems: 10 // 젬으로 새로고침
  },

  // 상품 개수
  itemSlots: {
    normal: 6,
    special: 3,
    limited: 1
  }
} as const

// VIP 시스템 (무료 게임이지만 활동 기반)
export const VIP_CONFIG = {
  levels: {
    0: { name: '일반', color: 'gray', benefits: {} },
    1: {
      name: '브론즈',
      color: 'bronze',
      requirements: { totalActivity: 100 },
      benefits: { energyRegen: 1.1, expBonus: 1.05 }
    },
    2: {
      name: '실버',
      color: 'silver',
      requirements: { totalActivity: 500 },
      benefits: { energyRegen: 1.2, expBonus: 1.1, goldBonus: 1.1 }
    },
    3: {
      name: '골드',
      color: 'gold',
      requirements: { totalActivity: 1000 },
      benefits: { energyRegen: 1.3, expBonus: 1.15, goldBonus: 1.15, dropBonus: 1.1 }
    },
    4: {
      name: '플래티넘',
      color: 'platinum',
      requirements: { totalActivity: 2500 },
      benefits: { energyRegen: 1.5, expBonus: 1.2, goldBonus: 1.2, dropBonus: 1.2 }
    },
    5: {
      name: '다이아몬드',
      color: 'diamond',
      requirements: { totalActivity: 5000 },
      benefits: { energyRegen: 2, expBonus: 1.3, goldBonus: 1.3, dropBonus: 1.3, skillPoints: 10 }
    }
  }
} as const
