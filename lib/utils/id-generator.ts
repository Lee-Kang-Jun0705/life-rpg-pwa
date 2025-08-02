import { nanoid } from 'nanoid'

/**
 * 고유 ID 생성 유틸리티
 * nanoid를 사용하여 충돌 가능성이 매우 낮은 ID 생성
 */

// 기본 ID 생성 (21자)
export function generateId(): string {
  return nanoid()
}

// 짧은 ID 생성 (10자)
export function generateShortId(): string {
  return nanoid(10)
}

// 프리픽스가 있는 ID 생성
export function generatePrefixedId(_prefix?: string): string {
  return `${prefix}_${nanoid()}`
}

// 타임스탬프가 포함된 ID 생성
export function generateTimestampId(prefix?: string): string {
  const timestamp = Date.now()
  const id = nanoid(10)
  return prefix ? `${prefix}_${timestamp}_${id}` : `${timestamp}_${id}`
}

// 특정 타입에 맞는 ID 생성
export const IdGenerators = {
  // 게임 관련
  activity: () => generatePrefixedId('act'),
  achievement: () => generatePrefixedId('ach'),

  // 전투 관련
  combat: () => generatePrefixedId('combat'),
  combatAction: () => generatePrefixedId('action'),
  battleSession: () => generatePrefixedId('battle'),

  // 아이템 관련
  item: () => generatePrefixedId('item'),
  equipment: () => generatePrefixedId('eq'),

  // 던전 관련
  dungeonSession: () => generatePrefixedId('dungeon'),

  // UI 관련
  toast: () => generateShortId(),
  modal: () => generateShortId(),

  // 백업/동기화 관련
  backup: () => generateTimestampId('backup'),
  device: () => generateTimestampId('device'),

  // 기타
  generic: () => generateId(),
  short: () => generateShortId(),
  timestamp: (prefix?: string) => generateTimestampId(prefix)
}

// 기존 코드와의 호환성을 위한 레거시 함수
// 점진적으로 새 함수로 마이그레이션
export function legacyGenerateId(): string {
  console.warn('legacyGenerateId is deprecated. Use generateId() instead.')
  return generateId()
}
