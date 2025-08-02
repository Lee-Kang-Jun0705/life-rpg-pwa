// 몬스터 도감 데이터
import type { CollectionCategory, CollectionReward, MonsterLore, CollectionAchievement } from '@/lib/types/collection'

// 도감 카테고리
export const COLLECTION_CATEGORIES: CollectionCategory[] = [
  {
    id: 'slimes',
    name: '슬라임 계열',
    description: '다양한 속성의 슬라임 몬스터들',
    monsterIds: ['slime', 'red-slime', 'blue-slime', 'green-slime', 'golden-slime', 'king-slime'],
    rewards: [
      {
        id: 'slime-hunter-1',
        name: '슬라임 사냥꾼',
        description: '슬라임 3종 발견',
        requiredCount: 3,
        rewards: {
          exp: 100,
          gold: 500,
          title: '슬라임 연구가'
        },
        isClaimed: false
      },
      {
        id: 'slime-hunter-2',
        name: '슬라임 마스터',
        description: '모든 슬라임 처치',
        requiredCount: 6,
        rewards: {
          exp: 500,
          gold: 2000,
          items: ['slime-essence'],
          stat: { type: 'defense', value: 5 }
        },
        isClaimed: false
      }
    ]
  },
  {
    id: 'goblins',
    name: '고블린 부족',
    description: '교활한 고블린과 그 동족들',
    monsterIds: ['goblin', 'goblin-archer', 'goblin-warrior', 'goblin-shaman', 'hobgoblin', 'goblin-chief'],
    rewards: [
      {
        id: 'goblin-slayer-1',
        name: '고블린 추적자',
        description: '고블린 3종 발견',
        requiredCount: 3,
        rewards: {
          exp: 150,
          gold: 750,
          title: '고블린 사냥꾼'
        },
        isClaimed: false
      },
      {
        id: 'goblin-slayer-2',
        name: '고블린 슬레이어',
        description: '모든 고블린 처치',
        requiredCount: 6,
        rewards: {
          exp: 750,
          gold: 3000,
          items: ['goblin-earring'],
          stat: { type: 'attack', value: 5 }
        },
        isClaimed: false
      }
    ]
  },
  {
    id: 'undead',
    name: '언데드 군단',
    description: '죽음에서 돌아온 자들',
    monsterIds: ['skeleton', 'skeleton-archer', 'skeleton-knight', 'zombie', 'ghost', 'lich'],
    rewards: [
      {
        id: 'undead-hunter-1',
        name: '언데드 퇴치사',
        description: '언데드 4종 발견',
        requiredCount: 4,
        rewards: {
          exp: 300,
          gold: 1500,
          title: '성직자'
        },
        isClaimed: false
      },
      {
        id: 'undead-hunter-2',
        name: '죽음의 정복자',
        description: '모든 언데드 처치',
        requiredCount: 6,
        rewards: {
          exp: 1000,
          gold: 5000,
          items: ['holy-water', 'death-essence'],
          stat: { type: 'hp', value: 100 }
        },
        isClaimed: false
      }
    ]
  },
  {
    id: 'dragons',
    name: '용족',
    description: '강력한 용과 그 권속들',
    monsterIds: ['drake', 'wyvern', 'fire-dragon', 'ice-dragon', 'dark-dragon', 'ancient-dragon'],
    rewards: [
      {
        id: 'dragon-slayer-1',
        name: '용 사냥 견습생',
        description: '용족 2종 발견',
        requiredCount: 2,
        rewards: {
          exp: 500,
          gold: 2500,
          title: '용기있는 자'
        },
        isClaimed: false
      },
      {
        id: 'dragon-slayer-2',
        name: '드래곤 슬레이어',
        description: '모든 용족 처치',
        requiredCount: 6,
        rewards: {
          exp: 2000,
          gold: 10000,
          items: ['dragon-scale', 'dragon-heart'],
          stat: { type: 'attack', value: 10 }
        },
        isClaimed: false
      }
    ]
  },
  {
    id: 'elementals',
    name: '정령',
    description: '원소의 힘을 다루는 정령들',
    monsterIds: ['fire-spirit', 'water-spirit', 'earth-spirit', 'wind-spirit', 'light-elemental', 'dark-elemental'],
    rewards: [
      {
        id: 'elemental-master-1',
        name: '정령술사',
        description: '4대 정령 발견',
        requiredCount: 4,
        rewards: {
          exp: 400,
          gold: 2000,
          title: '정령의 친구'
        },
        isClaimed: false
      },
      {
        id: 'elemental-master-2',
        name: '원소의 지배자',
        description: '모든 정령 처치',
        requiredCount: 6,
        rewards: {
          exp: 1500,
          gold: 7500,
          items: ['elemental-orb'],
          stat: { type: 'speed', value: 10 }
        },
        isClaimed: false
      }
    ]
  },
  {
    id: 'bosses',
    name: '보스 몬스터',
    description: '각 지역을 지배하는 강력한 보스들',
    monsterIds: ['forest-guardian', 'cave-troll', 'sea-serpent', 'demon-lord', 'ancient-dragon', 'lich-king'],
    rewards: [
      {
        id: 'boss-hunter-1',
        name: '보스 헌터',
        description: '보스 3체 처치',
        requiredCount: 3,
        rewards: {
          exp: 1000,
          gold: 5000,
          title: '영웅'
        },
        isClaimed: false
      },
      {
        id: 'boss-hunter-2',
        name: '전설의 용사',
        description: '모든 보스 처치',
        requiredCount: 6,
        rewards: {
          exp: 5000,
          gold: 20000,
          items: ['legendary-essence', 'hero-medal'],
          stat: { type: 'attack', value: 20 }
        },
        isClaimed: false
      }
    ]
  }
]

