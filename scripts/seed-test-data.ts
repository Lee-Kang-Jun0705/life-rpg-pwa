import { dbHelpers } from '../lib/database/client';
import { calculateLevelDetails } from '../lib/types/dashboard';

async function seedTestData() {
  const userId = 'test-user-123';
  
  try {
    console.log('테스트 데이터 시드 시작...');

    // 프로필 생성
    const profile = await dbHelpers.getProfile(userId);
    if (!profile) {
      await dbHelpers.createProfile(userId, {
        name: 'Test User',
        avatar: '👤',
        level: 1,
        experience: 0,
        title: '초보 모험가'
      });
      console.log('프로필 생성 완료');
    }

    // 스탯 데이터 추가
    const statTypes = ['health', 'learning', 'relationship', 'achievement'];
    const baseExp = 100; // 각 스탯 레벨 5 정도

    for (const statType of statTypes) {
      // 기존 스탯 확인
      const stats = await dbHelpers.getStats(userId);
      const existingStat = stats.find(s => s.type === statType);
      
      if (!existingStat) {
        // 스탯 생성
        const levelDetails = calculateLevelDetails(baseExp);
        console.log(`${statType} 스탯 생성 - 레벨 ${levelDetails.level}`);
        
        // 일일 활동 추가 (경험치 획득)
        for (let i = 0; i < 5; i++) {
          await dbHelpers.trackDailyActivity(userId, statType, 20); // 20 exp x 5 = 100 exp
        }
      }
    }

    // 최종 스탯 확인
    const finalStats = await dbHelpers.getStats(userId);
    console.log('\n최종 스탯:');
    for (const stat of finalStats) {
      const levelDetails = calculateLevelDetails(stat.experience);
      console.log(`- ${stat.type}: 레벨 ${levelDetails.level} (${stat.experience} EXP)`);
    }

    const totalLevel = finalStats.reduce((sum, stat) => {
      const levelDetails = calculateLevelDetails(stat.experience);
      return sum + levelDetails.level;
    }, 0);
    console.log(`\n총 캐릭터 레벨: ${totalLevel}`);

    console.log('\n테스트 데이터 시드 완료!');
  } catch (error) {
    console.error('테스트 데이터 시드 실패:', error);
  }
}

// 실행
seedTestData();