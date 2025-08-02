/**
 * 소비 아이템 데이터 (40개)
 * 포션, 음식, 버프 아이템 등
 */

import type { Item } from '@/lib/types/item-system'

export const CONSUMABLE_ITEMS: Record<string, Item> = {
  // === 체력 회복 포션 ===
  small_health_potion: {
    id: 'small_health_potion',
    name: '소형 체력 포션',
    description: '체력을 50 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 50 },
    value: 20,
    stackable: true,
    maxStack: 99
  },

  health_potion: {
    id: 'health_potion',
    name: '체력 포션',
    description: '체력을 150 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 150 },
    value: 50,
    stackable: true,
    maxStack: 99
  },

  greater_health_potion: {
    id: 'greater_health_potion',
    name: '상급 체력 포션',
    description: '체력을 300 회복합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 300 },
    value: 120,
    stackable: true,
    maxStack: 99
  },

  super_health_potion: {
    id: 'super_health_potion',
    name: '최상급 체력 포션',
    description: '체력을 600 회복합니다.',
    type: 'consumable',
    rarity: 'rare',
    level: 30,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 600 },
    value: 300,
    stackable: true,
    maxStack: 99
  },

  elixir_of_life: {
    id: 'elixir_of_life',
    name: '생명의 엘릭서',
    description: '체력을 완전히 회복합니다.',
    type: 'consumable',
    rarity: 'epic',
    level: 40,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 9999 },
    value: 1000,
    stackable: true,
    maxStack: 10
  },

  // === 마나 회복 포션 ===
  small_mana_potion: {
    id: 'small_mana_potion',
    name: '소형 마나 포션',
    description: '마나를 30 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'mana', value: 30 },
    value: 25,
    stackable: true,
    maxStack: 99
  },

  mana_potion: {
    id: 'mana_potion',
    name: '마나 포션',
    description: '마나를 80 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'mana', value: 80 },
    value: 60,
    stackable: true,
    maxStack: 99
  },

  greater_mana_potion: {
    id: 'greater_mana_potion',
    name: '상급 마나 포션',
    description: '마나를 150 회복합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'mana', value: 150 },
    value: 150,
    stackable: true,
    maxStack: 99
  },

  // === 상태이상 치료 ===
  antidote: {
    id: 'antidote',
    name: '해독제',
    description: '독 상태를 치료합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 5,
    baseStats: {},
    consumableEffect: { type: 'cure', status: ['poison'] },
    value: 40,
    stackable: true,
    maxStack: 99
  },

  burn_salve: {
    id: 'burn_salve',
    name: '화상 연고',
    description: '화상 상태를 치료합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 5,
    baseStats: {},
    consumableEffect: { type: 'cure', status: ['burn'] },
    value: 40,
    stackable: true,
    maxStack: 99
  },

  paralyze_heal: {
    id: 'paralyze_heal',
    name: '마비 치료제',
    description: '마비 상태를 치료합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 8,
    baseStats: {},
    consumableEffect: { type: 'cure', status: ['paralyze'] },
    value: 60,
    stackable: true,
    maxStack: 99
  },

  panacea: {
    id: 'panacea',
    name: '만병통치약',
    description: '모든 상태이상을 치료합니다.',
    type: 'consumable',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    consumableEffect: { type: 'cure', status: ['all'] },
    value: 500,
    stackable: true,
    maxStack: 20
  },

  // === 버프 포션 ===
  strength_potion: {
    id: 'strength_potion',
    name: '힘의 포션',
    description: '5분간 공격력이 20% 증가합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'buff', stat: 'attack', value: 0.2, duration: 300 },
    value: 100,
    stackable: true,
    maxStack: 20
  },

  defense_potion: {
    id: 'defense_potion',
    name: '방어의 포션',
    description: '5분간 방어력이 20% 증가합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'buff', stat: 'defense', value: 0.2, duration: 300 },
    value: 100,
    stackable: true,
    maxStack: 20
  },

  speed_potion: {
    id: 'speed_potion',
    name: '신속의 포션',
    description: '5분간 이동속도가 30% 증가합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 12,
    baseStats: {},
    consumableEffect: { type: 'buff', stat: 'speed', value: 0.3, duration: 300 },
    value: 120,
    stackable: true,
    maxStack: 20
  },

  berserk_potion: {
    id: 'berserk_potion',
    name: '광폭화 포션',
    description: '3분간 공격력 50% 증가, 방어력 25% 감소',
    type: 'consumable',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    consumableEffect: {
      type: 'buff',
      effects: [
        { stat: 'attack', value: 0.5, duration: 180 },
        { stat: 'defense', value: -0.25, duration: 180 }
      ]
    },
    value: 400,
    stackable: true,
    maxStack: 10
  },

  invisibility_potion: {
    id: 'invisibility_potion',
    name: '투명 포션',
    description: '30초간 투명 상태가 됩니다.',
    type: 'consumable',
    rarity: 'rare',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'buff', stat: 'stealth', value: 1, duration: 30 },
    value: 350,
    stackable: true,
    maxStack: 10
  },

  // === 음식류 ===
  bread: {
    id: 'bread',
    name: '빵',
    description: '기본적인 음식. 체력을 30 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 30 },
    value: 10,
    stackable: true,
    maxStack: 99
  },

  meat: {
    id: 'meat',
    name: '고기',
    description: '구운 고기. 체력을 80 회복합니다.',
    type: 'consumable',
    rarity: 'common',
    level: 5,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 80 },
    value: 30,
    stackable: true,
    maxStack: 99
  },

  feast: {
    id: 'feast',
    name: '축제 음식',
    description: '풍성한 음식. 체력 200 회복, 5분간 모든 스탯 +5',
    type: 'consumable',
    rarity: 'uncommon',
    level: 15,
    baseStats: {},
    consumableEffect: {
      type: 'combo',
      effects: [
        { type: 'heal', value: 200 },
        { type: 'buff', stat: 'allStats', value: 5, duration: 300 }
      ]
    },
    value: 200,
    stackable: true,
    maxStack: 20
  },

  dragon_meat: {
    id: 'dragon_meat',
    name: '용의 고기',
    description: '전설의 용 고기. 체력 500 회복, 10분간 모든 저항 +20%',
    type: 'consumable',
    rarity: 'epic',
    level: 40,
    baseStats: {},
    consumableEffect: {
      type: 'combo',
      effects: [
        { type: 'heal', value: 500 },
        { type: 'buff', stat: 'allResistance', value: 0.2, duration: 600 }
      ]
    },
    value: 1500,
    stackable: true,
    maxStack: 10
  },

  // === 특수 소비 아이템 ===
  teleport_scroll: {
    id: 'teleport_scroll',
    name: '순간이동 주문서',
    description: '마을로 즉시 귀환합니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'teleport', destination: 'town' },
    value: 200,
    stackable: true,
    maxStack: 20
  },

  resurrection_scroll: {
    id: 'resurrection_scroll',
    name: '부활 주문서',
    description: '사망 시 자동으로 부활합니다.',
    type: 'consumable',
    rarity: 'rare',
    level: 30,
    baseStats: {},
    consumableEffect: { type: 'resurrection', hpRestore: 0.5 },
    value: 1000,
    stackable: true,
    maxStack: 5
  },

  experience_potion: {
    id: 'experience_potion',
    name: '경험의 포션',
    description: '사용 시 경험치를 100 획득합니다.',
    type: 'consumable',
    rarity: 'rare',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'experience', value: 100 },
    value: 800,
    stackable: true,
    maxStack: 10
  },

  lucky_dice: {
    id: 'lucky_dice',
    name: '행운의 주사위',
    description: '10분간 아이템 드롭률 50% 증가',
    type: 'consumable',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    consumableEffect: { type: 'buff', stat: 'dropRate', value: 0.5, duration: 600 },
    value: 600,
    stackable: true,
    maxStack: 10
  },

  skill_reset_potion: {
    id: 'skill_reset_potion',
    name: '스킬 초기화 포션',
    description: '모든 스킬 포인트를 초기화합니다.',
    type: 'consumable',
    rarity: 'epic',
    level: 30,
    baseStats: {},
    consumableEffect: { type: 'skillReset' },
    value: 2000,
    stackable: true,
    maxStack: 1
  },

  // === 폭탄/투척 아이템 ===
  fire_bomb: {
    id: 'fire_bomb',
    name: '화염 폭탄',
    description: '폭발하여 범위 화염 데미지를 입힙니다.',
    type: 'consumable',
    rarity: 'common',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'damage', element: 'fire', value: 150, aoe: true },
    value: 80,
    stackable: true,
    maxStack: 50
  },

  ice_bomb: {
    id: 'ice_bomb',
    name: '얼음 폭탄',
    description: '폭발하여 적을 얼립니다.',
    type: 'consumable',
    rarity: 'common',
    level: 12,
    baseStats: {},
    consumableEffect: { type: 'damage', element: 'ice', value: 100, freeze: 0.5 },
    value: 90,
    stackable: true,
    maxStack: 50
  },

  smoke_bomb: {
    id: 'smoke_bomb',
    name: '연막탄',
    description: '연막을 생성하여 적의 시야를 가립니다.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 15,
    baseStats: {},
    consumableEffect: { type: 'blind', duration: 10, aoe: true },
    value: 150,
    stackable: true,
    maxStack: 30
  },

  // === 특별 이벤트 아이템 ===
  birthday_cake: {
    id: 'birthday_cake',
    name: '생일 케이크',
    description: '특별한 날을 위한 케이크. 체력 완전 회복, 1시간 경험치 2배',
    type: 'consumable',
    rarity: 'epic',
    level: 1,
    baseStats: {},
    consumableEffect: {
      type: 'combo',
      effects: [
        { type: 'heal', value: 9999 },
        { type: 'buff', stat: 'expGain', value: 1.0, duration: 3600 }
      ]
    },
    value: 5000,
    stackable: true,
    maxStack: 1
  },

  golden_apple: {
    id: 'golden_apple',
    name: '황금 사과',
    description: '신화 속 황금 사과. 최대 체력이 영구적으로 50 증가',
    type: 'consumable',
    rarity: 'legendary',
    level: 50,
    baseStats: {},
    consumableEffect: { type: 'permanent', stat: 'maxHp', value: 50 },
    value: 10000,
    stackable: true,
    maxStack: 1
  },

  // === 낚시/요리 재료 ===
  raw_fish: {
    id: 'raw_fish',
    name: '생선',
    description: '신선한 생선. 요리 재료로 사용됩니다.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 20 },
    value: 15,
    stackable: true,
    maxStack: 99
  },

  herb: {
    id: 'herb',
    name: '약초',
    description: '포션 제작에 사용되는 약초.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'heal', value: 10 },
    value: 8,
    stackable: true,
    maxStack: 99
  },

  mushroom: {
    id: 'mushroom',
    name: '버섯',
    description: '숲에서 자란 버섯. 요리나 포션 재료.',
    type: 'consumable',
    rarity: 'common',
    level: 3,
    baseStats: {},
    consumableEffect: { type: 'mana', value: 20 },
    value: 12,
    stackable: true,
    maxStack: 99
  },

  // === 퀘스트 아이템 ===
  dungeon_key: {
    id: 'dungeon_key',
    name: '던전 열쇠',
    description: '특정 던전의 문을 열 수 있는 열쇠.',
    type: 'consumable',
    rarity: 'rare',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'key', unlocks: 'special_dungeon' },
    value: 1000,
    stackable: false
  },

  boss_summon_scroll: {
    id: 'boss_summon_scroll',
    name: '보스 소환 주문서',
    description: '강력한 보스를 소환합니다.',
    type: 'consumable',
    rarity: 'epic',
    level: 40,
    baseStats: {},
    consumableEffect: { type: 'summon', boss: 'world_boss' },
    value: 5000,
    stackable: true,
    maxStack: 1
  },

  treasure_map: {
    id: 'treasure_map',
    name: '보물 지도',
    description: '숨겨진 보물의 위치가 표시된 지도.',
    type: 'consumable',
    rarity: 'rare',
    level: 15,
    baseStats: {},
    consumableEffect: { type: 'quest', reveals: 'hidden_treasure' },
    value: 2000,
    stackable: false
  },

  mysterious_fragment: {
    id: 'mysterious_fragment',
    name: '신비한 조각',
    description: '무언가의 일부인 듯한 조각. 5개를 모으면...',
    type: 'consumable',
    rarity: 'epic',
    level: 35,
    baseStats: {},
    consumableEffect: { type: 'collect', required: 5, reward: 'legendary_item' },
    value: 3000,
    stackable: true,
    maxStack: 5
  },

  // 스킬북
  skill_book_basic_attack: {
    id: 'skill_book_basic_attack',
    name: '스킬북: 기본 공격',
    description: '기본 공격 스킬을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'basic_attack' },
    value: 100,
    stackable: true,
    maxStack: 1
  },
  skill_book_power_strike: {
    id: 'skill_book_power_strike',
    name: '스킬북: 파워 스트라이크',
    description: '강력한 일격을 날리는 스킬을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'power_strike' },
    value: 500,
    stackable: true,
    maxStack: 1
  },
  skill_book_healing: {
    id: 'skill_book_healing',
    name: '스킬북: 치유',
    description: '체력을 회복하는 스킬을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 5,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'healing' },
    value: 400,
    stackable: true,
    maxStack: 1
  },
  skill_book_fireball: {
    id: 'skill_book_fireball',
    name: '스킬북: 파이어볼',
    description: '화염구를 발사하는 마법을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'rare',
    level: 15,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'fireball' },
    value: 1000,
    stackable: true,
    maxStack: 1
  },
  skill_book_lightning_bolt: {
    id: 'skill_book_lightning_bolt',
    name: '스킬북: 라이트닝 볼트',
    description: '번개를 떨어뜨리는 마법을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'rare',
    level: 20,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'lightning_bolt' },
    value: 1500,
    stackable: true,
    maxStack: 1
  },
  skill_book_shield_barrier: {
    id: 'skill_book_shield_barrier',
    name: '스킬북: 실드 배리어',
    description: '방어막을 생성하는 스킬을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'rare',
    level: 25,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'shield_barrier' },
    value: 1200,
    stackable: true,
    maxStack: 1
  },
  skill_book_berserk: {
    id: 'skill_book_berserk',
    name: '스킬북: 광전사',
    description: '공격력을 크게 증가시키는 스킬을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'epic',
    level: 30,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'berserk' },
    value: 3000,
    stackable: true,
    maxStack: 1
  },
  skill_book_meteor_strike: {
    id: 'skill_book_meteor_strike',
    name: '스킬북: 메테오 스트라이크',
    description: '거대한 운석을 떨어뜨리는 궁극 마법을 배울 수 있는 스킬북.',
    type: 'consumable',
    rarity: 'legendary',
    level: 50,
    baseStats: {},
    consumableEffect: { type: 'skill_book', skillId: 'meteor_strike' },
    value: 10000,
    stackable: true,
    maxStack: 1
  }
}
