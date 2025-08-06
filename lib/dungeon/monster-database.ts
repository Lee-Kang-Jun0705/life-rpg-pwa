import type { Monster } from '@/lib/types/dungeon'

// 몬스터 이름 목록
const MONSTER_NAMES = {
  common: [
    '슬라임', '고블린', '늑대', '박쥐', '거미',
    '좀비', '스켈레톤', '오크', '트롤', '하피',
    '도깨비', '쥐인간', '독사', '거대 쥐', '날벌레',
    '야생 멧돼지', '그림자 고양이', '썩은 나무인형', '독버섯', '진흙 골렘'
  ],
  elite: [
    '미노타우로스', '오우거', '와이번', '리치', '데스나이트',
    '다크엘프', '뱀파이어', '서큐버스', '가고일', '키메라',
    '나가', '켄타우로스', '듀라한', '메두사', '인어',
    '사이클롭스', '그리폰', '바실리스크', '맨티코어', '워울프'
  ],
  boss: [
    '드래곤', '리치킹', '데몬로드', '크라켄', '베히모스',
    '피닉스', '히드라', '타이탄', '발록', '아크데몬',
    '레비아탄', '바하무트', '이프리트', '실프', '운디네',
    '노움', '펜리르', '요르문간드', '수르트', '헬'
  ],
  legendary: [
    '고대 드래곤', '혼돈의 군주', '심연의 지배자', '시간의 파괴자', '차원의 수호자',
    '죽음의 화신', '운명의 방랑자', '별의 먹는 자', '공허의 관찰자', '영원의 수호자',
    '태초의 거인', '종말의 전령', '꿈의 침식자', '현실의 붕괴자', '무한의 탐식자'
  ]
}

// 몬스터 이모지 매핑
const MONSTER_EMOJIS: Record<string, string> = {
  // Common
  '슬라임': '🟢',
  '고블린': '👺',
  '늑대': '🐺',
  '박쥐': '🦇',
  '거미': '🕷️',
  '좀비': '🧟',
  '스켈레톤': '💀',
  '오크': '🐗',
  '트롤': '👹',
  '하피': '🦅',
  '도깨비': '👻',
  '쥐인간': '🐭',
  '독사': '🐍',
  '거대 쥐': '🐀',
  '날벌레': '🦟',
  '야생 멧돼지': '🐷',
  '그림자 고양이': '🐈‍⬛',
  '썩은 나무인형': '🪵',
  '독버섯': '🍄',
  '진흙 골렘': '🗿',
  // Elite
  '미노타우로스': '🐂',
  '오우거': '👿',
  '와이번': '🦎',
  '리치': '🧙‍♂️',
  '데스나이트': '⚔️',
  '다크엘프': '🧝‍♂️',
  '뱀파이어': '🧛',
  '서큐버스': '😈',
  '가고일': '🗿',
  '키메라': '🦁',
  '나가': '🐍',
  '켄타우로스': '🐴',
  '듀라한': '🎃',
  '메두사': '🐍',
  '인어': '🧜‍♀️',
  '사이클롭스': '👁️',
  '그리폰': '🦅',
  '바실리스크': '🦎',
  '맨티코어': '🦂',
  '워울프': '🐺',
  // Boss
  '드래곤': '🐉',
  '리치킹': '👑',
  '데몬로드': '👹',
  '크라켄': '🐙',
  '베히모스': '🦣',
  '피닉스': '🔥',
  '히드라': '🐍',
  '타이탄': '🗿',
  '발록': '🔥',
  '아크데몬': '😈',
  '레비아탄': '🐋',
  '바하무트': '🐲',
  '이프리트': '🔥',
  '실프': '🌪️',
  '운디네': '💧',
  '노움': '⛰️',
  '펜리르': '🐺',
  '요르문간드': '🐍',
  '수르트': '🔥',
  '헬': '💀',
  // Legendary
  '고대 드래곤': '🐲',
  '혼돈의 군주': '🌀',
  '심연의 지배자': '🌑',
  '시간의 파괴자': '⏳',
  '차원의 수호자': '🌌',
  '죽음의 화신': '⚰️',
  '운명의 방랑자': '🎭',
  '별의 먹는 자': '⭐',
  '공허의 관찰자': '👁️',
  '영원의 수호자': '♾️',
  '태초의 거인': '🏔️',
  '종말의 전령': '☄️',
  '꿈의 침식자': '😴',
  '현실의 붕괴자': '💥',
  '무한의 탐식자': '🕳️'
}

// 몬스터 스탯 계수
const MONSTER_STAT_MULTIPLIERS = {
  common: { health: 0.8, attack: 0.7, defense: 0.6 },
  elite: { health: 1.5, attack: 1.3, defense: 1.2 },
  boss: { health: 3.0, attack: 2.0, defense: 1.8 },
  legendary: { health: 5.0, attack: 3.0, defense: 2.5 }
}

// 보상 계수
const REWARD_MULTIPLIERS = {
  common: { gold: 1.0, itemDrop: 1.0 },
  elite: { gold: 2.5, itemDrop: 1.5 },
  boss: { gold: 5.0, itemDrop: 2.0 },
  legendary: { gold: 10.0, itemDrop: 3.0 }
}

/**
 * 레벨에 따른 몬스터 생성
 */
