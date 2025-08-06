import React from 'react'

interface SpeedControlProps {
  currentSpeed: 1 | 2 | 3
  onSpeedChange: (speed: 1 | 2 | 3) => void
}

export default function SpeedControl({ currentSpeed, onSpeedChange }: SpeedControlProps) {
  const speeds: (1 | 2 | 3)[] = [1, 2, 3]

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span className="text-white text-xs sm:text-sm mr-1 sm:mr-2">배속:</span>
      <div className="flex space-x-1">
        {speeds.map(speed => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-lg font-semibold transition-all ${
              currentSpeed === speed
                ? 'bg-purple-600 text-white scale-105 sm:scale-110'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}