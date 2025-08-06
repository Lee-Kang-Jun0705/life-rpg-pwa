import { FeatureFlagConfig } from './types'

/**
 * Feature Flag 설정
 * 리팩토링을 위한 점진적 배포 플래그들
 */
export const featureFlagConfig: FeatureFlagConfig = {
  flags: {
    // UI 리팩토링 플래그들
    'use-new-dungeon-ui': {
      key: 'use-new-dungeon-ui',
      name: '새로운 던전 UI',
      description: 'DungeonBattleTab 컴포넌트 분리 버전 사용',
      defaultValue: false,
      rolloutPercentage: 0,
      enabledEnvironments: ['development'],
      dependencies: []
    },
    
    'use-optimized-dashboard': {
      key: 'use-optimized-dashboard',
      name: '최적화된 대시보드',
      description: '성능 최적화된 대시보드 컴포넌트 사용',
      defaultValue: false,
      rolloutPercentage: 0,
      enabledEnvironments: ['development']
    },
    
    'use-improved-state-management': {
      key: 'use-improved-state-management',
      name: '개선된 상태 관리',
      description: 'React Query 기반 상태 관리 사용',
      defaultValue: false,
      rolloutPercentage: 0,
      enabledEnvironments: ['development']
    },
    
    // 기능 개선 플래그들
    'enable-error-boundary': {
      key: 'enable-error-boundary',
      name: '에러 바운더리 활성화',
      description: '향상된 에러 처리 및 복구 기능',
      defaultValue: true,
      rolloutPercentage: 100,
      enabledEnvironments: ['development', 'staging', 'production']
    },
    
    'enable-performance-monitoring': {
      key: 'enable-performance-monitoring',
      name: '성능 모니터링',
      description: '실시간 성능 추적 및 리포팅',
      defaultValue: false,
      rolloutPercentage: 10,
      enabledEnvironments: ['production']
    },
    
    'enable-visual-regression-check': {
      key: 'enable-visual-regression-check',
      name: '시각적 회귀 체크',
      description: '리팩토링 시 UI 변경 감지',
      defaultValue: true,
      enabledEnvironments: ['development', 'staging']
    },
    
    // 실험적 기능들
    'enable-auto-save': {
      key: 'enable-auto-save',
      name: '자동 저장',
      description: '주기적으로 게임 상태 자동 저장',
      defaultValue: true,
      rolloutPercentage: 100
    },
    
    'enable-debug-mode': {
      key: 'enable-debug-mode',
      name: '디버그 모드',
      description: '개발자 도구 및 상세 로깅',
      defaultValue: false,
      enabledEnvironments: ['development'],
      enabledForUsers: ['dev-team']
    }
  },
  
  experiments: {
    'dungeon-ui-ab-test': {
      variants: [
        {
          name: 'control',
          percentage: 50,
          flagOverrides: {
            'use-new-dungeon-ui': false
          }
        },
        {
          name: 'treatment',
          percentage: 50,
          flagOverrides: {
            'use-new-dungeon-ui': true
          }
        }
      ]
    }
  }
}

// 환경 변수로 오버라이드 가능
export function getFeatureFlagOverrides(): Record<string, boolean> {
  const overrides: Record<string, boolean> = {}
  
  // NEXT_PUBLIC_FF_ 로 시작하는 환경 변수를 읽어서 오버라이드
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_FF_')) {
      const flagKey = key
        .replace('NEXT_PUBLIC_FF_', '')
        .toLowerCase()
        .replace(/_/g, '-')
      
      overrides[flagKey] = process.env[key] === 'true'
    }
  })
  
  return overrides
}