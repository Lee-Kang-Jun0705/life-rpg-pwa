export interface StatAction {
  action: string
  emoji: string
}

export interface StatActionsConfig {
  health: StatAction[]
  learning: StatAction[]
  relationship: StatAction[]
  achievement: StatAction[]
}

export const DEFAULT_STAT_ACTIONS: StatActionsConfig = {
  health: [
    { action: '운동하기', emoji: '🏃' },
    { action: '산책하기', emoji: '🚶' },
    { action: '물 마시기', emoji: '💧' },
    { action: '건강식 먹기', emoji: '🥗' },
    { action: '스트레칭', emoji: '🧘' },
    { action: '충분한 수면', emoji: '😴' }
  ],
  learning: [
    { action: '책 읽기', emoji: '📖' },
    { action: '복습하기', emoji: '📝' },
    { action: '강의 듣기', emoji: '🎧' },
    { action: '문제 풀기', emoji: '✏️' },
    { action: '정리하기', emoji: '📋' },
    { action: '노트 작성', emoji: '📓' }
  ],
  relationship: [
    { action: '안부 인사', emoji: '👋' },
    { action: '친구 만나기', emoji: '👥' },
    { action: '가족 시간', emoji: '👨‍👩‍👧‍👦' },
    { action: '선물하기', emoji: '🎁' },
    { action: '감사 표현', emoji: '💝' },
    { action: '함께 식사', emoji: '🍽️' }
  ],
  achievement: [
    { action: '목표 설정', emoji: '🎯' },
    { action: '일정 정리', emoji: '📅' },
    { action: '업무 집중', emoji: '💼' },
    { action: '성과 기록', emoji: '📊' },
    { action: '계획 수립', emoji: '📝' },
    { action: '회고하기', emoji: '🤔' }
  ]
}