'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sword, Shield, Trophy, X, Zap } from 'lucide-react'
import { useBattleStore } from '@/lib/stores/battleStore'
import { statFormulas } from '@/lib/utils/stat-calculator'

interface EnemyData {
  name: string
  emoji: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed?: number
  specialAbility?: string | null
  id: number
}

interface SimpleBattleScreenProps {
  enemies: Array<{
    name: string
    emoji: string
    stats: {
      hp: number
      attack: number
      defense: number
      speed?: number
      specialAbility?: string | null
    }
  }>
  enemyLevel: number
  playerLevel?: number
  initialHpRatio?: number
  onBattleEnd: (victory: boolean, hpRatio?: number) => void
  floorInfo?: {
    currentFloor: number
    totalFloors: number
    dungeonName: string
  }
}

interface BattleMessage {
  text: string
  timestamp: Date
  type: 'damage' | 'critical' | 'heal' | 'status' | 'miss' | 'start' | 'end' | 'normal'
}

export function SimpleBattleScreen({ enemies, enemyLevel, playerLevel = 1, initialHpRatio = 1, onBattleEnd, floorInfo }: SimpleBattleScreenProps) {
  // 플레이어 스탯 계산
  const maxPlayerHp = statFormulas.hp(playerLevel)
  const initialPlayerHp = Math.floor(maxPlayerHp * initialHpRatio)
  const playerAttack = statFormulas.attack(playerLevel)
  const [playerHp, setPlayerHp] = useState(initialPlayerHp)
  
  // 다중 몬스터 초기화
  const [enemyList, setEnemyList] = useState<EnemyData[]>(() => 
    enemies.map((enemy, index) => ({
      ...enemy,
      hp: enemy.stats.hp,
      maxHp: enemy.stats.hp,
      attack: enemy.stats.attack,
      defense: enemy.stats.defense,
      speed: enemy.stats.speed,
      specialAbility: enemy.stats.specialAbility,
      id: index
    }))
  )
  
  const [battleHistory, setBattleHistory] = useState<BattleMessage[]>([])
  const [isBattling, setIsBattling] = useState(false)
  const [battleEnded, setBattleEnded] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy' | null>(null)
  const [showDamage, setShowDamage] = useState<{ player?: number; enemies: Map<number, number> }>({ enemies: new Map() })
  const [showEffect, setShowEffect] = useState<'playerAttack' | 'enemyAttack' | null>(null)
  const [targetedEnemy, setTargetedEnemy] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // zustand store에서 배속 설정 가져오기
  const { isInBattle, setIsInBattle, battleSpeed, setBattleSpeed } = useBattleStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  // 전투 키를 상태로 관리
  const [battleKey, setBattleKey] = useState(0)
  const isFirstRender = useRef(true)
  
  // enemies가 변경되면 새로운 전투 시작
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    // 진행 중인 전투 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // 이전 전투 상태 초기화
    setBattleEnded(false)
    setIsBattling(false)
    setBattleHistory([])
    
    // 새로운 적 정보로 상태 업데이트
    const newEnemyList = enemies.map((enemy, index) => ({
      ...enemy,
      hp: enemy.stats.hp,
      maxHp: enemy.stats.hp,
      attack: enemy.stats.attack,
      defense: enemy.stats.defense,
      speed: enemy.stats.speed,
      specialAbility: enemy.stats.specialAbility,
      id: index
    }))
    setEnemyList(newEnemyList)
    
    // 전투 키 증가하여 새 전투 트리거
    setBattleKey(prev => prev + 1)
  }, [enemies]) // enemies 배열이 변경될 때마다 실행
  
  // 자동 전투 시작
  useEffect(() => {
    if (!isBattling && !battleEnded) {
      const timer = setTimeout(() => {
        setIsBattling(true)
        setIsInBattle(true)
        startAutoBattle()
      }, 500) // 약간의 딜레이를 주어 상태 업데이트가 완료되도록 함
      
      return () => clearTimeout(timer)
    }
  }, [battleKey])
  
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 전투 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setIsInBattle(false)
    }
  }, [])

  const addLog = (message: string, type: BattleMessage['type'] = 'normal') => {
    setBattleHistory(prev => [...prev, {
      text: message,
      timestamp: new Date(),
      type
    }])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleHistory])

  const startAutoBattle = async () => {
    // 새로운 전투를 위한 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    let pHp = playerHp // 현재 플레이어 HP 사용 (연속 전투)
    let eList = [...enemyList]
    let turn = 0
    let playerFrozen = false
    let playerCursed = false
    let poisonDamage = 0

    addLog(`⚔️ ${enemies.length}마리의 몬스터와 전투 시작!`, 'start')
    
    // 전투 정보 로그
    addLog(`⚔️ 플레이어 Lv.${playerLevel} - HP: ${pHp}, 공격력: ${playerAttack}`, 'status')
    
    enemies.forEach((enemy, index) => {
      addLog(`👹 ${enemy.name} - HP: ${enemy.stats.hp}, 공격력: ${enemy.stats.attack}`, 'status')
      if (enemy.stats.specialAbility) {
        addLog(`⚡ ${enemy.name}의 특수 능력 주의!`, 'status')
      }
    })
    
    // 전투 루프
    while (pHp > 0 && eList.some(e => e.hp > 0)) {
      // 전투가 중단되었는지 확인
      if (abortController.signal.aborted) {
        return
      }
      
      const aliveEnemies = eList.filter(e => e.hp > 0)
      const avgSpeed = aliveEnemies.reduce((sum, e) => sum + (e.speed || 1.0), 0) / aliveEnemies.length
      const waitTime = Math.floor((2000 / avgSpeed) / battleSpeed)
      
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, waitTime)
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new Error('Battle aborted'))
        })
      }).catch(() => {})
      
      turn++
      
      // 독 데미지
      if (poisonDamage > 0 && turn % 2 === 1) {
        pHp = Math.max(0, pHp - poisonDamage)
        setPlayerHp(pHp)
        addLog(`🟢 독 데미지로 ${poisonDamage}의 피해를 입었습니다!`, 'damage')
        poisonDamage = Math.max(0, poisonDamage - 2)
      }
      
      // 플레이어 공격
      if (turn % 2 === 1 && !playerFrozen) {
        setCurrentTurn('player')
        setShowEffect('playerAttack')
        
        // 살아있는 적 중 하나를 랜덤 선택
        const targets = eList.filter(e => e.hp > 0)
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)]
          setTargetedEnemy(target.id)
          
          let baseDamage = Math.floor(Math.random() * 15) + playerAttack
          if (playerCursed) {
            baseDamage = Math.floor(baseDamage * 0.7)
          }
          const isCritical = Math.random() < 0.2
          const damage = isCritical ? Math.floor(baseDamage * 1.5) : baseDamage
          
          await new Promise(resolve => setTimeout(resolve, 300 / battleSpeed))
          
          // 데미지 표시
          const damageMap = new Map<number, number>()
          damageMap.set(target.id, damage)
          setShowDamage({ enemies: damageMap })
          setTimeout(() => {
            setShowDamage({ enemies: new Map() })
            setShowEffect(null)
            setTargetedEnemy(null)
          }, 1000 / battleSpeed)
          
          await new Promise(resolve => setTimeout(resolve, 500 / battleSpeed))
          
          // 죽은 몬스터를 다시 공격하지 않도록 체크
          const currentTarget = eList.find(e => e.id === target.id)
          if (currentTarget && currentTarget.hp > 0) {
            currentTarget.hp = Math.max(0, currentTarget.hp - damage)
            
            // 상태 업데이트
            const updatedList = eList.map(e => e.id === currentTarget.id ? {...e, hp: currentTarget.hp} : e)
            eList = updatedList
            setEnemyList(updatedList)
            
            if (isCritical) {
              addLog(`⚔️ 플레이어의 강력한 일격! ${currentTarget.name}에게 치명타 ${damage}의 피해!`, 'critical')
            } else {
              addLog(`⚔️ 플레이어가 ${currentTarget.name}을(를) 공격! ${damage}의 피해를 입혔습니다.`, 'damage')
            }
            
            if (currentTarget.hp <= 0) {
              addLog(`💀 ${currentTarget.name}을(를) 처치했습니다!`, 'end')
            }
            
            // 용암 갑옷 반사
            if (currentTarget.specialAbility === 'lavaArmor' && currentTarget.hp > 0) {
              const reflectDamage = Math.floor(damage * 0.3)
              pHp = Math.max(0, pHp - reflectDamage)
              setPlayerHp(pHp)
              addLog(`🔥 용암 갑옷이 ${reflectDamage}의 반사 피해를 입혔습니다!`, 'damage')
            }
          } else {
            console.log('⚠️ 대상이 이미 죽어있음, 공격 취소')
          }
        }
      } else if (turn % 2 === 1 && playerFrozen) {
        addLog(`❄️ 플레이어가 얼어붙어 움직일 수 없습니다!`, 'status')
        playerFrozen = false
      }
      // 적들의 공격
      else {
        setCurrentTurn('enemy')
        setShowEffect('enemyAttack')
        
        const attackingEnemies = eList.filter(e => e.hp > 0)
        let totalDamage = 0
        
        for (const enemy of attackingEnemies) {
          const baseAttack = enemy.attack
          const damageVariation = Math.floor(Math.random() * 10) - 5
          const baseDamage = Math.max(1, baseAttack + damageVariation)
          const isStrong = Math.random() < 0.15
          const damage = isStrong ? Math.floor(baseDamage * 1.3) : baseDamage
          
          totalDamage += damage
          
          if (isStrong) {
            addLog(`👹 ${enemy.name}의 강력한 공격! ${damage}의 큰 피해!`, 'critical')
          } else {
            addLog(`👹 ${enemy.name}이(가) 플레이어를 공격! ${damage}의 피해!`, 'damage')
          }
          
          // 특수 능력 발동
          if (enemy.specialAbility && Math.random() < 0.3) {
            switch (enemy.specialAbility) {
              case 'doubleStrike':
                const secondDamage = Math.floor(damage * 0.7)
                totalDamage += secondDamage
                addLog(`👺 ${enemy.name}의 연속 공격! 추가로 ${secondDamage}의 피해!`, 'critical')
                break
                
              case 'lifeDrain':
                const drainAmount = Math.floor(damage * 0.5)
                // eList에서 직접 업데이트
                const enemyIndex = eList.findIndex(e => e.id === enemy.id)
                if (enemyIndex !== -1) {
                  eList[enemyIndex].hp = Math.min(eList[enemyIndex].maxHp, eList[enemyIndex].hp + drainAmount)
                  addLog(`🧟 ${enemy.name}가 생명력을 흡수! ${drainAmount}의 체력을 회복!`, 'heal')
                }
                break
                
              case 'freeze':
                playerFrozen = true
                addLog(`❄️ ${enemy.name}의 빙결 공격! 다음 턴을 쉬게 됩니다!`, 'status')
                break
                
              case 'poison':
                poisonDamage = Math.floor(enemy.attack * 0.5)
                addLog(`🟢 ${enemy.name}의 독 공격! 지속적인 피해를 입습니다!`, 'status')
                break
                
              case 'curse':
                playerCursed = true
                addLog(`💀 ${enemy.name}의 저주! 공격력이 감소합니다!`, 'status')
                break
              
              // 나머지 특수 능력들...
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300 / battleSpeed))
        
        // 데미지 표시
        setShowDamage({ player: totalDamage, enemies: new Map() })
        setTimeout(() => {
          setShowDamage({ enemies: new Map() })
          setShowEffect(null)
        }, 1000 / battleSpeed)
        
        await new Promise(resolve => setTimeout(resolve, 500 / battleSpeed))
        pHp = Math.max(0, pHp - totalDamage)
        setPlayerHp(pHp)
        
        setEnemyList([...eList])
      }
      setCurrentTurn(null)
    }

    // 전투 종료
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (pHp > 0) {
      addLog(`🎉 승리! 모든 몬스터를 물리쳤습니다!`, 'end')
      setBattleEnded(true)
      const hpRatio = pHp / maxPlayerHp
      setTimeout(() => {
        setIsInBattle(false)
        onBattleEnd(true, hpRatio)
      }, 2000)
    } else {
      addLog(`💀 패배... 쓰러졌습니다...`, 'end')
      setBattleEnded(true)
      setTimeout(() => {
        setIsInBattle(false)
        onBattleEnd(false, 0)
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500 via-blue-400 to-green-400 z-[60]">
      {/* X 버튼 - 오른쪽 상단 */}
      <button 
        onClick={() => {
          setIsInBattle(false)
          onBattleEnd(false, playerHp / maxPlayerHp)
        }}
        className="absolute top-3 right-3 text-white hover:text-white bg-black/30 hover:bg-black/40 rounded-full w-7 h-7 flex items-center justify-center transition-all shadow-lg z-10"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* 던전 진행도 표시 */}
      {floorInfo && (
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <p className="text-sm font-bold">{floorInfo.dungeonName}</p>
          <p className="text-xs">
            {floorInfo.currentFloor}층 / {floorInfo.totalFloors}층
          </p>
        </div>
      )}
      

      {/* 전투 화면 */}
      <div className="h-full flex flex-col">
        {/* 상단 - 적들 */}
        <div className="h-1/3 relative">
          <div className="absolute right-4 md:right-8 top-4 md:top-8 w-full max-w-2xl">
            <div className="flex gap-4 justify-end flex-wrap">
              {enemyList.map((enemy) => (
                <div key={enemy.id} className="relative">
                  {/* 적 정보 박스 */}
                  <div className="bg-white/90 rounded-lg p-2 shadow-lg mb-2 min-w-[120px]">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-800 text-sm">{enemy.name}</h3>
                      <span className="text-xs text-gray-600">Lv.{enemyLevel}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className={`h-full ${
                          (enemy.hp / enemy.maxHp) > 0.5 ? 'bg-green-500' : 
                          (enemy.hp / enemy.maxHp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 text-right mt-1">{enemy.hp}/{enemy.maxHp} HP</p>
                  </div>
                  
                  {/* 적 캐릭터 */}
                  <motion.div 
                    className="text-center relative"
                    animate={currentTurn === 'enemy' ? {
                      x: [-10, 0, -10],
                      transition: { duration: 0.3, repeat: 2 }
                    } : {}}
                  >
                    <motion.div 
                      className="text-5xl md:text-6xl inline-block"
                      animate={enemy.hp <= 0 ? { 
                        rotate: 90,
                        opacity: 0.5,
                        y: 20
                      } : showEffect === 'playerAttack' && targetedEnemy === enemy.id ? {
                        x: [0, -5, 5, -5, 5, 0],
                        transition: { duration: 0.5 }
                      } : {}}
                    >
                      {enemy.emoji}
                    </motion.div>
                    {showDamage.enemies.get(enemy.id) && (
                      <motion.div
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -30, opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-xl font-bold text-red-600"
                      >
                        -{showDamage.enemies.get(enemy.id)}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 - 플레이어 */}
        <div className="h-1/3 relative bg-gradient-to-t from-green-500 to-transparent">
          <div className="absolute left-4 md:left-8 bottom-4 md:bottom-8 right-4 md:right-8 flex justify-between items-end">
            <div className="w-64 md:w-80">
              {/* 플레이어 캐릭터 */}
              <motion.div 
                className="text-center mb-4 relative"
                animate={currentTurn === 'player' ? {
                  x: [20, 0, 20],
                  transition: { duration: 0.3, repeat: 2 }
                } : {}}
              >
                <motion.div 
                  className="text-6xl md:text-8xl inline-block"
                  animate={playerHp <= 0 ? { 
                    rotate: -90,
                    opacity: 0.5,
                    y: 50
                  } : showEffect === 'enemyAttack' ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.5 }
                  } : {}}
                >
                  ⚔️
                </motion.div>
                {showDamage.player && (
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -30, opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-600"
                  >
                    -{showDamage.player}
                  </motion.div>
                )}
              </motion.div>
              
              {/* 플레이어 정보 박스 */}
              <div className="bg-white/90 rounded-lg p-3 shadow-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-800">플레이어</h3>
                  <span className="text-sm text-gray-600">Lv.{playerLevel}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className={`h-full ${
                      (playerHp / maxPlayerHp) > 0.5 ? 'bg-green-500' : 
                      (playerHp / maxPlayerHp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    animate={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-right mt-1">{playerHp}/{maxPlayerHp} HP</p>
              </div>
            </div>
            
            {/* 배속 버튼 */}
            <button 
              onClick={() => {
                const speeds = [1, 2, 3]
                const currentIndex = speeds.indexOf(battleSpeed)
                const nextIndex = (currentIndex + 1) % speeds.length
                setBattleSpeed(speeds[nextIndex])
              }}
              className="mb-4 text-white hover:text-white bg-black/30 hover:bg-black/40 rounded-full px-4 py-2 transition-all font-bold text-sm flex items-center gap-1 shadow-lg"
            >
              ⚡ {battleSpeed}x
            </button>
          </div>
        </div>

        {/* 전투 로그 영역 */}
        <div className="h-1/3 bg-gray-900/95 backdrop-blur-sm border-t-2 border-gray-700 overflow-y-auto p-4">
          <div className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
            <span>⚔️</span>
            <span>전투 로그</span>
          </div>
          <AnimatePresence mode="popLayout">
            {battleHistory.slice(-5).map((message, index) => {
              const timestamp = message.timestamp.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              });
              
              return (
                <motion.div
                  key={`${message.timestamp.getTime()}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`text-base py-2 px-3 mb-1.5 rounded-lg ${
                    message.type === 'damage' ? 'bg-red-900/30 text-red-300 border border-red-800/50' :
                    message.type === 'heal' ? 'bg-green-900/30 text-green-300 border border-green-800/50' :
                    message.type === 'critical' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50' :
                    message.type === 'status' ? 'bg-purple-900/30 text-purple-300 border border-purple-800/50' :
                    message.type === 'miss' ? 'bg-gray-800/30 text-gray-400 border border-gray-700/50' :
                    message.type === 'start' ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50' :
                    message.type === 'end' ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/50' :
                    'bg-gray-800/30 text-gray-300 border border-gray-700/50'
                  }`}
                >
                  <span className="text-xs text-gray-500">[{timestamp}]</span>
                  <span className="ml-2 font-medium">{message.text}</span>
                </motion.div>
              );
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
      </div>
    </div>
  )
}