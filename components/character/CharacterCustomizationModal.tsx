'use client'

import { useState } from 'react'
import { useCharacter } from '@/lib/character'
import { DotCharacter } from '@/components/character/DotCharacter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CharacterAppearance } from '@/lib/character/types'
import { cn } from '@/lib/utils'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#48DBFB', '#A55EEA', '#FD79A8'
]

const STYLES: CharacterAppearance['style'][] = ['emoji', 'pixel']

interface CharacterCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CharacterCustomizationModal({ isOpen, onClose }: CharacterCustomizationModalProps) {
  const { currentAppearance, updateAppearance } = useCharacter()
  const [tempAppearance, setTempAppearance] = useState<CharacterAppearance>(currentAppearance)

  const handleSave = () => {
    updateAppearance(tempAppearance)
    onClose()
  }

  const handleClose = () => {
    setTempAppearance(currentAppearance)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-black bg-gradient-to-r from-candy-purple via-candy-pink to-candy-orange bg-clip-text text-transparent">
            캐릭터 커스터마이징
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            나만의 캐릭터를 꾸며보세요! 🎨
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 미리보기 */}
          <div className="bg-gradient-to-br from-candy-yellow/20 via-candy-pink/20 to-candy-blue/20 rounded-[2rem] p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">미리보기</h3>
            <div className="flex justify-center p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-[1.5rem]">
              <DotCharacter appearance={tempAppearance} size="large" />
            </div>
          </div>

          {/* 커스터마이징 옵션 */}
          <div className="space-y-6">
            {/* 스타일 선택 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">스타일</h3>
              <div className="grid grid-cols-2 gap-3">
                {STYLES.map((style) => (
                  <Button
                    key={style}
                    variant={tempAppearance.style === style ? 'default' : 'outline'}
                    onClick={() => setTempAppearance({ ...tempAppearance, style })}
                    className="h-auto py-4"
                  >
                    <span className="text-2xl mr-2">
                      {style === 'emoji' ? '😊' : '🎮'}
                    </span>
                    {style === 'emoji' ? '이모지' : '픽셀'}
                  </Button>
                ))}
              </div>
            </div>

            {/* 색상 선택 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">색상</h3>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-full aspect-square rounded-2xl transition-all duration-200',
                      'hover:scale-110 active:scale-95',
                      tempAppearance.color === color && 'ring-4 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setTempAppearance({ ...tempAppearance, color })}
                  />
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1"
                size="lg"
              >
                저장하기
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default CharacterCustomizationModal
