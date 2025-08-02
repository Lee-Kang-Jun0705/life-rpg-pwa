import { useState, useEffect } from 'react'

// Network Information API types
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  addEventListener(type: 'change', listener: () => void): void
  removeEventListener(type: 'change', listener: () => void): void
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>
  }
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    // 초기 상태 설정
    setIsOffline(!navigator.onLine)

    // 연결 속도 확인
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection
      if (connection) {
        // 2G 이하의 느린 연결 감지
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g'
        )

        // 연결 상태 변경 감지
        const handleConnectionChange = () => {
          setIsSlowConnection(
            connection.effectiveType === 'slow-2g' ||
            connection.effectiveType === '2g'
          )
        }

        connection.addEventListener('change', handleConnectionChange)
        return () => {
          connection.removeEventListener('change', handleConnectionChange)
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      console.log('📶 온라인 상태로 전환되었습니다')

      // 백그라운드 동기화 요청
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          return (registration as ServiceWorkerRegistrationWithSync).sync.register('sync-data')
        }).catch(err => {
          console.error('백그라운드 동기화 등록 실패:', err)
        })
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      console.log('📵 오프라인 상태로 전환되었습니다')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOffline,
    isSlowConnection,
    isOnline: !isOffline
  }
}
