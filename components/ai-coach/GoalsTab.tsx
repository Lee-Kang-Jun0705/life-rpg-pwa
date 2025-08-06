'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle, Circle, Plus, Trash2, Edit, Save, X } from 'lucide-react'
import { useSettings } from '@/lib/settings/settings-context'

interface SubGoal {
  id: string
  text: string
  completed: boolean
}

interface MainGoal {
  id: string
  title: string
  description: string
  category: 'dream' | 'growth' | 'career'
  subGoals: SubGoal[]
  progress: number
}

export function GoalsTab() {
  const { settings } = useSettings()
  const [goals, setGoals] = useState<MainGoal[]>([])
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [newGoalForm, setNewGoalForm] = useState<Partial<MainGoal> | null>(null)
  const [aiSuggesting, setAiSuggesting] = useState(false)

  // 로컬 스토리지에서 목표 불러오기
  useEffect(() => {
    const savedGoals = localStorage.getItem('life-rpg-goals')
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  // 목표 저장
  const saveGoals = (newGoals: MainGoal[]) => {
    setGoals(newGoals)
    localStorage.setItem('life-rpg-goals', JSON.stringify(newGoals))
  }

  // AI로 목표 추천받기
  const getAISuggestions = async () => {
    if (!settings.aiCoach.apiKey) {
      alert('AI 코치 설정에서 API 키를 먼저 입력해주세요.')
      return
    }

    setAiSuggesting(true)
    try {
      // AI API 호출 시뮬레이션 (실제로는 API 라우트를 통해 호출)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 예시 목표 생성
      const suggestedGoals: MainGoal[] = [
        {
          id: `goal-${Date.now()}-1`,
          title: '건강한 라이프스타일 구축',
          description: '규칙적인 운동과 균형잡힌 식단으로 건강한 몸과 마음 만들기',
          category: 'growth',
          subGoals: [
            { id: `sub-${Date.now()}-1`, text: '주 3회 이상 30분 운동하기', completed: false },
            { id: `sub-${Date.now()}-2`, text: '매일 물 8잔 이상 마시기', completed: false },
            { id: `sub-${Date.now()}-3`, text: '주 5일 이상 채소 포함 식사하기', completed: false }
          ],
          progress: 0
        },
        {
          id: `goal-${Date.now()}-2`,
          title: '전문성 향상을 위한 학습',
          description: '관심 분야의 전문 지식을 쌓아 경쟁력 있는 전문가로 성장',
          category: 'career',
          subGoals: [
            { id: `sub-${Date.now()}-4`, text: '매일 30분 이상 전문 서적 읽기', completed: false },
            { id: `sub-${Date.now()}-5`, text: '월 1회 온라인 강의 수강하기', completed: false },
            { id: `sub-${Date.now()}-6`, text: '배운 내용 블로그에 정리하기', completed: false }
          ],
          progress: 0
        },
        {
          id: `goal-${Date.now()}-3`,
          title: '의미있는 인간관계 구축',
          description: '가족, 친구와의 관계를 더욱 돈독히 하고 새로운 인연 만들기',
          category: 'dream',
          subGoals: [
            { id: `sub-${Date.now()}-7`, text: '주 1회 가족과 식사하기', completed: false },
            { id: `sub-${Date.now()}-8`, text: '월 2회 친구들과 만나기', completed: false },
            { id: `sub-${Date.now()}-9`, text: '새로운 모임이나 동호회 참여하기', completed: false }
          ],
          progress: 0
        }
      ]
      
      saveGoals(suggestedGoals)
    } catch (error) {
      console.error('AI 추천 실패:', error)
      alert('AI 추천을 받는 중 오류가 발생했습니다.')
    } finally {
      setAiSuggesting(false)
    }
  }

  // 서브 목표 토글
  const toggleSubGoal = (goalId: string, subGoalId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedSubGoals = goal.subGoals.map(sub =>
          sub.id === subGoalId ? { ...sub, completed: !sub.completed } : sub
        )
        const completedCount = updatedSubGoals.filter(sub => sub.completed).length
        const progress = Math.round((completedCount / updatedSubGoals.length) * 100)
        return { ...goal, subGoals: updatedSubGoals, progress }
      }
      return goal
    })
    saveGoals(updatedGoals)
  }

  // 목표 삭제
  const deleteGoal = (goalId: string) => {
    if (confirm('이 목표를 삭제하시겠습니까?')) {
      saveGoals(goals.filter(g => g.id !== goalId))
    }
  }

  // 새 목표 추가
  const addNewGoal = () => {
    setNewGoalForm({
      title: '',
      description: '',
      category: 'growth',
      subGoals: [
        { id: `sub-new-1`, text: '', completed: false },
        { id: `sub-new-2`, text: '', completed: false },
        { id: `sub-new-3`, text: '', completed: false }
      ],
      progress: 0
    })
  }

  // 목표 저장
  const saveNewGoal = () => {
    if (newGoalForm && newGoalForm.title && newGoalForm.subGoals) {
      const validSubGoals = newGoalForm.subGoals.filter(sub => sub.text.trim())
      if (validSubGoals.length === 0) {
        alert('최소 하나의 세부 목표를 입력해주세요.')
        return
      }
      
      const newGoal: MainGoal = {
        id: `goal-${Date.now()}`,
        title: newGoalForm.title,
        description: newGoalForm.description || '',
        category: newGoalForm.category || 'growth',
        subGoals: validSubGoals.map((sub, idx) => ({
          ...sub,
          id: `sub-${Date.now()}-${idx}`
        })),
        progress: 0
      }
      
      saveGoals([...goals, newGoal])
      setNewGoalForm(null)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dream': return 'from-purple-500 to-pink-500'
      case 'growth': return 'from-green-500 to-emerald-500'
      case 'career': return 'from-blue-500 to-indigo-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'dream': return '꿈 & 목표'
      case 'growth': return '개인 성장'
      case 'career': return '커리어'
      default: return '기타'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <span>목표 관리</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={getAISuggestions}
                variant="outline"
                size="sm"
                disabled={aiSuggesting}
              >
                {aiSuggesting ? '추천 중...' : '🤖 AI 추천'}
              </Button>
              <Button
                onClick={addNewGoal}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                새 목표
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            큰 목표 3개와 각각의 실천 가능한 작은 목표 3개를 설정하여 체계적으로 성장하세요.
          </p>
        </CardContent>
      </Card>

      {/* 목표 리스트 */}
      <AnimatePresence mode="wait">
        {goals.length === 0 && !newGoalForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">아직 설정된 목표가 없습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI 추천을 받거나 직접 목표를 추가해보세요
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={getAISuggestions} disabled={aiSuggesting}>
                {aiSuggesting ? '추천 중...' : '🤖 AI 추천받기'}
              </Button>
              <Button onClick={addNewGoal} variant="outline">
                직접 추가하기
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${getCategoryColor(goal.category)}`} />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            {getCategoryLabel(goal.category)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {goal.progress}% 완료
                          </span>
                        </div>
                        <h3 className="text-lg font-bold">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => deleteGoal(goal.id)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 진행도 바 */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <motion.div
                        className={`h-2 rounded-full bg-gradient-to-r ${getCategoryColor(goal.category)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* 서브 목표 */}
                    <div className="space-y-2">
                      {goal.subGoals.map(subGoal => (
                        <div
                          key={subGoal.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                          onClick={() => toggleSubGoal(goal.id, subGoal.id)}
                        >
                          {subGoal.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${subGoal.completed ? 'line-through text-gray-500' : ''}`}>
                            {subGoal.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* 새 목표 추가 폼 */}
            {newGoalForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">새 목표 추가</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">카테고리</label>
                      <select
                        value={newGoalForm.category}
                        onChange={(e) => setNewGoalForm({
                          ...newGoalForm,
                          category: e.target.value as 'dream' | 'growth' | 'career'
                        })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="dream">꿈 & 목표</option>
                        <option value="growth">개인 성장</option>
                        <option value="career">커리어</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">목표 제목</label>
                      <input
                        type="text"
                        value={newGoalForm.title}
                        onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                        placeholder="예: 건강한 라이프스타일 구축"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">설명 (선택)</label>
                      <textarea
                        value={newGoalForm.description}
                        onChange={(e) => setNewGoalForm({ ...newGoalForm, description: e.target.value })}
                        placeholder="목표에 대한 설명을 입력하세요"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">실천 목표 (최소 1개)</label>
                      <div className="space-y-2">
                        {newGoalForm.subGoals?.map((sub, idx) => (
                          <input
                            key={sub.id}
                            type="text"
                            value={sub.text}
                            onChange={(e) => {
                              const updatedSubGoals = [...(newGoalForm.subGoals || [])]
                              updatedSubGoals[idx] = { ...sub, text: e.target.value }
                              setNewGoalForm({ ...newGoalForm, subGoals: updatedSubGoals })
                            }}
                            placeholder={`실천 목표 ${idx + 1}`}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => setNewGoalForm(null)}
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-1" />
                        취소
                      </Button>
                      <Button
                        onClick={saveNewGoal}
                        disabled={!newGoalForm.title}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}