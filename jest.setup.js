// Jest setup file
require('@testing-library/jest-dom')
require('fake-indexeddb/auto')

// React 전역 설정
global.React = require('react')

// IndexedDB 전역 설정
const FDBFactory = require('fake-indexeddb/lib/FDBFactory')
const FDBDatabase = require('fake-indexeddb/lib/FDBDatabase')
const FDBCursor = require('fake-indexeddb/lib/FDBCursor')
const FDBCursorWithValue = require('fake-indexeddb/lib/FDBCursorWithValue')
const FDBIndex = require('fake-indexeddb/lib/FDBIndex')
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')
const FDBObjectStore = require('fake-indexeddb/lib/FDBObjectStore')
const FDBOpenDBRequest = require('fake-indexeddb/lib/FDBOpenDBRequest')
const FDBRequest = require('fake-indexeddb/lib/FDBRequest')
const FDBTransaction = require('fake-indexeddb/lib/FDBTransaction')
const FDBVersionChangeEvent = require('fake-indexeddb/lib/FDBVersionChangeEvent')

global.indexedDB = new FDBFactory()
global.IDBDatabase = FDBDatabase
global.IDBCursor = FDBCursor
global.IDBCursorWithValue = FDBCursorWithValue
global.IDBFactory = FDBFactory
global.IDBIndex = FDBIndex
global.IDBKeyRange = FDBKeyRange
global.IDBObjectStore = FDBObjectStore
global.IDBOpenDBRequest = FDBOpenDBRequest
global.IDBRequest = FDBRequest
global.IDBTransaction = FDBTransaction
global.IDBVersionChangeEvent = FDBVersionChangeEvent

// Crypto API 모킹
const crypto = {
  subtle: {
    digest: jest.fn(async(algorithm, data) => {
      return new ArrayBuffer(32)
    }),
    generateKey: jest.fn(async() => ({ type: 'secret' })),
    importKey: jest.fn(async() => ({ type: 'secret' })),
    deriveKey: jest.fn(async() => ({ type: 'secret' })),
    deriveBits: jest.fn(async() => new ArrayBuffer(32)),
    encrypt: jest.fn(async(algorithm, key, data) => {
      // 실제 암호화를 시뮬레이션
      const encoder = new TextEncoder()
      const decoded = encoder.encode('encrypted-' + Date.now())
      return decoded.buffer
    }),
    decrypt: jest.fn(async(algorithm, key, data) => {
      // 실제 복호화를 시뮬레이션
      const encoder = new TextEncoder()
      const decoded = encoder.encode('decrypted-data')
      return decoded.buffer
    }),
    exportKey: jest.fn(async() => new ArrayBuffer(32))
  },
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
  randomUUID: jest.fn(() => 'test-uuid-' + Date.now())
}

// Assign to global
Object.defineProperty(global, 'crypto', {
  value: crypto,
  writable: true,
  configurable: true
})

// Next.js Router 모킹
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      reload: jest.fn()
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// matchMedia 모킹
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// navigator 속성 모킹
Object.defineProperty(navigator, 'language', {
  value: 'ko-KR',
  configurable: true
})

// TextEncoder/TextDecoder polyfill
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// structuredClone polyfill
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}

// Audio API 모킹
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 0,
  loop: false,
  src: ''
}))

// AudioContext 모킹
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    },
    connect: jest.fn()
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn()
  })),
  destination: {},
  currentTime: 0
}))

// navigator.vibrate 모킹
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true
})

// IntersectionObserver 모킹
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// ResizeObserver 모킹
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Performance API 모킹
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
}

// 전역 db Mock 설정
global.db = {
  stats: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(1),
    add: jest.fn().mockResolvedValue(1),
    toArray: jest.fn().mockResolvedValue([]),
    orderBy: jest.fn().mockReturnThis(),
    reverse: jest.fn().mockReturnThis(),
    sortBy: jest.fn().mockResolvedValue([])
  },
  activities: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue(1),
    toArray: jest.fn().mockResolvedValue([]),
    reverse: jest.fn().mockReturnThis(),
    sortBy: jest.fn().mockResolvedValue([])
  },
  dungeonProgress: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    add: jest.fn().mockResolvedValue(1),
    put: jest.fn().mockResolvedValue(1),
    toArray: jest.fn().mockResolvedValue([]),
    modify: jest.fn().mockResolvedValue(1)
  },
  profiles: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    add: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue(1)
  },
  characters: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    add: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue(1)
  },
  quests: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1)
  },
  achievements: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue(1)
  },
  items: {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1)
  },
  settings: {
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn().mockResolvedValue(1)
  }
}

// 테스트 후 정리
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})
