/**
 * 아이템 데이터 모듈 진입점
 * 모든 아이템 관련 데이터 및 유틸리티 함수들을 내보냄
 */

// 개별 카테고리 아이템 내보내기
export { WEAPON_ITEMS } from './weapons'
export { ARMOR_ITEMS } from './armors'
export { ACCESSORY_ITEMS } from './accessories'
export { CONSUMABLE_ITEMS } from './consumables'
export { MATERIAL_ITEMS } from './materials'

// 통합 아이템 데이터 및 유틸리티 함수 내보내기
export {
  ALL_ITEMS,
  ITEM_STATISTICS,
  getItemById,
  getItemsByType,
  getItemsByRarity,
  getItemsByLevelRange,
  searchItemsByName
} from './all-items'
