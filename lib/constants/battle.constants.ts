// 전투 상수 모듈 재export
export * from './battle/damage.constants'
export * from './battle/timing.constants'
export * from './battle/ability.constants'
export * from './battle/ui.constants'

// 통합 전투 설정
import { DAMAGE_CONSTANTS } from './battle/damage.constants'
import { TIMING_CONSTANTS } from './battle/timing.constants'
import { ABILITY_CONSTANTS } from './battle/ability.constants'
import { UI_CONSTANTS } from './battle/ui.constants'

export const BATTLE_CONFIG = {
  ...DAMAGE_CONSTANTS,
  ...TIMING_CONSTANTS,
  ...ABILITY_CONSTANTS,
  ...UI_CONSTANTS
} as const
