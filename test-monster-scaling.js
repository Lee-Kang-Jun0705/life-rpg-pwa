// 몬스터 난이도 스케일링 테스트

// 던전 타입별 기본 배율
const dungeonTypeMultipliers = {
  'daily': 1.0,       // 일일 던전: 기본
  'weekly': 1.3,      // 주간 던전: 30% 강화
  'special': 1.5,     // 특별 던전: 50% 강화
  'event': 1.8,       // 이벤트 던전: 80% 강화
  'infinite': 2.0     // 무한의 탑: 100% 강화
};

// 던전 난이도별 추가 배율
const dungeonDifficultyMultipliers = {
  'easy': 0.8,
  'normal': 1.0,
  'hard': 1.3,
  'expert': 1.6,
  'legendary': 2.0
};

// 선택된 난이도에 따른 추가 배율
const selectedDifficultyMultipliers = {
  'easy': 0.8,
  'normal': 1.0,
  'hard': 1.5,
  'expert': 2.0,
  'legendary': 3.0
};

// 테스트 케이스
const testCases = [
  { dungeonType: 'daily', dungeonDifficulty: 'normal', selectedDifficulty: 'normal' },
  { dungeonType: 'daily', dungeonDifficulty: 'normal', selectedDifficulty: 'hard' },
  { dungeonType: 'weekly', dungeonDifficulty: 'hard', selectedDifficulty: 'normal' },
  { dungeonType: 'weekly', dungeonDifficulty: 'hard', selectedDifficulty: 'hard' },
  { dungeonType: 'special', dungeonDifficulty: 'expert', selectedDifficulty: 'expert' },
  { dungeonType: 'infinite', dungeonDifficulty: 'legendary', selectedDifficulty: 'legendary' },
];

// 기본 몬스터 스탯
const baseMonster = {
  hp: 100,
  attack: 20,
  defense: 10
};

console.log('=== 던전별 몬스터 난이도 스케일링 테스트 ===\n');

testCases.forEach((testCase, index) => {
  const dungeonTypeMultiplier = dungeonTypeMultipliers[testCase.dungeonType] || 1.0;
  const dungeonDiffMultiplier = dungeonDifficultyMultipliers[testCase.dungeonDifficulty] || 1.0;
  const selectedDiffMultiplier = selectedDifficultyMultipliers[testCase.selectedDifficulty] || 1.0;
  
  // 최종 배율 = 던전 타입 배율 × 던전 난이도 배율 × 선택 난이도 배율
  const finalMultiplier = dungeonTypeMultiplier * dungeonDiffMultiplier * selectedDiffMultiplier;
  
  const scaledMonster = {
    hp: Math.floor(baseMonster.hp * finalMultiplier),
    attack: Math.floor(baseMonster.attack * finalMultiplier),
    defense: Math.floor(baseMonster.defense * finalMultiplier)
  };
  
  console.log(`테스트 ${index + 1}:`);
  console.log(`  던전 타입: ${testCase.dungeonType} (×${dungeonTypeMultiplier})`);
  console.log(`  던전 난이도: ${testCase.dungeonDifficulty} (×${dungeonDiffMultiplier})`);
  console.log(`  선택된 난이도: ${testCase.selectedDifficulty} (×${selectedDiffMultiplier})`);
  console.log(`  최종 배율: ×${finalMultiplier.toFixed(2)}`);
  console.log(`  몬스터 스탯:`);
  console.log(`    HP: ${baseMonster.hp} → ${scaledMonster.hp} (${scaledMonster.hp / baseMonster.hp}배)`);
  console.log(`    공격력: ${baseMonster.attack} → ${scaledMonster.attack} (${scaledMonster.attack / baseMonster.attack}배)`);
  console.log(`    방어력: ${baseMonster.defense} → ${scaledMonster.defense} (${scaledMonster.defense / baseMonster.defense}배)`);
  console.log('');
});

console.log('=== 요약 ===');
console.log('- 일일 던전(normal/normal): 기본 스탯');
console.log('- 일일 던전(normal/hard): 1.5배');
console.log('- 주간 던전(hard/normal): 1.69배');
console.log('- 주간 던전(hard/hard): 2.535배');
console.log('- 특별 던전(expert/expert): 4.8배');
console.log('- 무한의 탑(legendary/legendary): 12배');