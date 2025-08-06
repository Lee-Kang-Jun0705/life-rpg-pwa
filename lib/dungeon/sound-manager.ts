/**
 * 간단한 사운드 매니저
 * Web Audio API를 사용한 기본 효과음 생성
 */

import { createAudioContext, createMasterGain } from '@/lib/utils/audio-context'

export class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.5
  private gainNode: GainNode | null = null
  private activeNodes: Set<AudioNode> = new Set()

  constructor() {
    // 브라우저 환경에서만 초기화
    if (typeof window !== 'undefined') {
      this.initAudioContext()
    }
  }

  private initAudioContext() {
    this.audioContext = createAudioContext({
      latencyHint: 'interactive',
      sampleRate: 22050
    })
    
    if (this.audioContext) {
      this.gainNode = createMasterGain(this.audioContext, this.volume)
      this.enabled = true
    } else {
      this.enabled = false
    }
  }

  /**
   * 사운드 활성화/비활성화
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * 볼륨 설정 (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 공격 효과음
   */
  playAttack() {
    if (!this.enabled || !this.audioContext || !this.gainNode) return

    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.connect(gain)
      gain.connect(this.gainNode)

      osc.frequency.value = 400
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1)
      
      gain.gain.value = 1
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      osc.start()
      osc.stop(this.audioContext.currentTime + 0.1)
      
      // 메모리 정리
      this.activeNodes.add(osc)
      this.activeNodes.add(gain)
      osc.addEventListener('ended', () => {
        this.activeNodes.delete(osc)
        this.activeNodes.delete(gain)
        osc.disconnect()
        gain.disconnect()
      })
    } catch (error) {
      console.error('Error playing attack sound:', error)
    }
  }

  /**
   * 피격 효과음
   */
  playHit() {
    if (!this.enabled || !this.audioContext || !this.gainNode) return

    try {
      const noise = this.createNoise(0.05)
      const filter = this.audioContext.createBiquadFilter()
      const gain = this.audioContext.createGain()

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.gainNode)

      filter.type = 'lowpass'
      filter.frequency.value = 800

      gain.gain.value = 0.5
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05)

      noise.start()
      
      // 메모리 정리
      this.activeNodes.add(noise)
      this.activeNodes.add(filter)
      this.activeNodes.add(gain)
      noise.addEventListener('ended', () => {
        this.activeNodes.delete(noise)
        this.activeNodes.delete(filter)
        this.activeNodes.delete(gain)
        noise.disconnect()
        filter.disconnect()
        gain.disconnect()
      })
    } catch (error) {
      console.error('Error playing hit sound:', error)
    }
  }

  /**
   * 승리 효과음
   */
  playVictory() {
    if (!this.enabled || !this.audioContext) return

    try {
      const osc1 = this.audioContext.createOscillator()
      const osc2 = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.audioContext.destination)

      osc1.frequency.value = 523.25 // C5
      osc2.frequency.value = 659.25 // E5

      gain.gain.value = this.volume * 0.3
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

      osc1.start()
      osc2.start()
      osc1.stop(this.audioContext.currentTime + 0.5)
      osc2.stop(this.audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing victory sound:', error)
    }
  }

  /**
   * 아이템 획득 효과음
   */
  playItemDrop() {
    if (!this.enabled || !this.audioContext) return

    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.connect(gain)
      gain.connect(this.audioContext.destination)

      osc.frequency.value = 800
      osc.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.1)
      
      gain.gain.value = this.volume * 0.3
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

      osc.start()
      osc.stop(this.audioContext.currentTime + 0.2)
    } catch (error) {
      console.error('Error playing item drop sound:', error)
    }
  }

  /**
   * 배속에 따른 효과음 재생
   */
  playWithSpeed(soundType: 'attack' | 'hit' | 'victory' | 'item', speed: number = 1) {
    // 배속이 빠를수록 피치를 약간 높임
    const originalVolume = this.volume
    this.volume = this.volume * (1 / speed) // 배속이 빠르면 볼륨 감소

    switch (soundType) {
      case 'attack':
        this.playAttack()
        break
      case 'hit':
        this.playHit()
        break
      case 'victory':
        this.playVictory()
        break
      case 'item':
        this.playItemDrop()
        break
    }

    this.volume = originalVolume
  }

  /**
   * 노이즈 생성 (피격음용)
   */
  private createNoise(duration: number): AudioBufferSourceNode {
    const bufferSize = this.audioContext!.sampleRate * duration
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const output = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext!.createBufferSource()
    noise.buffer = buffer

    return noise
  }

  /**
   * 정리
   */
  cleanup() {
    // 모든 활성 노드 정리
    this.activeNodes.forEach(node => {
      try {
        node.disconnect()
      } catch (e) {
        // 이미 연결 해제된 경우 무시
      }
    })
    this.activeNodes.clear()
    
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    
    // AudioContext는 suspend로 유지 (빠른 재시작 가능)
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend()
    }
  }
}

// 싱글톤 인스턴스
export const soundManager = new SoundManager()