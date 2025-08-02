import { BossData, BossState, BossPhase, BossPattern, BossBattleResult, ActiveMechanic } from '../types/boss-system';
import { Character } from '../types/character.types';
import { calculateElementalDamage } from '../types/element-system';
import { getAIAction } from '../types/monster-ai';

export class BossBattleService {
  private bossState: BossState;
  private playerCharacter: Character;
  private battleLog: string[] = [];
  
  constructor(boss: BossData, player: Character) {
    this.bossState = {
      boss: { ...boss },
      turnCount: 0,
      phaseHistory: [1],
      usedPatterns: [],
      activeMechanics: [],
      summonedMinions: []
    };
    this.playerCharacter = player;
  }
  
  // 보스 턴 처리
  processBossTurn(): { damage: number; message: string; effects?: any[] } {
    this.bossState.turnCount++;
    
    // 페이즈 체크
    this.checkPhaseTransition();
    
    // 활성 메커니즘 처리
    this.processActiveMechanics();
    
    // 특수 메커니즘 트리거 체크
    this.checkMechanicTriggers();
    
    // 보스 행동 결정
    const action = this.decideBossAction();
    
    // 행동 실행
    return this.executeBossAction(action);
  }
  
  // 페이즈 전환 체크
  private checkPhaseTransition(): void {
    const boss = this.bossState.boss;
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    const currentPhase = boss.phases.find(p => p.phaseNumber === boss.currentPhase);
    const nextPhase = boss.phases.find(p => p.phaseNumber === boss.currentPhase + 1);
    
    if (nextPhase && hpPercent <= nextPhase.hpThreshold) {
      boss.currentPhase = nextPhase.phaseNumber;
      this.bossState.phaseHistory.push(nextPhase.phaseNumber);
      
      // 페이즈 전환 효과
      this.battleLog.push(`💀 ${boss.name}가 ${nextPhase.name} 페이즈로 진입했다!`);
      this.battleLog.push(`📜 ${nextPhase.description}`);
      
      // 페이즈 전환 시 패턴 쿨다운 초기화
      boss.patterns.forEach(pattern => {
        pattern.currentCooldown = 0;
      });
    }
  }
  
  // 활성 메커니즘 처리
  private processActiveMechanics(): void {
    this.bossState.activeMechanics = this.bossState.activeMechanics
      .map(mechanic => ({
        ...mechanic,
        remainingDuration: mechanic.remainingDuration - 1
      }))
      .filter(mechanic => mechanic.remainingDuration > 0);
  }
  
  // 특수 메커니즘 트리거 체크
  private checkMechanicTriggers(): void {
    const currentPhase = this.bossState.boss.phases.find(
      p => p.phaseNumber === this.bossState.boss.currentPhase
    );
    
    if (!currentPhase?.specialMechanics) return;
    
    currentPhase.specialMechanics.forEach(mechanic => {
      let shouldTrigger = false;
      
      switch (mechanic.triggerCondition) {
        case 'turnCount':
          shouldTrigger = this.bossState.turnCount % (mechanic.triggerValue || 1) === 0;
          break;
        case 'hpThreshold':
          const hpPercent = (this.bossState.boss.hp / this.bossState.boss.maxHp) * 100;
          shouldTrigger = hpPercent <= (mechanic.triggerValue || 0);
          break;
        case 'random':
          shouldTrigger = Math.random() * 100 < (mechanic.triggerValue || 10);
          break;
      }
      
      if (shouldTrigger && !this.isActiveMechanic(mechanic.id)) {
        this.activateMechanic(mechanic);
      }
    });
  }
  
  // 메커니즘 활성화 여부 확인
  private isActiveMechanic(mechanicId: string): boolean {
    return this.bossState.activeMechanics.some(m => m.mechanicId === mechanicId);
  }
  
  // 메커니즘 활성화
  private activateMechanic(mechanic: any): void {
    this.battleLog.push(`⚡ ${mechanic.name} 발동!`);
    
    // 메커니즘 효과 적용은 executeBossAction에서 처리
    if (mechanic.effect.duration) {
      this.bossState.activeMechanics.push({
        mechanicId: mechanic.id,
        remainingDuration: mechanic.effect.duration,
        stacks: 1
      });
    }
  }
  
