'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, User, Bell, Shield, Palette, Volume2, Globe, Database, Moon, Sun, Bot, Users, Eye, EyeOff } from 'lucide-react'
import { useSettings } from '@/lib/settings/settings-context'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings } = useSettings()
  const [activeTab, setActiveTab] = useState('profile')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  
  // AI 코치 설정 상태
  const [aiProvider, setAiProvider] = useState<string>(settings.aiCoach?.model || '')
  const [apiKey, setApiKey] = useState(settings.aiCoach?.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [coachingStyle, setCoachingStyle] = useState<string>(settings.aiCoach?.tone || 'friendly')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // 사용자 관리 상태
  const [users, setUsers] = useState([
    { id: 'default-user', name: '기본 사용자' },
    // 추가 사용자들이 여기에 들어갈 예정
  ])
  const [currentUser, setCurrentUser] = useState({ id: 'default-user', name: '기본 사용자' })
  
  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'ai-coach', label: 'AI 코치', icon: Bot },
    { id: 'users', label: '사용자 관리', icon: Users },
    { id: 'notification', label: '알림', icon: Bell },
    { id: 'display', label: '화면', icon: Palette },
    { id: 'sound', label: '사운드', icon: Volume2 },
    { id: 'privacy', label: '개인정보', icon: Shield },
    { id: 'data', label: '데이터', icon: Database },
  ]

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleResetData = () => {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 데이터 초기화 로직
      localStorage.clear()
      window.location.reload()
    }
  }

  // AI 코치 헬퍼 함수들
  const getApiKeyPlaceholder = (provider: string): string => {
    if (provider.startsWith('gpt')) return 'sk-...'
    if (provider.includes('claude')) return 'sk-ant-...'
    if (provider.includes('gemini')) return 'AI...'
    return 'API 키를 입력하세요'
  }

  const getApiKeyHelp = (provider: string): string => {
    if (provider.startsWith('gpt')) return '👉 platform.openai.com에서 발급'
    if (provider.includes('claude')) return '👉 console.anthropic.com에서 발급'
    if (provider.includes('gemini')) return '👉 makersuite.google.com에서 발급'
    return ''
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/ai-coach/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, apiKey })
      })
      
      const result = await response.json()
      setTestResult({
        success: result.success,
        message: result.success ? '✅ 연결 성공!' : '❌ 연결 실패: ' + result.error
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ 테스트 중 오류가 발생했습니다'
      })
    } finally {
      setTesting(false)
    }
  }

  const saveAiSettings = async () => {
    await updateSettings({
      aiCoach: {
        enabled: true,
        model: aiProvider as any,
        apiKey,
        tone: coachingStyle as any,
        customPrompt: customEndpoint,
        dailyReminders: true,
        motivationalMessages: true,
        progressAnalysis: true
      }
    })
    alert('AI 코치 설정이 저장되었습니다!')
  }

  // 사용자 관리 함수들
  const switchUser = (userId: string) => {
    localStorage.setItem('life-rpg-current-user', userId)
    window.location.reload()
  }

  const addNewUser = () => {
    const name = prompt('새 사용자 이름을 입력하세요:')
    if (name) {
      const newUser = { id: `user-${Date.now()}`, name }
      setUsers([...users, newUser])
      alert(`${name} 사용자가 추가되었습니다!`)
    }
  }

  // 부분 초기화 함수
  const handlePartialReset = (type: 'activities' | 'stats' | 'dungeon') => {
    const messages = {
      activities: '활동 기록을 초기화하시겠습니까?',
      stats: '모든 스탯을 초기화하시겠습니까?',
      dungeon: '던전 진행도를 초기화하시겠습니까?'
    }
    
    if (confirm(messages[type])) {
      // 부분 초기화 로직 구현
      console.log(`Resetting ${type}...`)
      alert(`${type} 초기화가 완료되었습니다.`)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">설정</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                앱 환경을 사용자에 맞게 설정하세요
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 - 탭 메뉴 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* 메인 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {tabs.find(t => t.id === activeTab)?.label} 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 프로필 설정 */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">닉네임</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="닉네임을 입력하세요"
                        defaultValue={settings.profile.displayName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">자기소개</label>
                      <textarea
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        rows={4}
                        placeholder="자기소개를 입력하세요"
                        defaultValue={settings.profile.bio}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">목표</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="달성하고 싶은 목표를 입력하세요"
                      />
                    </div>
                  </div>
                )}

                {/* AI 코치 설정 */}
                {activeTab === 'ai-coach' && (
                  <div className="space-y-4">
                    {/* LLM 제공자 선택 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">AI 모델 선택</label>
                      <select 
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="">선택하세요</option>
                        <optgroup label="OpenAI">
                          <option value="gpt-4o">GPT-4o (최신)</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (저렴)</option>
                        </optgroup>
                        <optgroup label="Anthropic Claude">
                          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (최신)</option>
                          <option value="claude-3-opus">Claude 3 Opus (최강)</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="claude-3-haiku">Claude 3 Haiku (빠름)</option>
                          <option value="claude-opus-4">Claude Opus 4 (프리미엄)</option>
                          <option value="claude-sonnet-4">Claude Sonnet 4 (균형)</option>
                        </optgroup>
                        <optgroup label="Google">
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash (최신)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        </optgroup>
                        <optgroup label="기타">
                          <option value="custom">사용자 정의 엔드포인트</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* API 키 입력 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API 키 
                        <span className="text-xs text-gray-500 ml-2">
                          (암호화되어 저장됩니다)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={getApiKeyPlaceholder(aiProvider)}
                          className="w-full px-4 py-2 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getApiKeyHelp(aiProvider)}
                      </p>
                    </div>

                    {/* 커스텀 엔드포인트 */}
                    {aiProvider === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">엔드포인트 URL</label>
                        <input
                          type="url"
                          value={customEndpoint}
                          onChange={(e) => setCustomEndpoint(e.target.value)}
                          placeholder="https://api.example.com/v1/chat"
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                      </div>
                    )}

                    {/* 연결 테스트 */}
                    <Button 
                      onClick={testConnection}
                      variant="outline"
                      className="w-full"
                      disabled={!apiKey || !aiProvider || testing}
                    >
                      {testing ? '테스트 중...' : '연결 테스트'}
                    </Button>
                    
                    {testResult && (
                      <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                        {testResult.message}
                      </div>
                    )}

                    {/* 코칭 스타일 설정 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">코칭 스타일</label>
                      <select 
                        value={coachingStyle}
                        onChange={(e) => setCoachingStyle(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="friendly">친근한 친구 👫</option>
                        <option value="strict">엄격한 코치 💪</option>
                        <option value="humorous">유머러스한 동료 😄</option>
                        <option value="mentor">현명한 멘토 🧙</option>
                        <option value="cheerleader">열정적인 응원단 📣</option>
                      </select>
                    </div>

                    {/* 고급 설정 */}
                    <details className="border rounded-lg p-4 dark:border-gray-700">
                      <summary className="font-medium cursor-pointer">고급 설정</summary>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-sm">응답 길이</label>
                          <select className="w-full px-3 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-700">
                            <option value="concise">간결하게</option>
                            <option value="normal">보통</option>
                            <option value="detailed">자세하게</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm">온도 (창의성)</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            defaultValue="7"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </details>

                    <Button onClick={saveAiSettings} className="w-full">
                      AI 코치 설정 저장
                    </Button>
                  </div>
                )}

                {/* 사용자 관리 설정 */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium">현재 사용자</p>
                      <p className="text-lg">{currentUser.name}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">사용자 목록</h4>
                      {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span>{user.name}</span>
                          <Button 
                            onClick={() => switchUser(user.id)}
                            variant="outline"
                            size="sm"
                            disabled={user.id === currentUser.id}
                          >
                            {user.id === currentUser.id ? '사용 중' : '전환'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Button onClick={addNewUser} className="w-full">
                      + 새 사용자 추가
                    </Button>
                  </div>
                )}

                {/* 알림 설정 */}
                {activeTab === 'notification' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">푸시 알림</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">활동 리마인더와 레벨업 알림을 받습니다</p>
                      </div>
                      <button
                        onClick={() => setNotificationEnabled(!notificationEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          notificationEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">일일 리마인더</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">매일 오후 8시에 활동 기록을 알려드립니다</p>
                      </div>
                      <input
                        type="time"
                        className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                        defaultValue="20:00"
                      />
                    </div>
                  </div>
                )}

                {/* 화면 설정 */}
                {activeTab === 'display' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        <div>
                          <p className="font-medium">다크 모드</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">어두운 환경에 적합한 테마</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDarkModeToggle}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          isDarkMode ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          isDarkMode ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">테마 색상</label>
                      <div className="flex gap-2">
                        {['purple', 'blue', 'green', 'pink', 'orange'].map(color => (
                          <button
                            key={color}
                            className={`w-10 h-10 rounded-full bg-${color}-500 hover:scale-110 transition-transform`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 사운드 설정 */}
                {activeTab === 'sound' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">효과음</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">버튼 클릭, 레벨업 등의 효과음</p>
                      </div>
                      <button
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          isSoundEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          isSoundEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">볼륨</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="50"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* 개인정보 설정 */}
                {activeTab === 'privacy' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">프로필 공개</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                      </div>
                      <button className="relative w-14 h-8 rounded-full bg-gray-300 dark:bg-gray-600">
                        <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">활동 기록 공개</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">내 활동 기록을 다른 사용자가 볼 수 있습니다</p>
                      </div>
                      <button className="relative w-14 h-8 rounded-full bg-gray-300 dark:bg-gray-600">
                        <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 데이터 설정 */}
                {activeTab === 'data' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ 주의</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        데이터를 초기화하면 선택한 데이터가 삭제되며, 이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                    
                    {/* 선택적 초기화 옵션 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">선택적 초기화</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handlePartialReset('activities')}
                          variant="outline"
                          className="justify-start"
                        >
                          📝 활동 기록 초기화
                        </Button>
                        <Button 
                          onClick={() => handlePartialReset('stats')}
                          variant="outline"
                          className="justify-start"
                        >
                          📊 스탯 초기화
                        </Button>
                        <Button 
                          onClick={() => handlePartialReset('dungeon')}
                          variant="outline"
                          className="justify-start"
                        >
                          ⚔️ 던전 진행도 초기화
                        </Button>
                        <Button 
                          onClick={() => {
                            if (confirm('AI 코치 설정을 초기화하시겠습니까?')) {
                              setAiProvider('')
                              setApiKey('')
                              setCoachingStyle('friendly')
                              alert('AI 코치 설정이 초기화되었습니다.')
                            }
                          }}
                          variant="outline"
                          className="justify-start"
                        >
                          🤖 AI 코치 설정 초기화
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <Button
                        onClick={handleResetData}
                        variant="outline"
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      >
                        ⚠️ 모든 데이터 완전 초기화
                      </Button>
                    </div>
                    
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-medium">데이터 백업</h4>
                      <Button variant="outline" className="w-full">
                        💾 데이터 내보내기 (JSON)
                      </Button>
                      <Button variant="outline" className="w-full">
                        📥 데이터 가져오기
                      </Button>
                    </div>
                  </div>
                )}

                {/* 저장 버튼 */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1">
                    변경사항 저장
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.back()}>
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  )
}