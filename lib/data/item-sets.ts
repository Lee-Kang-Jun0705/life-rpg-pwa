/**
 * 아이템 세트 데이터
 * 세트 효과 정의
 */

import type { ItemSet } from '@/lib/types/item-system'

export const itemSets: Record<string, ItemSet> = {
  // 전사 세트
  warrior_set: {
    id: 'warrior_set',
    name: '불굴의 전사',
    description: '전장에서 싸우는 전사들을 위한 세트',
    itemIds: ['warrior_set_sword', 'warrior_set_armor', 'warrior_set_ring'],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { attack: 10, defense: 10 },
        description: '공격력 +10, 방어력 +10'
      },
      {
        requiredPieces: 3,
        stats: { attack: 20, defense: 20, hp: 100 },
        specialEffect: {
          id: 'warrior_rage',
          name: '전사의 분노',
          description: '체력이 30% 이하일 때 공격력 50% 증가',
          type: 'conditional',
          trigger: { type: 'onLowHp', threshold: 0.3 },
          effect: { type: 'buff', value: 0.5 }
        },
        description: '추가 공격력 +20, 방어력 +20, HP +100, 전사의 분노 발동'
      }
    ]
  },

  // 마법사 세트
  mage_set: {
    id: 'mage_set',
    name: '지혜의 현자',
    description: '마법의 힘을 극대화하는 세트',
    itemIds: ['mage_set_staff', 'mage_set_robe', 'mage_set_ring'],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { mp: 50, attack: 5 },
        description: 'MP +50, 마법 공격력 +5'
      },
      {
        requiredPieces: 3,
        stats: { mp: 100, attack: 15 },
        specialEffect: {
          id: 'arcane_power',
          name: '비전 마력',
          description: '스킬 사용 시 30% 확률로 MP 소모 없음',
          type: 'passive',
          trigger: { type: 'always' },
          effect: { type: 'buff', value: 0.3 }
        },
        description: '추가 MP +100, 마법 공격력 +15, MP 재생 +5, 비전 마력 발동'
      }
    ]
  },

  // 도적 세트
  rogue_set: {
    id: 'rogue_set',
    name: '그림자 추적자',
    description: '은밀하고 치명적인 공격을 위한 세트',
    itemIds: ['rogue_set_dagger', 'rogue_set_leather', 'rogue_set_cloak'],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { speed: 15 },
        description: '속도 +15, 치명타 확률 +5%'
      },
      {
        requiredPieces: 3,
        stats: { speed: 30 },
        specialEffect: {
          id: 'shadow_strike',
          name: '그림자 일격',
          description: '치명타 시 50% 확률로 추가 공격',
          type: 'conditional',
          trigger: { type: 'onCrit', chance: 50 },
          effect: { type: 'damage', value: { min: 50, max: 100 } }
        },
        description: '추가 속도 +30, 치명타 확률 +10%, 치명타 데미지 +30%, 그림자 일격 발동'
      }
    ]
  },

  // 성기사 세트
  paladin_set: {
    id: 'paladin_set',
    name: '신성한 수호자',
    description: '신성한 힘으로 아군을 보호하는 세트',
    itemIds: ['paladin_set_hammer', 'paladin_set_plate', 'paladin_set_shield', 'paladin_set_symbol'],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { defense: 20, hp: 100 },
        description: '방어력 +20, HP +100'
      },
      {
        requiredPieces: 3,
        stats: { defense: 40, hp: 200 },
        description: '추가 방어력 +40, HP +200, 저항 +10%'
      },
      {
        requiredPieces: 4,
        stats: { defense: 60, hp: 300 },
        specialEffect: {
          id: 'divine_shield',
          name: '신성한 보호막',
          description: '5초마다 최대 HP의 10% 보호막 생성',
          type: 'passive',
          trigger: { type: 'always' },
          effect: { type: 'buff', value: 0.1, duration: 5 }
        },
        description: '추가 방어력 +60, HP +300, 저항 +20%, 신성한 보호막 발동'
      }
    ]
  },

  // 수집가 세트
  collector_set: {
    id: 'collector_set',
    name: '행운의 수집가',
    description: '아이템 획득에 특화된 세트',
    itemIds: ['collector_set_pick', 'collector_set_bag', 'collector_set_charm'],
    bonuses: [
      {
        requiredPieces: 2,
        description: '골드 획득 +20%, 경험치 획득 +10%'
      },
      {
        requiredPieces: 3,
        specialEffect: {
          id: 'treasure_hunter',
          name: '보물 사냥꾼',
          description: '희귀 아이템 드롭률 2배 증가',
          type: 'passive',
          trigger: { type: 'always' },
          effect: { type: 'buff', value: 2 }
        },
        description: '추가 골드 획득 +50%, 경험치 획득 +20%, 행운 +10, 보물 사냥꾼 발동'
      }
    ]
  },

  // 원소술사 세트
  elementalist_set: {
    id: 'elementalist_set',
    name: '원소의 지배자',
    description: '모든 원소를 다루는 자를 위한 세트',
    itemIds: [
      'elementalist_set_staff',
      'elementalist_set_robe',
      'elementalist_set_gloves',
      'elementalist_set_boots',
      'elementalist_set_circlet'
    ],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { attack: 10 },
        description: '원소 공격력 +10'
      },
      {
        requiredPieces: 3,
        stats: { attack: 20, mp: 50 },
        description: '추가 원소 공격력 +20, MP +50'
      },
      {
        requiredPieces: 4,
        stats: { attack: 35, mp: 100, speed: 10 },
        description: '추가 원소 공격력 +35, MP +100, 속도 +10'
      },
      {
        requiredPieces: 5,
        stats: { attack: 50, mp: 150, speed: 20 },
        specialEffect: {
          id: 'elemental_mastery',
          name: '원소 마스터리',
          description: '모든 원소 데미지 50% 증가, 원소 저항 30% 증가',
          type: 'passive',
          trigger: { type: 'always' },
          effect: { type: 'buff', value: 0.5 }
        },
        description: '추가 원소 공격력 +50, MP +150, 속도 +20, 원소 마스터리 발동'
      }
    ]
  },

  // 드래곤 세트 (최종 세트)
  dragon_set: {
    id: 'dragon_set',
    name: '용의 화신',
    description: '용의 힘을 담은 최강의 세트',
    itemIds: [
      'dragon_set_sword',
      'dragon_set_armor',
      'dragon_set_helmet',
      'dragon_set_gloves',
      'dragon_set_boots',
      'dragon_set_wings'
    ],
    bonuses: [
      {
        requiredPieces: 2,
        stats: { attack: 30, defense: 30 },
        description: '공격력 +30, 방어력 +30'
      },
      {
        requiredPieces: 3,
        stats: { attack: 60, defense: 60, hp: 300 },
        description: '추가 공격력 +60, 방어력 +60, HP +300'
      },
      {
        requiredPieces: 4,
        stats: { attack: 100, defense: 100, hp: 500, speed: 30 },
        description: '추가 공격력 +100, 방어력 +100, HP +500, 속도 +30'
      },
      {
        requiredPieces: 5,
        stats: { attack: 150, defense: 150, hp: 800, speed: 50 },
        specialEffect: {
          id: 'dragon_breath',
          name: '용의 숨결',
          description: '공격 시 30% 확률로 범위 화염 공격',
          type: 'conditional',
          trigger: { type: 'onAttack', chance: 30 },
          effect: { type: 'damage', value: { min: 100, max: 200 } }
        },
        description: '추가 공격력 +150, 방어력 +150, HP +800, 속도 +50, 용의 숨결 발동'
      },
      {
        requiredPieces: 6,
        stats: { attack: 200, defense: 200, hp: 1000, speed: 80 },
        specialEffect: {
          id: 'dragon_transformation',
          name: '용의 변신',
          description: '체력 50% 이하 시 용으로 변신, 모든 능력치 2배',
          type: 'conditional',
          trigger: { type: 'onLowHp', threshold: 0.5 },
          effect: { type: 'buff', value: 2 }
        },
        description: '최종 보너스: 공격력 +200, 방어력 +200, HP +1000, 속도 +80, 치명타 확률 +20%, 치명타 데미지 +100%, 용의 변신 발동'
      }
    ]
  }
}
