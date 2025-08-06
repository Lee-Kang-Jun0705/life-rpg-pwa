// 사운드 시스템 타입 정의

export interface SoundManager {
  // BGM 관련
  playBGM: (bgmId: string, fadeIn?: boolean) => Promise<void>
  stopBGM: (fadeOut?: boolean) => void
  
  // SFX 관련
  playSFX: (sfxId: string) => Promise<void>
  playSkillSFX: (element: string) => void
  
  // 볼륨 제어
  setMasterVolume: (volume: number) => void
  setBGMVolume: (volume: number) => void
  setSFXVolume: (volume: number) => void
  
  // 음소거
  toggleMute: () => void
  setMute: (muted: boolean) => void
  
  // 설정
  getConfig: () => SoundConfig
  config: SoundConfig
  
  // 시스템
  stopAll: () => void
  cleanup: () => void
  resumeContext: () => Promise<void>
}

export interface SoundConfig {
  volume: number
  muted: boolean
  bgmVolume: number
  sfxVolume: number
}

export interface SoundDefinition {
  id: string
  src: string | string[]
  volume?: number
  loop?: boolean
  sprite?: Record<string, [number, number]>
}

// Howler.js 타입 (필요한 부분만)
export interface HowlOptions {
  src: string | string[]
  volume?: number
  loop?: boolean
  sprite?: Record<string, [number, number]>
  html5?: boolean
}

export interface Howl {
  play(): number
  stop(): void
  pause(): void
  volume(): number
  volume(value: number): void
  fade(from: number, to: number, duration: number): void
  once(event: string, callback: () => void): void
}

export interface HowlerGlobal {
  volume(value: number): void
  mute(muted: boolean): void
}