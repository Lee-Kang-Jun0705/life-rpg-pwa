// 레벨 동기화 테스트
const { calculateCharacterLevel, getUniqueStats, debugStats } = require('./lib/utils/level-calculator')

// 테스트 데이터
const testStats = [
  { type: 'health', level: 3, experience: 250 },
  { type: 'health', level: 2, experience: 150 }, // 중복
  { type: 'learning', level: 4, experience: 400 },
  { type: 'relationship', level: 2, experience: 180 },
  { type: 'achievement', level: 5, experience: 550 },
  { type: 'achievement', level: 4, experience: 450 } // 중복
]

console.log('=== 레벨 동기화 테스트 ===')
console.log('\n원본 스탯:', testStats.length, '개')

const uniqueStats = getUniqueStats(testStats)
console.log('\n중복 제거 후:', uniqueStats.length, '개')
uniqueStats.forEach(stat => {
  console.log(`- ${stat.type}: Lv.${stat.level} (${stat.experience} EXP)`)
})

const characterLevel = calculateCharacterLevel(testStats)
console.log('\n캐릭터 레벨:', characterLevel)

// 대시보드와 모험 페이지에서 동일한 결과가 나오는지 확인
console.log('\n=== 디버깅 정보 ===')
debugStats(testStats, 'TestScript')
