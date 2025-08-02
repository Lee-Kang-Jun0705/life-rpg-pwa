/**
 * 던전별 히든 마일스톤 설정
 * 각 던전마다 다른 클리어 횟수 요구사항으로 예측 불가능하게 설계
 */

export interface DungeonMilestoneConfig {
  dungeonId: number
  milestones: {
    threshold: number
    title: string
    goldReward: number
    itemRewards?: Array<{
      type: 'consumable' | 'equipment' | 'skill'
      id: string
      name: string
      quantity: number
    }>
  }[]
}

// 던전별 마일스톤 설정 (예측 불가능한 패턴)
export const DUNGEON_MILESTONES: DungeonMilestoneConfig[] = [
  {
    dungeonId: 1, // 초보자의 숲
    milestones: [
      { threshold: 5, title: '숲의 친구', goldReward: 500 },
      { threshold: 20, title: '숲의 수호자', goldReward: 2000 },
      { threshold: 50, title: '숲의 전설', goldReward: 5000 }
    ]
  },
  {
    dungeonId: 2, // 고블린 동굴
    milestones: [
      { threshold: 3, title: '고블린 사냥꾼', goldReward: 1000 },
      { threshold: 15, title: '고블린 학살자', goldReward: 4000 },
      { threshold: 40, title: '고블린의 악몽', goldReward: 10000 }
    ]
  },
  {
    dungeonId: 3, // 버려진 광산
    milestones: [
      { threshold: 7, title: '광부의 영혼', goldReward: 2000 },
      { threshold: 25, title: '광산의 정복자', goldReward: 8000 },
      { threshold: 60, title: '언데드 파괴자', goldReward: 20000 }
    ]
  },
  {
    dungeonId: 4, // 얼어붙은 호수
    milestones: [
      { threshold: 4, title: '서리 저항자', goldReward: 3000 },
      { threshold: 18, title: '얼음 파괴자', goldReward: 12000 },
      { threshold: 45, title: '빙하의 주인', goldReward: 30000 }
    ]
  },
  {
    dungeonId: 5, // 용의 둥지
    milestones: [
      { threshold: 6, title: '용 사냥 견습생', goldReward: 5000 },
      { threshold: 30, title: '드래곤 슬레이어', goldReward: 20000 },
      { threshold: 75, title: '용왕 정복자', goldReward: 50000 }
    ]
  },
  {
    dungeonId: 6, // 늪지대
    milestones: [
      { threshold: 8, title: '독 면역자', goldReward: 6000 },
      { threshold: 35, title: '늪의 정화자', goldReward: 25000 },
      { threshold: 80, title: '독의 지배자', goldReward: 60000 }
    ]
  },
  {
    dungeonId: 7, // 사막 신전
    milestones: [
      { threshold: 5, title: '사막의 방랑자', goldReward: 8000 },
      { threshold: 22, title: '신전 약탈자', goldReward: 35000 },
      { threshold: 55, title: '파라오의 저주', goldReward: 80000 }
    ]
  },
  {
    dungeonId: 8, // 화산 분화구
    milestones: [
      { threshold: 10, title: '불꽃 저항자', goldReward: 10000 },
      { threshold: 40, title: '용암 정복자', goldReward: 45000 },
      { threshold: 100, title: '화염의 군주', goldReward: 100000 }
    ]
  },
  {
    dungeonId: 9, // 심해 동굴
    milestones: [
      { threshold: 7, title: '심해 탐험가', goldReward: 12000 },
      { threshold: 28, title: '바다의 지배자', goldReward: 55000 },
      { threshold: 70, title: '크라켄 사냥꾼', goldReward: 120000 }
    ]
  },
  {
    dungeonId: 10, // 천공의 탑
    milestones: [
      { threshold: 9, title: '하늘의 도전자', goldReward: 15000 },
      { threshold: 38, title: '천상의 정복자', goldReward: 70000 },
      { threshold: 90, title: '대천사의 라이벌', goldReward: 150000 }
    ]
  },
  {
    dungeonId: 11, // 지옥문
    milestones: [
      { threshold: 12, title: '악마 사냥꾼', goldReward: 20000 },
      { threshold: 50, title: '지옥의 정복자', goldReward: 90000 },
      { threshold: 120, title: '지옥 군주의 숙적', goldReward: 200000 }
    ]
  },
  {
    dungeonId: 12, // 시간의 미궁
    milestones: [
      { threshold: 15, title: '시간 여행자', goldReward: 25000 },
      { threshold: 60, title: '시공의 지배자', goldReward: 120000 },
      { threshold: 150, title: '영원의 수호자', goldReward: 250000 }
    ]
  },
  {
    dungeonId: 13, // 그림자 성
    milestones: [
      { threshold: 11, title: '그림자 추적자', goldReward: 30000 },
      { threshold: 45, title: '어둠의 정복자', goldReward: 150000 },
      { threshold: 110, title: '그림자 왕의 숙적', goldReward: 300000 }
    ]
  },
  {
    dungeonId: 14, // 신들의 정원
    milestones: [
      { threshold: 13, title: '신성한 도전자', goldReward: 40000 },
      { threshold: 55, title: '신들의 심판자', goldReward: 200000 },
      { threshold: 130, title: '신을 넘어선 자', goldReward: 400000 }
    ]
  },
  {
    dungeonId: 15, // 무한의 심연
    milestones: [
      { threshold: 20, title: '심연의 탐구자', goldReward: 50000 },
      { threshold: 80, title: '무한의 정복자', goldReward: 300000 },
      { threshold: 200, title: '차원을 초월한 자', goldReward: 500000 }
    ]
  }
]

// 마일스톤 달성 여부 확인
export function checkMilestoneUnlocked(dungeonId: number, clearCount: number): number[] {
  const config = DUNGEON_MILESTONES.find(d => d.dungeonId === dungeonId)
  if (!config) return []
  
  return config.milestones
    .filter(m => clearCount >= m.threshold)
    .map(m => m.threshold)
}

// 특정 마일스톤 정보 가져오기
export function getMilestoneInfo(dungeonId: number, threshold: number) {
  const config = DUNGEON_MILESTONES.find(d => d.dungeonId === dungeonId)
  if (!config) return null
  
  return config.milestones.find(m => m.threshold === threshold) || null
}

// 다음 마일스톤까지 남은 클리어 수
export function getNextMilestone(dungeonId: number, currentClears: number) {
  const config = DUNGEON_MILESTONES.find(d => d.dungeonId === dungeonId)
  if (!config) return null
  
  const nextMilestone = config.milestones.find(m => m.threshold > currentClears)
  if (!nextMilestone) return null
  
  return {
    threshold: nextMilestone.threshold,
    remaining: nextMilestone.threshold - currentClears
  }
}