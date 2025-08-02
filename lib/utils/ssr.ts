// SSR 관련 유틸리티 함수

/**
 * 클라이언트 환경인지 확인
 */
export const isClient = () => typeof window !== 'undefined'

/**
 * 서버 환경인지 확인
 */
export const isServer = () => typeof window === 'undefined'

/**
 * SSR 안전 실행 래퍼
 * 클라이언트에서만 함수를 실행하고, 서버에서는 기본값 반환
 */
export function clientOnly<T>(fn: () => T, defaultValue: T): T {
  if (isClient()) {
    return fn()
  }
  return defaultValue
}

/**
 * SSR 안전 비동기 실행 래퍼
 */
export async function clientOnlyAsync<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  if (isClient()) {
    return await fn()
  }
  return defaultValue
}

/**
 * SSR 안전 localStorage 래퍼
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isClient()) {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (isClient()) {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (isClient()) {
      localStorage.removeItem(key)
    }
  },
  clear: (): void => {
    if (isClient()) {
      localStorage.clear()
    }
  }
}

/**
 * SSR 안전 sessionStorage 래퍼
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (isClient()) {
      return sessionStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (isClient()) {
      sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (isClient()) {
      sessionStorage.removeItem(key)
    }
  },
  clear: (): void => {
    if (isClient()) {
      sessionStorage.clear()
    }
  }
}

/**
 * SSR 안전 JSON 파싱
 */
export function safeJSONParse<T>(value: string | null, defaultValue: T): T {
  if (!value) {
    return defaultValue
  }

  try {
    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

/**
 * SSR 안전 콜백 실행
 */
export function withClientSideEffect(callback: () => void | (() => void)) {
  if (isClient()) {
    return callback()
  }
  return undefined
}
