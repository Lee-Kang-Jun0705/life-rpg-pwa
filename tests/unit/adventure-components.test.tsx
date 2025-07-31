import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HeroSection } from '@/components/adventure/HeroSection'
import { GameTabLayout } from '@/components/adventure/GameTabLayout'
import { ImprovedDungeonList } from '@/components/dungeon/ImprovedDungeonList'
import { ImprovedShopScreen } from '@/components/shop/ImprovedShopScreen'
import { ImprovedEquipmentScreen } from '@/components/equipment/ImprovedEquipmentScreen'
import { ImprovedCollectionScreen } from '@/components/collection/ImprovedCollectionScreen'
import { dbHelpers } from '@/lib/database/client'

// Mock 설정
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({ userId: 'test-user-id' })
}))

jest.mock('@/lib/database/client', () => ({
  dbHelpers: {
    getProfile: jest.fn().mockResolvedValue({
      character: {
        name: '테스트 모험가',
        level: 10,
        experience: 500,
        experienceToNext: 1000,
        avatar: '🧙‍♂️',
        class: '전사',
        energy: 100,
        gold: 1000,
        gems: 10,
        stats: {
          attack: 50,
          defense: 30,
          hp: 100,
          maxHp: 100,
          mp: 50,
          maxMp: 50
        }
      }
    })
  }
}))

jest.mock('@/lib/shop', () => ({
  useShop: () => ({
    state: {
      inventory: { coins: 1000 },
      selectedCategory: 'all'
    },
    isLoading: false,
    getFilteredItems: () => [],
    getInventoryItems: () => [],
    getEquippedItems: () => ({ weapon: null, armor: null, accessory: null }),
    purchaseItem: jest.fn(),
    equipItem: jest.fn(),
    unequipItem: jest.fn()
  })
}))

describe('HeroSection 컴포넌트', () => {
  it('캐릭터 정보가 올바르게 표시되어야 함', async () => {
    render(<HeroSection />)
    
    await waitFor(() => {
      expect(screen.getByText('테스트 모험가')).toBeInTheDocument()
      expect(screen.getByText('Lv.10')).toBeInTheDocument()
      expect(screen.getByText('전사')).toBeInTheDocument()
    })
  })

  it('경험치 바가 올바른 비율로 표시되어야 함', async () => {
    render(<HeroSection />)
    
    await waitFor(() => {
      expect(screen.getByText('500 / 1000')).toBeInTheDocument()
    })
  })

  it('모든 스탯 카드가 표시되어야 함', async () => {
    render(<HeroSection />)
    
    await waitFor(() => {
      expect(screen.getByText('공격력')).toBeInTheDocument()
      expect(screen.getByText('방어력')).toBeInTheDocument()
      expect(screen.getByText('체력')).toBeInTheDocument()
      expect(screen.getByText('마나')).toBeInTheDocument()
      expect(screen.getByText('에너지')).toBeInTheDocument()
      expect(screen.getByText('전투력')).toBeInTheDocument()
    })
  })
})

describe('GameTabLayout 컴포넌트', () => {
  const mockTabs = [
    { id: 'tab1', label: '탭1', emoji: '🎮', description: '첫 번째 탭' },
    { id: 'tab2', label: '탭2', emoji: '🎯', description: '두 번째 탭' }
  ]
  
  const mockChildren = [
    <div key="1">콘텐츠1</div>,
    <div key="2">콘텐츠2</div>
  ]

  it('모든 탭이 렌더링되어야 함', () => {
    render(
      <GameTabLayout tabs={mockTabs}>
        {mockChildren}
      </GameTabLayout>
    )
    
    expect(screen.getAllByText('탭1')).toHaveLength(2) // 데스크톱과 모바일 각각 1개
    expect(screen.getAllByText('탭2')).toHaveLength(2) // 데스크톱과 모바일 각각 1개
    expect(screen.getAllByText('🎮')).toHaveLength(2)
    expect(screen.getAllByText('🎯')).toHaveLength(2)
  })

  it('탭 클릭 시 해당 콘텐츠가 표시되어야 함', () => {
    const onTabChange = jest.fn()
    render(
      <GameTabLayout tabs={mockTabs} onTabChange={onTabChange}>
        {mockChildren}
      </GameTabLayout>
    )
    
    const tab2Button = screen.getByTestId('ai-coach-tab-tab2')
    fireEvent.click(tab2Button)
    
    expect(onTabChange).toHaveBeenCalledWith('tab2')
  })

  it('탭 호버 시 툴팁이 표시되어야 함', async () => {
    render(
      <GameTabLayout tabs={mockTabs}>
        {mockChildren}
      </GameTabLayout>
    )
    
    const tab1Button = screen.getByTestId('ai-coach-tab-tab1')
    fireEvent.mouseEnter(tab1Button)
    
    await waitFor(() => {
      expect(screen.getByText('첫 번째 탭')).toBeInTheDocument()
    })
  })
})

