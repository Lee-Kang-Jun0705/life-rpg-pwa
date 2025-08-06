import { MONSTER_DATABASE, getMonsterById } from '@/lib/battle/monster-database'
import { EXTENDED_MONSTER_DATABASE, createScaledMonster } from '@/lib/battle/extended-monster-database'
import type { MonsterData } from '@/lib/types/battle-extended'

export interface FloorData {
  floor: number
  name: string
  description: string
  theme: 'forest' | 'cave' | 'castle' | 'ruins' | 'hell' | 'ice' | 'desert' | 'sky'
  difficulty: number // 1-10
  monsterPool: {
    monsterId: string
    weight: number // 출현 확률 가중치
    levelRange: [number, number]
  }[]
  bossMonster?: {
    monsterId: string
    level: number
  }
  battleConfigs: {
    singleBattle: number // 1:1 전투 확률
    doubleBattle: number // 1:2 전투 확률
    tripleBattle: number // 1:3 전투 확률
  }
  rewards: {
    expMultiplier: number
    goldMultiplier: number
    itemDropRate: number
  }
}

export interface DungeonFloorSystem {
  dungeonId: string
  name: string
  description: string
  totalFloors: number
  floors: FloorData[]
  unlockRequirement?: {
    level?: number
    previousDungeon?: string
  }
}

