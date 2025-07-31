// 던전별 몬스터 난이도 적용 확인 테스트

// 테스트 던전 예시
const testDungeons = [
  {
    id: 'daily-health-1',
    name: '건강의 시련',
    type: 'daily',
    difficulty: 'normal'
  },
  {
    id: 'weekly-balanced-1', 
    name: '균형의 시험',
    type: 'weekly',
    difficulty: 'hard'
  },
  {
    id: 'special-challenge-1',
    name: '극한의 도전',
    type: 'special',
    difficulty: 'nightmare'
  }
];

// 난이도별 배율 계산 함수
function calculateFinalMultiplier(dungeonType, dungeonDifficulty, selectedDifficulty) {
  const dungeonTypeMultipliers = {
    'daily': 1.0,
    'weekly': 1.3,
    'special': 1.5,
    'event': 1.8,
    'infinite': 2.0
  };

  const dungeonDifficultyMultipliers = {
    'easy': 0.8,
    'normal': 1.0,
    'hard': 1.3,
    'expert': 1.6,
    'legendary': 2.0,
    'nightmare': 1.6  // nightmare는 expert와 동일하게 취급
  };

  const selectedDifficultyMultipliers = {
    'easy': 0.8,
    'normal': 1.0,
    'hard': 1.5,
    'expert': 2.0,
    'legendary': 3.0,
    'nightmare': 2.0  // nightmare는 expert와 동일하게 취급
  };

  const typeMultiplier = dungeonTypeMultipliers[dungeonType] || 1.0;
  const diffMultiplier = dungeonDifficultyMultipliers[dungeonDifficulty] || 1.0;
  const selectedMultiplier = selectedDifficultyMultipliers[selectedDifficulty] || 1.0;

  return typeMultiplier * diffMultiplier * selectedMultiplier;
}

console.log('=== 던전별 몬스터 난이도 적용 확인 ===\n');

testDungeons.forEach(dungeon => {
  console.log(`던전: ${dungeon.name} (${dungeon.id})`);
  console.log(`  타입: ${dungeon.type}`);
  console.log(`  기본 난이도: ${dungeon.difficulty}`);
  console.log('  선택 가능한 난이도별 최종 배율:');
  
  ['easy', 'normal', 'hard', 'expert', 'legendary'].forEach(selectedDiff => {
    const multiplier = calculateFinalMultiplier(
      dungeon.type,
      dungeon.difficulty,
      selectedDiff
    );
    console.log(`    ${selectedDiff}: ×${multiplier.toFixed(2)}`);
  });
  console.log('');
});

console.log('=== 구현 확인 사항 ===');
console.log('1. generateStageMonsters 메서드에서 finalMultiplier 계산');
console.log('2. 몬스터 HP, 공격력, 방어력에 finalMultiplier 적용');
console.log('3. console.log로 적용된 배율 출력');
console.log('4. 실제 전투에서 몬스터 스탯이 증가했는지 확인');