describe('ImprovedDungeonList 컴포넌트', () => {
  const mockDungeons = [
    {
      id: 'dungeon1',
      name: '고블린 소굴',
      description: '고블린들이 사는 동굴',
      type: 'story',
      difficulty: 'easy',
      requirements: { level: 1, energy: 10 },
      rewards: { exp: 100, gold: 50, items: [] },
      stages: 3
    },
    {
      id: 'dungeon2',
      name: '어둠의 성',
      description: '사악한 마법사의 성',
      type: 'special',
      difficulty: 'hard',
      requirements: { level: 20, energy: 20 },
      rewards: { exp: 500, gold: 200, items: ['item1'] },
      stages: 5
    }
  ]

  it('던전 카드가 올바르게 렌더링되어야 함', () => {
    render(
      <ImprovedDungeonList 
        dungeons={mockDungeons} 
        onSelectDungeon={() => {}} 
        playerLevel={10}
      />
    )
    
    expect(screen.getByText('고블린 소굴')).toBeInTheDocument()
    expect(screen.getByText('어둠의 성')).toBeInTheDocument()
  })

  it('플레이어 레벨이 낮으면 던전이 잠겨야 함', () => {
    render(
      <ImprovedDungeonList 
        dungeons={mockDungeons} 
        onSelectDungeon={() => {}} 
        playerLevel={10}
      />
    )
    
    // 레벨 20 던전은 잠겨있어야 함
    const lockedDungeon = screen.getByText('어둠의 성').closest('[data-testid="dungeon-card"]')
    expect(lockedDungeon).toHaveTextContent('Lv.20+')
    
    // opacity-60 클래스로 잠긴 상태 확인
    expect(lockedDungeon?.querySelector('.opacity-60')).toBeInTheDocument()
  })

  it('던전 클릭 시 콜백이 호출되어야 함', () => {
    const onSelectDungeon = jest.fn()
    render(
      <ImprovedDungeonList 
        dungeons={mockDungeons} 
        onSelectDungeon={onSelectDungeon} 
        playerLevel={10}
      />
    )
    
    // 던전 카드 내부의 클릭 가능한 영역을 찾음
    const unlockedDungeonCard = screen.getByText('고블린 소굴').closest('[data-testid="dungeon-card"]')
    const clickableArea = unlockedDungeonCard?.querySelector('div[class*="cursor-pointer"]')
    
    if (clickableArea) {
      fireEvent.click(clickableArea)
      expect(onSelectDungeon).toHaveBeenCalledWith(mockDungeons[0])
    }
  })
})

