/**
 * 공통 AudioContext 유틸리티
 * Web Audio API 초기화 및 타입 안전성 제공
 */

export interface AudioContextOptions {
  latencyHint?: 'balanced' | 'interactive' | 'playback'
  sampleRate?: number
}

/**
 * 브라우저 호환성을 고려한 AudioContext 생성
 */
export function createAudioContext(options?: AudioContextOptions): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // webkit 접두사가 있는 브라우저 지원
    const AudioContextClass = window.AudioContext || 
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) {
      console.warn('[AudioContext] Web Audio API is not supported')
      return null
    }

    return new AudioContextClass({
      latencyHint: options?.latencyHint || 'interactive',
      sampleRate: options?.sampleRate || 22050
    })
  } catch (error) {
    console.error('[AudioContext] Failed to create AudioContext:', error)
    return null
  }
}

/**
 * AudioContext 상태 확인 및 재개
 */
export async function resumeAudioContext(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
      console.log('[AudioContext] Resumed successfully')
    } catch (error) {
      console.error('[AudioContext] Failed to resume:', error)
    }
  }
}

/**
 * 마스터 게인 노드 생성
 */
export function createMasterGain(
  audioContext: AudioContext,
  initialVolume: number = 0.5
): GainNode {
  const gainNode = audioContext.createGain()
  gainNode.gain.value = Math.max(0, Math.min(1, initialVolume))
  gainNode.connect(audioContext.destination)
  return gainNode
}

/**
 * 컴프레서 노드 생성 (오디오 품질 향상)
 */
export function createCompressor(audioContext: AudioContext): DynamicsCompressorNode {
  const compressor = audioContext.createDynamicsCompressor()
  compressor.threshold.value = -24
  compressor.knee.value = 30
  compressor.ratio.value = 12
  compressor.attack.value = 0.003
  compressor.release.value = 0.25
  return compressor
}