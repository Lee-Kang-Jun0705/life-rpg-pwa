'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type PerformanceMode = 'high' | 'balanced' | 'low'

interface PerformanceSettings {
  mode: PerformanceMode
  reduceMotion: boolean
  useWebP: boolean
  lazyLoadImages: boolean
  limitAnimations: boolean
  reducedDataUsage: boolean
}

interface PerformanceContextType {
  settings: PerformanceSettings
  updateSettings: (updates: Partial<PerformanceSettings>) => void
  isLowEndDevice: boolean
  networkSpeed: 'slow' | 'medium' | 'fast'
}

const defaultSettings: PerformanceSettings = {
  mode: 'balanced',
  reduceMotion: false,
  useWebP: true,
  lazyLoadImages: true,
  limitAnimations: false,
  reducedDataUsage: false
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings)
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('fast')

  // 기기 성능 감지
  useEffect(() => {
    // 메모리 체크
    const memoryCheck = () => {
      if ('deviceMemory' in navigator) {
        const memory = (navigator as unknown).deviceMemory
        if (memory <= 4) {
          setIsLowEndDevice(true)
        }
      }
    }

    // CPU 코어 체크
    const cpuCheck = () => {
      if ('hardwareConcurrency' in navigator) {
        const cores = navigator.hardwareConcurrency
        if (cores <= 2) {
          setIsLowEndDevice(true)
        }
      }
    }

    // 네트워크 속도 체크
    const networkCheck = () => {
      if ('connection' in navigator) {
        const connection = (navigator as unknown).connection
        if (connection) {
          const effectiveType = connection.effectiveType
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            setNetworkSpeed('slow')
          } else if (effectiveType === '3g') {
            setNetworkSpeed('medium')
          } else {
            setNetworkSpeed('fast')
          }

          // 네트워크 변경 감지
          connection.addEventListener('change', networkCheck)
        }
      }
    }

    // 사용자 설정 확인
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReducedMotion.matches) {
      setSettings(prev => ({ ...prev, reduceMotion: true }))
    }

    // 저장된 설정 로드
    const savedSettings = localStorage.getItem('performanceSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    memoryCheck()
    cpuCheck()
    networkCheck()

    // 저사양 기기인 경우 자동으로 성능 모드 조정
    if (isLowEndDevice) {
      setSettings(prev => ({
        ...prev,
        mode: 'low',
        limitAnimations: true,
        reducedDataUsage: true
      }))
    }
  }, [isLowEndDevice])

  const updateSettings = (updates: Partial<PerformanceSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    localStorage.setItem('performanceSettings', JSON.stringify(newSettings))

    // CSS 변수 업데이트
    if (updates.reduceMotion !== undefined) {
      document.documentElement.style.setProperty(
        '--animation-duration',
        updates.reduceMotion ? '0ms' : '300ms'
      )
    }
  }

  const value: PerformanceContextType = {
    settings,
    updateSettings,
    isLowEndDevice,
    networkSpeed
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance는 PerformanceProvider 내에서 사용되어야 합니다')
  }
  return context
}