/**
 * 공통 스타일 유틸리티
 * 반복되는 Tailwind 클래스 조합을 미리 정의하여 코드 일관성 향상
 */

// 버튼 스타일
export const buttonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  purple: 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed',

  // 크기별
  small: 'py-1 px-2 text-sm rounded',
  medium: 'py-2 px-4 rounded-lg',
  large: 'py-3 px-6 text-lg rounded-lg',

  // 너비별
  full: 'w-full',
  auto: 'w-auto',

  // 기본 패딩과 flex 조합
  flexCenter: 'flex items-center justify-center gap-2',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center gap-2',

  // 전환 효과
  transition: 'transition-colors duration-200',
  transitionAll: 'transition-all duration-200'
} as const

// 카드 스타일
export const cardStyles = {
  base: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  hover: 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
  padding: {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  },

  // 특별한 카드 타입
  stat: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
  achievement: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
  dungeon: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
} as const

// 배경 그라디언트
export const backgroundStyles = {
  battle: 'bg-gradient-to-b from-indigo-900 to-purple-900',
  adventure: 'bg-gradient-to-br from-green-900 to-blue-900',
  dungeon: 'bg-gradient-to-b from-purple-900 to-indigo-900',

  // 오버레이
  overlay: 'fixed inset-0',
  overlayCenter: 'fixed inset-0 flex items-center justify-center',

  // 애니메이션 오버레이
  pulseOverlay: 'absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse'
} as const

// 입력 필드 스타일
export const inputStyles = {
  base: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  background: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
  placeholder: 'placeholder-gray-500 dark:placeholder-gray-400',

  // 조합된 스타일
  default: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
} as const

// 텍스트 스타일
export const textStyles = {
  heading: {
    h1: 'text-3xl font-bold text-gray-900 dark:text-white',
    h2: 'text-2xl font-semibold text-gray-800 dark:text-gray-200',
    h3: 'text-xl font-semibold text-gray-800 dark:text-gray-200',
    h4: 'text-lg font-medium text-gray-700 dark:text-gray-300'
  },

  body: {
    large: 'text-lg text-gray-700 dark:text-gray-300',
    normal: 'text-base text-gray-600 dark:text-gray-400',
    small: 'text-sm text-gray-500 dark:text-gray-500'
  },

  // 상태별 텍스트
  status: {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
} as const

// 레이아웃 유틸리티
export const layoutStyles = {
  container: 'container mx-auto px-4',
  section: 'py-8',
  grid: {
    auto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    fixed2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    fixed3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    fixed4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
  },

  // Flex 레이아웃
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
    wrap: 'flex flex-wrap gap-2'
  }
} as const

// 애니메이션 유틸리티
export const animationStyles = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',

  // 커스텀 애니메이션 (tailwind.config.ts에서 정의 필요)
  floatUp: 'animate-float-up',
  scaleIn: 'animate-scale-in'
} as const

// 스타일 조합 헬퍼 함수
export const combineStyles = (...styles: (string | undefined | false | null)[]): string => {
  return styles.filter(Boolean).join(' ')
}

// 조건부 스타일 헬퍼
export const conditionalStyle = (condition: boolean, trueStyle: string, falseStyle?: string): string => {
  return condition ? trueStyle : (falseStyle || '')
}

// 버튼 스타일 조합 헬퍼
export const getButtonStyle = (
  variant: keyof typeof buttonStyles = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium',
  width: 'auto' | 'full' = 'auto',
  disabled = false
): string => {
  return combineStyles(
    buttonStyles[variant],
    buttonStyles[size],
    buttonStyles[width],
    buttonStyles.flexCenter,
    buttonStyles.transition,
    disabled && 'opacity-50 cursor-not-allowed'
  )
}

// 카드 스타일 조합 헬퍼
export const getCardStyle = (
  type: 'base' | 'stat' | 'achievement' | 'dungeon' = 'base',
  padding: keyof typeof cardStyles.padding = 'medium',
  hover = true
): string => {
  return combineStyles(
    cardStyles.base,
    hover && cardStyles.hover,
    cardStyles.padding[padding],
    type !== 'base' && cardStyles[type],
    buttonStyles.transition
  )
}
