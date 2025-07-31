import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { 
  AutoBattleSystem,
  AutoBattleCharacter,
  BattleAction,
  AUTO_BATTLE_MONSTERS
} from '@/lib/dungeon/auto-battle-system'
import { Stat } from '@/lib/types/dashboard'

interface AutoBattleScreenProps {
  playerStats: Stat[]
  monsterId: string
  onBattleEnd: (victory: boolean, rewards?: { exp: number; coins: number; items: string[] }) => void
}

export function AutoBattleScreen({ playerStats, monsterId, onBattleEnd }: AutoBattleScreenProps) {
  const [battle] = useState(() => new AutoBattleSystem(playerStats, AUTO_BATTLE_MONSTERS[monsterId]))
  const [player, setPlayer] = useState(battle.currentPlayer)
  const [enemy, setEnemy] = useState(battle.currentEnemy)
  const [actions, setActions] = useState<BattleAction[]>([])
  const [battleStatus, setBattleStatus] = useState<'preparing' | 'fighting' | 'finished'>('preparing')
  const [battleSpeed, setBattleSpeed] = useState(1)
  const actionLogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 3초 후 자동 전투 시작
    const prepareTimer = setTimeout(() => {
      setBattleStatus('fighting')
      startBattle()
    }, 3000)

    return () => clearTimeout(prepareTimer)
  }, [])

  const startBattle = async () => {
    const result = await battle.startAutoBattle((action) => {
      // 각 액션마다 상태 업데이트
      setActions(prev => [...prev, action])
      setPlayer({ ...battle.currentPlayer })
      setEnemy({ ...battle.currentEnemy })
      
      // 자동 스크롤
      if (actionLogRef.current) {
        actionLogRef.current.scrollTop = actionLogRef.current.scrollHeight
      }
    })

    setBattleStatus('finished')
    setTimeout(() => {
      onBattleEnd(result.winner === 'player', result.rewards)
    }, 2000)
  }

  const playerHpPercent = (player.stats.hp / player.stats.maxHp) * 100
  const playerMpPercent = (player.stats.mp / player.stats.maxMp) * 100
  const enemyHpPercent = (enemy.stats.hp / enemy.stats.maxHp) * 100

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col">
      {/* 전투 필드 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/30 rounded-full blur-xl animate-float" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/30 rounded-full blur-xl animate-float-delayed" />
        </div>

        {/* 캐릭터들 */}
        <div className="relative h-full flex items-center justify-between px-20">
          {/* 플레이어 */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={battleStatus === 'fighting' ? {
                x: [0, 20, 0],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className="text-8xl mb-4"
            >
              {player.emoji}
            </motion.div>
            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <h3 className="text-white font-bold mb-2">{player.name}</h3>
              {/* HP 바 */}
              <div className="w-40 mb-2">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                    animate={{ width: `${playerHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  HP: {player.stats.hp} / {player.stats.maxHp}
                </p>
              </div>
              {/* MP 바 */}
              <div className="w-40">
                <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                    animate={{ width: `${playerMpPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  MP: {player.stats.mp} / {player.stats.maxMp}
                </p>
              </div>
            </div>
          </motion.div>

          {/* VS 표시 */}
          {battleStatus === 'preparing' && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              exit={{ scale: 0 }}
              className="text-6xl font-bold text-yellow-400 drop-shadow-lg"
            >
              VS
            </motion.div>
          )}

          {/* 전투 이펙트 */}
          <AnimatePresence>
            {actions.slice(-1).map((action, index) => (
              <motion.div
                key={`${action.timestamp}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                {action.skill.animation === 'slash' && (
                  <div className="text-8xl">⚔️</div>
                )}
                {action.skill.animation === 'fireball' && (
                  <div className="text-8xl">🔥</div>
                )}
                {action.skill.animation === 'heal' && (
                  <div className="text-8xl">✨</div>
                )}
                {action.isCritical && (
                  <div className="text-4xl text-yellow-400 font-bold">CRITICAL!</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 적 */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={battleStatus === 'fighting' ? {
                x: [0, -20, 0],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className="text-8xl mb-4"
            >
              {enemy.emoji}
            </motion.div>
            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <h3 className="text-white font-bold mb-2">{enemy.name}</h3>
              {/* HP 바 */}
              <div className="w-40">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-full"
                    animate={{ width: `${enemyHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  HP: {enemy.stats.hp} / {enemy.stats.maxHp}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 전투 결과 */}
        {battleStatus === 'finished' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="text-center">
              <h2 className={`text-6xl font-bold mb-4 ${
                battle.winner === 'player' ? 'text-yellow-400' : 'text-red-500'
              }`}>
                {battle.winner === 'player' ? '승리!' : '패배...'}
              </h2>
              <p className="text-2xl text-white">
                {battle.battleActions.length}턴 만에 전투 종료
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 전투 로그 */}
      <div className="h-48 bg-black/70 border-t border-gray-700">
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <h3 className="text-white font-bold">전투 로그</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">속도:</span>
            <div className="flex gap-1">
              {[0.5, 1, 2, 3].map(speed => (
                <button
                  key={speed}
                  onClick={() => setBattleSpeed(speed)}
                  className={`px-2 py-1 text-xs rounded ${
                    battleSpeed === speed 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div 
          ref={actionLogRef}
          className="h-full overflow-y-auto p-2 space-y-1"
        >
          {actions.map((action, index) => (
            <motion.div
              key={`${action.timestamp}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm p-2 rounded ${
                action.attacker === 'player' 
                  ? 'bg-blue-600/30 text-blue-200' 
                  : 'bg-red-600/30 text-red-200'
              }`}
            >
              <span className="font-bold">
                {action.attacker === 'player' ? player.name : enemy.name}
              </span>
              {' '}의 {action.skill.name}!
              {action.damage && (
                <span className="ml-2">
                  {action.damage} 데미지
                  {action.isCritical && ' (크리티컬!)'}
                </span>
              )}
              {action.healing && (
                <span className="ml-2">{action.healing} HP 회복</span>
              )}
              {action.isDodged && (
                <span className="ml-2">회피됨!</span>
              )}
              {action.effect && (
                <span className="ml-2">{action.effect}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}