// JRPG 사운드 시스템
import type { Howl as HowlType, HowlerGlobal, HowlOptions, SoundManager as SoundManagerType } from '@/types/sound-system'

let Howl: typeof HowlType | undefined
let Howler: HowlerGlobal | undefined

// howler 라이브러리 동적 로드 시도 - 현재는 비활성화 (사운드 파일이 없으므로)
if (typeof window !== 'undefined' && false) { // 임시로 비활성화
  try {
    const howlerModule = require('howler')
    Howl = howlerModule.Howl
    Howler = howlerModule.Howler
    console.log('[SoundSystem] Howler.js loaded successfully')
  } catch (error) {
    console.warn('[SoundSystem] Howler.js not found, using synth sound system', error)
  }
}

// Synth 사운드 시스템 강제 사용
console.log('[SoundSystem] Using synth sound system (no sound files available)')

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

// 사운드 정의
export const SOUND_LIBRARY = {
  // BGM
  bgm: {
    town: {
      id: 'bgm_town',
      src: ['/sounds/bgm/town.mp3', '/sounds/bgm/town.ogg'],
      loop: true,
      volume: 0.5
    },
    dungeon: {
      id: 'bgm_dungeon',
      src: ['/sounds/bgm/dungeon.mp3', '/sounds/bgm/dungeon.ogg'],
      loop: true,
      volume: 0.4
    },
    battle: {
      id: 'bgm_battle',
      src: ['/sounds/bgm/battle.mp3', '/sounds/bgm/battle.ogg'],
      loop: true,
      volume: 0.6
    },
    boss: {
      id: 'bgm_boss',
      src: ['/sounds/bgm/boss.mp3', '/sounds/bgm/boss.ogg'],
      loop: true,
      volume: 0.7
    },
    victory: {
      id: 'bgm_victory',
      src: ['/sounds/bgm/victory.mp3', '/sounds/bgm/victory.ogg'],
      loop: false,
      volume: 0.6
    },
    defeat: {
      id: 'bgm_defeat',
      src: ['/sounds/bgm/defeat.mp3', '/sounds/bgm/defeat.ogg'],
      loop: false,
      volume: 0.5
    }
  },
  
  // SFX
  sfx: {
    // 전투 효과음
    attack: {
      id: 'sfx_attack',
      src: ['/sounds/sfx/attack.mp3', '/sounds/sfx/attack.ogg'],
      volume: 0.7
    },
    critical: {
      id: 'sfx_critical',
      src: ['/sounds/sfx/critical.mp3', '/sounds/sfx/critical.ogg'],
      volume: 0.8
    },
    miss: {
      id: 'sfx_miss',
      src: ['/sounds/sfx/miss.mp3', '/sounds/sfx/miss.ogg'],
      volume: 0.5
    },
    defend: {
      id: 'sfx_defend',
      src: ['/sounds/sfx/defend.mp3', '/sounds/sfx/defend.ogg'],
      volume: 0.6
    },
    
    // 스킬 효과음
    skill_fire: {
      id: 'sfx_skill_fire',
      src: ['/sounds/sfx/fire.mp3', '/sounds/sfx/fire.ogg'],
      volume: 0.7
    },
    skill_ice: {
      id: 'sfx_skill_ice',
      src: ['/sounds/sfx/ice.mp3', '/sounds/sfx/ice.ogg'],
      volume: 0.7
    },
    skill_thunder: {
      id: 'sfx_skill_thunder',
      src: ['/sounds/sfx/thunder.mp3', '/sounds/sfx/thunder.ogg'],
      volume: 0.8
    },
    skill_heal: {
      id: 'sfx_skill_heal',
      src: ['/sounds/sfx/heal.mp3', '/sounds/sfx/heal.ogg'],
      volume: 0.6
    },
    skill_buff: {
      id: 'sfx_skill_buff',
      src: ['/sounds/sfx/buff.mp3', '/sounds/sfx/buff.ogg'],
      volume: 0.5
    },
    skill_debuff: {
      id: 'sfx_skill_debuff',
      src: ['/sounds/sfx/debuff.mp3', '/sounds/sfx/debuff.ogg'],
      volume: 0.5
    },
    
    // UI 효과음
    menu_open: {
      id: 'sfx_menu_open',
      src: ['/sounds/sfx/menu_open.mp3', '/sounds/sfx/menu_open.ogg'],
      volume: 0.4
    },
    menu_close: {
      id: 'sfx_menu_close',
      src: ['/sounds/sfx/menu_close.mp3', '/sounds/sfx/menu_close.ogg'],
      volume: 0.4
    },
    menu_select: {
      id: 'sfx_menu_select',
      src: ['/sounds/sfx/menu_select.mp3', '/sounds/sfx/menu_select.ogg'],
      volume: 0.5
    },
    menu_confirm: {
      id: 'sfx_menu_confirm',
      src: ['/sounds/sfx/menu_confirm.mp3', '/sounds/sfx/menu_confirm.ogg'],
      volume: 0.6
    },
    menu_cancel: {
      id: 'sfx_menu_cancel',
      src: ['/sounds/sfx/menu_cancel.mp3', '/sounds/sfx/menu_cancel.ogg'],
      volume: 0.5
    },
    
    // 아이템 효과음
    item_get: {
      id: 'sfx_item_get',
      src: ['/sounds/sfx/item_get.mp3', '/sounds/sfx/item_get.ogg'],
      volume: 0.6
    },
    item_use: {
      id: 'sfx_item_use',
      src: ['/sounds/sfx/item_use.mp3', '/sounds/sfx/item_use.ogg'],
      volume: 0.5
    },
    gold_get: {
      id: 'sfx_gold_get',
      src: ['/sounds/sfx/gold_get.mp3', '/sounds/sfx/gold_get.ogg'],
      volume: 0.7
    },
    
    // 강화 효과음
    enhance_success: {
      id: 'sfx_enhance_success',
      src: ['/sounds/sfx/enhance_success.mp3', '/sounds/sfx/enhance_success.ogg'],
      volume: 0.8
    },
    enhance_fail: {
      id: 'sfx_enhance_fail',
      src: ['/sounds/sfx/enhance_fail.mp3', '/sounds/sfx/enhance_fail.ogg'],
      volume: 0.6
    },
    enhance_destroy: {
      id: 'sfx_enhance_destroy',
      src: ['/sounds/sfx/enhance_destroy.mp3', '/sounds/sfx/enhance_destroy.ogg'],
      volume: 0.7
    },
    
    // 레벨업/퀘스트
    levelup: {
      id: 'sfx_levelup',
      src: ['/sounds/sfx/levelup.mp3', '/sounds/sfx/levelup.ogg'],
      volume: 0.8
    },
    quest_complete: {
      id: 'sfx_quest_complete',
      src: ['/sounds/sfx/quest_complete.mp3', '/sounds/sfx/quest_complete.ogg'],
      volume: 0.7
    }
  }
}

