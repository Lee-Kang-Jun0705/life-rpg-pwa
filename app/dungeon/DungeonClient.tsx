'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateTotalCharacterLevel, getCharacterLevelDetails } from '@/lib/utils/character-level'
import { calculateBattleStats } from '@/lib/dungeon/stat-calculator'
import { useDungeonStore } from '@/store/dungeon-store'
import { useStats } from '@/lib/hooks/useStats'
import { DUNGEON_CONFIG, DUNGEON_STYLES, STAT_DISPLAY, BATTLE_STAT_DISPLAY } from '@/lib/constants/dungeon'
import { dungeonLogger } from '@/lib/utils/logger'
import AutoBattle from '@/components/dungeon/AutoBattle'
import { DungeonSoundSystem } from '@/lib/dungeon/dungeon-sound-system'
import type { DungeonType, CharacterBattleStats } from '@/lib/types/dungeon'

export default function DungeonClient() {
  const router = useRouter()
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType | null>(null)
  
  const { gold, addGold, addItem } = useDungeonStore()
  
  // Custom Hook으로 스탯 관리
  const { stats, loading, error } = useStats()
  
  // 메모이제이션으로 성능 최적화
  const totalLevel = useMemo(() => calculateTotalCharacterLevel(stats), [stats])
  const levelDetails = useMemo(() => getCharacterLevelDetails(stats), [stats])
  const battleStats = useMemo(() => calculateBattleStats(stats), [stats])
  
  // 던전 선택 핸들러
  const handleDungeonSelect = useCallback((dungeonType: DungeonType) => {
    const requiredLevel = DUNGEON_CONFIG.LEVEL_REQUIREMENTS[dungeonType]
    if (totalLevel >= requiredLevel) {
      dungeonLogger.info(`Entering ${dungeonType} dungeon`, { totalLevel, requiredLevel })
      setSelectedDungeon(dungeonType)
    } else {
      dungeonLogger.warn(`Level requirement not met for ${dungeonType}`, { totalLevel, requiredLevel })
    }
  }, [totalLevel])
  
  // 던전 나가기 핸들러
  const handleExitDungeon = useCallback(() => {
    dungeonLogger.info('Exiting dungeon')
    setSelectedDungeon(null)
  }, [])

  // BGM 상태 관리
  const [isBgmPlaying, setIsBgmPlaying] = useState(false)
  const [bgmInitialized, setBgmInitialized] = useState(false)

  // 던전 페이지 진입 시 사운드 시스템 초기화
  useEffect(() => {
    const dungeonSoundSystem = DungeonSoundSystem.getInstance()
    
    const initSound = async () => {
      try {
        await dungeonSoundSystem.initialize()
        setBgmInitialized(true)
        console.log('[DungeonClient] Sound system initialized')
      } catch (error) {
        console.error('[DungeonClient] Failed to initialize sound:', error)
      }
    }
    
    initSound()
    
    // 컴포넌트 언마운트 시 BGM 정지
    return () => {
      dungeonSoundSystem.stopBGM()
      setIsBgmPlaying(false)
      console.log('[DungeonClient] BGM stopped')
    }
  }, [])

  // BGM 토글 함수
  const toggleBGM = useCallback(async () => {
    const dungeonSoundSystem = DungeonSoundSystem.getInstance()
    
    try {
      if (!bgmInitialized) {
        console.log('[DungeonClient] Initializing sound system...')
        await dungeonSoundSystem.initialize()
        setBgmInitialized(true)
      }

      if (isBgmPlaying) {
        dungeonSoundSystem.stopBGM()
        setIsBgmPlaying(false)
        console.log('[DungeonClient] BGM stopped by user')
      } else {
        console.log('[DungeonClient] Starting BGM...')
        await dungeonSoundSystem.playBGM()
        setIsBgmPlaying(true)
        console.log('[DungeonClient] BGM started by user')
      }
    } catch (error) {
      console.error('[DungeonClient] BGM toggle error:', error)
      alert('BGM 재생 중 오류가 발생했습니다. 콘솔을 확인해주세요.')
    }
  }, [isBgmPlaying, bgmInitialized])
  
  // 테스트 BGM 함수
  const playTestSound = useCallback(async () => {
    const dungeonSoundSystem = DungeonSoundSystem.getInstance()
    try {
      await dungeonSoundSystem.playTestBGM()
    } catch (error) {
      console.error('[DungeonClient] Test BGM error:', error)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">던전 입장 준비 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }


  // 전투 중이면 AutoBattle 컴포넌트 표시
  if (selectedDungeon) {
    return (
      <AutoBattle
        dungeonType={selectedDungeon}
        playerStats={battleStats}
        onExit={handleExitDungeon}
        onItemObtained={addItem}
        onGoldObtained={addGold}
      />
    )
  }

  // 던전 선택 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* BGM 안내 메시지 */}
        {!isBgmPlaying && bgmInitialized && (
          <div className="bg-yellow-900/50 backdrop-blur-md rounded-lg p-3 mb-4 text-center animate-pulse">
            <p className="text-yellow-300 text-sm">
              🎵 더 나은 경험을 위해 BGM을 켜보세요! 위의 BGM OFF 버튼을 클릭하세요.
            </p>
          </div>
        )}
        {/* 헤더 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">던전</h1>
              <p className="text-purple-300 text-sm">총 레벨: {totalLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-semibold mb-2">💰 {gold.toLocaleString()} 골드</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={toggleBGM}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isBgmPlaying 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  aria-label={isBgmPlaying ? 'BGM 끄기' : 'BGM 켜기'}
                >
                  {isBgmPlaying ? '🔊 BGM ON' : '🔇 BGM OFF'}
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 스탯 정보 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">캐릭터 능력치</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {(['health', 'learning', 'relationship', 'achievement'] as const).map((statType) => {
              const stat = STAT_DISPLAY[statType]
              const level = levelDetails[statType]
              return (
                <div key={statType} className="text-purple-300">
                  <span className="text-white">
                    {stat.icon} {stat.name} Lv.{level}
                  </span>
                  <div className="text-xs">{stat.bonusText(level)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 전투 스탯 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">전투 능력치</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {BATTLE_STAT_DISPLAY.map(({ key, icon, name, color, format }) => (
              <div key={key} className="text-gray-300">
                <span className={color}>
                  {icon} {name}:
                </span>{' '}
                {format(battleStats[key as keyof CharacterBattleStats] as number)}
              </div>
            ))}
          </div>
        </div>

        {/* 던전 선택 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-3">던전 선택</h2>
          <div className="space-y-3">
            {(['normal', 'elite', 'boss', 'infinite'] as const).map((dungeonType) => {
              const requiredLevel = DUNGEON_CONFIG.LEVEL_REQUIREMENTS[dungeonType]
              const dungeonInfo = DUNGEON_CONFIG.DUNGEON_INFO[dungeonType]
              const styles = DUNGEON_STYLES[dungeonType]
              const isDisabled = totalLevel < requiredLevel
              
              return (
                <button
                  key={dungeonType}
                  onClick={() => handleDungeonSelect(dungeonType)}
                  disabled={isDisabled}
                  aria-label={`${dungeonInfo.name} 입장하기 (필요 레벨: ${requiredLevel})`}
                  className={`w-full bg-gradient-to-r ${styles.gradient} p-4 rounded-lg border ${styles.border} text-left transition-all ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : `${styles.hoverBorder} hover:scale-[1.02]`
                  }`}
                >
                  <h3 className="text-white font-semibold mb-1">{dungeonInfo.name}</h3>
                  <p className={`${styles.textColor} text-sm`}>{dungeonInfo.description}</p>
                  {isDisabled && (
                    <p className="text-xs text-gray-400 mt-1">
                      현재 레벨: {totalLevel} / 필요 레벨: {requiredLevel}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}