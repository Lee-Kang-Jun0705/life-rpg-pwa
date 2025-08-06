// 음성 입력 테스트 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🔧 음성 입력 테스트 시작...\n');

// 1. 단일 입력 테스트
console.log('1️⃣ 단일 입력 테스트');
window.testVoiceInput("테스트 운동 30분", "health");

// 2초 후 중복 입력 테스트
setTimeout(() => {
  console.log('\n2️⃣ 동일한 입력 다시 시도 (중복 방지 확인)');
  window.testVoiceInput("테스트 운동 30분", "health");
}, 2000);

// 4초 후 다른 활동 테스트
setTimeout(() => {
  console.log('\n3️⃣ 다른 활동 입력');
  window.testVoiceInput("독서 1시간", "learning");
}, 4000);

// 6초 후 다른 스탯 같은 내용 테스트
setTimeout(() => {
  console.log('\n4️⃣ 다른 스탯에 같은 내용');
  window.testVoiceInput("테스트 운동 30분", "achievement");
}, 6000);

// 12초 후 첫 번째와 동일한 입력 (재시도 가능해야 함)
setTimeout(() => {
  console.log('\n5️⃣ 10초 후 첫 번째와 동일한 입력 (재시도 가능)');
  window.testVoiceInput("테스트 운동 30분", "health");
}, 12000);

console.log('\n📊 콘솔 로그를 확인하여 중복 저장이 발생하는지 확인하세요.');
console.log('- "📊📊📊 중복 활동 감지, 무시" 메시지가 나타나면 정상');
console.log('- "💾💾💾 DB에 저장할 activityData" 메시지가 한 번만 나타나야 함');