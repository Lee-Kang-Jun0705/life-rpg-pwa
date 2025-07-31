'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">
          {isOnline ? '🌐' : '📵'}
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          {isOnline ? '다시 연결되었습니다!' : '오프라인 상태입니다'}
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          {isOnline 
            ? '인터넷에 다시 연결되었습니다. 계속 진행하세요.'
            : '인터넷 연결이 필요한 페이지입니다. 연결 상태를 확인해주세요.'}
        </p>

        <div className="space-y-4">
          {isOnline && (
            <Button onClick={handleRetry} className="w-full">
              페이지 새로고침
            </Button>
          )}

          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="font-semibold mb-2">
              오프라인에서 사용 가능한 기능:
            </h2>
            <ul className="text-sm text-left space-y-1">
              <li>✅ 대시보드 보기</li>
              <li>✅ 캐릭터 확인</li>
              <li>✅ 활동 기록 (자동 동기화)</li>
              <li>✅ 인벤토리 관리</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                대시보드로 이동
              </Button>
            </Link>
            
            <Link href="/character">
              <Button variant="outline" className="w-full">
                캐릭터 페이지로 이동
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-8">
          Life RPG는 오프라인에서도 대부분의 기능을 사용할 수 있도록 설계되었습니다.
          온라인 복귀 시 자동으로 데이터가 동기화됩니다.
        </p>
      </div>
    </main>
  )
}