// 사운드 매니저 클래스
export class JRPGSoundManager {
  private static instance: JRPGSoundManager
  private sounds: Map<string, Howl> = new Map()
  private currentBGM: Howl | null = null
  private currentBGMId: string | null = null
  private config: SoundConfig = {
    volume: 1.0,
    muted: false,
    bgmVolume: 0.5,
    sfxVolume: 0.7
  }
  
  private constructor() {
    this.loadConfig()
    this.preloadEssentialSounds()
  }
  
  static getInstance(): JRPGSoundManager {
    if (!JRPGSoundManager.instance) {
      JRPGSoundManager.instance = new JRPGSoundManager()
    }
    return JRPGSoundManager.instance
  }
  
  // 설정 로드
  private loadConfig() {
    const savedConfig = localStorage.getItem('jrpg_sound_config')
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig)
        if (Howler) {
          Howler.volume(this.config.volume)
          Howler.mute(this.config.muted)
        }
      } catch (error) {
        console.error('Failed to load sound config:', error)
      }
    }
  }
  
  // 설정 저장
  private saveConfig() {
    localStorage.setItem('jrpg_sound_config', JSON.stringify(this.config))
  }
  
  // 필수 사운드 미리 로드
  private preloadEssentialSounds() {
    // 자주 사용되는 효과음 미리 로드
    const essentialSounds = [
      SOUND_LIBRARY.sfx.menu_select,
      SOUND_LIBRARY.sfx.attack,
      SOUND_LIBRARY.sfx.item_get
    ]
    
    essentialSounds.forEach(soundDef => {
      this.loadSound(soundDef)
    })
  }
  
  // 사운드 로드
  private loadSound(soundDef: SoundDefinition): Howl {
    if (!Howl) {
      return {} as unknown as HowlType // Mock 객체 반환
    }
    
    if (this.sounds.has(soundDef.id)) {
      return this.sounds.get(soundDef.id)!
    }
    
    const sound = new Howl({
      src: soundDef.src,
      loop: soundDef.loop || false,
      volume: soundDef.volume || 1.0,
      sprite: soundDef.sprite,
      html5: true // 모바일 호환성
    })
    
    this.sounds.set(soundDef.id, sound)
    return sound
  }
  
  // BGM 재생
  playBGM(bgmId: keyof typeof SOUND_LIBRARY.bgm, fadeIn: boolean = true) {
    const bgmDef = SOUND_LIBRARY.bgm[bgmId]
    if (!bgmDef) return
    
    // 같은 BGM이 이미 재생 중이면 무시
    if (this.currentBGMId === bgmDef.id) return
    
    // 기존 BGM 페이드 아웃
    if (this.currentBGM) {
      if (fadeIn) {
        this.currentBGM.fade(this.currentBGM.volume(), 0, 1000)
        this.currentBGM.once('fade', () => {
          this.currentBGM?.stop()
        })
      } else {
        this.currentBGM.stop()
      }
    }
    
    // 새 BGM 로드 및 재생
    const bgm = this.loadSound(bgmDef)
    bgm.volume(bgmDef.volume! * this.config.bgmVolume)
    
    if (fadeIn) {
      bgm.volume(0)
      bgm.play()
      bgm.fade(0, bgmDef.volume! * this.config.bgmVolume, 1000)
    } else {
      bgm.play()
    }
    
    this.currentBGM = bgm
    this.currentBGMId = bgmDef.id
  }
  
  // BGM 정지
  stopBGM(fadeOut: boolean = true) {
    if (!this.currentBGM) return
    
    if (fadeOut) {
      this.currentBGM.fade(this.currentBGM.volume(), 0, 1000)
      this.currentBGM.once('fade', () => {
        this.currentBGM?.stop()
        this.currentBGM = null
        this.currentBGMId = null
      })
    } else {
      this.currentBGM.stop()
      this.currentBGM = null
      this.currentBGMId = null
    }
  }
  
  // SFX 재생
  playSFX(sfxId: keyof typeof SOUND_LIBRARY.sfx) {
    if (this.config.muted) return
    
    const sfxDef = SOUND_LIBRARY.sfx[sfxId]
    if (!sfxDef) return
    
    const sfx = this.loadSound(sfxDef)
    sfx.volume(sfxDef.volume! * this.config.sfxVolume)
    sfx.play()
  }
  
  // 스킬 타입에 따른 효과음 재생
  playSkillSFX(element: string) {
    const elementToSFX: Record<string, keyof typeof SOUND_LIBRARY.sfx> = {
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
  
  // 볼륨 설정
  setMasterVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume))
    if (Howler) {
      Howler.volume(this.config.volume)
    }
    this.saveConfig()
  }
  
  setBGMVolume(volume: number) {
    this.config.bgmVolume = Math.max(0, Math.min(1, volume))
    if (this.currentBGM) {
      const bgmDef = Object.values(SOUND_LIBRARY.bgm).find(bgm => bgm.id === this.currentBGMId)
      if (bgmDef) {
        this.currentBGM.volume(bgmDef.volume! * this.config.bgmVolume)
      }
    }
    this.saveConfig()
  }
  
  setSFXVolume(volume: number) {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveConfig()
  }
  
  // 음소거
  toggleMute() {
    this.config.muted = !this.config.muted
    if (Howler) {
      Howler.mute(this.config.muted)
    }
    this.saveConfig()
  }
  
  setMute(muted: boolean) {
    this.config.muted = muted
    if (Howler) {
      Howler.mute(muted)
    }
    this.saveConfig()
  }
  
  // 현재 설정 가져오기
  getConfig(): SoundConfig {
    return { ...this.config }
  }
  
  // 모든 사운드 정지
  stopAll() {
    this.stopBGM(false)
    this.sounds.forEach(sound => sound.stop())
  }
  
  // 리소스 정리
  cleanup() {
    this.stopAll()
    this.sounds.forEach(sound => sound.unload())
    this.sounds.clear()
  }
}

