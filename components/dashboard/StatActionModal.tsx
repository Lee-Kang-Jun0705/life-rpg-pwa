import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatType } from '@/lib/types/dashboard'
import { useStatActions } from '@/contexts/StatActionsContext'
import { Edit2, Plus, Trash2, Check, X, RotateCcw } from 'lucide-react'

interface StatActionModalProps {
  isOpen: boolean
  statType: StatType | null
  onClose: () => void
  onAction: (action: string) => void
}

interface EditingAction {
  index: number
  action: string
  emoji: string
}

export const StatActionModal = React.memo(function StatActionModal({
  isOpen,
  statType,
  onClose,
  onAction
}: StatActionModalProps) {
  const { statActions, updateAction, addAction, deleteAction, resetToDefault } = useStatActions()
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAction, setEditingAction] = useState<EditingAction | null>(null)
  const [newAction, setNewAction] = useState({ action: '', emoji: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  
  if (!statType) return null

  const actions = statActions[statType.type as keyof typeof statActions] || []

  const handleAction = (action: string) => {
    if (!isEditMode) {
      onAction(action)
      onClose()
    }
  }

  const handleSaveEdit = () => {
    if (editingAction && editingAction.action.trim() && editingAction.emoji.trim()) {
      updateAction(
        statType.type as keyof typeof statActions, 
        editingAction.index, 
        { action: editingAction.action, emoji: editingAction.emoji }
      )
      setEditingAction(null)
    }
  }

  const handleAddNew = () => {
    if (newAction.action.trim() && newAction.emoji.trim()) {
      addAction(statType.type as keyof typeof statActions, newAction)
      setNewAction({ action: '', emoji: '' })
      setShowAddForm(false)
    }
  }

  const handleDelete = (index: number) => {
    if (confirm('이 활동을 삭제하시겠습니까?')) {
      deleteAction(statType.type as keyof typeof statActions, index)
    }
  }

  const handleReset = () => {
    if (confirm('기본 활동 목록으로 초기화하시겠습니까?')) {
      resetToDefault(statType.type as keyof typeof statActions)
      setIsEditMode(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-sm w-full"
          >
            {/* 모달 컨텐츠 */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">{statType.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {statType.name} 활동 선택
                </h3>
                {/* 편집 모드 토글 */}
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="absolute top-4 left-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="편집 모드"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isEditMode && (
                  <button
                    onClick={handleReset}
                    className="absolute top-4 left-14 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="기본값 복원"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 액션 그리드 */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {actions.map((item, index) => (
                  editingAction?.index === index ? (
                    // 편집 폼
                    <div key={index} className="flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                      <input
                        type="text"
                        value={editingAction.emoji}
                        onChange={(e) => setEditingAction({ ...editingAction, emoji: e.target.value })}
                        className="w-12 h-12 text-2xl text-center mb-1 bg-white dark:bg-gray-800 rounded-lg border"
                        placeholder="🙂"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={editingAction.action}
                        onChange={(e) => setEditingAction({ ...editingAction, action: e.target.value })}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border"
                        placeholder="활동명"
                      />
                      <div className="flex gap-1 mt-1">
                        <button onClick={handleSaveEdit} className="p-1 text-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditingAction(null)} className="p-1 text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 버튼
                    <motion.div
                      key={`${statType.type}-${item.action}-${index}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <button
                        onClick={() => handleAction(item.action)}
                        className="w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-md hover:shadow-lg"
                      >
                        <div className="text-3xl mb-1">{item.emoji}</div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                          {item.action}
                        </span>
                      </button>
                      {isEditMode && (
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingAction({ index, ...item })}
                            className="p-1 bg-blue-500 text-white rounded-full"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-1 bg-red-500 text-white rounded-full"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                ))}
                
                {/* 추가 버튼 */}
                {isEditMode && actions.length < 9 && (
                  showAddForm ? (
                    // 추가 폼
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                      <input
                        type="text"
                        value={newAction.emoji}
                        onChange={(e) => setNewAction({ ...newAction, emoji: e.target.value })}
                        className="w-12 h-12 text-2xl text-center mb-1 bg-white dark:bg-gray-800 rounded-lg border"
                        placeholder="🙂"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={newAction.action}
                        onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                        className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border"
                        placeholder="활동명"
                      />
                      <div className="flex gap-1 mt-1">
                        <button onClick={handleAddNew} className="p-1 text-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => {
                          setShowAddForm(false)
                          setNewAction({ action: '', emoji: '' })
                        }} className="p-1 text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 추가 버튼
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: actions.length * 0.05 }}
                      onClick={() => setShowAddForm(true)}
                      className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-md hover:shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-500"
                    >
                      <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                        추가
                      </span>
                    </motion.button>
                  )
                )}
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="닫기"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})