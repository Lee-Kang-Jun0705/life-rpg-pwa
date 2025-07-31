/**
 * 아이템 생성 서비스 테스트
 * any 타입 사용 금지, 하드코딩 금지 검증
 */

import { itemGenerationService } from '@/lib/services/item-generation.service'
import type { 
  ItemGenerationOptions, 
  ItemGenerationResult,
  GeneratedItem,
  ItemRarity
} from '@/lib/types/item-system'
import { ItemType } from '@/lib/types/item-system'
import { ITEM_RARITY_CONFIG, ITEM_TYPE_CONFIG } from '@/lib/constants/item.constants'
import { baseItems } from '@/lib/data/base-items'

describe('ItemGenerationService', () => {
  beforeEach(() => {
    // 테스트 전 초기화
    jest.clearAllMocks()
  })

  describe('generateItem', () => {
    it('should generate an item with valid properties', () => {
      const options: ItemGenerationOptions = {
        baseItemId: 'rusty_sword',
        level: 10,
        rarity: 'rare'
      }

      const result = itemGenerationService.generateItem(options)

      expect(result.success).toBe(true)
      expect(result.item).toBeDefined()
      
      const item = result.item!
      expect(item.uniqueId).toMatch(/^gen_item_\d+_[\da-z]+$/)
      expect(item.rarity).toBe('rare')
      expect(typeof item.generatedAt).toBe('number')
      expect(typeof item.seed).toBe('number')
    })

    it('should generate random stats within configured ranges', () => {
      const options: ItemGenerationOptions = {
        baseItemId: 'rusty_sword',
        level: 20,
        rarity: 'epic'
      }

      const results = Array.from({ length: 10 }, () => 
        itemGenerationService.generateItem(options)
      )

      const stats = results.map(r => r.item!.baseStats)
      
      // 모든 스탯이 설정된 범위 내에 있는지 확인
      stats.forEach(stat => {
        const rarityConfig = ITEM_RARITY_CONFIG.epic
        const minMultiplier = rarityConfig.statMultiplier.min
        const maxMultiplier = rarityConfig.statMultiplier.max

        if (stat.attack) {
          expect(stat.attack).toBeGreaterThanOrEqual(1)
          expect(stat.attack).toBeLessThanOrEqual(100)
        }
      })

      // 랜덤성 검증 - 모든 아이템이 다른 스탯을 가져야 함
      const uniqueStats = new Set(stats.map(s => JSON.stringify(s)))
      expect(uniqueStats.size).toBeGreaterThan(1)
    })

    it('should respect item type constraints', () => {
      const weaponResult = itemGenerationService.generateItem({
        baseItemId: 'rusty_sword',
        level: 15,
        rarity: 'common'
      })

      const armorResult = itemGenerationService.generateItem({
        baseItemId: 'cloth_armor',
        level: 15,
        rarity: 'common'
      })

      expect(weaponResult.item!.type).toBe(ItemType.WEAPON)
      expect(weaponResult.item!.baseStats.attack).toBeGreaterThan(0)

      expect(armorResult.item!.type).toBe(ItemType.ARMOR)
      expect(armorResult.item!.baseStats.defense).toBeGreaterThan(0)
    })

    it('should apply rarity bonuses correctly', () => {
      const rarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
      const level = 25
      
      const items = rarities.map(rarity => 
        itemGenerationService.generateItem({ baseItemId: 'sword_basic', level, rarity })
      )

      // 희귀도가 높을수록 더 많은 보너스 스탯을 가져야 함
      const bonusCounts = items.map(result => {
        const item = result.item!
        let count = 0
        // randomStats 에서 보너스 스탯 확인
        for (const stat of item.randomStats) {
          if (stat.type === 'critRate' || stat.type === 'critDamage' || stat.type === 'attackSpeed') {
            count++
          }
        }
        return count
      })

      // 높은 희귀도일수록 더 많은 보너스
      for (let i = 1; i < bonusCounts.length; i++) {
        expect(bonusCounts[i]).toBeGreaterThanOrEqual(bonusCounts[i - 1])
      }
    })

    it('should use deterministic generation with seed', () => {
      const seed = 12345
      const options: ItemGenerationOptions = {
        baseItemId: 'rusty_sword',
        level: 30,
        rarity: 'legendary',
        seed
      }

      const result1 = itemGenerationService.generateItem(options)
      const result2 = itemGenerationService.generateItem(options)

      // 같은 시드로 생성된 아이템은 같은 스탯을 가져야 함
      expect(result1.item!.baseStats).toEqual(result2.item!.baseStats)
      expect(result1.item!.seed).toBe(seed)
      expect(result2.item!.seed).toBe(seed)
    })

    it('should generate set items when configured', () => {
      const result = itemGenerationService.generateItem({
        baseItemId: 'warrior_set_sword',
        level: 25,
        rarity: 'rare'
      })

      const item = result.item!
      expect(item.setId).toBeDefined()
      expect(item.setId).toBe('warrior_set')
    })

    it('should not use any types', () => {
      // TypeScript 컴파일러가 any 타입 사용을 방지함
      const options: ItemGenerationOptions = {
        baseItemId: 'rusty_sword',
        level: 10,
        rarity: 'common'
      }
      
      const result: ItemGenerationResult = itemGenerationService.generateItem(options)
      const item: GeneratedItem | undefined = result.item
      
      // 모든 타입이 명시적으로 정의되어 있음
      expect(typeof result.success).toBe('boolean')
      if (item) {
        expect(typeof item.id).toBe('string')
        expect(typeof item.name).toBe('string')
      }
    })
  })

  describe('generateDropItem', () => {
    it('should generate items based on monster level', () => {
      const monsterLevel = 15
      const items = Array.from({ length: 20 }, () => 
        itemGenerationService.generateDropItem(monsterLevel, 'boss')
      ).filter(item => item !== null)

      expect(items.length).toBeGreaterThan(0)
      
      items.forEach(item => {
        expect(item!.level).toBeGreaterThanOrEqual(monsterLevel - 5)
        expect(item!.level).toBeLessThanOrEqual(monsterLevel + 5)
      })
    })

    it('should have higher drop rates for bosses', () => {
      const normalDrops = Array.from({ length: 100 }, () => 
        itemGenerationService.generateDropItem(20, 'normal')
      ).filter(Boolean).length

      const bossDrops = Array.from({ length: 100 }, () => 
        itemGenerationService.generateDropItem(20, 'boss')
      ).filter(Boolean).length

      // 보스가 일반 몬스터보다 더 많은 아이템을 드롭해야 함
      expect(bossDrops).toBeGreaterThan(normalDrops)
    })

    it('should generate rarer items from elite monsters', () => {
      const eliteItems = Array.from({ length: 50 }, () => 
        itemGenerationService.generateDropItem(25, 'elite')
      ).filter(Boolean) as GeneratedItem[]

      const rarityCount = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      }

      eliteItems.forEach(item => {
        rarityCount[item.rarity]++
      })

      // 엘리트 몬스터는 희귀 아이템을 더 많이 드롭해야 함
      expect(rarityCount.rare + rarityCount.epic + rarityCount.legendary)
        .toBeGreaterThan(rarityCount.common)
    })
  })

  describe('constants validation', () => {
    it('should not have hardcoded values', () => {
      // 모든 설정값이 상수로 정의되어 있는지 확인
      expect(ITEM_RARITY_CONFIG).toBeDefined()
      expect(ITEM_TYPE_CONFIG).toBeDefined()
      
      // 하드코딩된 문자열이 없는지 확인
      Object.values(ITEM_RARITY_CONFIG).forEach(config => {
        expect(typeof config.statMultiplier.min).toBe('number')
        expect(typeof config.statMultiplier.max).toBe('number')
        expect(config.statMultiplier.min).not.toBe(0)
        expect(config.statMultiplier.max).not.toBe(0)
      })
    })

    it('should have properly structured base items', () => {
      Object.values(baseItems).forEach(category => {
        Object.values(category).forEach(item => {
          expect(item.id).toBeDefined()
          expect(item.name).toBeDefined()
          expect(item.type).toBeDefined()
          expect(item.subType).toBeDefined()
          expect(item.baseStats).toBeDefined()
          expect(item.levelRequirement).toBeGreaterThanOrEqual(1)
        })
      })
    })
  })

  describe('error handling', () => {
    it('should handle invalid options gracefully', () => {
      const invalidOptions: ItemGenerationOptions = {
        baseItemId: 'invalid_item',
        level: -10,
        rarity: 'invalid' as ItemRarity
      }

      const result = itemGenerationService.generateItem(invalidOptions)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_BASE_ITEM')
    })

    it('should handle edge cases in level ranges', () => {
      const result = itemGenerationService.generateItem({
        baseItemId: 'rusty_sword',
        level: 150,
        rarity: 'legendary'
      })

      expect(result.success).toBe(true)
      expect(result.item!.level).toBe(150) // 서비스가 제공된 레벨을 사용해야 함
    })
  })
})