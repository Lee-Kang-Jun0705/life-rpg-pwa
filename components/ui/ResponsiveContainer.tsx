'use client'

import React, { useState, useEffect } from 'react'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fallback?: React.ReactNode
}

// 반응형 브레이크포인트
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  breakpoint = 'md',
  fallback 
}: ResponsiveContainerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < breakpoints[breakpoint])
      setIsLoaded(true)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [breakpoint])

  if (!isLoaded) {
    return fallback || <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
  }

  return (
    <div className={`responsive-container ${className}`} data-mobile={isMobile}>
      {children}
    </div>
  )
}

// 화면 크기 감지 훅
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

// 모바일 감지 훅
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// 디바이스 타입 감지
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  return deviceType
}

// 터치 디바이스 감지
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouchDevice
}

// 세이프 에리어 감지 (노치 대응)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0
      })
    }

    updateSafeArea()
    window.addEventListener('orientationchange', updateSafeArea)
    
    return () => window.removeEventListener('orientationchange', updateSafeArea)
  }, [])

  return safeArea
}

// 동적 뷰포트 높이 (모바일 주소창 대응)
export function useDynamicViewportHeight() {
  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    updateVH()
    window.addEventListener('resize', updateVH)
    window.addEventListener('orientationchange', updateVH)
    
    return () => {
      window.removeEventListener('resize', updateVH)
      window.removeEventListener('orientationchange', updateVH)
    }
  }, [])
}