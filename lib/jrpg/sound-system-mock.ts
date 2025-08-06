// Mock 사운드 시스템 (실제 사운드 파일 없이 개발/테스트용)
import type { SoundConfig } from './sound-system'

class MockSoundManager {
  private config: SoundConfig = {
    volume: 1.0,
    muted: false,
    bgmVolume: 0.5,
    sfxVolume: 0.7
  }
  
  private currentBGM: string | null = null
  private logs: string[] = []
  
  constructor() {
    console.log('[MockSoundManager] Initialized - No actual sounds will play')
  }
  
  playBGM(bgmId: string, fadeIn: boolean = true) {
    if (this.config.muted) return
    
    const message = `🎵 BGM: ${bgmId} (fade: ${fadeIn})`
    this.logs.push(message)
    console.log(`[Sound]`, message)
    
    this.currentBGM = bgmId
  }
  
  stopBGM(fadeOut: boolean = true) {
    if (this.currentBGM) {
      const message = `🔇 BGM Stop: ${this.currentBGM} (fade: ${fadeOut})`
      this.logs.push(message)
      console.log(`[Sound]`, message)
      this.currentBGM = null
    }
  }
  
  playSFX(sfxId: string) {
    if (this.config.muted) return
    
    // 이모지로 효과음 표현
    const sfxEmojis: Record<string, string> = {
      // 전투
      attack: '⚔️',
      critical: '💥',
      miss: '💨',
      defend: '🛡️',
      
      // 스킬
      skill_fire: '🔥',
      skill_ice: '❄️',
      skill_thunder: '⚡',
      skill_heal: '💚',
      skill_buff: '⬆️',
      skill_debuff: '⬇️',
      
      // UI
      menu_open: '📂',
      menu_close: '📁',
      menu_select: '👆',
      menu_confirm: '✅',
      menu_cancel: '❌',
      
      // 아이템
      item_get: '📦',
      item_use: '💊',
      gold_get: '💰',
      
      // 강화
      enhance_success: '✨',
      enhance_fail: '💔',
      enhance_destroy: '💀',
      
      // 기타
      levelup: '🎉',
      quest_complete: '🏆'
    }
    
    const emoji = sfxEmojis[sfxId] || '🔊'
    const message = `${emoji} SFX: ${sfxId}`
    this.logs.push(message)
    
    // 화면에 이모지 표시 (옵션)
    if (typeof window !== 'undefined') {
      this.showFloatingEmoji(emoji)
    }
    
    console.log(`[Sound]`, message)
  }
  
  playSkillSFX(element: string) {
    const elementToSFX: Record<string, string> = {
      fire: 'skill_fire',
      ice: 'skill_ice',
      thunder: 'skill_thunder',
      light: 'skill_heal',
      dark: 'skill_debuff',
      physical: 'attack'
    }
    
    const sfxId = elementToSFX[element] || 'attack'
    this.playSFX(sfxId)
  }
  
  setMasterVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume))
    console.log(`[Sound] Master Volume: ${Math.round(volume * 100)}%`)
  }
  
  setBGMVolume(volume: number) {
    this.config.bgmVolume = Math.max(0, Math.min(1, volume))
    console.log(`[Sound] BGM Volume: ${Math.round(volume * 100)}%`)
  }
  
  setSFXVolume(volume: number) {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    console.log(`[Sound] SFX Volume: ${Math.round(volume * 100)}%`)
  }
  
  toggleMute() {
    this.config.muted = !this.config.muted
    console.log(`[Sound] Muted: ${this.config.muted}`)
  }
  
  setMute(muted: boolean) {
    this.config.muted = muted
    console.log(`[Sound] Muted: ${muted}`)
  }
  
  getConfig(): SoundConfig {
    return { ...this.config }
  }
  
  stopAll() {
    this.stopBGM(false)
    console.log(`[Sound] All sounds stopped`)
  }
  
  cleanup() {
    this.stopAll()
    this.logs = []
  }
  
  // 사운드 로그 가져오기 (디버깅용)
  getLogs(): string[] {
    return [...this.logs]
  }
  
  // 화면에 이모지 표시 (시각적 피드백)
  private showFloatingEmoji(emoji: string) {
    const div = document.createElement('div')
    div.textContent = emoji
    div.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      z-index: 9999;
      pointer-events: none;
      animation: floatUp 1s ease-out forwards;
    `
    
    // 애니메이션 스타일 추가
    if (!document.getElementById('sound-emoji-styles')) {
      const style = document.createElement('style')
      style.id = 'sound-emoji-styles'
      style.textContent = `
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -150%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -250%) scale(1);
          }
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(div)
    setTimeout(() => div.remove(), 1000)
  }
}

// 개발 환경에서는 Mock 사용
export const mockSoundManager = new MockSoundManager()