// 속성 타입 정의
export type ElementType = 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'rock' | 'dark' | 'light' | 'normal'

// 속성 상성 테이블
export const ELEMENT_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    electric: 1,
    ice: 2,
    rock: 0.5,
    dark: 1,
    light: 1,
    normal: 1
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    electric: 1,
    ice: 1,
    rock: 2,
    dark: 1,
    light: 1,
    normal: 1
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    electric: 1,
    ice: 0.5,
    rock: 2,
    dark: 1,
    light: 1,
    normal: 1
  },
  electric: {
    fire: 1,
    water: 2,
    grass: 0.5,
    electric: 0.5,
    ice: 1,
    rock: 1,
    dark: 1,
    light: 1,
    normal: 1
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    electric: 1,
    ice: 0.5,
    rock: 1,
    dark: 1,
    light: 1,
    normal: 1
  },
  rock: {
    fire: 2,
    water: 1,
    grass: 1,
    electric: 1,
    ice: 2,
    rock: 1,
    dark: 1,
    light: 1,
    normal: 1
  },
  dark: {
    fire: 1,
    water: 1,
    grass: 1,
    electric: 1,
    ice: 1,
    rock: 1,
    dark: 0.5,
    light: 2,
    normal: 1
  },
  light: {
    fire: 1,
    water: 1,
    grass: 1,
    electric: 1,
    ice: 1,
    rock: 1,
    dark: 2,
    light: 0.5,
    normal: 1
  },
  normal: {
    fire: 1,
    water: 1,
    grass: 1,
    electric: 1,
    ice: 1,
    rock: 0.5,
    dark: 1,
    light: 1,
    normal: 1
  }
}

// 속성 정보
export const ELEMENT_INFO: Record<ElementType, {
  name: string
  emoji: string
  color: string
  description: string
}> = {
  fire: {
    name: '불',
    emoji: '🔥',
    color: '#ff6b6b',
    description: '풀과 얼음에 강하지만 물과 바위에 약합니다.'
  },
  water: {
    name: '물',
    emoji: '💧',
    color: '#4dabf7',
    description: '불과 바위에 강하지만 풀과 전기에 약합니다.'
  },
  grass: {
    name: '풀',
    emoji: '🌿',
    color: '#51cf66',
    description: '물과 바위에 강하지만 불과 얼음에 약합니다.'
  },
  electric: {
    name: '전기',
    emoji: '⚡',
    color: '#ffd43b',
    description: '물에 강하지만 풀에 약합니다.'
  },
  ice: {
    name: '얼음',
    emoji: '❄️',
    color: '#74c0fc',
    description: '풀에 강하지만 불에 약합니다.'
  },
  rock: {
    name: '바위',
    emoji: '🪨',
    color: '#868e96',
    description: '불과 얼음에 강하지만 물과 풀에 약합니다.'
  },
  dark: {
    name: '어둠',
    emoji: '🌑',
    color: '#495057',
    description: '빛에 강하지만 빛 속성에 약합니다.'
  },
  light: {
    name: '빛',
    emoji: '✨',
    color: '#fff3bf',
    description: '어둠에 강하지만 어둠 속성에 약합니다.'
  },
  normal: {
    name: '무속성',
    emoji: '⚪',
    color: '#adb5bd',
    description: '특별한 상성 관계가 없습니다.'
  }
}

// 속성 상성 메시지
export function getEffectivenessMessage(effectiveness: number): string {
  if (effectiveness >= 2) {
    return '효과가 굉장했다!'
  } else if (effectiveness <= 0.5) {
    return '효과가 별로인 듯하다...'
  }
  return ''
}

// 속성 상성 계산
export function calculateElementalDamage(
  attackerElement: ElementType,
  defenderElement: ElementType,
  baseDamage: number
): {
  damage: number
  effectiveness: number
  message: string
} {
  const effectiveness = ELEMENT_EFFECTIVENESS[attackerElement][defenderElement]
  const damage = Math.floor(baseDamage * effectiveness)
  const message = getEffectivenessMessage(effectiveness)

  return {
    damage,
    effectiveness,
    message
  }
}