// Synth 사운드 시스템 인터페이스
interface SynthSound {
  playBGM: (bgmId: string) => Promise<void>
  stopBGM: () => void
  playSFX: (sfxId: string) => Promise<void>
  setMasterVolume: (volume: number) => void
  setBGMVolume: (volume: number) => void
  setSFXVolume: (volume: number) => void
  setMute: (muted: boolean) => void
  cleanup: () => void
  resumeContext: () => Promise<void>
}

// 전역 인스턴스 (Howler가 없으면 synth 사용)
let soundManager: SoundManagerType

if (Howl && Howler) {
  soundManager = JRPGSoundManager.getInstance()
} else {
  // Synth 사운드 시스템 사용
  let synthSound: SynthSound
  try {
    const synthModule = require('./sound-system-synth')
    synthSound = synthModule.synthSound
  } catch (error) {
    console.error('[SoundSystem] Failed to load synth sound:', error)
    // 더미 객체 생성
    synthSound = {
      playBGM: () => {},
      stopBGM: () => {},
      playSFX: () => {},
      setMasterVolume: () => {},
      setBGMVolume: () => {},
      setSFXVolume: () => {},
      setMute: () => {},
      cleanup: () => {},
      resumeContext: () => Promise.resolve()
    }
  }
  
  // 저장된 설정 로드
  const loadSavedConfig = () => {
    const savedConfig = localStorage.getItem('jrpg_sound_config')
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig)
      } catch (error) {
        console.error('Failed to load sound config:', error)
      }
    }
    return {
      volume: 1.0,
      muted: false,
      bgmVolume: 0.5,
      sfxVolume: 0.7
    }
  }
  
  // Adapter 패턴으로 인터페이스 맞추기
  soundManager = {
    playBGM: async (bgmId: string, fadeIn?: boolean) => {
      try {
        await synthSound.playBGM(bgmId)
      } catch (error) {
        console.error('[SoundSystem] Error playing BGM:', error)
      }
    },
    stopBGM: (fadeOut?: boolean) => synthSound.stopBGM(),
    playSFX: async (sfxId: string) => {
      try {
        await synthSound.playSFX(sfxId)
      } catch (error) {
        console.error('[SoundSystem] Error playing SFX:', error)
      }
    },
    playSkillSFX: (element: string) => {
      const elementToSFX: Record<string, string> = {
        fire: 'skill_fire',
        ice: 'skill_ice',
        thunder: 'skill_thunder',
        light: 'skill_heal',
        dark: 'skill_debuff',
        physical: 'attack'
      }
      synthSound.playSFX(elementToSFX[element] || 'attack')
    },
    setMasterVolume: (volume: number) => {
      soundManager.config.volume = volume
      synthSound.setMasterVolume(volume)
      // 설정 저장
      localStorage.setItem('jrpg_sound_config', JSON.stringify(soundManager.config))
    },
    setBGMVolume: (volume: number) => {
      soundManager.config.bgmVolume = volume
      synthSound.setBGMVolume(volume)
      // 설정 저장
      localStorage.setItem('jrpg_sound_config', JSON.stringify(soundManager.config))
    },
    setSFXVolume: (volume: number) => {
      soundManager.config.sfxVolume = volume
      synthSound.setSFXVolume(volume)
      // 설정 저장
      localStorage.setItem('jrpg_sound_config', JSON.stringify(soundManager.config))
    },
    toggleMute: function() {
      this.config.muted = !this.config.muted
      synthSound.setMute(this.config.muted)
      // 설정 저장
      localStorage.setItem('jrpg_sound_config', JSON.stringify(this.config))
    },
    setMute: (muted: boolean) => {
      soundManager.config.muted = muted
      synthSound.setMute(muted)
      // 설정 저장
      localStorage.setItem('jrpg_sound_config', JSON.stringify(soundManager.config))
    },
    getConfig: () => {
      // config가 없으면 기본값 반환
      if (!soundManager.config) {
        soundManager.config = {
          volume: 1.0,
          muted: false,
          bgmVolume: 0.5,
          sfxVolume: 0.7
        }
      }
      return { ...soundManager.config }
    },
    stopAll: () => synthSound.stopBGM(),
    cleanup: () => synthSound.cleanup(),
    resumeContext: () => synthSound.resumeContext(),
    config: loadSavedConfig()
  } as SoundManagerType
  
  // 초기 설정 적용
  if (synthSound) {
    synthSound.setMasterVolume(soundManager.config.volume)
    synthSound.setBGMVolume(soundManager.config.bgmVolume)
    synthSound.setSFXVolume(soundManager.config.sfxVolume)
    synthSound.setMute(soundManager.config.muted)
  }
}

export { soundManager }