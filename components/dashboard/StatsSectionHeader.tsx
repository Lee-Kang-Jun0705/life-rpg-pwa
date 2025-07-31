import React from 'react'

export const StatsSectionHeader = React.memo(function StatsSectionHeader() {
  return (
    <div className="text-center mb-6 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
      <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-full shadow-lg">
        <span className="text-3xl animate-wiggle">🎯</span>
        <h2 className="text-2xl font-black text-gray-800">
          스탯 올리기
        </h2>
        <span className="text-3xl animate-wiggle" style={{ animationDelay: '0.5s' }}>📈</span>
      </div>
    </div>
  )
})