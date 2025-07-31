export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'database' | 'network' | 'validation' | 'auth' | 'business' | 'system'

export interface AppError extends Error {
  code: string
  severity: ErrorSeverity
  category: ErrorCategory
  recoverable: boolean
  userMessage: string
  technicalDetails?: Record<string, string | number | boolean | null>
  timestamp: Date
}

export interface ErrorNotification {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  duration?: number
}

class ErrorManager {
  private static instance: ErrorManager
  private errorListeners: ((notification: ErrorNotification) => void)[] = []
  private errorLog: AppError[] = []
  private maxLogSize = 100

  private constructor() {}

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager()
    }
    return ErrorManager.instance
  }

  /**
   * 에러 로깅 및 처리
   */
  logError(error: Error | AppError, context?: Record<string, string | number | boolean | null>): void {
    const appError = this.normalizeError(error, context)
    
    // 에러 로그에 추가
    this.errorLog.unshift(appError)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop()
    }

    // 콘솔에 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorManager]', appError.code, appError.message, {
        severity: appError.severity,
        category: appError.category,
        context,
        stack: appError.stack
      })
    }

    // 프로덕션 환경에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(appError, context)
    }

    // 중요한 에러는 사용자에게 알림
    if (appError.severity === 'high' || appError.severity === 'critical') {
      this.notifyUser(appError.userMessage, 'error')
    }
  }

  /**
   * 사용자 알림
   */
  notifyUser(message: string, type: 'error' | 'warning' | 'info' = 'error', duration?: number): void {
    const notification: ErrorNotification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      duration: duration || (type === 'error' ? 5000 : 3000)
    }

    this.errorListeners.forEach(listener => listener(notification))
  }

  /**
   * 에러 알림 리스너 등록
   */
  addErrorListener(listener: (notification: ErrorNotification) => void): () => void {
    this.errorListeners.push(listener)
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener)
    }
  }

  /**
   * 에러 정규화
   */
  private normalizeError(error: Error | { code?: string; name?: string; message?: string; stack?: string }, context?: Record<string, string | number | boolean | null>): AppError {
    if (this.isAppError(error)) {
      return error
    }

    // 기본 에러를 AppError로 변환
    const err = error as Error & { code?: string }
    const appError: AppError = {
      name: err.name || 'UnknownError',
      message: err.message || '알 수 없는 오류가 발생했습니다',
      code: err.code || 'UNKNOWN_ERROR',
      severity: this.determineSeverity(error),
      category: this.determineCategory(error),
      recoverable: true,
      userMessage: this.generateUserMessage(error),
      technicalDetails: context,
      timestamp: new Date(),
      stack: err.stack
    }

    return appError
  }

  /**
   * AppError 타입 가드
   */
  private isAppError(error: unknown): error is AppError {
    const err = error as Record<string, unknown>
    return err !== null && 
           typeof err === 'object' &&
           typeof err.code === 'string' && 
           typeof err.severity === 'string' &&
           typeof err.category === 'string' &&
           typeof err.recoverable === 'boolean' &&
           typeof err.userMessage === 'string'
  }

  /**
   * 에러 심각도 결정
   */
  private determineSeverity(error: unknown): ErrorSeverity {
    const err = error as Error & { code?: string }
    // 네트워크 에러
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return 'medium'
    }
    
    // 인증 에러
    if (err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
      return 'high'
    }
    
    // 검증 에러
    if (err.name === 'ValidationError') {
      return 'low'
    }
    
    // 데이터베이스 에러
    if (err.name === 'DatabaseError' || err.code?.startsWith('DB_')) {
      return 'high'
    }
    
    return 'medium'
  }

  /**
   * 에러 카테고리 결정
   */
  private determineCategory(error: unknown): ErrorCategory {
    const err = error as Error & { code?: string }
    if (err.code?.startsWith('DB_') || err.name === 'DatabaseError') {
      return 'database'
    }
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.name === 'NetworkError') {
      return 'network'
    }
    
    if (err.name === 'ValidationError' || err.code?.startsWith('VALIDATION_')) {
      return 'validation'
    }
    
    if (err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
      return 'auth'
    }
    
    if (err.code?.startsWith('BUSINESS_')) {
      return 'business'
    }
    
    return 'system'
  }

  /**
   * 사용자 친화적 메시지 생성
   */
  private generateUserMessage(error: unknown): string {
    const err = error as Error & { code?: string }
    const messageMap: Record<string, string> = {
      'ECONNREFUSED': '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      'ETIMEDOUT': '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.',
      'UNAUTHORIZED': '로그인이 필요합니다.',
      'FORBIDDEN': '접근 권한이 없습니다.',
      'DB_CONNECTION_ERROR': '데이터베이스 연결에 실패했습니다.',
      'VALIDATION_ERROR': '입력한 정보를 다시 확인해주세요.'
    }

    return messageMap[err.code || ''] || '작업 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  /**
   * 외부 로깅 서비스로 전송 (프로덕션)
   */
  private sendToLoggingService(error: AppError, context?: Record<string, string | number | boolean | null>): void {
    // TODO: Sentry, LogRocket 등 외부 서비스 연동
    // 예시:
    // Sentry.captureException(error, {
    //   level: error.severity,
    //   tags: {
    //     category: error.category,
    //     code: error.code
    //   },
    //   extra: context
    // })
  }

  /**
   * 에러 로그 가져오기
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  /**
   * 에러 로그 지우기
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * 특정 카테고리의 에러만 필터링
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errorLog.filter(error => error.category === category)
  }

  /**
   * 특정 심각도 이상의 에러만 필터링
   */
  getErrorsBySeverity(minSeverity: ErrorSeverity): AppError[] {
    const severityOrder: Record<ErrorSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    }
    
    const minLevel = severityOrder[minSeverity]
    return this.errorLog.filter(error => severityOrder[error.severity] >= minLevel)
  }
}

// 싱글톤 인스턴스 export
export const errorManager = ErrorManager.getInstance()

// 헬퍼 함수들
export function createAppError(
  code: string,
  message: string,
  options: Partial<AppError> = {}
): AppError {
  return {
    name: 'AppError',
    code,
    message,
    severity: options.severity || 'medium',
    category: options.category || 'system',
    recoverable: options.recoverable !== false,
    userMessage: options.userMessage || message,
    technicalDetails: options.technicalDetails,
    timestamp: new Date(),
    stack: new Error().stack,
    ...options
  }
}

// 일반적인 에러 생성 함수들
export const CommonErrors = {
  networkError: (message = '네트워크 연결에 실패했습니다') => 
    createAppError('NETWORK_ERROR', message, {
      category: 'network',
      severity: 'medium',
      recoverable: true
    }),

  databaseError: (message = '데이터베이스 작업 중 오류가 발생했습니다') =>
    createAppError('DB_ERROR', message, {
      category: 'database',
      severity: 'high',
      recoverable: false
    }),

  validationError: (message = '입력 값이 올바르지 않습니다') =>
    createAppError('VALIDATION_ERROR', message, {
      category: 'validation',
      severity: 'low',
      recoverable: true
    }),

  authError: (message = '인증에 실패했습니다') =>
    createAppError('AUTH_ERROR', message, {
      category: 'auth',
      severity: 'high',
      recoverable: true
    }),

  businessError: (code: string, message: string) =>
    createAppError(`BUSINESS_${code}`, message, {
      category: 'business',
      severity: 'medium',
      recoverable: true
    })
}