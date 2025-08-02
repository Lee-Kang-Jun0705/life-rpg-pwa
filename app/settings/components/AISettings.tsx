'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Save, TestTube, Sparkles } from 'lucide-react'
import { SecureAIStorage, type AIConfig } from '@/lib/ai-coach/secure-storage'

interface AISettingsProps {
  onSave?: () => void
}

const AI_PROVIDERS = [
  { id: 'none', name: '사용 안함', description: '규칙 기반 응답만 사용' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-3.5/GPT-4', models: ['gpt-3.5-turbo', 'gpt-4'] },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude', models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229'] },
  { id: 'google', name: 'Google', description: 'Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
  { id: 'groq', name: 'Groq', description: '빠른 추론', models: ['mixtral-8x7b-32768', 'llama2-70b-4096'] },
  { id: 'custom', name: '사용자 정의', description: '직접 설정' }
]

export function AISettings({ onSave }: AISettingsProps) {
  const [provider, setProvider] = useState('none')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // 기존 설정 불러오기
  useEffect(() => {
    const loadConfig = async() => {
      const config = await SecureAIStorage.getConfig()
      if (config) {
        setProvider(config.provider)
        setApiKey(config.apiKey)
        setModel(config.model)
        setCustomEndpoint(config.endpoint || '')
      }
    }
    loadConfig()
  }, [])

  const handleSave = async() => {
    // 암호화된 저장소에 저장
    const config: AIConfig = {
      provider,
      apiKey,
      model,
      endpoint: customEndpoint || undefined
    }

    await SecureAIStorage.saveConfig(config)

    alert('AI 설정이 안전하게 저장되었습니다.')
    onSave?.()
  }

  const handleTest = async() => {
    if (!apiKey || provider === 'none') {
      setTestResult({ success: false, message: 'API 키를 입력해주세요.' })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'API 테스트입니다. 간단히 응답해주세요.',
          stats: [],
          growthAnalyses: [],
          activityPattern: null,
          // 테스트용 환경변수 전달
          testConfig: {
            provider,
            apiKey,
            model,
            endpoint: customEndpoint
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.response) {
        setTestResult({
          success: true,
          message: `연결 성공! ${data.provider} (${data.model})`
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'API 연결 실패'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const selectedProvider = AI_PROVIDERS.find(p => p.id === provider)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 제공자 선택 */}
        <div>
          <label className="block text-sm font-medium mb-2">AI 제공자</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value)
              setModel('') // 제공자 변경시 모델 초기화
            }}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            {AI_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* API 키 입력 */}
        {provider !== 'none' && (
          <div>
            <label className="block text-sm font-medium mb-2">API 키</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* 모델 선택 */}
        {provider !== 'none' && provider !== 'custom' && selectedProvider?.models && (
          <div>
            <label className="block text-sm font-medium mb-2">모델</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">모델 선택...</option>
              {selectedProvider.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* 사용자 정의 설정 */}
        {provider === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">엔드포인트 URL</label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat"
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">모델 이름</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="custom-model-name"
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </>
        )}

        {/* 테스트 결과 */}
        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleTest}
            variant="outline"
            disabled={provider === 'none' || !apiKey || isTesting}
            className="flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            {isTesting ? '테스트 중...' : '연결 테스트'}
          </Button>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            저장
          </Button>
        </div>

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>• AI API를 설정하면 더 똑똑한 AI 코치를 사용할 수 있습니다.</p>
          <p>• API 키는 각 제공자의 웹사이트에서 발급받을 수 있습니다.</p>
          <p>• 설정하지 않아도 기본 규칙 기반 응답을 사용할 수 있습니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