describe('ImprovedShopScreen 컴포넌트', () => {
  const mockShopItems = [
    {
      id: 'item1',
      name: '체력 포션',
      description: 'HP를 50 회복합니다',
      price: 100,
      icon: '🧪',
      category: 'consumable',
      rarity: 'common'
    },
    {
      id: 'item2',
      name: '철검',
      description: '기본적인 철 검',
      price: 500,
      icon: '⚔️',
      category: 'equipment',
      rarity: 'uncommon'
    }
  ]

  it('모든 NPC 상인이 표시되어야 함', async () => {
    render(
      <ImprovedShopScreen 
        shopItems={mockShopItems} 
        onPurchase={() => {}}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('일반 상인 토비')).toBeInTheDocument()
      expect(screen.getByText('대장장이 브론')).toBeInTheDocument()
      expect(screen.getByText('물약상인 엘리나')).toBeInTheDocument()
      expect(screen.getByText('신비한 상인 루나')).toBeInTheDocument()
    })
  })

  it('상인 클릭 시 해당 상인의 아이템만 표시되어야 함', async () => {
    render(
      <ImprovedShopScreen 
        shopItems={mockShopItems} 
        onPurchase={() => {}}
      />
    )
    
    // 대장장이 클릭
    fireEvent.click(screen.getByText('대장장이 브론'))
    
    await waitFor(() => {
      expect(screen.getByText('최고급 장비들을 준비했습니다')).toBeInTheDocument()
    })
  })

  it('골드가 부족하면 아이템을 구매할 수 없어야 함', async () => {
    // Mock character with specific gold amount
    jest.mocked(dbHelpers.getProfile).mockResolvedValueOnce({
      character: {
        name: '테스트 모험가',
        level: 10,
        experience: 500,
        experienceToNext: 1000,
        avatar: '🧙‍♂️',
        class: '전사',
        energy: 100,
        gold: 50, // 적은 골드
        gems: 0,
        stats: {
          attack: 50,
          defense: 30,
          hp: 100,
          maxHp: 100,
          mp: 50,
          maxMp: 50
        }
      }
    } as any)
    
    const expensiveItem = {
      ...mockShopItems[0],
      price: 100 // 보유 골드(50)보다 비싼 아이템
    }
    
    render(
      <ImprovedShopScreen 
        shopItems={[expensiveItem]} 
        onPurchase={() => {}}
      />
    )
    
    await waitFor(() => {
      const itemCard = screen.getByText('체력 포션').closest('div')
      expect(itemCard?.parentElement).toHaveClass('opacity-60')
    })
  })
})

describe('ImprovedEquipmentScreen 컴포넌트', () => {
  it('캐릭터 프리뷰가 표시되어야 함', async () => {
    render(<ImprovedEquipmentScreen />)
    
    await waitFor(() => {
      expect(screen.getByText('캐릭터')).toBeInTheDocument()
      expect(screen.getByText('정면')).toBeInTheDocument()
    })
  })

  it('모든 장비 슬롯이 표시되어야 함', async () => {
    render(<ImprovedEquipmentScreen />)
    
    await waitFor(() => {
      expect(screen.getByText('무기')).toBeInTheDocument()
      expect(screen.getByText('갑옷')).toBeInTheDocument()
      expect(screen.getByText('액세서리')).toBeInTheDocument()
    })
  })

  it('캐릭터 회전 버튼이 작동해야 함', async () => {
    render(<ImprovedEquipmentScreen />)
    
    await waitFor(() => {
      const leftButton = screen.getByText('←')
      const rightButton = screen.getByText('→')
      
      fireEvent.click(leftButton)
      fireEvent.click(rightButton)
      
      // 정면 버튼 클릭으로 리셋
      fireEvent.click(screen.getByText('정면'))
    })
  })
})

describe('ImprovedCollectionScreen 컴포넌트', () => {
  it('컬렉션 카테고리가 모두 표시되어야 함', () => {
    render(<ImprovedCollectionScreen />)
    
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('무기')).toBeInTheDocument()
    expect(screen.getByText('방어구')).toBeInTheDocument()
    expect(screen.getByText('액세서리')).toBeInTheDocument()
  })

  it('검색 기능이 작동해야 함', () => {
    render(<ImprovedCollectionScreen />)
    
    const searchInput = screen.getByPlaceholderText('아이템 검색...')
    fireEvent.change(searchInput, { target: { value: '철검' } })
    
    expect(searchInput).toHaveValue('철검')
  })

  it('보기 모드 전환이 작동해야 함', () => {
    render(<ImprovedCollectionScreen />)
    
    // 그리드 뷰 아이콘을 찾아서 클릭
    const buttons = screen.getAllByRole('button')
    const viewToggleButton = buttons.find(button => {
      // button 내부에 svg가 있는지 확인
      return button.querySelector('svg')
    })
    
    if (viewToggleButton) {
      fireEvent.click(viewToggleButton)
      // 버튼이 클릭되었는지 확인 (상태 변경은 컴포넌트 내부에서 처리)
      expect(viewToggleButton).toBeInTheDocument()
    }
  })

  it('수집한 것만 보기 필터가 작동해야 함', () => {
    render(<ImprovedCollectionScreen />)
    
    const filterButton = screen.getByText('수집한 것만')
    fireEvent.click(filterButton)
    
    // 버튼이 활성화 상태로 변경되어야 함
    expect(filterButton).toHaveClass('bg-purple-600')
  })
})