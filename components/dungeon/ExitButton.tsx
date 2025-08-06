import React from 'react'

interface ExitButtonProps {
  onExit: () => void
}

export default function ExitButton({ onExit }: ExitButtonProps) {
  return (
    <button
      onClick={onExit}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center space-x-2"
    >
      <span>🚪</span>
      <span>나가기</span>
    </button>
  )
}