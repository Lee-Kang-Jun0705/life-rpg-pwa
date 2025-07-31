// Equipment 페이지 데이터 프리로드
import { dbHelpers } from '@/lib/database/client'

export async function preloadEquipmentData(userId: string) {
  if (!userId || typeof window === 'undefined') return

  try {
    // 이미 캐시가 있으면 스킵
    const cached = sessionStorage.getItem(`equipment-${userId}`)
    if (cached) return

    // 백그라운드에서 데이터 프리로드
    Promise.all([
      dbHelpers.getProfile(userId),
      dbHelpers.getPlayerData('inventory'),
      dbHelpers.getPlayerData('equippedItems')
    ]).then(([profileData, inventoryData, equippedData]) => {
      // 인벤토리 아이템 처리
      let items: any[] = []
      if (inventoryData?.data && typeof inventoryData.data === 'object' && 'items' in inventoryData.data) {
        items = (inventoryData.data as any).items || []
      }

      // 장착 아이템 처리
      const equipped: any = {}
      if (equippedData?.data && typeof equippedData.data === 'object') {
        const equipData = equippedData.data as any
        if (equipData.weapon) {
          equipped.weapon = items.find((item: any) => item.id === equipData.weapon)
        }
        if (equipData.armor) {
          equipped.armor = items.find((item: any) => item.id === equipData.armor)
        }
        if (equipData.accessory) {
          equipped.accessory = items.find((item: any) => item.id === equipData.accessory)
        }
      }

      // 캐시 저장
      sessionStorage.setItem(`equipment-${userId}`, JSON.stringify({
        profile: profileData,
        inventory: items,
        equipped,
        timestamp: Date.now()
      }))

      console.log('✅ Equipment data preloaded')
    }).catch(error => {
      console.warn('Equipment preload failed:', error)
    })
  } catch (error) {
    console.warn('Equipment preload error:', error)
  }
}