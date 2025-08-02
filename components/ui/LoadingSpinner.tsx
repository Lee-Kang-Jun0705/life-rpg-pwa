'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  className?: string
}

export function LoadingSpinner({
  size = 'medium',
  message,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
        <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
      </div>
      {message && (
        <p className="mt-4 text-gray-300 text-sm">{message}</p>
      )}
    </div>
  )
}
