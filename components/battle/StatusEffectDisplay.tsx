'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusEffect } from '@/lib/types/status-effects';

interface StatusEffectDisplayProps {
  effects: StatusEffect[];
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export function StatusEffectDisplay({ 
  effects, 
  size = 'medium',
  showDetails = true 
}: StatusEffectDisplayProps) {
  if (effects.length === 0) return null;
  
  const iconSize = size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl';
  const containerClass = size === 'small' ? 'gap-1' : size === 'medium' ? 'gap-2' : 'gap-3';
  
  return (
    <div className={`flex flex-wrap items-center ${containerClass}`}>
      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative group"
          >
            {/* 상태이상 아이콘 */}
            <div className={`
              relative flex items-center justify-center
              ${size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full
              ${effect.category === 'buff' 
                ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/50' 
                : 'bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-400/50'
              }
            `}>
              <span className={iconSize}>{effect.icon}</span>
              
              {/* 지속 시간 표시 */}
              {showDetails && (
                <div className={`
                  absolute -bottom-1 -right-1
                  ${size === 'small' ? 'w-4 h-4 text-xs' : size === 'medium' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'}
                  rounded-full flex items-center justify-center font-bold
                  ${effect.category === 'buff' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                  }
                `}>
                  {effect.duration}
                </div>
              )}
              
              {/* 중첩 수 표시 */}
              {effect.stackable && effect.currentStacks > 1 && (
                <div className={`
                  absolute -top-1 -right-1
                  ${size === 'small' ? 'w-4 h-4 text-xs' : size === 'medium' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'}
                  rounded-full flex items-center justify-center font-bold
                  bg-purple-600 text-white
                `}>
                  {effect.currentStacks}
                </div>
              )}
            </div>
            
            {/* 툴팁 */}
            {showDetails && (
              <div className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                opacity-0 group-hover:opacity-100 transition-opacity
                pointer-events-none z-50
                whitespace-nowrap
              ">
                <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm">
                  <p className="font-semibold">{effect.name}</p>
                  <p className="text-xs text-gray-300 mt-1">{effect.description}</p>
                  {effect.stackable && (
                    <p className="text-xs text-blue-300 mt-1">
                      중첩: {effect.currentStacks}/{effect.maxStacks}
                    </p>
                  )}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 간단한 상태이상 표시 (전투 중 캐릭터 위)
export function StatusEffectIcons({ effects }: { effects: StatusEffect[] }) {
  if (effects.length === 0) return null;
  
  return (
    <div className="flex gap-1 justify-center mt-1">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className={`
            text-xs
            ${effect.category === 'buff' ? 'text-green-400' : 'text-red-400'}
          `}
          title={`${effect.name} (${effect.duration}턴)`}
        >
          {effect.icon}
        </div>
      ))}
    </div>
  );
}

// 상태이상 로그 메시지
export function StatusEffectMessage({ 
  type, 
  message 
}: { 
  type: 'apply' | 'resist' | 'expire' | 'damage' | 'heal' | 'skip';
  message: string;
}) {
  const getMessageStyle = () => {
    switch (type) {
      case 'apply':
        return 'text-purple-400';
      case 'resist':
        return 'text-gray-400';
      case 'expire':
        return 'text-blue-400';
      case 'damage':
        return 'text-red-400';
      case 'heal':
        return 'text-green-400';
      case 'skip':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'apply':
        return '✨';
      case 'resist':
        return '🛡️';
      case 'expire':
        return '💨';
      case 'damage':
        return '💔';
      case 'heal':
        return '💚';
      case 'skip':
        return '⏭️';
      default:
        return '';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`text-sm ${getMessageStyle()} flex items-center gap-1`}
    >
      <span>{getIcon()}</span>
      <span>{message}</span>
    </motion.div>
  );
}