/**
 * 비주얼 이펙트 상수
 * 이모지와 CSS 애니메이션으로 용량 최소화
 */

// 전투 이펙트 (이모지)
export const BATTLE_EFFECTS = {
  // 물리 공격
  slash: '⚔️',
  punch: '👊',
  kick: '🦵',

  // 마법 공격
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  water: '💧',
  earth: '🪨',
  wind: '🌪️',

  // 치유/버프
  heal: '💚',
  shield: '🛡️',
  buff: '⬆️',
  debuff: '⬇️',

  // 상태이상
  poison: '☠️',
  stun: '💫',
  sleep: '😴',
  confusion: '❓',

  // 특수 효과
  critical: '💥',
  dodge: '💨',
  block: '🚫',
  counter: '🔄'
}

// 아이템 획득 이펙트
export const ITEM_EFFECTS = {
  common: '✨',
  uncommon: '💎',
  rare: '🌟',
  epic: '⭐',
  legendary: '🌈'
}

// 레벨업/달성 이펙트
export const ACHIEVEMENT_EFFECTS = {
  levelUp: '🎉',
  statUp: '📈',
  skillUnlock: '🔓',
  achievement: '🏆',
  milestone: '🎯'
}

// 간단한 CSS 애니메이션 클래스
export const ANIMATION_CLASSES = {
  // 등장 애니메이션
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  zoomIn: 'animate-zoom-in',

  // 공격 애니메이션
  shake: 'animate-shake',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',

  // 이펙트 애니메이션
  sparkle: 'animate-sparkle',
  glow: 'animate-glow',
  rotate: 'animate-spin',

  // 사라지는 애니메이션
  fadeOut: 'animate-fade-out',
  shrink: 'animate-shrink'
}

// 사운드 이펙트 (짧은 웹 오디오 API 사용)
export const SOUND_EFFECTS = {
  // 기본음 주파수 (Hz)
  hit: 200,
  miss: 100,
  heal: 400,
  levelUp: 800,
  coin: 600,

  // 지속시간 (ms)
  duration: {
    short: 100,
    medium: 200,
    long: 500
  }
}

// 컬러 팔레트 (접근성 고려)
export const COLORS = {
  // 기본 색상
  health: '#10b981', // 녹색
  mana: '#3b82f6', // 파란색
  damage: '#ef4444', // 빨간색
  experience: '#f59e0b', // 노란색

  // 희귀도 색상
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',

  // 상태 색상
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280'
}
