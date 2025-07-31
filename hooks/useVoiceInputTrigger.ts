import { useCallback } from 'react'

export function useVoiceInputTrigger() {
  const triggerVoiceInput = useCallback(() => {
    const voiceButton = document.querySelector('[aria-label="음성으로 활동 기록"]') as HTMLButtonElement
    if (voiceButton) {
      voiceButton.click()
    } else {
      console.warn('Voice input button not found')
    }
  }, [])

  return { triggerVoiceInput }
}