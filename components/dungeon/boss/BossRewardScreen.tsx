'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BossBattleResult } from '@/lib/types/boss-system';
import { Trophy, Star, Coins, Package, Award } from 'lucide-react';

interface BossRewardScreenProps {
  result: BossBattleResult;
  bossName: string;
  onContinue: () => void;
}

export function BossRewardScreen({ result, bossName, onContinue }: BossRewardScreenProps) {
  if (!result.victory) {
    return (
      <div className="defeat-screen text-center space-y-6 p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-3xl font-bold text-red-500">패배!</h2>
        </motion.div>
        
        <div className="stats bg-gray-800 rounded-lg p-6 space-y-2">
          <p className="text-gray-300">전투 턴 수: {result.turnCount}</p>
          <p className="text-gray-300">입힌 데미지: {result.damageDealt}</p>
          <p className="text-gray-300">받은 데미지: {result.damageTaken}</p>
          <p className="text-gray-300">완료한 페이즈: {result.phasesCompleted}/3</p>
        </div>
        
        <button
          onClick={onContinue}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          재도전
        </button>
      </div>
    );
  }
  
  return (
    <div className="victory-screen text-center space-y-6 p-8">
      {/* 승리 타이틀 */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-4xl font-bold text-yellow-400">승리!</h2>
        <p className="text-xl text-gray-300 mt-2">{bossName}을(를) 물리쳤다!</p>
      </motion.div>
      
      {/* 전투 통계 */}
      <motion.div
        className="stats bg-gray-800 rounded-lg p-6 space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center justify-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          전투 결과
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <p className="text-gray-400">전투 턴 수</p>
            <p className="text-white font-semibold">{result.turnCount}턴</p>
          </div>
          <div className="text-left">
            <p className="text-gray-400">입힌 데미지</p>
            <p className="text-white font-semibold">{result.damageDealt}</p>
          </div>
          <div className="text-left">
            <p className="text-gray-400">받은 데미지</p>
            <p className="text-white font-semibold">{result.damageTaken}</p>
          </div>
          <div className="text-left">
            <p className="text-gray-400">완료 페이즈</p>
            <p className="text-white font-semibold">{result.phasesCompleted}/3</p>
          </div>
        </div>
      </motion.div>
      
      {/* 보상 */}
      {result.rewards && (
        <motion.div
          className="rewards space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
            <Package className="w-5 h-5 text-green-400" />
            획득 보상
          </h3>
          
          {/* 골드 */}
          <div className="reward-item bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-400" />
              <span className="text-white font-semibold">골드</span>
            </div>
            <span className="text-yellow-400 font-bold text-xl">
              +{result.rewards.gold}
            </span>
          </div>
          
          {/* 경험치 */}
          <div className="reward-item bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-blue-400" />
              <span className="text-white font-semibold">경험치</span>
            </div>
            <span className="text-blue-400 font-bold text-xl">
              +{result.rewards.exp}
            </span>
          </div>
          
          {/* 아이템 */}
          {result.rewards.items.length > 0 && (
            <div className="items-container bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">획득 아이템</h4>
              <div className="grid grid-cols-2 gap-2">
                {result.rewards.items.map((item, index) => (
                  <motion.div
                    key={item.itemId}
                    className="item bg-gray-700 rounded p-2 text-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <p className="text-purple-400 font-semibold">{item.itemId}</p>
                    <p className="text-gray-400">x{item.quantity}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* 첫 클리어 보너스 */}
      {result.firstClear && (
        <motion.div
          className="first-clear-bonus bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Award className="w-6 h-6" />
            첫 클리어 보너스!
          </h3>
          {result.achievements && result.achievements.map(achievement => (
            <p key={achievement} className="text-white">
              업적 달성: {achievement}
            </p>
          ))}
        </motion.div>
      )}
      
      {/* 계속하기 버튼 */}
      <motion.button
        onClick={onContinue}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 rounded-lg transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        계속하기
      </motion.button>
    </div>
  );
}