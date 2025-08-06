// 개발용 헬퍼 함수들
import { jrpgDbHelpers } from './database-helpers'
import { ItemRarity } from './item-rarity'
import { SKILL_DATABASE } from './skills-database'

// 테스트 아이템 추가
export async function addTestItems(userId: string) {
  const testItems = [
    // 일반 아이템
    { itemId: 'weapon_001', rarity: ItemRarity.COMMON },
    { itemId: 'armor_001', rarity: ItemRarity.COMMON },
    
    // 고급 아이템
    { itemId: 'weapon_002', rarity: ItemRarity.UNCOMMON },
    { itemId: 'armor_002', rarity: ItemRarity.UNCOMMON },
    { itemId: 'accessory_001', rarity: ItemRarity.UNCOMMON },
    
    // 희귀 아이템
    { itemId: 'weapon_003', rarity: ItemRarity.RARE },
    { itemId: 'armor_003', rarity: ItemRarity.RARE },
    { itemId: 'accessory_002', rarity: ItemRarity.RARE },
    
    // 영웅 아이템
    { itemId: 'weapon_004', rarity: ItemRarity.EPIC },
    { itemId: 'accessory_003', rarity: ItemRarity.EPIC },
    
    // 전설 아이템
    { itemId: 'weapon_005', rarity: ItemRarity.LEGENDARY },
    
    // 소모품
    { itemId: 'consumable_001', rarity: ItemRarity.COMMON },
    { itemId: 'consumable_002', rarity: ItemRarity.COMMON },
    { itemId: 'consumable_003', rarity: ItemRarity.RARE },
    
    // 재료
    { itemId: 'material_001', rarity: ItemRarity.COMMON },
    { itemId: 'material_002', rarity: ItemRarity.UNCOMMON },
    { itemId: 'material_003', rarity: ItemRarity.EPIC }
  ]

  console.log('📦 테스트 아이템 추가 시작...')
  
  for (const item of testItems) {
    const added = await jrpgDbHelpers.addItemToInventory(userId, item.itemId, item.rarity)
    if (added) {
      console.log(`✅ ${item.itemId} 추가 성공`)
    } else {
      console.log(`❌ ${item.itemId} 추가 실패`)
    }
  }
  
  console.log('📦 테스트 아이템 추가 완료!')
}

// 테스트 스킬 추가
export async function addTestSkills(userId: string) {
  const testSkills = [
    'skill_001', // 파워 스트라이크
    'skill_002', // 파이어볼
    'skill_003', // 빠른 일격
    'skill_004', // 힐링 터치
    'skill_005', // 아이스 샤드
  ]

  console.log('🎯 테스트 스킬 추가 시작...')
  
  for (const skillId of testSkills) {
    const skill = SKILL_DATABASE[skillId]
    if (!skill) continue
    
    const learned = await jrpgDbHelpers.learnSkill(userId, skillId)
    if (learned) {
      console.log(`✅ ${skill.name} 학습 성공`)
      
      // 몇 개 스킬은 레벨업도 해주기
      if (skillId === 'skill_001' || skillId === 'skill_002') {
        await jrpgDbHelpers.upgradeSkill(userId, learned.id)
        await jrpgDbHelpers.upgradeSkill(userId, learned.id)
        console.log(`  → Lv.3으로 업그레이드`)
      }
    } else {
      console.log(`❌ ${skill.name} 학습 실패`)
    }
  }
  
  console.log('🎯 테스트 스킬 추가 완료!')
}

// 개발용 전역 함수 등록
if (typeof window !== 'undefined') {
  (window as any).jrpgDev = {
    addTestItems,
    addTestSkills,
    jrpgDbHelpers,
    SKILL_DATABASE
  }
  
  console.log('🎮 JRPG 개발 도구 활성화!')
  console.log('콘솔에서 다음 명령어를 사용할 수 있습니다:')
  console.log('- jrpgDev.addTestItems("user_id") : 테스트 아이템 추가')
  console.log('- jrpgDev.addTestSkills("user_id") : 테스트 스킬 추가')
}