/**
 * 특별 퀘스트 전용 몬스터 데이터
 * 더 강력하고 특별한 능력을 가진 몬스터들
 */

import type { Monster } from '@/lib/types/monster'

// 이벤트 퀘스트 몬스터
export const EVENT_QUEST_MONSTERS: Record<string, Monster[]> = {
  'event_lunar_festival_2024': [
    {
      id: 'lunar_spirit',
      name: '달빛 정령',
      level: 15,
      stats: {
        hp: 1500,
        attack: 80,
        defense: 60,
        speed: 90,
        critRate: 0.2,
        critDamage: 1.8
      },
      skills: ['lunar_blast', 'moonlight_heal'],
      loot: {
        gold: { min: 200, max: 300 },
        dropRate: 1,
        items: []
      },
      description: '달빛 축제에만 나타나는 신비한 정령'
    },
    {
      id: 'corrupted_moon_rabbit',
      name: '타락한 달토끼',
      level: 18,
      stats: {
        hp: 2000,
        attack: 100,
        defense: 70,
        speed: 110,
        critRate: 0.25,
        critDamage: 2.0
      },
      skills: ['dark_moon_strike', 'shadow_hop'],
      loot: {
        gold: { min: 300, max: 400 },
        dropRate: 1,
        items: ['moon_essence']
      },
      description: '어둠에 물든 달토끼'
    },
    {
      id: 'lunar_festival_boss',
      name: '달의 여신 셀레네',
      level: 25,
      stats: {
        hp: 5000,
        attack: 150,
        defense: 100,
        speed: 85,
        critRate: 0.3,
        critDamage: 2.5
      },
      skills: ['lunar_eclipse', 'star_shower', 'moon_phase_change'],
      loot: {
        gold: { min: 1000, max: 1500 },
        dropRate: 1,
        items: ['lunar_crown_fragment', 'goddess_blessing']
      },
      isBoss: true,
      description: '달빛 축제의 수호자'
    }
  ]
}

// 히든 퀘스트 몬스터
export const HIDDEN_QUEST_MONSTERS: Record<string, Monster[]> = {
  'hidden_dragon_lair': [
    {
      id: 'drake_guard',
      name: '드레이크 근위병',
      level: 30,
      stats: {
        hp: 3000,
        attack: 180,
        defense: 120,
        speed: 70,
        critRate: 0.15,
        critDamage: 2.0
      },
      skills: ['fire_breath', 'tail_sweep', 'dragon_roar'],
      loot: {
        gold: { min: 500, max: 700 },
        dropRate: 1,
        items: ['drake_scale']
      },
      description: '용의 둥지를 지키는 하급 용족'
    },
    {
      id: 'wyvern_sentinel',
      name: '와이번 파수꾼',
      level: 35,
      stats: {
        hp: 4000,
        attack: 220,
        defense: 100,
        speed: 120,
        critRate: 0.25,
        critDamage: 2.2
      },
      skills: ['aerial_strike', 'poison_sting', 'wind_blast'],
      loot: {
        gold: { min: 700, max: 900 },
        dropRate: 1,
        items: ['wyvern_wing', 'poison_gland']
      },
      description: '하늘을 나는 용의 친척'
    },
    {
      id: 'ancient_dragon_boss',
      name: '고대룡 아우렐리우스',
      level: 50,
      stats: {
        hp: 15000,
        attack: 350,
        defense: 200,
        speed: 60,
        critRate: 0.2,
        critDamage: 3.0
      },
      skills: ['dragon_breath_ultimate', 'ancient_magic', 'dragon_barrier', 'meteor_storm'],
      loot: {
        gold: { min: 5000, max: 7000 },
        dropRate: 1,
        items: ['ancient_dragon_heart', 'dragon_king_scale']
      },
      isBoss: true,
      phases: [
        { hpThreshold: 0.7, newSkills: ['rage_mode'] },
        { hpThreshold: 0.3, newSkills: ['desperation_attack', 'final_roar'] }
      ],
      description: '전설 속 고대의 용'
    }
  ]
}

