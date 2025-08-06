'use client'

import { PokemonAutoBattleUI } from '@/components/dungeon/PokemonAutoBattleUI'
import type { BattleState } from '@/lib/jrpg/battle-manager'
import type { JRPGBattleManager } from '@/lib/jrpg/battle-manager'
import type { AutoBattleManager } from '@/lib/jrpg/auto-battle-manager'

interface BattleScreenProps {
  battleState: BattleState
  battleManager: JRPGBattleManager | null
  autoBattleManager: AutoBattleManager | null
  onExit: () => void
}

export function BattleScreen({
  battleState,
  battleManager,
  autoBattleManager,
  onExit
}: BattleScreenProps) {
  return (
    <PokemonAutoBattleUI
      battleState={battleState}
      onExit={onExit}
      battleManager={battleManager}
      autoBattleManager={autoBattleManager}
      damageEvents={battleState.damageEvents}
      skillEvents={battleState.skillEvents}
    />
  )
}