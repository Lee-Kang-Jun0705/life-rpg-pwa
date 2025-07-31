import React from 'react'
import { render, act, renderHook } from '@testing-library/react'
import { ShopProvider, useShop } from '../shop-context'
import { ShopItem } from '../types'

// Wrapper 컴포넌트
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ShopProvider>{children}</ShopProvider>
)

describe('Shop Context', () => {
  beforeEach(() => {
    // localStorage 초기화
    jest.clearAllMocks()
  })

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    expect(result.current.state.inventory.coins).toBe(100)
    expect(result.current.state.inventory.items).toEqual([])
    expect(result.current.state.selectedCategory).toBe('all')
  })

  it('아이템을 구매할 수 있어야 함', async () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    const testItem: ShopItem = {
      id: 'test-item',
      name: '테스트 아이템',
      description: '테스트용 아이템',
      category: 'weapon',
      rarity: 'common',
      price: 50,
      icon: '⚔️',
      isEquippable: true
    }

    let success = false
    await act(async () => {
      success = await result.current.purchaseItem(testItem)
    })

    expect(success).toBe(true)
    expect(result.current.state.inventory.coins).toBe(50)
    expect(result.current.state.inventory.items).toHaveLength(1)
    expect(result.current.state.inventory.items[0].id).toBe('test-item')
  })

  it('코인이 부족하면 구매할 수 없어야 함', async () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    const expensiveItem: ShopItem = {
      id: 'expensive-item',
      name: '비싼 아이템',
      description: '매우 비싼 아이템',
      category: 'weapon',
      rarity: 'legendary',
      price: 1000,
      icon: '💎',
      isEquippable: true
    }

    let success = false
    await act(async () => {
      success = await result.current.purchaseItem(expensiveItem)
    })

    expect(success).toBe(false)
    expect(result.current.state.inventory.coins).toBe(100)
    expect(result.current.state.inventory.items).toHaveLength(0)
  })

  it('아이템을 장착/해제할 수 있어야 함', async () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    const weapon: ShopItem = {
      id: 'sword',
      name: '검',
      description: '기본 검',
      category: 'weapon',
      rarity: 'common',
      price: 50,
      icon: '⚔️',
      isEquippable: true
    }

    // 구매
    await act(async () => {
      await result.current.purchaseItem(weapon)
    })

    // 장착
    let equipped = false
    await act(async () => {
      equipped = await result.current.equipItem('sword')
    })

    expect(equipped).toBe(true)
    expect(result.current.state.inventory.equippedItems.weapon).toBe('sword')
    expect(result.current.state.inventory.items[0].isEquipped).toBe(true)

    // 장착 해제
    let unequipped = false
    await act(async () => {
      unequipped = await result.current.unequipItem('sword')
    })

    expect(unequipped).toBe(true)
    expect(result.current.state.inventory.equippedItems.weapon).toBeUndefined()
    expect(result.current.state.inventory.items[0].isEquipped).toBe(false)
  })

  it('카테고리별 필터링이 작동해야 함', () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    // 전체 아이템
    let filteredItems = result.current.getFilteredItems()
    expect(filteredItems.length).toBeGreaterThan(0)

    // 무기 카테고리만
    act(() => {
      result.current.setSelectedCategory('weapon')
    })
    
    filteredItems = result.current.getFilteredItems()
    expect(filteredItems.every(item => item.category === 'weapon')).toBe(true)
  })

  it('소비 아이템을 사용할 수 있어야 함', async () => {
    const { result } = renderHook(() => useShop(), { wrapper })
    
    const potion: ShopItem = {
      id: 'health-potion',
      name: '체력 포션',
      description: '체력 회복',
      category: 'consumable',
      rarity: 'common',
      price: 20,
      icon: '🧪',
      isEquippable: false,
      maxStack: 10
    }

    // 포션 3개 구매
    await act(async () => {
      await result.current.purchaseItem(potion, 3)
    })

    expect(result.current.state.inventory.items[0].quantity).toBe(3)

    // 포션 1개 사용
    let used = false
    await act(async () => {
      used = await result.current.useConsumableItem('health-potion')
    })

    expect(used).toBe(true)
    expect(result.current.state.inventory.items[0].quantity).toBe(2)
  })
})