// 도전 퀘스트 몬스터
export const CHALLENGE_QUEST_MONSTERS: Record<string, Monster[]> = {
  'challenge_no_damage': [
    {
      id: 'glass_cannon_warrior',
      name: '유리대포 전사',
      level: 25,
      stats: {
        hp: 1000, // 낮은 HP
        attack: 300, // 매우 높은 공격력
        defense: 50,
        speed: 100,
        critRate: 0.5, // 높은 치명타
        critDamage: 3.0
      },
      skills: ['one_shot_strike', 'berserk_rush'],
      loot: {
        gold: { min: 400, max: 600 },
        dropRate: 1,
        items: []
      },
      description: '한 방에 모든 것을 거는 전사'
    },
    {
      id: 'speed_demon',
      name: '스피드 데몬',
      level: 28,
      stats: {
        hp: 1500,
        attack: 150,
        defense: 80,
        speed: 200, // 매우 빠른 속도
        critRate: 0.4,
        critDamage: 2.5
      },
      skills: ['lightning_strike', 'afterimage', 'speed_burst'],
      loot: {
        gold: { min: 500, max: 700 },
        dropRate: 1,
        items: ['speed_essence']
      },
      description: '번개처럼 빠른 악마'
    }
  ]
}

// 컬렉션 퀘스트 몬스터
export const COLLECTION_QUEST_MONSTERS: Record<string, Monster[]> = {
  'collection_ancient_artifacts': [
    {
      id: 'artifact_guardian',
      name: '유물 수호자',
      level: 20,
      stats: {
        hp: 2500,
        attack: 120,
        defense: 150, // 높은 방어력
        speed: 60,
        critRate: 0.1,
        critDamage: 1.5
      },
      skills: ['stone_barrier', 'ancient_curse'],
      loot: {
        gold: { min: 300, max: 500 },
        dropRate: 1,
        items: ['ancient_artifact_piece']
      },
      description: '고대 유물을 지키는 석상'
    },
    {
      id: 'treasure_hunter_rival',
      name: '라이벌 보물 사냥꾼',
      level: 22,
      stats: {
        hp: 2000,
        attack: 140,
        defense: 90,
        speed: 110,
        critRate: 0.3,
        critDamage: 2.0
      },
      skills: ['steal', 'smoke_bomb', 'sneak_attack'],
      loot: {
        gold: { min: 200, max: 400 },
        dropRate: 1,
        items: ['stolen_map', 'ancient_artifact_piece']
      },
      description: '같은 보물을 노리는 경쟁자'
    }
  ]
}

