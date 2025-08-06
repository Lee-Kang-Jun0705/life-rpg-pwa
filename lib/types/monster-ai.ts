// 몬스터 AI 패턴 타입
export type AIPattern = 'aggressive' | 'defensive' | 'balanced' | 'support' | 'berserker' | 'tactician'

// AI 행동 타입
export type AIAction = 'attack' | 'defend' | 'heal' | 'buff' | 'debuff' | 'special'

// AI 행동 결정 결과
export interface AIDecision {
  action: AIAction
  targetId?: number // 타겟이 필요한 경우
  skill?: string // 사용할 스킬
  priority: number // 행동 우선순위
}

// 몬스터 AI 상태
export interface MonsterAIState {
  pattern: AIPattern
  aggression: number // 0-100, 공격성
  intelligence: number // 0-100, 지능
  teamwork: number // 0-100, 협동성
  currentMood: 'calm' | 'angry' | 'defensive' | 'desperate'
}

// AI 패턴별 특성
export const AI_PATTERN_TRAITS: Record<AIPattern, {
  name: string
  description: string
  baseTraits: {
    aggression: number
    intelligence: number
    teamwork: number
  }
  preferredActions: AIAction[]
}> = {
  aggressive: {
    name: '공격적',
    description: '높은 데미지 딜링에 집중합니다.',
    baseTraits: {
      aggression: 80,
      intelligence: 30,
      teamwork: 20
    },
    preferredActions: ['attack', 'special']
  },
  defensive: {
    name: '방어적',
    description: '생존을 우선시하며 신중하게 행동합니다.',
    baseTraits: {
      aggression: 20,
      intelligence: 60,
      teamwork: 40
    },
    preferredActions: ['defend', 'heal', 'debuff']
  },
  balanced: {
    name: '균형잡힌',
    description: '상황에 따라 유연하게 대응합니다.',
    baseTraits: {
      aggression: 50,
      intelligence: 50,
      teamwork: 50
    },
    preferredActions: ['attack', 'defend', 'special']
  },
  support: {
    name: '지원형',
    description: '아군을 도와주는 것을 우선시합니다.',
    baseTraits: {
      aggression: 30,
      intelligence: 70,
      teamwork: 90
    },
    preferredActions: ['heal', 'buff', 'debuff']
  },
  berserker: {
    name: '광전사',
    description: '체력이 낮을수록 더 강해집니다.',
    baseTraits: {
      aggression: 100,
      intelligence: 10,
      teamwork: 10
    },
    preferredActions: ['attack', 'special']
  },
  tactician: {
    name: '전술가',
    description: '매우 지능적으로 전투를 이끌어갑니다.',
    baseTraits: {
      aggression: 40,
      intelligence: 90,
      teamwork: 70
    },
    preferredActions: ['debuff', 'special', 'attack']
  }
}

// AI 결정 로직
export function getAIAction(monster: any, playerTeam: any[], enemyTeam: any[]): AIDecision {
  // 간단한 AI 로직 구현
  const hpPercent = (monster.hp / monster.maxHp) * 100;
  
  if (hpPercent < 30) {
    return { action: 'heal', priority: 90 };
  }
  
  if (Math.random() > 0.7) {
    return { action: 'special', priority: 70 };
  }
  
  return { action: 'attack', targetId: playerTeam[0]?.id, priority: 50 };
}

export class MonsterAI {
  // 현재 상태에 따른 mood 업데이트
  static updateMood(
    currentHp: number,
    maxHp: number,
    allyCount: number,
    pattern: AIPattern
  ): MonsterAIState['currentMood'] {
    const hpRatio = currentHp / maxHp

    if (pattern === 'berserker' && hpRatio < 0.3) {
      return 'angry'
    }

    if (hpRatio < 0.2) {
      return 'desperate'
    }

    if (hpRatio < 0.5 && allyCount === 0) {
      return 'defensive'
    }

    if (hpRatio > 0.8 && allyCount > 1) {
      return 'calm'
    }

    return 'calm'
  }

  // AI 행동 결정
  static decideAction(
    aiState: MonsterAIState,
    battleContext: {
      selfHp: number
      selfMaxHp: number
      playerHp: number
      playerMaxHp: number
      allyCount: number
      turnCount: number
    }
  ): AIDecision {
    const { pattern, currentMood } = aiState
    const traits = AI_PATTERN_TRAITS[pattern]
    const hpRatio = battleContext.selfHp / battleContext.selfMaxHp
    const playerHpRatio = battleContext.playerHp / battleContext.playerMaxHp

    // 광전사 패턴: 체력이 낮을수록 공격적
    if (pattern === 'berserker' && hpRatio < 0.5) {
      return {
        action: 'special',
        priority: 100
      }
    }

    // 지원형 패턴: 아군이 있고 체력이 낮으면 힐
    if (pattern === 'support' && battleContext.allyCount > 0 && hpRatio < 0.7) {
      return {
        action: 'heal',
        priority: 80
      }
    }

    // 전술가 패턴: 플레이어가 강하면 디버프
    if (pattern === 'tactician' && playerHpRatio > 0.7) {
      return {
        action: 'debuff',
        priority: 70
      }
    }

    // 방어적 패턴: 체력이 낮으면 방어
    if (pattern === 'defensive' && hpRatio < 0.4) {
      return {
        action: 'defend',
        priority: 90
      }
    }

    // desperate 상태: 특수 공격 시도
    if (currentMood === 'desperate') {
      return {
        action: 'special',
        priority: 95
      }
    }

    // 기본 공격
    return {
      action: 'attack',
      priority: 50
    }
  }

  // 행동 우선순위에 따른 정렬
  static sortByPriority(decisions: AIDecision[]): AIDecision[] {
    return decisions.sort((a, b) => b.priority - a.priority)
  }

  // 팀워크를 고려한 행동 조정
  static adjustForTeamwork(
    decisions: AIDecision[],
    teamworkLevel: number
  ): AIDecision[] {
    if (teamworkLevel > 70) {
      // 높은 팀워크: 서로 다른 행동으로 조합
      const hasHealer = decisions.some(d => d.action === 'heal')
      const hasDebuffer = decisions.some(d => d.action === 'debuff')

      if (!hasHealer && decisions.length > 1) {
        decisions[1].action = 'heal'
      }
      if (!hasDebuffer && decisions.length > 2) {
        decisions[2].action = 'debuff'
      }
    }

    return decisions
  }
}