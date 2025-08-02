// 에러 처리 유틸리티

export class AppError extends Error {
  public readonly code: string
  public readonly details?: unknown
  public readonly timestamp: Date

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

// 에러 타입별 클래스들
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', { field })
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 'DATABASE_ERROR', { operation })
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', { statusCode })
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(message, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class PermissionError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(message, 'PERMISSION_ERROR')
    this.name = 'PermissionError'
  }
}

// 에러 타입 가드
export function isAppError(_error: unknown): error is AppError {
  return error instanceof AppError
}

export function isValidationError(_error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isDatabaseError(_error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

export function isNetworkError(_error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

// 에러 처리 헬퍼
export function handleError(_error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'GENERIC_ERROR', {
      stack: error.stack,
      originalError: error.name
    })
  }

  if (typeof error === 'string') {
    return new AppError(error, 'STRING_ERROR')
  }

  return new AppError('알 수 없는 오류가 발생했습니다', 'UNKNOWN_ERROR', { error })
}

// 에러 로깅
export function logError(_error: AppError | Error, context?: string) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...(isAppError(error) ? {
      code: error.code,
      details: error.details
    } : {})
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', errorInfo)
  } else {
    // 프로덕션에서는 외부 로깅 서비스로 전송
    // 예: Sentry, LogRocket, DataDog 등
    console.error('Error logged:', error.message)
  }
}

// 재시도 로직
export async function withRetry<T>(
  _fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? _error : new Error(String(error))

      if (attempt === maxRetries) {
        throw new AppError(
          `${maxRetries}번 시도 후 실패: ${lastError.message}`,
          'RETRY_EXHAUSTED',
          { attempts: maxRetries, lastError }
        )
      }

      // 지수 백오프
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// 안전한 비동기 실행
export async function safeAsync<T>(
  _fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    const appError = handleError(error)
    logError(appError)
    return { _error: appError, data: fallback }
  }
}

// 경계 조건 검사
export function assertNonNull<T>(
  value: T | null | undefined,
  message = '값이 null 또는 undefined입니다'
): T {
  if (value == null) {
    throw new ValidationError(message)
  }
  return value
}

export function assertIsNumber(
  value: unknown,
  message = '숫자가 아닙니다'
): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(message)
  }
  return value
}

export function assertIsString(
  value: unknown,
  message = '문자열이 아닙니다'
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(message)
  }
  return value
}

export function assertIsArray<T>(
  value: unknown,
  message = '배열이 아닙니다'
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(message)
  }
  return value
}

// 에러 경계 컴포넌트용 유틸리티
export function getErrorMessage(_error: Error): string {
  if (isAppError(error)) {
    return error.message
  }

  switch (error.name) {
    case 'ChunkLoadError':
      return '페이지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.'
    case 'NetworkError':
      return '네트워크 연결을 확인해주세요.'
    default:
      return '예상치 못한 오류가 발생했습니다.'
  }
}

export function getErrorRecoveryAction(_error: Error): {
  label: string;
  action: () => void
} | null {
  if (error.name === 'ChunkLoadError') {
    return {
      label: '페이지 새로고침',
      action: () => window.location.reload()
    }
  }

  return {
    label: '다시 시도',
    action: () => window.location.reload()
  }
}
