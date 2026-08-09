import type {
  CharacterDamageTrack,
} from '../domain/damage-track-rules.ts'

import type {
  CharacterHumanityState,
} from '../domain/humanity-state-rules.ts'

import type {
  CharacterSheetLifecycleStatus,
} from './character-sheet-model.types.ts'

export interface CharacterOperationalDamageState {
  health: CharacterDamageTrack
  willpower: CharacterDamageTrack
}

export interface CharacterOperationalStateSnapshot {
  characterId: string
  revision: number
  status: CharacterSheetLifecycleStatus
  hunger: number
  damage: CharacterOperationalDamageState
  humanity: CharacterHumanityState
}

export interface CharacterOperationalStateUpdate {
  damage?: CharacterOperationalDamageState
  humanityValue?: number
  humanityStains?: number
  hunger?: number
}
