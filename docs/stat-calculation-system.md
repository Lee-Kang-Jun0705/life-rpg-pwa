# 스탯 계산 시스템

## 개요
Life RPG PWA의 스탯 계산 시스템은 레벨 기반으로 캐릭터의 모든 전투 능력치를 계산합니다. 모든 스탯 계산은 `stat-calculator.ts`에서 중앙 관리됩니다.

## 스탯 계산 공식

### 기본 스탯

#### HP (체력)
```typescript
hp = 100 + (level × 50)
```
- 레벨 1: 150 HP
- 레벨 10: 600 HP
- 레벨 50: 2,600 HP

#### MP (마나)
```typescript
mp = 50 + (level × 10)
```
- 레벨 1: 60 MP
- 레벨 10: 150 MP
- 레벨 50: 550 MP

#### 공격력 (Attack)
```typescript
attack = 10 + (level × 3)
```
- 레벨 1: 13
- 레벨 10: 40
- 레벨 50: 160

#### 방어력 (Defense)
```typescript
defense = 5 + (level × 2)
```
- 레벨 1: 7
- 레벨 10: 25
- 레벨 50: 105

#### 속도 (Speed)
```typescript
speed = 10 + level
```
- 레벨 1: 11
- 레벨 10: 20
- 레벨 50: 60

### 보조 스탯

#### 치명타율 (Critical Rate)
```typescript
critRate = 5% + floor(level / 2) × 1%
```
- 레벨 1: 5%
- 레벨 10: 10%
- 레벨 50: 30%

#### 치명타 데미지 (Critical Damage)
```typescript
critDamage = 150% + (level × 2%)
```
- 레벨 1: 152%
- 레벨 10: 170%
- 레벨 50: 250%

#### 회피율 (Dodge)
```typescript
dodge = 5% + floor(level / 3) × 1%
```
- 레벨 1: 5%
- 레벨 10: 8%
- 레벨 50: 21%

#### 명중률 (Accuracy)
```typescript
accuracy = 95% + floor(level / 5) × 1%
```
- 레벨 1: 95%
- 레벨 10: 97%
- 레벨 50: 105%

#### 저항력 (Resistance)
```typescript
resistance = floor(level / 2) × 1%
```
- 레벨 1: 0%
- 레벨 10: 5%
- 레벨 50: 25%

## 경험치 시스템

경험치 요구량은 레벨 구간에 따라 다른 공식을 사용합니다:

### 레벨 1-10 (초보자)
```typescript
requiredExp = 100 × level
```
선형 증가로 초반 진행이 빠름

### 레벨 11-30 (중급자)
```typescript
requiredExp = floor(200 × level × 1.1^(level-10))
```
지수적 증가 시작

### 레벨 31-50 (상급자)
```typescript
requiredExp = floor(500 × level × 1.2^(level-30))
```
더 가파른 증가

### 레벨 51+ (마스터)
```typescript
requiredExp = floor(1000 × level × 1.3^(level-50))
```
최고 난이도 구간

## 전투력 계산

전투력은 모든 스탯의 가중치 합으로 계산됩니다:

```typescript
combatPower = Σ(stat × weight)
```

### 가중치 테이블
- HP: 0.3
- MP: 0.2
- 공격력: 2.0
- 방어력: 1.5
- 속도: 1.2
- 치명타율: 50
- 치명타 데미지: 30
- 회피율: 15
- 명중률: 10
- 저항력: 20

## 시스템 통합

### Character Service 연동
`character.service.ts`는 `stat-calculator.ts`의 함수를 사용하여:
- 최대 HP/MP 계산
- 레벨업 시 스탯 재계산
- 치유 시 최대값 제한

### Dungeon Combat Service 연동
`dungeon-combat.service.ts`는 스탯 계산기를 통해:
- 플레이어 전투 스탯 설정
- 레벨 기반 능력치 적용
- 전투력 계산

### Dashboard 연동
대시보드 컴포넌트들은 스탯 계산기를 사용하여:
- 레벨업 필요 경험치 표시
- 현재 스탯 표시
- 전투력 계산 및 표시

## 주의사항

1. **일관성**: 모든 스탯 계산은 반드시 `stat-calculator.ts`를 통해야 함
2. **하드코딩 금지**: 스탯 값을 직접 입력하지 말고 함수 사용
3. **레벨 범위**: 레벨은 1-100 범위로 제한
4. **정수 처리**: 경험치와 전투력은 정수로 반올림

## 향후 개선사항

1. 장비 시스템 추가 시 스탯 보너스 계산
2. 버프/디버프 시스템 통합
3. 스탯 성장률 커스터마이징
4. 클래스별 스탯 가중치 차별화