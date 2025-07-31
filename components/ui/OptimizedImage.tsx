'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  fallback?: string
  priority?: boolean
  quality?: number
  sizes?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  fallback = '/images/placeholder.png',
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [inView, setInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer를 사용한 지연 로딩
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  // 최적화된 이미지 URL 생성
  const getOptimizedUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url
    }
    
    // Next.js Image Optimization API 사용
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (quality) params.set('q', quality.toString())
    
    return `/_next/image?url=${encodeURIComponent(url)}&${params.toString()}`
  }

  const imageUrl = error ? fallback : src
  const optimizedUrl = getOptimizedUrl(imageUrl)

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* 플레이스홀더 */}
      {!loaded && placeholder && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{ backgroundImage: `url(${placeholder})` }}
        />
      )}

      {/* 스켈레톤 로딩 */}
      {!loaded && !placeholder && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* 실제 이미지 */}
      {inView && (
        <motion.img
          src={optimizedUrl}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 로딩 오버레이 */}
      {!loaded && inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">이미지를 불러올 수 없습니다</div>
          </div>
        </div>
      )}
    </div>
  )
}

// WebP 지원 확인
export function useWebPSupport() {
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null)

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const dataURL = canvas.toDataURL('image/webp')
      setSupportsWebP(dataURL.indexOf('data:image/webp') === 0)
    }

    checkWebPSupport()
  }, [])

  return supportsWebP
}

// 이미지 포맷 최적화 헬퍼
export function getOptimalImageFormat(originalUrl: string): string {
  const supportsWebP = typeof window !== 'undefined' && 
    document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0

  if (supportsWebP && !originalUrl.includes('.webp')) {
    // WebP 버전이 있다면 사용
    const webpUrl = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    return webpUrl
  }

  return originalUrl
}