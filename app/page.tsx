'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 루트 경로 접속 시 자동으로 대시보드로 리다이렉트
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Life RPG</h1>
        <p className="text-gray-600">대시보드로 이동 중...</p>
      </div>
    </div>
  )
}
