'use client'

import { useEffect } from 'react'
import { visibilityManager } from '@/lib/utils/visibility-manager'

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // visibility manager를 window 객체에 노출 (디버깅용)
    if (typeof window !== 'undefined') {
      (window as any).visibilityManager = visibilityManager
    }

    // 초기화 로그
    console.log('[VisibilityProvider] Initialized')

    return () => {
      console.log('[VisibilityProvider] Cleanup')
    }
  }, [])

  return <>{children}</>
}