// 던전별 층 시스템 데이터
export const DUNGEON_FLOOR_SYSTEMS: Record<string, DungeonFloorSystem> = {
  // 초급 던전 - 초보자 던전 (레벨 1-10)
  beginner_dungeon: {
    dungeonId: 'beginner_dungeon',
    name: '초보자 던전',
    description: '모험을 시작하는 초보자를 위한 던전',
    totalFloors: 5,
    unlockRequirement: {
      level: 1
    },
    floors: [
      {
        floor: 1,
        name: '동굴 입구',
        description: '습하고 어두운 동굴의 입구',
        theme: 'cave',
        difficulty: 1,
        monsterPool: [
          { monsterId: 'slime_green', weight: 40, levelRange: [1, 2] },
          { monsterId: 'slime_blue', weight: 30, levelRange: [1, 3] },
          { monsterId: 'bat_cave', weight: 30, levelRange: [2, 3] }
        ],
        battleConfigs: {
          singleBattle: 80,
          doubleBattle: 20,
          tripleBattle: 0
        },
        rewards: {
          expMultiplier: 1.0,
          goldMultiplier: 1.0,
          itemDropRate: 0.1
        }
      },
      {
        floor: 2,
        name: '고블린 주둔지',
        description: '고블린들이 모여있는 공간',
        theme: 'cave',
        difficulty: 2,
        monsterPool: [
          { monsterId: 'goblin_scout', weight: 50, levelRange: [3, 5] },
          { monsterId: 'bat_cave', weight: 30, levelRange: [3, 4] },
          { monsterId: 'mushroom_red', weight: 20, levelRange: [4, 5] }
        ],
        battleConfigs: {
          singleBattle: 60,
          doubleBattle: 35,
          tripleBattle: 5
        },
        rewards: {
          expMultiplier: 1.2,
          goldMultiplier: 1.2,
          itemDropRate: 0.15
        }
      },
      {
        floor: 3,
        name: '족장의 방',
        description: '고블린 족장이 지배하는 공간',
        theme: 'cave',
        difficulty: 3,
        monsterPool: [
          { monsterId: 'goblin_scout', weight: 60, levelRange: [4, 6] },
          { monsterId: 'mushroom_red', weight: 40, levelRange: [5, 6] }
        ],
        bossMonster: {
          monsterId: 'goblin_chief',
          level: 7
        },
        battleConfigs: {
          singleBattle: 40,
          doubleBattle: 50,
          tripleBattle: 10
        },
        rewards: {
          expMultiplier: 1.5,
          goldMultiplier: 1.5,
          itemDropRate: 0.3
        }
      }
    ]
  },

  // 중급 던전 - 늑대 숲
  wolf_forest: {
    dungeonId: 'wolf_forest',
    name: '늑대 숲',
    description: '늑대들이 지배하는 어두운 숲',
    totalFloors: 4,
    unlockRequirement: {
      level: 10,
      previousDungeon: 'goblin_cave'
    },
    floors: [
      {
        floor: 1,
        name: '숲 외곽',
        description: '울창한 나무들이 빽빽한 숲의 가장자리',
        theme: 'forest',
        difficulty: 3,
        monsterPool: [
          { monsterId: 'wolf_gray', weight: 50, levelRange: [8, 10] },
          { monsterId: 'mushroom_red', weight: 30, levelRange: [7, 9] },
          { monsterId: 'goblin_scout', weight: 20, levelRange: [6, 8] }
        ],
        battleConfigs: {
          singleBattle: 70,
          doubleBattle: 25,
          tripleBattle: 5
        },
        rewards: {
          expMultiplier: 1.3,
          goldMultiplier: 1.3,
          itemDropRate: 0.2
        }
      },
      {
        floor: 2,
        name: '깊은 숲',
        description: '빛이 거의 들지 않는 깊은 숲',
        theme: 'forest',
        difficulty: 4,
        monsterPool: [
          { monsterId: 'wolf_gray', weight: 60, levelRange: [10, 12] },
          { monsterId: 'harpy', weight: 30, levelRange: [11, 13] },
          { monsterId: 'orc_warrior', weight: 10, levelRange: [12, 14] }
        ],
        battleConfigs: {
          singleBattle: 50,
          doubleBattle: 40,
          tripleBattle: 10
        },
        rewards: {
          expMultiplier: 1.5,
          goldMultiplier: 1.5,
          itemDropRate: 0.25
        }
      },
      {
        floor: 3,
        name: '늑대 굴',
        description: '늑대 무리의 본거지',
        theme: 'cave',
        difficulty: 5,
        monsterPool: [
          { monsterId: 'wolf_gray', weight: 70, levelRange: [12, 15] },
          { monsterId: 'orc_warrior', weight: 30, levelRange: [13, 15] }
        ],
        battleConfigs: {
          singleBattle: 30,
          doubleBattle: 50,
          tripleBattle: 20
        },
        rewards: {
          expMultiplier: 1.8,
          goldMultiplier: 1.8,
          itemDropRate: 0.3
        }
      },
      {
        floor: 4,
        name: '알파의 영역',
        description: '늑대 무리의 리더가 있는 곳',
        theme: 'forest',
        difficulty: 6,
        monsterPool: [
          { monsterId: 'wolf_gray', weight: 100, levelRange: [14, 16] }
        ],
        bossMonster: {
          monsterId: 'wolf_gray', // 강화된 버전
          level: 18
        },
        battleConfigs: {
          singleBattle: 20,
          doubleBattle: 60,
          tripleBattle: 20
        },
        rewards: {
          expMultiplier: 2.0,
          goldMultiplier: 2.0,
          itemDropRate: 0.5
        }
      }
    ]
  },

  // 상급 던전 - 언데드 성채
  undead_castle: {
    dungeonId: 'undead_castle',
    name: '언데드 성채',
    description: '죽음이 지배하는 저주받은 성',
    totalFloors: 5,
    unlockRequirement: {
      level: 20,
      previousDungeon: 'wolf_forest'
    },
    floors: [
      {
        floor: 1,
        name: '성문',
        description: '무너져가는 성의 정문',
        theme: 'castle',
        difficulty: 6,
        monsterPool: [
          { monsterId: 'skeleton_warrior', weight: 60, levelRange: [18, 20] },
          { monsterId: 'bat_cave', weight: 40, levelRange: [16, 18] }
        ],
        battleConfigs: {
          singleBattle: 60,
          doubleBattle: 30,
          tripleBattle: 10
        },
        rewards: {
          expMultiplier: 2.0,
          goldMultiplier: 2.0,
          itemDropRate: 0.3
        }
      },
      {
        floor: 2,
        name: '대회랑',
        description: '유령들이 떠도는 넓은 회랑',
        theme: 'castle',
        difficulty: 7,
        monsterPool: [
          { monsterId: 'skeleton_warrior', weight: 50, levelRange: [20, 22] },
          { monsterId: 'dark_mage', weight: 30, levelRange: [21, 23] },
          { monsterId: 'harpy', weight: 20, levelRange: [19, 21] }
        ],
        battleConfigs: {
          singleBattle: 40,
          doubleBattle: 40,
          tripleBattle: 20
        },
        rewards: {
          expMultiplier: 2.3,
          goldMultiplier: 2.3,
          itemDropRate: 0.35
        }
      },
      {
        floor: 3,
        name: '지하 묘지',
        description: '수많은 언데드가 잠들어 있는 곳',
        theme: 'ruins',
        difficulty: 8,
        monsterPool: [
          { monsterId: 'skeleton_warrior', weight: 40, levelRange: [22, 25] },
          { monsterId: 'dark_mage', weight: 40, levelRange: [23, 25] },
          { monsterId: 'mimic', weight: 20, levelRange: [24, 26] }
        ],
        battleConfigs: {
          singleBattle: 20,
          doubleBattle: 50,
          tripleBattle: 30
        },
        rewards: {
          expMultiplier: 2.5,
          goldMultiplier: 2.5,
          itemDropRate: 0.4
        }
      },
      {
        floor: 4,
        name: '마법 연구실',
        description: '어둠의 마법이 연구되던 곳',
        theme: 'castle',
        difficulty: 9,
        monsterPool: [
          { monsterId: 'dark_mage', weight: 70, levelRange: [25, 28] },
          { monsterId: 'fire_elemental', weight: 15, levelRange: [26, 28] },
          { monsterId: 'ice_elemental', weight: 15, levelRange: [26, 28] }
        ],
        battleConfigs: {
          singleBattle: 10,
          doubleBattle: 60,
          tripleBattle: 30
        },
        rewards: {
          expMultiplier: 3.0,
          goldMultiplier: 3.0,
          itemDropRate: 0.5
        }
      },
      {
        floor: 5,
        name: '왕좌의 방',
        description: '리치 킹이 군림하는 곳',
        theme: 'castle',
        difficulty: 10,
        monsterPool: [
          { monsterId: 'skeleton_warrior', weight: 50, levelRange: [28, 30] },
          { monsterId: 'dark_mage', weight: 50, levelRange: [28, 30] }
        ],
        bossMonster: {
          monsterId: 'lich_king',
          level: 35
        },
        battleConfigs: {
          singleBattle: 0,
          doubleBattle: 50,
          tripleBattle: 50
        },
        rewards: {
          expMultiplier: 5.0,
          goldMultiplier: 5.0,
          itemDropRate: 0.8
        }
      }
    ]
  },

  // 최상급 던전 - 용의 둥지
  dragon_lair: {
    dungeonId: 'dragon_lair',
    name: '용의 둥지',
    description: '전설의 용이 잠들어 있는 곳',
    totalFloors: 5,
    unlockRequirement: {
      level: 35,
      previousDungeon: 'undead_castle'
    },
    floors: [
      {
        floor: 1,
        name: '화산 입구',
        description: '뜨거운 열기가 느껴지는 입구',
        theme: 'hell',
        difficulty: 10,
        monsterPool: [
          { monsterId: 'fire_elemental', weight: 60, levelRange: [35, 38] },
          { monsterId: 'orc_warrior', weight: 40, levelRange: [33, 35] }
        ],
        battleConfigs: {
          singleBattle: 50,
          doubleBattle: 30,
          tripleBattle: 20
        },
        rewards: {
          expMultiplier: 4.0,
          goldMultiplier: 4.0,
          itemDropRate: 0.6
        }
      },
      {
        floor: 2,
        name: '용암 호수',
        description: '끓어오르는 용암이 흐르는 곳',
        theme: 'hell',
        difficulty: 11,
        monsterPool: [
          { monsterId: 'fire_elemental', weight: 70, levelRange: [38, 42] },
          { monsterId: 'stone_guardian', weight: 30, levelRange: [40, 42] }
        ],
        battleConfigs: {
          singleBattle: 30,
          doubleBattle: 40,
          tripleBattle: 30
        },
        rewards: {
          expMultiplier: 5.0,
          goldMultiplier: 5.0,
          itemDropRate: 0.7
        }
      },
      {
        floor: 3,
        name: '보물 창고',
        description: '용이 모은 보물들이 가득한 곳',
        theme: 'castle',
        difficulty: 12,
        monsterPool: [
          { monsterId: 'mimic', weight: 80, levelRange: [40, 45] },
          { monsterId: 'stone_guardian', weight: 20, levelRange: [42, 45] }
        ],
        battleConfigs: {
          singleBattle: 20,
          doubleBattle: 40,
          tripleBattle: 40
        },
        rewards: {
          expMultiplier: 6.0,
          goldMultiplier: 8.0,
          itemDropRate: 0.9
        }
      },
      {
        floor: 4,
        name: '고대의 방',
        description: '고대의 수호자들이 지키는 곳',
        theme: 'ruins',
        difficulty: 13,
        monsterPool: [
          { monsterId: 'stone_guardian', weight: 50, levelRange: [45, 48] },
          { monsterId: 'demon_lord', weight: 50, levelRange: [46, 50] }
        ],
        battleConfigs: {
          singleBattle: 0,
          doubleBattle: 50,
          tripleBattle: 50
        },
        rewards: {
          expMultiplier: 8.0,
          goldMultiplier: 10.0,
          itemDropRate: 1.0
        }
      },
      {
        floor: 5,
        name: '용의 심장부',
        description: '붉은 용이 잠들어 있는 곳',
        theme: 'hell',
        difficulty: 15,
        monsterPool: [
          { monsterId: 'fire_elemental', weight: 100, levelRange: [48, 50] }
        ],
        bossMonster: {
          monsterId: 'dragon_red',
          level: 55
        },
        battleConfigs: {
          singleBattle: 0,
          doubleBattle: 0,
          tripleBattle: 100
        },
        rewards: {
          expMultiplier: 10.0,
          goldMultiplier: 15.0,
          itemDropRate: 1.0
        }
      }
    ]
  }
}