// 특별 퀘스트 몬스터 스킬 정의
export const SPECIAL_QUEST_MONSTER_SKILLS = {
  // 달빛 축제 스킬
  lunar_blast: {
    name: '달빛 폭발',
    damage: 1.8,
    description: '달의 힘을 모아 폭발시킨다',
    effects: ['blind']
  },
  moonlight_heal: {
    name: '달빛 치유',
    heal: 0.3,
    description: '달빛으로 체력을 회복한다'
  },
  dark_moon_strike: {
    name: '암흑 달 타격',
    damage: 2.2,
    description: '어둠에 물든 달의 힘으로 공격'
  },
  shadow_hop: {
    name: '그림자 도약',
    description: '그림자 속으로 사라져 회피율 증가',
    effects: ['evasion_up']
  },
  lunar_eclipse: {
    name: '월식',
    damage: 3.0,
    description: '전체 공격 + 어둠 상태이상',
    aoe: true,
    effects: ['darkness']
  },
  star_shower: {
    name: '유성우',
    damage: 2.5,
    description: '하늘에서 별이 쏟아진다',
    aoe: true,
    hits: 5
  },
  moon_phase_change: {
    name: '달의 위상 변화',
    description: '달의 위상을 바꿔 능력치 변화',
    effects: ['stat_change']
  },
  
  // 드래곤 스킬
  fire_breath: {
    name: '화염 브레스',
    damage: 2.0,
    description: '강력한 화염을 내뿜는다',
    effects: ['burn']
  },
  tail_sweep: {
    name: '꼬리 휩쓸기',
    damage: 1.5,
    description: '꼬리로 적을 쓸어버린다',
    aoe: true
  },
  dragon_roar: {
    name: '용의 포효',
    description: '적을 공포에 떨게 한다',
    effects: ['fear', 'attack_down']
  },
  aerial_strike: {
    name: '공중 강습',
    damage: 2.5,
    description: '하늘에서 급강하 공격'
  },
  poison_sting: {
    name: '독침',
    damage: 1.2,
    description: '독이 묻은 꼬리로 찌른다',
    effects: ['poison']
  },
  wind_blast: {
    name: '바람 폭발',
    damage: 1.8,
    description: '강력한 바람으로 공격',
    pushback: true
  },
  dragon_breath_ultimate: {
    name: '궁극의 용의 숨결',
    damage: 5.0,
    description: '모든 것을 태우는 최강의 브레스',
    aoe: true,
    effects: ['burn', 'defense_down']
  },
  ancient_magic: {
    name: '고대 마법',
    damage: 3.5,
    description: '잊혀진 고대의 마법',
    random_effect: true
  },
  dragon_barrier: {
    name: '용의 방벽',
    description: '일정 피해를 흡수하는 방벽 생성',
    shield: 0.3
  },
  meteor_storm: {
    name: '메테오 스톰',
    damage: 4.0,
    description: '하늘에서 운석이 떨어진다',
    aoe: true,
    hits: 3
  },
  
  // 도전 퀘스트 스킬
  one_shot_strike: {
    name: '일격필살',
    damage: 10.0, // 매우 높은 데미지
    description: '모든 힘을 담은 일격',
    accuracy: 0.5 // 낮은 명중률
  },
  berserk_rush: {
    name: '광폭 돌진',
    damage: 3.0,
    description: '미친 듯이 돌진한다',
    self_damage: 0.1 // 자해 피해
  },
  lightning_strike: {
    name: '번개 타격',
    damage: 2.0,
    description: '번개처럼 빠른 공격',
    priority: true // 선제공격
  },
  afterimage: {
    name: '잔상',
    description: '빠른 움직임으로 잔상을 남긴다',
    effects: ['evasion_up', 'speed_up']
  },
  speed_burst: {
    name: '스피드 버스트',
    description: '극한의 속도로 움직인다',
    extra_actions: 2 // 추가 행동
  },
  
  // 수호자 스킬
  stone_barrier: {
    name: '석화 방벽',
    description: '돌로 변해 방어력 대폭 상승',
    defense_multiplier: 3.0
  },
  ancient_curse: {
    name: '고대의 저주',
    damage: 1.5,
    description: '고대의 저주를 건다',
    effects: ['curse', 'speed_down']
  },
  steal: {
    name: '훔치기',
    description: '아이템을 훔친다',
    steal_chance: 0.3
  },
  smoke_bomb: {
    name: '연막탄',
    description: '연막을 터뜨려 시야를 가린다',
    effects: ['blind_all']
  },
  sneak_attack: {
    name: '기습',
    damage: 3.0,
    description: '숨어서 기습 공격',
    critical_bonus: 0.5
  }
}

// 특별 퀘스트별 몬스터 가져오기
export function getSpecialQuestMonsters(questId: string): Monster[] {
  return EVENT_QUEST_MONSTERS[questId] || 
         HIDDEN_QUEST_MONSTERS[questId] || 
         CHALLENGE_QUEST_MONSTERS[questId] || 
         COLLECTION_QUEST_MONSTERS[questId] || 
         []
}