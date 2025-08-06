'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import type { UseDashboardReturn } from '@/hooks/useDashboard/types'

const DashboardContext = createContext<UseDashboardReturn | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const dashboardState = useDashboard()

  return (
    <DashboardContext.Provider value={dashboardState}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}