// 던전 층 정보 가져오기
export function getDungeonFloorData(dungeonId: string, floor: number): FloorData | undefined {
  const dungeonSystem = DUNGEON_FLOOR_SYSTEMS[dungeonId]
  if (!dungeonSystem) return undefined

  return dungeonSystem.floors.find(f => f.floor === floor)
}

// 층에서 몬스터 생성
export function generateFloorMonsters(
  floorData: FloorData,
  count: number
): { monsterId: string; level: number }[] {
  const monsters: { monsterId: string; level: number }[] = []
  
  // 가중치 총합 계산
  const totalWeight = floorData.monsterPool.reduce((sum, m) => sum + m.weight, 0)

  for (let i = 0; i < count; i++) {
    let randomWeight = Math.random() * totalWeight
    
    for (const monsterConfig of floorData.monsterPool) {
      randomWeight -= monsterConfig.weight
      
      if (randomWeight <= 0) {
        const levelRange = monsterConfig.levelRange
        const level = Math.floor(
          Math.random() * (levelRange[1] - levelRange[0] + 1) + levelRange[0]
        )
        
        monsters.push({
          monsterId: monsterConfig.monsterId,
          level
        })
        break
      }
    }
  }

  return monsters
}

// 전투 타입 결정
export function determineBattleType(floorData: FloorData): 'single' | 'double' | 'triple' {
  const random = Math.random() * 100
  
  if (random < floorData.battleConfigs.singleBattle) {
    return 'single'
  } else if (random < floorData.battleConfigs.singleBattle + floorData.battleConfigs.doubleBattle) {
    return 'double'
  } else {
    return 'triple'
  }
}

// 층별 보스 전투 여부 확인
export function isFloorBossBattle(floorData: FloorData): boolean {
  return !!floorData.bossMonster
}