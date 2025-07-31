/**
 * 게임 전역 설정
 */

export const GAME_CONFIG = {
  // 기본 사용자 정보 (인증 시스템 구현 전 임시)
  DEFAULT_USER_ID: 'local-user',
  DEFAULT_USER_EMAIL: 'local@liferpg.app',
  DEFAULT_USER_NAME: '내 프로필',
  
  // 게임 설정
  MAX_LEVEL: 100,
  EXP_PER_LEVEL: 100,
  BASE_EXP_PER_LEVEL: 100,
  EXP_MULTIPLIER: 1.2,
  
  // 경험치 관련
  MIN_EXPERIENCE_GAIN: 10,
  MAX_EXPERIENCE_GAIN: 30,
  
  // 에너지 시스템
  MAX_ENERGY: 120,
  ENERGY_REGEN_RATE: 0.1,
  ENERGY_REGEN_INTERVAL: 600, // 10분
  
  // 전투 설정
  BATTLE_SPEED_MULTIPLIER: 1,
  ATB_SPEED: 1000, // 기본 ATB 속도 (밀리초)
  
  // 보상 설정
  GOLD_MULTIPLIER: 1,
  EXP_MULTIPLIER: 1,
  
  // 일일 제한
  DAILY_EXP_LIMIT: 5000,
  DAILY_ACTIVITY_LIMIT: 100,
  
  // 동기화 관련
  SYNC_INTERVAL: 30000, // 30초
  AUTO_SAVE_INTERVAL: 5000, // 5초
  
  // 디버그 설정
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  SHOW_DAMAGE_NUMBERS: true,
  SHOW_SKILL_COOLDOWNS: true,
  SHOW_DEBUG_TOOLS: process.env.NODE_ENV === 'development',
}

export default GAME_CONFIG