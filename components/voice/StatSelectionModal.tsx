import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatType, STAT_TYPES } from '@/lib/types/dashboard'

interface StatSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStat: (statType: { type: string; name: string; emoji: string }) => void
}

export const StatSelectionModal = React.memo(function StatSelectionModal({
  isOpen,
  onClose,
  onSelectStat
}: StatSelectionModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleStatSelect = (statType: { type: string; name: string; emoji: string }) => {
    onSelectStat(statType)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative max-w-sm w-full"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">🎤</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  어떤 활동을 기록하시나요?
                </h3>
              </div>

              {/* 스탯 선택 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {STAT_TYPES.map((statType, index) => (
                  <motion.button
                    key={statType.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleStatSelect(statType)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-md hover:shadow-lg gradient-${statType.type}`}
                  >
                    <div className="text-5xl mb-2">{statType.emoji}</div>
                    <span className="text-lg font-bold text-white">
                      {statType.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="닫기"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