export function generateMonster(
  level: number,
  tier: 'common' | 'elite' | 'boss' | 'legendary' = 'common'
): Monster {
  // 티어별 이름 선택
  const names = MONSTER_NAMES[tier]
  const name = names[Math.floor(Math.random() * names.length)]
  
  // 기본 스탯 계산
  const multiplier = MONSTER_STAT_MULTIPLIERS[tier]
  const baseHealth = 100 + (level * 30)
  const baseAttack = 20 + (level * 5)
  const baseDefense = 10 + (level * 3)
  
  // 몬스터 스탯
  const health = Math.floor(baseHealth * multiplier.health)
  const attack = Math.floor(baseAttack * multiplier.attack)
  const defense = Math.floor(baseDefense * multiplier.defense)
  
  // 부가 스탯
  const attackSpeed = tier === 'legendary' ? 50 : tier === 'boss' ? 30 : tier === 'elite' ? 20 : 10
  const criticalChance = tier === 'legendary' ? 20 : tier === 'boss' ? 15 : tier === 'elite' ? 10 : 5
  const evasion = tier === 'legendary' ? 15 : tier === 'boss' ? 10 : tier === 'elite' ? 7 : 3
  
  // 보상 계산
  const rewardMultiplier = REWARD_MULTIPLIERS[tier]
  const goldReward = Math.floor((50 + level * 10) * rewardMultiplier.gold)
  const itemDropRate = Math.min(30 * rewardMultiplier.itemDrop, 100)
  
  // 이모지 가져오기
  const emoji = MONSTER_EMOJIS[name] || '👾'
  
  return {
    id: `${tier}-${level}-${Date.now()}`,
    name: `${emoji} ${name} (Lv.${level})`,
    level,
    tier,
    health,
    maxHealth: health,
    attack,
    defense,
    attackSpeed,
    criticalChance,
    evasion,
    goldReward,
    itemDropRate
  }
}

/**
 * 던전별 몬스터 생성 - 난이도 기반
 */
export function generateDungeonMonster(
  dungeonType: 'normal' | 'elite' | 'boss' | 'infinite',
  stage: number,
  playerLevel: number
): Monster {
  // 스테이지가 진행될수록 몬스터 레벨이 상승
  const baseLevel = playerLevel + Math.floor(stage / 5) * 5
  
  switch (dungeonType) {
    case 'normal':
      // 쉬운 난이도 - 주로 common, 가끔 elite
      const normalLevel = baseLevel + Math.floor(Math.random() * 5)
      const normalRandom = Math.random()
      let normalTier: Monster['tier'] = 'common'
      
      if (stage > 20 && normalRandom < 0.1) normalTier = 'elite'
      else if (stage > 10 && normalRandom < 0.2) normalTier = 'elite'
      else if (stage > 5 && normalRandom < 0.3) normalTier = 'elite'
      
      return generateMonster(normalLevel, normalTier)
      
    case 'elite':
      // 보통 난이도 - elite 위주, common과 boss 혼합
      const eliteLevel = baseLevel + Math.floor(Math.random() * 10) + 5
      const eliteRandom = Math.random()
      let eliteTier: Monster['tier'] = 'elite'
      
      if (stage > 30 && eliteRandom < 0.1) eliteTier = 'boss'
      else if (stage > 20 && eliteRandom < 0.2) eliteTier = 'boss'
      else if (eliteRandom < 0.3) eliteTier = 'common'
      
      return generateMonster(eliteLevel, eliteTier)
      
    case 'boss':
      // 어려운 난이도 - boss 위주, 가끔 legendary
      const bossLevel = baseLevel + Math.floor(Math.random() * 15) + 10
      const bossRandom = Math.random()
      let bossTier: Monster['tier'] = 'boss'
      
      if (stage > 40 && bossRandom < 0.15) bossTier = 'legendary'
      else if (stage > 25 && bossRandom < 0.1) bossTier = 'legendary'
      else if (stage > 10 && bossRandom < 0.05) bossTier = 'legendary'
      else if (bossRandom < 0.2) bossTier = 'elite'
      
      return generateMonster(bossLevel, bossTier)
      
    case 'infinite':
      // 무한 모드 - 스테이지에 따라 난이도 증가
      const infiniteLevel = baseLevel + stage
      const tierRandom = Math.random()
      let infiniteTier: Monster['tier'] = 'common'
      
      // 스테이지별 티어 확률
      if (stage > 100) {
        // 100층 이상: legendary 30%, boss 40%, elite 20%, common 10%
        if (tierRandom < 0.3) infiniteTier = 'legendary'
        else if (tierRandom < 0.7) infiniteTier = 'boss'
        else if (tierRandom < 0.9) infiniteTier = 'elite'
      } else if (stage > 50) {
        // 50-100층: legendary 10%, boss 30%, elite 40%, common 20%
        if (tierRandom < 0.1) infiniteTier = 'legendary'
        else if (tierRandom < 0.4) infiniteTier = 'boss'
        else if (tierRandom < 0.8) infiniteTier = 'elite'
      } else if (stage > 25) {
        // 25-50층: boss 20%, elite 50%, common 30%
        if (tierRandom < 0.2) infiniteTier = 'boss'
        else if (tierRandom < 0.7) infiniteTier = 'elite'
      } else if (stage > 10) {
        // 10-25층: elite 40%, common 60%
        if (tierRandom < 0.4) infiniteTier = 'elite'
      }
      // 1-10층: common 100%
      
      return generateMonster(infiniteLevel, infiniteTier)
      
    default:
      return generateMonster(playerLevel, 'common')
  }
}

/**
 * 보스 몬스터 생성 (특별 스탯)
 */
export function generateSpecialBoss(name: string, level: number): Monster {
  const boss = generateMonster(level, 'boss')
  
  // 특별 보스는 더 강력함
  boss.name = name
  boss.maxHealth = boss.health = Math.floor(boss.health * 1.5)
  boss.attack = Math.floor(boss.attack * 1.3)
  boss.defense = Math.floor(boss.defense * 1.2)
  boss.criticalChance = 25
  boss.goldReward = Math.floor(boss.goldReward * 2)
  boss.itemDropRate = 100 // 보스는 항상 아이템 드롭
  
  return boss
}