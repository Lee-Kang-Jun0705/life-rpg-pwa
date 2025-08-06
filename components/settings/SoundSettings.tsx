'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, Music, Zap } from 'lucide-react'
import { soundManager } from '@/lib/jrpg/sound-system'

export function SoundSettings() {
  const defaultConfig = {
    volume: 1.0,
    muted: false,
    bgmVolume: 0.5,
    sfxVolume: 0.7
  }
  const [config, setConfig] = useState(() => {
    try {
      const savedConfig = soundManager.getConfig()
      return savedConfig || defaultConfig
    } catch (error) {
      console.error('[SoundSettings] Error getting config:', error)
      return defaultConfig
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    const savedOpen = localStorage.getItem('sound_settings_open')
    if (savedOpen === 'true') {
      setIsOpen(true)
    }
  }, [])
  
  const handleMasterVolumeChange = (value: number) => {
    try {
      soundManager.setMasterVolume(value)
      const newConfig = soundManager.getConfig()
      setConfig(newConfig || { ...config, volume: value })
    } catch (error) {
      console.error('[SoundSettings] Error setting master volume:', error)
      setConfig(prev => ({ ...prev, volume: value }))
    }
  }
  
  const handleBGMVolumeChange = (value: number) => {
    try {
      soundManager.setBGMVolume(value)
      const newConfig = soundManager.getConfig()
      setConfig(newConfig || { ...config, bgmVolume: value })
    } catch (error) {
      console.error('[SoundSettings] Error setting BGM volume:', error)
      setConfig(prev => ({ ...prev, bgmVolume: value }))
    }
  }
  
  const handleSFXVolumeChange = (value: number) => {
    try {
      soundManager.setSFXVolume(value)
      const newConfig = soundManager.getConfig()
      setConfig(newConfig || { ...config, sfxVolume: value })
      // 효과음 볼륨 테스트
      soundManager.playSFX('menu_select')
    } catch (error) {
      console.error('[SoundSettings] Error setting SFX volume:', error)
      setConfig(prev => ({ ...prev, sfxVolume: value }))
    }
  }
  
  const handleToggleMute = () => {
    try {
      soundManager.toggleMute()
      const newConfig = soundManager.getConfig()
      setConfig(newConfig || { ...config, muted: !config.muted })
    } catch (error) {
      console.error('[SoundSettings] Error toggling mute:', error)
      setConfig(prev => ({ ...prev, muted: !prev.muted }))
    }
  }
  
  const toggleSettings = async () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    localStorage.setItem('sound_settings_open', newOpen.toString())
    
    // 사운드 컨텍스트 활성화 (첫 클릭 시)
    if ('resumeContext' in soundManager) {
      await (soundManager as any).resumeContext()
    }
    
    soundManager.playSFX(newOpen ? 'menu_open' : 'menu_close')
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 320 : 48 }}
        className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {config?.muted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
          
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 space-y-4 p-2"
            >
              <h3 className="text-white font-bold text-sm">사운드 설정</h3>
              
              {/* 마스터 볼륨 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    전체 볼륨
                  </label>
                  <span className="text-xs text-white">
                    {Math.round((config?.volume || 1.0) * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-gray-600 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-150"
                        style={{ width: `${(config?.volume || 1.0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(config?.volume || 1.0) * 100}
                    onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value) / 100)}
                    className="relative w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer slider z-10"
                  />
                </div>
              </div>
              
              {/* BGM 볼륨 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    배경음악
                  </label>
                  <span className="text-xs text-white">
                    {Math.round((config?.bgmVolume || 0.5) * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-gray-600 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-150"
                        style={{ width: `${(config?.bgmVolume || 0.5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(config?.bgmVolume || 0.5) * 100}
                    onChange={(e) => handleBGMVolumeChange(parseInt(e.target.value) / 100)}
                    className="relative w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer slider z-10"
                  />
                </div>
              </div>
              
              {/* SFX 볼륨 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    효과음
                  </label>
                  <span className="text-xs text-white">
                    {Math.round((config?.sfxVolume || 0.7) * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-gray-600 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-150"
                        style={{ width: `${(config?.sfxVolume || 0.7) * 100}%` }}
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(config?.sfxVolume || 0.7) * 100}
                    onChange={(e) => handleSFXVolumeChange(parseInt(e.target.value) / 100)}
                    className="relative w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer slider z-10"
                  />
                </div>
              </div>
              
              {/* 음소거 버튼 */}
              <button
                onClick={handleToggleMute}
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  config?.muted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {config?.muted ? '음소거 해제' : '음소거'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #8b5cf6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  )
}