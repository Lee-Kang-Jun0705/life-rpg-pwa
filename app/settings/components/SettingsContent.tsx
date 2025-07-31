'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/lib/settings/settings-context'
import { useTheme } from '@/contexts/ThemeContext'
import { NavigationBar } from '@/components/NavigationBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { BackupManager } from '@/lib/offline/backup'
import { AISettings } from './AISettings'
import { 
  AICoachModel, 
  AICoachTone, 
  Language 
} from '@/lib/settings/types'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings, resetSettings, isLoading } = useSettings()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<string>('general')
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [backupPassword, setBackupPassword] = useState('')

  const sections = [
    { id: 'general', name: '일반', emoji: '⚙️' },
    { id: 'ai-coach', name: 'AI 코치', emoji: '🤖' },
    { id: 'stats', name: '스탯 설정', emoji: '📊' },
    { id: 'notifications', name: '알림', emoji: '🔔' },
    { id: 'backup', name: '백업', emoji: '💾' },
    { id: 'privacy', name: '개인정보', emoji: '🔒' },
    { id: 'about', name: '정보', emoji: 'ℹ️' }
  ]

  const handleBackup = async () => {
    try {
      const backupData = await BackupManager.createBackup(backupPassword || undefined)
      BackupManager.downloadBackup(backupData)
      alert('백업이 완료되었습니다.')
      setIsBackupModalOpen(false)
      setBackupPassword('')
    } catch (error) {
      alert('백업 중 오류가 발생했습니다.')
    }
  }

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text()
      await BackupManager.restoreBackup(text, backupPassword || undefined)
      alert('복원이 완료되었습니다. 페이지를 새로고침합니다.')
      window.location.reload()
    } catch (error) {
      alert('복원 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">설정</h1>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="md:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{section.emoji}</span>
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="md:col-span-3">
            {/* 일반 설정 */}
            {activeSection === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle>일반 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 언어 설정 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">언어</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSettings({
                        general: { ...settings.general, language: e.target.value as Language }
                      })}
                      className="w-full px-4 py-2 border rounded-lg
                               border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-800"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>

                  {/* 테마 설정 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">테마</label>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'system'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => setTheme(themeOption)}
                          className={`flex-1 py-2 px-4 rounded-lg border ${
                            theme === themeOption
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {themeOption === 'light' && '☀️ 라이트'}
                          {themeOption === 'dark' && '🌙 다크'}
                          {themeOption === 'system' && '💻 시스템'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 효과음 설정 */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">효과음</label>
                    <button
                      onClick={() => updateSettings({
                        general: { ...settings.general, soundEffects: !settings.general.soundEffects }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.general.soundEffects ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.general.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI 코치 설정 */}
            {activeSection === 'ai-coach' && (
              <div className="space-y-6">
                {/* AI API 설정 */}
                <AISettings onSave={() => {
                  // 설정 저장 후 리프레시
                  window.location.reload()
                }} />
                
                {/* AI 코치 기본 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI 코치 스타일</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 코치 톤 선택 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">코치 스타일</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { value: 'friendly', label: '🤗 친근한', name: '친근한 친구' },
                          { value: 'strict', label: '💪 엄격한', name: '엄격한 트레이너' },
                          { value: 'humorous', label: '😄 유머러스', name: '재미있는 코치' },
                          { value: 'mentor', label: '🧙 멘토', name: '지혜로운 멘토' },
                          { value: 'cheerleader', label: '📣 응원단장', name: '열정적인 응원단' }
                        ].map((tone) => (
                          <button
                            key={tone.value}
                            onClick={() => updateSettings({
                              aiCoach: { ...settings.aiCoach, tone: tone.value as AICoachTone }
                            })}
                            className={`p-3 rounded-lg border text-center ${
                              settings.aiCoach.tone === tone.value
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <div className="text-2xl mb-1">{tone.label}</div>
                            <div className="text-xs">{tone.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI 기능 설정 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">일일 리마인더</label>
                        <button
                          onClick={() => updateSettings({
                            aiCoach: { ...settings.aiCoach, dailyReminders: !settings.aiCoach.dailyReminders }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.aiCoach.dailyReminders ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.aiCoach.dailyReminders ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm">동기부여 메시지</label>
                        <button
                          onClick={() => updateSettings({
                            aiCoach: { ...settings.aiCoach, motivationalMessages: !settings.aiCoach.motivationalMessages }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.aiCoach.motivationalMessages ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.aiCoach.motivationalMessages ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm">진행 상황 분석</label>
                        <button
                          onClick={() => updateSettings({
                            aiCoach: { ...settings.aiCoach, progressAnalysis: !settings.aiCoach.progressAnalysis }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.aiCoach.progressAnalysis ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.aiCoach.progressAnalysis ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 백업 설정 */}
            {activeSection === 'backup' && (
              <Card>
                <CardHeader>
                  <CardTitle>백업 및 복원</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 자동 백업 */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">자동 백업</label>
                    <button
                      onClick={() => updateSettings({
                        backup: { ...settings.backup, autoBackup: !settings.backup.autoBackup }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.backup.autoBackup ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.backup.autoBackup ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* 백업 주기 */}
                  {settings.backup.autoBackup && (
                    <div>
                      <label className="block text-sm font-medium mb-2">백업 주기</label>
                      <select
                        value={settings.backup.backupInterval}
                        onChange={(e) => updateSettings({
                          backup: { ...settings.backup, backupInterval: e.target.value as 'daily' | 'weekly' | 'monthly' }
                        })}
                        className="w-full px-4 py-2 border rounded-lg
                                 border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-gray-800"
                      >
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="monthly">매월</option>
                      </select>
                    </div>
                  )}

                  {/* 수동 백업/복원 */}
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setIsBackupModalOpen(true)}
                      className="w-full"
                    >
                      💾 지금 백업하기
                    </Button>

                    <Button 
                      onClick={() => setIsRestoreModalOpen(true)}
                      variant="outline"
                      className="w-full"
                    >
                      📥 백업 파일 복원하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 알림 설정 */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    푸시 알림을 설정하여 중요한 알림을 받아보세요.
                  </p>
                  
                  <Button 
                    onClick={() => router.push('/settings/notifications')}
                    className="w-full"
                  >
                    🔔 알림 설정 페이지로 이동
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 정보 섹션 */}
            {activeSection === 'about' && (
              <Card>
                <CardHeader>
                  <CardTitle>앱 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">버전</span>
                    <span>{settings.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">마지막 업데이트</span>
                    <span>{new Date(settings.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full">
                      📖 사용 가이드
                    </Button>
                    <Button variant="outline" className="w-full">
                      💬 피드백 보내기
                    </Button>
                    <Button 
                      onClick={() => {
                        if (confirm('모든 설정을 초기화하시겠습니까?')) {
                          resetSettings()
                        }
                      }}
                      variant="outline" 
                      className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      🔄 설정 초기화
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 백업 모달 */}
      <Modal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">데이터 백업</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                백업 비밀번호 (선택사항)
              </label>
              <input
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg
                         border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-800"
                placeholder="비밀번호를 입력하면 암호화됩니다"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleBackup} className="flex-1">
                백업 다운로드
              </Button>
              <Button 
                onClick={() => {
                  setIsBackupModalOpen(false)
                  setBackupPassword('')
                }} 
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 복원 모달 */}
      <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">백업 복원</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                백업 파일 선택
              </label>
              <input
                type="file"
                accept=".json,.encrypted"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleRestore(file)
                  }
                }}
                className="w-full"
              />
            </div>

            {backupPassword && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  백업 비밀번호
                </label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg
                           border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800"
                  placeholder="암호화된 백업의 비밀번호"
                />
              </div>
            )}

            <Button 
              onClick={() => {
                setIsRestoreModalOpen(false)
                setBackupPassword('')
              }} 
              variant="outline"
              className="w-full"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      <NavigationBar />
    </main>
  )
}