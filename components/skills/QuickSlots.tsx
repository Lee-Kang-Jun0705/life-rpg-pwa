'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SkillSlot } from '@/lib/services/skill-management.service'
import type { Skill } from '@/lib/types/skill-system'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { X, Plus } from 'lucide-react'

interface QuickSlotsProps {
  slots: SkillSlot[]
  onAssignSkill: (skillId: string, slot: number) => void
  onRemoveSkill: (slot: number) => void
  selectedSkill: Skill | null
}

export function QuickSlots({
  slots,
  onAssignSkill,
  onRemoveSkill,
  selectedSkill
}: QuickSlotsProps) {
  const handleDrop = (e: React.DragEvent, slot: number) => {
    e.preventDefault()
    const skillId = e.dataTransfer.getData('skillId')
    if (skillId) {
      onAssignSkill(skillId, slot)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">⌨️</span>
        퀵슬롯
      </h3>

      <div className="space-y-4">
        {/* 1-5번 슬롯 */}
        <div className="grid grid-cols-5 gap-2">
          {slots.slice(0, 5).map((slot) => {
            const skill = slot.skillId ? skillManagementService.getSkill(slot.skillId) : null

            return (
              <motion.div
                key={slot.slot}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square"
                onDrop={(e) => handleDrop(e, slot.slot)}
                onDragOver={handleDragOver}
              >
                <div className={`
                  w-full h-full rounded-lg border-2 border-dashed
                  ${skill ? 'border-purple-500 bg-gray-700' : 'border-gray-600 bg-gray-900'}
                  flex items-center justify-center cursor-pointer
                  hover:border-purple-400 transition-all
                `}>
                  {skill ? (
                    <>
                      <span className="text-3xl">{skill.icon}</span>
                      {/* 제거 버튼 */}
                      <button
                        onClick={() => onRemoveSkill(slot.slot)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
                        data-testid={`remove-slot-${slot.slot}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* 스킬 이름 툴팁 */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
                        <div className="bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                          {skill.name}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Plus className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                {/* 슬롯 번호 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                  {slot.slot}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 6-10번 슬롯 */}
        <div className="grid grid-cols-5 gap-2">
          {slots.slice(5, 10).map((slot) => {
            const skill = slot.skillId ? skillManagementService.getSkill(slot.skillId) : null

            return (
              <motion.div
                key={slot.slot}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square"
                onDrop={(e) => handleDrop(e, slot.slot)}
                onDragOver={handleDragOver}
              >
                <div className={`
                  w-full h-full rounded-lg border-2 border-dashed
                  ${skill ? 'border-purple-500 bg-gray-700' : 'border-gray-600 bg-gray-900'}
                  flex items-center justify-center cursor-pointer
                  hover:border-purple-400 transition-all
                `}>
                  {skill ? (
                    <>
                      <span className="text-3xl">{skill.icon}</span>
                      {/* 제거 버튼 */}
                      <button
                        onClick={() => onRemoveSkill(slot.slot)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* 스킬 이름 툴팁 */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
                        <div className="bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                          {skill.name}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Plus className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                {/* 슬롯 번호 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                  {slot.slot}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {selectedSkill && selectedSkill.type !== 'passive' ? (
          <div className="text-purple-400">
            {`스킬 상세에서 슬롯 버튼을 클릭하여 "${selectedSkill.name}"을(를) 할당하세요`}
          </div>
        ) : (
          '학습한 액티브 스킬을 퀵슬롯에 할당하여 빠르게 사용할 수 있습니다'
        )}
      </div>
    </div>
  )
}
