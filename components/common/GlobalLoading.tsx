'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface GlobalLoadingProps {
  isLoading?: boolean
  message?: string
  progress?: number
  variant?: 'default' | 'overlay' | 'minimal'
}

export const GlobalLoading = React.memo(({ 
  isLoading = true, 
  message = '로딩 중...', 
  progress,
  variant = 'default' 
}: GlobalLoadingProps) => {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  // 미니멀 버전 - 작은 스피너만
  if (variant === 'minimal') {
    return (
      <div className="inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
        <span className="text-sm text-gray-400">{message}</span>
      </div>
    )
  }

  // 오버레이 버전 - 전체 화면 덮기
  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900/90 rounded-2xl p-8 max-w-sm w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
              <div className="absolute inset-0 blur-xl bg-purple-500/30 animate-pulse" />
            </div>
            
            <p className="mt-4 text-white font-medium text-lg">
              {message}{dots}
            </p>

            {progress !== undefined && (
              <div className="w-full mt-4">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 text-center mt-2">
                  {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 기본 버전 - 중앙 정렬된 로딩 화면
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative">
        {/* 외부 링 애니메이션 */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
        
        {/* 내부 링 애니메이션 */}
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
          <div className="absolute inset-0 blur-2xl bg-purple-500/20 animate-pulse" />
        </div>
      </div>
      
      <p className="mt-6 text-lg font-medium text-white">
        {message}{dots}
      </p>

      {progress !== undefined && (
        <div className="w-64 mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            >
              {/* 빛나는 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mt-2">
            {Math.round(progress)}% 완료
          </p>
        </div>
      )}

      {/* 추가 정보 텍스트 */}
      <p className="text-xs text-gray-500 mt-4 text-center max-w-xs">
        잠시만 기다려주세요. 최고의 경험을 준비하고 있습니다.
      </p>
    </div>
  )
})

GlobalLoading.displayName = 'GlobalLoading'

// 로딩 스켈레톤 컴포넌트
export const LoadingSkeleton = React.memo(({ 
  className = '', 
  variant = 'text' 
}: { 
  className?: string
  variant?: 'text' | 'box' | 'circle' | 'card'
}) => {
  const baseClass = 'animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-shimmer'
  
  const variantClasses = {
    text: 'h-4 rounded',
    box: 'rounded-lg',
    circle: 'rounded-full',
    card: 'rounded-xl'
  }

  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'