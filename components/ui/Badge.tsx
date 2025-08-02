import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          // Size variants
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-2.5 py-0.5': size === 'md',
          'text-base px-3 py-1': size === 'lg',
          // Color variants
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': variant === 'default',
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': variant === 'primary',
          'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100': variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': variant === 'danger'
        },
        className
      )}
    >
      {children}
    </span>
  )
}
