// 공통 타입 정의
// 여러 모듈에서 공유하는 기본 타입들

// 스탯 타입 상수
export const STAT_TYPE = {
  HEALTH: 'health',
  LEARNING: 'learning',
  RELATIONSHIP: 'relationship',
  ACHIEVEMENT: 'achievement'
} as const

export type StatType = typeof STAT_TYPE[keyof typeof STAT_TYPE];

// 기본 Result 타입
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 기본 에러 타입
export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'GameError'
  }
}

// 특수 에러 클래스들
export class ValidationError extends GameError {
  constructor(message: string, field: string, value: unknown) {
    super(message, 'VALIDATION_ERROR', { field, value })
    this.name = 'ValidationError'
  }
}

export class ResourceNotFoundError extends GameError {
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType} not found: ${resourceId}`,
      'RESOURCE_NOT_FOUND',
      { resourceType, resourceId }
    )
    this.name = 'ResourceNotFoundError'
  }
}

export class PermissionError extends GameError {
  constructor(action: string, resource: string) {
    super(
      `Permission denied for ${action} on ${resource}`,
      'PERMISSION_DENIED',
      { action, resource }
    )
    this.name = 'PermissionError'
  }
}

export class RateLimitError extends GameError {
  constructor(action: string, limit: number, window: string) {
    super(
      `Rate limit exceeded for ${action}`,
      'RATE_LIMIT_EXCEEDED',
      { action, limit, window }
    )
    this.name = 'RateLimitError'
  }
}

// 페이지네이션 타입
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sort?: SortParams;
}

export interface SortParams {
  readonly field: string;
  readonly order: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

// 시간 관련 타입
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

export interface Schedule {
  readonly daily?: string[]; // HH:MM format
  readonly weekly?: WeeklySchedule;
  readonly monthly?: number[]; // days of month
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type WeeklySchedule = {
  readonly [K in DayOfWeek]?: string[];
}

// 유틸리티 타입
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// ID 타입
export type UserId = string;
export type ItemId = string;
export type DungeonId = string;
export type MonsterId = string;
export type SkillId = string;

// 이벤트 기본 타입
export interface BaseEvent {
  readonly id: string;
  readonly type: string;
  readonly timestamp: Date;
  readonly userId: UserId;
  readonly metadata?: Record<string, unknown>;
}

// 설정 타입
export interface Settings {
  readonly [key: string]: SettingValue;
}

export type SettingValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { [key: string]: SettingValue };

// 응답 타입
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly timestamp: Date;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// 필터 타입
export interface BaseFilter {
  readonly search?: string;
  readonly dateRange?: TimeRange;
  readonly tags?: string[];
  readonly status?: string[];
}

// 통계 타입
export interface BaseStats {
  readonly count: number;
  readonly sum?: number;
  readonly average?: number;
  readonly min?: number;
  readonly max?: number;
}

// 진행도 타입
export interface Progress {
  readonly current: number;
  readonly total: number;
  readonly percentage: number;
  readonly isComplete: boolean;
}

// 좌표 타입
export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Bounds {
  readonly position: Position;
  readonly size: Size;
}

// 색상 타입
export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
}

// 비교 연산자
export type ComparisonOperator =
  | 'eq'  // equal
  | 'ne'  // not equal
  | 'gt'  // greater than
  | 'gte' // greater than or equal
  | 'lt'  // less than
  | 'lte' // less than or equal
  | 'in'  // in array
  | 'nin' // not in array
  | 'like' // string contains
  | 'regex'; // regex match

// 논리 연산자
export type LogicalOperator = 'and' | 'or' | 'not';

// 조건 타입
export interface Condition {
  readonly field: string;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
}

export interface CompositeCondition {
  readonly operator: LogicalOperator;
  readonly conditions: ReadonlyArray<Condition | CompositeCondition>;
}

// 액션 타입
export interface Action {
  readonly type: string;
  readonly payload?: unknown;
  readonly metadata?: ActionMetadata;
}

export interface ActionMetadata {
  readonly timestamp: Date;
  readonly userId?: UserId;
  readonly source?: string;
  readonly version?: string;
}

// 유효성 검사 타입
export interface ValidationRule {
  readonly field: string;
  readonly rules: ReadonlyArray<Validator>;
}

export interface Validator {
  readonly type: ValidatorType;
  readonly params?: unknown;
  readonly message?: string;
}

export type ValidatorType =
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

// 상수 정의
export const CONSTANTS = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEZONE: 'UTC',
  SUPPORTED_LANGUAGES: ['ko', 'en', 'ja', 'zh'] as const,
  SUPPORTED_CURRENCIES: ['KRW', 'USD', 'JPY', 'CNY'] as const
} as const

// 헬퍼 타입 가드
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

export function isGameError(value: unknown): value is GameError {
  return value instanceof GameError
}

export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

// 유틸리티 함수 타입
export type AsyncFunction<T = void, R = void> = (arg: T) => Promise<R>;
export type SyncFunction<T = void, R = void> = (arg: T) => R;
export type Predicate<T> = (value: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;
export type Mapper<T, R> = (value: T) => R;
export type Reducer<T, R> = (acc: R, value: T) => R;
