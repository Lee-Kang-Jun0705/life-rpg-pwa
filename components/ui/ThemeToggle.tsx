'use client'

import React from 'react'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'icon' | 'full'
  size?: 'sm' | 'md' | 'lg'
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6'
}

const buttonSizes = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3'
}

export function ThemeToggle({ variant = 'icon', size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <button
        onClick={() => {
          if (theme === 'light') setTheme('dark')
          else if (theme === 'dark') setTheme('system')
          else setTheme('light')
        }}
        className={`
          ${buttonSizes[size]} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
          focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        `}
        title={`현재: ${theme === 'system' ? '시스템' : theme === 'light' ? '라이트' : '다크'} 모드`}
      >
        <AnimatePresence mode="wait">
          {theme === 'light' && (
            <motion.div
              key="light"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className={`${iconSizes[size]} text-yellow-500`} />
            </motion.div>
          )}
          {theme === 'dark' && (
            <motion.div
              key="dark"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className={`${iconSizes[size]} text-blue-400`} />
            </motion.div>
          )}
          {theme === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Monitor className={`${iconSizes[size]} text-gray-600 dark:text-gray-400`} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {[
        { value: 'light', icon: Sun, label: '라이트' },
        { value: 'dark', icon: Moon, label: '다크' },
        { value: 'system', icon: Monitor, label: '시스템' }
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value as unknown)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}