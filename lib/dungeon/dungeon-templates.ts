import { Dungeon, Challenge } from './types'

/**
 * 던전 템플릿 데이터
 */
export const DUNGEON_TEMPLATES = {
  // 일일 던전 템플릿
  daily: {
    health: {
      id: 'daily-health-1',
      name: '건강의 시련',
      challenges: [
        {
          id: 'ch-health-1',
          title: '10분 스트레칭',
          description: '간단한 스트레칭으로 하루를 시작하세요',
          type: 'stat' as const,
          targetStat: 'health' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-health-2',
          title: '물 3잔 마시기',
          description: '오전 중에 물을 3잔 이상 마시세요',
          type: 'action' as const,
          targetValue: 3,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    },
    learning: {
      id: 'daily-learning-1',
      name: '지식의 전당',
      challenges: [
        {
          id: 'ch-learn-1',
          title: '독서 20분',
          description: '좋아하는 책을 20분간 읽으세요',
          type: 'time_based' as const,
          targetValue: 20,
          currentValue: 0,
          completed: false,
          timeLimit: 20,
          createdAt: new Date()
        },
        {
          id: 'ch-learn-2',
          title: '새로운 단어 학습',
          description: '새로운 단어나 개념을 하나 학습하세요',
          type: 'stat' as const,
          targetStat: 'learning' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    },
    relationship: {
      id: 'daily-relation-1',
      name: '인연의 고리',
      challenges: [
        {
          id: 'ch-rel-1',
          title: '안부 인사',
          description: '가족이나 친구에게 간단한 안부를 전하세요',
          type: 'stat' as const,
          targetStat: 'relationship' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-rel-2',
          title: '감사 일기',
          description: '오늘 감사한 일 1가지를 기록하세요',
          type: 'action' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    },
    achievement: {
      id: 'daily-achieve-1',
      name: '성취의 길',
      challenges: [
        {
          id: 'ch-ach-1',
          title: '작은 목표 달성',
          description: '오늘의 작은 목표 하나를 완료하세요',
          type: 'stat' as const,
          targetStat: 'achievement' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-ach-2',
          title: '진행 상황 체크',
          description: '진행 중인 프로젝트의 상태를 확인하세요',
          type: 'action' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    }
  },

  // 주간 던전 템플릿
  weekly: {
    balanced: {
      id: 'weekly-balanced-1',
      name: '균형의 시험',
      challenges: [
        {
          id: 'ch-wb-1',
          title: '건강 활동 5회',
          description: '이번 주에 건강 관련 활동을 5회 이상 하세요',
          type: 'stat' as const,
          targetStat: 'health' as const,
          targetValue: 5,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-wb-2',
          title: '학습 시간 3시간',
          description: '이번 주 총 3시간 이상 학습하세요',
          type: 'time_based' as const,
          targetValue: 180,
          currentValue: 0,
          completed: false,
          timeLimit: 10080, // 1주일(분)
          createdAt: new Date()
        },
        {
          id: 'ch-wb-3',
          title: '사회 활동 3회',
          description: '친구나 가족과 의미있는 시간을 3회 가지세요',
          type: 'stat' as const,
          targetStat: 'relationship' as const,
          targetValue: 3,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-wb-4',
          title: '주간 목표 달성',
          description: '이번 주 설정한 목표를 달성하세요',
          type: 'stat' as const,
          targetStat: 'achievement' as const,
          targetValue: 1,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    },
    intensive: {
      id: 'weekly-intensive-1',
      name: '집중 훈련장',
      challenges: [
        {
          id: 'ch-wi-1',
          title: '심화 학습 10시간',
          description: '특정 주제에 대해 10시간 집중 학습하세요',
          type: 'time_based' as const,
          targetValue: 600,
          currentValue: 0,
          completed: false,
          timeLimit: 10080,
          createdAt: new Date()
        },
        {
          id: 'ch-wi-2',
          title: '프로젝트 마일스톤',
          description: '진행 중인 프로젝트의 주요 단계를 완료하세요',
          type: 'stat' as const,
          targetStat: 'achievement' as const,
          targetValue: 3,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    }
  },

  // 특별 던전 템플릿
  special: {
    challenge: {
      id: 'special-challenge-1',
      name: '극한의 도전',
      challenges: [
        {
          id: 'ch-sc-1',
          title: '연속 7일 운동',
          description: '7일 연속으로 운동하세요',
          type: 'combo' as const,
          targetValue: 7,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-sc-2',
          title: '새로운 기술 습득',
          description: '완전히 새로운 기술이나 지식을 습득하세요',
          type: 'stat' as const,
          targetStat: 'learning' as const,
          targetValue: 5,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'ch-sc-3',
          title: '커뮤니티 기여',
          description: '커뮤니티에 도움이 되는 활동을 하세요',
          type: 'stat' as const,
          targetStat: 'relationship' as const,
          targetValue: 3,
          currentValue: 0,
          completed: false,
          createdAt: new Date()
        }
      ]
    }
  }
}
