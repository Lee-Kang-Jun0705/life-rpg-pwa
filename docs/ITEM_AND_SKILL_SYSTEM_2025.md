# Life RPG PWA - 아이템 및 스킬 시스템 문서 (2025-08-02)

## 📋 목차
1. [장비 영구 저장 시스템](#1-장비-영구-저장-시스템)
2. [스킬 덱 영구 저장 시스템](#2-스킬-덱-영구-저장-시스템)
3. [6단계 아이템 등급 시스템](#3-6단계-아이템-등급-시스템)
4. [보스 고유 드롭 시스템](#4-보스-고유-드롭-시스템)
5. [패시브 스킬 시스템](#5-패시브-스킬-시스템)
6. [코드 복원 가이드](#6-코드-복원-가이드)

---

## 1. 장비 영구 저장 시스템

### 📁 수정된 파일
- `/lib/services/inventory.service.ts`

### 🔧 주요 변경사항

#### LocalStorage 키 추가
```typescript
private readonly STORAGE_KEY_EQUIPMENT = 'life-rpg-equipment'
private readonly STORAGE_KEY_INVENTORY = 'life-rpg-inventory'
```

#### 초기화 메서드 개선
```typescript
async initialize(): Promise<void> {
  if (this.initialized) {
    return
  }

  try {
    // 장비 상태 복원
    const savedEquipment = localStorage.getItem(this.STORAGE_KEY_EQUIPMENT)
    if (savedEquipment) {
      const equipment = JSON.parse(savedEquipment)
      this.equipment = equipment
      console.log('[InventoryService] 장비 상태 복원 완료:', Object.keys(equipment).filter(k => equipment[k]).length, '개 장착됨')
    }

    // 인벤토리 상태 복원
    const savedInventory = localStorage.getItem(this.STORAGE_KEY_INVENTORY)
    if (savedInventory) {
      const inventoryData = JSON.parse(savedInventory)
      this.inventory.clear()
      
      // Map으로 변환
      inventoryData.forEach((item: any) => {
        this.inventory.set(item.uniqueId, {
          ...item,
          item: item.item // GeneratedItem 객체 복원
        })
      })
      console.log('[InventoryService] 인벤토리 복원 완료:', inventoryData.length, '개 아이템')
    }

    this.initialized = true
    
    // 장비 변경 이벤트 발생
    this.notifyEquipmentChange()
  } catch (error) {
    console.error('[InventoryService] 초기화 실패:', error)
    this.initialized = true
  }
}
```

#### 저장 메서드
```typescript
// 장비 상태 저장
private saveEquipmentState(): void {
  try {
    localStorage.setItem(this.STORAGE_KEY_EQUIPMENT, JSON.stringify(this.equipment))
    console.log('[InventoryService] 장비 상태 저장 완료')
  } catch (error) {
    console.error('[InventoryService] 장비 상태 저장 실패:', error)
  }
}

// 인벤토리 상태 저장
private saveInventoryState(): void {
  try {
    const inventoryArray = Array.from(this.inventory.entries()).map(([uniqueId, item]) => ({
      uniqueId,
      ...item
    }))
    localStorage.setItem(this.STORAGE_KEY_INVENTORY, JSON.stringify(inventoryArray))
    console.log('[InventoryService] 인벤토리 저장 완료:', inventoryArray.length, '개 아이템')
  } catch (error) {
    console.error('[InventoryService] 인벤토리 저장 실패:', error)
  }
}
```

### 🎯 작동 방식
1. 서비스 초기화 시 localStorage에서 장비/인벤토리 데이터 복원
2. 아이템 추가/제거/장착/해제 시 자동으로 localStorage 업데이트
3. 장비 변경 시 'equipment-changed' 이벤트 발생으로 UI 동기화

---

## 2. 스킬 덱 영구 저장 시스템

### 📁 수정된 파일
- `/lib/services/skill-management.service.ts`

### 🔧 주요 변경사항

#### LocalStorage 키 추가
```typescript
private readonly STORAGE_KEY_SKILLS = 'life-rpg-learned-skills'
private readonly STORAGE_KEY_QUICKSLOTS = 'life-rpg-skill-quickslots'
private readonly STORAGE_KEY_SKILL_POINTS = 'life-rpg-skill-points'
```

#### 통합 저장 메서드
```typescript
// localStorage에 저장
private saveToLocalStorage(): void {
  try {
    // 학습한 스킬 저장
    const skillsArray = Array.from(this.learnedSkills.values())
    localStorage.setItem(this.STORAGE_KEY_SKILLS, JSON.stringify(skillsArray))

    // 퀵슬롯 저장
    const quickSlotsObj: Record<number, string> = {}
    this.quickSlots.forEach((skillId, slot) => {
      quickSlotsObj[slot] = skillId
    })
    localStorage.setItem(this.STORAGE_KEY_QUICKSLOTS, JSON.stringify(quickSlotsObj))

    // 스킬 포인트 저장
    localStorage.setItem(this.STORAGE_KEY_SKILL_POINTS, JSON.stringify(this.skillPoints))

    console.log('[SkillService] localStorage 저장 완료')
  } catch (error) {
    console.error('[SkillService] localStorage 저장 실패:', error)
  }
}
```

#### 초기화 메서드 개선
```typescript
async initialize(userId: string = GAME_CONFIG.DEFAULT_USER_ID): Promise<void> {
  if (this.initialized && this.userId === userId) {
    return
  }

  this.userId = userId
  this.learnedSkills.clear()
  this.quickSlots.clear()

  try {
    // localStorage에서 먼저 로드 시도
    const savedSkills = localStorage.getItem(this.STORAGE_KEY_SKILLS)
    const savedQuickSlots = localStorage.getItem(this.STORAGE_KEY_QUICKSLOTS)
    const savedSkillPoints = localStorage.getItem(this.STORAGE_KEY_SKILL_POINTS)

    if (savedSkills) {
      const skillsData = JSON.parse(savedSkills)
      skillsData.forEach((learned: LearnedSkill) => {
        this.learnedSkills.set(learned.skillId, learned)
      })
      console.log('[SkillService] localStorage에서 스킬 복원:', skillsData.length, '개')
    }

    if (savedQuickSlots) {
      const quickSlotData = JSON.parse(savedQuickSlots)
      Object.entries(quickSlotData).forEach(([slot, skillId]) => {
        this.quickSlots.set(Number(slot), skillId as string)
      })
      console.log('[SkillService] localStorage에서 퀵슬롯 복원')
    }

    if (savedSkillPoints) {
      this.skillPoints = JSON.parse(savedSkillPoints)
      console.log('[SkillService] localStorage에서 스킬 포인트 복원:', this.skillPoints)
    }
  } catch (error) {
    console.error('[SkillService] localStorage 로드 실패:', error)
  }

  // DB에서도 로드 (나중에 동기화를 위해)
  // ... 기존 DB 로드 코드 ...

  // localStorage에 저장
  this.saveToLocalStorage()

  // 기본 스킬이 없으면 학습
  if (this.learnedSkills.size === 0) {
    await this.learnBasicSkills()
  }

  this.initialized = true
}
```

### 🎯 저장 트리거
- 스킬 학습/삭제
- 퀵슬롯 할당/제거
- 스킬 레벨업
- 스킬 포인트 변경
- 스킬 초기화

---

## 3. 6단계 아이템 등급 시스템

### 📁 수정된 파일
- `/lib/types/item-system.ts`
- `/lib/constants/item.constants.ts`

### 🔧 아이템 등급 정의

#### 타입 정의 (`item-system.ts`)
```typescript
// 아이템 희귀도 - 6단계 시스템
export const ItemRarity = {
  COMMON: 'common',      // 일반 (회색) - 기본 스탯
  MAGIC: 'magic',        // 매직 (파란색) - 추가 스탯 1-2개
  RARE: 'rare',          // 레어 (노란색) - 추가 스탯 2-3개 + 특수 효과
  EPIC: 'epic',          // 에픽 (보라색) - 추가 스탯 3-4개 + 강력한 효과
  LEGENDARY: 'legendary', // 전설 (주황색) - 추가 스탯 4-5개 + 고유 효과
  MYTHIC: 'mythic'       // 신화 (빨간색) - 추가 스탯 5-6개 + 세트 효과
} as const
```

#### 등급별 설정 (`item.constants.ts`)
```typescript
export const ITEM_RARITY_CONFIG = {
  common: {
    name: '일반',
    color: 'gray',
    statMultiplier: { min: 0.8, max: 1.0 },
    maxRandomStats: 0,
    dropRate: 0.6,
    sellPriceMultiplier: 1,
    enhanceSuccessBonus: 0,
    specialEffectChance: 0
  },
  magic: {
    name: '매직',
    color: 'blue',
    statMultiplier: { min: 1.0, max: 1.3 },
    maxRandomStats: 2,
    dropRate: 0.25,
    sellPriceMultiplier: 1.5,
    enhanceSuccessBonus: 5,
    specialEffectChance: 0.1
  },
  rare: {
    name: '레어',
    color: 'yellow',
    statMultiplier: { min: 1.3, max: 1.6 },
    maxRandomStats: 3,
    dropRate: 0.1,
    sellPriceMultiplier: 2,
    enhanceSuccessBonus: 10,
    specialEffectChance: 0.3
  },
  epic: {
    name: '에픽',
    color: 'purple',
    statMultiplier: { min: 1.6, max: 2.0 },
    maxRandomStats: 4,
    dropRate: 0.04,
    sellPriceMultiplier: 3,
    enhanceSuccessBonus: 15,
    specialEffectChance: 0.5
  },
  legendary: {
    name: '전설',
    color: 'orange',
    statMultiplier: { min: 2.0, max: 2.5 },
    maxRandomStats: 5,
    dropRate: 0.009,
    sellPriceMultiplier: 5,
    enhanceSuccessBonus: 20,
    specialEffectChance: 0.8
  },
  mythic: {
    name: '신화',
    color: 'red',
    statMultiplier: { min: 2.5, max: 3.0 },
    maxRandomStats: 6,
    dropRate: 0.001,
    sellPriceMultiplier: 10,
    enhanceSuccessBonus: 25,
    specialEffectChance: 1.0 // 100% 특수 효과
  }
} as const
```

### 🎯 등급별 특징
- **Common**: 기본 스탯만 보유
- **Magic**: 1-2개의 추가 스탯, 10% 특수 효과 확률
- **Rare**: 2-3개의 추가 스탯, 30% 특수 효과 확률
- **Epic**: 3-4개의 추가 스탯, 50% 특수 효과 확률
- **Legendary**: 4-5개의 추가 스탯, 80% 특수 효과 확률
- **Mythic**: 5-6개의 추가 스탯, 100% 특수 효과, 세트 효과 가능

---

## 4. 보스 고유 드롭 시스템

### 📁 생성된 파일
- `/lib/data/boss-items.ts`
- `/lib/data/boss-skills.ts`

### 🔧 보스 고유 아이템 (`boss-items.ts`)

#### 슬라임 킹 드롭
```typescript
'slime-king': [
  {
    id: 'slime-crown',
    name: '슬라임 왕관',
    type: 'accessory',
    description: '슬라임 킹이 쓰던 끈적한 왕관. 착용 시 HP 재생력이 증가한다.',
    rarity: 'rare',
    icon: '👑',
    level: 10,
    value: 5000,
    stackable: false,
    tradeable: true,
    requirements: {
      level: 10
    }
  },
  {
    id: 'skill-book-slime-shield',
    name: '스킬북: 슬라임 방패',
    type: 'consumable',
    description: '슬라임 킹의 방어 기술을 배울 수 있는 스킬북',
    rarity: 'rare',
    icon: '📗',
    level: 10,
    value: 8000,
    stackable: false,
    tradeable: true,
    consumable: {
      effect: 'learnSkill',
      value: 'slime_shield'
    }
  }
]
```

#### 드래곤 로드 드롭
```typescript
'dragon-lord': [
  {
    id: 'dragon-scale-armor',
    name: '용린 갑옷',
    type: 'armor',
    description: '드래곤의 비늘로 만든 전설의 갑옷. 모든 속성 저항력이 증가한다.',
    rarity: 'legendary',
    icon: '🛡️',
    level: 60,
    value: 50000,
    stackable: false,
    tradeable: false, // 거래 불가
    requirements: {
      level: 60
    }
  },
  {
    id: 'dragon-heart',
    name: '용의 심장',
    type: 'material',
    description: '드래곤 로드의 심장. 최고급 아이템 제작에 필요한 전설의 재료.',
    rarity: 'mythic',
    icon: '❤️‍🔥',
    level: 60,
    value: 100000,
    stackable: false,
    tradeable: false,
    requirements: {
      level: 60
    }
  }
]
```

#### 드롭 확률 시스템
```typescript
export function calculateBossRewards(bossId: string, playerLuck: number = 0): BaseItem[] {
  const drops: BaseItem[] = []
  const bossItems = bossUniqueItems[bossId]
  const dropRates = bossDropRates[bossId as keyof typeof bossDropRates]

  if (!bossItems || !dropRates) {
    console.warn(`No drops defined for boss: ${bossId}`)
    return drops
  }

  // 각 아이템에 대해 드롭 확률 계산
  bossItems.forEach(item => {
    const baseRate = dropRates[item.id as keyof typeof dropRates] || 0
    const finalRate = baseRate + (playerLuck * 0.1) // 행운 스탯 1당 0.1% 추가
    
    if (Math.random() * 100 < finalRate) {
      drops.push(item)
    }
  })

  // 최소 1개는 드롭 보장 (보스 처치 보상)
  if (drops.length === 0 && bossItems.length > 0) {
    // 가장 드롭률이 높은 아이템 드롭
    const sortedItems = bossItems.sort((a, b) => {
      const rateA = dropRates[a.id as keyof typeof dropRates] || 0
      const rateB = dropRates[b.id as keyof typeof dropRates] || 0
      return rateB - rateA
    })
    drops.push(sortedItems[0])
  }

  return drops
}
```

### 🔧 보스 전용 스킬 (`boss-skills.ts`)

#### 액티브 스킬 예시
```typescript
dragon_breath: {
  id: 'dragon_breath',
  name: '드래곤 브레스',
  description: '전방에 파괴적인 화염을 내뿜어 적들을 소각한다.',
  icon: '🔥',
  type: 'active',
  category: 'fire',
  level: 1,
  maxLevel: 10,
  cooldown: 30,
  mpCost: {
    base: 150,
    perLevel: 20
  },
  effects: [
    {
      type: 'damage',
      target: 'cone', // 원뿔형 범위
      damageType: 'fire',
      value: {
        base: 500,
        perLevel: 100,
        scaling: {
          stat: 'attack',
          ratio: 2.5
        }
      }
    },
    {
      type: 'debuff',
      target: 'enemies',
      condition: 'burn',
      chance: 80,
      duration: 5,
      damage: {
        base: 50,
        perLevel: 10
      }
    }
  ],
  requirements: {
    level: 60,
    items: [{ id: 'skill-book-dragon-breath', quantity: 1 }]
  }
}
```

---

## 5. 패시브 스킬 시스템

### 📁 생성된 파일
- `/lib/data/passive-skills.ts`

### 🔧 패시브 스킬 카테고리

#### 기본 패시브
```typescript
vitality: {
  id: 'vitality',
  name: '활력',
  description: '최대 HP가 증가합니다.',
  icon: '❤️',
  type: 'passive',
  category: 'basic',
  level: 1,
  maxLevel: 20,
  cooldown: 0,
  mpCost: 0,
  effects: [
    {
      type: 'stat_increase',
      target: 'self',
      stat: 'hp',
      value: {
        base: 50,
        perLevel: 25
      }
    }
  ],
  requirements: {
    level: 5
  }
}
```

#### 고급 패시브
```typescript
critical_mastery: {
  id: 'critical_mastery',
  name: '치명타 숙련',
  description: '치명타 확률과 치명타 데미지가 증가합니다.',
  icon: '🎯',
  type: 'passive',
  category: 'advanced',
  level: 1,
  maxLevel: 10,
  cooldown: 0,
  mpCost: 0,
  effects: [
    {
      type: 'stat_increase',
      target: 'self',
      stat: 'critRate',
      value: {
        base: 2,
        perLevel: 1.5
      }
    },
    {
      type: 'stat_increase',
      target: 'self',
      stat: 'critDamage',
      value: {
        base: 10,
        perLevel: 5
      }
    }
  ],
  requirements: {
    level: 20,
    skills: [{ id: 'agility', level: 5 }]
  }
}
```

#### 특수 패시브
```typescript
last_stand: {
  id: 'last_stand',
  name: '최후의 저항',
  description: '치명적인 피해를 받을 때 한 번 생존합니다. (재사용 대기시간 300초)',
  icon: '💀',
  type: 'passive',
  category: 'special',
  level: 1,
  maxLevel: 1,
  cooldown: 300,
  mpCost: 0,
  effects: [
    {
      type: 'death_prevention',
      target: 'self',
      value: {
        base: 1, // 남는 HP
        perLevel: 0
      }
    }
  ],
  requirements: {
    level: 50,
    skills: [
      { id: 'vitality', level: 20 },
      { id: 'endurance', level: 20 }
    ]
  }
}
```

### 📁 수정된 파일
- `/lib/data/skills.ts`

#### 스킬 통합
```typescript
// baseSkills와 추가 스킬을 병합
export const allSkills: Record<string, Skill> = {
  // baseSkills의 모든 스킬 포함
  ...baseSkills,
  
  // 패시브 스킬 포함
  ...passiveSkills,
  
  // 보스 스킬 포함
  ...bossSkills,
  ...bossPassiveSkills,
  
  // 기존 스킬들...
}
```

---

## 6. 코드 복원 가이드

### 🔧 장비 시스템 복원
1. `/lib/services/inventory.service.ts` 파일에서 다음 확인:
   - `STORAGE_KEY_EQUIPMENT`, `STORAGE_KEY_INVENTORY` 상수
   - `initialize()` 메서드의 localStorage 로드 로직
   - `saveEquipmentState()`, `saveInventoryState()` 메서드
   - `equipItem()`, `unequipItem()` 메서드의 저장 호출

### 🔧 스킬 시스템 복원
1. `/lib/services/skill-management.service.ts` 파일에서 다음 확인:
   - `STORAGE_KEY_SKILLS`, `STORAGE_KEY_QUICKSLOTS`, `STORAGE_KEY_SKILL_POINTS` 상수
   - `initialize()` 메서드의 localStorage 로드 로직
   - `saveToLocalStorage()` 메서드
   - 모든 스킬 변경 메서드에서 `saveToLocalStorage()` 호출

### 🔧 아이템 등급 시스템 복원
1. `/lib/types/item-system.ts`:
   - `ItemRarity` enum에 6단계 정의 확인
2. `/lib/constants/item.constants.ts`:
   - `ITEM_RARITY_CONFIG`에 6단계 설정 확인

### 🔧 보스 시스템 복원
1. `/lib/data/boss-items.ts` 파일 존재 확인
2. `/lib/data/boss-skills.ts` 파일 존재 확인
3. `/lib/data/skills.ts`에서 import 및 병합 확인

### 🔧 패시브 스킬 시스템 복원
1. `/lib/data/passive-skills.ts` 파일 존재 확인
2. `/lib/data/skills.ts`에서 import 및 병합 확인

### 💾 백업 권장사항
```bash
# 전체 프로젝트 백업
cp -r /mnt/c/Users/USER/life-rpg-pwa_2 /mnt/c/Users/USER/life-rpg-pwa_2_backup_$(date +%Y%m%d)

# 주요 파일만 백업
cp /lib/services/inventory.service.ts /lib/services/inventory.service.ts.bak
cp /lib/services/skill-management.service.ts /lib/services/skill-management.service.ts.bak
```

### 🐛 문제 해결
1. **localStorage 데이터 확인**:
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log('Equipment:', localStorage.getItem('life-rpg-equipment'))
   console.log('Inventory:', localStorage.getItem('life-rpg-inventory'))
   console.log('Skills:', localStorage.getItem('life-rpg-learned-skills'))
   console.log('QuickSlots:', localStorage.getItem('life-rpg-skill-quickslots'))
   console.log('Skill Points:', localStorage.getItem('life-rpg-skill-points'))
   ```

2. **데이터 초기화**:
   ```javascript
   // 브라우저 콘솔에서 실행 (주의: 모든 데이터 삭제)
   localStorage.removeItem('life-rpg-equipment')
   localStorage.removeItem('life-rpg-inventory')
   localStorage.removeItem('life-rpg-learned-skills')
   localStorage.removeItem('life-rpg-skill-quickslots')
   localStorage.removeItem('life-rpg-skill-points')
   ```

---

## 📌 업데이트 로그
- **2025-08-02**: 아이템 및 스킬 영구 저장 시스템 구현
- **2025-08-02**: 아이템 생성 서비스 6단계 시스템 완전 적용
  - rollItemRarity() 메서드에 mythic 등급 추가
  - getItemIcon() 메서드에 mythic 아이콘 추가
  - generateSpecialEffects() 메서드 6단계 시스템 적용
- **2025-08-02**: 실제 전투 시스템 통합 완료
  - PlayerStatsService 생성: 기본 스탯 + 장비 + 패시브 스킬 통합 계산
  - ATBCombatService 수정: 플레이어 종합 스탯 적용
  - 흡혈 효과 실제 작동 구현
  - 속성 저항 시스템 구현
  - 아이템 특수 효과 전투 중 발동 구현
- **작업자**: Claude (Assistant)
- **검토자**: User

## 🔄 향후 개선사항
1. 클라우드 동기화 기능
2. 데이터 암호화
3. 버전 관리 시스템
4. 자동 백업 기능