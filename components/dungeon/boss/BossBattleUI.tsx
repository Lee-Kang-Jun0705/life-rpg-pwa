'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BossData, BossPhase } from '@/lib/types/boss-system';
import { ElementDisplay } from '../battle/ElementDisplay';
import { Heart, Shield, Zap, Skull } from 'lucide-react';

interface BossBattleUIProps {
  boss: BossData;
  currentPhase: number;
  battleLog: string[];
  onPlayerAction: (action: 'attack' | 'skill' | 'item' | 'flee') => void;
  isPlayerTurn: boolean;
}

export function BossBattleUI({
  boss,
  currentPhase,
  battleLog,
  onPlayerAction,
  isPlayerTurn
}: BossBattleUIProps) {
  const phase = boss.phases.find(p => p.phaseNumber === currentPhase);
  const hpPercent = (boss.hp / boss.maxHp) * 100;
  
  // HP바 색상 결정
  const getHPBarColor = () => {
    if (currentPhase === 3) return 'bg-gradient-to-r from-red-600 to-purple-600';
    if (currentPhase === 2) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-green-500 to-yellow-500';
  };
  
  // 보스 크기에 따른 스타일
  const getBossSizeStyle = () => {
    switch (boss.size) {
      case 'colossal': return 'h-96 w-96';
      case 'huge': return 'h-80 w-80';
      default: return 'h-64 w-64';
    }
  };
  
  return (
    <div className="boss-battle-ui space-y-6">
      {/* 보스 정보 헤더 */}
      <div className="boss-header bg-gray-900 rounded-lg p-4 border-2 border-red-600">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Skull className="w-8 h-8 text-red-500" />
              {boss.name}
            </h2>
            <p className="text-red-400 text-lg">{boss.title}</p>
          </div>
          <ElementDisplay element={boss.element} showLabel size="large" />
        </div>
        
        {/* HP바 */}
        <div className="relative">
          <div className="bg-gray-800 rounded-full h-8 overflow-hidden">
            <motion.div
              className={`h-full ${getHPBarColor()} relative`}
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {boss.hp} / {boss.maxHp} HP
            </span>
          </div>
        </div>
        
        {/* 페이즈 정보 */}
        {phase && (
          <div className="mt-2 text-center">
            <p className="text-yellow-400 font-semibold">
              Phase {phase.phaseNumber}: {phase.name}
            </p>
            <p className="text-gray-400 text-sm">{phase.description}</p>
          </div>
        )}
      </div>
      
      {/* 보스 이미지 영역 */}
      <div className="boss-display relative flex justify-center items-center">
        <motion.div
          className={`relative ${getBossSizeStyle()}`}
          animate={{
            scale: currentPhase === 3 ? [1, 1.05, 1] : 1,
            filter: currentPhase === 3 ? 'drop-shadow(0 0 30px rgba(255,0,0,0.8))' : 'none'
          }}
          transition={{ duration: 2, repeat: currentPhase === 3 ? Infinity : 0 }}
        >
          {/* 보스 이미지 placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border-4 border-red-600">
            <div className="text-center">
              <Skull className="w-32 h-32 text-red-500 mx-auto mb-4" />
              <p className="text-white text-xl font-bold">{boss.name}</p>
            </div>
          </div>
          
          {/* 페이즈별 이펙트 */}
          <AnimatePresence>
            {currentPhase >= 2 && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-lg" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 상태 표시 */}
          <div className="absolute -top-4 -right-4 flex gap-2">
            {boss.immunities?.map(immunity => (
              <div
                key={immunity}
                className="bg-purple-600 text-white px-2 py-1 rounded text-xs"
                title={`면역: ${immunity}`}
              >
                면역
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* 보스 패턴 표시 */}
      <div className="boss-patterns bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          사용 가능한 패턴
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {boss.patterns
            .filter(pattern => pattern.currentCooldown === 0)
            .map(pattern => (
              <div
                key={pattern.id}
                className="bg-gray-700 rounded p-2 text-sm"
              >
                <p className="text-yellow-400 font-semibold">{pattern.name}</p>
                <p className="text-gray-400 text-xs">{pattern.description}</p>
              </div>
            ))}
        </div>
      </div>
      
      {/* 전투 로그 */}
      <div className="battle-log bg-gray-800 rounded-lg p-4 h-32 overflow-y-auto">
        <h3 className="text-white font-semibold mb-2">전투 기록</h3>
        <div className="space-y-1">
          {battleLog.slice(-5).map((log, index) => (
            <motion.p
              key={index}
              className="text-sm text-gray-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {log}
            </motion.p>
          ))}
        </div>
      </div>
      
      {/* 행동 버튼 */}
      <div className="action-buttons grid grid-cols-2 gap-4">
        <button
          onClick={() => onPlayerAction('attack')}
          disabled={!isPlayerTurn}
          className={`
            py-3 px-6 rounded-lg font-semibold transition-all
            ${isPlayerTurn 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          공격
        </button>
        <button
          onClick={() => onPlayerAction('skill')}
          disabled={!isPlayerTurn}
          className={`
            py-3 px-6 rounded-lg font-semibold transition-all
            ${isPlayerTurn 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          스킬
        </button>
        <button
          onClick={() => onPlayerAction('item')}
          disabled={!isPlayerTurn}
          className={`
            py-3 px-6 rounded-lg font-semibold transition-all
            ${isPlayerTurn 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          아이템
        </button>
        <button
          onClick={() => onPlayerAction('flee')}
          disabled={!isPlayerTurn || currentPhase >= 2}
          className={`
            py-3 px-6 rounded-lg font-semibold transition-all
            ${isPlayerTurn && currentPhase < 2
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {currentPhase >= 2 ? '도망칠 수 없다!' : '도망'}
        </button>
      </div>
    </div>
  );
}