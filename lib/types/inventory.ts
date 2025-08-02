// 인벤토리 및 아이템 시스템 타입 정의
// 엄격한 타입 안전성과 확장성을 고려한 설계

// 아이템 등급 상수
export const ITEM_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
} as const

export type ItemRarity = typeof ITEM_RARITY[keyof typeof ITEM_RARITY];

// 장비 슬롯 타입
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory1' | 'accessory2';

// 베이스 아이템 인터페이스
export interface BaseItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: ItemRarity;
  readonly icon: string;
  readonly stackable: boolean;
  readonly maxStack: number;
  readonly sellPrice: number;
  readonly buyPrice?: number;
  readonly levelRequirement: number;
  readonly weight?: number;
}

// 구별된 유니온 타입으로 아이템 종류 구분
export type Item =
  | EquipmentItem
  | ConsumableItem
  | MaterialItem
  | MiscItem;

// 장비 아이템
export interface EquipmentItem extends BaseItem {
  readonly type: 'equipment';
  readonly subType: EquipmentSubType;
  readonly slot: EquipmentSlot;
  readonly stats: EquipmentStats;
  readonly enhanceable: boolean;
  readonly maxEnhancement: number;
  readonly setId?: string;
  readonly effects?: ReadonlyArray<ItemEffect>;
  readonly requirements?: EquipmentRequirements;
}

export type EquipmentSubType =
  | 'sword' | 'axe' | 'spear' | 'staff' | 'bow' // 무기
  | 'light_armor' | 'heavy_armor' | 'robe' // 방어구
  | 'ring' | 'necklace' | 'bracelet'; // 액세서리

export interface EquipmentStats {
  readonly attack?: number;
  readonly defense?: number;
  readonly hp?: number;
  readonly mp?: number;
  readonly speed?: number;
  readonly critRate?: number;
  readonly dodgeRate?: number;
}

export interface EquipmentRequirements {
  readonly level?: number;
  readonly strength?: number;
  readonly intelligence?: number;
  readonly dexterity?: number;
}

// 소비 아이템
export interface ConsumableItem extends BaseItem {
  readonly type: 'consumable';
  readonly subType: ConsumableSubType;
  readonly useEffect: UseEffect;
  readonly duration?: number;
  readonly cooldown?: number;
  readonly charges?: number;
}

export type ConsumableSubType =
  | 'potion'
  | 'food'
  | 'scroll'
  | 'bomb'
  | 'buff_item';

export interface UseEffect {
  readonly type: UseEffectType;
  readonly target: 'self' | 'enemy' | 'area';
  readonly value: number;
  readonly duration?: number;
  readonly radius?: number;
}

export type UseEffectType =
  | 'heal_hp'
  | 'heal_mp'
  | 'buff_attack'
  | 'buff_defense'
  | 'buff_speed'
  | 'damage'
  | 'cleanse'
  | 'revive';

// 재료 아이템
export interface MaterialItem extends BaseItem {
  readonly type: 'material';
  readonly subType: MaterialSubType;
  readonly grade: 1 | 2 | 3 | 4 | 5;
  readonly category: MaterialCategory;
}

export type MaterialSubType =
  | 'enhancement_stone'
  | 'protection_stone'
  | 'blessing_powder'
  | 'monster_part'
  | 'ore'
  | 'herb';

export type MaterialCategory =
  | 'enhancement'
  | 'crafting'
  | 'quest'
  | 'special';

// 기타 아이템
export interface MiscItem extends BaseItem {
  readonly type: 'misc';
  readonly subType: MiscSubType;
  readonly questId?: string;
  readonly usable: boolean;
}

export type MiscSubType =
  | 'key'
  | 'book'
  | 'quest_item'
  | 'treasure'
  | 'special';

// 아이템 효과
export interface ItemEffect {
  readonly stat: ItemEffectStat;
  readonly value: number;
  readonly isPercentage: boolean;
  readonly condition?: EffectCondition;
}

export type ItemEffectStat =
  | keyof EquipmentStats
  | 'exp_gain'
  | 'gold_gain'
  | 'drop_rate'
  | 'all_stats';

export interface EffectCondition {
  readonly type: 'hp_below' | 'hp_above' | 'in_combat' | 'time_of_day';
  readonly value: number | string;
}

