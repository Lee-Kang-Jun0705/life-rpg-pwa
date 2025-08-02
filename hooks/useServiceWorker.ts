import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [isReady, setIsReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setError(new Error('Service Worker not supported'))
      return
    }

    const registerSW = async() => {
      try {
        // Next-PWA가 자동으로 생성한 Service Worker 등록
        const reg = await navigator.serviceWorker.ready
        setRegistration(reg)
        setIsReady(true)

        // 커스텀 Service Worker 등록
        if (reg.active) {
          // sw-custom.js를 통해 추가 기능 활성화
          reg.active.postMessage({ type: 'INIT_CUSTOM_SW' })
        }

        // Service Worker 업데이트 체크
        if (reg.waiting) {
          // 새 버전이 대기 중인 경우
          if (window.confirm('새 버전이 있습니다. 업데이트하시겠습니까?')) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        }

        // 업데이트 이벤트 리스너
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전 설치됨
                console.log('새로운 Service Worker가 설치되었습니다.')
              }
            })
          }
        })
      } catch (err) {
        console.error('Service Worker 등록 실패:', err)
        setError(err as Error)
      }
    }

    registerSW()

    // Service Worker 메시지 리스너
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('캐시가 업데이트되었습니다.')
      }
    }

    navigator.serviceWorker.addEventListener('message', messageHandler)

    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler)
    }
  }, [])

  return {
    isReady,
    registration,
    error,
    update: async() => {
      if (registration) {
        try {
          await registration.update()
        } catch (err) {
          console.error('Service Worker 업데이트 실패:', err)
        }
      }
    }
  }
}