  // 보스 행동 결정
  private decideBossAction(): BossPattern | 'basic' {
    const boss = this.bossState.boss;
    const currentPhase = boss.phases.find(p => p.phaseNumber === boss.currentPhase);
    
    // 사용 가능한 패턴 필터링
    const availablePatterns = boss.patterns.filter(pattern => {
      // 쿨다운 체크
      if (pattern.currentCooldown > 0) return false;
      
      // 충전 상태면 강력한 공격 우선
      const hasCharge = this.bossState.activeMechanics.some(
        m => m.mechanicId === 'charge_up'
      );
      if (hasCharge && pattern.damageMultiplier <= 1.0) return false;
      
      return true;
    });
    
    // AI 패턴에 따른 행동 선택
    if (availablePatterns.length > 0 && currentPhase) {
      const aiAction = getAIAction(
        currentPhase.aiPattern,
        boss.hp,
        boss.maxHp,
        this.playerCharacter.stats.hp,
        this.playerCharacter.stats.maxHp
      );
      
      // AI 행동에 맞는 패턴 선택
      let selectedPattern: BossPattern | null = null;
      
      switch (aiAction) {
        case 'attack':
        case 'special':
          selectedPattern = availablePatterns
            .filter(p => p.damageMultiplier > 0)
            .sort((a, b) => b.damageMultiplier - a.damageMultiplier)[0];
          break;
        case 'defend':
          selectedPattern = availablePatterns.find(p => 
            p.animation === 'shield' || p.name.includes('방어')
          ) || null;
          break;
        case 'heal':
          selectedPattern = availablePatterns.find(p => 
            p.damageMultiplier < 0 || p.name.includes('치유')
          ) || null;
          break;
        case 'buff':
          selectedPattern = availablePatterns.find(p => 
            p.animation === 'charge' || p.name.includes('충전')
          ) || null;
          break;
      }
      
      if (selectedPattern) {
        selectedPattern.currentCooldown = selectedPattern.cooldown;
        this.bossState.usedPatterns.push(selectedPattern.id);
        return selectedPattern;
      }
    }
    
    return 'basic';
  }
  
  // 보스 행동 실행
  private executeBossAction(action: BossPattern | 'basic'): { damage: number; message: string; effects?: any[] } {
    const boss = this.bossState.boss;
    const currentPhase = boss.phases.find(p => p.phaseNumber === boss.currentPhase)!;
    const effects: any[] = [];
    
    if (action === 'basic') {
      // 기본 공격
      let damage = Math.floor(boss.attack * currentPhase.damageMultiplier);
      
      // 속성 상성 계산
      if (this.playerCharacter.element) {
        damage = calculateElementalDamage(damage, boss.element, this.playerCharacter.element);
      }
      
      return {
        damage,
        message: `${boss.name}의 공격!`,
        effects
      };
    } else {
      // 패턴 공격
      const pattern = action as BossPattern;
      let totalDamage = 0;
      let message = `💥 ${boss.name}의 ${pattern.name}!`;
      
      if (pattern.damageMultiplier > 0) {
        // 데미지 계산
        const baseDamage = Math.floor(boss.attack * pattern.damageMultiplier * currentPhase.damageMultiplier);
        const hitCount = pattern.hitCount || 1;
        
        for (let i = 0; i < hitCount; i++) {
          let damage = baseDamage;
          if (pattern.element && this.playerCharacter.element) {
            damage = calculateElementalDamage(damage, pattern.element, this.playerCharacter.element);
          }
          totalDamage += damage;
        }
        
        if (hitCount > 1) {
          message += ` ${hitCount}회 연속 공격!`;
        }
        
        // 상태이상 효과
        if (pattern.statusEffect) {
          effects.push({
            type: 'status',
            status: pattern.statusEffect,
            chance: 30
          });
        }
      } else if (pattern.damageMultiplier < 0) {
        // 회복
        const healAmount = Math.floor(boss.maxHp * Math.abs(pattern.damageMultiplier));
        boss.hp = Math.min(boss.hp + healAmount, boss.maxHp);
        message += ` HP를 ${healAmount} 회복했다!`;
      } else {
        // 버프/특수 효과
        if (pattern.animation === 'shield') {
          effects.push({
            type: 'buff',
            buff: 'defense_up',
            value: 50,
            duration: 3
          });
          message += ' 방어력이 크게 상승했다!';
        } else if (pattern.animation === 'charge') {
          effects.push({
            type: 'buff',
            buff: 'charge',
            value: 100,
            duration: 1
          });
          message += ' 다음 공격이 강화된다!';
        }
      }
      
      return {
        damage: totalDamage,
        message,
        effects
      };
    }
  }
  
