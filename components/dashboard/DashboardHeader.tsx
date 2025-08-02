import React from 'react'

export const DashboardHeader = React.memo(function DashboardHeader() {
  return (
    <div className="mb-4 text-center pt-2">
      <h1 className="text-2xl font-black flex items-center justify-center gap-2">
        <span className="text-3xl">🎮</span>
        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Life RPG</span>
        <span className="text-3xl">⚔️</span>
      </h1>
    </div>
  )
})
