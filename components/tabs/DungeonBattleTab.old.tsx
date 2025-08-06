'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sword, Shield, Trophy, ChevronRight, Heart, 
  Zap, Clock, Users, Layers, AlertCircle, PlayCircle, PauseCircle,
  FastForward, Play, Pause
} from 'lucide-react'
import { useUserStore } from '@/lib/stores/userStore'
import { AutoBattleManager, BattleSpeed, BATTLE_SPEED_SETTINGS } from '@/lib/battle/auto-battle-manager'
import { MultiBattleManager, createMultiBattle } from '@/lib/battle/multi-battle-manager'
import { getMonsterById } from '@/lib/battle/monster-database'
import { createScaledMonster } from '@/lib/battle/extended-monster-database'
import { PokemonStyleBattle } from '@/components/battle/PokemonStyleBattle'
import { MultiBattleScreen } from '@/components/battle/MultiBattleScreen'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { 
  getDungeonFloorData, 
  generateFloorMonsters, 
  determineBattleType,
  isFloorBossBattle,
  DUNGEON_FLOOR_SYSTEMS
} from '@/lib/dungeon/floor-system'
import type { BattleState, BattleAction } from '@/lib/types/battle-extended'
import type { MultiBattleState } from '@/lib/battle/multi-battle-manager'

interface DungeonInfo {
  id: string
  name: string
  description: string
  minLevel: number
  totalFloors: number
  unlocked: boolean
}