// 몬스터 설명 (lore)
export const MONSTER_LORE: Record<string, MonsterLore> = {
  'slime': {
    monsterId: 'slime',
    description: '가장 기본적인 몬스터로, 젤리같은 몸체를 가지고 있다.',
    habitat: '습한 동굴, 숲의 그늘진 곳',
    behavior: '느리게 움직이며 접촉한 것을 녹이려 한다',
    weakness: '불 속성 공격에 약하다',
    trivia: [
      '슬라임의 핵을 제거하면 즉사한다',
      '분열하여 번식하는 것으로 알려져 있다'
    ]
  },
  'goblin': {
    monsterId: 'goblin',
    description: '작고 교활한 인간형 몬스터. 무리를 지어 다닌다.',
    habitat: '동굴, 폐허가 된 마을',
    behavior: '약한 상대를 노리고 함정을 사용한다',
    weakness: '지능이 낮아 복잡한 전략에 취약하다',
    trivia: [
      '인간의 도구를 훔쳐 사용한다',
      '고블린 샤먼이 무리를 이끈다'
    ]
  },
  'skeleton': {
    monsterId: 'skeleton',
    description: '죽은 자의 뼈가 되살아난 언데드 몬스터.',
    habitat: '묘지, 던전',
    behavior: '생전의 전투 기술을 일부 보유하고 있다',
    weakness: '성스러운 공격과 둔기 공격에 약하다',
    trivia: [
      '네크로맨서에 의해 조종되는 경우가 많다',
      '머리를 파괴해도 잠시 동안 움직일 수 있다'
    ]
  },
  'wolf': {
    monsterId: 'wolf',
    description: '숲에 서식하는 육식 동물. 무리를 지어 사냥한다.',
    habitat: '깊은 숲, 산악 지대',
    behavior: '무리 사냥을 하며 리더의 지휘를 받는다',
    weakness: '불을 무서워한다',
    trivia: [
      '달이 뜨면 더욱 흉포해진다',
      '알파 늑대가 무리를 이끈다'
    ]
  },
  'orc': {
    monsterId: 'orc',
    description: '강인한 체력을 가진 전투종족.',
    habitat: '황무지, 요새',
    behavior: '명예로운 전투를 추구하며 강한 상대를 존경한다',
    weakness: '마법 공격에 상대적으로 약하다',
    trivia: [
      '독자적인 문화와 언어를 가지고 있다',
      '전사 계급 사회를 이루고 있다'
    ]
  }
}

// 도감 업적
export const COLLECTION_ACHIEVEMENTS: CollectionAchievement[] = [
  {
    id: 'first-blood',
    name: '첫 번째 사냥',
    description: '첫 몬스터 처치',
    icon: '🗡️',
    condition: { type: 'defeat', count: 1 },
    rewards: { exp: 50, title: '초보 사냥꾼' },
    isUnlocked: false
  },
  {
    id: 'monster-scholar',
    name: '몬스터 학자',
    description: '20종의 몬스터 발견',
    icon: '📚',
    condition: { type: 'discover', count: 20 },
    rewards: { exp: 500, gold: 2000, title: '몬스터 박사' },
    isUnlocked: false
  },
  {
    id: 'genocide',
    name: '학살자',
    description: '총 1000마리 처치',
    icon: '💀',
    condition: { type: 'kill_count', count: 1000 },
    rewards: { exp: 1000, gold: 5000, title: '죽음의 화신' },
    isUnlocked: false
  },
  {
    id: 'completionist',
    name: '완벽주의자',
    description: '한 카테고리의 모든 몬스터 처치',
    icon: '🏆',
    condition: { type: 'category_complete', count: 1 },
    rewards: { exp: 2000, gold: 10000, title: '마스터 헌터' },
    isUnlocked: false
  },
  {
    id: 'rare-hunter',
    name: '희귀종 사냥꾼',
    description: '희귀 몬스터 5종 처치',
    icon: '✨',
    condition: { type: 'defeat', count: 5 },
    rewards: { exp: 1500, gold: 7500, title: '전설의 추적자' },
    isUnlocked: false
  },
  {
    id: 'boss-slayer',
    name: '보스 슬레이어',
    description: '모든 보스 몬스터 처치',
    icon: '👑',
    condition: { type: 'category_complete', target: 'bosses' },
    rewards: { exp: 5000, gold: 20000, title: '왕을 쓰러뜨린 자' },
    isUnlocked: false
  }
]

// 도감 완성 보상
export const COLLECTION_MILESTONES = [
  { percentage: 10, rewards: { gold: 1000, items: ['collection-badge-bronze'] } },
  { percentage: 25, rewards: { gold: 2500, exp: 500, items: ['collection-badge-silver'] } },
  { percentage: 50, rewards: { gold: 5000, exp: 1000, items: ['collection-badge-gold'] } },
  { percentage: 75, rewards: { gold: 10000, exp: 2000, items: ['collection-badge-platinum'] } },
  { percentage: 100, rewards: { gold: 25000, exp: 5000, items: ['collection-badge-diamond'], title: '몬스터 마스터' } }
]
