'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox

      // 서비스 워커가 업데이트를 기다리고 있을 때
      const promptNewVersionAvailable = (event: WorkboxEvent) => {
        if (confirm('새로운 버전이 있습니다. 업데이트하시겠습니까?')) {
          wb.addEventListener('controlling', () => {
            window.location.reload()
          })

          wb.messageSkipWaiting()
        }
      }

      wb.addEventListener('waiting', promptNewVersionAvailable)

      // 서비스 워커 등록
      wb.register()
    }
  }, [])

  return <>{children}</>
}
