import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ShopPage from '../page'
import { useShop } from '@/lib/shop/shop-context'

// Mock dependencies
jest.mock('@/lib/shop/shop-context')

const mockUseShop = useShop as jest.MockedFunction<typeof useShop>

describe('ShopPage', () => {
  const mockShopItems = [
    {
      id: 'item1',
      name: '철검',
      description: '기본적인 철로 만든 검',
      category: 'weapon' as const,
      rarity: 'common' as const,
      price: 100,
      icon: '⚔️',
      stats: { attack: 10 },
      requirements: { level: 1 },
      effects: [],
      stackable: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'item2',
      name: '가죽 갑옷',
      description: '가벼운 가죽 갑옷',
      category: 'armor' as const,
      rarity: 'common' as const,
      price: 150,
      icon: '🛡️',
      stats: { defense: 5 },
      requirements: { level: 1 },
      effects: [],
      stackable: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'item3',
      name: '체력 포션',
      description: '체력을 50 회복합니다',
      category: 'consumable' as const,
      rarity: 'common' as const,
      price: 50,
      icon: '🧪',
      stats: {},
      requirements: {},
      effects: [{ type: 'heal' as const, value: 50, description: '체력 50 회복' }],
      stackable: true,
      maxStack: 99,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const mockInventory = [
    {
      ...mockShopItems[0],
      inventoryId: 'inv1',
      ownerId: 'user1',
      quantity: 1,
      equipped: false,
      acquiredAt: new Date()
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseShop.mockReturnValue({
      items: mockShopItems,
      inventory: mockInventory,
      gold: 500,
      purchaseItem: jest.fn(),
      sellItem: jest.fn(),
      equipItem: jest.fn(),
      unequipItem: jest.fn(),
      isLoading: false
    })
  })

  it('should render shop items', () => {
    render(<ShopPage />)

    // Check if items are displayed
    expect(screen.getByText('철검')).toBeInTheDocument()
    expect(screen.getByText('가죽 갑옷')).toBeInTheDocument()
    expect(screen.getByText('체력 포션')).toBeInTheDocument()

    // Check prices
    expect(screen.getByText('100 골드')).toBeInTheDocument()
    expect(screen.getByText('150 골드')).toBeInTheDocument()
    expect(screen.getByText('50 골드')).toBeInTheDocument()

    // Check current gold
    expect(screen.getByText('보유 골드: 500')).toBeInTheDocument()
  })

  it('should filter items by category', () => {
    render(<ShopPage />)

    // Click weapon category
    fireEvent.click(screen.getByText('무기'))

    // Only weapon should be visible
    expect(screen.getByText('철검')).toBeInTheDocument()
    expect(screen.queryByText('가죽 갑옷')).not.toBeInTheDocument()
    expect(screen.queryByText('체력 포션')).not.toBeInTheDocument()

    // Click armor category
    fireEvent.click(screen.getByText('방어구'))

    // Only armor should be visible
    expect(screen.queryByText('철검')).not.toBeInTheDocument()
    expect(screen.getByText('가죽 갑옷')).toBeInTheDocument()
    expect(screen.queryByText('체력 포션')).not.toBeInTheDocument()
  })

  it('should handle item purchase', async() => {
    const mockPurchaseItem = jest.fn().mockResolvedValue({ success: true })
    mockUseShop.mockReturnValue({
      items: mockShopItems,
      inventory: mockInventory,
      gold: 500,
      purchaseItem: mockPurchaseItem,
      sellItem: jest.fn(),
      equipItem: jest.fn(),
      unequipItem: jest.fn(),
      isLoading: false
    })

    render(<ShopPage />)

    // Click purchase button for armor
    const purchaseButtons = screen.getAllByText('구매')
    fireEvent.click(purchaseButtons[1]) // Second item (armor)

    await waitFor(() => {
      expect(mockPurchaseItem).toHaveBeenCalledWith('item2', 1)
    })
  })

  it('should disable purchase button when insufficient gold', () => {
    mockUseShop.mockReturnValue({
      items: mockShopItems,
      inventory: mockInventory,
      gold: 30, // Less than cheapest item (50 gold)
      purchaseItem: jest.fn(),
      sellItem: jest.fn(),
      equipItem: jest.fn(),
      unequipItem: jest.fn(),
      isLoading: false
    })

    render(<ShopPage />)

    const purchaseButtons = screen.getAllByText('구매')
    purchaseButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should show inventory tab', () => {
    render(<ShopPage />)

    // Switch to inventory tab
    fireEvent.click(screen.getByText('인벤토리'))

    // Check if inventory items are displayed
    expect(screen.getByText('철검')).toBeInTheDocument()
    expect(screen.getByText('수량: 1')).toBeInTheDocument()
    expect(screen.getByText('장착하기')).toBeInTheDocument()
  })

  it('should handle item equip/unequip', async() => {
    const mockEquipItem = jest.fn()
    const mockUnequipItem = jest.fn()

    mockUseShop.mockReturnValue({
      items: mockShopItems,
      inventory: mockInventory,
      gold: 500,
      purchaseItem: jest.fn(),
      sellItem: jest.fn(),
      equipItem: mockEquipItem,
      unequipItem: mockUnequipItem,
      isLoading: false
    })

    render(<ShopPage />)

    // Switch to inventory
    fireEvent.click(screen.getByText('인벤토리'))

    // Click equip button
    fireEvent.click(screen.getByText('장착하기'))

    await waitFor(() => {
      expect(mockEquipItem).toHaveBeenCalledWith('inv1')
    })
  })

  it('should display item details on hover', () => {
    render(<ShopPage />)

    const itemCard = screen.getByText('철검').closest('div')

    if (itemCard) {
      fireEvent.mouseEnter(itemCard)

      // Check if stats are displayed
      expect(screen.getByText('공격력: +10')).toBeInTheDocument()
      expect(screen.getByText('필요 레벨: 1')).toBeInTheDocument()
    }
  })

  it('should show loading state', () => {
    mockUseShop.mockReturnValue({
      items: [],
      inventory: [],
      gold: 0,
      purchaseItem: jest.fn(),
      sellItem: jest.fn(),
      equipItem: jest.fn(),
      unequipItem: jest.fn(),
      isLoading: true
    })

    render(<ShopPage />)

    expect(screen.getByText('상점을 불러오는 중...')).toBeInTheDocument()
  })

  it('should search items by name', () => {
    render(<ShopPage />)

    const searchInput = screen.getByPlaceholderText('아이템 검색...')
    fireEvent.change(searchInput, { target: { value: '포션' } })

    // Only potion should be visible
    expect(screen.queryByText('철검')).not.toBeInTheDocument()
    expect(screen.queryByText('가죽 갑옷')).not.toBeInTheDocument()
    expect(screen.getByText('체력 포션')).toBeInTheDocument()
  })

  it('should sort items by price', () => {
    render(<ShopPage />)

    const sortSelect = screen.getByLabelText('정렬')
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } })

    const items = screen.getAllByTestId('shop-item')
    const prices = items.map(item => {
      const priceText = item.querySelector('[data-testid="item-price"]')?.textContent
      return parseInt(priceText?.replace(/[^0-9]/g, '') || '0')
    })

    // Check if prices are in ascending order
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })
})
