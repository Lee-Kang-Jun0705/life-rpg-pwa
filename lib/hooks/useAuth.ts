/**
 * 인증 관련 커스텀 훅
 * 현재는 하드코딩된 userId를 반환하지만, 추후 실제 인증 시스템과 연동
 */

import { useEffect, useState } from 'react'

interface AuthState {
  userId: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // SSR을 고려한 초기 상태 설정
    if (typeof window === 'undefined') {
      return {
        userId: null,
        isLoading: true,
        isAuthenticated: false
      }
    }

    // 클라이언트에서는 즉시 localStorage 확인
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      return {
        userId: storedUserId,
        isLoading: false,
        isAuthenticated: true
      }
    }

    // userId가 없으면 기본값 설정
    const defaultUserId = 'user-1'
    localStorage.setItem('userId', defaultUserId)
    return {
      userId: defaultUserId,
      isLoading: false,
      isAuthenticated: true
    }
  })

  useEffect(() => {
    // SSR 환경에서만 실행
    if (typeof window === 'undefined' || authState.userId) {
      return
    }

    // TODO: 실제 인증 시스템 구현
    // 현재는 로컬 스토리지에서 userId 가져오기
    const storedUserId = localStorage.getItem('userId')

    if (storedUserId) {
      setAuthState({
        userId: storedUserId,
        isLoading: false,
        isAuthenticated: true
      })
    } else {
      // 임시로 기본 userId 설정
      const defaultUserId = 'user-1'
      localStorage.setItem('userId', defaultUserId)
      setAuthState({
        userId: defaultUserId,
        isLoading: false,
        isAuthenticated: true
      })
    }
  }, [])

  return {
    userId: authState.userId,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated
  }
}
