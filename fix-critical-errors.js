#!/usr/bin/env node

/**
 * Critical Error 자동 수정 스크립트
 * prefer-const 및 no-unused-expressions 오류 수정
 */

const fs = require('fs').promises;
const path = require('path');

const criticalFixes = [
  {
    file: 'components/dungeon/PokemonStyleBattleScreen.tsx',
    fixes: [
      { from: 'let messageType: BattleMessage[\'type\'] = \'normal\'', to: 'const messageType: BattleMessage[\'type\'] = \'normal\'' }
    ]
  },
  {
    file: 'components/equipment/EquipmentScreen.tsx',
    fixes: [
      { from: 'let stats = {', to: 'const stats = {' },
      { from: 'let totalStats = {', to: 'const totalStats = {' }
    ]
  },
  {
    file: 'components/equipment/ImprovedEquipmentScreen.tsx',
    fixes: [
      { from: 'let stats = {', to: 'const stats = {' },
      { from: 'let totalStats = {', to: 'const totalStats = {' }
    ]
  },
  {
    file: 'lib/ai-coach/ai-coach-service.ts',
    fixes: [
      { from: 'let currentDate = new Date()', to: 'const currentDate = new Date()' }
    ]
  },
  {
    file: 'lib/database/index.ts',
    fixes: [
      { from: 'let achievement = await db.userAchievements', to: 'const achievement = await db.userAchievements' }
    ]
  },
  {
    file: 'lib/services/character-integration.service.ts',
    fixes: [
      { from: 'let mp = 50 + (coreStats.learning * 10)', to: 'const mp = 50 + (coreStats.learning * 10)' },
      { from: 'let dodge = 0.05 + (coreStats.relationship * 0.01)', to: 'const dodge = 0.05 + (coreStats.relationship * 0.01)' },
      { from: 'let accuracy = 0.9 + (coreStats.learning * 0.01)', to: 'const accuracy = 0.9 + (coreStats.learning * 0.01)' }
    ]
  }
];

async function fixCriticalErrors() {
  console.log('🔧 Critical Error 수정 시작...\n');
  
  for (const fileConfig of criticalFixes) {
    const filePath = path.join(process.cwd(), fileConfig.file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      for (const fix of fileConfig.fixes) {
        if (content.includes(fix.from)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
          console.log(`✅ ${fileConfig.file}: "${fix.from.substring(0, 30)}..." 수정됨`);
        }
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
      }
    } catch (error) {
      console.error(`❌ ${fileConfig.file} 수정 실패:`, error.message);
    }
  }
  
  console.log('\n✨ Critical Error 수정 완료!');
}

// no-unused-expressions 수정
async function fixUnusedExpressions() {
  console.log('\n🔧 no-unused-expressions 오류 수정 시작...\n');
  
  const patterns = [
    {
      // 조건부 표현식을 if문으로 변환
      pattern: /^(\s*)([^=\s]+)\s*&&\s*([^;]+);?$/gm,
      replacement: '$1if ($2) $3;'
    },
    {
      // 삼항 연산자 단독 사용을 if-else로 변환
      pattern: /^(\s*)([^=\s]+)\s*\?\s*([^:]+)\s*:\s*([^;]+);?$/gm,
      replacement: '$1if ($2) {\n$1  $3;\n$1} else {\n$1  $4;\n$1}'
    }
  ];
  
  const filesToCheck = [
    'lib/services/skill-management.service.ts',
    'components/dashboard/StatCard.tsx',
    'lib/verification/verification-service.ts'
  ];
  
  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      for (const { pattern, replacement } of patterns) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ ${file}: no-unused-expressions 패턴 수정됨`);
      }
    } catch (error) {
      console.error(`❌ ${file} 수정 실패:`, error.message);
    }
  }
}

// 메인 실행
async function main() {
  console.log('🚀 Life RPG PWA Critical Error 자동 수정 도구\n');
  
  await fixCriticalErrors();
  await fixUnusedExpressions();
  
  console.log('\n✅ 모든 Critical Error 수정 완료!');
  console.log('📌 다음 명령어로 빌드를 다시 시도하세요: npm run build');
}

main().catch(console.error);