  // 플레이어 공격 처리
  processPlayerAttack(damage: number, element?: string): { 
    damage: number; 
    message: string; 
    phaseChanged: boolean 
  } {
    const boss = this.bossState.boss;
    const previousPhase = boss.currentPhase;
    
    // 속성 상성 계산
    let finalDamage = damage;
    if (element) {
      finalDamage = calculateElementalDamage(damage, element, boss.element);
    }
    
    // 방어력 적용
    const currentPhase = boss.phases.find(p => p.phaseNumber === boss.currentPhase)!;
    const defense = boss.defense * currentPhase.defenseMultiplier;
    finalDamage = Math.max(1, Math.floor(finalDamage * (100 / (100 + defense))));
    
    // 데미지 적용
    boss.hp = Math.max(0, boss.hp - finalDamage);
    
    // 페이즈 체크
    this.checkPhaseTransition();
    
    return {
      damage: finalDamage,
      message: `${finalDamage}의 데미지!`,
      phaseChanged: boss.currentPhase !== previousPhase
    };
  }
  
  // 전투 종료 체크
  isBattleOver(): boolean {
    return this.bossState.boss.hp <= 0 || this.playerCharacter.stats.hp <= 0;
  }
  
  // 전투 결과 생성
  getBattleResult(playerWon: boolean): BossBattleResult {
    const boss = this.bossState.boss;
    const result: BossBattleResult = {
      victory: playerWon,
      turnCount: this.bossState.turnCount,
      damageDealt: boss.maxHp - boss.hp,
      damageTaken: this.playerCharacter.stats.maxHp - this.playerCharacter.stats.hp,
      phasesCompleted: this.bossState.phaseHistory.length
    };
    
    if (playerWon) {
      // 보상 계산
      const rewards = this.calculateRewards();
      result.rewards = rewards;
      
      // 첫 클리어 체크 (실제 구현에서는 저장된 데이터 확인)
      const isFirstClear = !localStorage.getItem(`boss_cleared_${boss.id}`);
      if (isFirstClear) {
        result.firstClear = true;
        localStorage.setItem(`boss_cleared_${boss.id}`, 'true');
        
        if (boss.rewards.firstClearBonus) {
          result.achievements = [boss.rewards.firstClearBonus.achievement || ''];
        }
      }
    }
    
    return result;
  }
  
  // 보상 계산
  private calculateRewards(): any {
    const boss = this.bossState.boss;
    const goldAmount = Math.floor(
      boss.rewards.gold.min + 
      Math.random() * (boss.rewards.gold.max - boss.rewards.gold.min)
    );
    
    const items: Array<{ itemId: string; quantity: number }> = [];
    
    // 일반 아이템 드롭
    boss.rewards.items.forEach(item => {
      if (Math.random() * 100 < item.dropRate) {
        const quantity = Math.floor(
          item.minQuantity + 
          Math.random() * (item.maxQuantity - item.minQuantity + 1)
        );
        items.push({ itemId: item.itemId, quantity });
      }
    });
    
    // 첫 클리어 보너스
    const isFirstClear = !localStorage.getItem(`boss_cleared_${boss.id}`);
    if (isFirstClear && boss.rewards.firstClearBonus) {
      boss.rewards.firstClearBonus.items.forEach(item => {
        if (Math.random() * 100 < item.dropRate) {
          items.push({ 
            itemId: item.itemId, 
            quantity: item.minQuantity 
          });
        }
      });
    }
    
    return {
      gold: goldAmount,
      items,
      exp: boss.rewards.exp
    };
  }
  
  // 보스 상태 가져오기
  getBossState(): BossState {
    return this.bossState;
  }
  
  // 전투 로그 가져오기
  getBattleLog(): string[] {
    return this.battleLog;
  }
  
  // 패턴 쿨다운 감소
  reduceCooldowns(): void {
    this.bossState.boss.patterns.forEach(pattern => {
      if (pattern.currentCooldown > 0) {
        pattern.currentCooldown--;
      }
    });
  }
}