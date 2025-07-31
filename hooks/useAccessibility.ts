import { useEffect } from 'react'

export function useAccessibility() {
  useEffect(() => {
    // 키보드 네비게이션 향상
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab 키로 네비게이션 시 포커스 표시
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav')
      }
    }

    const handleMouseDown = () => {
      // 마우스 사용 시 포커스 링 숨김
      document.body.classList.remove('keyboard-nav')
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // 스크린 리더 전용 텍스트를 위한 클래스
  const srOnly = 'sr-only'

  // 포커스 트랩을 위한 유틸리티
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )
    const firstFocusableElement = focusableElements[0] as HTMLElement
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    firstFocusableElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }

  return {
    srOnly,
    trapFocus,
  }
}