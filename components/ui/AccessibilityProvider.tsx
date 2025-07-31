'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilityContextType {
  isHighContrast: boolean
  isReducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  isKeyboardNavigation: boolean
  announceMessage: (message: string) => void
  setHighContrast: (enabled: boolean) => void
  setFontSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium')
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false)

  // 시스템 설정 감지
  useEffect(() => {
    // Reduced Motion 감지
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // High Contrast 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 키보드 네비게이션 감지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardNavigation(true)
        document.body.classList.add('keyboard-nav')
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardNavigation(false)
      document.body.classList.remove('keyboard-nav')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // 저장된 설정 불러오기
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast') === 'true'
    const savedFontSize = localStorage.getItem('fontSize') as unknown || 'medium'
    
    setIsHighContrast(savedHighContrast)
    setFontSize(savedFontSize)
  }, [])

  // High Contrast 설정
  const handleSetHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled)
    localStorage.setItem('highContrast', enabled.toString())
    
    if (enabled) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }

  // 폰트 크기 설정
  const handleSetFontSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setFontSize(size)
    localStorage.setItem('fontSize', size)
    
    // 기존 폰트 크기 클래스 제거
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large')
    // 새 폰트 크기 클래스 추가
    document.documentElement.classList.add(`font-${size}`)
  }

  // 스크린 리더 공지
  const announceMessage = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // 1초 후 제거
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return (
    <AccessibilityContext.Provider value={{
      isHighContrast,
      isReducedMotion,
      fontSize,
      isKeyboardNavigation,
      announceMessage,
      setHighContrast: handleSetHighContrast,
      setFontSize: handleSetFontSize
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// 접근성 설정 컴포넌트
export function AccessibilitySettings() {
  const { 
    isHighContrast, 
    fontSize, 
    setHighContrast, 
    setFontSize,
    announceMessage 
  } = useAccessibility()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">접근성 설정</h3>
      
      {/* 고대비 모드 */}
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="high-contrast" className="text-sm font-medium">
            고대비 모드
          </label>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            텍스트와 배경의 대비를 높여 가독성을 개선합니다
          </p>
        </div>
        <input
          id="high-contrast"
          type="checkbox"
          checked={isHighContrast}
          onChange={(e) => {
            setHighContrast(e.target.checked)
            announceMessage(e.target.checked ? '고대비 모드가 활성화되었습니다' : '고대비 모드가 비활성화되었습니다')
          }}
          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
        />
      </div>

      {/* 폰트 크기 */}
      <div>
        <label className="text-sm font-medium block mb-2">
          폰트 크기
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'small', label: '작게' },
            { value: 'medium', label: '보통' },
            { value: 'large', label: '크게' },
            { value: 'extra-large', label: '매우 크게' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setFontSize(value as unknown)
                announceMessage(`폰트 크기가 ${label}로 변경되었습니다`)
              }}
              className={`
                p-2 text-sm rounded border transition-colors
                ${fontSize === value
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-300'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 키보드 단축키 안내 */}
      <div>
        <h4 className="text-sm font-medium mb-2">키보드 단축키</h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> 다음 요소로 이동</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift + Tab</kbd> 이전 요소로 이동</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> 또는 <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> 활성화</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> 모달 닫기</div>
        </div>
      </div>
    </div>
  )
}

// 포커스 트랩 훅
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, containerRef])
}

// 스킵 링크 컴포넌트
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded focus:font-medium"
    >
      메인 콘텐츠로 건너뛰기
    </a>
  )
}