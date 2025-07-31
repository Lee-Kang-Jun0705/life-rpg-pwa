import React from 'react'
import { StatActionsProvider } from '@/contexts/StatActionsContext'

interface TestWrapperProps {
  children: React.ReactNode
}

// Mock IndexedDB for tests
if (typeof window !== 'undefined' && !window.indexedDB) {
  require('fake-indexeddb/auto')
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <StatActionsProvider>
      {children}
    </StatActionsProvider>
  )
}