import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BattleMessage } from '@/lib/types/battle.types'
import { BATTLE_CONFIG } from '@/lib/constants/battle.constants'

interface BattleLogProps {
  battleHistory: BattleMessage[]
  battleEnded: boolean
  playerHp: number
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function BattleLog({
  battleHistory,
  battleEnded,
  playerHp,
  messagesEndRef
}: BattleLogProps) {
  const getMessageColorClass = (type: BattleMessage['type']) => {
    switch (type) {
      case 'damage':
        return 'bg-red-900/30 text-red-300 border border-red-800/50'
      case 'heal':
        return 'bg-green-900/30 text-green-300 border border-green-800/50'
      case 'critical':
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50'
      case 'status':
        return 'bg-purple-900/30 text-purple-300 border border-purple-800/50'
      case 'miss':
        return 'bg-gray-800/30 text-gray-400 border border-gray-700/50'
      case 'start':
        return 'bg-blue-900/30 text-blue-300 border border-blue-800/50'
      case 'end':
        return 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/50'
      default:
        return 'bg-gray-800/30 text-gray-300 border border-gray-700/50'
    }
  }

  return (
    <div className="h-1/3 bg-gray-900/95 backdrop-blur-sm border-t-2 border-gray-700 overflow-y-auto p-4">
      <div className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
        <span>⚔️</span>
        <span>전투 로그</span>
      </div>

      <AnimatePresence mode="popLayout">
        {battleHistory.slice(-BATTLE_CONFIG.MAX_VISIBLE_LOG_COUNT).map((message, index) => {
          const timestamp = message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })

          return (
            <motion.div
              key={`${message.timestamp.getTime()}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`text-base py-2 px-3 mb-1.5 rounded-lg ${getMessageColorClass(message.type)}`}
            >
              <span className="text-xs text-gray-500">[{timestamp}]</span>
              <span className="ml-2 font-medium">{message.text}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div ref={messagesEndRef} />

      {battleEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 mt-2"
        >
          <p className="text-xl font-bold text-white">
            {playerHp > 0 ? '🎉 승리했습니다!' : '💀 패배했습니다...'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
