'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 시스템 테마 감지 함수
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// 테마 적용 함수
const applyTheme = (theme: 'light' | 'dark') => {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}

export const ThemeProvider = React.memo(function ThemeProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // 테마 설정 함수 - 메모이제이션
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  // 초기 마운트 시 테마 로드
  useEffect(() => {
    setMounted(true)

    // 로컬 스토리지에서 저장된 테마 가져오기
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // 테마 변경 시 처리
  useEffect(() => {
    if (!mounted) {
      return
    }

    const systemTheme = getSystemTheme()
    const appliedTheme = theme === 'system' ? systemTheme : theme as 'light' | 'dark'

    setResolvedTheme(appliedTheme)
    applyTheme(appliedTheme)
  }, [theme, mounted])

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!mounted || theme !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      applyTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Context value 메모이제이션
  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    setTheme,
    resolvedTheme
  }), [theme, setTheme, resolvedTheme])

  // 마운트 전에는 자식 컴포넌트만 렌더링
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
})

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 테마 관련 유틸리티 함수들
export const themeUtils = {
  getSystemTheme,
  applyTheme,
  isValidTheme: (theme: string): theme is Theme => {
    return ['light', 'dark', 'system'].includes(theme)
  }
}
