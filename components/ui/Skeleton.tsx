'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
  animated?: boolean
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true
}: SkeletonProps) {

  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  const animationClasses = animated ? 'animate-pulse' : ''

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded'
      case 'circular':
        return 'rounded-full'
      case 'rounded':
        return 'rounded-lg'
      case 'rectangular':
      default:
        return 'rounded'
    }
  }

  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${animationClasses}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%'
            }}
            initial={animated ? { opacity: 0.5 } : undefined}
            animate={animated ? { opacity: [0.5, 1, 0.5] } : undefined}
            transition={animated ? {
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1
            } : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${getVariantClasses()} ${animationClasses} ${className}`}
      style={style}
      initial={animated ? { opacity: 0.5 } : undefined}
      animate={animated ? { opacity: [0.5, 1, 0.5] } : undefined}
      transition={animated ? { duration: 1.5, repeat: Infinity } : undefined}
    />
  )
}

// 미리 정의된 스켈레톤 컴포넌트들
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={60} height={32} />
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="70%" className="mb-2" />
        <Skeleton variant="text" width="50%" />
      </div>
      <Skeleton variant="rounded" width={60} height={24} />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton variant="text" width="80%" height={32} className="mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 헤더 */}
      <div className="grid gap-4 p-4 border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" width="80%" />
        ))}
      </div>

      {/* 행들 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" width={colIndex === 0 ? '60%' : '90%'} />
          ))}
        </div>
      ))}
    </div>
  )
}