export function DungeonBattleTab() {
  const user = useUserStore((state) => state.user)
  const userLevel = user?.level || 1
  
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [isInBattle, setIsInBattle] = useState(false)
  const [battleType, setBattleType] = useState<'single' | 'double' | 'triple'>('single')
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>('normal')
  const [isPaused, setIsPaused] = useState(false)
  const [isInDungeonRun, setIsInDungeonRun] = useState(false) // 던전 진행 중 여부
  
  // 전투 상태
  const [battleManager, setBattleManager] = useState<AutoBattleManager | MultiBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [multiBattleState, setMultiBattleState] = useState<MultiBattleState | null>(null)
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null)
  const [totalRewards, setTotalRewards] = useState({ gold: 0, exp: 0 })
  const [floorRewards, setFloorRewards] = useState({ gold: 0, exp: 0 }) // 현재 층 보상
  const [battleLogs, setBattleLogs] = useState<string[]>([]) // 전투 로그
  const logContainerRef = useRef<HTMLDivElement>(null)
  
  // 던전 목록 생성
  const dungeonList: DungeonInfo[] = Object.entries(DUNGEON_FLOOR_SYSTEMS).map(([id, system]) => ({
    id,
    name: system.name,
    description: system.description,
    minLevel: system.unlockRequirement?.level || 1,
    totalFloors: system.totalFloors,
    unlocked: userLevel >= (system.unlockRequirement?.level || 1)
  }))

  // 던전 선택
  const handleDungeonSelect = (dungeonId: string) => {
    setSelectedDungeon(dungeonId)
    setCurrentFloor(1)
    setBattleResult(null)
    setTotalRewards({ gold: 0, exp: 0 })
    setFloorRewards({ gold: 0, exp: 0 })
    setIsInDungeonRun(true)
  }
  
  // 전투 속도 변경
  const changeBattleSpeed = (speed: BattleSpeed) => {
    setBattleSpeed(speed)
    if (battleManager && battleManager instanceof AutoBattleManager) {
      battleManager.setBattleSpeed(speed)
    }
  }
  
  // 전투 로그 추가
  const addBattleLog = (action: BattleAction) => {
    let logMessage = ''
    const time = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    
    if (action.action === 'skill') {
      const attackerName = action.attacker === GAME_CONFIG.DEFAULT_USER_ID ? '플레이어' : '몬스터'
      const skillName = action.skill.name
      
      if (action.damage) {
        const critical = action.isCritical ? ' (크리티컬!)' : ''
        const evaded = action.isEvaded ? ' (회피됨!)' : ''
        logMessage = `[${time}] ${attackerName}의 ${skillName}! ${action.damage}의 데미지${critical}${evaded}`
      } else if (action.healing) {
        logMessage = `[${time}] ${attackerName}가 ${skillName}으로 ${action.healing}HP 회복!`
      } else if (action.statusEffectApplied) {
        logMessage = `[${time}] ${attackerName}가 ${skillName}으로 ${action.statusEffectApplied} 효과 적용!`
      }
    }
    
    if (logMessage) {
      setBattleLogs(prev => [...prev, logMessage])
    }
  }
  
  // 로그 스크롤 자동화
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [battleLogs])

  // 전투 시작
  const startBattle = async() => {
    if (!selectedDungeon) return
    
    setIsInBattle(true)
    setBattleResult(null)
    setBattleLogs([]) // 로그 초기화
    
    // 층 시작 로그
    setBattleLogs([`===== ${DUNGEON_FLOOR_SYSTEMS[selectedDungeon].name} ${currentFloor}층 시작! =====`])
    
    const floorData = getDungeonFloorData(selectedDungeon, currentFloor)
    if (!floorData) {
      console.error('Floor data not found')
      return
    }

    // 전투 타입 결정
    const isBossFloor = isFloorBossBattle(floorData)
    let monsterConfigs: { monsterId: string; level: number }[] = []
    
    if (isBossFloor && floorData.bossMonster) {
      monsterConfigs = [floorData.bossMonster]
      setBattleType('single')
    } else {
      const type = determineBattleType(floorData)
      setBattleType(type)
      const monsterCount = type === 'single' ? 1 : type === 'double' ? 2 : 3
      monsterConfigs = generateFloorMonsters(floorData, monsterCount)
    }

    try {
      // 플레이어 캐릭터 생성
      const playerCharacter = await AutoBattleManager.createPlayerCharacter(
        GAME_CONFIG.DEFAULT_USER_ID
      )

      if (monsterConfigs.length === 1) {
        // 1:1 전투
        const monsterData = createScaledMonster(
          monsterConfigs[0].monsterId, 
          monsterConfigs[0].level
        ) || getMonsterById(monsterConfigs[0].monsterId)
        
        if (!monsterData) {
          console.error('Monster not found:', monsterConfigs[0].monsterId)
          return
        }

        const enemyCharacter = AutoBattleManager.createEnemyCharacter(monsterData)
        const manager = new AutoBattleManager(playerCharacter, enemyCharacter, battleSpeed)
        
        setBattleManager(manager)
        setBattleState(manager.getState())
        setMultiBattleState(null)

        const result = await manager.startBattle(
          (action) => {
            console.log('Battle action:', action)
            addBattleLog(action)
          },
          (state) => setBattleState({ ...state })
        )

        handleBattleEnd(result.winner === 'player', floorData.rewards)
      } else {
        // 다중 전투
        const monsterIds = monsterConfigs.map(c => c.monsterId)
        const levels = monsterConfigs.map(c => c.level)
        
        const manager = await createMultiBattle(
          GAME_CONFIG.DEFAULT_USER_ID,
          monsterIds,
          levels
        )
        
        setBattleManager(manager)
        setBattleState(null)
        setMultiBattleState(manager.getState())

        const result = await manager.startBattle(
          (action) => {
            console.log('Battle action:', action)
            addBattleLog(action)
          },
          (state) => setMultiBattleState({ ...state })
        )

        handleBattleEnd(result.winner === 'player', floorData.rewards)
      }
    } catch (error) {
      console.error('Battle error:', error)
      setIsInBattle(false)
    }
  }

  // 전투 종료 처리
  const handleBattleEnd = (victory: boolean, floorRewards: any) => {
    setBattleResult(victory ? 'victory' : 'defeat')
    
    if (victory) {
      const gold = Math.floor(100 * floorRewards.goldMultiplier)
      const exp = Math.floor(50 * floorRewards.expMultiplier)
      
      setFloorRewards({ gold, exp })
      setTotalRewards(prev => ({
        gold: prev.gold + gold,
        exp: prev.exp + exp
      }))
      
      // 승리 로그
      setBattleLogs(prev => [...prev, `===== 전투 승리! 보상: ${gold} 골드, ${exp} 경험치 =====`])
      
      // 다음 층으로
      if (selectedDungeon) {
        const dungeonSystem = DUNGEON_FLOOR_SYSTEMS[selectedDungeon]
        console.log(`현재 층: ${currentFloor}, 총 층수: ${dungeonSystem.totalFloors}`)
        
        // 마지막 층인지 확인 (totalFloors가 층의 개수이므로, currentFloor가 totalFloors와 같으면 마지막 층)
        if (currentFloor >= dungeonSystem.totalFloors) {
          // 던전 클리어 - 마지막 층 클리어 시
          setBattleLogs(prev => [...prev, `===== 던전 클리어! 총 보상: ${totalRewards.gold + gold} 골드, ${totalRewards.exp + exp} 경험치 =====`])
          setTimeout(() => {
            exitDungeon() // exitDungeon 함수 사용하여 완전히 초기화
          }, 5000)
        } else {
          // 다음 층으로 진행
          setTimeout(() => {
            const nextFloor = currentFloor + 1
            console.log(`다음 층으로 진행: ${nextFloor}`)
            setCurrentFloor(nextFloor)
            setBattleResult(null)
            setIsInBattle(false) // 전투 상태 초기화
            // startBattle은 UI에서 버튼을 눌러서 시작하도록 함
          }, 3000)
        }
      }
    } else {
      // 패배 로그
      setBattleLogs(prev => [...prev, `===== 전투 패배... ${currentFloor}층에서 탈락 =====`])
      setIsInDungeonRun(false)
      
      // 3초 후 자동으로 던전 나가기
      setTimeout(() => {
        exitDungeon()
      }, 3000)
    }
  }

  // 던전 나가기
  const exitDungeon = () => {
    setSelectedDungeon(null)
    setCurrentFloor(1)
    setIsInBattle(false)
    setBattleResult(null)
    setBattleManager(null)
    setBattleState(null)
    setMultiBattleState(null)
    setIsInDungeonRun(false)
    setBattleLogs([])
    setTotalRewards({ gold: 0, exp: 0 })
    setFloorRewards({ gold: 0, exp: 0 })
  }

  return (
    <div className="space-y-6">
      {!selectedDungeon ? (
        // 던전 목록
        <>
          <h2 className="text-xl font-bold text-white mb-4">던전 선택</h2>
          <div className="grid gap-3">
            {dungeonList.map((dungeon) => (
              <motion.button
                key={dungeon.id}
                whileHover={{ scale: dungeon.unlocked ? 1.02 : 1 }}
                whileTap={{ scale: dungeon.unlocked ? 0.98 : 1 }}
                onClick={() => dungeon.unlocked && handleDungeonSelect(dungeon.id)}
                disabled={!dungeon.unlocked}
                className={`bg-gray-800/50 rounded-lg p-4 text-left transition-all ${
                  dungeon.unlocked ? 'hover:bg-gray-700/50' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sword className="w-5 h-5 text-purple-400" />
                      {dungeon.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{dungeon.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        요구 레벨: {dungeon.minLevel}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {dungeon.totalFloors}층
                      </span>
                    </div>
                  </div>
                  {dungeon.unlocked ? (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </>
      ) : isInBattle ? (
        // 전투 화면
        <div className="space-y-4">
          {/* 전투 정보 헤더 */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {DUNGEON_FLOOR_SYSTEMS[selectedDungeon].name}
                </h3>
                <p className="text-sm text-gray-400">
                  {currentFloor}층 / {DUNGEON_FLOOR_SYSTEMS[selectedDungeon].totalFloors}층
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* 전투 속도 조절 버튼 */}
                <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2">
                  <button
                    onClick={() => changeBattleSpeed('slow')}
                    className={`p-1.5 rounded transition-all ${
                      battleSpeed === 'slow' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    title="느림"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeBattleSpeed('normal')}
                    className={`p-1.5 rounded transition-all ${
                      battleSpeed === 'normal' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    title="보통"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeBattleSpeed('fast')}
                    className={`p-1.5 rounded transition-all ${
                      battleSpeed === 'fast' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    title="빠름"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>
                
                {battleType !== 'single' && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Users className="w-5 h-5" />
                    <span>1 vs {battleType === 'double' ? '2' : '3'}</span>
                  </div>
                )}
                
                {/* 나가기 버튼 */}
                <button
                  onClick={() => {
                    if (window.confirm('정말로 전투를 포기하고 나가시겠습니까?')) {
                      exitDungeon()
                    }
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 transition-all"
                >
                  전투 포기
                </button>
              </div>
            </div>
          </div>

          {/* 전투 화면과 로그를 가로로 배치 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 전투 화면 (2/3) */}
            <div className="col-span-2 bg-gray-900/50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              {multiBattleState ? (
                <MultiBattleScreen 
                  battleState={multiBattleState} 
                  autoMode={true}
                  onTargetChange={(index) => {
                    if (battleManager instanceof MultiBattleManager) {
                      battleManager.changePlayerTarget(index)
                    }
                  }}
                />
              ) : battleState ? (
                <PokemonStyleBattle battleState={battleState} autoMode={true} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-xl">전투 준비 중...</div>
                </div>
              )}
            </div>
            
            {/* 전투 로그 (1/3) */}
            <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col" style={{ height: '500px' }}>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                전투 로그
              </h4>
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto text-sm space-y-1 font-mono"
              >
                {battleLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`
                      ${log.includes('플레이어') ? 'text-blue-400' : ''}
                      ${log.includes('몬스터') ? 'text-red-400' : ''}
                      ${log.includes('=====') ? 'text-yellow-400 font-bold' : ''}
                      ${log.includes('승리') ? 'text-green-400' : ''}
                      ${log.includes('패배') ? 'text-red-500' : ''}
                      ${log.includes('크리티컬') ? 'text-orange-400' : ''}
                    `}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 전투 결과 */}
          {battleResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-lg text-center ${
                battleResult === 'victory' 
                  ? 'bg-green-500/20 border border-green-500' 
                  : 'bg-red-500/20 border border-red-500'
              }`}
            >
              <Trophy className={`w-12 h-12 mx-auto mb-3 ${
                battleResult === 'victory' ? 'text-green-400' : 'text-red-400'
              }`} />
              <h3 className="text-xl font-bold mb-2">
                {battleResult === 'victory' ? '승리!' : '패배...'}
              </h3>
              {battleResult === 'defeat' && (
                <button
                  onClick={exitDungeon}
                  className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  던전 나가기
                </button>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        // 던전 정보 & 시작
        <div className="space-y-6">
          <button
            onClick={exitDungeon}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 던전 목록으로
          </button>
          
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {DUNGEON_FLOOR_SYSTEMS[selectedDungeon].name}
            </h2>
            <p className="text-gray-400 mb-4">
              {DUNGEON_FLOOR_SYSTEMS[selectedDungeon].description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/30 rounded p-3">
                <p className="text-sm text-gray-400">현재 층</p>
                <p className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  {currentFloor} / {DUNGEON_FLOOR_SYSTEMS[selectedDungeon].totalFloors}
                </p>
              </div>
              <div className="bg-gray-700/30 rounded p-3">
                <p className="text-sm text-gray-400">누적 보상</p>
                <div className="space-y-1">
                  <p className="text-sm text-yellow-400">💰 {totalRewards.gold} 골드</p>
                  <p className="text-sm text-blue-400">⭐ {totalRewards.exp} 경험치</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={startBattle}
              className="w-full py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all"
            >
              {currentFloor === 1 ? '던전 시작' : '다음 층 진입'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}