// 인벤토리 관련 타입
export interface InventorySlot {
  readonly slotId: number;
  readonly item: Item | null;
  readonly quantity: number;
  readonly enhancement: number;
  readonly locked: boolean;
  readonly obtainedAt: Date;
}

export interface PlayerInventory {
  readonly userId: string;
  readonly slots: ReadonlyArray<InventorySlot>;
  readonly maxSlots: number;
  readonly gold: number;
  readonly diamonds: number;
}

// 장착된 장비
export interface EquippedGear {
  readonly userId: string;
  readonly weapon: EquippedItem | null;
  readonly armor: EquippedItem | null;
  readonly accessory1: EquippedItem | null;
  readonly accessory2: EquippedItem | null;
}

export interface EquippedItem {
  readonly item: EquipmentItem;
  readonly enhancement: number;
  readonly inventorySlotId: number;
  readonly equippedAt: Date;
}

// 아이템 강화 관련
export interface EnhancementResult {
  readonly success: boolean;
  readonly newLevel: number;
  readonly bonusStats?: EquipmentStats;
  readonly destroyed: boolean;
}

export interface EnhancementCost {
  readonly gold: number;
  readonly materials: ReadonlyArray<{
    readonly itemId: string;
    readonly quantity: number;
  }>;
  readonly successRate: number;
}

// 세트 효과
export interface ItemSet {
  readonly id: string;
  readonly name: string;
  readonly items: ReadonlyArray<string>;
  readonly bonuses: ReadonlyArray<SetBonus>;
}

export interface SetBonus {
  readonly requiredPieces: number;
  readonly effects: ReadonlyArray<ItemEffect>;
  readonly description: string;
}

// 타입 가드 함수들
export function isEquipmentItem(item: Item): item is EquipmentItem {
  return item.type === 'equipment'
}

export function isConsumableItem(item: Item): item is ConsumableItem {
  return item.type === 'consumable'
}

export function isMaterialItem(item: Item): item is MaterialItem {
  return item.type === 'material'
}

export function isMiscItem(item: Item): item is MiscItem {
  return item.type === 'misc'
}

export function isStackableItem(item: Item): boolean {
  return item.stackable && item.maxStack > 1
}

export function canEquipItem(
  item: Item,
  slot: EquipmentSlot,
  playerLevel: number
): item is EquipmentItem {
  if (!isEquipmentItem(item)) {
    return false
  }
  if (item.slot !== slot) {
    return false
  }
  if (item.levelRequirement > playerLevel) {
    return false
  }
  return true
}

// 인벤토리 관련 상수
export const INVENTORY_CONSTANTS = {
  DEFAULT_MAX_SLOTS: 50,
  MAX_INVENTORY_SLOTS: 200,
  MAX_STACK_SIZE: 999,
  EQUIPMENT_SLOTS: 4,
  MAX_ENHANCEMENT_LEVEL: 15,
  ENHANCEMENT_BONUS_PER_LEVEL: 0.1,
  SELL_PRICE_RATIO: 0.3
} as const

// 아이템 필터링 옵션
export interface ItemFilterOptions {
  readonly type?: Item['type'];
  readonly rarity?: ItemRarity;
  readonly minLevel?: number;
  readonly maxLevel?: number;
  readonly equipped?: boolean;
  readonly stackable?: boolean;
  readonly searchText?: string;
}

// 아이템 정렬 옵션
export interface ItemSortOptions {
  readonly field: ItemSortField;
  readonly direction: 'asc' | 'desc';
}

export type ItemSortField =
  | 'name'
  | 'level'
  | 'rarity'
  | 'type'
  | 'obtainedAt'
  | 'value';

// 거래 관련
export interface Transaction {
  readonly id: string;
  readonly userId: string;
  readonly type: 'buy' | 'sell';
  readonly itemId: string;
  readonly quantity: number;
  readonly totalPrice: number;
  readonly timestamp: Date;
}

// 드롭 테이블
export interface DropTable {
  readonly id: string;
  readonly items: ReadonlyArray<DropTableEntry>;
}

export interface DropTableEntry {
  readonly itemId: string;
  readonly minQuantity: number;
  readonly maxQuantity: number;
  readonly dropRate: number;
  readonly conditions?: DropCondition;
}

export interface DropCondition {
  readonly type: 'player_level' | 'monster_type' | 'time_based';
  readonly value: number | string;
}
