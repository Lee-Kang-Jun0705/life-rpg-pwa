'use client'

import { EnhancedVoiceInput } from './EnhancedVoiceInput'

interface EnhancedVoiceInputWrapperProps {
  onTranscript?: (transcript: string, activityType?: string | null) => void
  onError?: (error: Error) => void
  className?: string
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

export default function EnhancedVoiceInputWrapper(props: EnhancedVoiceInputWrapperProps) {
  return <EnhancedVoiceInput {...props} />
}