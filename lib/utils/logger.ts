/**
 * 로거 유틸리티
 * 개발 환경에서만 로그 출력
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data)
    }
  },

  time: (label: string) => {
    if (isDevelopment) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  }
}

// 프로덕션에서 전역 console 객체 재정의 (선택적)
if (!isDevelopment && typeof window !== 'undefined') {
  window.console.log = () => {}
  window.console.debug = () => {}
  window.console.info = () => {}
  window.console.warn = () => {}
}

// 전문 로거 생성 함수
const createPrefixedLogger = (prefix: string) => ({
  log: (...args: unknown[]) => logger.log(`[${prefix}]`, ...args),
  error: (...args: unknown[]) => logger.error(`[${prefix}]`, ...args),
  warn: (...args: unknown[]) => logger.warn(`[${prefix}]`, ...args),
  info: (...args: unknown[]) => logger.info(`[${prefix}]`, ...args),
  debug: (...args: unknown[]) => logger.debug(`[${prefix}]`, ...args)
})

// 던전 전용 로거
export const dungeonLogger = createPrefixedLogger('Dungeon')

// 전투 전용 로거
export const battleLogger = createPrefixedLogger('Battle')
