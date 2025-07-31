// AI 관련 타입 정의

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'model'
  content: string
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'custom'
  apiKey: string
  model: string
  endpoint?: string
  systemPrompt?: string
}

export interface AIResponse {
  content: string
  error?: string
}